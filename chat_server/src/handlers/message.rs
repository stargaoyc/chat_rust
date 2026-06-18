use axum::{
    Extension, Json,
    body::Body,
    extract::{Multipart, Path, State},
    http::HeaderValue,
    response::IntoResponse,
    response::Response,
};
use tokio::fs::{self, File};
use tokio_util::io::ReaderStream;
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
    let base_dir = &state.config.server.base_dir;

    let mut files = Vec::new();

    while let Some(field) = multipart.next_field().await? {
        let field_name = field.file_name().map(|s| s.to_string());
        let (Some(filename), Ok(data)) = (field_name, field.bytes().await) else {
            warn!("Failed to get filename or data from multipart field");
            continue;
        };

        let file = ChatFile::new(ws_id, &filename, &data);
        let path = file.path(base_dir);
        if path.exists() {
            warn!("File already exists at path: {:?}", path);
            continue;
        } else {
            fs::create_dir_all(path.parent().expect("Failed to get parent directory")).await?;
            fs::write(path, data).await?;
        }

        files.push(file.url());
    }

    Ok(Json(files))
}

pub(crate) async fn download_file_handler(
    Extension(user): Extension<User>,
    State(state): State<AppState>,
    Path((ws_id, path)): Path<(u64, String)>,
) -> Result<impl IntoResponse, AppError> {
    if user.ws_id as u64 != ws_id {
        return Err(AppError::NotFound(
            "File does not exist or you are not authorized".to_string(),
        ));
    }
    let base_dir = state.config.server.base_dir.join(ws_id.to_string());
    let path = base_dir.join(path);
    let file = match File::open(&path).await {
        Ok(f) => f,
        Err(_) => {
            return Err(AppError::NotFound("File does not exist".to_string()));
        }
    };

    let mime = mime_guess::from_path(&path).first_or_octet_stream();
    // 流式
    let stream = ReaderStream::new(file); // 将 File 转为 Stream
    let body = Body::from_stream(stream);
    let mut response = Response::new(body);
    response
        .headers_mut()
        .insert("Content-Type", HeaderValue::from_str(mime.as_ref())?);

    Ok(response)
}
