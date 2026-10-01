import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3, Briefcase, Building2, Calculator, Compass, FileText, House, Layers, LogOut, Mic, Target, User, Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const STUDENT_NAV = [
  ["/dashboard", "Dashboard", House],
  ["/profile", "My profile", User],
  ["/resume", "Resume builder", FileText],
  ["/skill-gap", "Skill gap analysis", Target],
  ["/interview", "Mock interview", Mic],
  ["/aptitude", "Aptitude test", Calculator],
  ["/careers", "Career recommendations", Compass],
  ["/drives", "Placement drives", Briefcase],
  ["/ats", "ATS Analysis", Layers],
];
const OFFICER_NAV = [
  ["/officer", "Overview", House],
  ["/officer/students", "Students", Users],
  ["/officer/companies", "Companies", Building2],
  ["/officer/drives", "Drives", Briefcase],
  ["/officer/analytics", "Analytics", BarChart3],
];

const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const items = user.role === "officer" ? OFFICER_NAV : STUDENT_NAV;
  const roleLine = user.role === "officer" ? "Placement officer" : ["Student", user.department].filter(Boolean).join(" \u00b7 ");
  const signOut = () => { logout(); nav("/login"); };

  return (
    <div className="min-h-screen md:flex">
      <aside className="bg-side text-white md:sticky md:top-0 md:flex md:h-screen md:w-64 md:shrink-0 md:flex-col">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-extrabold text-side">CP</span>
          <p className="text-lg font-bold tracking-tight">CareerPilot AI</p>
        </div>
        <p className="hidden px-5 pb-2 text-sm font-semibold text-white/80 md:block">Menu</p>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-y-auto md:overflow-x-visible" aria-label="Main">
          {items.map(([to, label, Icon]) => (
            <NavLink
              key={to} to={to} end={to === "/officer"}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${isActive ? "bg-side-active text-side-ink" : "text-white/85 hover:bg-white/10"}`}
            >
              <Icon size={18} strokeWidth={2} aria-hidden="true" />
              <span className="whitespace-nowrap">{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-white/15 p-4 md:block">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold">{initials(user.name)}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user.name}</p>
              <p className="truncate text-xs text-white/70">{roleLine}</p>
            </div>
          </div>
          <button onClick={signOut} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/30 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/10">
            <LogOut size={15} aria-hidden="true" /> Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">
        <div className="mx-auto max-w-6xl"><Outlet /></div>
        <div className="mt-8 border-t border-line pt-4 md:hidden">
          <button onClick={signOut} className="text-sm font-semibold text-ink-soft">Log out ({user.name})</button>
        </div>
      </main>
    </div>
  );
}
