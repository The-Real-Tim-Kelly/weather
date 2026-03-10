/**
 * weatherService.js
 *
 * Live weather data via the Open-Meteo API (no API key required).
 * Docs: https://open-meteo.com/en/docs
 *
 * Geocoding via Nominatim OpenStreetMap (no API key required).
 * Docs: https://nominatim.org/release-docs/latest/api/Search/
 */

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

// ---------------------------------------------------------------------------
// WMO weather-code → human label + day / night emoji
// https://open-meteo.com/en/docs#weathervariables
// ---------------------------------------------------------------------------
const WMO_CODES = {
  0: { description: 'Clear sky', icon: '☀️', nightIcon: '🌙' },
  1: { description: 'Mainly clear', icon: '🌤️', nightIcon: '🌙' },
  2: { description: 'Partly cloudy', icon: '⛅', nightIcon: '🌙☁️' },
  3: { description: 'Overcast', icon: '☁️', nightIcon: '☁️' },
  45: { description: 'Fog', icon: '🌫️', nightIcon: '🌫️' },
  48: { description: 'Icy fog', icon: '🌫️', nightIcon: '🌫️' },
  51: { description: 'Light drizzle', icon: '🌦️', nightIcon: '🌧️' },
  53: { description: 'Drizzle', icon: '🌦️', nightIcon: '🌧️' },
  55: { description: 'Heavy drizzle', icon: '🌧️', nightIcon: '🌧️' },
  61: { description: 'Slight rain', icon: '🌧️', nightIcon: '🌧️🌙' },
  63: { description: 'Rain', icon: '🌧️', nightIcon: '🌧️🌙' },
  65: { description: 'Heavy rain', icon: '🌧️', nightIcon: '🌧️' },
  71: { description: 'Slight snow', icon: '🌨️', nightIcon: '🌨️' },
  73: { description: 'Snow', icon: '❄️', nightIcon: '❄️' },
  75: { description: 'Heavy snow', icon: '❄️', nightIcon: '❄️' },
  77: { description: 'Snow grains', icon: '🌨️', nightIcon: '🌨️' },
  80: { description: 'Slight showers', icon: '🌦️', nightIcon: '🌧️🌙' },
  81: { description: 'Showers', icon: '🌧️', nightIcon: '🌧️🌙' },
  82: { description: 'Violent showers', icon: '⛈️', nightIcon: '⛈️' },
  85: { description: 'Snow showers', icon: '🌨️', nightIcon: '🌨️🌙' },
  86: { description: 'Heavy snow showers', icon: '❄️', nightIcon: '❄️' },
  95: { description: 'Thunderstorm', icon: '⛈️', nightIcon: '⛈️' },
  96: { description: 'Thunderstorm w/ hail', icon: '⛈️', nightIcon: '⛈️' },
  99: {
    description: 'Thunderstorm w/ heavy hail',
    icon: '⛈️',
    nightIcon: '⛈️',
  },
};

function interpretCode(code, isDay = true) {
  const entry = WMO_CODES[code] ?? {
    description: 'Unknown',
    icon: '🌡️',
    nightIcon: '🌡️',
  };
  return {
    description: entry.description,
    icon: isDay ? entry.icon : entry.nightIcon,
  };
}

// ---------------------------------------------------------------------------
// Temperature conversion helpers
// ---------------------------------------------------------------------------

/** Convert Celsius → Fahrenheit */
export function cToF(c) {
  return Math.round((c * 9) / 5 + 32);
}

/** Display a temp value respecting the chosen unit */
export function displayTemp(celsius, useFahrenheit) {
  return useFahrenheit ? cToF(celsius) : celsius;
}

// ---------------------------------------------------------------------------
// Attribution strings — referenced by the UI footer.
// Each entry satisfies the respective service's Terms of Service.
// ---------------------------------------------------------------------------
export const ATTRIBUTION = {
  openMeteo: {
    label: 'Open-Meteo.com',
    url: 'https://open-meteo.com',
    // Open-Meteo is free and open-source, licensed CC BY 4.0.
    note: 'CC BY 4.0',
  },
  nominatim: {
    label: 'Nominatim',
    url: 'https://nominatim.org',
  },
  openStreetMap: {
    label: '© OpenStreetMap contributors',
    url: 'https://www.openstreetmap.org/copyright',
    // Data is licensed ODbL 1.0.
    note: 'ODbL',
  },
  rainViewer: {
    label: 'RainViewer',
    url: 'https://www.rainviewer.com',
  },
  carto: {
    label: '© CARTO',
    url: 'https://carto.com/attributions',
  },
  bigDataCloud: {
    label: 'BigDataCloud',
    url: 'https://www.bigdatacloud.com',
  },
};

// ---------------------------------------------------------------------------
// Geocoding — Nominatim OpenStreetMap
// Handles: ZIP codes, city names, "City, State" queries — no API key needed
//
// TOS: https://operations.osmfoundation.org/policies/nominatim/
//   • Maximum 1 request per second per application/IP.
//   • Do not use for automated bulk geocoding.
//   • Provide visible attribution (satisfied in the app footer).
//   • User-Agent and Referer headers are sent automatically by the browser
//     when deployed on GitHub Pages, satisfying the identification requirement.
// ---------------------------------------------------------------------------

/** @typedef {{ name: string, lat: number, lon: number, country: string }} Location */

/**
 * Module-level timestamp of the last Nominatim HTTP call.
 * Enforces the 1-request-per-second policy required by Nominatim TOS.
 */
let _nominatimLastCallAt = 0;
const NOMINATIM_MIN_INTERVAL_MS = 1_000;

/**
 * Fetch a Nominatim URL, waiting if necessary to honour the 1-req/sec limit.
 * @param {string} url
 * @returns {Promise<Response>}
 */
async function nominatimFetch(url) {
  const now = Date.now();
  const wait = NOMINATIM_MIN_INTERVAL_MS - (now - _nominatimLastCallAt);
  if (wait > 0) {
    console.debug(
      `[Nominatim] throttling — waiting ${wait}ms to respect TOS rate limit`,
    );
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
  _nominatimLastCallAt = Date.now();
  return fetch(url, { headers: { 'Accept-Language': 'en' } });
}

/** Extract a short region code (e.g. "NY") from a Nominatim address object. */
function getRegionCode(addr) {
  const lvl4 = addr['ISO3166-2-lvl4'] ?? ''; // e.g. "US-NY"
  if (lvl4) return lvl4.split('-').slice(1).join('-');
  return addr.state_code ?? '';
}

/**
 * Search for locations matching a query string (city, ZIP code, "City, ST").
 * Rate-limited to 1 req/sec to comply with Nominatim TOS.
 * @param {string} query
 * @returns {Promise<Location[]>}
 */
export async function searchLocations(query) {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    addressdetails: '1',
  });
  const res = await nominatimFetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
  );
  if (!res.ok) throw new Error(`Geocoding request failed (${res.status})`);
  const data = await res.json();
  return data.map((r) => {
    const addr = r.address ?? {};
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.municipality ||
      addr.county ||
      r.display_name.split(',')[0].trim();
    const regionCode = getRegionCode(addr);
    const country = addr.country_code?.toUpperCase() ?? '';
    const name = regionCode ? `${city}, ${regionCode}` : city;
    return { name, lat: parseFloat(r.lat), lon: parseFloat(r.lon), country };
  });
}

// ---------------------------------------------------------------------------
// Current weather
// ---------------------------------------------------------------------------

/**
 * Fetch current weather for a lat/lon pair.
 * Returns sunrise/sunset times as formatted strings (e.g. "6:24 AM").
 * @param {number} lat
 * @param {number} lon
 */
export async function getCurrentWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'wind_speed_10m',
      'weather_code',
      'is_day',
    ].join(','),
    daily: ['sunrise', 'sunset'].join(','),
    wind_speed_unit: 'mph',
    timezone: 'auto',
    forecast_days: '1',
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Weather request failed (${res.status})`);
  const data = await res.json();
  const c = data.current;
  const { description, icon } = interpretCode(c.weather_code, c.is_day === 1);

  const formatTime = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      : null;

  return {
    temp: Math.round(c.temperature_2m),
    feelsLike: Math.round(c.apparent_temperature),
    humidity: c.relative_humidity_2m,
    windSpeed: Math.round(c.wind_speed_10m),
    description,
    icon,
    sunrise: formatTime(data.daily?.sunrise?.[0]),
    sunset: formatTime(data.daily?.sunset?.[0]),
  };
}

// ---------------------------------------------------------------------------
// 7-day forecast
// ---------------------------------------------------------------------------

/**
 * Fetch a 7-day daily forecast for a lat/lon pair.
 * Each entry includes wind speed (mph), precipitation sum (inches), and
 * precipitation probability (%).
 * @param {number} lat
 * @param {number} lon
 */
export async function getForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'weather_code',
      'wind_speed_10m_max',
      'precipitation_sum',
      'precipitation_probability_max',
    ].join(','),
    wind_speed_unit: 'mph',
    precipitation_unit: 'inch',
    timezone: 'auto',
    forecast_days: '7',
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Forecast request failed (${res.status})`);
  const data = await res.json();
  const {
    time,
    temperature_2m_max,
    temperature_2m_min,
    weather_code,
    wind_speed_10m_max,
    precipitation_sum,
    precipitation_probability_max,
  } = data.daily;

  return time.map((dateStr, i) => {
    const { description, icon } = interpretCode(weather_code[i]);
    const day = new Date(`${dateStr}T12:00:00`);
    const precipIn = precipitation_sum?.[i] ?? 0;
    return {
      date: day.toLocaleDateString('en-US', { weekday: 'short' }),
      icon,
      high: Math.round(temperature_2m_max[i]),
      low: Math.round(temperature_2m_min[i]),
      description,
      windMax: Math.round(wind_speed_10m_max?.[i] ?? 0),
      precipIn: precipIn > 0 ? precipIn.toFixed(2) : null,
      precipProb: precipitation_probability_max?.[i] ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// Hourly forecast (next 24 hours)
// ---------------------------------------------------------------------------

/**
 * Fetch hourly forecast for the next 24 hours.
 * Each entry includes precipitation probability, wind speed (mph), and an
 * is_day flag so callers can choose day vs. night icons.
 * @param {number} lat
 * @param {number} lon
 */
export async function getHourlyForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: [
      'temperature_2m',
      'weather_code',
      'precipitation_probability',
      'wind_speed_10m',
      'is_day',
    ].join(','),
    wind_speed_unit: 'mph',
    timezone: 'auto',
    forecast_days: '2', // guarantees at least 24 upcoming hours
  });
  const res = await fetch(`${FORECAST_URL}?${params}`);
  if (!res.ok) throw new Error(`Hourly forecast failed (${res.status})`);
  const data = await res.json();
  const {
    time,
    temperature_2m,
    weather_code,
    precipitation_probability,
    wind_speed_10m,
    is_day,
  } = data.hourly;

  const now = Date.now();
  const hours = [];
  for (let i = 0; i < time.length && hours.length < 24; i++) {
    const t = new Date(time[i]);
    if (t.getTime() < now) continue;
    const dayFlag = is_day?.[i] === 1;
    const { description, icon } = interpretCode(weather_code[i], dayFlag);
    hours.push({
      time: t.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
      temp: Math.round(temperature_2m[i]),
      icon,
      shortForecast: description,
      precipProb: precipitation_probability?.[i] ?? null,
      windSpeed: Math.round(wind_speed_10m?.[i] ?? 0),
    });
  }
  return hours;
}

// ---------------------------------------------------------------------------
// Reverse geocoding
// ---------------------------------------------------------------------------

/**
 * Convert a lat/lon pair to a human-readable location name.
 * Uses the Big Data Cloud reverse-geocoding API — free, no key required.
 * https://www.bigdatacloud.com/geocoding-apis/free-reverse-geocode-to-city-api
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<Location>}
 */
export async function reverseGeocode(lat, lon) {
  // BigDataCloud free-tier reverse-geocoding — no API key, no strict rate limit.
  // Only called on explicit user geolocation consent (rare, user-initiated).
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    localityLanguage: 'en',
  });
  const res = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?${params}`,
  );
  if (!res.ok) throw new Error(`Reverse geocode failed (${res.status})`);
  const data = await res.json();
  return {
    name:
      data.city ||
      data.locality ||
      data.principalSubdivision ||
      'Your Location',
    lat,
    lon,
    country: data.countryCode ?? '',
  };
}
