# 数据库设计

## ER 关系概览

```
customers ──┐
products  ──┼── sales_lines ── venues
            │         │
payment_statuses      └── import_batches
product_aliases ── products
price_quotes ── products
purchase_orders ── purchase_lines ── products
inventory_movements ── products
app_settings
```

## 表说明

### customers
| 字段 | 类型 | 说明 |
|------|------|------|
| id | cuid | PK |
| name | string unique | 客户名称 |

### products
| 字段 | 类型 | 说明 |
|------|------|------|
| id | cuid | PK |
| name | string unique | 标准商品名 |
| unit | string | 默认单位 |
| is_deposit | boolean | 是否框子押金类 |

### product_aliases
| 字段 | 类型 | 说明 |
|------|------|------|
| alias | string unique | 日常叫法 |
| product_id | FK | 标准商品 |

### venues
| 字段 | 类型 | 说明 |
|------|------|------|
| code | string unique | 如 G1、A2 |

### payment_statuses
| 字段 | 类型 | 说明 |
|------|------|------|
| name | string unique | 未付款、已付款 |

### sales_lines（核心，对应 Excel「联盟销售统计」）

| DB 字段 | Excel 列 |
|---------|----------|
| line_no | 序号 |
| delivery_date | 配送日期 |
| invoice_no | 发货票据编号 |
| customer_id | 客户名称 |
| venue_id | 交易场所 |
| quote_product_name | 报价单商品名 |
| unit | 单位 |
| quantity | 数量 |
| unit_price | 开单价 |
| standard_price | 标准价 |
| order_amount | 开单金额 |
| actual_price | 抹零价/实收 |
| return_qty | 退货数量 |
| return_amount | 退货金额 |
| final_qty | 最终数量 |
| settlement_amount | 结算金额 |
| return_reason | 退货原因 |
| return_invoice_no | 退货票据编号 |
| payment_status_id | 付款状态 |
| unpaid_amount | 未收款金额 |
| unpaid_ex_deposit | 不含框未收款金额 |
| remark | 备注 |
| product_id | 商品名 |

唯一约束：`(delivery_date, invoice_no, customer_id, product_id, line_no)`

### price_quotes

| DB 字段 | Excel 列 |
|---------|----------|
| quote_date | 报价日期 |
| seq_no | 序号 |
| product_id | 报价商品 |
| unit | 报价单位 |
| shuangfu_price | 双福价格 |
| alliance_price | 集采价格 |
| member_price | 会员价格 |
| spec | 规格 |
| remark | 备注 |
| adjust_note | 调价说明 |

### purchase_orders / purchase_lines

手工录入采购，无 Excel 映射。

### inventory_movements

| type | 说明 |
|------|------|
| purchase_in | 采购入库 |
| sale_out | 销售出库 |
| return_in | 退货入库 |
| adjust | 手工调整 |

### import_batches

filename, file_hash, mode, row_counts, warnings (JSON), created_at

### app_settings

key-value：company_name, bank_name, bank_account

## 派生指标（SQL 计算，不存表）

- **未结款率** = SUM(unpaid_amount) / NULLIF(SUM(settlement_amount), 0)
- **退货率** = SUM(return_amount) / NULLIF(SUM(order_amount), 0)
- **客户别透视** = GROUP BY customer_id
- **商品别透视** = GROUP BY product_id
