mod chat;
mod file;
mod messages;
mod user;
mod workspace;

use serde::{Deserialize, Serialize};

pub use chat::{CreateChat, UpdateChat};
pub use messages::{CreateMessage, ListMessages};
pub use user::{CreateUser, SignInUser};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ChatFile {
    pub ws_id: u64,
    pub ext: String, // expect ext from filename or use mime type
    pub hash: String,
}
