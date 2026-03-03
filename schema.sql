CREATE TABLE merchants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    merchant_name TEXT NOT NULL,
    mobile_no TEXT NOT NULL UNIQUE,
    upi_id TEXT NOT NULL UNIQUE,
    merchant_key TEXT NOT NULL UNIQUE,

    status INTEGER NOT NULL DEFAULT 0 
        CHECK (status IN (0,1)),   -- 1 = Active, 0 = Inactive

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_merchants_mobile ON merchants(mobile_no);
CREATE INDEX idx_merchants_status ON merchants(status);
CREATE INDEX idx_merchants_key ON merchants(merchant_key);
