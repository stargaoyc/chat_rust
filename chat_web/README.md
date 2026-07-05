# chat_web — 聊天应用前端

基于 React 19 + TypeScript 7 + Vite 8 + TanStack 全家桶构建的实时聊天 Web 客户端。

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器 (默认 http://localhost:5173)
pnpm dev

# 生产构建
pnpm build

# 预览生产产物
pnpm preview
```

## 技术栈

| 分类 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | React | 19.2 | UI 渲染 |
| 类型 | TypeScript | 7.0 | 类型安全 |
| 构建 | Vite (Rolldown) | 8.1 | 开发 + 打包 |
| 编译器 | React Compiler | 1.0 | 自动记忆化优化 |
| 路由 | TanStack Router | 1.170 | 文件路由 + 代码分割 |
| 数据 | TanStack Query | 5.101 | 服务端缓存 + 无限滚动 + 乐观更新 |
| 样式 | Tailwind CSS | 4.3 | 原子化 CSS + @theme 设计系统 |
| 校验 | Zod | 4.4 | 表单运行时校验 |
| 状态 | Zustand | 5.0 | 客户端 UI 状态 |
| HTTP | ky | 2.0 | API 客户端（401 自动刷新） |
| 实时 | fetch-event-source | 2.0 | SSE 连接（指数退避重连） |
| 虚拟列表 | react-virtuoso | 4.18 | 大量消息高性能滚动 |
| 图标 | Lucide React | 1.23 | SVG 图标 |
| 通知 | Sonner | 2.0 | Toast 提示 |

## 项目结构

```
src/
├── app.tsx               # 根组件：QueryClient + Router + SSE 事件分发
├── index.css             # Tailwind v4 设计系统 (@theme + 组件类)
├── api/                  # API 客户端（ky + 401 刷新）
├── hooks/                # TanStack Query hooks（数据层）
├── components/           # UI 组件
│   ├── chat/             # chat-list, chat-header
│   ├── message/          # message-item, message-list, message-input
│   └── common/           # connection-indicator
├── routes/               # TanStack Router 文件路由
├── schemas/              # Zod 表单校验
├── stores/               # Zustand 全局状态
├── lib/                  # 工具函数（auth, cn, format, sse）
└── types/                # TypeScript 类型
```

## 核心特性

- **乐观更新** — 发消息零延迟，先渲染后确认
- **SSE 实时推送** — 新消息/新对话即时到达，增量更新缓存
- **虚拟滚动** — react-virtuoso 支撑万条消息流畅滚动
- **无限滚动** — 向上滚动自动加载更早消息（游标分页）
- **文件拖放上传** — 拖放/点击上传，XHR 确保 multipart 正确
- **消息搜索** — 聊天内搜索 + 侧边栏对话搜索
- **连接状态指示** — 在线/重连/离线状态灯
- **React Compiler** — 编译时自动优化，无需手写 useMemo

## 环境变量

| 变量 | 开发值 | 生产值 | 说明 |
|------|--------|--------|------|
| `VITE_API_BASE` | `http://localhost:6688/api` | `/api` | REST API 地址 |
| `VITE_SSE_BASE` | `http://localhost:6687/events` | `/events` | SSE 地址 |

## 设计文档

详见 [DESIGN.md](./DESIGN.md)，包含完整的设计系统、页面布局、数据流、认证流程、缓存策略等说明。
