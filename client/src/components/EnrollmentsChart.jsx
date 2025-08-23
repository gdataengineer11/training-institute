import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export default function EnrollmentsChart({ data }) {
  const formatted = data?.map(d => ({ day: d.day, count: d.count })) || [];
  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm h-72">
      <div className="text-sm text-gray-600 mb-3">Enrollments This Month</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#6366F1" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
