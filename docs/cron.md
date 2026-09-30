# Réconciliation des paiements — cron

## Rôle

`GET /api/jobs/reconcile-payments` revérifie côté prestataire les paiements
`pending`/`processing` dont le délai est dépassé, puis confirme ou clôture
proprement (stock restauré une seule fois, artefacts facture/livraison
idempotents, déduplication partagée webhook/refresh/cron). Sans appel
régulier, un paiement expiré reste affiché « en vérification ».

## Authentification

`Authorization: Bearer CRON_SECRET` (même valeur que la variable
d'environnement). Sans ce header : `401`.

## Configuration actuelle (Vercel Hobby)

`vercel.json` exécute le cron **1 fois par jour à 02h00** (limite du plan
gratuit). C'est suffisant pour solder les expirés, mais pas pour un suivi
rapproché.

## Cible : toutes les 10 minutes (après domaine)

Le plan Hobby ne le permet pas en natif : utilisez un cron externe gratuit
(ex : cron-job.org, UptimeRobot, GitHub Actions `schedule`) qui appelle :

```text
GET https://votre-domaine.com/api/jobs/reconcile-payments
Header: Authorization: Bearer <CRON_SECRET>
```

Toutes les 10 minutes. Réponse : `{ "scanned": N, "processed": M }`.
Surveillez `processed` : un pic inhabituel signale des paiements en échec
répétés côté prestataire.

## Idempotence

Relancer le cron est sans danger : événement déjà traité = ignoré
(contrainte unique `payment_events.event_id`), paiement déjà terminal =
jamais modifié, stock restauré une seule fois (`stock_released_at`).
