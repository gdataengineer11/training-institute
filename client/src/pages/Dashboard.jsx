import React, { useEffect, useState } from 'react';
import api from '../lib/axios';
import KPICard from '../components/KPICard';
import EnrollmentsChart from '../components/EnrollmentsChart';
import RecentActivitiesTable from '../components/RecentActivitiesTable';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/dashboard/summary')
      .then(res => setData(res.data))
      .catch(e => setErr(e?.response?.data?.message || 'Failed to fetch dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading dashboard…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;

  const { kpis, enrollmentsThisMonth, recentActivities } = data;

  return (
    <div className="p-4 space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Total Enrolled Students" value={kpis.totalStudents} />
        <KPICard title="Outstanding Dues" value={`$${kpis.outstandingDues.toFixed(2)}`} />
        <KPICard title="Upcoming Sessions" value={kpis.upcomingSessions} />
      </div>

      {/* Chart + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EnrollmentsChart data={enrollmentsThisMonth} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivitiesTable rows={recentActivities} />
        </div>
      </div>
    </div>
  );
}
