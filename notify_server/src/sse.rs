use std::{convert::Infallible, time::Duration};

use axum::{
    Extension,
    extract::State,
    response::{Sse, sse::Event},
};
use axum_extra::{TypedHeader, headers};
use chat_core::User;
use tokio::sync::broadcast;
use tokio_stream::{Stream, StreamExt, wrappers::BroadcastStream};
use tracing::info;

use crate::{AppEvent, AppState};

const CHANNEL_SIZE: usize = 256;

pub(crate) async fn sse_handler(
    Extension(user): Extension<User>,
    State(state): State<AppState>,
    TypedHeader(user_agent): TypedHeader<headers::UserAgent>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    info!("`{}` connected", user_agent.as_str());

    let user_id = user.id as u64;
    let users = &state.users;

    let rx = if let Some(tx) = users.get(&user_id) {
        tx.subscribe()
    } else {
        let (tx, rx) = broadcast::channel(CHANNEL_SIZE);
        users.insert(user_id, tx);
        rx
    };

    let stream = BroadcastStream::new(rx)
        .filter_map(|v| v.ok())
        .map(|event| {
            let name = match event.as_ref() {
                AppEvent::NewChat(_) => "NewChat",
                AppEvent::AddToChat(_) => "AddToChat",
                AppEvent::RemoveFromChat(_) => "RemoveFromChat",
                AppEvent::NewMessage(_) => "NewMessage",
            };
            let v = serde_json::to_string(&event).expect("Failed to serialize event");
            Ok(Event::default().data(v).event(name))
        });

    Sse::new(stream).keep_alive(
        axum::response::sse::KeepAlive::new()
            .interval(Duration::from_secs(1))
            .text("keep-alive-text"),
    )
}
