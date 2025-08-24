import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Grid, Typography, IconButton, Alert, CircularProgress, Table, TableBody, TableCell, TableHead, TableRow,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EventIcon from '@mui/icons-material/Event';
import { getSummary, getTrend, getRecent } from '../lib/dashboardApi';

function GlassCard({ children, style }) {
  return (
    <div className="gradient-frame" style={style}>
      <div className="glass-card">{children}</div>
    </div>
  );
}

function Kpi({ icon, label, value, accent='var(--brand-1)' }) {
  return (
    <GlassCard>
      <div style={{ padding:16, display:'flex', alignItems:'center', gap:12 }}>
        <div className="kpi-icon" style={{ color:'#fff', background:`linear-gradient(135deg, ${accent}, ${accent}66)` }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize:12, color:'var(--ink-2)', textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
          <div style={{ fontSize:26, fontWeight:800, color:'#eaf0ff' }}>{value}</div>
        </div>
      </div>
    </GlassCard>
  );
}

/* dependency-free tiny bar chart */
function TinyBars({ data = [], height = 160, color='url(#g1)' }) {
  const max = useMemo(()=> Math.max(1, ...data.map(d=>d.count||0)), [data]);
  const N = data.length || 1;
  const gap = 6, barW = 10;
  const width = Math.max(140, N * (barW + gap) + gap);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Enrollments trend">
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#7C3AED"/><stop offset="100%" stopColor="#06B6D4"/>
        </linearGradient>
      </defs>
      {data.map((d,i)=>{
        const h = Math.round(((d.count||0)/max) * (height-40));
        const x = gap + i*(barW+gap);
        const y = height - h - 20;
        return (
          <Tooltip key={i} title={`${d.date}: ${d.count}`} arrow>
            <rect x={x} y={y} width={barW} height={h} rx="6" fill={color} opacity="0.9" />
          </Tooltip>
        );
      })}
      <text x="10" y={height-6} fill="#b8c2db" fontSize="10">days</text>
      <text x={width-10} y="14" fill="#b8c2db" fontSize="10" textAnchor="end">count</text>
    </svg>
  );
}

export default function Dashboard(){
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const today = new Date();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth()+1;

  const load = async ()=>{
    setLoading(true); setErr('');
    try{
      const [s, t, r] = await Promise.all([
        getSummary(),
        getTrend({ year, month }),
        getRecent({ limit: 8 })
      ]);
      setSummary(s || {});
      setTrend(Array.isArray(t)?t:[]);
      setRecent(Array.isArray(r)?r:[]);
    }catch(e){
      console.error(e);
      setErr(e?.response?.data?.message || e?.message || 'Failed to load dashboard');
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{ load(); },[]);

  const totalStudents = summary?.totalStudents ?? 0;
  const totalItems    = summary?.inventory?.totalItems ?? 0;
  const lowStock      = summary?.inventory?.lowStockCount ?? 0;

  return (
    <Box>
      <Box sx={{ display:'flex', alignItems:'center', mb:2, gap:1 }}>
        <Typography variant="h5" sx={{ fontWeight:900 }} className="text-gradient">Dashboard</Typography>
        <IconButton size="small" onClick={load} sx={{ color:'#eaf0ff' }}><RefreshIcon fontSize="small"/></IconButton>
      </Box>

      {err && <Alert severity="error" sx={{ mb:2 }}>{err}</Alert>}

      {loading ? (
        <Box sx={{ display:'grid', placeItems:'center', minHeight:260 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}><Kpi icon={<PeopleAltIcon/>} label="Total Students" value={totalStudents} accent="#0EA5E9" /></Grid>
          <Grid item xs={12} md={4}><Kpi icon={<Inventory2Icon/>} label="Inventory Items" value={totalItems} accent="#22C55E" /></Grid>
          <Grid item xs={12} md={4}><Kpi icon={<WarningAmberIcon/>} label="Low-Stock Items" value={lowStock} accent="#F59E0B" /></Grid>

          <Grid item xs={12} md={6}>
            <GlassCard>
              <div style={{ padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                  <EventIcon sx={{ color:'#b8c2db' }} /><div style={{ color:'#b8c2db' }}>Enrollments This Month</div>
                  <div style={{ marginLeft:'auto', color:'#8ea0c6', fontSize:12 }}>
                    {year}-{String(month).padStart(2,'0')}
                  </div>
                </div>
                {trend.length===0
                  ? <div style={{ color:'#b8c2db', padding:'12px 4px' }}>No enrollments yet this month.</div>
                  : <TinyBars data={trend} />}
              </div>
            </GlassCard>
          </Grid>

          <Grid item xs={12} md={6}>
            <GlassCard>
              <div style={{ padding:16 }}>
                <div style={{ color:'#b8c2db', marginBottom:6 }}>Recent Enrollments</div>
                {recent.length===0 ? (
                  <div style={{ color:'#b8c2db' }}>No recent enrollments.</div>
                ) : (
                  <div className="table-dark" style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign:'left', padding:'10px 8px', fontSize:12 }}>Name</th>
                          <th style={{ textAlign:'left', padding:'10px 8px', fontSize:12 }}>Session</th>
                          <th style={{ textAlign:'left', padding:'10px 8px', fontSize:12 }}>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent.map(r=>(
                          <tr key={r.id}>
                            <td style={{ padding:'10px 8px' }}>{r.name}</td>
                            <td style={{ padding:'10px 8px' }}>{r.session || '-'}</td>
                            <td style={{ padding:'10px 8px' }}>{new Date(r.joinedAt).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </GlassCard>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
