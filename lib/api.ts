import { NextResponse } from "next/server";
export function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Erreur interne";
  if (message === "UNAUTHENTICATED") return NextResponse.json({ error: "Authentification requise" }, { status: 401 });
  if (message === "FORBIDDEN") return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
  if (message === "AUTH_SECRET_NOT_CONFIGURED") return NextResponse.json({ error: "Configuration serveur incomplète" }, { status: 500 });
  console.error(error);
  return NextResponse.json({ error: "Une erreur interne est survenue" }, { status: 500 });
}
