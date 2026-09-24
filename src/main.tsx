import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {StorageService} from './services/storage';
import {ThemeProvider} from './context/ThemeContext';
import {ErrorBoundary} from './components/ErrorBoundary';

StorageService.init();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>,
);


