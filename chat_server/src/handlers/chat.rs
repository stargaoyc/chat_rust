use axum::{
    Extension, Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use tracing::info;

use crate::{AppError, AppState, CreateChat, UpdateChat};
use chat_core::{Chat, User};

#[utoipa::path(
        get,
        path = "/api/chats",
        tag = "chat",
        responses(
            (status = 200, description = "List chats successfully", body = [Vec<Chat>])
        ),
        security(
            ("token" = [])
        )
    )]
pub(crate) async fn list_chat_handler(
    Extension(user): Extension<User>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let chats = state.fetch_all_chats(user.ws_id as u64).await?;
    info!("list chat, chats: {:?}", chats);
    Ok((StatusCode::OK, Json(chats)))
}

#[utoipa::path(
        post,
        path = "/api/chats",
        tag = "chat",
        responses(
            (status = 201, description = "Create chat successfully", body = [Chat])
        ),
        security(
            ("token" = [])
        )
    )]
pub(crate) async fn create_chat_handler(
    Extension(user): Extension<User>,
    State(state): State<AppState>,
    Json(input): Json<CreateChat>,
) -> Result<impl IntoResponse, AppError> {
    let chat = state.create_chat(user.ws_id as u64, input).await?;
    Ok((StatusCode::CREATED, Json(chat)))
}

#[utoipa::path(
        get,
        path = "/api/chats/{id}",
        params(
            ("id" = u64, Path, description = "Chat id")
        ),
        tag = "chat",
        responses(
            (status = 200, description = "Get chat successfully", body = [Chat]),
            (status = 404, description = "Chat not found", body = [crate::ErrorOutput])
        ),
        security(
            ("token" = [])
        )
    )]
pub(crate) async fn get_chat_handler(
    Path(id): Path<u64>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let chat = state.get_chat_by_id(id).await?;
    match chat {
        Some(chat) => Ok((StatusCode::OK, Json(chat))),
        None => Err(AppError::NotFound(format!("Chat not found: {}", id))),
    }
}

#[utoipa::path(
        put,
        path = "/api/chats/{id}",
        params(
            ("id" = u64, Path, description = "Chat id")
        ),
        tag = "chat",
        responses(
            (status = 200, description = "Update chat successfully", body = [Chat]),
        ),
        security(
            ("token" = [])
        )
    )]
pub(crate) async fn update_chat_handler(
    Path(id): Path<u64>,
    State(state): State<AppState>,
    Json(input): Json<UpdateChat>,
) -> Result<impl IntoResponse, AppError> {
    let chat = state.update_chat_by_id(id, input).await?;
    Ok((StatusCode::OK, Json(chat)))
}

#[utoipa::path(
        delete,
        path = "/api/chats/{id}",
        params(
            ("id" = u64, Path, description = "Chat id")
        ),
        tag = "chat",
        responses(
            (status = 204, description = "Delete chat successfully"),
        ),
        security(
            ("token" = [])
        )
    )]
pub(crate) async fn delete_chat_handler(
    Path(id): Path<u64>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    state.delete_chat_by_id(id).await?;
    Ok(StatusCode::NO_CONTENT)
}
