'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats] = useState({ machines: 3, running: 2, alarms: 1, energy: 120 });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
          <p className="text-sm text-slate-400">Total Machines</p>
          <p className="text-3xl font-semibold text-white mt-2">{stats.machines}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
          <p className="text-sm text-slate-400">Running Systems</p>
          <p className="text-3xl font-semibold text-emerald-400 mt-2">{stats.running}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
          <p className="text-sm text-slate-400">Active Alarms</p>
          <p className="text-3xl font-semibold text-rose-400 mt-2">{stats.alarms}</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
          <p className="text-sm text-slate-400">Energy (kW)</p>
          <p className="text-3xl font-semibold text-cyan-400 mt-2">{stats.energy}</p>
        </div>
      </div>
    </div>
  );
}
