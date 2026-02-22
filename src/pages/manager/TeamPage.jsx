import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, GitCommit, BarChart3 } from 'lucide-react';
import { Card, SectionHeader, Spinner } from '../../components/Card';
import { github } from '../../services/api';
import './Manager.css';

export default function TeamPage() {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await github.getContributors();
        setContributors(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load team:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="manager-overview">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Team Overview</h1>
        <p className="page-sub">View contributors and their activity</p>
      </motion.div>

      {loading && contributors.length === 0 ? (
        <Card delay={0.1}><Spinner text="Loading team…" /></Card>
      ) : (
      <div className="team-grid">
        {contributors.map((c, i) => (
          <Card key={c.login} delay={0.1 + i * 0.06}>
            <div className="team-member-card">
              <img src={c.avatar_url} alt="" className="team-avatar" />
              <div className="team-info">
                <span className="team-name">{c.name || c.login}</span>
                <div className="team-stats">
                  <span className="team-stat">
                    <GitCommit size={12} /> {c.contributions} commits
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      )}
    </div>
  );
}
