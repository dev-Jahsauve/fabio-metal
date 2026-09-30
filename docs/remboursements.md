# Procédure remboursement opérateur (générique)

Ce template ne déclenche JAMAIS de remboursement automatique côté opérateur
de paiement : tout remboursement est une action manuelle, tracée, en deux
temps (opérateur puis back-office).

## 1. Identifier le remboursement

- `/admin` → Commandes : retrouvez la commande (référence, ex : `FM3FA2…`).
- `/admin` → Paiements : notez la transaction (`transactionId`), le montant
  réellement payé et la date. Vérifiez le statut du paiement (`success`).
- `/admin` → Remboursements : vérifiez qu'aucun remboursement `processed`
  n'existe déjà pour ce paiement (plafond = montant payé, anti-doublon).

## 2. Vérifications avant d'agir

- La commande est-elle éligible (voir page Retours du site : article
  standard sous 7 jours, défaut avéré pour le sur-mesure) ?
- Montant demandé ≤ montant payé − remboursements déjà traités ?
- En cas de paiement « débité sans commande » : vérifiez d'abord le statut
  réel côté tableau de bord NelsiusPay (le retour navigateur ne prouve rien).

## 3. Exécuter

1. Effectuez le remboursement depuis le tableau de bord NelsiusPay
   (mobile money / carte vers le numéro d'origine). Notez la référence
   opérateur fournie.
2. Dans `/admin` → Remboursements : « Marquer traité » en renseignant la
   référence opérateur, ou créez la demande avec le motif.
3. Mettez à jour la commande (`refunded` ou `cancelled` selon le cas) et
   laissez un commentaire interne avec : date, montant, référence opérateur,
   motif.
4. Le client est notifié automatiquement (notification « remboursement ») ;
   confirmez-lui par WhatsApp le délai constaté (indicatif 7 à 15 jours).

## 4. Traces à conserver

Référence commande, `transactionId`, montant, référence opérateur, date,
captures du tableau de bord. Ne supprimez jamais une ligne de remboursement.
