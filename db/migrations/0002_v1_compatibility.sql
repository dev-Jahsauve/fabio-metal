-- Non-destructive compatibility layer for an older FABIOLE METAL V1/V2 database.
DO $$ BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'shipped'; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'delivered'; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'refunded'; EXCEPTION WHEN undefined_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending','processing','success','failed','cancelled','expired','refunded','partially_refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE shipment_status AS ENUM ('pending','preparing','shipped','delivered','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE invoice_status AS ENUM ('draft','issued','paid','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE refund_status AS ENUM ('pending','processed','failed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_status AS ENUM ('pending','sent','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku varchar(80);
ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_price_xaf integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 2;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal_xaf integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee_xaf integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_xaf integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tax_xaf integer NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency varchar(3) NOT NULL DEFAULT 'XAF';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key varchar(120);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_recipient_name varchar(120);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone varchar(30);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address_line text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city varchar(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_region varchar(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_released_at timestamptz;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_name_snapshot varchar(160) NOT NULL DEFAULT 'Article';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS sku_snapshot varchar(80);
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS status varchar(30) NOT NULL DEFAULT 'new';
ALTER TABLE contact_requests ADD COLUMN IF NOT EXISTS handled_at timestamptz;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash varchar(64) NOT NULL UNIQUE, expires_at timestamptz NOT NULL, used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS rate_limits (
 key varchar(220) PRIMARY KEY, count integer NOT NULL, reset_at timestamptz NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS product_images (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 image_url text NOT NULL, alt_text varchar(180), sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS addresses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, label varchar(80),
 recipient_name varchar(120) NOT NULL, phone varchar(30) NOT NULL, address_line text NOT NULL, city varchar(100) NOT NULL,
 region varchar(100), country varchar(2) NOT NULL DEFAULT 'CM', postal_code varchar(20), is_default boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS carts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cart_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
 product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT, quantity integer NOT NULL CHECK (quantity > 0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(cart_id, product_id)
);
CREATE TABLE IF NOT EXISTS payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE, provider varchar(40) NOT NULL,
 transaction_id varchar(120) NOT NULL UNIQUE, amount_xaf integer NOT NULL CHECK (amount_xaf >= 0), currency varchar(3) NOT NULL,
 status payment_status NOT NULL DEFAULT 'pending', payment_url text, provider_reference varchar(180), provider_response jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz, expires_at timestamptz
);
CREATE TABLE IF NOT EXISTS payment_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payment_id uuid REFERENCES payments(id) ON DELETE CASCADE, provider varchar(40) NOT NULL,
 event_id varchar(180) NOT NULL UNIQUE, event_type varchar(80) NOT NULL, payload jsonb NOT NULL, received_at timestamptz NOT NULL DEFAULT now(),
 processed_at timestamptz, status varchar(30) NOT NULL DEFAULT 'received'
);
CREATE TABLE IF NOT EXISTS refunds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payment_id uuid NOT NULL REFERENCES payments(id), amount_xaf integer NOT NULL CHECK (amount_xaf > 0),
 reason text, status refund_status NOT NULL DEFAULT 'pending', provider_reference varchar(180), created_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz
);
CREATE TABLE IF NOT EXISTS shipments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE, status shipment_status NOT NULL DEFAULT 'pending',
 carrier varchar(120), tracking_number varchar(120), notes text, created_at timestamptz NOT NULL DEFAULT now(), shipped_at timestamptz, delivered_at timestamptz
);
CREATE TABLE IF NOT EXISTS invoices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE, invoice_number varchar(60) NOT NULL UNIQUE,
 status invoice_status NOT NULL DEFAULT 'draft', subtotal_xaf integer NOT NULL, delivery_fee_xaf integer NOT NULL, discount_xaf integer NOT NULL, tax_xaf integer NOT NULL,
 total_xaf integer NOT NULL, currency varchar(3) NOT NULL DEFAULT 'XAF', issued_at timestamptz, paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE, order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
 type varchar(60) NOT NULL, channel varchar(30) NOT NULL DEFAULT 'in_app', status notification_status NOT NULL DEFAULT 'pending', title varchar(180) NOT NULL,
 message text NOT NULL, sent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS audit_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL, action varchar(100) NOT NULL,
 entity_type varchar(60) NOT NULL, entity_id varchar(120), metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique ON products(sku) WHERE sku IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_unique ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS password_reset_user_idx ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS password_reset_expiry_idx ON password_reset_tokens(expires_at);
CREATE INDEX IF NOT EXISTS rate_limits_reset_idx ON rate_limits(reset_at);
CREATE INDEX IF NOT EXISTS product_images_product_idx ON product_images(product_id);
CREATE INDEX IF NOT EXISTS addresses_user_idx ON addresses(user_id);
CREATE INDEX IF NOT EXISTS cart_items_cart_idx ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS payments_order_idx ON payments(order_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE INDEX IF NOT EXISTS payments_expiry_idx ON payments(expires_at);
CREATE INDEX IF NOT EXISTS payment_events_payment_idx ON payment_events(payment_id);
CREATE INDEX IF NOT EXISTS refunds_payment_idx ON refunds(payment_id);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_user_id);

UPDATE order_items oi SET product_name_snapshot = COALESCE(p.name, oi.product_name_snapshot), sku_snapshot = p.sku FROM products p WHERE p.id = oi.product_id;
UPDATE orders SET subtotal_xaf = total_xaf WHERE subtotal_xaf = 0 AND total_xaf > 0;
