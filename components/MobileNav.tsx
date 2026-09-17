"use client";
import Link from "next/link";
import { useState } from "react";
export default function MobileNav(){const [open,setOpen]=useState(false);const links=[["Accueil","/"],["À propos","/a-propos"],["Services","/services"],["Boutique","/boutique"],["Galerie","/galerie"],["Contact","/contact"],["Compte","/compte"],["Panier","/panier"]];return <div className="mobile-nav"><button className="btn" aria-expanded={open} aria-label="Ouvrir le menu" onClick={()=>setOpen(!open)}>Menu</button>{open&&<div className="mobile-panel">{links.map(([t,h])=><Link key={h} href={h} onClick={()=>setOpen(false)}>{t}</Link>)}</div>}</div>}
