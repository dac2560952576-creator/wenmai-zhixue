# 文脉智学 — 传统手工艺AI学习平台

面向传统手工艺（非遗）的 AI 学习 APP。构建「学—练—创—享」闭环：学习工艺知识 → AI辅助练习 → 大模型创作 → 社区分享交流。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Vue Router + Pinia |
| 后端 | Supabase（PostgreSQL + Auth + Realtime） |
| AI | 阿里云百炼 DashScope（通义千问 qwen-plus + 通义万相） |
| 离线 | SQLite（sql.js）+ localStorage |
| UI | 纯 CSS 新中式宣纸风格 + 思源宋体（Noto Serif SC） |

## 功能总览

**学** — 18 门传统手工艺知识文档（8 大分类）、9 门课程视频、全局混合搜索、Hero 工艺轮播

**练** — AI 流式问答、50 道静态题库、错题本自动收录、答题统计

**创** — AI 纹样生成（通义万相文生图）、AI 文案创作 + 审查批注（双步 LLM 调用）、禁忌词拦截

**享** — 瀑布流作品墙、13 个工艺分类筛选、点赞评论、用户间私信（实时收发 + 离线未读补回）

**我** — 学习记录聚合、作品管理（编辑/删除）、学习进度双向云同步、未读消息红点提醒

## 项目结构

```
src/
├── views/          # 17 个页面组件
├── components/     # 公共组件（TabBar）
├── services/       # Supabase API / AI / SQLite / 错误日志
├── stores/         # Pinia 状态管理（auth、app）
├── router/         # Vue Router 路由配置
├── data/           # 工艺知识库、题库、禁忌词库（JSON/Markdown）
├── styles/         # 全局 CSS 设计令牌
├── App.vue         # 根组件
└── main.js         # 入口
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/dac2560952576-creator/wenmai-zhixue.git
cd wenmai-zhixue
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

编辑 `.env` 填入：

| 变量 | 说明 | 获取地址 |
|------|------|---------|
| `VITE_SUPABASE_URL` | Supabase 项目 URL | [supabase.com](https://supabase.com) |
| `VITE_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | 同上 |
| `VITE_DASHSCOPE_API_KEY` | 阿里百炼 API Key | [dashscope.aliyun.com](https://dashscope.aliyun.com) |

### 3. 初始化数据库

在 Supabase Dashboard → SQL Editor 中粘贴执行 `supabase_schema.sql` 全部内容。

### 4. 准备课程视频（可选）

将 MP4 文件放入 `public/videos/` 目录，与 `CourseLibraryPage.vue` 中定义的路径对应：

```
public/videos/
├── longquan-qingci.mp4    # 龙泉青瓷入门
└── hangzhoucixiu.mp4      # 杭绣技法
```

无视频文件时，课程卡片仍正常显示，仅播放器提示缺文件。

### 5. 启动

```bash
npm run dev
```

浏览器访问 `http://localhost:5173`。

## 构建部署

```bash
npm run build    # 输出到 dist/
```

`dist/` 为纯静态文件，可部署到任何静态托管（GitHub Pages、Vercel、Netlify 等）。注意：SPA 需要配置所有路由指向 `index.html`。

## 许可证

MIT
