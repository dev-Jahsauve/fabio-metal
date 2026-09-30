/**
 * Champ de recherche boutique (template) : formulaire GET natif vers
 * /boutique?q=... — fonctionne sans JavaScript, aucun état client.
 */
export default function SearchBox({
  initial = "",
  id = "recherche-boutique",
}: {
  initial?: string;
  id?: string;
}) {
  return (
    <form className="nav-search" role="search" action="/boutique" method="get">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={initial}
        placeholder="Rechercher un article…"
        aria-label="Rechercher dans la boutique"
        maxLength={80}
        autoComplete="off"
      />
    </form>
  );
}
