use axum::{Json, http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorOutput {
    pub error: String,
}

#[derive(Error, Debug)]
pub enum AppError {
    #[error("User already exists: {0}")]
    UserAlreadyExists(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("User not found")]
    UserNotFound,

    #[error("password hashing error: {0}")]
    PasswordHashing(#[from] argon2::password_hash::Error),

    #[error("JWT error: {0}")]
    Jwt(#[from] jwt_simple::Error),

    #[error("http header parsing error: {0}")]
    HttpHeaderParsing(#[from] axum::http::header::InvalidHeaderValue),
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
            Self::UserNotFound => StatusCode::NOT_FOUND,
            Self::PasswordHashing(_) => StatusCode::UNPROCESSABLE_ENTITY,
            Self::Jwt(_) => StatusCode::FORBIDDEN,
            Self::HttpHeaderParsing(_) => StatusCode::UNPROCESSABLE_ENTITY,
        };
        (status, Json(ErrorOutput::new(self.to_string()))).into_response()
    }
}
