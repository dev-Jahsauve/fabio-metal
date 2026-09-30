"use client";
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { waLink } from '@/lib/utils';
import { BRAND, CONTACT } from '@/lib/site';

// Formulaire de devis : enregistré en base (/api/contact) ET notifié par email via Formspree.
const FORMSPREE_ACTION = "https://formspree.io/f/xzezaweo";

// Sujets de démonstration (contexte actuel). Le paramètre d'URL ?objet=
// pré-remplit le formulaire depuis les boutons « Demander un devis » :
// sujet reconnu => sélectionné, sinon « Autre » + message pré-rempli.
const SUBJECTS = ['Portail', 'Porte', 'Fenêtre / grille', 'Salle à manger', 'Porte-rideaux', 'Autre'];

function initialFromObjet(objet: string) {
  const o = (objet || '').trim().slice(0, 300);
  if (!o) return { subject: 'Portail', message: '' };
  const found = SUBJECTS.find((s) => o.toLowerCase().includes(s.split(' ')[0].toLowerCase()));
  if (found) return { subject: found, message: '' };
  return { subject: 'Autre', message: o };
}

function ContactForm() {
  const searchParams = useSearchParams();
  const [prefilled] = useState(() => initialFromObjet(searchParams.get('objet') || ''));
  const [f, setF] = useState({ name: '', phone: '', subject: prefilled.subject, message: prefilled.message });
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setStatus('idle');
    setMsg('');
    // 1. Sauvegarde locale (historique admin, notifications).
    let saved = false;
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setStatus('error');
        setMsg(j.error || 'Erreur');
        return;
      }
      saved = true;
    } catch {
      setStatus('error');
      setMsg('Connexion impossible. Vérifiez votre réseau et réessayez.');
      return;
    } finally {
      if (!saved) setBusy(false);
    }
    // 2. Notification email via Formspree en AJAX : aucun changement de page.
    try {
      const fp = await fetch(FORMSPREE_ACTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: f.name,
          telephone: f.phone,
          sujet: f.subject,
          message: f.message,
          _subject: `Devis ${BRAND.name} — ${f.subject} (${f.name})`,
        }),
      });
      if (!fp.ok) throw new Error('formspree');
    } catch {
      // Non bloquant : la demande est déjà enregistrée et visible dans /admin.
    }
    setBusy(false);
    setStatus('success');
    setMsg(`Merci ${f.name.trim().split(' ')[0] || ''} ! Votre demande de devis (${f.subject}) a bien été envoyée.`);
    setF({ name: '', phone: '', subject: 'Portail', message: '' });
  }

  return (
    <main className="section">
      <div className="container contact">
        <div>
          <span className="eyebrow">Contact</span>
          <h1>
            Parlons de votre <span className="gradient">projet.</span>
          </h1>
          <p style={{ color: "var(--muted)" }}>
            {CONTACT.address}
            <br />
            {CONTACT.phone}
          </p>
          <a className="btn btn-gold" href={waLink(`Bonjour ${BRAND.name}, je souhaite demander un devis.`)}>
            WhatsApp
          </a>
        </div>
        <div className="card">
          {status === 'success' ? (
            <div className="notice notice-success" role="status">
              <span className="notice-icon" aria-hidden="true">✓</span>
              <div>
                <strong>Demande envoyée !</strong>
                <p>{msg} {BRAND.name} vous recontactera très vite pour votre devis.</p>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => { setStatus('idle'); setMsg(''); }}>
                  Faire une autre demande
                </button>
              </div>
            </div>
          ) : (
          <form className="form" onSubmit={submit}>
            <label>
              Nom
              <input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Votre nom" />
            </label>
            <label>
              Téléphone
              <input required value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="+237..." />
            </label>
            <label>
              Sujet
              <select value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })}>
                {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </label>
            <label>
              Message
              <textarea required value={f.message} onChange={e => setF({ ...f, message: e.target.value })} placeholder="Dimensions, modèle, quantité, finition..." />
            </label>
            {status === 'error' && (
              <div className="notice notice-error" role="alert">
                <span className="notice-icon" aria-hidden="true">!</span>
                <div>
                  <strong>Envoi impossible</strong>
                  <p>{msg}</p>
                </div>
              </div>
            )}
            <button className="btn btn-gold" disabled={busy}>
              {busy ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </form>
          )}
        </div>
      </div>
    </main>
  );
}

export default function Contact() {
  return (
    <Suspense fallback={<main className="section"><div className="container"><div className="card">Chargement…</div></div></main>}>
      <ContactForm />
    </Suspense>
  );
}
