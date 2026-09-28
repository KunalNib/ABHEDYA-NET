import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PermissionProvider } from './context/PermissionContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { ThemeProvider } from './context/ThemeContext';

import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { LoginPage } from './components/pages/LoginPage';
import { ForgotPasswordPage } from './components/pages/ForgotPasswordPage';
import { UnauthorizedPage } from './components/pages/UnauthorizedPage';

import { DashboardPage } from './components/pages/DashboardPage';
import { NetworkPage } from './components/pages/NetworkPage';
import { AIPredictionsPage } from './components/pages/AIPredictionsPage';
import { AttackPathPage } from './components/pages/AttackPathPage';
import { DefencePage } from './components/pages/DefencePage';
import { DeceptionPage } from './components/pages/DeceptionPage';
import { TelemetryPage } from './components/pages/TelemetryPage';
import { ReportsPage } from './components/pages/ReportsPage';
import { AdminUsersPage } from './components/pages/AdminUsersPage';
import { AdminAuditPage } from './components/pages/AdminAuditPage';
import { SettingsPage } from './components/pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <PermissionProvider>
            <RealtimeProvider>
              <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />

              {/* Protected Application Routes inside Persistent AppShell */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <AppShell>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/network" element={<NetworkPage />} />
                        <Route path="/ai" element={<AIPredictionsPage />} />
                        <Route path="/attack-path" element={<AttackPathPage />} />
                        <Route path="/defence" element={<DefencePage />} />
                        <Route path="/deception" element={<DeceptionPage />} />
                        <Route path="/telemetry" element={<TelemetryPage />} />
                        <Route path="/reports" element={<ReportsPage />} />

                        {/* Legacy Route Redirects */}
                        <Route path="/ai-world-model" element={<Navigate to="/ai" replace />} />
                        <Route path="/objectives" element={<Navigate to="/ai" replace />} />
                        <Route path="/load-balancer" element={<Navigate to="/network" replace />} />
                        <Route path="/network-security" element={<Navigate to="/network" replace />} />
                        <Route path="/attack-paths" element={<Navigate to="/attack-path" replace />} />

                        {/* Role-Protected Admin Routes */}
                        <Route
                          path="/admin/users"
                          element={
                            <ProtectedRoute requiredPermission="manage_users">
                              <AdminUsersPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/audit"
                          element={
                            <ProtectedRoute requiredPermission="view_audit_logs">
                              <AdminAuditPage />
                            </ProtectedRoute>
                          }
                        />

                        <Route path="/settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                      </Routes>
                    </AppShell>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </RealtimeProvider>
        </PermissionProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
