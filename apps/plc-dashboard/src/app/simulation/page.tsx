'use client';
import { triggerAction } from '@/services/api';

export default function Simulation() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Simulation Controls</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition-colors border border-slate-700">
          <span className="text-rose-400 font-bold block mb-1">Trigger Overheat</span>
          <span className="text-sm text-slate-400">Simulates high temperature on Motor</span>
        </button>
        <button className="p-4 bg-slate-800 hover:bg-slate-700 rounded-lg text-left transition-colors border border-slate-700">
          <span className="text-amber-400 font-bold block mb-1">Conveyor Delay</span>
          <span className="text-sm text-slate-400">Simulates a jam in the conveyor belt</span>
        </button>
      </div>
    </div>
  );
}
