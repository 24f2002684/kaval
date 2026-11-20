import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SeerPage } from './pages/SeerPage';
import { VulnPage } from './pages/VulnPage';
import { DispatchPage } from './pages/DispatchPage';
import { CitizenPage } from './pages/CitizenPage';
import { ReplayPage } from './pages/ReplayPage';
import { TransparencyPage } from './pages/TransparencyPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public / Auth */}
          <Route path="/login" element={<LoginPage />} />

          {/* Citizen Dedicated Mobile View */}
          <Route path="/citizen" element={
            <div className="min-h-screen bg-slate-canvas p-4 sm:p-6 flex flex-col justify-between">
              <CitizenPage />
            </div>
          } />

          {/* Command Dashboard & Engines */}
          <Route path="/" element={<DashboardLayout><DashboardPage /></DashboardLayout>} />
          <Route path="/seer" element={<DashboardLayout><SeerPage /></DashboardLayout>} />
          <Route path="/vuln" element={<DashboardLayout><VulnPage /></DashboardLayout>} />
          <Route path="/dispatch" element={<DashboardLayout><DispatchPage /></DashboardLayout>} />
          <Route path="/replay" element={<DashboardLayout><ReplayPage /></DashboardLayout>} />
          <Route path="/transparency" element={<DashboardLayout><TransparencyPage /></DashboardLayout>} />
          <Route path="/settings" element={<DashboardLayout><SettingsPage /></DashboardLayout>} />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
