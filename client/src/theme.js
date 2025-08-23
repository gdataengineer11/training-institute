// client/src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#7C3AED' },
    secondary: { main: '#06B6D4' }
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", system-ui, -apple-system, Segoe UI, Roboto, Arial'
  },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } }
  }
});

export default theme;
