import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import CartView from '@/components/CartView';
export default async function Panier(){const u=await getCurrentUser();if(!u)return <main className="section"><div className="container"><div className="card"><h1>Panier</h1><p>Connectez-vous pour utiliser le panier et passer commande.</p><Link className="btn btn-gold" href="/connexion?next=/panier">Connexion</Link></div></div></main>;return <main className="section"><div className="container"><div className="head"><span className="eyebrow">E-commerce</span><h1>Votre <span className="gradient">panier</span></h1></div><CartView/></div></main>}
