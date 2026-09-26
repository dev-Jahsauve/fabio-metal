"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (opts: { client_id: string; callback: (res: { credential?: string }) => void }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function GoogleLoginButton({ label = "Continuer avec Google" }: { label?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const divRef = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    function init() {
      if (cancelled || !window.google || !divRef.current) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (res) => {
          if (!res.credential) {
            setErr("Réponse Google vide. Réessayez.");
            return;
          }
          setBusy(true);
          setErr("");
          try {
            const r = await fetch("/api/auth/google", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ idToken: res.credential }),
            });
            const j = await r.json();
            if (!r.ok) {
              setErr(j.error || "Connexion Google impossible");
              return;
            }
            const next = params.get("next");
            router.push(next || (j.role === "admin" ? "/admin" : "/compte"));
            router.refresh();
          } catch {
            setErr("Connexion Google impossible. Vérifiez votre connexion.");
          } finally {
            setBusy(false);
          }
        },
      });
      window.google.accounts.id.renderButton(divRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "rectangular",
      });
    }
    if (window.google) {
      init();
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = init;
    document.head.appendChild(s);
    return () => {
      cancelled = true;
    };
  }, [clientId, params, router]);

  if (!clientId) {
    return (
      <div>
        <button type="button" className="btn-google" disabled title="Ajoutez NEXT_PUBLIC_GOOGLE_CLIENT_ID pour activer Google">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.9Z" />
            <path fill="#34A853" d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.1.1-3.6 2.8v.1C3.5 21.3 7.5 24 12 24Z" />
            <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.5-2.7-.1.1C.5 8.9 0 10.4 0 12s.5 3.1 1.5 4.4l3.7-2Z" />
            <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.7 1.5 6.8l3.7 2.9c1-2.9 3.7-5 6.8-5Z" />
          </svg>
          {label} — bientôt disponible
        </button>
        <p className="auth-hint">
          Pour activer : créez un Client ID sur Google Cloud Console, puis ajoutez{" "}
          <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> et <code>GOOGLE_CLIENT_ID</code> dans <code>.env.local</code>.
        </p>
        {err && <p className="error">{err}</p>}
      </div>
    );
  }

  return (
    <div>
      <div ref={divRef} aria-busy={busy} style={{ display: "flex", justifyContent: "center", minHeight: 44 }} />
      {busy && <p className="auth-hint">Connexion Google en cours…</p>}
      {err && <p className="error">{err}</p>}
    </div>
  );
}
