-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '斤',
    "is_deposit" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "ProductAlias" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alias" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    CONSTRAINT "ProductAlias_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Venue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PaymentStatus" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

CREATE TABLE "SalesLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "line_no" INTEGER NOT NULL,
    "delivery_date" DATETIME NOT NULL,
    "invoice_no" TEXT,
    "customer_id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quote_product_name" TEXT,
    "unit" TEXT NOT NULL DEFAULT '斤',
    "quantity" REAL NOT NULL,
    "unit_price" REAL NOT NULL,
    "standard_price" REAL NOT NULL,
    "order_amount" REAL NOT NULL,
    "actual_price" REAL,
    "return_qty" REAL NOT NULL DEFAULT 0,
    "return_amount" REAL NOT NULL DEFAULT 0,
    "final_qty" REAL NOT NULL,
    "settlement_amount" REAL NOT NULL,
    "return_reason" TEXT,
    "return_invoice_no" TEXT,
    "payment_status_id" TEXT NOT NULL,
    "unpaid_amount" REAL NOT NULL DEFAULT 0,
    "unpaid_ex_deposit" REAL NOT NULL DEFAULT 0,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesLine_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesLine_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "Venue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesLine_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesLine_payment_status_id_fkey" FOREIGN KEY ("payment_status_id") REFERENCES "PaymentStatus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PriceQuote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quote_date" DATETIME NOT NULL,
    "seq_no" TEXT,
    "product_id" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT '斤',
    "shuangfu_price" REAL,
    "alliance_price" REAL,
    "member_price" REAL,
    "spec" TEXT,
    "remark" TEXT,
    "adjust_note" TEXT,
    CONSTRAINT "PriceQuote_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order_date" DATETIME NOT NULL,
    "supplier" TEXT NOT NULL,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PurchaseLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "purchase_order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit_price" REAL NOT NULL,
    "amount" REAL NOT NULL,
    CONSTRAINT "PurchaseLine_purchase_order_id_fkey" FOREIGN KEY ("purchase_order_id") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseLine_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "move_date" DATETIME NOT NULL,
    "product_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "remark" TEXT,
    "ref_id" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InventoryMovement_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "ImportBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "file_hash" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "stats" TEXT NOT NULL,
    "warnings" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

CREATE UNIQUE INDEX "Customer_name_key" ON "Customer"("name");
CREATE UNIQUE INDEX "Product_name_key" ON "Product"("name");
CREATE UNIQUE INDEX "ProductAlias_alias_key" ON "ProductAlias"("alias");
CREATE UNIQUE INDEX "Venue_code_key" ON "Venue"("code");
CREATE UNIQUE INDEX "PaymentStatus_name_key" ON "PaymentStatus"("name");
CREATE UNIQUE INDEX "SalesLine_delivery_date_invoice_no_customer_id_product_id_line_no_key" ON "SalesLine"("delivery_date", "invoice_no", "customer_id", "product_id", "line_no");
CREATE INDEX "SalesLine_delivery_date_idx" ON "SalesLine"("delivery_date");
CREATE INDEX "SalesLine_customer_id_idx" ON "SalesLine"("customer_id");
CREATE INDEX "SalesLine_product_id_idx" ON "SalesLine"("product_id");
CREATE UNIQUE INDEX "PriceQuote_quote_date_product_id_seq_no_key" ON "PriceQuote"("quote_date", "product_id", "seq_no");
CREATE INDEX "PriceQuote_quote_date_idx" ON "PriceQuote"("quote_date");
CREATE INDEX "InventoryMovement_move_date_idx" ON "InventoryMovement"("move_date");
CREATE INDEX "InventoryMovement_product_id_idx" ON "InventoryMovement"("product_id");
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");
