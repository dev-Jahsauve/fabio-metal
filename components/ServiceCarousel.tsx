 "use client";
import { useRef } from "react";
export default function ServiceCarousel({items}:{items:string[][]}) {
 const ref=useRef<HTMLDivElement>(null);
 const move=(n:number)=>ref.current?.scrollBy({left:n,behavior:"smooth"});
 return <div>
   <div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:10}}>
    <button className="btn" onClick={()=>move(-300)} aria-label="Précédent">←</button>
    <button className="btn" onClick={()=>move(300)} aria-label="Suivant">→</button>
   </div>
   <div ref={ref} style={{display:"flex",gap:15,overflowX:"auto",scrollSnapType:"x mandatory",paddingBottom:8}}>
    {items.map(([i,t,d])=><article className="card" key={t} style={{minWidth:"280px",flex:"0 0 30%",scrollSnapAlign:"start"}}><div className="icon">{i}</div><h3>{t}</h3><p>{d}</p></article>)}
   </div>
 </div>
}