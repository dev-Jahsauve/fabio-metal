"use client";
import { useEffect, useRef, useState } from "react";

export default function ServiceCarousel({ items }: { items: string[][] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const count = items.length;

  const step = () => {
    const el = ref.current;
    return el ? Math.min(el.clientWidth * 0.85, 340) : 320;
  };
  const move = (dir: number) => {
    ref.current?.scrollBy({ left: dir * step(), behavior: "smooth" });
  };
  const goTo = (i: number) => {
    const el = ref.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - 4, behavior: "smooth" });
  };
  const onScroll = () => {
    const el = ref.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;
    const w = first.offsetWidth + 12;
    setActive(Math.min(count - 1, Math.max(0, Math.round(el.scrollLeft / w))));
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      const el = ref.current;
      if (!el || document.hidden) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 24) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: Math.min(el.clientWidth * 0.85, 340), behavior: "smooth" });
      }
    }, 5000);
    return () => clearInterval(id);
  }, []);

  if (!count) return null;

  return (
    <div>
      <div className="carousel-head">
        <div className="carousel-dots" role="tablist" aria-label="Choisir un service">
          {items.map(([, title], i) => (
            <button
              key={title}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={title}
              title={title}
              className={active === i ? "active" : ""}
              onClick={() => goTo(i)}
            />
          ))}
        </div>
        <div className="carousel-btns">
          <button className="btn btn-sm" onClick={() => move(-1)} aria-label="Services précédents">
            ←
          </button>
          <button className="btn btn-sm" onClick={() => move(1)} aria-label="Services suivants">
            →
          </button>
        </div>
      </div>
      <div ref={ref} className="carousel-track" onScroll={onScroll}>
        {items.map(([icon, title, desc, img]) => (
          <article className={img ? "card service-card" : "card"} key={title}>
            {img ? (
              <>
                <div className="service-img">
                  <img src={img} alt={title} loading="lazy" />
                  <span className="service-icon">{icon}</span>
                </div>
                <div className="service-body">
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <a className="service-link" href="/contact">
                    Demander ce service →
                  </a>
                </div>
              </>
            ) : (
              <>
                <div className="icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
