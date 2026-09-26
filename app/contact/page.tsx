"use client";
import { useState } from 'react';
import { waLink } from '@/lib/utils';

// Formulaire de devis : enregistré en base (/api/contact) ET notifié par email via Formspree.
const FORMSPREE_ACTION = "https://formspree.io/f/xzezaweo";

export default function Contact() {
  const [f, setF] = useState({ name: '', phone: '', subject: 'Portail', message: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    // 1. Sauvegarde locale (historique admin, notifications).
    let saved = false;
    try {
      const r = await fetch('/api/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(j.error || 'Erreur');
        return;
      }
      saved = true;
    } catch {
      setMsg('Connexion impossible. Vérifiez votre réseau et réessayez.');
      return;
    } finally {
      if (!saved) setBusy(false);
    }
    // 2. Notification email via Formspree (non bloquant : la demande est déjà enregistrée).
    try {
      await fetch(FORMSPREE_ACTION, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: f.name,
          telephone: f.phone,
          sujet: f.subject,
          message: f.message,
          _subject: `Devis FABIOLE METAL — ${f.subject} (${f.name})`,
        }),
      });
    } catch {
      // Ignoré : la demande reste consultable dans /admin.
    }
    setBusy(false);
    setMsg('Demande envoyée. FABIOLE METAL pourra vous recontacter.');
    setF({ name: '', phone: '', subject: 'Portail', message: '' });
  }

  return (
    <main className="section">
      <div className="container contact">
        <div>
          <span className="eyebrow">Contact</span>
          <h1>
            Parlons de votre <span className="gradient">ouvrage.</span>
          </h1>
          <p style={{ color: "var(--muted)" }}>
            Face à la mairie de Bojongo
            <br />
            +237 698 30 87 80
          </p>
          <a className="btn btn-gold" href={waLink("Bonjour FABIOLE METAL, je souhaite demander un devis.")}>
            WhatsApp
          </a>
        </div>
        <div className="card">
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
              Type d’ouvrage
              <select value={f.subject} onChange={e => setF({ ...f, subject: e.target.value })}>
                <option>Portail</option>
                <option>Porte</option>
                <option>Fenêtre / grille</option>
                <option>Salle à manger</option>
                <option>Porte-rideaux</option>
                <option>Autre</option>
              </select>
            </label>
            <label>
              Message
              <textarea required value={f.message} onChange={e => setF({ ...f, message: e.target.value })} placeholder="Dimensions, modèle, quantité, finition..." />
            </label>
            {msg && <p className={msg.startsWith('Demande') ? 'success' : 'error'}>{msg}</p>}
            <button className="btn btn-gold" disabled={busy}>
              {busy ? 'Envoi...' : 'Envoyer la demande'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
