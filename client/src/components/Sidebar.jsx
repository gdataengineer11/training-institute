import React, { useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PaymentsIcon from '@mui/icons-material/Payments';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import { Link, useLocation } from 'react-router-dom';

const items = [
  { to: '/', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
  { to: '/enrollments', label: 'Enrollments', icon: <SchoolIcon fontSize="small" /> },
  { to: '/inventory', label: 'Inventory', icon: <Inventory2Icon fontSize="small" /> },
  { to: '/finance', label: 'Financials', icon: <PaymentsIcon fontSize="small" /> },
  { to: '/receipts', label: 'Receipts', icon: <ReceiptLongIcon fontSize="small" /> },
  { to: '/reports', label: 'Reports', icon: <AssessmentIcon fontSize="small" /> }
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { pathname } = useLocation();

  return (
    <aside className={`h-screen bg-white border-r shadow-sm transition-all ${collapsed ? 'w-16' : 'w-60'} sticky top-0`}>
      <div className="flex items-center justify-between p-4">
        <div className="font-bold text-indigo-600">{collapsed ? 'TI' : 'TIMS'}</div>
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-500 hover:text-gray-800">
          <MenuOpenIcon fontSize="small" />
        </button>
      </div>
      <nav className="px-2">
        {items.map(it => {
          const active = pathname === it.to;
          return (
            <Link key={it.to} to={it.to}
              className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 
                ${active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}>
              <span>{it.icon}</span>
              {!collapsed && <span className="text-sm">{it.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
