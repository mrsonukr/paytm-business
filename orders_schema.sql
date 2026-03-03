CREATE TABLE payment_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id TEXT NOT NULL UNIQUE,
    merchant_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    payment_link TEXT NOT NULL,
    qr_code_data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id)
);

CREATE INDEX idx_orders_order_id ON payment_orders(order_id);
CREATE INDEX idx_orders_merchant_id ON payment_orders(merchant_id);
CREATE INDEX idx_orders_status ON payment_orders(status);
