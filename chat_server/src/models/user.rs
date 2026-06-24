use std::mem;

use argon2::{
    Argon2, PasswordHash, PasswordHasher, PasswordVerifier,
    password_hash::{SaltString, rand_core::OsRng},
};
use serde::{Deserialize, Serialize};

use crate::{AppError, AppState};
use chat_core::{ChatUser, User};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateUser {
    pub fullname: String,
    pub email: String,
    pub workspace: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SignInUser {
    pub email: String,
    pub password: String,
}

#[allow(dead_code)]
impl AppState {
    // 查找用户
    pub async fn find_user_by_email(&self, email: &str) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as(
            "SELECT id, ws_id, fullname, email, created_at FROM users WHERE email = $1",
        )
        .bind(email)
        .fetch_optional(&self.db_pool)
        .await?;

        Ok(user)
    }

    // find user by id
    pub async fn find_user_by_id(&self, id: i64) -> Result<Option<User>, AppError> {
        let user = sqlx::query_as(
            "SELECT id, ws_id, fullname, email, created_at FROM users WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.db_pool)
        .await?;

        Ok(user)
    }

    // 创建用户
    pub async fn create_user(&self, input: &CreateUser) -> Result<User, AppError> {
        // 检查用户是否已存在
        let user = self.find_user_by_email(&input.email).await?;
        if user.is_some() {
            return Err(AppError::UserAlreadyExists(input.email.clone()));
        }

        // 检查工作空间是否存在
        let workspace =
            if let Some(workspace) = self.find_workspace_by_name(&input.workspace).await? {
                workspace
            } else {
                self.create_workspace(&input.workspace, 0).await?
            };

        let password_hash = hash_password(&input.password)?;
        let user: User = sqlx::query_as(
            r#"
            INSERT INTO users (ws_id, email, fullname, password_hash)
            VALUES ($1, $2, $3, $4)
            RETURNING id, ws_id, fullname, email, created_at"#,
        )
        .bind(workspace.id)
        .bind(&input.email)
        .bind(&input.fullname)
        .bind(password_hash)
        .fetch_one(&self.db_pool)
        .await?;

        if workspace.owner_id == 0 {
            self.update_workspace_owner(workspace.id as u64, user.id as u64)
                .await?;
        }
        Ok(user)
    }

    // 验证密码
    pub async fn verify_user(&self, input: &SignInUser) -> Result<Option<User>, AppError> {
        let user: Option<User> = sqlx::query_as(
            "SELECT id, ws_id, fullname, email, password_hash, created_at FROM users WHERE email = $1",
        )
        .bind(&input.email)
        .fetch_optional(&self.db_pool)
        .await?;
        match user {
            Some(mut user) => {
                let password_hash = mem::take(&mut user.password_hash).unwrap_or_default();
                let is_valid = verify_password(&input.password, &password_hash)?;
                if is_valid { Ok(Some(user)) } else { Ok(None) }
            }
            None => Ok(None),
        }
    }

    pub async fn fetch_chat_user_by_ids(&self, ids: &[i64]) -> Result<Vec<ChatUser>, AppError> {
        let users = sqlx::query_as(
            r#"
            SELECT id, email, fullname
            FROM users
            WHERE id = ANY($1)
            "#,
        )
        .bind(ids)
        .fetch_all(&self.db_pool)
        .await?;
        Ok(users)
    }

    pub async fn fetch_all_chat_users(&self, ws_id: u64) -> Result<Vec<ChatUser>, AppError> {
        let users = sqlx::query_as(
            r#"
            SELECT id, email, fullname
            FROM users
            WHERE ws_id = $1
            "#,
        )
        .bind(ws_id as i64)
        .fetch_all(&self.db_pool)
        .await?;
        Ok(users)
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
impl CreateUser {
    pub fn new(fullname: &str, workspace: &str, email: &str, password: &str) -> Self {
        Self {
            fullname: fullname.to_string(),
            workspace: workspace.to_string(),
            email: email.to_string(),
            password: password.to_string(),
        }
    }
}

#[cfg(test)]
impl SignInUser {
    pub fn new(email: &str, password: &str) -> Self {
        Self {
            email: email.to_string(),
            password: password.to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;
    use sqlx::PgPool;

    #[sqlx::test(migrations = "../migrations", fixtures("../../fixtures/test.sql"))]
    async fn create_duplicate_user_email_should_fail(pool: PgPool) -> Result<()> {
        let state = AppState::try_new_with_pool(pool).await?;
        let email = "user1@example.com";
        let fullname = "user1";
        let password = "testpassword";

        let input = CreateUser::new(fullname, "none", email, password);

        // 创建重复用户
        let user1 = state.create_user(&input).await;

        match user1 {
            Ok(_) => panic!("Expected error when creating user with duplicate email"),
            Err(AppError::UserAlreadyExists(e)) => assert_eq!(e, email),
            Err(e) => panic!("Unexpected error: {:?}", e),
        }

        Ok(())
    }

    #[test]
    fn hash_and_verify_password_should_work() -> Result<()> {
        let password = "123456";
        let password_hash = hash_password(password)?;
        assert_eq!(password_hash.len(), 97);
        assert!(verify_password(password, &password_hash)?);
        Ok(())
    }

    #[sqlx::test(migrations = "../migrations", fixtures("../../fixtures/test.sql"))]
    async fn create_and_verify_user_should_work(pool: PgPool) -> anyhow::Result<()> {
        let state = AppState::try_new_with_pool(pool).await?;
        let email = "test@example.com";
        let fullname = "test";
        let password = "123456";

        let input = CreateUser::new(fullname, "none", email, password);

        let user = state.create_user(&input).await?;
        assert_eq!(user.email, email);
        assert_eq!(user.fullname, fullname);
        assert!(user.id > 0);

        let found_user = state.find_user_by_email(email).await?;
        assert!(found_user.is_some());
        let found = found_user.unwrap();
        assert_eq!(found.email, email);
        assert_eq!(found.fullname, fullname);

        let sign_in_input = SignInUser::new(email, password);
        let verified = state.verify_user(&sign_in_input).await?;
        assert!(verified.is_some());

        Ok(())
    }
}
