import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAppUrl } from "@/lib/utils";
import { FEATURES } from "@/lib/site";

// Plan du site généré depuis la base réelle (aucune URL fictive).
// Les URLs deviennent absolues avec le domaine dès que
// NEXT_PUBLIC_APP_URL est configuré (voir docs/domaine.md).
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: now },
    { url: `${base}/boutique`, lastModified: now },
    { url: `${base}/contact`, lastModified: now },
    { url: `${base}/a-propos`, lastModified: now },
    { url: `${base}/cgv`, lastModified: now },
    { url: `${base}/confidentialite`, lastModified: now },
    { url: `${base}/retours`, lastModified: now },
  ];
  if (FEATURES.services) urls.push({ url: `${base}/services`, lastModified: now });
  if (FEATURES.gallery) urls.push({ url: `${base}/galerie`, lastModified: now });
  try {
    const ps = await db.select({ slug: products.slug }).from(products).where(eq(products.published, true));
    for (const p of ps) urls.push({ url: `${base}/boutique/${p.slug}`, lastModified: now });
  } catch { /* base indisponible au build : sitemap partiel, régénéré ensuite */ }
  return urls;
}
