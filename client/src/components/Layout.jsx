import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const STUDENT_NAV = [
  ["/dashboard", "Dashboard"],
  ["/profile", "My profile"],
  ["/resume", "Resume builder"],
  ["/ats", "ATS check"],
  ["/skill-gap", "Skill gap"],
  ["/careers", "Career paths"],
  ["/interview", "Mock interview"],
  ["/drives", "Placement drives"],
];
const OFFICER_NAV = [
  ["/officer", "Overview"],
  ["/officer/students", "Students"],
  ["/officer/companies", "Companies"],
  ["/officer/drives", "Drives"],
  ["/officer/analytics", "Analytics"],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const items = user.role === "officer" ? OFFICER_NAV : STUDENT_NAV;

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-ink text-white md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0">
        <div className="flex items-center justify-between px-5 py-4 md:block">
          <div>
            <p className="text-lg font-extrabold tracking-tight">CareerPilot AI</p>
            <p className="text-xs text-white/60">{user.role === "officer" ? "Placement cell" : "Student workspace"}</p>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible" aria-label="Main">
          {items.map(([to, label]) => (
            <NavLink
              key={to} to={to} end={to === "/officer"}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition ${isActive ? "bg-white text-ink" : "text-white/75 hover:bg-white/10"}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 md:absolute md:bottom-0 md:block md:w-60">
          <p className="truncate text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-white/60">{user.email}</p>
          <button onClick={() => { logout(); nav("/login"); }} className="mt-3 text-sm font-semibold text-white/80 underline-offset-2 hover:underline">
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-5xl"><Outlet /></div>
        <div className="mt-8 border-t border-line pt-4 md:hidden">
          <button onClick={() => { logout(); nav("/login"); }} className="text-sm font-semibold text-ink-soft">Sign out ({user.name})</button>
        </div>
      </main>
    </div>
  );
}
