export const Card = ({ className = "", children }) => (
  <div className={`rounded-2xl border border-line bg-white p-5 ${className}`}>{children}</div>
);

export const Button = ({ variant = "primary", className = "", ...props }) => {
  const styles = {
    primary: "bg-brand text-white hover:bg-brand-dark",
    ghost: "border border-line bg-white text-ink hover:bg-paper",
    danger: "bg-bad text-white hover:opacity-90",
  }[variant];
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
      {...props}
    />
  );
};

const inputCls =
  "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-brand focus:outline-2 focus:outline-brand/30";

export const Field = ({ label, hint, children, className = "" }) => (
  <label className={`block ${className}`}>
    <span className="mb-1 block text-sm font-semibold">{label}</span>
    {children}
    {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
  </label>
);
export const Input = (props) => <input className={inputCls} {...props} />;
export const Textarea = (props) => <textarea className={`${inputCls} min-h-24`} {...props} />;
export const Select = ({ children, ...props }) => <select className={inputCls} {...props}>{children}</select>;

export const Badge = ({ tone = "neutral", children }) => {
  const tones = {
    neutral: "bg-paper text-ink-soft",
    brand: "bg-brand-soft text-brand-dark",
    ok: "bg-ok-soft text-ok",
    warn: "bg-warn-soft text-warn",
    bad: "bg-bad-soft text-bad",
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
};

export const scoreColor = (v) => (v >= 70 ? "var(--color-ok)" : v >= 40 ? "var(--color-warn)" : "var(--color-bad)");

export function ScoreRing({ value = 0, size = 160, label = "", color, children }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative inline-block" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={`${label} ${v} out of 100`}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-line)" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none" stroke={color || scoreColor(v)} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} transform="rotate(-90 60 60)"
          style={{ transition: "stroke-dashoffset .8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (
          <>
            <span className="text-4xl font-extrabold leading-none">{Math.round(v)}</span>
            {label && <span className="mt-1 text-xs font-semibold text-ink-soft">{label}</span>}
          </>
        )}
      </div>
    </div>
  );
}

export const Bar = ({ value = 0, color }) => (
  <div className="h-2 w-full overflow-hidden rounded-full bg-paper">
    <div className="h-full rounded-full" style={{ width: `${Math.min(100, value)}%`, background: color || scoreColor(value) }} />
  </div>
);

export const Spinner = ({ text = "Loading..." }) => (
  <div className="flex items-center gap-3 py-10 text-sm text-ink-soft" role="status">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
    {text}
  </div>
);

export const ErrorBox = ({ children }) =>
  children ? <p role="alert" className="rounded-md bg-bad-soft px-3 py-2 text-sm text-bad">{children}</p> : null;

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-soft">{subtitle}</p>}
    </div>
    {action}
  </div>
);

export const Empty = ({ children }) => (
  <div className="rounded-lg border border-dashed border-line p-8 text-center text-sm text-ink-soft">{children}</div>
);

export const List = ({ items = [], tone = "text-ink" }) => (
  <ul className={`list-disc space-y-1 pl-5 text-sm ${tone}`}>
    {items.map((x, i) => <li key={i}>{x}</li>)}
  </ul>
);
