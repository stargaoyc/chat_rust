use crate::{
    AppError,
    models::{Chat, ChatType, ChatUser},
};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, Default, Serialize, Deserialize, Clone)]
pub struct CreateChat {
    pub name: Option<String>,
    pub members: Vec<i64>,
    pub public: bool,
}

#[derive(Debug, Default, Serialize, Deserialize, Clone)]
pub struct UpdateChat {
    pub name: Option<String>,
    pub members: Option<Vec<i64>>,
    pub public: Option<bool>,
}

impl Chat {
    pub async fn create(ws_id: u64, input: CreateChat, pool: &PgPool) -> Result<Self, AppError> {
        let len = input.members.len();
        if len < 2 {
            return Err(AppError::CreateChatError(
                "Group chat must have at least 2 members".to_string(),
            ));
        }

        if len > 8 && input.name.is_none() {
            return Err(AppError::CreateChatError(
                "Group chat with more than 8 members must have a name".to_string(),
            ));
        }

        let chat_type = match (&input.name, len) {
            (None, 2) => ChatType::Single,
            (None, _) => ChatType::Group,
            (_, _) => {
                if input.public {
                    ChatType::PublicChannel
                } else {
                    ChatType::PrivateChannel
                }
            }
        };

        let users = ChatUser::fetch_by_ids(&input.members, pool).await?;
        if users.len() != len {
            return Err(AppError::CreateChatError(
                "Some members do not exist".to_string(),
            ));
        }

        let chat = sqlx::query_as(
            r#"
            INSERT INTO chats (ws_id, name, type, members)
            VALUES ($1, $2, $3, $4)
            RETURNING id, ws_id, name, type, members, created_at
            "#,
        )
        .bind(ws_id as i64)
        .bind(input.name)
        .bind(chat_type)
        .bind(&input.members)
        .fetch_one(pool)
        .await?;

        Ok(chat)
    }

    pub async fn fetch_all(ws_id: u64, pool: &PgPool) -> Result<Vec<Self>, AppError> {
        let chat = sqlx::query_as(
            r#"
            SELECT id, ws_id, name, type, members, created_at
            FROM chats
            WHERE ws_id = $1
            "#,
        )
        .bind(ws_id as i64)
        .fetch_all(pool)
        .await?;

        Ok(chat)
    }

    pub async fn get_by_id(id: u64, pool: &PgPool) -> Result<Option<Self>, AppError> {
        let chat = sqlx::query_as(
            r#"
            SELECT id, ws_id, name, type, members, created_at
            FROM chats
            WHERE id = $1
            "#,
        )
        .bind(id as i64)
        .fetch_optional(pool)
        .await?;

        Ok(chat)
    }

    pub async fn update_by_id(id: u64, input: UpdateChat, pool: &PgPool) -> Result<Self, AppError> {
        let chat_type = if input.members.as_ref().is_some() {
            let members = input.members.as_ref().unwrap();
            let len = members.len();
            if len < 2 {
                return Err(AppError::UpdateChatError(
                    "Group chat must have at least 2 members".to_string(),
                ));
            }

            if len > 8 && input.name.is_none() {
                return Err(AppError::UpdateChatError(
                    "Group chat with more than 8 members must have a name".to_string(),
                ));
            }

            let users = ChatUser::fetch_by_ids(members, pool).await?;
            if users.len() != len {
                return Err(AppError::UpdateChatError(
                    "Some members do not exist".to_string(),
                ));
            }

            match (&input.name, len) {
                (None, 2) => Some(ChatType::Single),
                (None, _) => Some(ChatType::Group),
                (_, _) if input.public.is_some() => {
                    if *input.public.as_ref().unwrap() {
                        Some(ChatType::PublicChannel)
                    } else {
                        Some(ChatType::PrivateChannel)
                    }
                }
                (_, _) => None,
            }
        } else if input.public.is_some() {
            if input.public.unwrap() {
                Some(ChatType::PublicChannel)
            } else {
                Some(ChatType::PrivateChannel)
            }
        } else {
            None
        };

        let chat = sqlx::query_as(
            r#"
            UPDATE chats
            SET name = COALESCE($2, name),
                type = COALESCE($3, type),
                members = COALESCE($4, members)
            WHERE id = $1
            RETURNING id, ws_id, name, type, members, created_at
            "#,
        )
        .bind(id as i64)
        .bind(input.name)
        .bind(chat_type)
        .bind(&input.members)
        .fetch_one(pool)
        .await?;

        Ok(chat)
    }

    pub async fn delete_by_id(id: u64, pool: &PgPool) -> Result<(), AppError> {
        sqlx::query("DELETE FROM chats WHERE id = $1")
            .bind(id as i64)
            .execute(pool)
            .await?;

        Ok(())
    }
}

#[cfg(test)]
impl CreateChat {
    pub fn new(name: &str, members: &[i64], public: bool) -> Self {
        let name = if name.is_empty() {
            None
        } else {
            Some(name.to_string())
        };
        Self {
            name,
            members: members.to_vec(),
            public,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use anyhow::Result;

    #[sqlx::test(migrations = "../migrations", fixtures("../../fixtures/test.sql"))]
    async fn create_single_chat_should_work(pool: PgPool) -> Result<()> {
        let input = CreateChat::new("", &[1, 2], false);
        let chat = Chat::create(1, input, &pool).await?;
        assert_eq!(chat.ws_id, 1);
        assert_eq!(chat.members, vec![1, 2]);
        assert_eq!(chat.r#type, ChatType::Single);
        Ok(())
    }

    #[sqlx::test(migrations = "../migrations", fixtures("../../fixtures/test.sql"))]
    async fn create_public_named_chat_should_work(pool: PgPool) -> Result<()> {
        let input = CreateChat::new("test", &[1, 2, 3], true);
        let chat = Chat::create(1, input, &pool).await?;
        assert_eq!(chat.ws_id, 1);
        assert_eq!(chat.members, vec![1, 2, 3]);
        assert_eq!(chat.r#type, ChatType::PublicChannel);
        Ok(())
    }

    #[sqlx::test(migrations = "../migrations", fixtures("../../fixtures/test.sql"))]
    async fn chat_get_by_id_should_work(pool: PgPool) -> Result<()> {
        let chat = Chat::get_by_id(1, &pool).await?.unwrap();
        assert_eq!(chat.id, 1);
        assert_eq!(chat.ws_id, 1);
        assert_eq!(chat.members, vec![1, 2, 3, 4, 5]);
        Ok(())
    }

    #[sqlx::test(migrations = "../migrations", fixtures("../../fixtures/test.sql"))]
    async fn chat_fetch_all_should_work(pool: PgPool) -> Result<()> {
        let chats = Chat::fetch_all(1, &pool).await?;
        assert_eq!(chats.len(), 4);
        Ok(())
    }
}
