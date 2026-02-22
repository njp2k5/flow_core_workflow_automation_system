import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  GitCommit,
  Users,
  ListTodo,
  FileText,
  LogOut,
  Workflow,
  BarChart3,
  GitPullRequest,
  GitBranch,
  Ticket,
  BookOpen,
  Rocket,
} from 'lucide-react';
import './Sidebar.css';

const managerLinks = [
  { to: '/manager', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/manager/commits', icon: GitCommit, label: 'Commits' },
  { to: '/manager/progress', icon: BarChart3, label: 'Progress' },
  { to: '/manager/tasks', icon: ListTodo, label: 'Assign Tasks' },
  { to: '/manager/team', icon: Users, label: 'Team' },
  { to: '/manager/pull-requests', icon: GitPullRequest, label: 'Pull Requests' },
  { to: '/manager/branches', icon: GitBranch, label: 'Branches' },
  { to: '/manager/meetings', icon: FileText, label: 'Meetings' },
  { to: '/manager/jira', icon: Ticket, label: 'Jira Board' },
  { to: '/manager/confluence', icon: BookOpen, label: 'Confluence' },
  { to: '/manager/get-started', icon: Rocket, label: 'Get Started' },
];

const developerLinks = [
  { to: '/developer', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/developer/my-work', icon: ListTodo, label: 'My Work' },
  { to: '/developer/commits', icon: GitCommit, label: 'Commits' },
  { to: '/developer/progress', icon: BarChart3, label: 'Progress' },
  { to: '/developer/team', icon: Users, label: 'Team' },
  { to: '/developer/pull-requests', icon: GitPullRequest, label: 'Pull Requests' },
  { to: '/developer/branches', icon: GitBranch, label: 'Branches' },
  { to: '/developer/meetings', icon: FileText, label: 'Meetings' },
  { to: '/developer/jira', icon: Ticket, label: 'Jira Board' },
  { to: '/developer/confluence', icon: BookOpen, label: 'Confluence' },
  { to: '/developer/get-started', icon: Rocket, label: 'Get Started' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'manager' ? managerLinks : developerLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <motion.aside
      className="sidebar"
      initial={{ x: -260 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 30 }}
    >
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <Workflow size={20} />
        </div>
        <span>WorkflowAI</span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-user">
          <img src={user?.avatar} alt="" className="sidebar-avatar" />
          <div className="sidebar-user-info">
            <span className="sidebar-name">{user?.name}</span>
            <span className="sidebar-role">{user?.role}</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
    </motion.aside>
  );
}
