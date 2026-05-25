# Vercel 配置手把手教程

按顺序完成下面 **5 步** 即可上线。每步做完再打勾。

---

## 已部署实例（2026-05-25）

| 项目 | 值 |
|------|----|
| **Vercel 项目** | `jay-yu / allianceoffresh-web` |
| **项目地址** | https://vercel.com/jay-yu/allianceoffresh-web |
| **数据库** | Supabase PostgreSQL（新加坡 ap-southeast-1） |
| **Supabase 项目 ID** | `bsfgjovkpngwmlnxkiuf` |
| **Supabase 控制台** | https://supabase.com/dashboard/project/bsfgjovkpngwmlnxkiuf |
| **Root Directory** | `apps/web`（已确认） |

> **注意**：Vercel 的 Neon 集成自动添加的 `DATABASE_URL` 仅覆盖了 Development 环境。
> 生产环境（Production/Preview）使用的是下方 Supabase 的连接串。

### 已配置的生产环境变量

| Key | Environment | 备注 |
|-----|-------------|------|
| `DATABASE_URL` | Production + Preview | Supabase 连接串（见下） |
| `AUTO_INVENTORY` | Production + Preview | 值：`true` |
| `ADMIN_PASSWORD` | Production | 值：`Fresh2026!` |

Supabase `DATABASE_URL`（生产用）：
```
postgresql://postgres:9gSBzsZSCxyx2CE2@db.bsfgjovkpngwmlnxkiuf.supabase.co:5432/postgres?sslmode=require
```



---

## 第 1 步：把 GitHub 连到 Vercel

1. 打开 [https://vercel.com/dashboard](https://vercel.com/dashboard) 并登录
2. 若提示连接 Git，点 **Continue with GitHub** → 授权
3. 在 GitHub 授权页选择：
   - **All repositories**，或
   - 仅勾选仓库 **`fantiny/allianceoffresh`**
4. 授权完成后回到 Vercel 控制台

---

## 第 2 步：创建数据库

云端**不能**用 SQLite，必须先有 PostgreSQL。可选 **Neon**（Vercel 集成）或 **Supabase**，推荐 Supabase：

### 方案 A：Supabase（推荐，免费）

1. 打开 [https://supabase.com/dashboard](https://supabase.com/dashboard) 并登录
2. 点 **New project**，填写名称（如 `allianceoffresh`），区域选 **Southeast Asia (Singapore)**
3. 记下自动生成的密码（只显示一次）
4. 创建完成后，进入项目 → **Settings** → **Database**
5. 找到 **"Connection string"** → 选 **"Transaction"** 模式 → 复制整串
6. 连接串格式：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
   ```

### 方案 B：Neon（Vercel 集成，也免费）

1. Vercel 左侧点 **Storage** → **Create Database** → 选 **Neon**
2. 区域选 **Singapore (sin1)**，点 **Create**
3. 在数据库页面找 **Connection string** 复制备用

> ⚠️ **已知问题**：Vercel 的 Neon 集成会自动把变量加到 Development 环境，但**不会**加到 Production/Preview。
> 必须手动在 Environment Variables 里把 `DATABASE_URL` 的环境勾上 Production 和 Preview，否则部署失败。

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
| `DATABASE_URL` / Prisma 连接失败 | 检查变量是否填对；连接串末尾要含 `?sslmode=require`；**确认 Environment 勾了 Production** |
| Neon 变量只有 Development，没有 Production | 进 Environment Variables → 点 `DATABASE_URL` 右侧菜单 → Edit → 勾选 Production + Preview → Save |
| 找不到 `package.json` / Next.js | Root Directory 改为 **`apps/web`** 后 Redeploy |
| 构建成功但页面 500 | 多为数据库未连上，看 **Deployments → Build Logs** |
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
        ├── 环境变量 DATABASE_URL ──► Supabase / Neon PostgreSQL
        ├── 环境变量 AUTO_INVENTORY  （必须勾 Production）
        └── 环境变量 ADMIN_PASSWORD  （仅 Production）
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
| 数据库 | SQLite 文件 | Supabase / Neon PostgreSQL |
| Excel | 放 `data/samples/` | 网页上传 |
| Prisma schema | `schema.prisma` | `schema.vercel.prisma` |

本地开发方式不变，与 Vercel 互不影响。
