'use client';
export default function Alarms() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Active Alarms</h1>
      <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl">
        <div className="flex gap-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
          <span className="font-bold">Warning:</span> Temperature approaching limit
        </div>
      </div>
    </div>
  );
}
