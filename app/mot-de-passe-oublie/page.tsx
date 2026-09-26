"use client";
import { useState } from "react";
import Link from "next/link";

const AUTH_IMG = "/produits/patere-murale.jpg";

export default function ForgotPassword(){
  const [email,setEmail]=useState('');
  const [msg,setMsg]=useState('');
  const [err,setErr]=useState('');
  const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){
    e.preventDefault();
    setBusy(true);setErr('');setMsg('');
    try{
      const r=await fetch('/api/auth/forgot-password',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email})});
      const j=await r.json();
      if(!r.ok){setErr(j.error||'Erreur');return}
      setMsg(j.message);
      if(j.devResetUrl)setMsg(`${j.message} Lien de test local : ${j.devResetUrl}`);
      if(j.emailWarning)setMsg((m)=>`${m} (${j.emailWarning})`);
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
          <form className="form" onSubmit={submit}>
            <label>Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@exemple.com"/></label>
            {err&&<p className="error">{err}</p>}
            {msg&&<p className="success">{msg}</p>}
            <button className="btn btn-primary" disabled={busy}>{busy?'Envoi...':'Recevoir le lien →'}</button>
          </form>
          <div className="auth-links">
            <p><Link href="/connexion">← Retour à la connexion</Link></p>
          </div>
        </div>
      </div>
    </main>
  );
}
