"use client";
import { useEffect } from "react";
export default function ErrorPage({error,reset}:{error:Error & {digest?:string};reset:()=>void}){useEffect(()=>{console.error(error)},[error]);return <main className="section"><div className="container" style={{maxWidth:720}}><div className="card"><span className="eyebrow">Erreur</span><h1>Une erreur est survenue.</h1><p>Votre commande et vos données ne sont pas modifiées par cette page d'erreur. Réessayez ou revenez à l'accueil.</p><button className="btn btn-gold" onClick={()=>reset()}>Réessayer</button></div></div></main>}
