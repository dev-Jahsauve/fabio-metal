# Audit / corrections V3 — FABIOLE METAL

## Situation de départ

Le projet V2 avait déjà été enrichi mais supposait implicitement que certaines structures avaient été appliquées à Neon. Le projet V3 est autonome : il contient le schéma complet et les migrations nécessaires pour une base Neon fraîche, tout en conservant une migration de compatibilité non destructive pour une ancienne V1/V2.

## Corrections importantes

- Le schéma complet ne dépend plus d'une exécution préalable de la V1.
- Les migrations sont versionnées dans `db/migrations/`.
- Le runner applique toutes les migrations non encore enregistrées dans `schema_migrations`.
- Les prix de commande sont toujours relus depuis `products`.
- Les prix historiques sont figés dans `order_items`.
- Le stock est décrémenté de manière atomique dans une transaction PostgreSQL.
- `stock_released_at` empêche une double restitution du stock.
- Les commandes payées ne peuvent pas être annulées par l'admin sans passer par un remboursement.
- Les expéditions exigent un paiement confirmé.
- Les remboursements cumulés sont plafonnés au montant réellement payé.
- Les paiements confirmés ne peuvent pas être rétrogradés par un événement tardif.
- Les événements de paiement ont un identifiant unique.
- Les paiements expirés disposent d'une tâche de réconciliation.
- Le rate limiting ne repose plus uniquement sur la mémoire d'un processus serverless.
- Les rôles admin sont relus depuis Neon plutôt que de faire confiance uniquement au rôle présent dans un JWT ancien.
- Ajout de récupération de mot de passe sécurisée.
- Ajout de gestion d'adresses.
- Ajout de notifications client persistées.
- Ajout d'API d'administration pour clients, paiements, remboursements, catégories, galerie, services et journal.
- Ajout de contrôles de sécurité HTTP.
- Ajout de vérifications statiques des secrets.

## Ce qui reste externe

- compte marchand CinetPay et clés API
- domaine public et URL HTTPS
- configuration du webhook CinetPay
- éventuel fournisseur d'email Resend
- éventuel fournisseur d'images Cloudinary/Vercel Blob/S3
- photos réelles de FABIOLE METAL

## Limitation de validation dans cet environnement

L'installation complète des dépendances a dépassé le délai d'exécution disponible pendant la préparation de cette archive. Aucun `next build` complet n'est donc déclaré comme réussi ici. Les scripts de vérification sont inclus dans le projet pour être exécutés localement après `npm install`.
