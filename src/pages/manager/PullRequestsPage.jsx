import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitPullRequest, Clock } from 'lucide-react';
import { Card, SectionHeader, Spinner, EmptyState } from '../../components/Card';
import { github } from '../../services/api';
import './Manager.css';

const MOCK_PRS = [
  { number: 42, title: 'feat: natural language task assignment', state: 'open', user: { login: 'samrivera' }, created_at: '2026-02-22T08:00:00Z', merged_at: null },
  { number: 41, title: 'fix: auth token refresh on expired sessions', state: 'closed', user: { login: 'jordanlee' }, created_at: '2026-02-21T12:00:00Z', merged_at: '2026-02-21T18:00:00Z' },
  { number: 40, title: 'feat: meeting summary AI pipeline', state: 'closed', user: { login: 'caseykim' }, created_at: '2026-02-20T09:00:00Z', merged_at: '2026-02-20T16:00:00Z' },
  { number: 39, title: 'chore: upgrade React to v19', state: 'open', user: { login: 'alexmorgan' }, created_at: '2026-02-19T14:00:00Z', merged_at: null },
  { number: 38, title: 'docs: comprehensive API docs', state: 'closed', user: { login: 'samrivera' }, created_at: '2026-02-18T11:00:00Z', merged_at: '2026-02-19T10:00:00Z' },
];

export default function PullRequestsPage() {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const data = await github.getPullRequests();
        setPrs(Array.isArray(data) ? data : []);
      } catch {
        setPrs(MOCK_PRS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = filter === 'all' ? prs : prs.filter((pr) => {
    if (filter === 'merged') return pr.merged_at;
    if (filter === 'open') return pr.state === 'open';
    if (filter === 'closed') return pr.state === 'closed' && !pr.merged_at;
    return true;
  });

  if (loading) return <Spinner text="Loading pull requests…" />;

  return (
    <div className="manager-overview">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Pull Requests</h1>
        <p className="page-sub">Track open, merged, and closed pull requests</p>
      </motion.div>

      <Card delay={0.1}>
        <SectionHeader title="Pull Requests">
          <div className="filter-tabs">
            {['all', 'open', 'merged', 'closed'].map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </SectionHeader>

        {filtered.length === 0 ? (
          <EmptyState icon={GitPullRequest} message="No pull requests found" />
        ) : (
          <div className="pr-list">
            {filtered.map((pr, i) => {
              const prState = pr.merged_at ? 'merged' : pr.state;
              return (
                <motion.div
                  key={pr.number}
                  className="pr-row"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + i * 0.04 }}
                >
                  <GitPullRequest size={16} style={{ color: prState === 'open' ? '#10b981' : prState === 'merged' ? '#8b5cf6' : '#f87171', flexShrink: 0 }} />
                  <div className="pr-info">
                    <span className="pr-title">#{pr.number} {pr.title}</span>
                    <span className="pr-meta">
                      by {pr.user?.login} · <Clock size={11} /> {new Date(pr.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`pr-state ${prState}`}>{prState}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
