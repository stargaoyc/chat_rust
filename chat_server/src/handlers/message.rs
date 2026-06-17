use axum::{
    Extension, Json,
    extract::{Multipart, State},
    response::IntoResponse,
};
use tokio::fs;
use tracing::warn;

use crate::{AppError, AppState, ChatFile, User};

pub(crate) async fn send_message_handler() -> impl IntoResponse {
    "send message".to_string()
}

pub(crate) async fn list_messages_handler() -> impl IntoResponse {
    "list messages".to_string()
}

pub(crate) async fn upload_handler(
    Extension(user): Extension<User>,
    State(state): State<AppState>,
    mut multipart: Multipart,
) -> Result<impl IntoResponse, AppError> {
    let ws_id = user.ws_id as u64;
    let base_dir = state.config.server.base_dir.join(ws_id.to_string());

    let mut files = Vec::new();

    while let Some(field) = multipart.next_field().await? {
        let field_name = field.file_name().map(|s| s.to_string());
        let (Some(filename), Ok(data)) = (field_name, field.bytes().await) else {
            warn!("Failed to get filename or data from multipart field");
            continue;
        };

        let file = ChatFile::new(&filename, &data);
        let path = file.path(&base_dir);
        if path.exists() {
            warn!("File already exists at path: {:?}", path);
            continue;
        } else {
            fs::create_dir_all(path.parent().expect("Failed to get parent directory")).await?;
            fs::write(path, data).await?;
        }

        files.push(file.url(ws_id));
    }

    Ok(Json(files))
}
