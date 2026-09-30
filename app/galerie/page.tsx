import Link from "next/link";
import { db } from "@/lib/db";
import { gallery } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { waLink } from "@/lib/utils";
import GalleryGrid from "@/components/GalleryGrid";
import { notFound } from "next/navigation";
import { FEATURES } from "@/lib/site";

export default async function Galerie() {
  // Module optionnel du template.
  if (!FEATURES.gallery) return notFound();
  let gs: any[] = [];
  try {
    gs = await db.select().from(gallery).where(eq(gallery.published, true)).orderBy(desc(gallery.createdAt));
  } catch {}
  const refs = [
    { u: "/produits/portail-moderne-noir.jpg", t: "Portail moderne" },
    { u: "/produits/porte-entree-volutes.jpg", t: "Porte d'entrée + volutes" },
    { u: "/produits/porte-decorative-grille.jpg", t: "Porte décorative + grille" },
    { u: "/produits/grille-fenetre-volutes.jpg", t: "Grille fenêtre à volutes" },
    { u: "/produits/grille-fenetre-motif.jpg", t: "Grille fenêtre motif" },
    { u: "/produits/barbecue-sur-pieds.jpg", t: "Barbecue sur pieds" },
  ];
  const items = gs.length
    ? gs.map((x) => ({ img: x.imageUrl, title: x.title, cat: x.category || "Atelier", isVideo: String(x.imageUrl || "").toLowerCase().endsWith(".mp4") }))
    : refs.map((r) => ({ img: r.u, title: r.t, cat: "Atelier", isVideo: false }));
  return (
    <main className="section">
      <div className="container">
        <div className="head">
          <span className="eyebrow">Galerie</span>
          <h1>
            Réalisations de <span className="gradient">l’atelier.</span>
          </h1>
          <p>
            Photos réelles des ouvrages fabriqués et posés par FABIOLE METAL à Bojongo. {items.length} réalisation{items.length > 1 ? "s" : ""} : objets en boutique, chantier sur devis et vidéos d’atelier.
          </p>
        </div>
        <GalleryGrid items={items} />
        <div className="actions" style={{ marginTop: 24 }}>
          <Link href="/boutique" className="btn btn-primary">
            Voir la boutique
          </Link>
          <a
            className="btn"
            href={waLink("Bonjour FABIOLE METAL, je souhaite un modèle vu dans la galerie.")}
            target="_blank"
            rel="noopener"
          >
            Demander sur WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
