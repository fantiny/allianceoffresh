# Vercel 部署指南

按顺序完成下面 **5 步** 即可上线。

---

## 已部署实例（2026-05-26 — 运行正常）

| 项目 | 值 |
|------|----|
| **Vercel 项目** | `jay-yu / allianceoffresh-web` |
| **生产地址** | https://allianceoffresh-web.vercel.app |
| **控制台** | https://vercel.com/jay-yu/allianceoffresh-web |
| **数据库** | Neon PostgreSQL（us-east-1，通过 Vercel 集成） |
| **Neon 控制台** | https://console.neon.tech |

### 当前生产环境变量

| Key | Environment | 备注 |
|-----|-------------|------|
| `DATABASE_URL` | Production + Preview + Development | Neon pooled 连接串（pgbouncer） |
| `DATABASE_URL_UNPOOLED` | Production + Preview + Development | Neon direct 连接串（供 `db push` 使用） |
| `AUTO_INVENTORY` | Production + Preview | 值：`true` |
| `ADMIN_PASSWORD` | Production | 值：`Fresh2026!` |

### 关键技术说明（pnpm monorepo + Prisma + Vercel）

在 pnpm monorepo 中，`prisma generate` 把 query-engine 二进制写入 pnpm 虚拟仓库
（`node_modules/.pnpm/.../node_modules/.prisma/client/`），而非 `packages/database/node_modules/`。
`@vercel/nft` 无法静态追踪这个动态加载的 native 二进制，需要在 `next.config.ts` 里手动声明：

```ts
outputFileTracingRoot: path.join(__dirname, "../../"),   // 追踪根 = monorepo 根
outputFileTracingIncludes: {
  "/**": [
    "../../node_modules/.pnpm/**/.prisma/client/libquery_engine-*.so.node",
    "../../node_modules/.pnpm/**/.prisma/client/schema.prisma",
  ],
},
```

路径 `../../...` 相对于 `apps/web/`（`next.config.ts` 所在目录）。

---

## 第 1 步：连接 GitHub

1. 打开 [https://vercel.com/dashboard](https://vercel.com/dashboard) 并登录
2. 若提示连接 Git，点 **Continue with GitHub** → 授权
3. 在 GitHub 授权页选择 **All repositories** 或仅勾选 `fantiny/allianceoffresh`
4. 授权完成后回到 Vercel 控制台

---

## 第 2 步：创建数据库（推荐 Neon）

> ⚠️ 云端**不能**用 SQLite，必须先有 PostgreSQL。

### 推荐：Neon（Vercel 原生集成）

1. Vercel 控制台左侧点 **Storage** → **Create Database** → 选 **Neon**
2. 区域选 **Hong Kong (hkg1)** 或 **US East**，点 **Create**
3. 集成完成后，Vercel 会自动添加 `DATABASE_URL` 和 `DATABASE_URL_UNPOOLED`

> ⚠️ Neon 集成默认只把变量加到 **Development** 环境。
> 必须手动在 **Environment Variables** 里编辑这两个变量，勾选 **Production + Preview**，否则生产环境无法连库。

---

## 第 3 步：导入项目

1. Vercel 控制台点 **Add New…** → **Project**
2. 在列表里找到 **`allianceoffresh`**（来自 `fantiny/allianceoffresh`）
3. 点 **Import**

### Configure Project 页面设置

| 设置项 | 填什么 |
|--------|--------|
| **Project Name** | 随意，如 `allianceoffresh-web` |
| **Framework Preset** | Next.js（自动识别） |
| **Root Directory** | 点 **Edit** → 选 **`apps/web`** → Confirm |
| **Build / Install Command** | 留空（由 `apps/web/vercel.json` 控制） |

> **Root Directory 必须是 `apps/web`**，否则构建失败。

---

## 第 4 步：配置环境变量

在 Configure Project 页面展开 **Environment Variables**，添加以下变量：

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | Neon pooled 连接串 | Production + Preview + Development |
| `DATABASE_URL_UNPOOLED` | Neon direct 连接串 | Production + Preview + Development |
| `AUTO_INVENTORY` | `true` | Production + Preview |
| `ADMIN_PASSWORD` | 自设密码，如 `MyPass2026!` | 仅 Production |

---

## 第 5 步：部署

1. 点 **Deploy**，等待约 2 分钟（首次含 `prisma db push` 建表）
2. 状态变为 **Ready** 后，点 **Visit** 打开网站
3. 左侧 **数据导入** → 上传 Excel → 覆盖导入 → 回到 **经营总览** 查看报表

---

## 常见报错

| 报错 / 现象 | 解决办法 |
|-------------|----------|
| Prisma `could not locate the Query Engine` | 确认 `next.config.ts` 有 `outputFileTracingIncludes`（见上方技术说明） |
| Neon 变量只有 Development，没有 Production | 进 Environment Variables → 编辑 `DATABASE_URL` / `DATABASE_URL_UNPOOLED` → 勾选 Production + Preview |
| `DATABASE_URL` 不对 / Prisma 连接失败 | 确认使用 **pooled** URL 作为 `DATABASE_URL`，**direct** URL 作为 `DATABASE_URL_UNPOOLED` |
| 找不到 `package.json` / Next.js | Root Directory 改为 **`apps/web`** 后 Redeploy |
| 构建成功但页面 500 | 多为数据库未连上，看 Deployments → Logs |

---

## 本地 vs 云端

| | 本地 `pnpm dev` | Vercel 云端 |
|--|-----------------|-------------|
| 地址 | http://localhost:3344 | https://xxx.vercel.app |
| 数据库 | SQLite（`dev.db`） | Neon PostgreSQL |
| Prisma schema | `schema.prisma` | `schema.vercel.prisma` |
| 上传 Excel | 放 `data/samples/` | 网页上传 |

本地开发方式不变，与 Vercel 互不影响。
