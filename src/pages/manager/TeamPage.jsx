import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, GitCommit, BarChart3 } from 'lucide-react';
import { Card, SectionHeader, Spinner } from '../../components/Card';
import { github } from '../../services/api';
import './Manager.css';

const MOCK_CONTRIBUTORS = [
  { login: 'samrivera', name: 'Sam Rivera', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=SR&backgroundColor=06b6d4', contributions: 47 },
  { login: 'jordanlee', name: 'Jordan Lee', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=JL&backgroundColor=10b981', contributions: 35 },
  { login: 'caseykim', name: 'Casey Kim', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=CK&backgroundColor=f59e0b', contributions: 28 },
  { login: 'alexmorgan', name: 'Alex Morgan', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=AM&backgroundColor=6366f1', contributions: 22 },
  { login: 'taylorchen', name: 'Taylor Chen', avatar_url: 'https://api.dicebear.com/7.x/initials/svg?seed=TC&backgroundColor=ef4444', contributions: 18 },
];

export default function TeamPage() {
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await github.getContributors();
        setContributors(Array.isArray(data) ? data : []);
      } catch {
        setContributors(MOCK_CONTRIBUTORS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Spinner text="Loading team…" />;

  return (
    <div className="manager-overview">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Team Overview</h1>
        <p className="page-sub">View contributors and their activity</p>
      </motion.div>

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
    </div>
  );
}
