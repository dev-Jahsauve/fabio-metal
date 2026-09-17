"use client";
import { useRouter } from "next/navigation";
export default function LogoutButton(){const r=useRouter();async function out(){await fetch('/api/auth/logout',{method:'POST'});r.push('/');r.refresh()}return <button className="btn" onClick={out}>Se déconnecter</button>}
