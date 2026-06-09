use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    #[error("User not found")]
    UserNotFound,

    #[error("password hashing error: {0}")]
    PasswordHashing(#[from] argon2::password_hash::Error),

    #[error("JWT error: {0}")]
    Jwt(#[from] jwt_simple::Error),
}
