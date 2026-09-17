# FABIOLE METAL — E-commerce V3

Version de référence complète basée sur l'architecture existante **Next.js + TypeScript + Drizzle ORM + Neon PostgreSQL**. Cette version n'utilise pas une nouvelle architecture parallèle et ne remplace pas Neon.

## Ce qui est maintenant réellement couvert

### Catalogue
- produits, catégories, SKU, prix XAF, prix promotionnels, stock et seuil de stock
- archivage au lieu de suppression destructive
- galerie produit multi-images par URL
- galerie générale et services administrables

### Authentification
- inscription / connexion
- cookie JWT httpOnly, Secure en production, SameSite=Lax
- durée de session limitée à 7 jours
- vérification du rôle depuis la base à chaque requête protégée
- déconnexion
- récupération de mot de passe avec jeton hashé et expiration
- envoi de reset par Resend si configuré
- rate limiting persistant dans PostgreSQL

### Panier / commande
- panier persistant par utilisateur authentifié
- quantités contrôlées côté serveur
- prix jamais acceptés depuis le navigateur
- prix promotionnel recalculé depuis Neon
- adresse enregistrée ou nouvelle adresse
- snapshot de l'adresse dans la commande
- snapshot du nom/SKU/prix dans `order_items`
- idempotence via `Idempotency-Key`
- transaction PostgreSQL pour réservation du stock
- protection contre la vente concurrente d'un stock insuffisant
- marqueur `stock_released_at` pour empêcher une double restitution du stock

### Paiement
- adaptateur CinetPay côté serveur
- transaction créée avec montant et devise issus de la commande serveur
- retour navigateur jamais considéré comme preuve de paiement
- vérification serveur auprès du prestataire
- webhook signé
- identifiant d'événement unique pour l'idempotence
- vérification montant/devise
- états de paiement persistés
- protection contre la rétrogradation d'un paiement déjà confirmé
- réconciliation des paiements expirés via tâche cron sécurisée

### Commandes / livraison
- statuts contrôlés et transitions limitées
- impossibilité d'annuler directement une commande déjà payée : remboursement d'abord
- expédition uniquement après paiement confirmé
- transporteur, numéro de suivi, dates et notes
- facture créée uniquement après paiement confirmé

### Remboursements
- demandes enregistrées dans Neon
- cumul contrôlé pour éviter de rembourser plus que le paiement
- traitement manuel possible depuis l'administration avec référence prestataire
- passage automatique du paiement à `partially_refunded` ou `refunded` après traitement

### Administration
- produits
- catégories
- commandes
- clients
- paiements
- remboursements
- galerie
- services
- messages de contact
- journal d'audit
- expéditions via API protégée

### Sécurité / production
- validation Zod des entrées sensibles
- protections serveur sur toutes les routes admin
- contrôle de propriété des commandes et adresses
- rate limiting PostgreSQL
- en-têtes HTTP de sécurité
- secrets uniquement côté serveur
- journalisation des actions importantes
- migration versionnée et non destructive

## Base Neon

Le projet peut partir d'une base Neon **fraîche**, ce qui correspond à la situation actuelle du projet.

```bash
npm install
cp .env.example .env.local
npm run db:migrate
npm run db:seed
npm run dev
```

`db:migrate` applique toutes les migrations SQL dans `db/migrations/` et enregistre leur application dans `schema_migrations`.

Il ne faut pas utiliser `db:push` sur cette base de production. La migration est le mécanisme de référence.

Si une ancienne base V1/V2 existe déjà, `0002_v1_compatibility.sql` ajoute les éléments manquants sans DROP/TRUNCATE.

## Variables obligatoires

```env
DATABASE_URL="..."
AUTH_SECRET="au moins 32 caractères aléatoires"
NEXT_PUBLIC_APP_URL="https://votre-domaine.tld"
NEXT_PUBLIC_WHATSAPP="237678027116"
CRON_SECRET="secret long"
```

Pour les paiements :

```env
CINETPAY_APIKEY="..."
CINETPAY_SITE_ID="..."
CINETPAY_SECRET_KEY="..."
CINETPAY_CHANNELS="ALL"
CINETPAY_MODE="TEST"
```

Pour la récupération de mot de passe par email :

```env
RESEND_API_KEY="..."
RESEND_FROM_EMAIL="FABIOLE METAL <noreply@votre-domaine.tld>"
```

## CinetPay

Le paiement réel nécessite un compte marchand CinetPay, les identifiants marchands et une URL publique accessible par CinetPay.

Webhook :

```text
/api/payments/cinetpay/webhook
```

Retour navigateur :

```text
/paiement/retour
```

La commande ne devient jamais `confirmed` simplement parce que le client revient du guichet de paiement.

## Expiration et stock

Une commande réserve le stock au moment de la création du paiement. Si le paiement échoue, est annulé ou expire, le stock est restitué une seule fois.

En production, le cron :

```text
/api/jobs/reconcile-payments
```

est exécuté toutes les 10 minutes via `vercel.json`. Il exige `CRON_SECRET`.

## Images

Neon stocke les métadonnées et URLs, pas les fichiers binaires. Le projet est prêt pour Cloudinary, Vercel Blob ou S3, mais les identifiants de stockage doivent être configurés avant d'ajouter un upload direct.

Les images Wikimedia présentes dans le projet sont des références et ne doivent pas être présentées comme des réalisations FABIOLE METAL.

## Tests locaux

```bash
npm run security:check
npm run typecheck
npm run build
```

Pour vérifier la base réellement connectée :

```bash
npm run db:status
```

Ce dernier commande lit uniquement la base et n'effectue aucune modification.

## Première création de l'administrateur

Créer un compte avec `/inscription`, puis dans le SQL Editor Neon :

```sql
UPDATE users SET role = 'admin' WHERE email = 'votre@email.com';
```

Déconnectez-vous/reconnectez-vous ensuite afin que le nouveau rôle soit pris en compte.
