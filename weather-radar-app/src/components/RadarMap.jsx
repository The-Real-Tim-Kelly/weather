import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

const DEFAULT_CENTER = [39.5, -98.35]; // geographic center of the contiguous US
const DEFAULT_ZOOM = 4;

// Transparent 1×1 GIF used as a fallback for unavailable radar tiles.
const TRANSPARENT_TILE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

/**
 * Smooth pan/zoom to a new centre whenever the `location` prop changes.
 */
function MapController({ center }) {
  const map = useMap();
  const prev = useRef(null);

  useEffect(() => {
    if (!center) return;
    const [lat, lon] = center;
    if (prev.current && prev.current[0] === lat && prev.current[1] === lon)
      return;
    prev.current = center;
    map.flyTo([lat, lon], 7, { duration: 1.2 });
  }, [center, map]);

  return null;
}

export default function RadarMap({ location }) {
  const center = location ? [location.lat, location.lon] : null;
  // Fetched from RainViewer's public API so we always use a live radar frame.
  const [radarUrl, setRadarUrl] = useState(null);

  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((r) => r.json())
      .then((data) => {
        const past = data.radar?.past ?? [];
        if (past.length === 0) return;
        const latest = past[past.length - 1];
        // RainViewer v3 path-based URL — tiles only go up to native zoom 8.
        setRadarUrl(
          `https://tilecache.rainviewer.com${latest.path}/256/{z}/{x}/{y}/2/1_1.png`,
        );
      })
      .catch(() => {
        // Non-critical — map remains useful with just the base layer.
      });
  }, []);

  return (
    <section className="flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Precipitation Radar
        </h3>
        <div className="flex-1 h-px bg-white/5" />
        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-medium
                         text-slate-500 bg-white/5 border border-white/10
                         rounded-full px-2.5 py-1"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          RainViewer
        </span>
      </div>

      <div
        className="w-full rounded-2xl overflow-hidden border border-white/10
                   shadow-xl shadow-black/30 relative"
        style={{ height: '420px' }}
      >
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          minZoom={2}
          maxZoom={12}
          scrollWheelZoom
          className="h-full w-full"
          dragging
          tap
        >
          {/* Dark base map — CartoDB Dark Matter (free, no key)
              Attribution visible in Leaflet's built-in attribution control. */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            minZoom={2}
            maxZoom={19}
          />

          {/* RainViewer radar overlay.
              maxNativeZoom=8 tells Leaflet to scale tiles when zoomed beyond 8,
              so the tile server is never asked for an unsupported zoom level.
              errorTileUrl silences any residual tile errors gracefully. */}
          {radarUrl && (
            <TileLayer
              url={radarUrl}
              attribution='Radar &copy; <a href="https://www.rainviewer.com">RainViewer</a>'
              opacity={0.65}
              minNativeZoom={1}
              maxNativeZoom={8}
              minZoom={2}
              maxZoom={12}
              errorTileUrl={TRANSPARENT_TILE}
            />
          )}

          <MapController center={center} />
        </MapContainer>

        {/* "Powered by RainViewer" overlay — required by RainViewer TOS */}
        <a
          href="https://www.rainviewer.com"
          target="_blank"
          rel="noreferrer"
          className="absolute bottom-8 left-2 z-[1000] text-[9px] text-white/40
                     hover:text-white/70 transition bg-black/30 rounded px-1.5 py-0.5
                     backdrop-blur-sm pointer-events-auto"
          aria-label="Radar data powered by RainViewer"
        >
          Powered by RainViewer
        </a>
      </div>

      {!location && (
        <p className="mt-2.5 text-center text-xs text-slate-600">
          Search for a location to centre the map
        </p>
      )}
    </section>
  );
}
