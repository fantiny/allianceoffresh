# Vercel 配置手把手教程

按顺序完成下面 **5 步** 即可上线。每步做完再打勾。

---

## 第 1 步：把 GitHub 连到 Vercel

1. 打开 [https://vercel.com/dashboard](https://vercel.com/dashboard) 并登录
2. 若提示连接 Git，点 **Continue with GitHub** → 授权
3. 在 GitHub 授权页选择：
   - **All repositories**，或
   - 仅勾选仓库 **`fantiny/allianceoffresh`**
4. 授权完成后回到 Vercel 控制台

---

## 第 2 步：创建数据库（Neon）

云端**不能**用 SQLite，必须先有 PostgreSQL。

1. Vercel 左侧点 **Storage**（存储）
2. 点 **Create Database** → 选 **Neon** → **Continue**
3. 数据库名称可填：`allianceoffresh-db`
4. 区域尽量选 **Singapore (sin1)** 或离你近的
5. 点 **Create**，等待几秒
6. 创建成功后，在数据库页面找到 **`.env.local` 标签页** 或 **Connection string**
7. 复制 **`DATABASE_URL`** 整行（以 `postgresql://` 开头），先粘贴到记事本备用

示例（你的会不一样）：

```
postgresql://neondb_owner:xxxxx@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

---

## 第 3 步：导入项目

1. Vercel 控制台点 **Add New…** → **Project**
2. 在列表里找到 **`allianceoffresh`**（来自 `fantiny/allianceoffresh`）
3. 点 **Import**

### 重要：项目设置（Deploy 之前检查）

在 **Configure Project** 页面：

| 设置项 | 填什么 |
|--------|--------|
| **Project Name** | 随意，如 `allianceoffresh` |
| **Framework Preset** | Next.js（自动识别） |
| **Root Directory** | 点 **Edit** → 选 **`apps/web`** → Confirm |
| **Build Command** | 留空（用仓库里 `apps/web/vercel.json`） |
| **Install Command** | 留空 |
| **Output Directory** | 留空（Next.js 默认） |

> 根目录必须是 **`apps/web`**，否则会构建失败。

---

## 第 4 步：配置环境变量（最关键）

仍在 Configure Project 页面，展开 **Environment Variables**，添加 3 个：

### 变量 1

| 字段 | 内容 |
|------|------|
| Key | `DATABASE_URL` |
| Value | 第 2 步复制的 `postgresql://...` 整串 |
| Environment | 勾选 **Production** 和 **Preview** |

### 变量 2

| 字段 | 内容 |
|------|------|
| Key | `AUTO_INVENTORY` |
| Value | `true` |
| Environment | Production + Preview |

### 变量 3（建议）

| 字段 | 内容 |
|------|------|
| Key | `ADMIN_PASSWORD` |
| Value | 自设密码，如 `MySecurePass2026!` |
| Environment | 仅 **Production** |

添加完后，界面应类似：

```
DATABASE_URL      postgresql://...     Production, Preview
AUTO_INVENTORY    true                 Production, Preview
ADMIN_PASSWORD    ********             Production
```

---

## 第 5 步：部署

1. 点 **Deploy**
2. 等待约 2～5 分钟，状态变为 **Ready**
3. 点 **Visit** 或域名链接，例如：`https://allianceoffresh.vercel.app`

### 部署成功后

1. 打开网站 → 左侧 **数据导入**
2. 上传你本机的 Excel（`联盟销售汇总样例.xlsx`，勿提交到 GitHub）
3. 选 **覆盖导入** → **开始导入**
4. 回到 **经营总览** 查看报表

---

## 已部署项目：补环境变量

若项目已创建但报错，按下面补配置：

1. 打开项目 → **Settings** → **Environment Variables**
2. 按第 4 步添加 `DATABASE_URL`、`AUTO_INVENTORY`
3. **Settings** → **General** → **Root Directory** 改为 **`apps/web`** → Save
4. **Deployments** → 最新一条 → 右侧 **⋯** → **Redeploy**

---

## 常见报错对照

| 报错 / 现象 | 解决办法 |
|-------------|----------|
| `DATABASE_URL` / Prisma 连接失败 | 检查变量是否填对；Neon 连接串要含 `?sslmode=require` |
| 找不到 `package.json` / Next.js | Root Directory 改为 **`apps/web`** 后 Redeploy |
| 构建成功但页面 500 | 多为数据库未连上，看 **Deployments → Building → Logs** |
| 导入 Excel 失败 | 文件过大可能超时，可改用较小日期范围分次导入 |
| GitHub 里看不到仓库 | Vercel → Settings → Git → 重新授权并勾选该仓库 |

---

## 配置关系示意图

```
GitHub 仓库 fantiny/allianceoffresh
        │
        ▼
Vercel 项目（Root Directory = apps/web）
        │
        ├── 环境变量 DATABASE_URL ──► Neon PostgreSQL
        ├── 环境变量 AUTO_INVENTORY
        └── 环境变量 ADMIN_PASSWORD（可选）
        │
        ▼
https://你的项目.vercel.app
        │
        └── /import 上传 Excel → 写入云端数据库
```

---

## 本地与云端对照

| | 本地 `pnpm dev` | Vercel 云端 |
|--|-----------------|-------------|
| 地址 | http://localhost:3344 | https://xxx.vercel.app |
| 数据库 | SQLite 文件 | Neon PostgreSQL |
| Excel | 放 `data/samples/` | 网页上传 |

本地开发方式不变，与 Vercel 互不影响。
