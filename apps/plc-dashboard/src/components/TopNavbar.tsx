import { Bell, User } from 'lucide-react';

export default function TopNavbar() {
  return (
    <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-slate-200">Industrial Operations Center</h2>
      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-full hover:bg-slate-700 transition-colors">
          <Bell className="w-5 h-5 text-slate-300" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-800"></span>
        </button>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </div>
    </header>
  );
}
