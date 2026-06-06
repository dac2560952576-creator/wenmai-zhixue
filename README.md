# 文脉智学 — 传统手工艺AI学习平台

面向传统手工艺（非遗）的 AI 学习 APP。构建「学—练—创—享」闭环，围绕"文脉·智学"理念设计：以时间线串联五千年工艺传承，以 AI 引导零基础用户入门非遗。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vue 3 + Vite + Vue Router + Pinia |
| 动画 | GSAP（GreenSock） — 页面切换 / 入场 / 交互动画 |
| 后端 | Supabase（PostgreSQL + Auth + Realtime + Storage） |
| AI | 阿里云百炼 DashScope（通义千问 qwen-plus + 通义万相） |
| 离线 | SQLite（sql.js）+ localStorage |
| UI | 纯 CSS 新中式宣纸风格 + 思源宋体（Noto Serif SC） |
| AI Skills | GSAP 官方 8 技能包（gsap-core / timeline / scrolltrigger / plugins 等） |

## 功能总览

### 📖 学

- **18 门传统手工艺** 知识文档（8 大分类），部分含完整 Markdown 文档
- **9 门课程视频**（B站嵌入，自动获取封面与真实时长）
- **文脉时间线** — 新石器→现代 9 个时代，横向滑动，点击进入时代详情页
- **时代详情页** — 每时代工艺起源背景、代表工艺、关联课程与文档（文字自动滚动）
- **智学助手** — 文档页右侧悬浮 🤖 按钮，弹出 AI 面板，注入当前文档作为知识库
- **全局混合搜索** — 文档 + 课程权重排序，搜索历史记录

### ✏️ 练

- **AI 流式问答** — 预设引导问题 + 答题后 AI 推荐追问
- **50 道静态题库** — 13 个工艺分类，GSAP 答题反馈动画（答对脉冲/答错微震）
- **错题本** — 自动收录错题，含错误次数与解析

### 🎨 创

- **AI 纹样生成**（通义万相文生图） — 关键词标签引导面板 + 随机灵感按钮，生成图片自动转存 Supabase Storage
- **AI 文案创作**（流式生成 + 双步审查） — 工艺×角度双选引导 + 禁忌词拦截 + AI 审查批注

### 🏛️ 享

- **瀑布流作品墙** — GSAP 卡片入场动画
- **13 个工艺分类筛选**
- **点赞**（弹性弹跳动画）+ 评论（Realtime 实时推送）
- **用户间私信** — 实时收发 + 离线未读补回 + 未读红点

### 👤 我

- 学习记录聚合（课程 + 练习 + 文档三维度）
- 作品管理（编辑/删除）
- 学习进度双向云同步
- Logo 品牌标识

## 项目结构

```
src/
├── views/              # 18 个页面组件
│   ├── LearnPage       首页 — 搜索/轮播/文脉时间线/每日一艺+今日一问
│   ├── PracticePage    练习工坊 — 题库/AI问答/错题本
│   ├── CreatePage      创作空间 — 纹样生成/文案创作
│   ├── CommunityPage   分享社区 — 瀑布流作品墙
│   ├── PostDetailPage  作品详情 — 点赞/评论/私信入口
│   ├── ProfilePage     我的 — 学习记录/作品管理/同步
│   ├── CraftsPage      工艺文档库 — 8分类手风琴
│   ├── CraftDetailPage 工艺详情 — Markdown渲染 + 智学助手
│   ├── CourseLibraryPage 课程视频库 — 9门B站课程
│   ├── EraDetailPage   时代详情 — 工艺起源/关联文档课程
│   ├── AuthPage        登录/注册/忘记密码
│   ├── ChatListPage    消息会话列表
│   ├── ChatPage        一对一私信
│   └── ...             编辑资料/发布作品/纹样历史/文案历史
├── components/
│   ├── TabBar          底部导航栏
│   └── DocsAIAssistant 智学助手 — 文档内嵌AI问答面板
├── services/
│   ├── supabase        Supabase API（认证/数据库/存储/Realtime）
│   ├── ai              阿里百炼 DashScope（问答/生图/审查）
│   ├── db              SQLite + localStorage（进度/统计/历史）
│   └── errorLog        轻量错误日志
├── stores/             Pinia（auth、app）
├── router/             Vue Router（18条路由）
├── data/               工艺知识库/题库/禁忌词库/完整文档（JSON+Markdown）
├── styles/             全局CSS设计令牌（新中式）
├── App.vue             根组件 + GSAP页面切换动画
└── main.js             入口 — SQLite初始化 → Pinia → Router
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

### 4. 配置 Supabase Storage（图片永久存储必需）

在 Supabase Dashboard → Storage 中：
1. 创建名为 `images` 的 bucket，勾选 "public bucket"
2. 在 Policies 中分别添加：
   - SELECT → 允许所有人 `true`
   - INSERT → 允许登录用户 `(auth.uid()) IS NOT NULL`
   - DELETE → 用户只能删自己的 `(auth.uid()) = owner`

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
