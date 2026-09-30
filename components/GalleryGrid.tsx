"use client";
import Link from "next/link";
import { useMemo, useState } from "react";

export type GalleryItem = { img: string; title: string; cat: string; isVideo: boolean };

// Image produit -> fiche boutique correspondante (les 2 nouveautés + anciens).
const PRODUCT_LINK: Record<string, string> = {
  "/produits/porte-metallique-2-battants.jpg": "/boutique/porte-metallique-2-battants-motifs",
  "/produits/coffre-livraison-moto.jpg": "/boutique/coffre-malle-livraison-moto",
  "/produits/portail-moderne-noir.jpg": "/boutique/portail-moderne-tole-noir",
  "/produits/porte-entree-volutes.jpg": "/boutique/porte-entree-fer-forge-volutes",
  "/produits/porte-decorative-grille.jpg": "/boutique/porte-decorative-grille-antivol",
  "/produits/panneau-porte-embouti.jpg": "/boutique/panneau-porte-tole-emboutie",
  "/produits/barbecue-sur-pieds.jpg": "/boutique/barbecue-grill-sur-pieds",
  "/produits/support-marmite.jpg": "/boutique/support-marmite-foyer",
  "/produits/patere-murale.jpg": "/boutique/patere-murale-fer-forge",
  "/produits/plateau-rond-renforce.jpg": "/boutique/plateau-rond-renforce",
  "/produits/grille-fenetre-volutes.jpg": "/boutique/grille-fenetre-volutes",
  "/produits/grille-fenetre-motif.jpg": "/boutique/grille-fenetre-motif-geometrique",
};

function ctaFor(x: GalleryItem) {
  if (x.isVideo) return { label: "Demander une réalisation similaire →", href: `/contact?objet=${encodeURIComponent("Modèle vidéo galerie : " + x.title)}`, sub: "Savoir-faire de l'atelier" };
  if (x.cat === "Structures") return { label: "Demander un devis →", href: `/contact?objet=${encodeURIComponent("Projet structure : " + x.title)}`, sub: "Gros ouvrage sur devis, sans stock" };
  if (x.cat === "Livraison") return { label: "Voir en boutique →", href: PRODUCT_LINK[x.img] || "/boutique", sub: "Accessoire vendable + preuve de livraison" };
  const shop = PRODUCT_LINK[x.img];
  if (shop) return { label: "Commander ce modèle →", href: `/contact?objet=${encodeURIComponent("Modèle galerie : " + x.title)}`, sub: x.cat || "Fabrication sur mesure", shop };
  return { label: "Commander ce modèle →", href: `/contact?objet=${encodeURIComponent("Modèle galerie : " + x.title)}`, sub: x.cat || "Fabrication sur mesure" };
}

export default function GalleryGrid({ items }: { items: GalleryItem[] }) {
  const cats = useMemo(() => ["Tout", ...Array.from(new Set(items.map((x) => x.cat).filter(Boolean)))], [items]);
  const [active, setActive] = useState("Tout");
  const list = active === "Tout" ? items : items.filter((x) => x.cat === active);
  return (
    <>
      <div className="filter-pills" role="tablist" aria-label="Filtrer par catégorie">
        {cats.map((c) => (
          <button key={c} className={active === c ? "active" : ""} onClick={() => setActive(c)}>
            {c} {c === "Tout" ? `(${items.length})` : ""}
          </button>
        ))}
      </div>
      <div className="gallery">
        {list.map((x, i) => {
          const cta = ctaFor(x);
          return (
            <figure className="g-card" key={x.img + i}>
              <div className={`g-media${x.isVideo ? " g-media-video" : ""}`}>
                {x.isVideo ? (
                  <video src={x.img} controls preload="metadata" playsInline />
                ) : (
                  <img src={x.img} alt={x.title} loading="lazy" />
                )}
                {x.cat && <span className="g-cat">{x.cat}</span>}
                {x.isVideo && <span className="g-badge-video">▶ Vidéo</span>}
              </div>
              <figcaption>
                <strong title={x.title}>{x.title}</strong>
                <span>{cta.sub}</span>
                <div className="g-actions">
                  <Link className="g-cta" href={cta.href}>
                    {cta.label}
                  </Link>
                  {"shop" in cta && cta.shop && (
                    <Link className="g-cta" href={cta.shop}>
                      Voir en boutique →
                    </Link>
                  )}
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>
      {!list.length && <div className="card">Aucune réalisation dans cette catégorie.</div>}
    </>
  );
}
