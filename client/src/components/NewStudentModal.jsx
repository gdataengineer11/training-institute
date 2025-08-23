import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Grid, TextField, MenuItem, Stepper, Step, StepLabel, Chip
} from '@mui/material';
import { createStudent } from '../lib/studentsApi';

const steps = ['Identity', 'Guardians', 'Program & Session', 'Fees', 'Notes/Tags'];

export default function NewStudentModal({ open, onClose, meta, onCreated }) {
  const [active, setActive] = useState(0);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName:'', lastName:'', email:'', phone:'', status:'APPLICANT',
    sessionId: meta.sessions?.[0]?.id || '', guardians: [], feePlan:{ listPrice: 1000, discount: 0, installments: [] },
    tags: [], notes:''
  });

  const set = (k,v)=> setForm(f=> ({ ...f, [k]: v }));

  const next = ()=> setActive(a=> Math.min(a+1, steps.length-1));
  const prev = ()=> setActive(a=> Math.max(a-1, 0));

  const addGuardian = ()=> set('guardians', [...form.guardians, { relation:'Parent', name:'', phone:'', email:'' }]);
  const addInstallment = ()=> set('feePlan', { ...form.feePlan, installments: [...(form.feePlan.installments||[]), { amount: 0, dueDate: new Date().toISOString().slice(0,10) }] });

  const submit = async ()=> {
    setSaving(true);
    try {
      const payload = { ...form, sessionId: Number(form.sessionId) };
      await createStudent(payload);
      onClose(); onCreated?.();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>New Student</DialogTitle>
      <DialogContent dividers>
        <Stepper activeStep={active} alternativeLabel sx={{ mb: 3 }}>
          {steps.map(s=> <Step key={s}><StepLabel>{s}</StepLabel></Step>)}
        </Stepper>

        {active===0 && (
          <Grid container spacing={2}>
            <Grid item xs={6}><TextField label="First name" fullWidth value={form.firstName} onChange={e=> set('firstName', e.target.value)} /></Grid>
            <Grid item xs={6}><TextField label="Last name" fullWidth value={form.lastName} onChange={e=> set('lastName', e.target.value)} /></Grid>
            <Grid item xs={6}><TextField label="Email" type="email" fullWidth value={form.email} onChange={e=> set('email', e.target.value)} /></Grid>
            <Grid item xs={6}><TextField label="Phone" fullWidth value={form.phone} onChange={e=> set('phone', e.target.value)} /></Grid>
          </Grid>
        )}

        {active===1 && (
          <>
            <Button onClick={addGuardian}>Add Guardian</Button>
            <Grid container spacing={2} sx={{ mt:1 }}>
              {form.guardians.map((g,idx)=> (
                <React.Fragment key={idx}>
                  <Grid item xs={3}><TextField label="Relation" fullWidth value={g.relation} onChange={e=>{
                    const x=[...form.guardians]; x[idx].relation=e.target.value; set('guardians', x); }} /></Grid>
                  <Grid item xs={3}><TextField label="Name" fullWidth value={g.name} onChange={e=>{
                    const x=[...form.guardians]; x[idx].name=e.target.value; set('guardians', x); }} /></Grid>
                  <Grid item xs={3}><TextField label="Phone" fullWidth value={g.phone} onChange={e=>{
                    const x=[...form.guardians]; x[idx].phone=e.target.value; set('guardians', x); }} /></Grid>
                  <Grid item xs={3}><TextField label="Email" fullWidth value={g.email} onChange={e=>{
                    const x=[...form.guardians]; x[idx].email=e.target.value; set('guardians', x); }} /></Grid>
                </React.Fragment>
              ))}
            </Grid>
          </>
        )}

        {active===2 && (
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField select label="Session" fullWidth value={form.sessionId} onChange={e=> set('sessionId', e.target.value)}>
                {meta.sessions?.map(s=> <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField select label="Status" fullWidth value={form.status} onChange={e=> set('status', e.target.value)}>
                {meta.statuses?.map(s=> <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        )}

        {active===3 && (
          <>
            <Grid container spacing={2}>
              <Grid item xs={4}><TextField type="number" label="List price" fullWidth value={form.feePlan.listPrice} onChange={e=> set('feePlan', { ...form.feePlan, listPrice: Number(e.target.value) })} /></Grid>
              <Grid item xs={4}><TextField type="number" label="Discount" fullWidth value={form.feePlan.discount} onChange={e=> set('feePlan', { ...form.feePlan, discount: Number(e.target.value) })} /></Grid>
              <Grid item xs={4}><TextField disabled label="Net payable" fullWidth value={(form.feePlan.listPrice - (form.feePlan.discount||0)).toFixed(2)} /></Grid>
            </Grid>
            <Button sx={{ mt: 2 }} onClick={addInstallment}>Add Installment</Button>
            <Grid container spacing={2} sx={{ mt:1 }}>
              {(form.feePlan.installments||[]).map((ins,idx)=> (
                <React.Fragment key={idx}>
                  <Grid item xs={6}><TextField type="date" label="Due date" InputLabelProps={{shrink:true}} fullWidth value={ins.dueDate} onChange={e=>{
                    const x=[...form.feePlan.installments]; x[idx].dueDate=e.target.value; set('feePlan', { ...form.feePlan, installments: x }); }} /></Grid>
                  <Grid item xs={6}><TextField type="number" label="Amount" fullWidth value={ins.amount} onChange={e=>{
                    const x=[...form.feePlan.installments]; x[idx].amount=Number(e.target.value); set('feePlan', { ...form.feePlan, installments: x }); }} /></Grid>
                </React.Fragment>
              ))}
            </Grid>
          </>
        )}

        {active===4 && (
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField label="Notes" fullWidth multiline minRows={3} value={form.notes} onChange={e=> set('notes', e.target.value)} /></Grid>
            <Grid item xs={12}>
              {form.tags.map((t,idx)=> <Chip key={idx} label={t} onDelete={()=> set('tags', form.tags.filter((_,i)=>i!==idx))} sx={{ mr: 1 }} />)}
              <TextField size="small" placeholder="Add tag & press Enter" onKeyDown={(e)=>{
                if (e.key==='Enter'){ e.preventDefault(); const v=e.currentTarget.value.trim(); if(v){ set('tags',[...form.tags,v]); e.currentTarget.value='';}}
              }}/>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {active>0 && <Button onClick={prev}>Back</Button>}
        {active<steps.length-1 ? <Button onClick={next}>Next</Button> : <Button variant="contained" onClick={submit} disabled={saving}>Create</Button>}
      </DialogActions>
    </Dialog>
  );
}
