import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCommit, Clock, Search, Filter } from 'lucide-react';
import { Card, SectionHeader, Spinner, EmptyState } from '../../components/Card';
import { github } from '../../services/api';
import './Manager.css';

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
      } catch (err) {
        console.error('Failed to load commits:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
    } catch (err) {
      console.error('Failed to load commit detail:', err);
      setCommitDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = commits.filter((c) => {
    const msg = (c.message || c.commit?.message || '').toLowerCase();
    const author = (c.author?.login || c.author || c.commit?.author?.name || '').toLowerCase();
    return msg.includes(search.toLowerCase()) || author.includes(search.toLowerCase());
  });

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

        {loading && commits.length === 0 ? (
          <Spinner text="Loading commits…" />
        ) : filtered.length === 0 ? (
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
