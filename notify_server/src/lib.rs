mod sse;

pub(crate) use sse::sse_handler;

use axum::{
    Router,
    response::{Html, IntoResponse},
    routing::get,
};

const INDEX_HTML: &str = include_str!("../index.html");

pub fn get_router() -> Router {
    Router::new()
        .route("/", get(index_handler))
        .route("/events", get(sse_handler))
}

async fn index_handler() -> impl IntoResponse {
    Html(INDEX_HTML)
}
