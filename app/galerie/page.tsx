import Link from "next/link";
import { db } from "@/lib/db";
import { gallery } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { waLink } from "@/lib/utils";

export default async function Galerie() {
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
    ? gs.map((x) => ({ img: x.imageUrl, title: x.title, cat: x.category }))
    : refs.map((r) => ({ img: r.u, title: r.t, cat: "Atelier" }));
  return (
    <main className="section">
      <div className="container">
        <div className="head">
          <span className="eyebrow">Galerie</span>
          <h1>
            Réalisations de <span className="gradient">l’atelier.</span>
          </h1>
          <p>
            Photos réelles des ouvrages fabriqués et posés par FABIOLE METAL à Bojongo. {items.length} réalisation{items.length > 1 ? "s" : ""}.
          </p>
        </div>
        <div className="gallery">
          {items.map((x, i) => (
            <figure className="g-card" key={i}>
              <div className="g-media">
                <img src={x.img} alt={x.title} loading="lazy" />
                {x.cat && <span className="g-cat">{x.cat}</span>}
              </div>
              <figcaption>
                <strong title={x.title}>{x.title}</strong>
                <span>{x.cat || "Fabrication sur mesure"}</span>
                <Link
                  className="g-cta"
                  href={`/contact?objet=${encodeURIComponent("Modèle galerie : " + x.title)}`}
                >
                  Commander ce modèle →
                </Link>
              </figcaption>
            </figure>
          ))}
        </div>
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
