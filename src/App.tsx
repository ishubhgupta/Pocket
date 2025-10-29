import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { VaultProvider } from './contexts/VaultContext';
import { SyncProvider } from './contexts/SyncContext';
import { SetupPage } from './pages/SetupPage';
import { UnlockPage } from './pages/UnlockPage';
import { DashboardPage } from './pages/DashboardPage';
import { CategoryListPage } from './pages/CategoryListPage';
import { AddRecordPage } from './pages/AddRecordPage';
import { EditRecordPage } from './pages/EditRecordPage';
import { RecordDetailPage } from './pages/RecordDetailPage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { DiagnosticPage } from './pages/DiagnosticPage';
import { SyncSettingsPage } from './pages/SyncSettingsPage';

const AppRoutes: React.FC = () => {
  const { isSetup, checkSetup } = useAuth();

  useEffect(() => {
    checkSetup();
  }, [checkSetup]);

  // Show loading state while checking setup
  if (isSetup === null) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show setup page if not set up
  if (isSetup === false) {
    return <SetupPage />;
  }

  return (
    <Routes>
      <Route path="/unlock" element={<UnlockPage />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/sync" element={<SyncSettingsPage />} />
      <Route path="/diagnostic" element={<DiagnosticPage />} />
      <Route path="/category/:type" element={<CategoryListPage />} />
      <Route path="/add/:type" element={<AddRecordPage />} />
      <Route path="/edit/:id" element={<EditRecordPage />} />
      <Route path="/record/:id" element={<RecordDetailPage />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SyncProvider>
          <VaultProvider>
            <AppRoutes />
          </VaultProvider>
        </SyncProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
