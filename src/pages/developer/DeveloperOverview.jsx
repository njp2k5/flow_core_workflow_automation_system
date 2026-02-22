import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GitCommit, Users, BarChart3, Star, GitFork, Bug, ListTodo,
  CheckCircle2, Clock, TrendingUp, AlertTriangle, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, StatCard, SectionHeader, Spinner } from '../../components/Card';
import { github, tasks as tasksApi, subscribeDashboardStream } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import '../manager/Manager.css';
import './Developer.css';

const MOCK_MY_TASKS = [
  { id: 1, title: 'Implement commit detail modal', status: 'in-progress', priority: 'high', due: '2026-02-24', assignedBy: 'Alex Morgan' },
  { id: 2, title: 'Write unit tests for API service', status: 'todo', priority: 'medium', due: '2026-02-25', assignedBy: 'Alex Morgan' },
  { id: 3, title: 'Fix SSE reconnection logic', status: 'in-progress', priority: 'high', due: '2026-02-23', assignedBy: 'Alex Morgan' },
  { id: 4, title: 'Update developer documentation', status: 'todo', priority: 'low', due: '2026-02-27', assignedBy: 'Alex Morgan' },
  { id: 5, title: 'Refactor auth context', status: 'done', priority: 'medium', due: '2026-02-20', assignedBy: 'Alex Morgan' },
];

const MOCK_MY_STATS = {
  commitsThisWeek: 12,
  prsOpen: 2,
  tasksCompleted: 8,
  tasksInProgress: 3,
};

const MOCK_ACTIVITY = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  commits: Math.floor(Math.random() * 15) + 2,
}));

const MOCK_PROGRESS = {
  summary: 'Good progress this week. You completed 8 tasks and contributed 12 commits. Your focus areas were the commit history UI and SSE integration.',
  highlights: [
    'Auth context refactoring merged',
    '12 commits this week (above team average)',
    '2 PRs awaiting review',
  ],
  risks: [
    'SSE reconnection bug needs fix before release',
    'Unit test coverage for API service at 45%',
  ],
};

export default function DeveloperOverview() {
  const { user } = useAuth();
  const [myTasks, setMyTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [tasksData, actData] = await Promise.all([
          tasksApi.getMyTasks(),
          github.getCommitActivity(),
        ]);
        setMyTasks(Array.isArray(tasksData) ? tasksData : []);
        setActivity(Array.isArray(actData) ? actData : []);
        setStats(MOCK_MY_STATS);
      } catch {
        setMyTasks(MOCK_MY_TASKS);
        setActivity(MOCK_ACTIVITY);
        setStats(MOCK_MY_STATS);
      } finally {
        setLoading(false);
      }

      try {
        const report = await github.getProgressReport();
        setProgress(report);
      } catch {
        setProgress(MOCK_PROGRESS);
      } finally {
        setProgressLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Spinner text="Loading your dashboard…" />;

  const activeTasks = myTasks.filter((t) => t.status !== 'done');
  const doneTasks = myTasks.filter((t) => t.status === 'done');

  return (
    <div className="manager-overview">
      {/* Personalized header */}
      <motion.div
        className="page-header dev-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="dev-greeting">
          <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-sub">Here's your personalized summary for today</p>
        </div>
      </motion.div>

      {/* Personal stats */}
      <div className="stat-grid">
        <StatCard icon={GitCommit} label="Commits This Week" value={stats?.commitsThisWeek} color="#6366f1" delay={0.05} />
        <StatCard icon={ListTodo} label="Tasks In Progress" value={stats?.tasksInProgress} color="#f59e0b" delay={0.1} />
        <StatCard icon={CheckCircle2} label="Tasks Completed" value={stats?.tasksCompleted} color="#10b981" delay={0.15} />
        <StatCard icon={TrendingUp} label="Open PRs" value={stats?.prsOpen} color="#06b6d4" delay={0.2} />
      </div>

      {/* Main grid: My tasks + AI summary */}
      <div className="overview-grid">
        {/* Active tasks */}
        <Card className="my-work-card" delay={0.25}>
          <SectionHeader title="My Current Tasks">
            <span className="task-count">{activeTasks.length} active</span>
          </SectionHeader>
          <div className="my-tasks-list">
            {activeTasks.length === 0 ? (
              <div className="empty-state"><p>No active tasks 🎉</p></div>
            ) : (
              activeTasks.map((t, i) => (
                <motion.div
                  key={t.id}
                  className="task-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <div className={`task-status-dot ${t.status}`} />
                  <div className="task-content">
                    <span className="task-title">{t.title}</span>
                    <span className="task-detail">
                      Due {new Date(t.due).toLocaleDateString()} · by {t.assignedBy}
                    </span>
                  </div>
                  <span className={`task-priority ${t.priority}`}>{t.priority}</span>
                </motion.div>
              ))
            )}
          </div>
        </Card>

        {/* AI summary */}
        <Card className="progress-card" delay={0.3}>
          <SectionHeader title="Your AI Summary">
            <Zap size={16} style={{ color: '#f59e0b' }} />
          </SectionHeader>
          {progressLoading ? (
            <Spinner text="Generating your summary…" />
          ) : progress ? (
            <div className="progress-content">
              <p className="progress-summary">{progress.summary}</p>
              {progress.highlights?.length > 0 && (
                <div className="progress-section">
                  <h4><CheckCircle2 size={14} /> Highlights</h4>
                  <ul>
                    {progress.highlights.map((h, i) => <li key={i}>{h}</li>)}
                  </ul>
                </div>
              )}
              {progress.risks?.length > 0 && (
                <div className="progress-section risks">
                  <h4><AlertTriangle size={14} /> Attention Needed</h4>
                  <ul>
                    {progress.risks.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </Card>
      </div>

      {/* My commit activity */}
      <Card delay={0.35}>
        <SectionHeader title="My Commit Activity" />
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={activity}>
              <defs>
                <linearGradient id="devCommitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
              />
              <Area type="monotone" dataKey="commits" stroke="#06b6d4" strokeWidth={2} fill="url(#devCommitGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Completed tasks */}
      {doneTasks.length > 0 && (
        <Card delay={0.4}>
          <SectionHeader title="Recently Completed" />
          <div className="my-tasks-list">
            {doneTasks.map((t, i) => (
              <motion.div
                key={t.id}
                className="task-item done"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 + i * 0.05 }}
              >
                <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                <div className="task-content">
                  <span className="task-title">{t.title}</span>
                  <span className="task-detail">Completed</span>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
