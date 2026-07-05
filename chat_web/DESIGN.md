# chat_web 前端设计文档

## 1. 一句话概括

chat_web 是一个基于 **React 19 + TypeScript 7 + TanStack 全家桶 + Tailwind CSS 4** 构建的现代实时聊天 Web 应用，与 Rust 后端（chat_server + notify_server）配合，提供完整的多人聊天体验。

---

## 2. 技术栈一览

| 分类 | 技术 | 版本 | 干什么用 |
|------|------|------|----------|
| **框架** | React | 19.2.x | UI 渲染 |
| **类型** | TypeScript | 7.0 | 类型安全 |
| **构建** | Vite | 8.1 | 开发服务器 + 生产打包（Rolldown） |
| **编译器** | React Compiler | 1.0 | 自动 useMemo/useCallback 优化 |
| **路由** | TanStack Router | 1.170 | 文件系统路由 + 自动代码分割 |
| **数据** | TanStack Query | 5.101 | 服务端状态缓存 + 无限滚动 + 乐观更新 |
| **样式** | Tailwind CSS | 4.3 | 原子化 CSS + @theme 设计系统 |
| **校验** | Zod | 4.4 | 表单 & 数据运行时校验 |
| **状态** | Zustand | 5.0 | 客户端全局状态（极简） |
| **HTTP** | ky | 2.0 | 请求客户端（401 自动刷新） |
| **实时** | @microsoft/fetch-event-source | 2.0 | SSE 连接（支持 POST + 自定义头） |
| **虚拟列表** | react-virtuoso | 4.18 | 大量消息高性能滚动 |
| **图标** | Lucide React | 1.23 | 轻量 SVG 图标 |
| **通知** | Sonner | 2.0 | Toast 消息提示 |
| **包管理** | pnpm | - | 快速磁盘高效安装 |

---

## 3. 页面与路由

应用采用 TanStack Router 的 **文件系统路由**，路由即文件：

```
src/routes/
├── __root.tsx              # 根壳：Outlet + Toaster（全局 Toast 容器）
├── _app.tsx                # 主布局：侧边栏 + SSE 连接 + 认证守卫
│   ├── index.tsx           # / 首页：欢迎语 + "选择一个对话开始聊天"
│   └── chat.$chatId.tsx    # /chat/:chatId 聊天详情页
└── _auth.tsx               # 认证布局：径向渐变背景 + 毛玻璃卡片
    ├── _auth.login.tsx     # /login 登录页
    └── _auth.register.tsx  # /register 注册页
```

### 认证守卫

`_app.tsx` 的 `beforeLoad` 钩子检查 `isAuthenticated()`，未登录自动重定向到 `/login`。刷新页面后 token 从 localStorage 恢复，不会丢失登录状态。

### 路由预加载

TanStack Router 配置了 `defaultPreload: 'intent'`，用户鼠标悬停在链接上时就开始预加载目标页面的数据，切换瞬间完成。

---

## 4. 设计系统（Tailwind v4 @theme）

所有设计 Token 集中定义在 `src/index.css` 的 `@theme` 块中，一处修改全局生效。

### 4.1 颜色

| Token | 色值 | 用途 |
|-------|------|------|
| `background` | `#f8f9fb` | 页面底色（极浅灰蓝） |
| `foreground` | `#1a1d23` | 主文字（深灰黑） |
| `card` | `#ffffff` | 卡片/面板底色 |
| `muted` | `#f1f3f6` | 次要背景（分割区域） |
| `muted-foreground` | `#5c6470` | 次要文字（提示、时间戳） |
| `primary` | `#4f46e5` | 主色 Indigo（按钮、链接、自己消息气泡） |
| `primary-hover` | `#4338ca` | 主色 hover 态 |
| `destructive` | `#dc2626` | 危险操作（删除） |
| `success` | `#16a34a` | 成功状态 |
| `warning` | `#f59e0b` | 警告状态 |
| `border` | `#e4e7ec` | 默认边框 |
| `ring` | `#c7d2fe` | 焦点环（Indigo 浅色） |
| `bubble-own` | `#4f46e5` | 自己的消息气泡 |
| `bubble-other` | `#ffffff` | 他人的消息气泡 |

### 4.2 圆角

| Token | 值 | 用途 |
|-------|-----|------|
| `sm` | 6px | 小元素（标签、badge） |
| `md` | 10px | 按钮、输入框 |
| `lg` | 14px | 卡片、面板 |
| `xl` | 20px | 大卡片、弹窗 |

### 4.3 组件类

`@layer components` 中定义了语义化的组件类，避免重复堆叠 utility：

| 类名 | 效果 |
|------|------|
| `.card` | 白底 + 边框 + 圆角 + 轻阴影 |
| `.btn` | 基础按钮（inline-flex、圆角、过渡） |
| `.btn-primary` | Indigo 填充按钮 + hover 变深 |
| `.btn-ghost` | 透明底按钮 + hover 灰底 |
| `.input` | 输入框（边框 + 聚焦环 + placeholder 色调） |
| `.label` | 表单标签（13px 加粗） |
| `.link` | 文字链接（Indigo 色 + hover 下划线） |

### 4.4 工具类

| 类名 | 效果 |
|------|------|
| `.glass` | 毛玻璃效果（85% 白底 + 12px 模糊） |
| `.animate-fade-in` | 淡入上滑动画（250ms） |
| `.animate-shimmer` | 骨架屏闪烁动画 |
| `.text-ellipsis` | 单行省略号 |

---

## 5. 核心页面设计

### 5.1 登录页 `/login`

```
┌────────────────────────────────────────────────┐
│            （径向渐变背景 #f8f9fb → Indigo）     │
│                                                │
│         ┌──────────────────────────┐           │
│         │   💬  (Indigo 图标 20px) │           │
│         │      Chat               │           │
│         │                         │  ← 毛玻璃卡片
│         │  📧  邮箱输入框          │           │
│         │  🔒  密码输入框          │           │
│         │                         │           │
│         │  [    登录按钮    ]      │           │
│         │                         │           │
│         │  没有账号？→ 注册        │           │
│         └──────────────────────────┘           │
└────────────────────────────────────────────────┘
```

- 背景：从 `#f8f9fb` 到 Indigo 的径向渐变
- 卡片：`.glass` 毛玻璃效果
- 图标：Lucide `MessageSquare`，20px，Indigo 色
- 输入框带图标前缀（`Mail` / `Lock`，16px）
- `autoComplete` 属性：`email` / `current-password`
- Zod 校验：邮箱格式 + 密码至少 6 字符

### 5.2 注册页 `/register`

与登录类似，额外增加：
- **姓名** 输入框（1-64 字符）
- **工作空间** 输入框（1-32 字符）
- 密码要求：至少 6 字符

### 5.3 主应用布局

```
┌──────────────────────────────────────────────────┐
│ ┌─────────────┐ ┌───────────────────────────────┐│
│ │  搜索框      │ │  聊天头部 (名称 + 成员数)      ││
│ │  ─────────── │ │  [搜索消息] [设置]            ││
│ │  📺 频道     │ │  ───────────────────────────││
│ │   # general  │ │                             ││
│ │   # random   │ │  消息列表 (虚拟滚动)          ││
│ │  👥 群组     │ │                             ││
│ │   项目组     │ │  ┌─────┐ 你好！              ││
│ │  💬 私信     │ │  │ 头像 │ 几点了？            ││
│ │   张三      │ │  └─────┘ 10:30               ││
│ │   李四      │ │                             ││
│ │  ─────────── │ │       ┌─────┐              ││
│ │  [+ 新建]    │ │  11:05 │ 头像 │ 好的！      ││
│ │             │ │        └─────┘              ││
│ └─────────────┘ │  ───────────────────────────││
│                  │  [📎 上传] [输入消息...] [➤] ││
│                  └───────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

#### 侧边栏（左侧）

- **搜索框**：实时过滤频道/群组/私信名称
- **分组列表**：
  - 📺 频道（公开 + 私密频道，`#` 前缀）
  - 👥 群组
  - 💬 私信（显示对方名字，非"用户 #1"）
- **新建按钮** `+`：打开创建对话弹窗
- 移动端可通过汉堡菜单折叠

#### 聊天区域（右侧）

- **头部**：聊天图标 + 名称 + 成员数 + 搜索/设置按钮
- **消息列表**：react-virtuoso 虚拟滚动
- **输入区**：textarea + 拖放上传 + 发送按钮

---

## 6. 消息系统详解

### 6.1 消息气泡

```
自己发的消息（靠右）：
                              10:30 你
                    ┌──────────────────┐
                    │  好的，收到！     │  ← Indigo 背景，白字
                    │  📎 report.pdf   │  ← 白色半透明链接
                    └──────────────────┘
                                         [头像]

他人消息（靠左）：
[头像]  张三 10:30
        ┌──────────────────┐
        │  你好，请查收。    │  ← 白色背景，深色字
        │  📎 report.pdf   │  ← Indigo 色链接
        └──────────────────┘
```

- 自己消息：`flex-row-reverse`，头像在右，气泡 Indigo
- 他人消息：正常 flex，头像在左，气泡白色带边框
- 头像：30×30 圆圈，Indigo 浅底 + 首字/首字母（支持中文取首字）
- 乐观消息：半透明 + "发送中..." 提示

### 6.2 虚拟滚动（react-virtuoso）

消息可能成千上万，不能全部渲染。react-virtuoso 只渲染可见区域 ± 缓冲区的消息：

- **向下滚动到顶** → 触发 `fetchNextPage` 加载更早消息
- **新消息到达** → 自动平滑滚动到底部（`followOutput="smooth"`）
- **`firstItemIndex` 偏移技巧**：初始值 1,000,000，加载更多历史时减小，保持滚动位置不跳动

### 6.3 乐观更新

点发送后，消息 **立即** 出现在界面上（临时 id = 负数时间戳），不等后端响应：

```
1. onMutate: 插入临时消息到 TanStack Query 缓存 → 界面立刻显示
2. onSuccess: 用后端返回的真实消息替换临时消息
3. onError: 移除临时消息，显示错误 Toast
```

### 6.4 SSE 实时推送

收到 `NewMessage` 事件后，**仅当 sender_id ≠ 当前用户** 时才插入缓存（自己的消息已由乐观更新处理，避免重复显示）。

---

## 7. 实时通信（SSE）

### 7.1 连接流程

```
登录成功 → _app.tsx 挂载 → connectSSE(handler)
         ↓
  fetch-Event-Source → POST http://localhost:6687/events
         ↓
  Authorization: Bearer <token>  ← 不暴露在 URL 中
         ↓
  接收事件流 → handleSSEEvent() 分发
```

### 7.2 事件分发

| 事件 | 处理 |
|------|------|
| `NewChat` | `appendChatToCache()` — 直接插入缓存，不重新请求 |
| `AddToChat` | `invalidateQueries(['chats', 'list'])` — 被添加到新对话，刷新列表 |
| `RemoveFromChat` | `removeChatFromCache()` — 从缓存移除 |
| `NewMessage` | `appendMessageToCache()` — 追加到消息缓存（跳过自己的） |

### 7.3 连接状态指示器

右下角小圆点：

| 状态 | 颜色 | 动画 |
|------|------|------|
| 已连接 | 🟢 绿色 | 无 |
| 重连中 | 🟡 黄色 | 脉冲闪烁 |
| 已断开 | 🔴 红色 | 无 |

### 7.4 重连策略

指数退避：1s → 2s → 4s → 8s → 16s → 30s（上限），防止服务端被冲击。

---

## 8. 数据缓存策略（TanStack Query）

### 8.1 核心 Cache Key 工厂

```typescript
chatKeys = {
  all:      ['chats'],
  list:     ['chats', 'list'],
  detail:   (id) => ['chats', 'detail', id],
}
```

### 8.2 缓存时效

| 数据 | staleTime | 理由 |
|------|-----------|------|
| 聊天列表 | 30s | 变化不频繁，SSE 增量更新 |
| 用户列表 | 60s | 很少变化 |
| 消息列表 | 0（默认） | 需要实时准确 |

### 8.3 增量 vs 全量更新

| 场景 | 策略 | 原因 |
|------|------|------|
| SSE 推送 NewChat | `setQueryData` 增量追加 | 避免整列表重新请求 |
| SSE 推送 NewMessage | `setQueryData` 增量追加 | 避免消息列表重新请求 |
| SSE 推送 AddToChat | `invalidateQueries` 全量刷新 | 被加入新对话，列表结构可能大变 |
| 发送消息成功 | `setQueryData` 替换临时消息 | 乐观更新的第二步 |
| 删除/更新聊天 | `invalidateQueries` 刷新列表 | 结构性变更 |

---

## 9. 认证流程

```
┌──────────┐   POST /signin    ┌──────────────┐
│  登录页  │ ─────────────────→ │  chat_server │
│          │ ← { token: "..." }│              │
└──────────┘                    └──────────────┘
     │
     ├─→ setAccessToken(token)  ← 存入内存 + localStorage
     ├─→ decodeToken(token)     ← 解析 JWT payload 为 User
     └─→ navigate('/')          ← 跳转主页

每次 API 请求：
     Authorization: Bearer <token>

401 自动刷新：
     响应 401 → POST /auth/refresh (credentials: include)
     ├─ 成功 → 用新 token 重试原请求
     └─ 失败 → clearAuth() → 跳转 /login
```

---

## 10. 文件上传/下载

### 上传

```
选择文件/拖放 → uploadFiles()
     │
     ├─→ 逐文件 XHR POST /upload
     │   FormData { file: <File> }
     │   Authorization: Bearer <token>
     │
     ├─→ 后端返回 ["/files/1/a/b/cdef.txt"]
     │
     └─→ 显示为标签：📎 cdef.txt  [✕ 删除]
```

- 使用 `XMLHttpRequest` 而非 `fetch`，确保 `Content-Type: multipart/form-data; boundary=...` 正确
- 后端按 SHA-256 内容寻址，相同内容不重复存储

### 下载

点击文件链接 → `fetch` 带 `Authorization` 头下载 Blob → 创建临时 `<a>` 触发浏览器下载 → 清理 Blob URL。

---

## 11. 表单校验（Zod）

所有表单使用 Zod schema 做运行时校验 + TypeScript 类型推导：

| 表单 | Schema | 字段 |
|------|--------|------|
| 登录 | `signinSchema` | email(合法邮箱) + password(≥6字符) |
| 注册 | `signupSchema` | fullname(1-64) + email + workspace(1-32) + password(6-97) |
| 创建对话 | `createChatSchema` | name?(≤64) + members(≥1) + public(bool) |
| 更新对话 | `updateChatSchema` | name? + members? + public? |
| 发送消息 | `createMessageSchema` | content(≥1字符) + files(默认[]) |

---

## 12. 全局状态（Zustand）

仅用 Zustand 管理少量客户端 UI 状态：

```typescript
{
  activeChatId: number | null    // 当前选中对话（持久化到 localStorage）
  sseStatus: 'connected' | 'disconnected' | 'reconnecting'
  sidebarCollapsed: boolean      // 侧边栏折叠
}
```

所有服务端数据一律走 TanStack Query，不存 Zustand。

---

## 13. 项目结构

```
src/
├── main.tsx              # React 入口 → <App />
├── app.tsx               # QueryClient + Router + SSE 事件分发
├── index.css             # Tailwind v4 设计系统（@theme + 组件类 + 工具类）
├── routeTree.gen.ts      # 自动生成的路由树（勿手动修改）
│
├── api/                  # API 客户端层
│   ├── client.ts         # ky 实例（401 自动刷新、重试、错误处理）
│   ├── auth.ts           # 注册/登录
│   ├── chats.ts          # 聊天 CRUD
│   ├── messages.ts       # 消息发送/列表
│   ├── files.ts          # 文件上传(XHR)/下载(Blob)
│   └── users.ts          # 用户列表
│
├── hooks/                # TanStack Query hooks（每个对应一类数据）
│   ├── use-auth.ts       # 注册/登录/登出/当前用户
│   ├── use-chats.ts      # 聊天列表/详情/创建/更新/删除 + 缓存操作
│   ├── use-messages.ts   # 无限滚动列表/发送(乐观更新) + 缓存操作
│   ├── use-files.ts      # 文件上传
│   └── use-users.ts      # 用户列表
│
├── components/           # UI 组件
│   ├── chat/
│   │   ├── chat-list.tsx     # 左侧列表 + 搜索 + 新建弹窗
│   │   └── chat-header.tsx   # 聊天头部 + 搜索 + 设置弹窗
│   ├── message/
│   │   ├── message-item.tsx  # 单条消息（memo 优化）
│   │   ├── message-list.tsx  # 虚拟滚动列表
│   │   └── message-input.tsx # 输入框 + 拖放上传
│   └── common/
│       └── connection-indicator.tsx  # SSE 连接状态灯
│
├── routes/               # TanStack Router 文件路由
│   ├── __root.tsx        # 根壳
│   ├── _app.tsx          # 主布局（侧边栏 + SSE + 认证守卫）
│   ├── _app/index.tsx    # 首页
│   ├── _app/chat.$chatId.tsx  # 聊天详情页
│   ├── _auth.tsx         # 认证布局
│   ├── _auth.login.tsx   # 登录
│   └── _auth.register.tsx # 注册
│
├── schemas/              # Zod 校验 schemas
├── stores/               # Zustand 状态
├── lib/                  # 工具函数
│   ├── auth.ts           # token 存储 + JWT 解码
│   ├── cn.ts             # clsx + tailwind-merge
│   ├── format.ts         # 时间格式化
│   └── sse.ts            # SSE 连接管理（指数退避）
│
└── types/                # TypeScript 类型定义
    ├── models.ts         # 数据模型
    ├── api.ts            # API 响应/参数
    └── events.ts         # SSE 事件
```

---

## 14. 环境变量

| 变量 | 开发值 | 生产值 | 说明 |
|------|--------|--------|------|
| `VITE_API_BASE` | `http://localhost:6688/api` | `/api` | REST API 基地址 |
| `VITE_SSE_BASE` | `http://localhost:6687/events` | `/events` | SSE 连接地址 |

生产环境建议 Nginx 反向代理：
- `/api` → `chat_server:6688`
- `/events` → `notify_server:6687`
- 同源部署，消除 CORS 问题

---

## 15. 构建配置要点

### vite.config.ts

```typescript
plugins: [
  tanstackRouter({ autoCodeSplitting: true }),  // 自动路由 + 代码分割
  babel({ presets: [reactCompilerPreset()] }),  // React Compiler 自动优化
  react(),                                       // React Fast Refresh
  tailwindcss(),                                 // Tailwind v4
]
build: {
  target: 'es2024',  // 现代浏览器，减少 polyfill
}
```

### tsconfig.app.json

- `strict: true`（含 `strictNullChecks`，TanStack Router 要求）
- `target: es2024`，`lib: ES2024`

---

## 16. 性能优化清单

| 优化项 | 技术 | 效果 |
|--------|------|------|
| 自动记忆化 | React Compiler | 无需手写 useMemo/useCallback |
| 虚拟滚动 | react-virtuoso | 万条消息仅渲染可见区 |
| 乐观更新 | TanStack Query onMutate | 发消息零延迟 |
| 增量缓存 | setQueryData | SSE 推送不触发全量请求 |
| 路由预加载 | intent preloading | 悬停即加载，切换零等待 |
| 代码分割 | TanStack Router auto | 每个路由独立 chunk |
| 构建目标 | ES2024 | 减少 transpile 辅助代码 |
| 组件 memo | React.memo | 避免无关消息重渲染 |
| 指数退避重连 | SSE | 保护服务端不被冲击 |
