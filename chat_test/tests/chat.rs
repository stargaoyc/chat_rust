use std::net::SocketAddr;

use anyhow::Result;
use chat_core::{Chat, ChatType, Message};
use chat_server::{AppState, get_router};
use futures::StreamExt;
use reqwest::multipart::{Form, Part};
use reqwest_eventsource::{Event, EventSource};
use serde::Deserialize;
use serde_json::json;
use sqlx::PgPool;
use tokio::net::TcpListener;

#[derive(Debug, Deserialize)]
struct AuthToken {
    token: String,
}

struct ChatServer {
    addr: SocketAddr,
    token: String,
    client: reqwest::Client,
}

struct NotifyServer;

const WILD_ADDR: &str = "0.0.0.0:0";

#[sqlx::test(
    migrations = "../migrations",
    fixtures("../../chat_server/fixtures/test.sql")
)]
pub fn chat_server_should_work(pool: PgPool) -> Result<()> {
    let state = AppState::try_new_with_pool(pool).await?;
    let chat_server = ChatServer::new(state).await?;
    NotifyServer::create(&chat_server.token).await?;
    let chat = chat_server.create_chat().await?;
    let _message = chat_server.create_message(chat.id as u64).await?;
    Ok(())
}

impl ChatServer {
    async fn new(state: AppState) -> Result<Self> {
        let app = get_router(state).await?;

        let listener = TcpListener::bind(WILD_ADDR).await?;
        let addr = listener.local_addr()?;

        tokio::spawn(async move {
            if let Err(e) = axum::serve(listener, app).await {
                println!("chat server start error: {:?}", e);
            }
        });

        tokio::time::sleep(std::time::Duration::from_secs(1)).await;

        let client = reqwest::Client::new();

        let mut ret = Self {
            addr,
            token: "".to_string(),
            client,
        };

        let token = ret.signin().await?;

        ret.token = token;

        Ok(ret)
    }

    async fn signin(&self) -> Result<String> {
        let ret = self
            .client
            .post(format!("http://{}/api/signin", self.addr))
            .header("Content-Type", "application/json")
            .body(r#"{"email": "user1@example.com", "password": "testpassword"}"#)
            .send()
            .await?;
        assert_eq!(ret.status(), reqwest::StatusCode::OK);
        let ret: AuthToken = ret.json().await?;

        Ok(ret.token)
    }

    async fn create_chat(&self) -> Result<Chat> {
        let ret = self
            .client
            .post(format!("http://{}/api/chats", self.addr))
            .header("Content-Type", "application/json")
            .header("Authorization", format!("Bearer {}", self.token))
            .body(r#"{"name": "Test Chat", "members": [1, 2, 3], "public": true}"#)
            .send()
            .await?;
        assert_eq!(ret.status(), reqwest::StatusCode::CREATED);
        let ret: Chat = ret.json().await?;

        assert_eq!(ret.name.as_ref().unwrap(), "Test Chat");
        assert_eq!(ret.members, vec![1, 2, 3]);
        assert_eq!(ret.r#type, ChatType::PublicChannel);

        Ok(ret)
    }

    async fn create_message(&self, chat_id: u64) -> Result<Message> {
        // 上传文件
        let data = include_bytes!("../Cargo.toml");
        let file = Part::bytes(data)
            .file_name("Cargo.toml")
            .mime_str("text/plain")?;

        let form = Form::new().part("file", file);

        let ret = self
            .client
            .post(format!("http://{}/api/upload", self.addr))
            .header("Authorization", format!("Bearer {}", self.token))
            .multipart(form)
            .send()
            .await?;
        assert_eq!(ret.status(), reqwest::StatusCode::OK);
        let files: Vec<String> = ret.json().await?;

        let body = serde_json::to_string(&json!(
            {
                "content": "Hello",
                "files": files
            }
        ))?;
        let ret = self
            .client
            .post(format!("http://{}/api/chats/{}", self.addr, chat_id))
            .header("Content-Type", "application/json")
            .header("Authorization", format!("Bearer {}", self.token))
            .body(body)
            .send()
            .await?;
        assert_eq!(ret.status(), reqwest::StatusCode::CREATED);
        let message: Message = ret.json().await?;

        assert_eq!(message.content, "Hello");
        assert_eq!(message.files, files);
        assert_eq!(message.sender_id, 1);
        assert_eq!(message.chat_id, chat_id as i64);

        Ok(message)
    }
}

impl NotifyServer {
    async fn create(token: &str) -> Result<()> {
        let app = notify_server::get_router().await?;

        let listener = TcpListener::bind(WILD_ADDR).await?;
        let addr = listener.local_addr()?;

        tokio::spawn(async move {
            if let Err(e) = axum::serve(listener, app).await {
                println!(" notify server start error: {:?}", e);
            }
        });

        let mut es = EventSource::get(format!("http://{}/events?access_token={}", addr, token));

        tokio::spawn(async move {
            while let Some(event) = es.next().await {
                match event {
                    Ok(Event::Open) => println!("Connection opened"),
                    Ok(Event::Message(message)) => match message.event.as_str() {
                        "NewChat" => {
                            let chat: Chat = serde_json::from_str(&message.data).unwrap();
                            assert_eq!(chat.name.as_ref().unwrap(), "Test Chat");
                            assert_eq!(chat.members, vec![1, 2, 3]);
                            assert_eq!(chat.r#type, ChatType::PublicChannel);
                        }
                        "NewMessage" => {
                            let message: Message = serde_json::from_str(&message.data).unwrap();
                            assert_eq!(message.content, "Hello");
                            assert_eq!(message.files.len(), 1);
                            assert_eq!(message.sender_id, 1);
                            assert_eq!(message.chat_id, 5);
                        }
                        _ => {
                            panic!("Unknown event type: {}", message.event);
                        }
                    },
                    Err(e) => {
                        println!("event source error: {:?}", e);
                        es.close();
                    }
                }
            }
        });

        Ok(())
    }
}
