-- Panier invité (template) : un visiteur peut ajouter au panier sans compte.
-- Le panier est rattaché soit à user_id (connecté), soit à guest_token
-- (cookie fm_cart, uuid). À la connexion, le contenu invité est fusionné.
-- Idempotent : réexécutable sans effet.
ALTER TABLE carts ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE carts ADD COLUMN IF NOT EXISTS guest_token varchar(64);
CREATE UNIQUE INDEX IF NOT EXISTS carts_guest_token_unique ON carts(guest_token);
