use axum::{Extension, Json, extract::State, response::IntoResponse};

use crate::{AppError, AppState, User, models::Workspace};

pub(crate) async fn list_chat_users_handler(
    Extension(user): Extension<User>,
    State(state): State<AppState>,
) -> Result<impl IntoResponse, AppError> {
    let ws_id = user.ws_id;
    let chat_users = Workspace::fetch_all_chat_users(ws_id as u64, &state.db_pool).await?;
    Ok(Json(chat_users))
}
