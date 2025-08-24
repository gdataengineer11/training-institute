import React from 'react';
import { Alert, AlertTitle, Button } from '@mui/material';

export default class ErrorBoundary extends React.Component {
  constructor(props){ super(props); this.state = { hasError:false, error:null }; }
  static getDerivedStateFromError(error){ return { hasError:true, error }; }
  componentDidCatch(error, info){ console.error('[ErrorBoundary]', error, info); }
  render(){
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ padding: 16 }}>
        <Alert severity="error" variant="outlined">
          <AlertTitle>Something went wrong</AlertTitle>
          {String(this.state.error?.message || this.state.error)}
          <div style={{ marginTop: 8 }}>
            <Button variant="contained" onClick={() => location.reload()}>Reload</Button>
          </div>
        </Alert>
      </div>
    );
  }
}
