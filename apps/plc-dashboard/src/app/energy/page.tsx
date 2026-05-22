'use client';
export default function Energy() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Energy Consumption</h1>
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <p className="text-cyan-400 text-xl">Current: 120 kW</p>
        <p className="text-slate-400">Peak: 250 kW</p>
      </div>
    </div>
  );
}
