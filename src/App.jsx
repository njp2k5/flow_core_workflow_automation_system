import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicRoute, ProtectedRoute } from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Pages
import Login from './pages/Login';

// Manager pages
import ManagerOverview from './pages/manager/ManagerOverview';
import ProgressPage from './pages/manager/ProgressPage';
import TaskAssignPage from './pages/manager/TaskAssignPage';
import TeamPage from './pages/manager/TeamPage';
import MeetingsPage from './pages/manager/MeetingsPage';
import JiraPage from './pages/manager/JiraPage';
import ConfluencePage from './pages/manager/ConfluencePage';
import GetStartedPage from './pages/manager/GetStartedPage';

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
            <Route path="/manager/progress" element={<ProgressPage />} />
            <Route path="/manager/tasks" element={<TaskAssignPage />} />
            <Route path="/manager/team" element={<TeamPage />} />
            <Route path="/manager/meetings" element={<MeetingsPage />} />
            <Route path="/manager/jira" element={<JiraPage />} />
            <Route path="/manager/confluence" element={<ConfluencePage />} />
            <Route path="/manager/get-started" element={<GetStartedPage />} />
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
            <Route path="/developer/progress" element={<ProgressPage />} />
            <Route path="/developer/team" element={<TeamPage />} />
            <Route path="/developer/meetings" element={<MeetingsPage />} />
            <Route path="/developer/jira" element={<JiraPage />} />
            <Route path="/developer/confluence" element={<ConfluencePage />} />
            <Route path="/developer/get-started" element={<GetStartedPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
