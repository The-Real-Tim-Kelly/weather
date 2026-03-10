import { displayTemp } from '../services/weatherService';

export default function HourlyForecast({ hours = [], loading, useFahrenheit }) {
  const unit = useFahrenheit ? '°F' : '°C';

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          Next 24 Hours
        </h3>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pb-2">
        <div className="flex gap-2 min-w-max">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
            : hours.length > 0
              ? hours.map((h, i) => (
                  <HourCard
                    key={i}
                    hour={h}
                    unit={unit}
                    useFahrenheit={useFahrenheit}
                    isFirst={i === 0}
                  />
                ))
              : Array.from({ length: 12 }).map((_, i) => <EmptyCard key={i} />)}
        </div>
      </div>
    </section>
  );
}

function HourCard({ hour, unit, useFahrenheit, isFirst }) {
  return (
    <div
      className={`flex flex-col items-center rounded-xl py-3 px-3 gap-1 text-center shrink-0
        transition-transform hover:-translate-y-0.5 duration-200 cursor-default w-24
        ${
          isFirst
            ? 'bg-sky-500/20 border border-sky-400/30 shadow-lg shadow-sky-900/20'
            : 'bg-white/5 border border-white/10 hover:bg-white/10'
        }`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-wide ${
          isFirst ? 'text-sky-400' : 'text-slate-500'
        }`}
      >
        {isFirst ? 'Now' : hour.time}
      </p>
      <span
        className="text-2xl leading-none"
        role="img"
        aria-label={hour.shortForecast}
      >
        {hour.icon}
      </span>
      <p className="text-sm font-bold text-white">
        {displayTemp(hour.temp, useFahrenheit)}
        {unit}
      </p>
      {hour.precipProb != null && (
        <p className="text-[9px] text-sky-400">🌧 {hour.precipProb}%</p>
      )}
      {hour.windSpeed != null && (
        <p className="text-[9px] text-slate-400">💨 {hour.windSpeed} mph</p>
      )}
    </div>
  );
}

function EmptyCard() {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/5 border border-white/5 py-3 px-3 gap-1 text-center shrink-0 w-24">
      <p className="text-[10px] text-slate-700 uppercase tracking-wide">—</p>
      <span className="text-2xl text-slate-700">·</span>
      <p className="text-sm text-slate-700">--°</p>
      <p className="text-[9px] text-slate-700">—</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="flex flex-col items-center rounded-xl bg-white/5 border border-white/10 py-3 px-3 gap-2 animate-pulse shrink-0 w-24">
      <div className="h-2.5 w-7 rounded-full bg-white/10" />
      <div className="h-7 w-7 rounded-full bg-white/10" />
      <div className="h-2.5 w-8 rounded-full bg-white/10" />
      <div className="h-2.5 w-10 rounded-full bg-white/10" />
      <div className="h-2.5 w-10 rounded-full bg-white/10" />
    </div>
  );
}
