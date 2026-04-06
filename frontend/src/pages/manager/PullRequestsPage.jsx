import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitPullRequest, Clock } from 'lucide-react';
import { Card, SectionHeader, Spinner, EmptyState } from '../../components/Card';
import { github } from '../../services/api';
import './Manager.css';

export default function PullRequestsPage() {
  const [prs, setPrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const data = await github.getPullRequests();
        setPrs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load pull requests:', err);
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

        {loading && prs.length === 0 ? (
          <Spinner text="Loading pull requests…" />
        ) : filtered.length === 0 ? (
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
