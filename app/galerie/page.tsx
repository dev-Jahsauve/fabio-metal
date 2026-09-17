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
            Réalisations & <span className="gradient">inspirations.</span>
          </h1>
          <p>Le dashboard permettra de publier les photos réelles de FABIOLE METAL et de les classer par catégorie.</p>
        </div>
        <div className="gallery">
          {(gs.length ? gs.map((x) => x.imageUrl) : refs).map((u: string, i: number) => (
            <img key={i} src={u} alt="Fabrication métallique" loading="lazy" />
          ))}
        </div>
      </div>
    </main>
  );
}
