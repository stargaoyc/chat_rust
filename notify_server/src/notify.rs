use std::{collections::HashSet, sync::Arc};

use anyhow::Result;
use chat_core::{Chat, Message};
use futures::prelude::stream::StreamExt;
use jwt_simple::prelude::{Deserialize, Serialize};
use sqlx::postgres::PgListener;
use tracing::{info, warn};

use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum AppEvent {
    NewChat(Chat),
    AddToChat(Chat),
    RemoveFromChat(Chat),
    NewMessage(Message),
}

#[derive(Debug)]
struct Notification {
    user_ids: HashSet<u64>,
    event: Arc<AppEvent>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatUpdated {
    op: String,
    new: Option<Chat>,
    old: Option<Chat>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChatMessageCreated {
    message: Message,
    members: Vec<i64>,
}

pub async fn set_up_listener(state: AppState) -> anyhow::Result<()> {
    let mut listener = PgListener::connect(&state.config.server.db_url).await?;
    listener.listen("chat_updated").await?;
    listener.listen("chat_message_created").await?;

    let mut stream = listener.into_stream();

    tokio::spawn(async move {
        while let Some(Ok(notification)) = stream.next().await {
            info!("Received notification: {:?}", notification);
            let notification = Notification::load(notification.channel(), notification.payload())?;
            info!("Parsed notification: {:?}", notification);
            let users = &state.users;
            for user_id in notification.user_ids {
                if let Some(tx) = users.get(&user_id)
                    && let Err(e) = tx.send(notification.event.clone())
                {
                    warn!("Failed to send notification: {:?}", e);
                }
            }
        }
        Ok::<(), anyhow::Error>(())
    });
    Ok(())
}

impl Notification {
    fn load(r#type: &str, payload: &str) -> Result<Self> {
        match r#type {
            "chat_updated" => {
                let payload: ChatUpdated = serde_json::from_str(payload)?;
                info!("Chat updated: {:?}", payload);
                let user_ids =
                    get_affected_chat_user_ids(payload.old.as_ref(), payload.new.as_ref());
                let event = match payload.op.as_str() {
                    "INSERT" => AppEvent::NewChat(payload.new.expect("new should exist")),
                    "UPDATE" => AppEvent::AddToChat(payload.new.expect("new should exist")),
                    "DELETE" => AppEvent::RemoveFromChat(payload.old.expect("old should exist")),
                    _ => return Err(anyhow::anyhow!("Invalid chat_updated operation")),
                };
                Ok(Self {
                    user_ids,
                    event: Arc::new(event),
                })
            }
            "chat_message_created" => {
                let payload: ChatMessageCreated = serde_json::from_str(payload)?;
                let event = AppEvent::NewMessage(payload.message);
                let user_ids = payload.members.iter().map(|u| *u as u64).collect();
                Ok(Self {
                    user_ids,
                    event: Arc::new(event),
                })
            }
            _ => Err(anyhow::anyhow!("Unknown notification type")),
        }
    }
}

fn get_affected_chat_user_ids(old: Option<&Chat>, new: Option<&Chat>) -> HashSet<u64> {
    match (old, new) {
        (Some(old_chat), Some(new_chat)) => {
            let old_user_ids: HashSet<u64> = old_chat.members.iter().map(|u| *u as u64).collect();
            let new_user_ids: HashSet<u64> = new_chat.members.iter().map(|u| *u as u64).collect();
            old_user_ids.union(&new_user_ids).cloned().collect()
        }
        (Some(old_chat), None) => old_chat.members.iter().map(|u| *u as u64).collect(),
        (None, Some(new_chat)) => new_chat.members.iter().map(|u| *u as u64).collect(),
        (None, None) => HashSet::new(),
    }
}
