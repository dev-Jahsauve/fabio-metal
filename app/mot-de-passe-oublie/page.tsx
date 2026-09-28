"use client";
import { useState } from "react";
import Link from "next/link";
import { waLink } from "@/lib/utils";

const AUTH_IMG = "/produits/patere-murale.jpg";
const WHATSAPP_MSG = "Bonjour FABIOLE METAL, je n'arrive pas à réinitialiser mon mot de passe (email non reçu). Pouvez-vous m'aider ?";

export default function ForgotPassword(){
  const [email,setEmail]=useState('');
  const [msg,setMsg]=useState('');
  const [devUrl,setDevUrl]=useState('');
  const [emailWarning,setEmailWarning]=useState('');
  const [showFallback,setShowFallback]=useState(false);
  const [err,setErr]=useState('');
  const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){
    e.preventDefault();
    setBusy(true);setErr('');setMsg('');setDevUrl('');setEmailWarning('');setShowFallback(false);
    try{
      const r=await fetch('/api/auth/forgot-password',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})});
      const j=await r.json();
      if(!r.ok){setErr(j.error||'Erreur');return}
      setMsg(j.message || "Si un compte existe pour cette adresse, un lien de réinitialisation sera envoyé.");
      if(j.devResetUrl)setDevUrl(j.devResetUrl);
      if(j.emailWarning)setEmailWarning(j.emailWarning);
      // Pas de domaine vérifié = pas d'email réel : afficher le secours honnête.
      if(j.emailAvailable === false || j.emailSent === false) setShowFallback(true);
    }finally{setBusy(false)}
  }
  return (
    <main className="section">
      <div className="container auth">
        <div className="auth-visual">
          <img src={AUTH_IMG} alt="Technicien à l'atelier" />
          <div className="auth-visual-text">
            <strong>Pas de panique.</strong>
            <span>Recevez un lien sécurisé pour créer un nouveau mot de passe.</span>
          </div>
        </div>
        <div className="card auth-card">
          <span className="eyebrow">Sécurité</span>
          <h1>Mot de passe oublié</h1>
          <p className="auth-sub">Entrez votre email : si un compte existe, un lien de réinitialisation (valable 30 minutes) vous sera envoyé.</p>
          <form className="form auth-form" onSubmit={submit}>
            <label>Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com"/></label>
            {err&&<p className="error auth-error">{err}</p>}
            {msg&&<p className="success">{msg}</p>}
            {devUrl&&(
              <p className="success auth-dev-link">
                Lien de test local : <Link href={devUrl}>{devUrl}</Link>
              </p>
            )}
            {emailWarning&&<p className="auth-hint">{emailWarning}</p>}
            {showFallback&&!devUrl&&(
              <div className="auth-fallback" role="note">
                <strong>Envoi email indisponible pour le moment.</strong><br />
                Si vous ne recevez rien, contactez l’atelier sur{" "}
                <a href={waLink(WHATSAPP_MSG)} target="_blank" rel="noreferrer">WhatsApp</a> ou via la page{" "}
                <Link href="/contact">contact</Link>. Déjà connecté ? Changez votre mot de passe dans{" "}
                <Link href="/parametres">Paramètres</Link>.
              </div>
            )}
            <button className="btn btn-primary auth-submit" disabled={busy}>{busy?'Envoi...':'Recevoir le lien →'}</button>
          </form>
          <div className="auth-switch">
            <p className="auth-switch-text">Vous vous souvenez de votre mot de passe ?</p>
            <Link href="/connexion" className="btn btn-outline auth-switch-btn">← Retour à la connexion</Link>
          </div>
        </div>
      </div>
    </main>
  );
}
