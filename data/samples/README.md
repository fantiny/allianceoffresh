# 样例数据目录（不纳入 Git）

请将您的 Excel 汇总表放在本目录，例如：

```
联盟销售汇总样例.xlsx
```

该文件包含真实经营数据，已在 `.gitignore` 中排除，不会上传到 GitHub。

导入命令：

```bash
pnpm seed:excel
# 或指定路径
pnpm --filter @repo/database seed:excel /path/to/your.xlsx
```
