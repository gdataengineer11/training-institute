import React from 'react';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="font-medium text-gray-700">Training Institute</div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-gray-700">
          <AccountCircleIcon />
          <span className="text-sm">{user?.name || user?.username}</span>
        </div>
        <button onClick={logout} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700">
          <LogoutIcon fontSize="small" /> <span className="text-sm">Logout</span>
        </button>
      </div>
    </header>
  );
}
