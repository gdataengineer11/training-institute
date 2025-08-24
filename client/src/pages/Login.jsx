// client/src/pages/Login.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TextField, Button, CircularProgress, InputAdornment,
  IconButton, Alert, Checkbox, FormControlLabel
} from '@mui/material';
import Person2RoundedIcon from '@mui/icons-material/Person2Rounded';
import LockRoundedIcon from '@mui/icons-material/LockRounded';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../context/AuthContext';
import './login.css';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [form, setForm] = useState({ username: '', password: '', remember: true });
  const [loading, setLoading] = useState(false);
  const [serverErr, setServerErr] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => { document.title = 'Sign in — Future Skills Academy'; }, []);

  const submit = async (e) => {
    e.preventDefault();
    setServerErr('');
    setLoading(true);
    try {
      await login(String(form.username).trim().toLowerCase(), form.password);
      const redirect = loc.state?.from?.pathname || '/';
      nav(redirect, { replace: true });
    } catch (err) {
      setServerErr(err?.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      {/* LEFT: brand hero */}
      <section className="login-hero">
        <div className="brand">
          <div className="brand-mark">
            {/* star in gradient square */}
            <svg viewBox="0 0 48 48" className="brand-mark__bg">
              <defs>
                <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#7C3AED" />
                  <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="48" height="48" rx="12" fill="url(#g)"/>
            </svg>
            <svg viewBox="0 0 24 24" className="brand-mark__icon">
              <path fill="#fff" d="M12 3l2.2 6.2H21l-5 3.6 1.9 6.2-5-3.6-5 3.6 1.9-6.2-5-3.6h6.8z"/>
            </svg>
          </div>
          <div className="brand-text">
            <h1>Future Skills<br/>Academy</h1>
          </div>
        </div>
        <div className="headline">
          <h2>Effortless admin.<br/>Premium experience.</h2>
          <p>
            Manage enrollments, finances, inventory and reports in one elegant dashboard
            built for speed and clarity.
          </p>
        </div>
      </section>

      {/* RIGHT: glass login card */}
      <section className="login-card-col">
        <div className="gradient-frame">
          <div className="glass-card login-card">
            <div className="version">v1.0</div>

            <h3 className="card-title">Welcome back</h3>
            <p className="card-sub">Sign in to your institute dashboard</p>

            {serverErr && <Alert severity="error" className="mt8">{serverErr}</Alert>}

            <form className="form" onSubmit={submit} autoComplete="on">
              <div className="field">
                <TextField
                  label="Username"
                  fullWidth
                  size="medium"
                  value={form.username}
                  onChange={(e)=> setForm(f=>({...f, username: e.target.value}))}
                  autoComplete="username"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person2RoundedIcon className="field-icon" />
                      </InputAdornment>
                    )
                  }}
                />
              </div>

              <div className="field">
                <TextField
                  label="Password"
                  fullWidth
                  size="medium"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e)=> setForm(f=>({...f, password: e.target.value}))}
                  autoComplete="current-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon className="field-icon" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={()=> setShowPwd(s=>!s)} edge="end">
                          {showPwd ? <VisibilityOff/> : <Visibility/>}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </div>

              <div className="form-row">
                <FormControlLabel
                  control={<Checkbox checked={form.remember} onChange={(e)=> setForm(f=>({...f, remember:e.target.checked}))} />}
                  label="Remember me"
                  className="remember"
                />
                <a className="forgot" href="#" onClick={(e)=> e.preventDefault()}>Forgot password?</a>
              </div>

              <Button
                className="submit-btn"
                type="submit"
                variant="contained"
                disabled={loading || !form.username || !form.password}
              >
                {loading ? <CircularProgress size={22} sx={{ color: '#fff' }}/> : 'Sign in'}
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
