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
    { u: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80&auto=format&fit=crop", t: "Soudure de précision" },
    { u: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80&auto=format&fit=crop", t: "Portails & grilles" },
    { u: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format&fit=crop", t: "Ouvrages & pose" },
    { u: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80&auto=format&fit=crop", t: "Chantier métallique" },
    { u: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80&auto=format&fit=crop", t: "Étude sur mesure" },
    { u: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Iron_Gate_welding.jpg", t: "Portail forgé" },
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
