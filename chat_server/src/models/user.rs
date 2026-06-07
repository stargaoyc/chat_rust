use std::mem;

use argon2::{
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
    password_hash::{SaltString, rand_core::OsRng},
};
use sqlx::PgPool;

use crate::{AppError, User};

impl User {
    // 查找用户
    pub async fn find_by_email(email: &str, pool: &PgPool) -> Result<Option<Self>, AppError> {
        let user =
            sqlx::query_as("SELECT id, fullname, email, created_at FROM users WHERE email = $1")
                .bind(email)
                .fetch_optional(pool)
                .await?;

        Ok(user)
    }

    // 创建用户
    pub async fn create(
        fullname: &str,
        email: &str,
        password: &str,
        pool: &PgPool,
    ) -> Result<Self, AppError> {
        let password_hash = hash_password(password)?;
        let user = sqlx::query_as(
            r#"
            INSERT INTO users (email, fullname, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, fullname, email, created_at"#,
        )
        .bind(email)
        .bind(fullname)
        .bind(password_hash)
        .fetch_one(pool)
        .await?;

        Ok(user)
    }

    // 验证密码
    pub async fn verify(
        &self,
        email: &str,
        password: &str,
        pool: &PgPool,
    ) -> Result<Option<Self>, AppError> {
        let user: Option<User> = sqlx::query_as(
            "SELECT id, fullname, email, password_hash, created_at FROM users WHERE email = $1",
        )
        .bind(email)
        .fetch_optional(pool)
        .await?;
        match user {
            Some(mut user) => {
                let password_hash = mem::take(&mut user.password_hash).unwrap_or_default();
                let is_valid = verify_password(password, &password_hash)?;
                if is_valid { Ok(Some(user)) } else { Ok(None) }
            }
            None => Ok(None),
        }
    }
}

fn hash_password(password: &str) -> Result<String, AppError> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)?
        .to_string();
    Ok(password_hash)
}

fn verify_password(password: &str, password_hash: &str) -> Result<bool, AppError> {
    let argon2 = Argon2::default();
    let parsed_hash = PasswordHash::new(password_hash)?;
    let is_valid = argon2
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok();
    Ok(is_valid)
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;

    #[test]
    fn hash_and_verify_password_should_work() -> Result<()> {
        let password = "123456";
        let password_hash = hash_password(password)?;
        assert_eq!(password_hash.len(), 97);
        assert!(verify_password(password, &password_hash)?);
        Ok(())
    }

    #[sqlx::test(migrations = "../migrations")]
    async fn create_and_verify_user_should_work(pool: PgPool) -> anyhow::Result<()> {
        let email = "test@example.com";
        let fullname = "test";
        let password = "123456";

        let user = User::create(fullname, email, password, &pool).await?;
        assert_eq!(user.email, email);
        assert_eq!(user.fullname, fullname);
        assert!(user.id > 0);

        let found_user = User::find_by_email(email, &pool).await?;
        assert!(found_user.is_some());
        let found = found_user.unwrap();
        assert_eq!(found.email, email);
        assert_eq!(found.fullname, fullname);

        let verified = User::verify(&user, email, password, &pool).await?;
        assert!(verified.is_some());

        Ok(())
    }
}
