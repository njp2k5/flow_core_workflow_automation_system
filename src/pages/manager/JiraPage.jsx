import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Ticket,
  Users,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from 'lucide-react';
import { Card, StatCard, SectionHeader, Spinner, EmptyState } from '../../components/Card';
import { jira } from '../../services/api';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
} from 'recharts';
import './Jira.css';

const STATUS_COLORS = {
  'To Do':       '#64748b',
  'In Progress': '#f59e0b',
  'In Review':   '#8b5cf6',
  'Done':        '#10b981',
};

const PRIORITY_COLORS = {
  Highest: '#ef4444',
  High:    '#f87171',
  Medium:  '#f59e0b',
  Low:     '#10b981',
  Lowest:  '#06b6d4',
  None:    '#64748b',
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function JiraPage() {
  const [project, setProject]     = useState(null);
  const [summary, setSummary]     = useState(null);
  const [tickets, setTickets]     = useState([]);
  const [sprints, setSprints]     = useState([]);
  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);

  // ticket filters
  const [statusFilter, setStatusFilter]     = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [searchQuery, setSearchQuery]       = useState('');
  const [expandedTicket, setExpandedTicket] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [proj, sum, tix, spr, usr] = await Promise.all([
          jira.getProject(),
          jira.getBoardSummary(),
          jira.getTickets(),
          jira.getSprints(),
          jira.getUsers(),
        ]);
        setProject(proj);
        setSummary(sum);
        setTickets(Array.isArray(tix) ? tix : []);
        setSprints(Array.isArray(spr) ? spr : []);
        setUsers(Array.isArray(usr) ? usr : []);
      } catch (err) {
        console.error('Failed to load Jira data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── Derived data for charts ───────────────────────────────────────
  const statusData = summary?.by_status
    ? Object.entries(summary.by_status).map(([name, value]) => ({ name, value }))
    : [];
  const assigneeData = summary?.by_assignee
    ? Object.entries(summary.by_assignee).map(([name, value]) => ({ name, value }))
    : [];
  const priorityData = summary?.by_priority
    ? Object.entries(summary.by_priority).map(([name, value]) => ({ name, value }))
    : [];

  // ── Filtered tickets ──────────────────────────────────────────────
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (assigneeFilter !== 'all' && (t.assignee || 'Unassigned') !== assigneeFilter) return false;
    if (searchQuery && !t.summary?.toLowerCase().includes(searchQuery.toLowerCase()) && !t.key?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const activeSprint = sprints.find((s) => s.state === 'active');

  return (
    <div className="manager-overview">
      {/* Page header */}
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="jira-header-row">
          <div>
            <h1>Jira Board</h1>
            <p className="page-sub">
              {project ? (
                <>
                  {project.name} &middot; <code className="project-key">{project.key}</code> &middot; Lead: {project.lead}
                </>
              ) : 'Project board overview and ticket management'}
            </p>
          </div>
          {project?.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer" className="jira-external-link">
              Open in Jira <ExternalLink size={14} />
            </a>
          )}
        </div>
      </motion.div>

      {/* Stat grid */}
      {loading && !summary ? (
        <Card delay={0.05}><Spinner text="Loading Jira data…" /></Card>
      ) : (
      <>
      <div className="stat-grid">
        <StatCard icon={Ticket} label="Total Tickets" value={summary?.total_tickets ?? '—'} color="#6366f1" delay={0.05} />
        <StatCard icon={Clock} label="To Do" value={summary?.by_status?.['To Do'] ?? '—'} color="#64748b" delay={0.1} />
        <StatCard icon={Zap} label="In Progress" value={summary?.by_status?.['In Progress'] ?? '—'} color="#f59e0b" delay={0.15} />
        <StatCard icon={CheckCircle2} label="Done" value={summary?.by_status?.['Done'] ?? '—'} color="#10b981" delay={0.2} />
      </div>

      {/* Charts row */}
      <div className="overview-grid">
        {/* Status pie chart */}
        <Card className="chart-card" delay={0.25}>
          <SectionHeader title="Tickets by Status" />
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, i) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="chart-legend">
              {statusData.map((s) => (
                <div key={s.name} className="legend-item">
                  <span className="legend-dot" style={{ background: STATUS_COLORS[s.name] || '#6366f1' }} />
                  <span className="legend-label">{s.name}</span>
                  <span className="legend-value">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Assignee bar chart */}
        <Card className="chart-card" delay={0.3}>
          <SectionHeader title="Tickets by Assignee" />
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={assigneeData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13 }}
                />
                <Bar dataKey="value" fill="var(--accent)" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Sprints */}
      {sprints.length > 0 && (
        <Card delay={0.35}>
          <SectionHeader title="Sprints" />
          <div className="sprint-list">
            {sprints.map((s, i) => (
              <motion.div
                key={s.id}
                className={`sprint-row ${s.state === 'active' ? 'active' : ''}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                <div className="sprint-info">
                  <span className="sprint-name">{s.name}</span>
                  <span className={`sprint-state ${s.state}`}>{s.state}</span>
                </div>
                <div className="sprint-dates">
                  {s.start_date ? (
                    <>
                      <Clock size={12} />
                      {new Date(s.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' → '}
                      {s.end_date ? new Date(s.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                    </>
                  ) : (
                    <span className="sprint-no-dates">Not scheduled</span>
                  )}
                </div>
                {s.goal && <p className="sprint-goal">{s.goal}</p>}
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Team Members */}
      {users.length > 0 && (
        <Card delay={0.4}>
          <SectionHeader title="Team Members" />
          <div className="jira-users-grid">
            {users.map((u, i) => (
              <motion.div
                key={u.account_id}
                className="jira-user-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 + i * 0.06 }}
                whileHover={{ y: -3 }}
              >
                <img src={u.avatar_url} alt="" className="jira-user-avatar" />
                <span className="jira-user-name">{u.display_name}</span>
                <span className="jira-user-tickets">
                  <Ticket size={12} /> {summary?.by_assignee?.[u.display_name] ?? 0} tickets
                </span>
                {u.active && <span className="jira-user-active">Active</span>}
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Tickets table */}
      <Card delay={0.45}>
        <SectionHeader title={`Tickets (${filteredTickets.length})`}>
          <div className="jira-filters">
            <div className="jira-search-wrap">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search tickets…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="jira-search-input"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="jira-filter-select"
            >
              <option value="all">All Statuses</option>
              {Object.keys(summary?.by_status || {}).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="jira-filter-select"
            >
              <option value="all">All Assignees</option>
              {Object.keys(summary?.by_assignee || {}).map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        </SectionHeader>

        {filteredTickets.length === 0 ? (
          <EmptyState icon={Ticket} message="No tickets match your filters" />
        ) : (
          <div className="jira-tickets-list">
            {filteredTickets.map((t, i) => (
              <motion.div
                key={t.key}
                className={`jira-ticket-row ${expandedTicket === t.key ? 'expanded' : ''}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.03 }}
              >
                <div className="jira-ticket-main" onClick={() => setExpandedTicket(expandedTicket === t.key ? null : t.key)}>
                  <div className="jira-ticket-left">
                    <span className={`jira-ticket-status-dot`} style={{ background: STATUS_COLORS[t.status] || '#64748b' }} />
                    <code className="jira-ticket-key">{t.key}</code>
                    <span className="jira-ticket-summary">{t.summary}</span>
                  </div>
                  <div className="jira-ticket-right">
                    <span className={`jira-ticket-priority ${t.priority?.toLowerCase()}`}>{t.priority}</span>
                    <span className="jira-ticket-type">{t.issue_type}</span>
                    {t.assignee_avatar ? (
                      <img src={t.assignee_avatar} alt="" className="jira-ticket-avatar" title={t.assignee} />
                    ) : (
                      <span className="jira-ticket-unassigned" title="Unassigned">—</span>
                    )}
                    {expandedTicket === t.key ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {expandedTicket === t.key && (
                  <motion.div
                    className="jira-ticket-details"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="jira-detail-grid">
                      <div className="jira-detail-item">
                        <span className="jira-detail-label">Status</span>
                        <span className="jira-detail-value">
                          <span className="jira-status-badge" style={{ background: `${STATUS_COLORS[t.status]}18`, color: STATUS_COLORS[t.status] }}>{t.status}</span>
                        </span>
                      </div>
                      <div className="jira-detail-item">
                        <span className="jira-detail-label">Assignee</span>
                        <span className="jira-detail-value">{t.assignee || 'Unassigned'}</span>
                      </div>
                      <div className="jira-detail-item">
                        <span className="jira-detail-label">Reporter</span>
                        <span className="jira-detail-value">{t.reporter}</span>
                      </div>
                      <div className="jira-detail-item">
                        <span className="jira-detail-label">Priority</span>
                        <span className="jira-detail-value">{t.priority}</span>
                      </div>
                      <div className="jira-detail-item">
                        <span className="jira-detail-label">Type</span>
                        <span className="jira-detail-value">{t.issue_type}</span>
                      </div>
                      <div className="jira-detail-item">
                        <span className="jira-detail-label">Created</span>
                        <span className="jira-detail-value">{new Date(t.created).toLocaleDateString()}</span>
                      </div>
                      {t.due_date && (
                        <div className="jira-detail-item">
                          <span className="jira-detail-label">Due Date</span>
                          <span className="jira-detail-value">{new Date(t.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                      {t.story_points && (
                        <div className="jira-detail-item">
                          <span className="jira-detail-label">Story Points</span>
                          <span className="jira-detail-value">{t.story_points}</span>
                        </div>
                      )}
                      {t.labels?.length > 0 && (
                        <div className="jira-detail-item full">
                          <span className="jira-detail-label">Labels</span>
                          <div className="jira-labels-wrap">
                            {t.labels.map((l) => <span key={l} className="jira-label-tag">{l}</span>)}
                          </div>
                        </div>
                      )}
                      {t.comment_count > 0 && (
                        <div className="jira-detail-item">
                          <span className="jira-detail-label">Comments</span>
                          <span className="jira-detail-value">{t.comment_count}</span>
                        </div>
                      )}
                    </div>
                    <a href={t.url} target="_blank" rel="noopener noreferrer" className="jira-ticket-link">
                      View in Jira <ExternalLink size={12} />
                    </a>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </Card>
      </>
      )}
    </div>
  );
}
