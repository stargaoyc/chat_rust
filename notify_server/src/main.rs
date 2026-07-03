use anyhow::Result;
use notify_server::{get_router, set_up_listener};
use tokio::net::TcpListener;
use tracing::{info, level_filters::LevelFilter};
use tracing_subscriber::{fmt::Layer, prelude::*};

#[tokio::main]
async fn main() -> Result<()> {
    let layer = Layer::new().pretty().with_filter(LevelFilter::INFO);
    tracing_subscriber::registry().with(layer).init();

    let addr = "0.0.0.0:6687";
    let (app, state) = get_router();

    set_up_listener(state).await?;

    let listener = TcpListener::bind(&addr).await?;
    info!("listen_addr: {}", addr);

    axum::serve(listener, app).await?;
    Ok(())
}
