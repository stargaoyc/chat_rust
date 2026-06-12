use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::{IntoResponse, Response},
};
use axum_extra::{
    TypedHeader,
    headers::{Authorization, authorization::Bearer},
};
use tracing::warn;

use crate::AppState;

pub async fn verify_token(
    TypedHeader(auth): TypedHeader<Authorization<Bearer>>,
    State(state): State<AppState>,
    mut req: Request,
    next: Next,
) -> Response {
    let token = auth.token();
    match state.dk.verify(token) {
        Ok(user) => {
            req.extensions_mut().insert(user);
        }
        Err(e) => {
            let msg = format!("Invalid token: {}", e);
            warn!(msg);
            return (StatusCode::FORBIDDEN, msg).into_response();
        }
    }
    next.run(req).await
}

#[cfg(test)]
mod tests {
    use crate::{AppConfig, User};

    use super::*;
    use anyhow::Result;
    use axum::{Router, body::Body, http::Request, middleware::from_fn_with_state, routing::get};
    use sqlx::PgPool;
    use tower::ServiceExt;

    async fn handler() -> impl IntoResponse {
        (StatusCode::OK, "ok")
    }

    #[sqlx::test(migrations = "../migrations")]
    async fn verify_token_middleware_should_work(pool: PgPool) -> Result<()> {
        let config = AppConfig::load()?;
        let state = AppState::try_new_with_pool(config, pool).await?;
        let user = User::new(1, "test", "test@example.com");
        let token = state.ek.sign(user)?;

        let app = Router::new()
            .route("/", get(handler))
            .layer(from_fn_with_state(state.clone(), verify_token))
            .with_state(state);

        let request = Request::builder()
            .uri("/")
            .header("Authorization", format!("Bearer {}", token))
            .body(Body::empty())?;
        let res = app.clone().oneshot(request).await?;
        assert_eq!(res.status(), StatusCode::OK);

        let request = Request::builder().uri("/").body(Body::empty())?;
        let res = app.clone().oneshot(request).await?;
        assert_eq!(res.status(), StatusCode::BAD_REQUEST);

        let request = Request::builder()
            .uri("/")
            .header("Authorization", "Bearer invalid_token")
            .body(Body::empty())?;
        let res = app.oneshot(request).await?;
        assert_eq!(res.status(), StatusCode::FORBIDDEN);

        Ok(())
    }
}
