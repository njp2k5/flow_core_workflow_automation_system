import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, SectionHeader, Spinner } from '../../components/Card';
import { github } from '../../services/api';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import './Manager.css';

export default function ProgressPage() {
  const [progress, setProgress] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [report, act] = await Promise.all([
          github.getProgressReport(),
          github.getCommitActivity(),
        ]);
        setProgress(report);
        setActivity(Array.isArray(act) ? act : []);
      } catch (err) {
        console.error('Failed to load progress data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="manager-overview">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Progress Tracking</h1>
        <p className="page-sub">AI-powered analysis of team performance and project health</p>
      </motion.div>

      <div className="overview-grid">
        <Card delay={0.1}>
          <SectionHeader title="Weekly Commit Activity" />
          {loading && activity.length === 0 ? <Spinner text="Loading activity…" /> : (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={activity}>
                <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
                />
                <Bar dataKey="commits" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          )}
        </Card>

        <Card delay={0.15}>
          <SectionHeader title="Trend Overview" />
          {loading && activity.length === 0 ? <Spinner text="Loading trends…" /> : (
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={activity}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="week" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
                />
                <Area type="monotone" dataKey="commits" stroke="#10b981" strokeWidth={2} fill="url(#trendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          )}
        </Card>
      </div>

      {loading && !progress ? (
        <Card delay={0.2}><Spinner text="Generating AI progress report…" /></Card>
      ) : progress && (
        <Card delay={0.2}>
          <SectionHeader title="AI Progress Report" />
          <div className="progress-content">
            <p className="progress-summary">{progress.summary}</p>

            {progress.highlights?.length > 0 && (
              <div className="progress-section">
                <h4><CheckCircle2 size={14} /> Highlights</h4>
                <ul>
                  {progress.highlights.map((h, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                    >
                      {h}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {progress.risks?.length > 0 && (
              <div className="progress-section risks">
                <h4><AlertTriangle size={14} /> Risks & Concerns</h4>
                <ul>
                  {progress.risks.map((r, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                    >
                      {r}
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
