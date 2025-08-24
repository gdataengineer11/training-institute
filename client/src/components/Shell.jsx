import React from 'react';
import {
  AppBar, Toolbar, Typography, Box, IconButton, Drawer, List, ListItemButton,
  ListItemIcon, ListItemText, Avatar, Tooltip
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const drawerWidth = 232;

function BrandMark(){
  return (
    <div style={{display:'flex',alignItems:'center',gap:10,padding:12}}>
      <div className="kpi-icon" style={{background:'linear-gradient(135deg,var(--brand-1),var(--brand-2))', border:'none'}}>
        <svg width="22" height="22" viewBox="0 0 24 24"><path fill="white" d="M12 2l2.4 6.9h7.2l-5.8 4.2 2.4 6.9L12 15.8 5.8 20l2.4-6.9L2.4 8.9h7.2z"/></svg>
      </div>
      <div>
        <div className="text-gradient" style={{fontWeight:800, letterSpacing:.4}}>Future Skills</div>
        <div style={{fontSize:12,color:'var(--ink-2)'}}>Admin Console</div>
      </div>
    </div>
  );
}

export default function Shell({ children }) {
  const nav = useNavigate();
  const loc = useLocation();
  const { logout, user } = useAuth();

  const go = (path) => () => nav(path);

  return (
    <Box className="premium-bg" sx={{ display: 'flex', minHeight: '100dvh' }}>
      <AppBar position="fixed" elevation={0} className="appbar-blur" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ fontWeight: 800 }} className="text-gradient">FSA</Typography>
          <Box sx={{ flex: 1 }} />
          <Tooltip title={user?.fullName || ''}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,.1)', color: '#fff', border:'1px solid rgba(255,255,255,.18)' }}>
              {user?.fullName?.[0]?.toUpperCase() || 'A'}
            </Avatar>
          </Tooltip>
          <IconButton aria-label="logout" onClick={() => { logout(); nav('/login'); }} sx={{ ml: 1, color:'#fff' }}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        PaperProps={{ className:'glass-sidebar' }}
        sx={{ width: drawerWidth, flexShrink: 0, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing:'border-box', color:'#eaf0ff' } }}
      >
        <Toolbar />
        <BrandMark />
        <List>
          <ListItemButton selected={loc.pathname === '/'} onClick={go('/')}>
            <ListItemIcon><DashboardIcon sx={{ color:'#b8c2db' }}/></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
          <ListItemButton selected={loc.pathname.startsWith('/inventory')} onClick={go('/inventory')}>
            <ListItemIcon><Inventory2Icon sx={{ color:'#b8c2db' }}/></ListItemIcon>
            <ListItemText primary="Inventory" />
          </ListItemButton>
        </List>
        <Box sx={{ flex:1 }} />
        <div style={{padding:'12px', fontSize:11, color:'var(--ink-2)'}}>© {new Date().getFullYear()} Future Skills Academy</div>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 2 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
