use anyhow::Result;
use chat::{AppConfig, get_router};
use tokio::net::TcpListener;
use tracing::{info, level_filters::LevelFilter};
use tracing_subscriber::{fmt::Layer, prelude::*};

#[tokio::main]
async fn main() -> Result<()> {
    let layer = Layer::new().pretty().with_filter(LevelFilter::INFO);
    tracing_subscriber::registry().with(layer).init();

    let config = AppConfig::load()?;
    let addr = format!("0.0.0.0:{}", config.server.port);

    let app = get_router(config);

    let listener = TcpListener::bind(&addr).await?;
    info!("listen_addr: {}", addr);

    axum::serve(listener, app).await?;
    Ok(())
}
