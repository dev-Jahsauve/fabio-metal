import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import CheckoutForm from '@/components/CheckoutForm';
export default async function Checkout(){const u=await getCurrentUser();if(!u)return <main className="section"><div className="container"><div className="card"><h1>Checkout sécurisé</h1><p>Connectez-vous avant de passer commande.</p><Link className="btn btn-gold" href="/connexion?next=/checkout">Connexion</Link></div></div></main>;return <main className="section"><div className="container"><div className="head"><span className="eyebrow">Checkout</span><h1>Finaliser votre <span className="gradient">commande.</span></h1></div><CheckoutForm/></div></main>}
