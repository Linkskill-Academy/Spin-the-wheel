import { NavLink, Outlet } from 'react-router-dom';
import {
  Home,
  Sunrise,
  Moon,
  Target,
  Wallet,
  Users,
  GraduationCap,
  Sparkles,
  CheckSquare,
  Timer,
  CalendarRange,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function getPrimaryNav(isStudent: boolean) {
  return [
    { to: '/', label: 'Home', icon: Home },
    { to: '/focus', label: 'Focus', icon: Timer },
    { to: '/goals', label: 'Goals', icon: Target },
    isStudent ? { to: '/habits', label: 'Habits', icon: CheckSquare } : { to: '/crm', label: 'CRM', icon: Users },
    { to: '/me', label: 'Me', icon: UserIcon },
  ];
}

function getSideNav(isStudent: boolean) {
  const base = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/morning', label: 'Morning Routine', icon: Sunrise },
    { to: '/focus', label: 'Focus Mode', icon: Timer },
    { to: '/night', label: 'Night Review', icon: Moon },
    { to: '/goals', label: 'Vision & Goals', icon: Target },
  ];
  const founderOnly = [
    { to: '/money', label: 'Money', icon: Wallet },
    { to: '/crm', label: 'CRM Pipeline', icon: Users },
    { to: '/colleges', label: 'College Outreach', icon: GraduationCap },
  ];
  const rest = [
    { to: '/habits', label: 'Habits', icon: CheckSquare },
    { to: '/evidence', label: 'Evidence Log', icon: Sparkles },
    { to: '/reviews', label: 'Weekly & Monthly', icon: CalendarRange },
  ];
  return isStudent ? [...base, ...rest] : [...base, ...founderOnly, ...rest];
}

export default function Layout() {
  const { user } = useAuth();
  const isStudent = user?.accountMode === 'student';
  const primaryNav = getPrimaryNav(isStudent);
  const sideNav = getSideNav(isStudent);

  return (
    <div className="min-h-screen bg-softbg flex">
      <aside className="hidden md:flex md:w-64 flex-col border-r border-line bg-white px-4 py-6 sticky top-0 h-screen">
        <div className="px-2 mb-8">
          <p className="font-extrabold text-lg leading-tight text-ink">Manifestation<br />& Execution</p>
          <p className="text-xs text-muted mt-1">{user?.accountMode === 'student' ? 'Student Mode' : 'Founder Mode'}</p>
        </div>
        <nav className="flex-1 flex flex-col gap-1">
          {sideNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive ? 'bg-primary-light text-primary-dark' : 'text-ink hover:bg-softbg'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <NavLink
          to="/me"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-ink hover:bg-softbg"
        >
          <UserIcon size={18} />
          Account & Settings
        </NavLink>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 pb-24 md:pb-8">
          <Outlet />
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-line flex items-stretch justify-around px-1 py-1 z-30">
          {primaryNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl text-[11px] font-semibold ${
                  isActive ? 'text-primary' : 'text-muted'
                }`
              }
            >
              <item.icon size={22} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
