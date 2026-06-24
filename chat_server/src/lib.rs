mod config;
mod error;
mod handlers;
mod middlewares;
mod models;

use anyhow::Context;
use chat_core::{
    DecodingKey, EncodingKey, User,
    middlewares::{TokenVerifier, set_layer, verify_token},
};
use handlers::*;
use sqlx::PgPool;
use std::{ops::Deref, sync::Arc};
use tokio::fs;

pub use error::{AppError, ErrorOutput};
pub use models::*;

use axum::{
    Router,
    middleware::from_fn_with_state,
    routing::{get, post},
};
pub use config::AppConfig;

use crate::middlewares::verify_chat;

#[derive(Debug, Clone)]
pub(crate) struct AppState {
    inner: Arc<AppStateInner>,
}

#[derive(Debug)]
pub(crate) struct AppStateInner {
    pub(crate) config: AppConfig,
    pub(crate) dk: DecodingKey,
    pub(crate) ek: EncodingKey,
    pub(crate) db_pool: PgPool,
}

pub async fn get_router(config: AppConfig) -> Result<Router, AppError> {
    let state = AppState::try_new(config).await?;

    let chat = Router::new()
        .route(
            "/{id}",
            get(get_chat_handler)
                .patch(update_chat_handler)
                .delete(delete_chat_handler)
                .post(send_message_handler),
        )
        .route("/{id}/messages", get(list_messages_handler))
        .layer(from_fn_with_state(state.clone(), verify_chat))
        .route("/", get(list_chat_handler).post(create_chat_handler));

    let api = Router::new()
        .route("/users", get(list_chat_users_handler))
        .nest("/chats", chat)
        .route("/upload", post(upload_handler))
        .route("/files/{ws_id}/{*path}", get(download_file_handler))
        .layer(from_fn_with_state(state.clone(), verify_token::<AppState>))
        // 路由不需要验证token
        .route("/signin", post(signin_handler))
        .route("/signup", post(signup_handler));

    let app = Router::new()
        .route("/", get(index_handler))
        .nest("/api", api)
        .with_state(state);

    Ok(set_layer(app))
}

impl Deref for AppState {
    type Target = AppStateInner;

    fn deref(&self) -> &Self::Target {
        &self.inner
    }
}

impl TokenVerifier for AppState {
    type Error = AppError;

    fn verify(&self, token: &str) -> Result<User, Self::Error> {
        Ok(self.dk.verify(token)?)
    }
}

impl AppState {
    pub async fn try_new(config: AppConfig) -> Result<Self, AppError> {
        fs::create_dir_all(&config.server.base_dir)
            .await
            .context("create base dir failed")?;
        let dk = DecodingKey::load(&config.auth.pk).context("load pk failed")?;
        let ek = EncodingKey::load(&config.auth.sk).context("load sk failed")?;
        let db_pool = PgPool::connect(&config.server.db_url)
            .await
            .context("db connection failed")?;

        Ok(Self {
            inner: Arc::new(AppStateInner {
                config,
                dk,
                ek,
                db_pool,
            }),
        })
    }
}

#[cfg(test)]
impl AppState {
    pub async fn try_new_with_pool(pool: PgPool) -> Result<Self, AppError> {
        let config = AppConfig::load()?;
        let dk = DecodingKey::load(&config.auth.pk).context("load pk failed")?;
        let ek = EncodingKey::load(&config.auth.sk).context("load sk failed")?;
        Ok(Self {
            inner: Arc::new(AppStateInner {
                config,
                dk,
                ek,
                db_pool: pool, // 直接使用传入的测试数据库连接池
            }),
        })
    }
}
