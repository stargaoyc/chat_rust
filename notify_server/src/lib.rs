mod config;
mod error;
mod notify;
mod sse;

use std::{ops::Deref, sync::Arc};

use axum::{
    Router,
    http::{HeaderName, HeaderValue, Method},
    middleware::from_fn_with_state,
    response::{Html, IntoResponse},
    routing::get,
};
use chat_core::{
    DecodingKey, User,
    middlewares::{TokenVerifier, verify_token},
};
use dashmap::DashMap;
use tower_http::cors::CorsLayer;

use tokio::sync::broadcast;

pub use config::AppConfig;
pub use error::AppError;
pub(crate) use sse::sse_handler;

pub use notify::{AppEvent, set_up_listener};

pub type UserMap = Arc<DashMap<u64, broadcast::Sender<Arc<AppEvent>>>>;

#[derive(Clone)]
pub struct AppState(Arc<AppStateInner>);

pub struct AppStateInner {
    pub config: AppConfig,
    pub users: UserMap,
    dk: DecodingKey,
}

const INDEX_HTML: &str = include_str!("../index.html");

pub async fn get_router() -> anyhow::Result<Router> {
    let config = AppConfig::load().expect("Failed to load configuration");
    let state = AppState::new(config);
    set_up_listener(state.clone()).await?;

    let cors = CorsLayer::new()
        .allow_origin([
            "http://localhost:5173".parse::<HeaderValue>().unwrap(),
            "http://localhost:5175".parse::<HeaderValue>().unwrap(),
        ])
        .allow_methods([Method::GET, Method::OPTIONS])
        .allow_headers([
            HeaderName::from_static("authorization"),
            HeaderName::from_static("content-type"),
            HeaderName::from_static("accept"),
            HeaderName::from_static("x-requested-with"),
            HeaderName::from_static("last-event-id"),
        ])
        .allow_credentials(true);

    let app = Router::new()
        .route("/events", get(sse_handler))
        .layer(from_fn_with_state(state.clone(), verify_token::<AppState>))
        .route("/", get(index_handler))
        .layer(cors)
        .with_state(state.clone());
    Ok(app)
}

async fn index_handler() -> impl IntoResponse {
    Html(INDEX_HTML)
}

impl TokenVerifier for AppState {
    type Error = AppError;

    fn verify(&self, token: &str) -> Result<User, Self::Error> {
        Ok(self.dk.verify(token)?)
    }
}

impl Deref for AppState {
    type Target = AppStateInner;

    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl AppState {
    pub fn new(config: AppConfig) -> Self {
        let dk = DecodingKey::load(&config.auth.pk).expect("Failed to load decoding key");
        let users = Arc::new(DashMap::new());
        Self(Arc::new(AppStateInner { config, users, dk }))
    }
}
