import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GitCommit,
  Users,
  BarChart3,
  GitPullRequest,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  GitFork,
  Bug,
} from 'lucide-react';
import { Card, StatCard, SectionHeader, Spinner } from '../../components/Card';
import { github, subscribeDashboardStream } from '../../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Manager.css';

// ── Mock data for when MCP server is unavailable ──────────────────────
const MOCK_REPO = {
  name: 'workflow-automation',
  language: 'Python',
  stars: 24,
  forks: 8,
  open_issues: 5,
  description: 'AI-powered workflow automation platform',
};

const MOCK_COMMITS = [
  { sha: 'a1b2c3d', message: 'feat: add task assignment via NL', author: 'Sam Rivera', date: '2026-02-22T10:30:00Z' },
  { sha: 'e4f5g6h', message: 'fix: resolve auth token refresh bug', author: 'Jordan Lee', date: '2026-02-21T16:20:00Z' },
  { sha: 'i7j8k9l', message: 'chore: update dependencies', author: 'Alex Morgan', date: '2026-02-21T09:15:00Z' },
  { sha: 'm0n1o2p', message: 'feat: meeting summary generation', author: 'Casey Kim', date: '2026-02-20T14:45:00Z' },
  { sha: 'q3r4s5t', message: 'docs: update API documentation', author: 'Sam Rivera', date: '2026-02-20T11:00:00Z' },
];

const MOCK_CONTRIBUTORS = [
  { login: 'samrivera', name: 'Sam Rivera', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=SR&backgroundColor=06b6d4', contributions: 47 },
  { login: 'jordanlee', name: 'Jordan Lee', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=JL&backgroundColor=10b981', contributions: 35 },
  { login: 'caseykim', name: 'Casey Kim', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=CK&backgroundColor=f59e0b', contributions: 28 },
  { login: 'alexmorgan', name: 'Alex Morgan', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=AM&backgroundColor=6366f1', contributions: 22 },
];

const MOCK_ACTIVITY = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  commits: Math.floor(Math.random() * 30) + 5,
}));

const MOCK_PROGRESS = {
  summary: 'The team has made strong progress this week with 15 commits across 4 contributors. Key highlights include the new NL task assignment feature and critical auth bug fixes.',
  highlights: [
    'Natural language task assignment feature completed',
    'Authentication token refresh bug resolved',
    'Meeting summary generation pipeline deployed',
  ],
  risks: [
    '5 open issues need triage',
    'Test coverage dropped to 72%',
  ],
};

export default function ManagerOverview() {
  const [repo, setRepo] = useState(null);
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [activity, setActivity] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progressLoading, setProgressLoading] = useState(true);

  useEffect(() => {
    let unsub;

    async function load() {
      try {
        const [repoData, commitsData, contribData, actData] = await Promise.all([
          github.getRepoInfo(),
          github.getCommits(),
          github.getContributors(),
          github.getCommitActivity(),
        ]);
        setRepo(repoData);
        setCommits(Array.isArray(commitsData) ? commitsData.slice(0, 5) : []);
        setContributors(Array.isArray(contribData) ? contribData : []);
        setActivity(Array.isArray(actData) ? actData : []);

        // SSE for live updates
        unsub = subscribeDashboardStream((type, data) => {
          if (type === 'commits') setCommits(Array.isArray(data) ? data.slice(0, 5) : []);
          if (type === 'contributors') setContributors(Array.isArray(data) ? data : []);
          if (type === 'repo_info') setRepo(data);
        });
      } catch {
        // Use mock data
        setRepo(MOCK_REPO);
        setCommits(MOCK_COMMITS);
        setContributors(MOCK_CONTRIBUTORS);
        setActivity(MOCK_ACTIVITY);
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
    return () => unsub?.();
  }, []);

  if (loading) return <Spinner text="Loading dashboard…" />;

  return (
    <div className="manager-overview">
      {/* Page header */}
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Manager Dashboard</h1>
        <p className="page-sub">Overview of your team's progress and activity</p>
      </motion.div>

      {/* Stat grid */}
      <div className="stat-grid">
        <StatCard icon={Star} label="Stars" value={repo?.stars ?? repo?.stargazers_count} color="#f59e0b" delay={0.05} />
        <StatCard icon={GitFork} label="Forks" value={repo?.forks ?? repo?.forks_count} color="#06b6d4" delay={0.1} />
        <StatCard icon={Bug} label="Open Issues" value={repo?.open_issues ?? repo?.open_issues_count} color="#ef4444" delay={0.15} />
        <StatCard icon={Users} label="Contributors" value={contributors.length} color="#10b981" delay={0.2} />
      </div>

      {/* Main grid: Activity chart + AI Progress */}
      <div className="overview-grid">
        {/* Activity chart */}
        <Card className="chart-card" delay={0.25}>
          <SectionHeader title="Commit Activity" />
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
      </Card>

      {/* Top contributors */}
      <Card delay={0.45}>
        <SectionHeader title="Top Contributors" />
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
      </Card>
    </div>
  );
}
