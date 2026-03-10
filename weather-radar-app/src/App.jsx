import { useState, useEffect, useCallback, useRef } from 'react';
import LocationSearch from './components/LocationSearch';
import CurrentWeather from './components/CurrentWeather';
import Forecast from './components/Forecast';
import HourlyForecast from './components/HourlyForecast';
import RadarMap from './components/RadarMap';
import {
  searchLocations,
  getCurrentWeather,
  getForecast,
  getHourlyForecast,
  reverseGeocode,
} from './services/weatherService';

const NEW_YORK = {
  name: 'New York',
  lat: 40.7128,
  lon: -74.006,
  country: 'US',
};

export default function App() {
  const [searchResults, setSearchResults] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [hourlyForecast, setHourlyForecast] = useState([]);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [loadingForecast, setLoadingForecast] = useState(false);
  const [loadingHourly, setLoadingHourly] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState(null);
  const [useFahrenheit, setUseFahrenheit] = useState(true);
  // Guards against overlapping geocoding calls (Nominatim TOS: 1 req/sec).
  const searchInFlight = useRef(false);

  // Central function: load weather data for any location object.
  const loadWeatherForLocation = useCallback(async (location) => {
    setSearchResults([]);
    setSelectedLocation(location);
    setError(null);
    setLoadingWeather(true);
    setLoadingForecast(true);
    setLoadingHourly(true);
    // Persist so we can restore on next visit without re-asking for geolocation.
    try {
      localStorage.setItem('weather-last-location', JSON.stringify(location));
    } catch {}
    try {
      const [weather, forecastData, hourlyData] = await Promise.all([
        getCurrentWeather(location.lat, location.lon),
        getForecast(location.lat, location.lon),
        getHourlyForecast(location.lat, location.lon),
      ]);
      setCurrentWeather({ ...weather, location: location.name });
      setForecast(forecastData);
      setHourlyForecast(hourlyData);
    } catch {
      setError('Failed to load weather data. Please try again.');
    } finally {
      setLoadingWeather(false);
      setLoadingForecast(false);
      setLoadingHourly(false);
    }
  }, []);

  // On mount: restore last location instantly, then fall back to geolocation → New York.
  useEffect(() => {
    // ① Check localStorage for a previously-used location (instant, no geo prompt).
    try {
      const saved = localStorage.getItem('weather-last-location');
      if (saved) {
        const loc = JSON.parse(saved);
        if (loc?.lat && loc?.lon && loc?.name) {
          loadWeatherForLocation(loc);
          return;
        }
      }
    } catch {
      // Corrupted storage — fall through.
    }

    // ② Try browser geolocation.
    if (!navigator.geolocation) {
      loadWeatherForLocation(NEW_YORK);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude,
          );
          await loadWeatherForLocation(loc);
        } catch {
          await loadWeatherForLocation(NEW_YORK);
        } finally {
          setLocating(false);
        }
      },
      async () => {
        // Permission denied or timeout — silently fall back.
        await loadWeatherForLocation(NEW_YORK);
        setLocating(false);
      },
      { timeout: 8000 },
    );
  }, [loadWeatherForLocation]);

  // Called by the "Use my location" button.
  function handleLocate() {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(
            pos.coords.latitude,
            pos.coords.longitude,
          );
          await loadWeatherForLocation(loc);
        } catch {
          setError(
            'Could not determine your location. Please search manually.',
          );
        } finally {
          setLocating(false);
        }
      },
      () => {
        setError('Location access denied. Please search for a city manually.');
        setLocating(false);
      },
      { timeout: 8000 },
    );
  }

  async function handleSearch(query) {
    if (searchInFlight.current) return; // already waiting on a geocoding call
    searchInFlight.current = true;
    setError(null);
    try {
      const results = await searchLocations(query);
      if (results.length === 0)
        setError('No locations found. Try a different name.');
      setSearchResults(results);
    } catch {
      setError('Location search failed. Please try again.');
    } finally {
      searchInFlight.current = false;
    }
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      {/* Ambient background blobs */}
      <div
        className="fixed inset-0 overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full
                        bg-sky-600/20 blur-3xl"
        />
        <div
          className="absolute top-1/2 -right-60 w-[500px] h-[500px] rounded-full
                        bg-indigo-600/20 blur-3xl"
        />
        <div
          className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full
                        bg-blue-500/10 blur-3xl"
        />
      </div>

      {/* Header */}
      <header className="relative z-20 border-b border-white/5 bg-white/5 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30
                            flex items-center justify-center text-xl"
            >
              ⛅
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white leading-none">
                Weather Radar
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Live forecasts &amp; precipitation maps
              </p>
            </div>
          </div>
          {selectedLocation && (
            <div
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400
                            bg-white/5 border border-white/10 rounded-full px-3 py-1.5"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-3.5 h-3.5 text-sky-400"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 15.1 17 12.462 17 9A7 7 0 103 9c0 3.462 1.698 6.1 3.354 7.584a13.731 13.731 0 002.274 1.765 11.842 11.842 0 00.757.433 5.741 5.741 0 00.281.14l.018.008.006.003zM10 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                  clipRule="evenodd"
                />
              </svg>
              {selectedLocation.name}
              {selectedLocation.country ? `, ${selectedLocation.country}` : ''}
            </div>
          )}
          {/* °F / °C toggle */}
          <button
            type="button"
            onClick={() => setUseFahrenheit((prev) => !prev)}
            className="flex items-center gap-1 text-xs font-semibold rounded-full
                       bg-white/5 border border-white/10 px-3 py-1.5
                       hover:bg-white/10 transition text-slate-300"
            aria-label="Toggle temperature unit"
          >
            <span className={useFahrenheit ? 'text-sky-400' : 'text-slate-500'}>
              °F
            </span>
            <span className="text-slate-600">/</span>
            <span
              className={!useFahrenheit ? 'text-sky-400' : 'text-slate-500'}
            >
              °C
            </span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Search */}
        <LocationSearch
          onSearch={handleSearch}
          results={searchResults}
          onSelect={loadWeatherForLocation}
          onLocate={handleLocate}
          locating={locating}
        />

        {/* Error banner */}
        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl bg-rose-500/10 border border-rose-500/20
                          text-rose-300 text-sm px-4 py-3.5"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 mt-0.5 shrink-0"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        )}

        {/* Current weather + radar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <CurrentWeather
            weather={currentWeather}
            loading={loadingWeather}
            useFahrenheit={useFahrenheit}
          />
          <RadarMap location={selectedLocation} />
        </div>

        {/* Hourly forecast */}
        <HourlyForecast
          hours={hourlyForecast}
          loading={loadingHourly}
          useFahrenheit={useFahrenheit}
        />

        {/* 7-day forecast */}
        <Forecast
          days={forecast}
          loading={loadingForecast}
          useFahrenheit={useFahrenheit}
        />
      </main>

      {/* Footer — API attribution required by each service's Terms of Service */}
      <footer className="relative z-10 mt-10 pb-8 text-center">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-2">
          {/* Primary attribution row */}
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Weather data by{' '}
            <a
              href="https://open-meteo.com"
              className="hover:text-slate-300 transition underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              Open-Meteo.com
            </a>{' '}
            <span className="text-slate-700">(CC BY 4.0)</span>
            {' · '}
            Radar by{' '}
            <a
              href="https://www.rainviewer.com"
              className="hover:text-slate-300 transition underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              RainViewer
            </a>
            {' · '}
            Geocoding by{' '}
            <a
              href="https://nominatim.org"
              className="hover:text-slate-300 transition underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              Nominatim
            </a>{' '}
            /{' '}
            <a
              href="https://www.openstreetmap.org/copyright"
              className="hover:text-slate-300 transition underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              © OpenStreetMap contributors
            </a>{' '}
            <span className="text-slate-700">(ODbL)</span>
            {' · '}
            Map ©{' '}
            <a
              href="https://carto.com/attributions"
              className="hover:text-slate-300 transition underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              CARTO
            </a>
            {' · '}
            Reverse geocoding by{' '}
            <a
              href="https://www.bigdatacloud.com"
              className="hover:text-slate-300 transition underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
            >
              BigDataCloud
            </a>
          </p>
          {/* Privacy notice */}
          <p className="text-[10px] text-slate-700">
            No API keys are used or stored. Only your last-viewed location is
            saved in your browser&apos;s localStorage — no personal data is
            transmitted to any third party.
          </p>
        </div>
      </footer>
    </div>
  );
}
