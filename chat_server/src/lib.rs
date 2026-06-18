mod config;
mod error;
mod handlers;
mod middlewares;
mod models;
mod utils;

use anyhow::Context;
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

use crate::{
    middlewares::{set_layer, verify_token},
    utils::{DecodingKey, EncodingKey},
};

#[derive(Debug, Clone)]
pub(crate) struct AppState {
    inner: Arc<AppStateInner>,
}

#[allow(dead_code)]
#[derive(Debug)]
pub(crate) struct AppStateInner {
    pub(crate) config: AppConfig,
    pub(crate) dk: DecodingKey,
    pub(crate) ek: EncodingKey,
    pub(crate) db_pool: PgPool,
}

pub async fn get_router(config: AppConfig) -> Result<Router, AppError> {
    let state = AppState::try_new(config).await?;

    let api = Router::new()
        .route("/users", get(list_chat_users_handler))
        .route("/chats", get(list_chat_handler).post(create_chat_handler))
        .route(
            "/chats/{id}",
            get(get_chat_handler)
                .patch(update_chat_handler)
                .delete(delete_chat_handler)
                .post(send_message_handler),
        )
        .route("/chats/{id}/messages", get(list_messages_handler))
        .route("/upload", post(upload_handler))
        .route("/files/{ws_id}/{*path}", get(download_file_handler))
        .layer(from_fn_with_state(state.clone(), verify_token))
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
    pub async fn try_new_with_pool(config: AppConfig, pool: PgPool) -> Result<Self, AppError> {
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
