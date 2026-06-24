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

use crate::middlewares::TokenVerifier;

pub async fn verify_token<T>(
    TypedHeader(auth): TypedHeader<Authorization<Bearer>>,
    State(state): State<T>,
    mut req: Request,
    next: Next,
) -> Response
where
    T: TokenVerifier + Clone + Send + Sync + 'static,
{
    let token = auth.token();
    match state.verify(token) {
        Ok(user) => {
            req.extensions_mut().insert(user);
        }
        Err(e) => {
            let msg = format!("Invalid token: {:?}", e);
            warn!(msg);
            return (StatusCode::FORBIDDEN, msg).into_response();
        }
    }
    next.run(req).await
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use crate::{DecodingKey, EncodingKey, User};
    use chrono::prelude::Utc;

    use super::*;
    use anyhow::Result;
    use axum::{Router, body::Body, http::Request, middleware::from_fn_with_state, routing::get};
    use tower::ServiceExt;

    async fn handler() -> impl IntoResponse {
        (StatusCode::OK, "ok")
    }

    #[derive(Clone)]
    struct AppState(Arc<AppStateInner>);

    struct AppStateInner {
        ek: EncodingKey,
        dk: DecodingKey,
    }

    impl TokenVerifier for AppState {
        type Error = ();

        fn verify(&self, token: &str) -> Result<User, Self::Error> {
            self.0.dk.verify(token).map_err(|_| ())
        }
    }

    #[tokio::test]
    async fn verify_token_middleware_should_work() -> Result<()> {
        let encoding_key = include_str!("../../fixtures/encoding.pem");
        let decoding_key = include_str!("../../fixtures/decoding.pem");
        let ek = EncodingKey::load(encoding_key)?;
        let dk = DecodingKey::load(decoding_key)?;

        let state = AppState(Arc::new(AppStateInner { ek, dk }));
        let user = User {
            id: 1,
            ws_id: 0,
            fullname: "test".to_string(),
            email: "test@example.com".to_string(),
            password_hash: None,
            created_at: Utc::now(),
        };
        let token = state.0.ek.sign(user)?;

        let app = Router::new()
            .route("/", get(handler))
            .layer(from_fn_with_state(state.clone(), verify_token::<AppState>))
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
