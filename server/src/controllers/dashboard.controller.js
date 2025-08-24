// client/src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Card, CardContent, CardHeader, Typography, Grid, Box,
  CircularProgress, Alert, Table, TableHead, TableBody, TableRow, TableCell,
  IconButton, Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventIcon from '@mui/icons-material/Event';
import { getSummary, getTrend, getRecent } from '../lib/dashboardApi';

function Kpi({ icon, label, value, accent = '#7C3AED' }) {
  return (
    <Card elevation={2}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{
          width: 46, height: 46, borderRadius: 2, display: 'grid', placeItems: 'center',
          background: accent + '22', color: accent
        }}>
          {icon}
        </Box>
        <div>
          <Typography variant="overline" color="text.secondary">{label}</Typography>
          <Typography variant="h5" fontWeight={700}>{value}</Typography>
        </div>
      </CardContent>
    </Card>
  );
}

/* Minimal bar chart (no extra libs) */
function MiniBar({ data = [], color = '#7C3AED', height = 140 }) {
  const max = useMemo(() => Math.max(1, ...data.map(d => d.count || 0)), [data]);
  return (
    <Box sx={{ height, display: 'flex', alignItems: 'flex-end', gap: 6/2, p: 1 }}>
      {data.map((d, i) => {
        const h = Math.round(((d.count || 0) / max) * (height - 40));
        return (
          <Tooltip key={i} title={`${d.date}: ${d.count}`} arrow>
            <Box sx={{
              width: 10,
              height: h,
              background: color,
              borderRadius: '6px 6px 0 0',
              transition: 'height 200ms ease'
            }}/>
          </Tooltip>
        );
      })}
    </Box>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const today = new Date();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth() + 1; // 1..12

  const load = async () => {
    setLoading(true); setErr('');
    try {
      const [s, t, r] = await Promise.all([
        getSummary(),
        getTrend({ year, month }),
        getRecent({ limit: 8 })
      ]);
      setSummary(s || {});
      setTrend(Array.isArray(t) ? t : []);
      setRecent(Array.isArray(r) ? r : []);
    } catch (e) {
      console.error(e);
      setErr(e?.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // load on mount

  const totalStudents = summary?.totalStudents ?? 0;
  const totalItems = summary?.inventory?.totalItems ?? 0;
  const lowStock = summary?.inventory?.lowStockCount ?? 0;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <Typography variant="h5" fontWeight={700}>Dashboard</Typography>
        <IconButton size="small" onClick={load} title="Refresh">
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>

      {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 240 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Kpi icon={<PeopleAltIcon />} label="Total Students" value={totalStudents} accent="#0EA5E9" />
          </Grid>
          <Grid item xs={12} md={4}>
            <Kpi icon={<Inventory2Icon />} label="Inventory Items" value={totalItems} accent="#22C55E" />
          </Grid>
          <Grid item xs={12} md={4}>
            <Kpi icon={<WarningAmberIcon />} label="Low-Stock Items" value={lowStock} accent="#F59E0B" />
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader
                title="Enrollments This Month"
                subheader={`${year}-${String(month).padStart(2,'0')}`}
                action={<EventIcon color="action" />}
              />
              <CardContent sx={{ pt: 0 }}>
                {trend.length === 0 ? (
                  <Typography color="text.secondary">No enrollments yet this month.</Typography>
                ) : (
                  <MiniBar data={trend} />
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={2}>
              <CardHeader title="Recent Enrollments" />
              <CardContent sx={{ pt: 0 }}>
                {recent.length === 0 ? (
                  <Typography color="text.secondary">No recent enrollments.</Typography>
                ) : (
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Session</TableCell>
                        <TableCell>Joined</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recent.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.name}</TableCell>
                          <TableCell>{r.session || '-'}</TableCell>
                          <TableCell>{new Date(r.joinedAt).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
