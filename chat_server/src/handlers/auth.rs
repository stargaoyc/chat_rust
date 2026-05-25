use axum::response::IntoResponse;

pub(crate) async fn signin_handler() -> impl IntoResponse {
    "signin".to_string()
}

pub(crate) async fn signup_handler() -> impl IntoResponse {
    "signup".to_string()
}
