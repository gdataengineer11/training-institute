// client/src/pages/Inventory.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Button, IconButton, TextField, FormControl, InputLabel, Select, MenuItem,
  Checkbox, FormControlLabel, Menu, MenuItem as MItem, Chip, Box,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import InventoryIcon from '@mui/icons-material/Inventory2';
import RemoveIcon from '@mui/icons-material/RemoveCircleOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import TuneIcon from '@mui/icons-material/Tune';
import EditIcon from '@mui/icons-material/Edit';
import { DataGrid } from '@mui/x-data-grid';

import {
  getMeta, listItems, createItem, updateItem, archiveItem,
  issueStock, receiveStock, adjustStock, returnStock, disposeStock,
  bulkAction, exportItems, importCsv
} from '../lib/inventoryApi';

export default function Inventory() {
  const [meta, setMeta] = useState({ categories: [], suppliers: [], statuses: ['ACTIVE', 'ARCHIVED'], units: [] });
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [selection, setSelection] = useState([]);

  const [q, setQ] = useState('');
  const [filters, setFilters] = useState({ category: '', status: '', lowStockOnly: false });
  const [query, setQuery] = useState({ page: 1, limit: 10, sortBy: 'updatedAt', sortDir: 'desc' });

  const [showNew, setShowNew] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [anchorExport, setAnchorExport] = useState(null);
  const [issueOpen, setIssueOpen] = useState(null);
  const [receiveOpen, setReceiveOpen] = useState(null);
  const [adjustOpen, setAdjustOpen] = useState(null);

  useEffect(() => { getMeta().then(setMeta); }, []);

  useEffect(() => {
    setLoading(true);
    listItems({ ...query, q, ...filters })
      .then(d => { setRows(d.rows); setTotal(d.total); })
      .finally(() => setLoading(false));
  }, [q, filters, query]);

  const columns = useMemo(() => [
    {
      field: 'name', headerName: 'Item', flex: 1, minWidth: 180, renderCell: (p) => (
        <div className="flex items-center gap-2">
          {p.row.imageUrl
            ? <img src={p.row.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
            : <InventoryIcon fontSize="small" className="text-gray-400" />}
          <div>
            <div className="font-medium">{p.value}</div>
            <div className="text-xs text-gray-500">{p.row.sku}</div>
          </div>
        </div>
      )
    },
    { field: 'category', headerName: 'Category', width: 140 },
    { field: 'unit', headerName: 'Unit', width: 80 },
    { field: 'stock', headerName: 'Stock', width: 90, type: 'number' },
    { field: 'issued', headerName: 'Issued', width: 90, type: 'number' },
    { field: 'threshold', headerName: 'Low Thresh', width: 110, type: 'number' },
    { field: 'low', headerName: 'Low?', width: 90, renderCell: (p) => p.value ? <Chip size="small" color="warning" label="LOW" /> : <Chip size="small" label="OK" /> },
    { field: 'location', headerName: 'Location', width: 140 },
    { field: 'supplier', headerName: 'Supplier', width: 160 },
    { field: 'status', headerName: 'Status', width: 110, renderCell: (p) => <Chip size="small" label={p.value} color={p.value === 'ACTIVE' ? 'success' : 'default'} variant="outlined" /> },
    { field: 'updatedAt', headerName: 'Updated', width: 160, valueFormatter: (p) => new Date(p.value).toLocaleString() },
    {
      field: 'actions', headerName: '', width: 140, sortable: false, renderCell: (p) => (
        <div className="flex gap-1">
          <IconButton size="small" onClick={() => setEditRow(p.row)}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => setIssueOpen(p.row)} title="Issue"><RemoveIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => setReceiveOpen(p.row)} title="Receive"><AddCircleOutlineIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => setAdjustOpen(p.row)} title="Adjust"><TuneIcon fontSize="small" /></IconButton>
        </div>
      )
    }
  ], []);

  const runExport = async (fmt) => {
    const res = await exportItems({ ...query, q, ...filters }, fmt);
    const blob = new Blob([res.data], { type: res.headers['content-type'] || 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `inventory.${fmt}`; a.click();
    URL.revokeObjectURL(url);
    setAnchorExport(null);
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await importCsv(file);
    setQuery({ ...query }); // refresh
  };

  const onBulk = async (action) => {
    if (!selection.length) return;
    await bulkAction(action, selection, {});
    setSelection([]);
    setQuery({ ...query });
  };

  return (
    <div className="p-4 space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 items-end">
        <TextField label="Search" size="small" value={q} onChange={(e) => setQ(e.target.value)} />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Category</InputLabel>
          <Select label="Category" value={filters.category} onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}>
            <MenuItem value=""><em>Any</em></MenuItem>
            {meta.categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={filters.status} onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}>
            <MenuItem value=""><em>Any</em></MenuItem>
            {meta.statuses.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControlLabel control={
          <Checkbox checked={filters.lowStockOnly} onChange={(e) => setFilters(f => ({ ...f, lowStockOnly: e.target.checked }))} />
        } label="Low stock only" />
        <Box sx={{ flex: 1 }} />
        <Button startIcon={<UploadIcon />} component="label" variant="outlined">
          Import CSV
          <input hidden type="file" accept=".csv" onChange={onImport} />
        </Button>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={(e) => setAnchorExport(e.currentTarget)}>Export</Button>
        <Menu anchorEl={anchorExport} open={Boolean(anchorExport)} onClose={() => setAnchorExport(null)}>
          <MItem onClick={() => runExport('csv')}>CSV</MItem>
          <MItem onClick={() => runExport('xlsx')}>Excel (.xlsx)</MItem>
          <MItem onClick={() => runExport('pdf')}>PDF</MItem>
        </Menu>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowNew(true)}>Add Item</Button>
        <Button variant="outlined" onClick={() => onBulk('ARCHIVE')} disabled={!selection.length}>Archive Selected</Button>
        <Button variant="outlined" onClick={() => onBulk('UNARCHIVE')} disabled={!selection.length}>Unarchive Selected</Button>
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
          pageSizeOptions={[10, 20, 50]}
          pageSize={query.limit}
          onPaginationModelChange={(m) => setQuery({ ...query, page: m.page + 1, limit: m.pageSize })}
          sortingMode="server"
          onSortModelChange={(m) => {
            const s = m[0]; if (!s) return setQuery({ ...query, sortBy: 'updatedAt', sortDir: 'desc' });
            setQuery({ ...query, sortBy: s.field, sortDir: s.sort || 'asc' });
          }}
          checkboxSelection
          onRowSelectionModelChange={(s) => setSelection(s)}
          disableRowSelectionOnClick
        />
      </div>

      {showNew && <ItemModal open={showNew} onClose={() => setShowNew(false)} meta={meta} onSaved={() => setQuery({ ...query })} />}
      {editRow && <ItemModal open={!!editRow} onClose={() => setEditRow(null)} meta={meta} item={editRow} onSaved={() => setQuery({ ...query })} />}

      {issueOpen && <TxnDialog type="ISSUE" item={issueOpen} onClose={() => setIssueOpen(null)} onDone={() => setQuery({ ...query })} />}
      {receiveOpen && <TxnDialog type="RECEIVE" item={receiveOpen} onClose={() => setReceiveOpen(null)} onDone={() => setQuery({ ...query })} />}
      {adjustOpen && <TxnDialog type="ADJUST" item={adjustOpen} onClose={() => setAdjustOpen(null)} onDone={() => setQuery({ ...query })} />}
    </div>
  );
}

/* ---------- Item Modal ---------- */
function ItemModal({ open, onClose, onSaved, meta, item }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    name: item?.name || '', sku: item?.sku || '', category: item?.category || '',
    unit: item?.unit || 'pcs', stock: item?.stock || 0, lowStockThreshold: item?.threshold || item?.lowStockThreshold || 0,
    location: item?.location || '', status: item?.status || 'ACTIVE', supplierId: item?.supplierId || '', notes: item?.notes || '',
    image: null
  });
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'image') { if (v) fd.append('image', v); return; }
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      if (isEdit) await updateItem(item.id, fd); else await createItem(fd);
      onClose(); onSaved?.();
    } catch (e) { setError(e?.response?.data?.message || 'Failed to save'); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Item' : 'New Item'}</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" className="mb-3">{error}</Alert>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TextField label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <TextField label="SKU" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} />
          <TextField label="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
          <TextField select label="Unit" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
            {meta.units.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
          </TextField>
          <TextField type="number" label="Stock" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} />
          <TextField type="number" label="Low stock threshold" value={form.lowStockThreshold} onChange={e => setForm(f => ({ ...f, lowStockThreshold: Number(e.target.value) }))} />
          <TextField label="Location" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
          <TextField select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
            {['ACTIVE', 'ARCHIVED'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField select label="Supplier" value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))}>
            <MenuItem value="">None</MenuItem>
            {meta.suppliers.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
          <Button component="label" variant="outlined">Upload Image
            <input hidden type="file" accept="image/*" onChange={(e) => setForm(f => ({ ...f, image: e.target.files?.[0] || null }))} />
          </Button>
          <TextField className="md:col-span-2" multiline minRows={3} label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit}>{isEdit ? 'Save' : 'Create'}</Button>
      </DialogActions>
    </Dialog>
  );
}

/* ---------- Stock Txn Dialog ---------- */
function TxnDialog({ type, item, onClose, onDone }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  const action = async () => {
    try {
      if (type === 'ISSUE') await issueStock(item.id, { qty, note });
      if (type === 'RECEIVE') await receiveStock(item.id, { qty, note });
      if (type === 'ADJUST') await adjustStock(item.id, { qty, note });
      if (type === 'RETURN') await returnStock(item.id, { qty, note });
      if (type === 'DISPOSE') await disposeStock(item.id, { qty, note });
      onClose(); onDone?.();
    } catch (e) { setErr(e?.response?.data?.message || 'Operation failed'); }
  };

  const title = { ISSUE: 'Issue Stock', RECEIVE: 'Receive Stock', ADJUST: 'Adjust Stock', RETURN: 'Return Stock', DISPOSE: 'Dispose Stock' }[type];

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{title} — {item.name}</DialogTitle>
      <DialogContent dividers>
        {err && <Alert severity="error" className="mb-3">{err}</Alert>}
        <div className="grid grid-cols-1 gap-3">
          <TextField type="number" label="Quantity" value={qty} onChange={(e) => setQty(Number(e.target.value))} />
          <TextField label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div className="text-sm text-gray-600">Current stock: <b>{item.stock}</b> • Issued: <b>{item.issued}</b></div>
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={action}>Confirm</Button>
      </DialogActions>
    </Dialog>
  );
}
