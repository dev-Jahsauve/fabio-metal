"use client";

import { useEffect, useRef, useState } from "react";
import PasswordField from "@/components/PasswordField";

type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  googleLinked: boolean;
  role: string;
};

function initial(name: string) {
  return (name.trim().charAt(0) || "F").toUpperCase();
}

export default function ProfileSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwdMsg, setPwdMsg] = useState("");
  const [pwdErr, setPwdErr] = useState("");
  const [pwdBusy, setPwdBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/account/profile", { cache: "no-store" });
        const j = await r.json();
        if (!r.ok) {
          setErr(j.error || "Impossible de charger le profil");
          return;
        }
        setProfile(j);
        setName(j.name || "");
        setEmail(j.email || "");
        setPhone(j.phone || "");
        setAvatarUrl(j.avatarUrl || "");
        setPreview(j.avatarUrl || null);
      } catch {
        setErr("Impossible de charger le profil");
      }
    })();
  }, []);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr("");
    setMsg("");
    // Aperçu immédiat
    const url = URL.createObjectURL(f);
    setPreview(url);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", f);
      const r = await fetch("/api/account/avatar", { method: "POST", body: form });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error || "Upload impossible");
        return;
      }
      setAvatarUrl(j.url);
      setPreview(j.url);
      setMsg("Photo téléversée. Cliquez sur « Enregistrer » pour l'appliquer à votre profil.");
    } catch {
      setErr("Upload impossible. Réessayez.");
    } finally {
      setUploading(false);
    }
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    setMsg("");
    try {
      const r = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, phone, avatarUrl }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErr(j.error || "Enregistrement impossible");
        return;
      }
      setProfile((p) => (p ? { ...p, name: j.user.name, email: j.user.email, phone: j.user.phone, avatarUrl: j.user.avatarUrl } : p));
      setPreview(j.user.avatarUrl || null);
      setMsg("Profil mis à jour avec succès.");
    } catch {
      setErr("Enregistrement impossible. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdBusy(true);
    setPwdErr("");
    setPwdMsg("");
    try {
      const r = await fetch("/api/account/password", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const j = await r.json();
      if (!r.ok) {
        setPwdErr(j.error || "Modification impossible");
        return;
      }
      setPwdMsg("Mot de passe modifié avec succès.");
      setCurrentPassword("");
      setNewPassword("");
    } catch {
      setPwdErr("Modification impossible. Réessayez.");
    } finally {
      setPwdBusy(false);
    }
  }

  if (!profile && !err) return <div className="card"><p>Chargement de votre profil…</p></div>;

  return (
    <div className="settings-grid">
      <section className="card">
        <h3>Photo de profil</h3>
        <div className="profile-avatar-row">
          <span className="profile-avatar" aria-hidden="true">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" />
            ) : (
              initial(name || profile?.name || "F")
            )}
          </span>
          <div>
            <p className="auth-hint" style={{ margin: 0 }}>
              Ajoutez votre photo (JPG, PNG ou WebP, 2 Mo max). Elle apparaîtra dans votre espace client.
            </p>
            <div className="actions" style={{ marginTop: 10 }}>
              <button type="button" className="btn btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? "Envoi…" : preview ? "Changer la photo" : "Ajouter une photo"}
              </button>
              {preview && (
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={uploading || saving}
                  onClick={() => {
                    setPreview(null);
                    setAvatarUrl("");
                    setMsg("Photo retirée. Cliquez sur « Enregistrer » pour appliquer.");
                  }}
                >
                  Retirer
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onPickFile} />
          </div>
        </div>

        <form className="form" onSubmit={saveProfile} style={{ marginTop: 16 }}>
          <label>
            Nom complet
            <input required minLength={2} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" autoComplete="name" />
          </label>
          <label>
            Email
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" autoComplete="email" />
          </label>
          <label>
            Téléphone
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237…" autoComplete="tel" />
          </label>
          {err && <p className="error">{err}</p>}
          {msg && <p className="success">{msg}</p>}
          <button className="btn btn-primary" disabled={saving || uploading}>
            {saving ? "Enregistrement…" : "Enregistrer mon profil →"}
          </button>
        </form>

        {profile && (
          <p className="auth-hint">
            Compte {profile.role === "admin" ? "administrateur" : "client"}
            {profile.googleLinked ? " · connecté à Google" : " · mot de passe classique"}.
          </p>
        )}
      </section>

      <section className="card">
        <h3>Identifiants & sécurité</h3>
        <p className="auth-hint" style={{ marginTop: 0 }}>
          Gérez vos identifiants comme vous voulez : modifiez votre mot de passe à tout moment. Si vous vous êtes
          inscrit avec Google, utilisez « Mot de passe oublié » une fois pour définir un mot de passe, puis revenez ici.
        </p>
        <form className="form" onSubmit={changePassword}>
          <PasswordField label="Mot de passe actuel" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" placeholder="Votre mot de passe actuel" />
          <PasswordField label="Nouveau mot de passe" value={newPassword} onChange={setNewPassword} autoComplete="new-password" placeholder="8 caractères minimum" minLength={8} />
          {pwdErr && <p className="error">{pwdErr}</p>}
          {pwdMsg && <p className="success">{pwdMsg}</p>}
          <button className="btn btn-gold" disabled={pwdBusy}>
            {pwdBusy ? "Modification…" : "Changer le mot de passe"}
          </button>
        </form>
      </section>
    </div>
  );
}
