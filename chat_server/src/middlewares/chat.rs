use axum::{
    extract::{FromRequestParts, Path, Request, State},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};

use crate::{AppError, AppState};
use chat_core::User;

pub async fn verify_chat(State(state): State<AppState>, req: Request, next: Next) -> Response {
    let (mut parts, body) = req.into_parts();
    let chat_id = match Path::<u64>::from_request_parts(&mut parts, &state).await {
        Ok(Path(chat_id)) => chat_id,
        Err(_) => {
            return (StatusCode::BAD_REQUEST, "Invalid chat ID").into_response();
        }
    };

    let user = match parts.extensions.get::<User>() {
        Some(user) => user,
        None => {
            return (StatusCode::UNAUTHORIZED, "User not authenticated").into_response();
        }
    };

    //验证用户是空间成员
    if !state
        .is_member_of_chat(chat_id, user.id as u64)
        .await
        .unwrap_or_default()
    {
        let err = AppError::CreateMessageError(format!(
            "User {} is not a member of the chat {}",
            user.id, chat_id
        ));
        return err.into_response();
    }

    let req = Request::from_parts(parts, body);
    next.run(req).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;
    use axum::{Router, body::Body, http::Request, middleware::from_fn_with_state, routing::get};
    use chat_core::middlewares::verify_token;
    use sqlx::PgPool;
    use tower::ServiceExt;

    async fn handler() -> impl IntoResponse {
        (StatusCode::OK, "ok")
    }

    #[sqlx::test(migrations = "../migrations", fixtures("../../fixtures/test.sql"))]
    async fn verify_chat_middleware_should_work(pool: PgPool) -> Result<()> {
        let state = AppState::try_new_with_pool(pool).await?;
        let user = state.find_user_by_id(1).await?.expect("User should exist");
        let token = state.ek.sign(user)?;

        let app = Router::new()
            .route("/chat/{id}/messages", get(handler))
            .layer(from_fn_with_state(state.clone(), verify_chat))
            .layer(from_fn_with_state(state.clone(), verify_token::<AppState>))
            .with_state(state);

        let request = Request::builder()
            .uri("/chat/1/messages")
            .header("Authorization", format!("Bearer {}", token))
            .body(Body::empty())?;
        let res = app.clone().oneshot(request).await?;
        assert_eq!(res.status(), StatusCode::OK);

        let request = Request::builder()
            .uri("/chat/5/messages")
            .header("Authorization", format!("Bearer {}", token))
            .body(Body::empty())?;
        let res = app.clone().oneshot(request).await?;
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);

        Ok(())
    }
}
