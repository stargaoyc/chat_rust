use anyhow::Result;
use chat_server::{AppConfig, AppState, get_router};
use tokio::net::TcpListener;
use tracing::{info, level_filters::LevelFilter};
use tracing_subscriber::{fmt::Layer, prelude::*};

#[tokio::main]
async fn main() -> Result<()> {
    let layer = Layer::new().pretty().with_filter(LevelFilter::INFO);
    tracing_subscriber::registry().with(layer).init();

    let config = AppConfig::load()?;
    let addr = format!("0.0.0.0:{}", config.server.port);

    let state = AppState::try_new(config).await?;
    let app = get_router(state).await?;

    let listener = TcpListener::bind(&addr).await?;
    info!("listen_addr: {}", addr);

    axum::serve(listener, app).await?;
    Ok(())
}
