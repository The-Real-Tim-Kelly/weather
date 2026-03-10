/**
 * LocationSearch.jsx
 *
 * A search bar that lets users type a city or place name.
 * Calls onSearch(query) when the form is submitted.
 * Results passed in via the `results` prop are rendered as
 * a dropdown list; clicking one fires onSelect(location).
 */
import { useState, useRef } from 'react';

export default function LocationSearch({
  onSearch,
  results = [],
  onSelect,
  onLocate,
  locating = false,
}) {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  // Prevents submitting another search while one is already in flight,
  // reinforcing the Nominatim 1-request-per-second TOS requirement in the UI.
  const inFlight = useRef(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || inFlight.current) return;
    inFlight.current = true;
    setSearching(true);
    try {
      await onSearch(trimmed);
    } finally {
      inFlight.current = false;
      setSearching(false);
    }
  }

  function handleSelect(loc) {
    setQuery('');
    onSelect(loc);
  }

  return (
    <div className="w-full max-w-xl mx-auto space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city, ZIP, or address…"
            aria-label="Search location"
            className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5
                       text-white placeholder-slate-500 shadow-sm backdrop-blur-sm
                       focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50
                       focus:bg-white/10 transition"
          />
        </div>
        <button
          type="submit"
          disabled={searching}
          className="rounded-xl bg-sky-500 px-5 py-2.5 font-semibold text-white text-sm
                     shadow-sm hover:bg-sky-400 active:scale-95 transition whitespace-nowrap
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Use my location button */}
      <button
        type="button"
        onClick={onLocate}
        disabled={locating}
        className="flex items-center gap-2 text-xs font-medium text-sky-400 hover:text-sky-300
                   disabled:opacity-40 disabled:cursor-not-allowed transition"
        aria-label="Use my current location"
      >
        {locating ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Detecting location…
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.083 3.204-4.512 3.204-7.327a6.5 6.5 0 10-13 0c0 2.815 1.26 5.244 3.204 7.327a19.583 19.583 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a2 5 0 100-5 2.5 2.5 0 000 5z"
                clipRule="evenodd"
              />
            </svg>
            Use my location
          </>
        )}
      </button>

      {/* Dropdown results */}
      {results.length > 0 && (
        <ul
          className="w-full rounded-xl border border-white/10 bg-slate-900/90
                     backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden"
        >
          {results.map((loc, i) => (
            <li key={i} className="border-b border-white/5 last:border-0">
              <button
                type="button"
                onClick={() => handleSelect(loc)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm
                           text-slate-300 hover:bg-white/5 hover:text-white transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-3.5 h-3.5 text-slate-600 shrink-0"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 15.1 17 12.462 17 9A7 7 0 103 9c0 3.462 1.698 6.1 3.354 7.584a13.731 13.731 0 002.274 1.765 11.842 11.842 0 00.757.433 5.741 5.741 0 00.281.14l.018.008.006.003zM10 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                    clipRule="evenodd"
                  />
                </svg>
                {loc.name}
                {loc.country ? `, ${loc.country}` : ''}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
