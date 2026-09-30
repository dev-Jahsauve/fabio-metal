# Reset mot de passe manuel (phase sans domaine vérifié)

Contexte : l'envoi d'emails via Resend exige un domaine expéditeur vérifié.
Tant que ce n'est pas fait, un client qui oublie son mot de passe ne reçoit
aucun email. Procédure de secours ci-dessous.

## Réinitialiser le mot de passe d'un client

```bash
npm run admin:password
```

Le script demande l'email du compte puis le nouveau mot de passe (minimum
8 caractères), et l'enregistre chiffré en base. Communiquez ensuite le mot
de passe temporaire au client par WhatsApp en lui demandant de le changer
dans Paramètres → Mot de passe dès sa prochaine connexion.

## Vérifications

- Ne réinitialisez que sur demande explicite du titulaire du compte
  (vérifiez le numéro WhatsApp / l'identité).
- Ne communiquez jamais un mot de passe par un canal non chiffré autre que
  WhatsApp, et imposez son changement immédiat.
- Chaque utilisation est tracée : notez la date et le motif dans le journal
  d'audit (`/admin` → Journal) via l'action correspondante si disponible.

## Fin de la phase temporaire

Dès que le domaine est vérifié chez Resend (voir `docs/domaine.md`), le
parcours automatique `/mot-de-passe-oublie` prend le relais et cette
procédure ne sert plus qu'en dernier recours.
