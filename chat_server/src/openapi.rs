use axum::Router;
use chat_core::{Chat, ChatType, ChatUser, Message, User, Workspace};
use utoipa::{
    Modify, OpenApi,
    openapi::security::{HttpAuthScheme, HttpBuilder, SecurityScheme},
};
use utoipa_rapidoc::RapiDoc;
use utoipa_redoc::{Redoc, Servable};
use utoipa_swagger_ui::SwaggerUi;

use crate::{AppState, CreateChat, CreateMessage, ListMessages, SignInUser};
use crate::{ErrorOutput, handlers::*};

pub(crate) trait OpenapiRouter {
    fn openapi(self) -> Self;
}

#[derive(OpenApi)]
#[openapi(
        paths(
            signin_handler,
            signup_handler,
            list_chat_handler,
            create_chat_handler,
            get_chat_handler,
            list_messages_handler
        ),
        modifiers(&SecurityAddon),
        components(schemas(
            User, Chat, Message, ChatType, ChatUser, Workspace, SignInUser, CreateChat, AuthOutput, ErrorOutput, CreateMessage, ListMessages
        )),
        tags(
            (name = "chat", description = "Chat management API")
        )
    )]
pub(crate) struct ApiDoc;

struct SecurityAddon;

impl Modify for SecurityAddon {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        if let Some(components) = openapi.components.as_mut() {
            components.add_security_scheme(
                "token",
                SecurityScheme::Http(HttpBuilder::new().scheme(HttpAuthScheme::Bearer).build()),
            )
        }
    }
}

impl OpenapiRouter for Router<AppState> {
    fn openapi(self) -> Self {
        let api = ApiDoc::openapi();
        self.merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", api.clone()))
            .merge(Redoc::with_url("/redoc", api.clone()))
            .merge(RapiDoc::new("/api-docs/openapi.json").path("/rapidoc"))
    }
}
