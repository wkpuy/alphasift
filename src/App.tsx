import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Scanner from './pages/Scanner';
import RiskCalculator from './pages/RiskCalculator';
import Journal from './pages/Journal';
import Guide from './pages/Guide';
import Settings from './pages/Settings';
import Backtest from './pages/Backtest';

function App() {
  return (
    <>
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: {
            background: '#1e293b',
            color: '#fff',
            border: '1px solid #334155',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="scanner" element={<Scanner />} />
          <Route path="scanner/risk" element={<RiskCalculator />} />
          <Route path="journal" element={<Journal />} />
          <Route path="guide" element={<Guide />} />
          <Route path="settings" element={<Settings />} />
          <Route path="backtest" element={<Backtest />} />
        </Route>
      </Routes>
    </HashRouter>
    </>
  );
}

export default App;
