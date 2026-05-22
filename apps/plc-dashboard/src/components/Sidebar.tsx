import Link from 'next/link';
import { Activity, Cpu, Bell, Zap, PlaySquare } from 'lucide-react';

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-800 border-r border-slate-700 p-4 flex flex-col gap-6">
      <div className="flex items-center gap-3 px-2">
        <Activity className="text-emerald-400 w-8 h-8" />
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">PLC Auto</h1>
      </div>
      <nav className="flex flex-col gap-2">
        <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-white">
          <Activity className="w-5 h-5" /> Dashboard
        </Link>
        <Link href="/machines" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-white">
          <Cpu className="w-5 h-5" /> Machines
        </Link>
        <Link href="/alarms" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-white">
          <Bell className="w-5 h-5" /> Alarms
        </Link>
        <Link href="/energy" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-white">
          <Zap className="w-5 h-5" /> Energy
        </Link>
        <Link href="/simulation" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-300 hover:text-white">
          <PlaySquare className="w-5 h-5" /> Simulation
        </Link>
      </nav>
    </div>
  );
}
