"use client";
import { useRef } from "react";

export default function ServiceCarousel({ items }: { items: string[][] }) {
  const ref = useRef<HTMLDivElement>(null);
  const move = (dir: number) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 340), behavior: "smooth" });
  };

  return (
    <div>
      <div className="carousel-head">
        <button className="btn btn-sm" onClick={() => move(-1)} aria-label="Services précédents">
          ←
        </button>
        <button className="btn btn-sm" onClick={() => move(1)} aria-label="Services suivants">
          →
        </button>
      </div>
      <div ref={ref} className="carousel-track">
        {items.map(([icon, title, desc]) => (
          <article className="card" key={title}>
            <div className="icon">{icon}</div>
            <h3>{title}</h3>
            <p>{desc}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
