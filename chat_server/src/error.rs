use axum::{Json, http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};
use thiserror::Error;
use utoipa::ToSchema;

#[derive(Debug, Serialize, Deserialize, ToSchema)]
pub struct ErrorOutput {
    pub error: String,
}

#[derive(Error, Debug)]
pub enum AppError {
    #[error("User already exists: {0}")]
    UserAlreadyExists(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("password hashing error: {0}")]
    PasswordHashing(#[from] argon2::password_hash::Error),

    #[error("JWT error: {0}")]
    Jwt(#[from] jwt_simple::Error),

    #[error("http header parsing error: {0}")]
    HttpHeaderParsing(#[from] axum::http::header::InvalidHeaderValue),

    #[error("Create chat error: {0}")]
    CreateChatError(String),

    #[error("Create message error: {0}")]
    CreateMessageError(String),

    #[error("Chat file error: {0}")]
    ChatFileError(String),

    #[error("Update chat error: {0}")]
    UpdateChatError(String),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Multiple errors: {0}")]
    MultipleErrors(#[from] axum::extract::multipart::MultipartError),
}

impl ErrorOutput {
    pub fn new(error: impl Into<String>) -> Self {
        Self {
            error: error.into(),
        }
    }
}

impl IntoResponse for AppError {
    fn into_response(self) -> axum::response::Response {
        let status = match self {
            Self::UserAlreadyExists(_) => StatusCode::CONFLICT,
            Self::Database(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::NotFound(_) => StatusCode::NOT_FOUND,
            Self::PasswordHashing(_) => StatusCode::UNPROCESSABLE_ENTITY,
            Self::Jwt(_) => StatusCode::FORBIDDEN,
            Self::HttpHeaderParsing(_) => StatusCode::UNPROCESSABLE_ENTITY,
            Self::CreateChatError(_) => StatusCode::BAD_REQUEST,
            Self::UpdateChatError(_) => StatusCode::BAD_REQUEST,
            Self::IoError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            Self::MultipleErrors(_) => StatusCode::BAD_REQUEST,
            Self::CreateMessageError(_) => StatusCode::BAD_REQUEST,
            Self::ChatFileError(_) => StatusCode::BAD_REQUEST,
        };
        (status, Json(ErrorOutput::new(self.to_string()))).into_response()
    }
}
