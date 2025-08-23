// client/src/pages/Login.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TextField, Button, CircularProgress, Card, CardContent,
  InputAdornment, IconButton, Alert, Checkbox, FormControlLabel
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockRounded from '@mui/icons-material/LockRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import BrandLogo from '../components/BrandLogo';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [form, setForm] = useState({ username: '', password: '', remember: true });
  const [touched, setTouched] = useState({ username: false, password: false });
  const [errors, setErrors] = useState({ username: false, password: false }); // booleans only

  const [serverErr, setServerErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [caps, setCaps] = useState(false);

  // CapsLock indicator
  useEffect(() => {
    const h = (e) => setCaps(e.getModifierState && e.getModifierState('CapsLock'));
    window.addEventListener('keydown', h);
    window.addEventListener('keyup', h);
    return () => { window.removeEventListener('keydown', h); window.removeEventListener('keyup', h); };
  }, []);

  // 3–20 chars; letters, numbers, dot, underscore, hyphen
  const usernamePattern = /^[a-zA-Z0-9._-]{3,20}$/;

  const validate = (onSubmit = false) => {
    const u = form.username.trim();
    const p = form.password;

    const usernameInvalid =
      onSubmit ? !u || !usernamePattern.test(u)
               : (touched.username ? (u.length > 0 && !usernamePattern.test(u)) : false);

    const passwordInvalid =
      onSubmit ? !p || p.length < 6
               : (touched.password ? (p.length > 0 && p.length < 6) : false);

    const next = { username: usernameInvalid, password: passwordInvalid };
    setErrors(next);
    return !next.username && !next.password;
  };

  const onChange = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (touched[k]) validate(false);
  };

  const onBlur = (k) => () => {
    setTouched((t) => ({ ...t, [k]: true }));
    validate(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setServerErr('');
    setTouched({ username: true, password: true });

    const ok = validate(true);
    if (!ok) return;

    setLoading(true);
    try {
      await login(form.username.trim(), form.password);
      nav('/', { replace: true });
    } catch (error) {
      setServerErr(error?.response?.data?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="premium-bg min-h-screen flex items-center">
      <div className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-[1fr_minmax(420px,560px)] items-center gap-8 px-4 lg:px-10">

        {/* Left column: branding (feature cards removed) */}
        <div className="text-white/90 hidden lg:block pl-[min(10vw,160px)]">
          <div className="mb-8">
            <BrandLogo size={64} textSize="text-3xl" brand="Your Brand" tag="Training Portal" />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-glow">
            Effortless admin. <br />Premium experience.
          </h1>
          <p className="mt-4 text-white/70 max-w-md">
            Manage enrollments, finances, inventory and reports in one elegant dashboard built for speed and clarity.
          </p>
          {/* Removed the three glass feature cards block */}
        </div>

        {/* Right column: login card (right-aligned) */}
        <div className="justify-self-end mr-[min(6vw,96px)] w-full max-w-[560px]">
          <div className="gradient-frame">
            <Card className="glass !bg-transparent !shadow-2xl">
              <CardContent className="p-6 lg:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="lg:hidden">
                    <BrandLogo size={48} textSize="text-xl" brand="Your Brand" tag="Training Portal" />
                  </div>
                  <div className="text-white/60 text-xs">v1.0</div>
                </div>

                <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
                <p className="text-white/60 text-sm mb-6">Sign in to your institute dashboard</p>

                {serverErr && <Alert severity="error" className="mb-4">{serverErr}</Alert>}
                {caps && <Alert severity="warning" className="mb-4">Caps Lock is ON</Alert>}

                <form onSubmit={submit} className="space-y-4">
                  <TextField
                    label="Username"
                    autoFocus
                    fullWidth
                    value={form.username}
                    onChange={onChange('username')}
                    onBlur={onBlur('username')}
                    error={errors.username}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonRounded className="text-white/70" />
                        </InputAdornment>
                      )
                    }}
                    variant="filled"
                    color="primary"
                    sx={{
                      '& .MuiFilledInput-root': {
                        backgroundColor: 'rgba(255,255,255,.06)',
                        color: 'white',
                        borderRadius: '12px'
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,.6)' }
                    }}
                  />

                  <TextField
                    label="Password"
                    type={showPwd ? 'text' : 'password'}
                    fullWidth
                    value={form.password}
                    onChange={onChange('password')}
                    onBlur={onBlur('password')}
                    onKeyUp={(e) => setCaps(e.getModifierState && e.getModifierState('CapsLock'))}
                    error={errors.password}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockRounded className="text-white/70" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPwd((s) => !s)} edge="end" aria-label="toggle password visibility">
                            {showPwd ? <VisibilityOff className="text-white/80" /> : <Visibility className="text-white/80" />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    variant="filled"
                    color="primary"
                    sx={{
                      '& .MuiFilledInput-root': {
                        backgroundColor: 'rgba(255,255,255,.06)',
                        color: 'white',
                        borderRadius: '12px'
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255,255,255,.6)' }
                    }}
                  />

                  <div className="flex items-center justify-between">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={form.remember}
                          onChange={(e) => setForm((f) => ({ ...f, remember: e.target.checked }))}
                          sx={{ color: 'rgba(255,255,255,.7)' }}
                        />
                      }
                      label={<span className="text-white/80 text-sm">Remember me</span>}
                    />
                    <a className="text-sm text-cyan-300 hover:text-cyan-200" href="#" onClick={(e) => e.preventDefault()}>
                      Forgot password?
                    </a>
                  </div>

                  <Button
                    type="submit"
                    size="large"
                    fullWidth
                    className="btn-gradient"
                    sx={{ py: 1.4, borderRadius: '12px' }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={22} sx={{ color: 'white' }} /> : 'Sign in'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="hidden lg:block lg:col-start-2 text-right text-white/40 text-xs pr-[min(6vw,96px)]">
          © {new Date().getFullYear()} Your Brand. All rights reserved.
        </div>
      </div>
    </div>
  );
}
