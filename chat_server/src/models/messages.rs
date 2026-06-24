use serde::{Deserialize, Serialize};
use std::str::FromStr;

use crate::{AppError, AppState, ChatFile};
use chat_core::Message;
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateMessage {
    pub content: String,
    pub files: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ListMessages {
    pub limit: u64,
    pub last_id: Option<u64>,
}

impl AppState {
    pub async fn create_message(
        &self,
        input: CreateMessage,
        chat_id: u64,
        user_id: u64,
    ) -> Result<Message, AppError> {
        let base_dir = &self.config.server.base_dir;
        if input.content.is_empty() {
            return Err(AppError::CreateMessageError("content is empty".to_string()));
        }

        for s in &input.files {
            let file = ChatFile::from_str(s)?;
            if !file.path(base_dir).exists() {
                return Err(AppError::CreateMessageError(format!(
                    "file {} does not exist",
                    s
                )));
            }
        }

        let message: Message = sqlx::query_as(
            r#"INSERT INTO messages (chat_id, sender_id, content, files)
            VALUES ($1, $2, $3, $4)
            RETURNING id, chat_id, sender_id, content, files, created_at
            "#,
        )
        .bind(chat_id as i64)
        .bind(user_id as i64)
        .bind(input.content)
        .bind(&input.files)
        .fetch_one(&self.db_pool)
        .await?;

        Ok(message)
    }

    pub async fn list_messages(
        &self,
        input: ListMessages,
        chat_id: u64,
    ) -> Result<Vec<Message>, AppError> {
        let last_id = input.last_id.unwrap_or(i64::MAX as u64);
        let limit = input.limit.clamp(1, 100);
        let messages = sqlx::query_as(
            r#"
            SELECT id, chat_id, sender_id, content, files, created_at
            FROM messages
            WHERE chat_id = $1 AND id < $2
            ORDER BY id DESC
            LIMIT $3
            "#,
        )
        .bind(chat_id as i64)
        .bind(last_id as i64)
        .bind(limit as i64)
        .fetch_all(&self.db_pool)
        .await?;

        Ok(messages)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;
    use sqlx::PgPool;

    #[sqlx::test(migrations = "../migrations", fixtures("../../fixtures/test.sql"))]
    async fn test_create_message(pool: PgPool) -> Result<()> {
        let state = AppState::try_new_with_pool(pool).await?;
        let input = CreateMessage {
            content: "Hello, world!".to_string(),
            files: vec![],
        };
        let message = state.create_message(input, 1, 1).await?;
        assert_eq!(message.content, "Hello, world!");

        // 测试文件不存在
        let input = CreateMessage {
            content: "Hello, world!".to_string(),
            files: vec!["1".to_string()],
        };

        let error = state.create_message(input, 1, 1).await.unwrap_err();
        assert_eq!(
            error.to_string(),
            "Chat file error: Invalid chat file path: 1".to_string()
        );

        let url = upload_file(&state)?;
        let input = CreateMessage {
            content: "Hello, world!".to_string(),
            files: vec![url],
        };
        let message = state.create_message(input, 1, 1).await?;
        assert_eq!(message.content, "Hello, world!");
        assert_eq!(message.files.len(), 1);
        Ok(())
    }

    #[sqlx::test(migrations = "../migrations", fixtures("../../fixtures/test.sql"))]
    async fn test_list_messages(pool: PgPool) -> Result<()> {
        let state = AppState::try_new_with_pool(pool).await?;
        let input = ListMessages {
            limit: 6,
            last_id: None,
        };
        let messages = state.list_messages(input, 1).await?;
        assert_eq!(messages.len(), 6);

        let last_id = messages.last().expect("last message should exist").id;
        let input = ListMessages {
            limit: 6,
            last_id: Some(last_id as u64),
        };
        let messages = state.list_messages(input, 1).await?;
        assert_eq!(messages.len(), 4);
        Ok(())
    }

    fn upload_file(state: &AppState) -> Result<String> {
        let file = ChatFile::new(1, "example.txt", b"hello world");
        let path = file.path(&state.config.server.base_dir);
        std::fs::create_dir_all(path.parent().expect("file path parent should exists"))?;
        std::fs::write(&path, b"hello world")?;
        Ok(file.url())
    }
}
