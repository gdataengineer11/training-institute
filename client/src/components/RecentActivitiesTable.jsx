import React from 'react';

export default function RecentActivitiesTable({ rows }) {
  return (
    <div className="bg-white rounded-lg border p-4 shadow-sm">
      <div className="text-sm text-gray-600 mb-3">Recent Activities</div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Student</th>
              <th className="py-2 pr-4">Session</th>
              <th className="py-2 pr-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="py-2 pr-4">{r.type}</td>
                <td className="py-2 pr-4">{r.student}</td>
                <td className="py-2 pr-4">{r.session}</td>
                <td className="py-2 pr-4">{new Date(r.date).toLocaleString()}</td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr><td className="py-6 text-gray-400" colSpan={4}>No recent activity.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
