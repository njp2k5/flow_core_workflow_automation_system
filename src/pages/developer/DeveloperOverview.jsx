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
        // Derive stats from real data
        const inProgress = (Array.isArray(tasksData) ? tasksData : []).filter(t => t.status === 'in-progress').length;
        const completed = (Array.isArray(tasksData) ? tasksData : []).filter(t => t.status === 'done').length;
        setStats({ commitsThisWeek: (Array.isArray(actData) ? actData : []).reduce((s, w) => s + (w.commits || 0), 0), prsOpen: 0, tasksCompleted: completed, tasksInProgress: inProgress });
      } catch (err) {
        console.error('Failed to load developer data:', err);
      } finally {
        setLoading(false);
      }

      try {
        const report = await github.getProgressReport();
        setProgress(report);
      } catch (err) {
        console.error('Failed to load progress report:', err);
      } finally {
        setProgressLoading(false);
      }
    }
    load();
  }, []);

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
