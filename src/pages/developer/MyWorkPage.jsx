import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ListTodo, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, SectionHeader, Spinner, EmptyState } from '../../components/Card';
import { tasks as tasksApi } from '../../services/api';
import '../manager/Manager.css';
import './Developer.css';

const MOCK_MY_TASKS = [
  { id: 1, title: 'Implement commit detail modal', status: 'in-progress', priority: 'high', due: '2026-02-24', assignedBy: 'Alex Morgan', description: 'Add a modal that shows file changes when clicking a commit row' },
  { id: 2, title: 'Write unit tests for API service', status: 'todo', priority: 'medium', due: '2026-02-25', assignedBy: 'Alex Morgan', description: 'Cover all API functions with unit tests' },
  { id: 3, title: 'Fix SSE reconnection logic', status: 'in-progress', priority: 'high', due: '2026-02-23', assignedBy: 'Alex Morgan', description: 'Handle SSE disconnects gracefully with exponential backoff' },
  { id: 4, title: 'Update developer documentation', status: 'todo', priority: 'low', due: '2026-02-27', assignedBy: 'Alex Morgan', description: 'Update API docs and add setup guide' },
  { id: 5, title: 'Refactor auth context', status: 'done', priority: 'medium', due: '2026-02-20', assignedBy: 'Alex Morgan', description: 'Clean up auth context and add token refresh' },
  { id: 6, title: 'Add loading states to dashboard', status: 'done', priority: 'low', due: '2026-02-19', assignedBy: 'Alex Morgan', description: 'Add skeleton loaders and spinners' },
];

export default function MyWorkPage() {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const data = await tasksApi.getMyTasks();
        setMyTasks(Array.isArray(data) ? data : []);
      } catch {
        setMyTasks(MOCK_MY_TASKS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = filter === 'all'
    ? myTasks
    : myTasks.filter((t) => t.status === filter);

  const counts = {
    all: myTasks.length,
    'in-progress': myTasks.filter((t) => t.status === 'in-progress').length,
    todo: myTasks.filter((t) => t.status === 'todo').length,
    done: myTasks.filter((t) => t.status === 'done').length,
  };

  if (loading) return <Spinner text="Loading your tasks…" />;

  return (
    <div className="manager-overview">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>My Work</h1>
        <p className="page-sub">Your assigned tasks and progress</p>
      </motion.div>

      {/* Quick stats */}
      <div className="work-stat-row">
        <div className="work-stat-mini">
          <span className="stat-value" style={{ color: '#f59e0b' }}>{counts['in-progress']}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="work-stat-mini">
          <span className="stat-value" style={{ color: 'var(--text-muted)' }}>{counts.todo}</span>
          <span className="stat-label">To Do</span>
        </div>
        <div className="work-stat-mini">
          <span className="stat-value" style={{ color: '#10b981' }}>{counts.done}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      <Card delay={0.1}>
        <SectionHeader title="Tasks">
          <div className="filter-tabs">
            {['all', 'in-progress', 'todo', 'done'].map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})
              </button>
            ))}
          </div>
        </SectionHeader>

        {filtered.length === 0 ? (
          <EmptyState icon={ListTodo} message="No tasks in this category" />
        ) : (
          <div className="my-tasks-list">
            {filtered.map((t, i) => (
              <motion.div
                key={t.id}
                className={`task-item ${t.status === 'done' ? 'done' : ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.05 }}
              >
                <div className={`task-status-dot ${t.status}`} />
                <div className="task-content">
                  <span className="task-title">{t.title}</span>
                  {t.description && <span className="task-detail">{t.description}</span>}
                  <span className="task-detail">
                    <Clock size={11} /> Due {new Date(t.due).toLocaleDateString()} · Assigned by {t.assignedBy}
                  </span>
                </div>
                <span className={`task-priority ${t.priority}`}>{t.priority}</span>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
