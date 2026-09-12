import { ReactNode } from 'react';

export function ProgressBar({ percent }: { percent: number }) {
  const clamped = Math.min(100, Math.max(0, percent));
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${clamped}%` }} />
    </div>
  );
}

export function ScoreCircle({ label, value, max = 10 }: { label: string; value: number; max?: number }) {
  const percent = max > 0 ? (value / max) * 100 : 0;
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
          <circle cx="40" cy="40" r={radius} stroke="#F0FDF4" strokeWidth="8" fill="none" />
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#16A34A"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-extrabold text-ink">{value}</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-muted uppercase tracking-wide">{label}</span>
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'primary' | 'warn' }) {
  const toneClass =
    tone === 'primary'
      ? 'bg-primary-light text-primary-dark'
      : tone === 'warn'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-softbg text-muted';
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${toneClass}`}>{children}</span>;
}
