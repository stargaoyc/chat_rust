use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
// use hyper::HeaderMap;
use serde::{Deserialize, Serialize};

use crate::{
    AppError, AppState, ErrorOutput, User,
    models::{CreateUser, SignInUser},
};

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthOutput {
    token: String,
}

pub(crate) async fn signin_handler(
    State(state): State<AppState>,
    Json(input): Json<SignInUser>,
) -> Result<impl IntoResponse, AppError> {
    let user = User::verify(&input, &state.db_pool).await?;
    match user {
        Some(user) => {
            let token = state.ek.sign(user.clone())?;
            Ok((StatusCode::OK, Json(AuthOutput { token })).into_response())
        }
        None => {
            let body = Json(ErrorOutput::new("Invalid email or password"));
            Ok((StatusCode::FORBIDDEN, body).into_response())
        }
    }
}

pub(crate) async fn signup_handler(
    State(state): State<AppState>,
    Json(input): Json<CreateUser>,
) -> Result<impl IntoResponse, AppError> {
    let user = User::create(&input, &state.db_pool).await?;
    let token = state.ek.sign(user.clone())?;
    // let mut header = HeaderMap::new();
    // header.insert("X-Token", HeaderValue::from_str(&token)?);
    // Ok((StatusCode::CREATED, header))

    let body = AuthOutput { token };
    Ok((StatusCode::CREATED, Json(body)))
}

#[cfg(test)]
mod tests {
    use crate::AppConfig;

    use super::*;
    use anyhow::Result;
    use axum::body::to_bytes;
    use sqlx::PgPool;

    #[sqlx::test(migrations = "../migrations")]
    async fn signup_should_work(pool: PgPool) -> Result<()> {
        let config = AppConfig::load()?;
        let state = AppState::try_new_with_pool(config, pool).await?;
        let input = CreateUser::new("John Doe", "none", "john.doe@example.com", "123456");
        let ret = signup_handler(State(state), Json(input))
            .await?
            .into_response();
        assert_eq!(ret.status(), StatusCode::CREATED);

        let body_bytes = to_bytes(ret.into_body(), usize::MAX).await?;
        let ret: AuthOutput = serde_json::from_slice(&body_bytes)?;
        assert!(!ret.token.is_empty());
        Ok(())
    }

    #[sqlx::test(migrations = "../migrations")]
    async fn signin_should_work(pool: PgPool) -> Result<()> {
        let config = AppConfig::load()?;
        let state = AppState::try_new_with_pool(config, pool).await?;
        let name = "John Doe";
        let email = "john.doe@example.com";
        let password = "123456";
        let user = CreateUser::new(name, "none", email, password);
        User::create(&user, &state.db_pool).await?;

        let input = SignInUser::new(email, password);
        let ret = signin_handler(State(state), Json(input))
            .await?
            .into_response();
        assert_eq!(ret.status(), StatusCode::OK);

        let body_bytes = to_bytes(ret.into_body(), usize::MAX).await?;
        let ret: AuthOutput = serde_json::from_slice(&body_bytes)?;
        assert!(!ret.token.is_empty());
        Ok(())
    }

    #[sqlx::test(migrations = "../migrations")]
    async fn signup_duplicate_email_should_409(pool: PgPool) -> Result<()> {
        let config = AppConfig::load()?;
        let state = AppState::try_new_with_pool(config, pool).await?;
        let email = "test@example.com";
        let fullname = "test";
        let password = "123456";

        let input = CreateUser::new(fullname, "none", email, password);
        // 创建第一个用户
        signup_handler(State(state.clone()), Json(input.clone())).await?;
        let ret = signup_handler(State(state), Json(input))
            .await
            .into_response();
        assert_eq!(ret.status(), StatusCode::CONFLICT);
        let body_bytes = to_bytes(ret.into_body(), usize::MAX).await?;
        let msg: ErrorOutput = serde_json::from_slice(&body_bytes)?;
        assert_eq!(msg.error, "User already exists: test@example.com");
        Ok(())
    }

    #[sqlx::test(migrations = "../migrations")]
    async fn signin_with_non_existing_user_should_403(pool: PgPool) -> Result<()> {
        let config = AppConfig::load()?;
        let state = AppState::try_new_with_pool(config, pool).await?;
        let input = SignInUser::new("non_existing@example.com", "123456");
        let ret = signin_handler(State(state), Json(input))
            .await
            .into_response();
        assert_eq!(ret.status(), StatusCode::FORBIDDEN);
        let body_bytes = to_bytes(ret.into_body(), usize::MAX).await?;
        let msg: ErrorOutput = serde_json::from_slice(&body_bytes)?;
        assert_eq!(msg.error, "Invalid email or password");
        Ok(())
    }
}
