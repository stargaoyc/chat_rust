# chat - Rust 多人聊天应用

## 项目概述

**chat** 是一个基于 Rust + React 构建的完整多人聊天应用，采用 Workspace 架构组织用户与对话。后端由三个 Rust crate 组成：`chat_server` 提供 REST API 服务，`notify_server` 通过 SSE 推送实时通知，`chat_core` 封装共享模型与中间件；前端 `chat_web` 基于 React 19 + TanStack 全家桶 + Tailwind CSS 4 构建现代实时聊天界面。后端使用 PostgreSQL 存储，利用数据库触发器 + `LISTEN/NOTIFY` 实现消息实时推送，是 Rust Web 全栈开发的综合实践项目。

### 主要技术栈

**后端 (Rust)**:
- **语言**: Rust (Edition 2024)
- **Web 框架**: `axum` (HTTP, multipart, query, tracing)
- **数据库**: `sqlx` (PostgreSQL, 异步, 编译期 SQL 检查)
- **认证**: `jwt-simple` (Ed25519 / EdDSA 签名)
- **密码哈希**: `argon2`
- **实时通知**: SSE (Server-Sent Events) + PostgreSQL `LISTEN/NOTIFY`
- **API 文档**: `utoipa` (OpenAPI 3.0, Swagger UI / ReDoc / RapiDoc)
- **中间件**: `tower-http` (压缩, CORS, 追踪, 静态文件, 请求体限制)
- **序列化**: `serde` / `serde_json` / `serde_yaml`
- **错误处理**: `thiserror` / `anyhow`
- **日志追踪**: `tracing` / `tracing-subscriber`
- **时间处理**: `chrono`
- **并发容器**: `dashmap`

**前端 (React)**:
- **框架**: React 19 + TypeScript 7
- **构建**: Vite 8 (Rolldown) + React Compiler
- **路由**: TanStack Router 1.170 (文件路由, 自动代码分割)
- **数据**: TanStack Query 5.101 (缓存, 乐观更新, 无限滚动)
- **样式**: Tailwind CSS 4 (@theme 设计系统)
- **校验**: Zod 4
- **状态**: Zustand 5 (客户端 UI 状态)
- **HTTP**: ky 2 (401 自动刷新)
- **实时**: @microsoft/fetch-event-source (SSE, 指数退避重连)
- **虚拟列表**: react-virtuoso 4
- **包管理**: pnpm

## 项目结构

```
chat/
├── Cargo.toml                # Workspace 定义
├── migrations/               # 数据库迁移
│   ├── 20260526144615_inital.sql    # 初始表结构
│   └── 20260623143206_triggers.sql  # LISTEN/NOTIFY 触发器
├── chat_core/                # 共享库 crate
│   ├── src/
│   │   ├── lib.rs            # 核心模型 (User, Chat, Message, Workspace, ChatType)
│   │   ├── utils/
│   │   │   ├── mod.rs
│   │   │   └── jwt.rs        # JWT 签发与验证 (Ed25519)
│   │   └── middlewares/
│   │       ├── mod.rs        # 中间件组合 (tracing, 压缩, request_id, server_time)
│   │       ├── auth.rs       # JWT 认证中间件 (verify_token)
│   │       ├── request_id.rs # x-request-id 中间件 (UUID v7)
│   │       └── server_time.rs# x-server-time 中间件 (处理耗时 μs)
│   └── fixtures/
│       ├── encoding.pem      # Ed25519 私钥
│       └── decoding.pem      # Ed25519 公钥
├── chat_server/              # REST API 服务器 (端口 6688)
│   ├── src/
│   │   ├── main.rs           # 入口: 加载配置, 绑定 TCP, 启动服务
│   │   ├── lib.rs            # AppState, 路由定义, CORS
│   │   ├── config.rs         # AppConfig: YAML 配置加载
│   │   ├── error.rs          # AppError 枚举 + IntoResponse
│   │   ├── openapi.rs        # OpenAPI 文档配置
│   │   ├── handlers/
│   │   │   ├── mod.rs        # 路由处理函数 re-exports
│   │   │   ├── auth.rs       # 注册/登录处理
│   │   │   ├── chat.rs       # 聊天 CRUD 处理
│   │   │   ├── message.rs    # 消息发送/列表/文件上传下载
│   │   │   └── workspace.rs  # 工作空间用户列表
│   │   ├── middlewares/
│   │   │   └── chat.rs       # 聊天成员验证中间件
│   │   └── models/
│   │       ├── mod.rs        # ChatFile 结构体, re-exports
│   │       ├── user.rs       # 用户模型与 DB 操作
│   │       ├── chat.rs       # 聊天模型与 DB 操作
│   │       ├── messages.rs   # 消息模型与 DB 操作
│   │       ├── workspace.rs  # 工作空间 DB 操作
│   │       └── file.rs       # 文件模型 (SHA-256 哈希, 路径, URL)
│   ├── chat.yaml             # 服务器配置
│   └── fixtures/
│       └── test.sql          # 测试种子数据
├── notify_server/            # SSE 实时通知服务器 (端口 6687)
│   ├── src/
│   │   ├── main.rs           # 入口: 绑定 0.0.0.0:6687
│   │   ├── lib.rs            # AppState, 路由, SSE handler, CORS
│   │   ├── config.rs         # AppConfig: YAML 配置加载
│   │   ├── error.rs          # AppError
│   │   ├── sse.rs            # SSE handler: 按用户广播通道
│   │   └── notify.rs         # PgListener: 监听 PostgreSQL NOTIFY
│   ├── notify.yaml           # 服务器配置
│   └── index.html            # SSE 测试页面 (JavaScript EventSource)
├── chat_web/                 # Web 前端 (React + TypeScript + Vite)
│   ├── src/
│   │   ├── app.tsx           # 根组件: QueryClient + Router + SSE 事件分发
│   │   ├── index.css         # Tailwind v4 设计系统 (@theme + 组件类)
│   │   ├── api/              # API 客户端 (ky + 401 自动刷新)
│   │   ├── hooks/            # TanStack Query hooks (数据层)
│   │   ├── components/       # UI 组件
│   │   │   ├── chat/         # chat-list, chat-header (搜索/设置)
│   │   │   ├── message/      # message-item, message-list (虚拟滚动), message-input (拖放)
│   │   │   └── common/       # connection-indicator (SSE 状态灯)
│   │   ├── routes/           # TanStack Router 文件路由
│   │   ├── schemas/          # Zod 表单校验
│   │   ├── stores/           # Zustand 全局状态
│   │   ├── lib/              # 工具函数 (auth, cn, format, sse)
│   │   └── types/            # TypeScript 类型
│   ├── DESIGN.md             # 前端设计文档 (设计系统/数据流/缓存策略)
│   ├── README.md             # 前端说明文档
│   ├── vite.config.ts        # Vite 8 + React Compiler + Tailwind v4
│   └── package.json          # pnpm 依赖
└── chat_test/                # 集成测试 crate
    ├── src/
    │   └── lib.rs
    └── tests/
        └── chat.rs           # 端到端集成测试
```

## 架构详解

### 整体架构

```
┌──────────────────┐  HTTP REST   ┌──────────────┐
│    chat_web      │ ──────────── │  chat_server │ (port 6688)
│  React + Vite    │              │    (axum)    │
│                  │  SSE 连接    ├──────────────┤
│                  │ ──────────── │notify_server │ (port 6687)
└──────────────────┘              └──────┬───────┘
                                         │ PgListener
                                         ▼
                                  ┌──────────────┐
                                  │  PostgreSQL   │
                                  │  (LISTEN/    │
                                  │   NOTIFY)    │
                                  └──────────────┘
```

前端 `chat_web` 通过 REST API 与 `chat_server` 交互（注册、登录、创建聊天、发送消息、上传文件等），同时与 `notify_server` 建立 SSE 连接接收实时通知。数据库触发器在数据变更时通过 `pg_notify` 发送通知，`notify_server` 的 `PgListener` 监听并推送给对应用户。

### chat_web - Web 前端

基于 React 19 + TypeScript 7 + Vite 8 构建的实时聊天 Web 客户端。

**核心技术**:
- **TanStack Router** — 文件系统路由，自动代码分割，intent 预加载
- **TanStack Query** — 服务端状态缓存，乐观更新，无限滚动，SSE 增量缓存更新
- **React Compiler** — 编译时自动 useMemo/useCallback 优化
- **Tailwind CSS 4** — @theme 设计系统，组件类 (.btn-primary, .input, .card)
- **Zod** — 表单运行时校验（登录/注册/创建聊天/发送消息）
- **react-virtuoso** — 虚拟滚动消息列表，支持向上加载更多且保持滚动位置
- **SSE + 指数退避重连** — @microsoft/fetch-event-source，连接状态指示器

**核心机制**:
- **乐观更新**: 发送消息时立即插入临时消息（id = 负数时间戳），后端确认后替换为真实消息，失败则回滚
- **增量缓存更新**: SSE 推送 NewChat/NewMessage 时直接 setQueryData 追加，不触发全量 invalidateQueries
- **401 Token 自动刷新**: ky hooks 拦截 401，静默刷新 token 并重试原请求
- **文件上传**: 逐文件 XHR POST multipart，下载用 fetch + Blob

详见 [chat_web/DESIGN.md](chat_web/DESIGN.md) 获取完整的前端设计文档。

### chat_core - 共享库

定义核心数据模型与可复用中间件：

- **数据模型**: `User`, `ChatUser`, `Workspace`, `Chat`, `ChatType`, `Message`
- **JWT 工具**: 使用 Ed25519 密钥对签发/验证令牌（7 天有效期，签发者 `chat_server`，受众 `chat_web`）
- **中间件**:
  - `verify_token` - JWT 认证，支持 `Authorization: Bearer` 头和 `?access_token=` 查询参数，将 `User` 注入请求扩展
  - `set_request_id` - 分配 UUID v7 作为 `x-request-id`
  - `ServerTimeLayer` - 记录处理耗时（μs）写入 `x-server-time`
  - `set_layer` - 组合所有中间件层（tracing, 压缩, request_id, server_time）

### chat_server - REST API 服务器

提供完整的聊天 REST API，端口 `6688`。

#### API 路由

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/signup` | 注册新用户 | 否 |
| POST | `/api/signin` | 登录（邮箱 + 密码） | 否 |
| GET | `/api/users` | 列出工作空间用户 | 是 |
| GET | `/api/chats` | 列出工作空间聊天 | 是 |
| POST | `/api/chats` | 创建聊天 | 是 |
| GET | `/api/chats/{id}` | 获取聊天详情 | 是 + 成员 |
| PATCH | `/api/chats/{id}` | 更新聊天 | 是 + 成员 |
| DELETE | `/api/chats/{id}` | 删除聊天 | 是 + 成员 |
| POST | `/api/chats/{id}` | 发送消息 | 是 + 成员 |
| GET | `/api/chats/{id}/messages` | 获取消息列表（游标分页） | 是 + 成员 |
| POST | `/api/upload` | 上传文件（multipart） | 是 |
| GET | `/api/files/{ws_id}/{*path}` | 下载文件（流式 + MIME 推断） | 是 |

OpenAPI 文档: `/swagger-ui`, `/redoc`, `/rapidoc`

#### 核心机制

- **聊天类型自动判定**: 2 人 + 无名称 → `Single`；>2 人 + 无名称 → `Group`；有名称 → `PublicChannel` 或 `PrivateChannel`
- **文件存储**: 按 SHA-256 哈希内容寻址，路径 `{base_dir}/{ws_id}/{hash[0..3]}/{hash[3..6]}/{hash[6..]}.{ext}`
- **消息分页**: 游标分页（`last_id` + `limit`，最大 100 条），按 id 降序
- **密码哈希**: Argon2id

### notify_server - 实时通知服务器

通过 SSE 推送实时通知，端口 `6687`。

- 每个认证用户对应一个 `broadcast::Sender`，存储在 `DashMap` 中
- `PgListener` 监听 PostgreSQL 通知通道：`chat_updated`、`chat_message_created`
- 事件类型: `NewChat`, `AddToChat`, `RemoveFromChat`, `NewMessage`
- 仅验证令牌（无签发能力），使用公钥验证
- 内置 `index.html` 测试页面（JavaScript `EventSource` 客户端）

## 数据库设计

### 表结构

```sql
-- 工作空间
workspaces (id, name, owner_id → users, created_at)

-- 用户
users (id, ws_id → workspaces, fullname, email, password_hash, created_at)

-- 聊天
chats (id, ws_id → workspaces, name, type chat_type, members BIGINT[], created_at)

-- 消息
messages (id, chat_id → chats, sender_id → users, content, files TEXT[], created_at)
```

- `chat_type` 枚举: `single`, `group`, `public_channel`, `private_channel`
- 默认种子: 超级用户 (id=0) + 默认工作空间 (id=0)
- 索引: `email_idx` (users.email), `chat_id_idx` (messages.chat_id, created_at DESC), `sender_id_idx` (messages.sender_id, created_at DESC)

### 触发器（实时通知核心）

```sql
-- 聊天变更通知
add_to_chat_trigger: AFTER INSERT OR UPDATE OR DELETE ON chats
  → pg_notify('chat_updated', {op, old, new})

-- 新消息通知
add_to_message_trigger: AFTER INSERT ON messages
  → pg_notify('chat_message_created', {message, members})
```

触发器是实时通知的核心：数据库写入触发 `pg_notify`，`notify_server` 通过 `PgListener` 接收并推送给 SSE 客户端。

## 构建与运行

### 前置条件

- Rust stable 工具链
- PostgreSQL 14+
- 数据库迁移: `sqlx migrate run`

### 配置

复制并编辑配置文件：

```bash
# chat_server 配置
cp chat_server/chat.yaml chat_server/chat.yaml.local
# 编辑 db_url, port, base_dir, auth 密钥等

# notify_server 配置
cp notify_server/notify.yaml notify_server/notify.yaml.local
# 编辑 db_url, port, auth 公钥等
```

配置加载顺序: 默认路径 → `/etc/config/chat.yaml` → `$CHAT_CONFIG` 环境变量

### 构建项目

```bash
cargo build            # 调试构建
cargo build --release  # 发布构建
```

### 运行服务

```bash
# 启动 API 服务器
cargo run -p chat_server

# 启动通知服务器
cargo run -p notify_server

# 启动前端开发服务器
cd chat_web && pnpm install && pnpm dev
```

前端默认监听 `http://localhost:5173`，连接后端 `chat_server:6688` 和 `notify_server:6687`。

### API 使用示例

```bash
# 注册
curl -X POST http://localhost:6688/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret", "fullname": "Test User", "workspace": "my-ws"}'

# 登录
curl -X POST http://localhost:6688/api/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "secret"}'

# 创建聊天（需 Bearer token）
curl -X POST http://localhost:6688/api/chats \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"members": [1, 2]}'

# 发送消息
curl -X POST http://localhost:6688/api/chats/1 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello!"}'

# SSE 连接（接收实时通知）
# 浏览器打开 http://localhost:6687/ 或使用 EventSource API
```

### 运行测试

```bash
cargo test                # 运行单元测试
cargo nextest run         # 使用 nextest 运行测试
cargo nextest run --all-features  # 包含集成测试
```

单元测试使用 `sqlx::test` 宏语与真实 PostgreSQL 数据库。

## 开发规范

### 代码风格

- 使用 `cargo fmt` 格式化代码
- 使用 `cargo clippy` 进行代码检查，所有警告视为错误 (`-D warnings`)

### Pre-commit Hooks

项目配置了以下 pre-commit 检查：

1. **通用检查**: 文件编码、大小写冲突、合并冲突、YAML 格式、行尾空格
2. **Rust 检查**:
   - `cargo fmt -- --check` - 代码格式检查
   - `cargo deny check -d` - 依赖安全检查
   - `typos` - 拼写检查
   - `cargo check --all` - 编译检查
   - `cargo clippy --all-targets --all-features --tests --benches -- -D warnings` - 代码质量检查
   - `cargo nextest run --all-features --no-tests pass` - 单元测试

### 提交规范

项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feature:` - 新功能
- `fix:` - Bug 修复
- `doc:` - 文档更新
- `perf:` - 性能优化
- `refactor:` - 代码重构
- `style:` - 代码风格
- `test:` - 测试相关
- `chore:` - 其他杂项

使用 `git-cliff` 自动生成 CHANGELOG。

## CI/CD

GitHub Actions (`build.yml`)：

- **触发条件**: push 到 master / tag (`v*`) / PR 到 master
- **服务**: PostgreSQL 14.5
- **步骤**: `cargo fmt -- --check` → `cargo check --all` → `cargo clippy` → `cargo nextest run`
- **发布**: tag push 时自动生成 CHANGELOG 并创建 GitHub Release

## 依赖安全

使用 `cargo-deny` 进行依赖检查，配置文件 `deny.toml`：

- 安全漏洞: `deny`
- 维护状态: `warn`
- 许可证白名单: MIT, Apache-2.0, Apache-2.0 WITH LLVM-exception, MPL-2.0, BSD-2-Clause, BSD-3-Clause, ISC, CC0-1.0, Unicode-3.0

## 相关链接

- [axum 文档](https://docs.rs/axum/)
- [sqlx 文档](https://docs.rs/sqlx/)
- [jwt-simple 文档](https://docs.rs/jwt-simple/)
- [tower-http 文档](https://docs.rs/tower-http/)
- [utoipa 文档](https://docs.rs/utoipa/)
- [serde 文档](https://serde.rs/)
- [thiserror 文档](https://docs.rs/thiserror/)
- [anyhow 文档](https://docs.rs/anyhow/)
- [tracing 文档](https://docs.rs/tracing/)
- [chrono 文档](https://docs.rs/chrono/)
- [dashmap 文档](https://docs.rs/dashmap/)
- [argon2 文档](https://docs.rs/argon2/)
- [git-cliff](https://git-cliff.org/)
- [cargo-deny](https://embarkstudios.github.io/cargo-deny/)
- [Conventional Commits](https://www.conventionalcommits.org/)
