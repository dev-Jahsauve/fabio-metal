import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/utils";

// Base configurable : passe automatiquement en URLs absolues du domaine
// dès que NEXT_PUBLIC_APP_URL est renseigné (voir docs/domaine.md).
export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/compte",
          "/commandes",
          "/factures",
          "/checkout",
          "/panier",
          "/parametres",
          "/paiement/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
