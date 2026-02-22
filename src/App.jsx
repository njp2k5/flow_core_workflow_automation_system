import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicRoute, ProtectedRoute } from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Pages
import Login from './pages/Login';

// Manager pages
import ManagerOverview from './pages/manager/ManagerOverview';
import CommitsPage from './pages/manager/CommitsPage';
import ProgressPage from './pages/manager/ProgressPage';
import TaskAssignPage from './pages/manager/TaskAssignPage';
import TeamPage from './pages/manager/TeamPage';
import PullRequestsPage from './pages/manager/PullRequestsPage';
import BranchesPage from './pages/manager/BranchesPage';
import MeetingsPage from './pages/manager/MeetingsPage';

// Developer pages
import DeveloperOverview from './pages/developer/DeveloperOverview';
import MyWorkPage from './pages/developer/MyWorkPage';

import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />

          {/* Manager routes */}
          <Route
            element={
              <ProtectedRoute allowedRole="manager">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/manager" element={<ManagerOverview />} />
            <Route path="/manager/commits" element={<CommitsPage />} />
            <Route path="/manager/progress" element={<ProgressPage />} />
            <Route path="/manager/tasks" element={<TaskAssignPage />} />
            <Route path="/manager/team" element={<TeamPage />} />
            <Route path="/manager/pull-requests" element={<PullRequestsPage />} />
            <Route path="/manager/branches" element={<BranchesPage />} />
            <Route path="/manager/meetings" element={<MeetingsPage />} />
          </Route>

          {/* Developer routes */}
          <Route
            element={
              <ProtectedRoute allowedRole="developer">
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/developer" element={<DeveloperOverview />} />
            <Route path="/developer/my-work" element={<MyWorkPage />} />
            <Route path="/developer/commits" element={<CommitsPage />} />
            <Route path="/developer/progress" element={<ProgressPage />} />
            <Route path="/developer/team" element={<TeamPage />} />
            <Route path="/developer/pull-requests" element={<PullRequestsPage />} />
            <Route path="/developer/branches" element={<BranchesPage />} />
            <Route path="/developer/meetings" element={<MeetingsPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
