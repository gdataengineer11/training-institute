import React from 'react';

export default function KPICard({ title, value, subtitle }) {
  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="text-gray-500 text-sm">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-2">{subtitle}</div>}
    </div>
  );
}
