import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button, IconButton, Menu, MenuItem, Tooltip, TextField, Select, InputLabel, FormControl, Chip, Box
} from '@mui/material';
import AddIcon from '@mui/icons-material/PersonAddAlt1';
import UploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ContentPasteSearchIcon from '@mui/icons-material/ContentPasteSearch';
import SendIcon from '@mui/icons-material/Send';
import { DataGrid } from '@mui/x-data-grid'; // comes with MUI core v6
import { listStudents, fetchMeta, bulkAction, exportStudents } from '../lib/studentsApi';
import NewStudentModal from '../components/NewStudentModal';

const VIEW_KEY = 'enrollmentsView:v1';

export default function Enrollments() {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ sessions: [], statuses: [], paymentStatuses: [] });
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selection, setSelection] = useState([]);

  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: 'createdAt', sortDir: 'desc',
    q: '', sessionId: '', paymentStatus: '', dateFrom: '', dateTo: '' });

  const [showNew, setShowNew] = useState(false);
  const [anchorExport, setAnchorExport] = useState(null);

  useEffect(() => { fetchMeta().then(setMeta); }, []);

  useEffect(() => {
    setLoading(true);
    listStudents(query).then(d => { setRows(d.rows); setTotal(d.total); })
      .finally(()=> setLoading(false));
  }, [query]);

  // Saved views (localStorage)
  const saveView = () => localStorage.setItem(VIEW_KEY, JSON.stringify(query));
  const loadView = () => {
    const raw = localStorage.getItem(VIEW_KEY);
    if (raw) setQuery(JSON.parse(raw));
  };

  const columns = useMemo(()=>[
    { field: 'name', headerName: 'Student', flex: 1, minWidth: 160, sortable: false },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180, sortable: false },
    { field: 'phone', headerName: 'Phone', width: 140, sortable: false },
    { field: 'session', headerName: 'Session', width: 160 },
    { field: 'status', headerName: 'Status', width: 130,
      renderCell: p => <Chip size="small" label={p.value} color="primary" variant="outlined" /> },
    { field: 'paymentStatus', headerName: 'Payment', width: 120,
      renderCell: p => <Chip size="small" label={p.value} color={p.value==='PAID'?'success':p.value==='PENDING'?'warning':'info'} /> },
    { field: 'outstanding', headerName: 'Due', width: 100, type: 'number',
      valueFormatter: p => `$${Number(p.value||0).toFixed(0)}` },
    { field: 'createdAt', headerName: 'Created', width: 160,
      valueFormatter: p => new Date(p.value).toLocaleDateString() }
  ], []);

  // Bulk actions
  const doAssignBatch = async () => {
    if (!selection.length) return;
    const batchId = prompt('Enter batch ID to assign'); // quick UX; replace with dialog if you prefer
    if (!batchId) return;
    await bulkAction('ASSIGN_BATCH', selection.map(Number), { batchId: Number(batchId) });
    alert('Assigned batch ✔️');
  };

  const doUpdateStatus = async () => {
    if (!selection.length) return;
    const to = prompt('Enter status (LEAD/APPLICANT/ENROLLED/ACTIVE/COMPLETED/ALUMNI/CANCELED)', 'ACTIVE');
    if (!to) return;
    await bulkAction('UPDATE_STATUS', selection.map(Number), { status: to });
    setQuery({ ...query }); // refresh
  };

  const doReminders = async () => {
    if (!selection.length) return;
    await bulkAction('SEND_REMINDER', selection.map(Number));
    alert('Reminders queued ✔️');
  };

  // Export
  const runExport = async (fmt) => {
    const res = await exportStudents(query, fmt);
    const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `enrollments.${fmt}`; a.click();
    URL.revokeObjectURL(url);
    setAnchorExport(null);
  };

  return (
    <div className="p-4 space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-end">
        <TextField
          label="Search"
          size="small"
          value={query.q}
          onChange={e=> setQuery({ ...query, q: e.target.value, page:1 })}
          InputProps={{ endAdornment: <ContentPasteSearchIcon fontSize="small" /> }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Session</InputLabel>
          <Select native label="Session" value={query.sessionId} onChange={e=> setQuery({ ...query, sessionId: e.target.value, page:1 })}>
            <option value=""></option>
            {meta.sessions?.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Payment</InputLabel>
          <Select native label="Payment" value={query.paymentStatus} onChange={e=> setQuery({ ...query, paymentStatus: e.target.value, page:1 })}>
            <option value=""></option>
            {['PENDING','PARTIAL','PAID','REFUNDED'].map(p=> <option key={p} value={p}>{p}</option>)}
          </Select>
        </FormControl>
        <TextField
          label="From"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={query.dateFrom}
          onChange={e=> setQuery({ ...query, dateFrom: e.target.value, page:1 })}
        />
        <TextField
          label="To"
          type="date"
          size="small"
          InputLabelProps={{ shrink: true }}
          value={query.dateTo}
          onChange={e=> setQuery({ ...query, dateTo: e.target.value, page:1 })}
        />

        <Button startIcon={<FilterListIcon />} onClick={saveView} variant="outlined">Save View</Button>
        <Button onClick={loadView} variant="outlined">Load View</Button>

        <Box sx={{ flex: 1 }} />

        <Tooltip title="Bulk: assign batch">
          <IconButton onClick={doAssignBatch}><CheckCircleIcon /></IconButton>
        </Tooltip>
        <Tooltip title="Bulk: update status">
          <IconButton onClick={doUpdateStatus}><ViewColumnIcon /></IconButton>
        </Tooltip>
        <Tooltip title="Bulk: send reminders">
          <IconButton onClick={doReminders}><SendIcon /></IconButton>
        </Tooltip>

        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={(e)=> setAnchorExport(e.currentTarget)}>Export</Button>
        <Menu anchorEl={anchorExport} open={Boolean(anchorExport)} onClose={()=> setAnchorExport(null)}>
          <MenuItem onClick={()=> runExport('csv')}>CSV</MenuItem>
          <MenuItem onClick={()=> runExport('xlsx')}>Excel (.xlsx)</MenuItem>
          <MenuItem onClick={()=> runExport('pdf')}>PDF</MenuItem>
        </Menu>

        <Button variant="contained" startIcon={<AddIcon />} onClick={()=> setShowNew(true)}>Add New Student</Button>
      </div>

      {/* Grid */}
      <div style={{ height: 560, width: '100%' }} className="bg-white rounded-lg border">
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={total}
          pagination
          paginationMode="server"
          pageSizeOptions={[10,20,50]}
          pageSize={query.limit}
          onPaginationModelChange={(m)=> setQuery({ ...query, page: m.page+1, limit: m.pageSize })}
          sortingMode="server"
          onSortModelChange={(m)=> {
            const s = m[0]; if (!s) return setQuery({ ...query, sortBy:'createdAt', sortDir:'desc' });
            setQuery({ ...query, sortBy: s.field, sortDir: s.sort||'asc' });
          }}
          checkboxSelection
          onRowSelectionModelChange={(s)=> setSelection(s)}
          disableRowSelectionOnClick
          slots={{
            toolbar: ()=> null, // we built our own toolbar
          }}
        />
      </div>

      {/* Add/Edit modal */}
      {showNew && <NewStudentModal open={showNew} onClose={()=> setShowNew(false)} meta={meta} onCreated={()=> setQuery({ ...query })} />}
    </div>
  );
}
