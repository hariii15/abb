'use client';
export default function Machines() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Machines Status</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
          <h2 className="text-lg font-semibold text-emerald-400 mb-2">M-101</h2>
          <p className="text-slate-300">Status: Running</p>
          <p className="text-slate-300">Health: 100%</p>
        </div>
      </div>
    </div>
  );
}
