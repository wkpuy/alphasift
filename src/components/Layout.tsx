import { Outlet, NavLink } from 'react-router-dom';
import { useSettingsStore } from '../lib/store/useAppStore';
import { PieChart, Radar, BookOpen, GraduationCap, Settings, Activity } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const store = useSettingsStore();

  return (
    <div className="max-w-[430px] mx-auto h-screen flex flex-col bg-darkBg border-x border-slate-800 relative">
      {/* Header */}
      <header className="bg-cardBg px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)] border-b border-slate-700 flex justify-between items-center sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold font-mono tracking-tight text-blue-400">AlphaSift</h1>
        <div className="flex space-x-4 text-right">
          <div>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Forex</p>
            <p className="text-xs font-bold text-blue-400 font-mono">
              ฿{store.forexCapital.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </p>
          </div>
          <div>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Crypto</p>
            <p className="text-xs font-bold text-emerald-400 font-mono">
              ฿{store.cryptoCapital.toLocaleString(undefined, { minimumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-[calc(80px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-cardBg border-t border-slate-700 absolute bottom-0 w-full z-20 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16 px-1">
          <NavItem to="/dashboard" icon={<PieChart size={20} />} label="Dash" />
          <NavItem to="/scanner" icon={<Radar size={20} />} label="Scan" />
          <NavItem to="/journal" icon={<BookOpen size={20} />} label="Journal" />
          <NavItem to="/backtest" icon={<Activity size={20} />} label="Test" />
          <NavItem to="/guide" icon={<GraduationCap size={20} />} label="Manual" />
          <NavItem to="/settings" icon={<Settings size={20} />} label="Set" />
        </div>
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        clsx(
          "flex flex-col items-center justify-center w-full h-full transition-colors",
          isActive ? "text-blue-500" : "text-slate-500 hover:text-slate-300"
        )
      }
    >
      <div className="mb-1">{icon}</div>
      <span className="text-[9px] font-medium">{label}</span>
    </NavLink>
  );
}
