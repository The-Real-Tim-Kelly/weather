import { displayTemp } from '../services/weatherService';

export default function CurrentWeather({ weather, loading, useFahrenheit }) {
  const unit = useFahrenheit ? '°F' : '°C';
  if (loading) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-6 animate-pulse space-y-4">
        <div className="h-4 w-28 rounded-lg bg-white/10" />
        <div className="h-8 w-40 rounded-lg bg-white/10" />
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl bg-white/10" />
          <div className="space-y-2">
            <div className="h-14 w-28 rounded-lg bg-white/10" />
            <div className="h-4 w-24 rounded-lg bg-white/10" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div
        className="rounded-2xl bg-white/5 border border-white/10 p-8
                      flex flex-col items-center justify-center text-center gap-3 min-h-[220px]"
      >
        <div
          className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10
                        flex items-center justify-center text-3xl"
        >
          🌍
        </div>
        <p className="text-sm text-slate-400 max-w-[200px]">
          Search for a city to see current conditions
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/20
                    border border-sky-400/20 backdrop-blur-sm p-6
                    transition-all duration-500"
    >
      {/* Location + label */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-sky-400/80 mb-1">
            Current Weather
          </p>
          <h2 className="text-xl font-bold text-white leading-tight">
            {weather.location}
          </h2>
        </div>
        <span
          className="text-4xl leading-none mt-1"
          role="img"
          aria-label={weather.description}
        >
          {weather.icon ?? '🌤️'}
        </span>
      </div>

      {/* Temperature */}
      <div className="mb-6">
        <p className="text-7xl font-black tracking-tighter text-white leading-none">
          {weather.temp != null
            ? displayTemp(weather.temp, useFahrenheit)
            : '--'}
          <span className="text-4xl font-light align-top mt-2 inline-block">
            {unit}
          </span>
        </p>
        <p className="text-sm text-sky-200/70 capitalize mt-1.5 font-medium">
          {weather.description ?? 'No description'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2.5">
        <Stat
          icon="🌡️"
          label="Feels like"
          value={`${weather.feelsLike != null ? displayTemp(weather.feelsLike, useFahrenheit) : '--'}${unit}`}
        />
        <Stat
          icon="💧"
          label="Humidity"
          value={`${weather.humidity ?? '--'}%`}
        />
        <Stat
          icon="💨"
          label="Wind"
          value={`${weather.windSpeed ?? '--'} mph`}
        />
      </div>

      {/* Sunrise / Sunset */}
      {(weather.sunrise || weather.sunset) && (
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-around gap-2">
          {weather.sunrise && (
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
                Sunrise
              </p>
              <p className="text-xs font-semibold text-amber-300">
                🌅 {weather.sunrise}
              </p>
            </div>
          )}
          {weather.sunset && (
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">
                Sunset
              </p>
              <p className="text-xs font-semibold text-orange-300">
                🌇 {weather.sunset}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className="rounded-xl bg-white/10 border border-white/10 py-3 px-2 text-center">
      <span className="text-base" aria-hidden="true">
        {icon}
      </span>
      <p className="text-[10px] text-slate-400 mt-1 mb-0.5 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  );
}
