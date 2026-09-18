import { db } from "@/lib/db";
import { gallery } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function Galerie() {
  let gs: any[] = [];
  try {
    gs = await db.select().from(gallery).where(eq(gallery.published, true)).orderBy(desc(gallery.createdAt));
  } catch {}
  const refs = [
    "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&q=80&auto=format&fit=crop",
    "https://upload.wikimedia.org/wikipedia/commons/3/3c/Iron_Gate_welding.jpg",
  ];
  return (
    <main className="section">
      <div className="container">
        <div className="head">
          <span className="eyebrow">Galerie</span>
          <h1>
            Réalisations de <span className="gradient">l’atelier.</span>
          </h1>
          <p>Photos réelles des ouvrages fabriqués et posés par FABIOLE METAL à Bojongo.</p>
        </div>
        {gs.length ? (
          <div className="gallery">
            {gs.map((x) => (
              <figure key={x.id}>
                <img src={x.imageUrl} alt={x.title} loading="lazy" />
                <figcaption>
                  {x.title}
                  {x.category && <span>{x.category}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <div className="gallery">
            {refs.map((u: string, i: number) => (
              <img key={i} src={u} alt="Fabrication métallique" loading="lazy" />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
