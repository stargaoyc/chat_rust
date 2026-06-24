mod sse;

use chat_core::{Chat, Message};
use futures::prelude::stream::StreamExt;
use sqlx::postgres::PgListener;
pub(crate) use sse::sse_handler;

use axum::{
    Router,
    response::{Html, IntoResponse},
    routing::get,
};
use tracing::info;

pub enum Event {
    NewChat(Chat),
    AddToChat(Chat),
    RemoveFromChat(Chat),
    NewMessage(Message),
}

const INDEX_HTML: &str = include_str!("../index.html");

pub fn get_router() -> Router {
    Router::new()
        .route("/", get(index_handler))
        .route("/events", get(sse_handler))
}

pub async fn set_up_listener(url: &str) -> anyhow::Result<()> {
    let mut listener = PgListener::connect(url).await?;
    listener.listen("chat_updated").await?;
    listener.listen("chat_message_created").await?;

    let mut stream = listener.into_stream();

    tokio::spawn(async move {
        while let Some(Ok(notification)) = stream.next().await {
            info!("Received notification: {:?}", notification);
        }
    });
    Ok(())
}

async fn index_handler() -> impl IntoResponse {
    Html(INDEX_HTML)
}
