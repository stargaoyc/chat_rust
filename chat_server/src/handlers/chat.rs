use axum::{Extension, response::IntoResponse};
use tracing::info;

use crate::User;

pub(crate) async fn list_chat_handler(Extension(user): Extension<User>) -> impl IntoResponse {
    info!("list chat, user: {:?}", user);
    "list chat".to_string()
}

pub(crate) async fn create_chat_handler() -> impl IntoResponse {
    "create chat".to_string()
}

pub(crate) async fn update_chat_handler() -> impl IntoResponse {
    "update chat".to_string()
}

pub(crate) async fn delete_chat_handler() -> impl IntoResponse {
    "delete chat".to_string()
}
