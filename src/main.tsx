import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {useAutoUpdate} from './hooks/useAutoUpdate';

function AppWithAutoUpdate() {
  useAutoUpdate();
  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppWithAutoUpdate />
  </StrictMode>,
);
