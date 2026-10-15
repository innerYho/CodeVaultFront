import { formatLocalTime, getTimeZone } from "./index";

// 4-mar-2024 18:00 UTC
const EVENT = Date.UTC(2024, 2, 4, 18, 0);
const zones = ["America/Bogota", "Europe/Madrid", "Asia/Kolkata", "Pacific/Auckland"];

export default function Demo() {
  return (
    <div className="space-y-3 text-sm">
      <p>
        Un mismo instante (<code>{new Date(EVENT).toISOString()}</code>) visto desde cada zona. La
        tuya es <strong>{getTimeZone()}</strong>:
      </p>
      <p className="font-mono">Tu hora: {formatLocalTime(EVENT, { locale: "es" })}</p>
      <ul className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
        {zones.map((timeZone) => (
          <li key={timeZone}>
            {timeZone.padEnd(18)} {formatLocalTime(EVENT, { locale: "es", timeZone })}
          </li>
        ))}
      </ul>
      <p className="text-xs text-zinc-500">
        India es GMT+5:30: una resta entera de horas no lo representa.
      </p>
    </div>
  );
}
