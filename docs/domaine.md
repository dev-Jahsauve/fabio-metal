# Mise en production sur domaine définitif (checklist)

Tout ce qui suit EXIGE l'URL HTTPS publique. Ne rien configurer avec une
URL devinée : chaque étape dépend du domaine réel.

## 1. URL publique

```bash
NEXT_PUBLIC_APP_URL="https://votre-domaine.com"   # sans slash final
```

Redéployer. Impacts automatiques : liens de paiement (`return_url`,
`cancel_url`), sitemap/robots absolus, Open Graph, emails.

## 2. NelsiusPay

1. Dans le tableau de bord marchand, déclarer le webhook :
   `https://votre-domaine.com/api/payments/nelsiuspay/webhook`.
2. Passer `NELSIUSPAY_MODE="live"` (seule une clé `sk_live_...` est alors
   acceptée ; en mode `test`, seule une clé `sk_test_...` l'est — le code
   refuse toute incohérence, voir `lib/nelsiuspay.ts`).
3. Effectuer UNE transaction réelle minimale (article le moins cher) et
   vérifier : commande → webhook → paiement `success` → facture → commande
   `confirmed`. Ne jamais multiplier les tests live.

## 3. Emails Resend

1. Ajouter le domaine dans Resend et renseigner les enregistrements DNS
   (SPF/DKIM) demandés.
2. `RESEND_FROM_EMAIL="Nom Boutique <noreply@votre-domaine.com>"`.
3. Tester `/mot-de-passe-oublie` de bout en bout. La procédure manuelle
   (`docs/reset-manuel.md`) devient le plan B.

## 4. Google OAuth

Dans Google Cloud Console → identifiants du client OAuth : ajouter
`https://votre-domaine.com` aux **origines JavaScript autorisées**.
Aucun changement de code requis (`NEXT_PUBLIC_GOOGLE_CLIENT_ID` inchangé).

## 5. Cron externe

Configurer l'appel toutes les 10 minutes (voir `docs/cron.md`). Le cron
Vercel quotidien reste en filet de sécurité.

## 6. Contrôles finaux

- `npm run verify && npm run build` verts après chaque changement d'env.
- Parcours invité → inscription → commande → paiement → facture →
  expédition → notification, sur mobile et desktop.
- Sitemap/OG revalidés avec les URLs absolues.
