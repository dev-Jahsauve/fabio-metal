# Neon / PostgreSQL — FABIOLE METAL V3

## Base Neon fraîche

Le projet Neon peut être simplement créé avec PostgreSQL. Aucun autre service Neon n'est requis pour démarrer.

Dans `.env.local` :

```env
DATABASE_URL="postgresql://..."
```

Puis :

```bash
npm run db:migrate
npm run db:seed
```

La migration crée le schéma complet. Elle ne fait aucun `DROP`, `TRUNCATE` ou reset.

## Base V1/V2 existante

Le runner applique également `0002_v1_compatibility.sql`. Cette migration ajoute les structures manquantes et ne supprime pas les données.

## Vérification en lecture seule

```bash
npm run db:status
```

## Images

Neon ne stocke pas les fichiers image du catalogue. Le champ `image_url` et `product_images.image_url` stockent des URLs. Utiliser ensuite un stockage adapté comme Cloudinary, Vercel Blob ou S3.
