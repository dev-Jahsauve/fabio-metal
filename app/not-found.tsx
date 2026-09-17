import Link from "next/link";
export default function NotFound(){return <main className="section"><div className="container" style={{maxWidth:720}}><div className="card"><span className="eyebrow">404</span><h1>Page introuvable.</h1><p>La page ou le produit demandé n'existe plus ou n'est pas publié.</p><Link className="btn btn-gold" href="/">Retour à l'accueil</Link></div></div></main>}
