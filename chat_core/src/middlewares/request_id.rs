use axum::{extract::Request, http::HeaderValue, middleware::Next, response::Response};
use tracing::warn;

use super::REQUEST_ID_HEADER;

pub async fn set_request_id(mut req: Request, next: Next) -> Response {
    // if x-request-id is not set, set it
    let id = match req.headers().get(REQUEST_ID_HEADER) {
        Some(id) => Some(id.clone()),
        None => {
            let request_id = uuid::Uuid::now_v7().to_string();
            match HeaderValue::from_str(&request_id) {
                Ok(uuid) => {
                    req.headers_mut().insert(REQUEST_ID_HEADER, uuid.clone());
                    Some(uuid)
                }
                Err(e) => {
                    warn!("Failed to generate request id: {}", e);
                    None
                }
            }
        }
    };
    let mut resp = next.run(req).await;
    if let Some(id) = id {
        resp.headers_mut().insert(REQUEST_ID_HEADER, id);
    }
    resp
}
