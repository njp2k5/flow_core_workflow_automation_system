import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Shield } from 'lucide-react';
import { Card, SectionHeader, Spinner, EmptyState } from '../../components/Card';
import { github } from '../../services/api';
import './Manager.css';

export default function BranchesPage() {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await github.getBranches();
        setBranches(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load branches:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="manager-overview">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Branches</h1>
        <p className="page-sub">Repository branches and protection status</p>
      </motion.div>

      <Card delay={0.1}>
        <SectionHeader title={`${branches.length} Branches`} />
        {loading && branches.length === 0 ? (
          <Spinner text="Loading branches…" />
        ) : branches.length === 0 ? (
          <EmptyState icon={GitBranch} message="No branches found" />
        ) : (
          <div className="branch-list">
            {branches.map((b, i) => (
              <motion.div
                key={b.name}
                className="branch-row"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.04 }}
              >
                <GitBranch size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <span className="branch-name">{b.name}</span>
                {b.protected && (
                  <span className="branch-badge protected">
                    <Shield size={11} /> Protected
                  </span>
                )}
                {b.name === 'main' && (
                  <span className="branch-badge default">Default</span>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
