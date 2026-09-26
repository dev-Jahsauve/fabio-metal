import Link from "next/link";
import ServiceCarousel from "@/components/ServiceCarousel";
import AddToCartButton from "@/components/AddToCartButton";
import { db } from "@/lib/db";
import { products, services, gallery, categories } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import { formatXaf, waLink } from "@/lib/utils";

const fallbackServices = [
  ["POR", "Portails & clôtures", "Portails battants ou coulissants, grilles et ouvrages sur mesure."],
  ["POR", "Portes métalliques", "Portes de sécurité et portes décoratives fabriquées selon vos dimensions."],
  ["FEN", "Fenêtres & grilles", "Fenêtres métalliques, protections et ouvrages adaptés à votre habitation."],
  ["MOB", "Salle à manger", "Tables, chaises et mobilier métallique réalisés à la demande."],
  ["RDM", "Porte-rideaux", "Rideaux métalliques et solutions robustes pour commerces et locaux."],
  ["SUR", "Fabrication sur mesure", "Vous avez un modèle ou un croquis ? L'atelier peut l'adapter et le fabriquer."],
];

const HERO_THUMBS = [
  "/produits/portail-moderne-noir.jpg",
  "/produits/porte-entree-volutes.jpg",
  "/produits/grille-fenetre-volutes.jpg",
];

const SHOWCASE = [
  {
    img: "/produits/porte-decorative-grille.jpg",
    title: "Soudure de précision",
    sub: "Assemblages solides et finitions soignées",
  },
  {
    img: "/produits/panneau-porte-embouti.jpg",
    title: "Étude sur mesure",
    sub: "Dimensions et plans validés avec vous",
  },
  {
    img: "/produits/barbecue-sur-pieds.jpg",
    title: "Pose et ouvrages",
    sub: "Portails, grilles et structures métalliques",
  },
];

const GALLERY_FALLBACK = [
  "/produits/portail-moderne-noir.jpg",
  "/produits/porte-entree-volutes.jpg",
  "/produits/grille-fenetre-volutes.jpg",
  "/produits/grille-fenetre-motif.jpg",
];

export default async function Home() {
  let ps: any[] = [];
  let gs: any[] = [];
  let sv: any[] = [];
  try {
    [ps, gs, sv] = await Promise.all([
      db.select({ p: products, categoryName: categories.name }).from(products).leftJoin(categories, eq(products.categoryId, categories.id)).where(eq(products.published, true)).orderBy(desc(products.createdAt)).limit(6),
      db.select().from(gallery).where(eq(gallery.published, true)).orderBy(desc(gallery.createdAt)).limit(4),
      db.select().from(services).where(eq(services.published, true)).orderBy(asc(services.sortOrder)).limit(8),
    ]);
  } catch {}

  const serviceItems = sv.length
    ? sv.map((s) => [s.icon || "MET", s.title, s.description || "Fabrication métallique sur mesure."])
    : fallbackServices;

  const galleryImages = gs.length ? gs.map((g) => g.imageUrl) : GALLERY_FALLBACK;

  return (
    <main>
      <section className="container hero">
        <div>
          <span className="eyebrow">Métallerie · Soudure · Fabrication sur mesure</span>
          <h1>
            Le métal façonné pour <span className="gradient">vos projets.</span>
          </h1>
          <p>
            FABIOLE METAL conçoit et fabrique des ouvrages en fer pour particuliers, commerces et
            entreprises : portails, portes, fenêtres, mobilier, porte-rideaux et réalisations
            personnalisées.
          </p>
          <div className="actions">
            <Link href="/boutique" className="btn btn-gold">
              Voir la boutique
            </Link>
            <a
              className="btn"
              href={waLink("Bonjour FABIOLE METAL, je souhaite demander un devis pour un ouvrage métallique.")}
            >
              Contacter WhatsApp
            </a>
          </div>
          <div className="trust-bar">
            <span className="trust-pill">
              <i /> Devis rapide
            </span>
            <span className="trust-pill blue">
              <i /> Sur mesure
            </span>
            <span className="trust-pill orange">
              <i /> Bojongo · +237 698 30 87 80
            </span>
          </div>
        </div>
        <div className="hero-media">
          <div className="hero-img">
            <div className="hero-caption">
              <strong>Du croquis à l’ouvrage.</strong>
              <span>Une fabrication pensée selon vos dimensions, votre usage et votre style.</span>
            </div>
          </div>
          <div className="hero-thumbs">
            {HERO_THUMBS.map((u) => (
              <img key={u} src={u} alt="Atelier et fabrication métallique" loading="lazy" />
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="head">
            <span className="eyebrow">Nos services</span>
            <h2>
              Une offre claire, du <span className="gradient">sur-mesure</span> à la finition.
            </h2>
            <p>Portails, portes, fenêtres, grilles, mobilier métallique et fabrication personnalisée.</p>
          </div>
          <ServiceCarousel items={serviceItems} />
          <div className="showcase">
            {SHOWCASE.map((s) => (
              <figure key={s.title}>
                <img src={s.img} alt={s.title} loading="lazy" />
                <figcaption>
                  {s.title}
                  <span>{s.sub}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="head">
            <span className="eyebrow">Boutique</span>
            <h2>
              Des ouvrages disponibles ou <span className="gradient">personnalisables.</span>
            </h2>
            <p>Les prix sont calculés depuis la base et peuvent être administrés sans modifier le code.</p>
          </div>
          {ps.length ? (
            <div className="shop-grid">
              {ps.map(({ p, categoryName }) => (
                <article className="product" key={p.id}>
                  <div className="product-media">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} loading="lazy" />
                    ) : (
                      <div className="product-media-fallback" aria-hidden="true">
                        FM
                      </div>
                    )}
                    <div className="product-badges">
                      {p.promoPriceXaf ? <span className="badge-promo">PROMO</span> : null}
                    </div>
                  </div>
                  <div className="product-body">
                    <div className="product-top">
                      {categoryName ? <span className="pill pill-cat">{categoryName}</span> : <span />}
                      {p.stock <= 0 ? <span className="pill pill-out">Rupture</span> : p.stock <= 5 ? <span className="pill pill-low">Plus que {p.stock}</span> : <span className="pill pill-ok">En stock</span>}
                    </div>
                    <h3 title={p.name}>{p.name}</h3>
                    <p className="product-desc">{p.description}</p>
                    <div className="price">
                      {formatXaf(p.promoPriceXaf ?? p.priceXaf)}
                      {p.promoPriceXaf && (
                        <del className="old-price">{formatXaf(p.priceXaf)}</del>
                      )}
                    </div>
                    <div className="product-actions">
                      <div className="product-actions-main">
                        <AddToCartButton productId={p.id} stock={p.stock} />
                      </div>
                      <div className="product-actions-row">
                        <Link className="btn" href={`/boutique/${p.slug}`}>
                          Détails
                        </Link>
                        <a
                          className="btn"
                          href={waLink(`Bonjour FABIOLE METAL, je suis intéressé par "${p.name}".`)}
                          target="_blank"
                          rel="noopener"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="cards">
              <article className="card card-accent">
                <div className="icon">01</div>
                <h3>Catalogue administrable</h3>
                <p>Les articles et prix sont ajoutés depuis le dashboard.</p>
              </article>
              <article className="card card-blue">
                <div className="icon">02</div>
                <h3>Panier sécurisé</h3>
                <p>Le serveur recalcule les prix au moment de la commande.</p>
              </article>
              <article className="card card-green">
                <div className="icon">03</div>
                <h3>Sur mesure</h3>
                <p>Les ouvrages personnalisés restent pilotables par devis.</p>
              </article>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="head">
            <span className="eyebrow">Galerie</span>
            <h2>
              Quelques inspirations de <span className="gradient">métallerie.</span>
            </h2>
            <p>
              Les images de démonstration restent des références et devront être remplacées par les
              photos réelles de FABIOLE METAL.
            </p>
          </div>
          <div className="gallery">
            {galleryImages.map((u: string, i: number) => (
              <figure className="g-card" key={i}>
                <div className="g-media">
                  <img src={u} alt="Référence de fabrication métallique" loading="lazy" />
                  <span className="g-cat">Atelier</span>
                </div>
                <figcaption>
                  <strong>Réalisation {i + 1}</strong>
                  <span>Fabrication sur mesure</span>
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="actions" style={{ marginTop: 22 }}>
            <Link href="/galerie" className="btn btn-primary">
              Voir toute la galerie
            </Link>
            <Link href="/contact" className="btn">
              Demander un devis
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container about">
          <div>
            <span className="eyebrow">FABIOLE METAL</span>
            <h2>
              Une présence locale, une fabrication <span className="gradient">personnalisée.</span>
            </h2>
            <p style={{ color: "var(--muted)", lineHeight: 1.7 }}>
              Situé face à la mairie de Bojongo, l’atelier peut présenter ses créations, recevoir les
              demandes et publier progressivement son catalogue en ligne.
            </p>
            <img
              className="about-img"
              src="/produits/support-marmite.jpg"
              alt="Chantier et ouvrages métalliques"
              loading="lazy"
              style={{ marginTop: 18 }}
            />
          </div>
          <div className="card">
            <h3>Votre projet mérite un ouvrage adapté.</h3>
            <p>
              Dimensions, modèle, finition et quantité sont précisés avant validation. Le prix des
              articles catalogue reste configurable par l’administrateur.
            </p>
            <div style={{ marginTop: 18 }} className="actions">
              <a
                className="btn btn-gold"
                href={waLink("Bonjour FABIOLE METAL, je souhaite discuter d'un projet de fabrication métallique.")}
              >
                Parler du projet
              </a>
              <Link className="btn" href="/services">
                Découvrir les services
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
