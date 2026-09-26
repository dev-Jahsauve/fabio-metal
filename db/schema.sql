CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN CREATE TYPE role AS ENUM ('customer','admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE order_status AS ENUM ('pending','confirmed','processing','shipped','delivered','completed','cancelled','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending','processing','success','failed','cancelled','expired','refunded','partially_refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE shipment_status AS ENUM ('pending','preparing','shipped','delivered','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE invoice_status AS ENUM ('draft','issued','paid','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE refund_status AS ENUM ('pending','processed','failed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE notification_status AS ENUM ('pending','sent','failed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL, email varchar(190) NOT NULL UNIQUE,
 phone varchar(30), password_hash text NOT NULL, role role NOT NULL DEFAULT 'customer', email_verified_at timestamptz,
 avatar_url text, google_sub varchar(120),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), last_login_at timestamptz
);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);
CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub_unique ON users(google_sub) WHERE google_sub IS NOT NULL;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 token_hash varchar(64) NOT NULL UNIQUE, expires_at timestamptz NOT NULL, used_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS password_reset_user_idx ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS password_reset_expiry_idx ON password_reset_tokens(expires_at);

CREATE TABLE IF NOT EXISTS rate_limits (
 key varchar(220) PRIMARY KEY, count integer NOT NULL, reset_at timestamptz NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_limits_reset_idx ON rate_limits(reset_at);

CREATE TABLE IF NOT EXISTS categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(100) NOT NULL UNIQUE, slug varchar(120) NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
 sku varchar(80), name varchar(160) NOT NULL, slug varchar(180) NOT NULL UNIQUE, description text,
 price_xaf integer NOT NULL CHECK (price_xaf >= 0), promo_price_xaf integer CHECK (promo_price_xaf IS NULL OR promo_price_xaf >= 0), image_url text,
 stock integer NOT NULL DEFAULT 1 CHECK (stock >= 0), low_stock_threshold integer NOT NULL DEFAULT 2 CHECK (low_stock_threshold >= 0),
 is_custom boolean NOT NULL DEFAULT true, published boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS products_published_created_idx ON products(published, created_at DESC);
CREATE INDEX IF NOT EXISTS products_category_idx ON products(category_id);
CREATE TABLE IF NOT EXISTS product_images (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
 image_url text NOT NULL, alt_text varchar(180), sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_images_product_idx ON product_images(product_id);

CREATE TABLE IF NOT EXISTS gallery (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar(160) NOT NULL, category varchar(100), image_url text NOT NULL,
 description text, published boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS gallery_published_idx ON gallery(published);
CREATE TABLE IF NOT EXISTS services (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title varchar(160) NOT NULL, slug varchar(180) NOT NULL UNIQUE,
 description text, icon varchar(40), published boolean NOT NULL DEFAULT true, sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS addresses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE, label varchar(80),
 recipient_name varchar(120) NOT NULL, phone varchar(30) NOT NULL, address_line text NOT NULL, city varchar(100) NOT NULL,
 region varchar(100), country varchar(2) NOT NULL DEFAULT 'CM', postal_code varchar(20), is_default boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS addresses_user_idx ON addresses(user_id);

CREATE TABLE IF NOT EXISTS carts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS cart_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
 product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT, quantity integer NOT NULL CHECK (quantity > 0),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(cart_id, product_id)
);
CREATE INDEX IF NOT EXISTS cart_items_cart_idx ON cart_items(cart_id);

CREATE TABLE IF NOT EXISTS orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL REFERENCES users(id), status order_status NOT NULL DEFAULT 'pending',
 subtotal_xaf integer NOT NULL DEFAULT 0 CHECK (subtotal_xaf >= 0), delivery_fee_xaf integer NOT NULL DEFAULT 0 CHECK (delivery_fee_xaf >= 0),
 discount_xaf integer NOT NULL DEFAULT 0 CHECK (discount_xaf >= 0), tax_xaf integer NOT NULL DEFAULT 0 CHECK (tax_xaf >= 0),
 currency varchar(3) NOT NULL DEFAULT 'XAF', idempotency_key varchar(120), total_xaf integer NOT NULL CHECK (total_xaf >= 0),
 customer_note text, shipping_recipient_name varchar(120), shipping_phone varchar(30), shipping_address_line text,
 shipping_city varchar(100), shipping_region varchar(100), stock_released_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_unique ON orders(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE TABLE IF NOT EXISTS order_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 product_id uuid NOT NULL REFERENCES products(id) ON DELETE RESTRICT, product_name_snapshot varchar(160) NOT NULL, sku_snapshot varchar(80),
 quantity integer NOT NULL CHECK (quantity > 0), unit_price_xaf integer NOT NULL CHECK (unit_price_xaf >= 0)
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items(order_id);
CREATE INDEX IF NOT EXISTS order_items_product_idx ON order_items(product_id);

CREATE TABLE IF NOT EXISTS payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 provider varchar(40) NOT NULL, transaction_id varchar(120) NOT NULL UNIQUE, amount_xaf integer NOT NULL CHECK (amount_xaf >= 0), currency varchar(3) NOT NULL,
 status payment_status NOT NULL DEFAULT 'pending', payment_url text, provider_reference varchar(180), provider_response jsonb,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), paid_at timestamptz, expires_at timestamptz
);
CREATE INDEX IF NOT EXISTS payments_order_idx ON payments(order_id);
CREATE INDEX IF NOT EXISTS payments_status_idx ON payments(status);
CREATE INDEX IF NOT EXISTS payments_expiry_idx ON payments(expires_at);
CREATE TABLE IF NOT EXISTS payment_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payment_id uuid REFERENCES payments(id) ON DELETE CASCADE, provider varchar(40) NOT NULL,
 event_id varchar(180) NOT NULL UNIQUE, event_type varchar(80) NOT NULL, payload jsonb NOT NULL, received_at timestamptz NOT NULL DEFAULT now(),
 processed_at timestamptz, status varchar(30) NOT NULL DEFAULT 'received'
);
CREATE INDEX IF NOT EXISTS payment_events_payment_idx ON payment_events(payment_id);
CREATE TABLE IF NOT EXISTS refunds (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payment_id uuid NOT NULL REFERENCES payments(id), amount_xaf integer NOT NULL CHECK (amount_xaf > 0),
 reason text, status refund_status NOT NULL DEFAULT 'pending', provider_reference varchar(180), created_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz
);
CREATE INDEX IF NOT EXISTS refunds_payment_idx ON refunds(payment_id);

CREATE TABLE IF NOT EXISTS shipments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
 status shipment_status NOT NULL DEFAULT 'pending', carrier varchar(120), tracking_number varchar(120), notes text,
 created_at timestamptz NOT NULL DEFAULT now(), shipped_at timestamptz, delivered_at timestamptz
);
CREATE TABLE IF NOT EXISTS invoices (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
 invoice_number varchar(60) NOT NULL UNIQUE, status invoice_status NOT NULL DEFAULT 'draft', subtotal_xaf integer NOT NULL,
 delivery_fee_xaf integer NOT NULL, discount_xaf integer NOT NULL, tax_xaf integer NOT NULL, total_xaf integer NOT NULL,
 currency varchar(3) NOT NULL DEFAULT 'XAF', issued_at timestamptz, paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS notifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid REFERENCES users(id) ON DELETE CASCADE, order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
 type varchar(60) NOT NULL, channel varchar(30) NOT NULL DEFAULT 'in_app', status notification_status NOT NULL DEFAULT 'pending',
 title varchar(180) NOT NULL, message text NOT NULL, sent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, created_at DESC);
CREATE TABLE IF NOT EXISTS contact_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name varchar(120) NOT NULL, phone varchar(30) NOT NULL, email varchar(190), subject varchar(180),
 message text NOT NULL, status varchar(30) NOT NULL DEFAULT 'new', created_at timestamptz NOT NULL DEFAULT now(), handled_at timestamptz
);
CREATE INDEX IF NOT EXISTS contact_requests_status_idx ON contact_requests(status);
CREATE TABLE IF NOT EXISTS audit_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL, action varchar(100) NOT NULL,
 entity_type varchar(60) NOT NULL, entity_id varchar(120), metadata jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_logs_created_idx ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx ON audit_logs(actor_user_id);
