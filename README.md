# 重庆集采联盟 · 生鲜销售数据报表系统

生鲜联盟销售统计与轻量进销存 Web 应用。支持 Excel 导入导出、多维度经营报表、采购与库存管理。

## 功能

- Excel 双向导入导出（联盟销售统计、报价表、商品别称）
- 8 类经营报表：总览、日报、客户、商品、场所、收款、报价、进销存
- 销售明细、采购单、库存流水管理
- Docker 一键部署 / Vercel 云端部署

## 数据文件说明

**Excel 样例含真实经营数据，不会提交到 Git。** 克隆仓库后，请将汇总表放到 `data/samples/联盟销售汇总样例.xlsx`（或任意路径后用 `seed:excel` 指定），再执行导入。

## 快速开始（本地开发）

```bash
# 安装依赖
pnpm install

# 生成 Prisma 客户端并初始化数据库
pnpm db:generate
pnpm db:push

# 将 Excel 放入 data/samples/ 后导入
pnpm seed:excel

# 启动开发服务器
pnpm dev
```

浏览器访问 http://localhost:3000

## 一键 Docker 部署

```bash
docker compose up --build
```

数据持久化在 `./data` 目录（SQLite 数据库文件）。

## 云端部署（Vercel + PostgreSQL）

1. 在 [Neon](https://neon.tech) 或 Supabase 创建 PostgreSQL 数据库
2. 修改 `packages/database/prisma/schema.prisma` 中 `provider = "postgresql"`
3. 设置环境变量 `DATABASE_URL=postgresql://...`
4. 执行 `pnpm db:migrate` 后部署到 Vercel
5. 首次部署后访问 `/import` 上传 Excel 或使用 `pnpm seed:excel`

## 环境变量

| 变量 | 说明 | 默认 |
|------|------|------|
| `DATABASE_URL` | SQLite 或 PostgreSQL 连接串 | `file:../../data/app.db` |
| `ADMIN_PASSWORD` | 设置后 API 需 Bearer Token | 无（不启用认证） |
| `AUTO_INVENTORY` | 导入销售时自动生成库存流水 | `true` |

## 项目结构

```
apps/web/           Next.js 前端 + API
packages/database/  Prisma + Excel 导入导出
packages/shared/    共享类型与筛选工具
docs/               需求、架构、数据库文档
data/samples/       样例 Excel
```

## 脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 开发模式 |
| `pnpm build` | 生产构建 |
| `pnpm seed:excel` | 导入样例 Excel |
| `pnpm test` | 运行解析测试 |
| `pnpm db:studio` | Prisma 数据浏览器 |

## 文档

- [产品需求](docs/PRD.md)
- [系统架构](docs/ARCHITECTURE.md)
- [数据库设计](docs/DATABASE.md)
