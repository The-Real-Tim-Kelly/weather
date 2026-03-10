import { displayTemp } from '../services/weatherService';

export default function Forecast({ days = [], loading, useFahrenheit }) {
  const placeholders = Array.from({ length: 7 });
  const unit = useFahrenheit ? '°F' : '°C';

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
          7-Day Forecast
        </h3>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="flex gap-2 min-w-max">
          {loading
            ? placeholders.map((_, i) => <SkeletonCard key={i} />)
            : days.length > 0
              ? days.map((day, i) => (
                  <DayCard
                    key={i}
                    day={day}
                    index={i}
                    useFahrenheit={useFahrenheit}
                    unit={unit}
                  />
                ))
              : placeholders.map((_, i) => <EmptyCard key={i} />)}
        </div>
      </div>
    </section>
  );
}

function DayCard({ day, index, useFahrenheit }) {
  const isToday = index === 0;
  return (
    <div
      className={`flex flex-col items-center rounded-xl py-3 px-2 gap-1 text-center shrink-0 w-[92px]
        transition-transform hover:-translate-y-0.5 duration-200 cursor-default
        ${
          isToday
            ? 'bg-sky-500/20 border border-sky-400/30 shadow-lg shadow-sky-900/20'
            : 'bg-white/5 border border-white/10 hover:bg-white/10'
        }`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-wide ${
          isToday ? 'text-sky-400' : 'text-slate-500'
        }`}
      >
        {isToday ? 'Today' : day.date}
      </p>
      <span
        className="text-2xl leading-none"
        role="img"
        aria-label={day.description}
      >
        {day.icon ?? '🌤️'}
      </span>
      <p className="text-sm font-bold text-white">
        {day.high != null ? displayTemp(day.high, useFahrenheit) : '--'}°
      </p>
      <p className="text-xs text-slate-500">
        {day.low != null ? displayTemp(day.low, useFahrenheit) : '--'}°
      </p>
      {day.windMax != null && (
        <p className="text-[9px] text-slate-400 leading-tight">
          💨 {day.windMax} mph
        </p>
      )}
      {day.precipProb != null && (
        <p className="text-[9px] text-sky-400 leading-tight">
          🌧 {day.precipIn != null ? `${day.precipIn}"` : `${day.precipProb}%`}
        </p>
      )}
    </div>
  );
}

function EmptyCard() {
  return (
    <div
      className="flex flex-col items-center rounded-xl bg-white/5 border border-white/5
                    py-3 px-2 gap-1 text-center shrink-0 w-[92px]"
    >
      <p className="text-[10px] text-slate-700 uppercase tracking-wide">—</p>
      <span className="text-2xl text-slate-700">·</span>
      <p className="text-sm text-slate-700">--°</p>
      <p className="text-xs text-slate-700">--°</p>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      className="flex flex-col items-center rounded-xl bg-white/5 border border-white/10
                    py-3 px-2 gap-1.5 animate-pulse shrink-0 w-[92px]"
    >
      <div className="h-2.5 w-7 rounded-full bg-white/10" />
      <div className="h-7 w-7 rounded-full bg-white/10" />
      <div className="h-2.5 w-5 rounded-full bg-white/10" />
      <div className="h-2.5 w-4 rounded-full bg-white/10" />
      <div className="h-2 w-12 rounded-full bg-white/10" />
      <div className="h-2 w-10 rounded-full bg-white/10" />
    </div>
  );
}
