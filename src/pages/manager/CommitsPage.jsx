import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCommit, Clock, Search, Filter } from 'lucide-react';
import { Card, SectionHeader, Spinner, EmptyState } from '../../components/Card';
import { github } from '../../services/api';
import './Manager.css';

const MOCK_COMMITS = [
  { sha: 'a1b2c3d4e5f6', message: 'feat: add task assignment via NL', author: { login: 'Sam Rivera' }, commit: { author: { date: '2026-02-22T10:30:00Z' } } },
  { sha: 'e4f5g6h7i8j9', message: 'fix: resolve auth token refresh bug', author: { login: 'Jordan Lee' }, commit: { author: { date: '2026-02-21T16:20:00Z' } } },
  { sha: 'i7j8k9l0m1n2', message: 'chore: update dependencies', author: { login: 'Alex Morgan' }, commit: { author: { date: '2026-02-21T09:15:00Z' } } },
  { sha: 'm0n1o2p3q4r5', message: 'feat: meeting summary generation', author: { login: 'Casey Kim' }, commit: { author: { date: '2026-02-20T14:45:00Z' } } },
  { sha: 'q3r4s5t6u7v8', message: 'docs: update API documentation', author: { login: 'Sam Rivera' }, commit: { author: { date: '2026-02-20T11:00:00Z' } } },
  { sha: 'w9x0y1z2a3b4', message: 'feat: progress tracking dashboard', author: { login: 'Jordan Lee' }, commit: { author: { date: '2026-02-19T15:30:00Z' } } },
  { sha: 'c5d6e7f8g9h0', message: 'refactor: clean up API service layer', author: { login: 'Casey Kim' }, commit: { author: { date: '2026-02-19T10:00:00Z' } } },
  { sha: 'i1j2k3l4m5n6', message: 'test: add unit tests for auth module', author: { login: 'Alex Morgan' }, commit: { author: { date: '2026-02-18T14:00:00Z' } } },
];

export default function CommitsPage() {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [commitDetail, setCommitDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await github.getCommits('main', 14, 50);
        setCommits(Array.isArray(data) ? data : []);
      } catch {
        setCommits(MOCK_COMMITS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = commits.filter((c) => {
    const msg = (c.message || c.commit?.message || '').toLowerCase();
    const author = (c.author?.login || c.author || c.commit?.author?.name || '').toLowerCase();
    return msg.includes(search.toLowerCase()) || author.includes(search.toLowerCase());
  });

  const handleCommitClick = async (sha) => {
    if (selectedCommit === sha) {
      setSelectedCommit(null);
      setCommitDetail(null);
      return;
    }
    setSelectedCommit(sha);
    setDetailLoading(true);
    try {
      const detail = await github.getCommit(sha);
      setCommitDetail(detail);
    } catch {
      setCommitDetail({
        sha,
        files: [
          { filename: 'src/services/api.js', status: 'modified', additions: 12, deletions: 3 },
          { filename: 'src/pages/Login.jsx', status: 'modified', additions: 5, deletions: 2 },
        ],
      });
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading) return <Spinner text="Loading commits…" />;

  return (
    <div className="manager-overview">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Commit History</h1>
        <p className="page-sub">Browse recent commits from the repository</p>
      </motion.div>

      <Card delay={0.1}>
        <div className="search-bar">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search commits by message or author…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={GitCommit} message="No commits found" />
        ) : (
          <div className="commits-list">
            {filtered.map((c, i) => {
              const sha = c.sha || '';
              const msg = c.message || c.commit?.message || '';
              const author = c.author?.login || c.author || c.commit?.author?.name || '';
              const date = c.date || c.commit?.author?.date || '';

              return (
                <div key={sha}>
                  <motion.div
                    className={`commit-row clickable ${selectedCommit === sha ? 'selected' : ''}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.03 }}
                    onClick={() => handleCommitClick(sha)}
                  >
                    <GitCommit size={16} className="commit-icon" />
                    <div className="commit-info">
                      <span className="commit-msg">{msg}</span>
                      <span className="commit-meta">
                        <span className="commit-author">{author}</span>
                        <Clock size={12} />
                        {new Date(date).toLocaleDateString()}
                      </span>
                    </div>
                    <code className="commit-sha">{sha.slice(0, 7)}</code>
                  </motion.div>

                  <AnimatePresence>
                    {selectedCommit === sha && (
                      <motion.div
                        className="commit-detail"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        {detailLoading ? (
                          <Spinner size={18} text="Loading details…" />
                        ) : commitDetail?.files ? (
                          <div className="commit-files">
                            <span className="commit-files-title">Files changed:</span>
                            {commitDetail.files.map((f) => (
                              <div key={f.filename} className="commit-file">
                                <span className={`file-status ${f.status}`}>{f.status}</span>
                                <span className="file-name">{f.filename}</span>
                                <span className="file-changes">
                                  <span className="additions">+{f.additions}</span>
                                  <span className="deletions">-{f.deletions}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
