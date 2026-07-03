use axum::{Json, http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Serialize, Deserialize)]
pub struct ErrorOutput {
    pub error: String,
}

#[derive(Error, Debug)]
pub enum AppError {
    #[error("JWT error: {0}")]
    Jwt(#[from] jwt_simple::Error),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
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
            Self::Jwt(_) => StatusCode::FORBIDDEN,
            Self::IoError(_) => StatusCode::INTERNAL_SERVER_ERROR,
        };
        (status, Json(ErrorOutput::new(self.to_string()))).into_response()
    }
}
