import { motion } from 'framer-motion';
import { Users, Crown } from 'lucide-react';
import { Card } from '../../components/Card';
import './Manager.css';

const TEAM_MEMBERS = [
  { name: 'Nikhil J Prasad', role: 'Manager', isManager: true },
  { name: 'S Govind Krishnan', role: 'Developer', isManager: false },
  { name: 'Kailas S S', role: 'Developer', isManager: false },
  { name: 'Mukundan V S', role: 'Developer', isManager: false },
];

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444'];

export default function TeamPage() {
  return (
    <div className="manager-overview">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Team Overview</h1>
        <p className="page-sub">Meet the team behind the project</p>
      </motion.div>

      <div className="team-grid">
        {TEAM_MEMBERS.map((m, i) => (
          <Card key={m.name} delay={0.1 + i * 0.06}>
            <div className="team-member-card">
              <div
                className="team-avatar-placeholder"
                style={{ background: COLORS[i % COLORS.length] }}
              >
                {getInitials(m.name)}
              </div>
              <div className="team-info">
                <span className="team-name">
                  {m.name}
                  {m.isManager && <Crown size={13} style={{ marginLeft: 6, color: '#f59e0b' }} />}
                </span>
                <span className="team-role-badge" data-manager={m.isManager}>
                  {m.role}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
