mod utils;

pub mod middlewares;

use chrono::prelude::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use utoipa::ToSchema;

pub use utils::*;

#[derive(Debug, Serialize, Deserialize, Clone, FromRow, PartialEq, ToSchema)]
pub struct User {
    pub id: i64,
    pub ws_id: i64,
    pub fullname: String,
    pub email: String,
    #[serde(skip)]
    #[sqlx(default)]
    pub password_hash: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow, PartialEq, ToSchema)]
pub struct ChatUser {
    pub id: i64,
    pub fullname: String,
    pub email: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow, PartialEq, ToSchema)]
pub struct Workspace {
    pub id: i64,
    pub name: String,
    pub owner_id: i64,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, PartialOrd, sqlx::Type, ToSchema)]
#[sqlx(type_name = "chat_type", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum ChatType {
    Single,
    Group,
    PublicChannel,
    PrivateChannel,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow, PartialEq, ToSchema)]
pub struct Chat {
    pub id: i64,
    pub ws_id: i64,
    pub name: Option<String>,
    pub r#type: ChatType,
    pub members: Vec<i64>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, Deserialize, Clone, FromRow, PartialEq, ToSchema)]
pub struct Message {
    pub id: i64,
    pub chat_id: i64,
    pub sender_id: i64,
    pub content: String,
    pub files: Vec<String>,
    pub created_at: DateTime<Utc>,
}
