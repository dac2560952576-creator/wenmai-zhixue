# 文脉智学 — 传统手工艺AI学习平台

基于 Vue3 + Supabase + 通义千问/万相 构建的非遗文化AI学习APP。

## 技术栈

- **前端**: Vue 3 + Vite + Vue Router + Pinia
- **后端**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **AI**: 阿里云百炼 DashScope (通义千问 qwen-plus + 通义万相)
- **离线**: SQLite (sql.js) + localStorage
- **UI**: 纯CSS新中式宣纸风格 + 思源宋体

## 功能

- 18门传统手工艺知识文档 + 9门课程视频
- AI流式问答 + 纹样生成 + 文案创作 + AI审查
- 瀑布流作品社区 (点赞/评论/私信/分类筛选)
- 用户认证 (注册/登录/密码重置/资料编辑)
- 学习进度双向云同步
- 离线错题本 + 搜索历史

## 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/你的用户名/文脉智学APP.git
cd 文脉智学APP

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入你的 Supabase URL/Key 和 DashScope API Key

# 4. 在 Supabase 创建项目并执行下方 SQL 建表
# (建表脚本见下方)

# 5. 启动开发服务器
npm run dev

# 6. 构建生产版本
npm run build
```

## 环境变量

复制 `.env.example` 为 `.env` 并填入：

- `VITE_SUPABASE_URL` — Supabase 项目 URL
- `VITE_SUPABASE_ANON_KEY` — Supabase 匿名密钥
- `VITE_DASHSCOPE_API_KEY` — 阿里云百炼 API Key

## 许可证

MIT
