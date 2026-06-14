use axum::{
    Extension, Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use tracing::info;

use crate::{AppError, AppState, Chat, CreateChat, UpdateChat, User};

pub(crate) async fn list_chat_handler(
    Extension(user): Extension<User>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let chats = Chat::fetch_all(user.ws_id as u64, &state.db_pool).await?;
    info!("list chat, chats: {:?}", chats);
    Ok((StatusCode::OK, Json(chats)))
}

pub(crate) async fn create_chat_handler(
    Extension(user): Extension<User>,
    State(state): State<AppState>,
    Json(input): Json<CreateChat>,
) -> Result<impl IntoResponse, AppError> {
    let chat = Chat::create(user.ws_id as u64, input, &state.db_pool).await?;
    Ok((StatusCode::CREATED, Json(chat)))
}

pub(crate) async fn get_chat_handler(
    Path(id): Path<u64>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let chat = Chat::get_by_id(id, &state.db_pool).await?;
    match chat {
        Some(chat) => Ok((StatusCode::OK, Json(chat))),
        None => Err(AppError::NotFound(format!("Chat not found: {}", id))),
    }
}

pub(crate) async fn update_chat_handler(
    Path(id): Path<u64>,
    State(state): State<AppState>,
    Json(input): Json<UpdateChat>,
) -> Result<impl IntoResponse, AppError> {
    let chat = Chat::update_by_id(id, input, &state.db_pool).await?;
    Ok((StatusCode::OK, Json(chat)))
}

pub(crate) async fn delete_chat_handler(
    Path(id): Path<u64>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    Chat::delete_by_id(id, &state.db_pool).await?;
    Ok(StatusCode::NO_CONTENT)
}
