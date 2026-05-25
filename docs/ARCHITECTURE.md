# 系统架构说明

## 1. 总体架构

```
┌─────────────┐     HTTPS      ┌──────────────────┐
│   Browser   │ ◄────────────► │  Next.js 15 App  │
└─────────────┘                │  (apps/web)      │
                               ├──────────────────┤
                               │ App Router       │
                               │ API Routes       │
                               │ Server Components│
                               └────────┬─────────┘
                                        │ Prisma
                               ┌────────▼─────────┐
                               │ SQLite / PG      │
                               │ packages/database│
                               └──────────────────┘
```

## 2. 目录结构

```
allianceoffresh/
├── apps/web/              # Next.js 前端 + API
├── packages/database/     # Prisma schema、迁移、seed
├── packages/shared/       # 类型、常量、Zod schema
├── docs/                  # 需求与数据库文档
├── data/samples/          # 样例 Excel
├── docker-compose.yml
├── Dockerfile
└── pnpm-workspace.yaml
```

## 3. API 列表

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/import` | 上传 Excel 导入 |
| GET | `/api/export` | 导出 Excel（query: type, filters） |
| GET | `/api/reports/overview` | 经营总览 |
| GET | `/api/reports/daily-sales` | 销售日报 |
| GET | `/api/reports/customers` | 客户分析 |
| GET | `/api/reports/products` | 商品分析 |
| GET | `/api/reports/venues` | 场所分析 |
| GET | `/api/reports/payments` | 收款分析 |
| GET | `/api/reports/price-quotes` | 报价对比 |
| GET | `/api/reports/inventory` | 进销存简表 |
| GET/POST/PATCH/DELETE | `/api/sales-lines` | 销售明细 CRUD |
| GET/POST/PATCH/DELETE | `/api/purchases` | 采购单 CRUD |
| GET/POST | `/api/inventory-movements` | 库存流水 |
| GET/POST | `/api/price-quotes` | 报价维护 |
| GET | `/api/master/*` | 主数据列表 |

## 4. 数据流

### Excel 导入

1. 客户端 multipart 上传 → `POST /api/import`
2. ExcelJS 解析各 Sheet（按表头名映射）
3. Zod 校验 → Prisma transaction 批量 upsert
4. 可选：生成 `inventory_movements`
5. 写入 `import_batches`，返回统计与 warnings

### 报表查询

1. 解析 query 筛选参数（`ReportFilters`）
2. Prisma `$queryRaw` 或 `groupBy` 聚合
3. JSON 返回 + 前端 Recharts 渲染
4. 导出：同 filters 调用 `lib/excel/export-report.ts`

## 5. 部署拓扑

### 本地 Docker

- 镜像：Node 20 Alpine
- Volume：`./data` → SQLite 文件与上传目录
- 端口：3344（配置见 `config/app.json`）
- 启动：`docker compose up --build`

### 云端 Vercel

- 新账号注册与部署步骤见 [DEPLOY-VERCEL.md](./DEPLOY-VERCEL.md)
- `DATABASE_URL=postgresql://...`（Neon / Supabase，经 Marketplace 创建）
- 构建使用 `schema.vercel.prisma` + `pnpm db:push:vercel`
- 不支持 SQLite（无持久化磁盘）

环境变量：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | `file:./data/app.db` 或 PostgreSQL URL |
| `ADMIN_PASSWORD` | 可选，设置后 API 需 Bearer token |
| `AUTO_INVENTORY` | `true` 时导入销售自动生成库存流水 |

## 6. 技术栈

- Next.js 15、TypeScript、Prisma、SQLite/PostgreSQL
- Tailwind CSS、shadcn/ui、Recharts、ExcelJS、Zod
- pnpm workspaces、Docker Compose
