import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  GitCommit,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  GitFork,
  Bug,
  RefreshCw,
  Ticket,
  CircleDot,
  CheckCircle,
  ListTodo,
} from 'lucide-react';
import { Card, StatCard, SectionHeader, Spinner } from '../../components/Card';
import { github, jira, tasks as tasksApi } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Manager.css';

const POLL_INTERVAL = 15_000; // 15 seconds

export default function ManagerOverview() {
  const [repo, setRepo] = useState(null);
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [activity, setActivity] = useState([]);
  const [jiraStats, setJiraStats] = useState(null);
  const [taskList, setTaskList] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  /* ── Fetch all live data (GitHub + Jira + DB tasks) ────────────── */
  const fetchData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);

    const results = await Promise.allSettled([
      github.getRepoInfo(),
      github.getCommits('main', 7, 10),
      github.getContributors(),
      github.getCommitActivity(),
      jira.getBoardSummary(),
      tasksApi.getAll(),
    ]);

    const [repoRes, commitsRes, contribRes, actRes, jiraRes, tasksRes] = results;

    if (repoRes.status === 'fulfilled')   setRepo(repoRes.value);
    if (commitsRes.status === 'fulfilled') setCommits(Array.isArray(commitsRes.value) ? commitsRes.value.slice(0, 5) : []);
    if (contribRes.status === 'fulfilled') setContributors(Array.isArray(contribRes.value) ? contribRes.value : []);
    if (actRes.status === 'fulfilled')     setActivity(Array.isArray(actRes.value) ? actRes.value : []);
    if (jiraRes.status === 'fulfilled')    setJiraStats(jiraRes.value);
    if (tasksRes.status === 'fulfilled')   setTaskList(Array.isArray(tasksRes.value) ? tasksRes.value : []);

    setLoading(false);
    setLastUpdated(new Date());
    if (manual) setRefreshing(false);
  }, []);

  /* ── Initial load + auto-poll every 15s ─────────────────────────── */
  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchData]);

  /* ── AI progress report (one-time, expensive) ───────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const report = await github.getProgressReport();
        setProgress(report);
      } catch (err) {
        console.error('Progress report failed:', err);
      } finally {
        setProgressLoading(false);
      }
    })();
  }, []);

  /* ── Derived Jira metrics ───────────────────────────────────────── */
  const jiraTotal      = jiraStats?.total ?? jiraStats?.total_issues ?? '—';
  const jiraInProgress = jiraStats?.in_progress ?? jiraStats?.inProgress ?? '—';
  const jiraDone       = jiraStats?.done ?? jiraStats?.completed ?? '—';

  return (
    <div className="manager-overview">
      {/* Page header with refresh controls */}
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="page-header-row">
          <div>
            <h1>Manager Dashboard</h1>
            <p className="page-sub">Live overview of your team's progress and activity</p>
          </div>
          <div className="page-header-actions">
            {lastUpdated && (
              <span className="last-updated">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              className="refresh-btn"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              title="Refresh now"
            >
              <RefreshCw size={16} className={refreshing ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* GitHub stat grid */}
      <div className="stat-grid">
        <StatCard icon={Star} label="Stars" value={repo?.stars ?? repo?.stargazers_count} color="#f59e0b" delay={0.05} />
        <StatCard icon={GitFork} label="Forks" value={repo?.forks ?? repo?.forks_count} color="#06b6d4" delay={0.1} />
        <StatCard icon={Bug} label="Open Issues" value={repo?.open_issues ?? repo?.open_issues_count} color="#ef4444" delay={0.15} />
        <StatCard icon={Users} label="Contributors" value={contributors.length} color="#10b981" delay={0.2} />
      </div>

      {/* Jira + Tasks stat grid */}
      <div className="stat-grid">
        <StatCard icon={Ticket} label="Jira Tickets" value={jiraTotal} color="#6366f1" delay={0.1} />
        <StatCard icon={CircleDot} label="In Progress" value={jiraInProgress} color="#f59e0b" delay={0.15} />
        <StatCard icon={CheckCircle} label="Jira Done" value={jiraDone} color="#10b981" delay={0.2} />
        <StatCard icon={ListTodo} label="DB Tasks" value={taskList.length || '—'} color="#8b5cf6" delay={0.25} />
      </div>

      {/* Main grid: Activity chart + AI Progress */}
      <div className="overview-grid">
        {/* Activity chart */}
        <Card className="chart-card" delay={0.25}>
          <SectionHeader title="Commit Activity" />
          {loading && activity.length === 0 ? <Spinner text="Loading activity…" /> : (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activity}>
                <defs>
                  <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
                  labelStyle={{ color: 'var(--text-secondary)' }}
                />
                <Area type="monotone" dataKey="commits" stroke="var(--accent)" strokeWidth={2} fill="url(#commitGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          )}
        </Card>

        {/* AI Progress report */}
        <Card className="progress-card" delay={0.3}>
          <SectionHeader title="AI Progress Report" />
          {progressLoading ? (
            <Spinner text="Generating AI report…" />
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
                  <h4><AlertTriangle size={14} /> Risks</h4>
                  <ul>
                    {progress.risks.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </Card>
      </div>

      {/* Recent commits */}
      <Card delay={0.35}>
        <SectionHeader title="Recent Commits" />
        {loading && commits.length === 0 ? <Spinner text="Loading commits…" /> : (
        <div className="commits-list">
          {commits.map((c, i) => (
            <motion.div
              key={c.sha}
              className="commit-row"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.05 }}
            >
              <GitCommit size={16} className="commit-icon" />
              <div className="commit-info">
                <span className="commit-msg">{c.message || c.commit?.message}</span>
                <span className="commit-meta">
                  <span className="commit-author">{c.author?.login || c.author || c.commit?.author?.name}</span>
                  <Clock size={12} />
                  {new Date(c.date || c.commit?.author?.date).toLocaleDateString()}
                </span>
              </div>
              <code className="commit-sha">{(c.sha || '').slice(0, 7)}</code>
            </motion.div>
          ))}
        </div>
        )}
      </Card>

      {/* Top contributors */}
      <Card delay={0.45}>
        <SectionHeader title="Top Contributors" />
        {loading && contributors.length === 0 ? <Spinner text="Loading contributors…" /> : (
        <div className="contributors-grid">
          {contributors.slice(0, 6).map((c, i) => (
            <motion.div
              key={c.login}
              className="contributor-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.06 }}
              whileHover={{ y: -3 }}
            >
              <img src={c.avatar_url} alt="" className="contributor-avatar" />
              <span className="contributor-name">{c.name || c.login}</span>
              <span className="contributor-commits">
                <BarChart3 size={12} /> {c.contributions} commits
              </span>
            </motion.div>
          ))}
        </div>
        )}
      </Card>
    </div>
  );
}
