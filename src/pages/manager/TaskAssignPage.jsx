import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
  ListTodo,
  AlertCircle,
  ExternalLink,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Search,
  RefreshCw,
  User,
  Tag,
  Ticket,
} from 'lucide-react';
import { Card, SectionHeader, Spinner, EmptyState } from '../../components/Card';
import { tasks, jira } from '../../services/api';
import './Manager.css';

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
};

const STATUS_OPTIONS = ['To Do', 'In Progress', 'In Review', 'Done'];

export default function TaskAssignPage() {
  // NL assign state
  const [text, setText] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [result, setResult] = useState(null);

  // Jira tickets state
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedTicket, setExpandedTicket] = useState(null);

  // Locally created tasks from NL
  const [localTasks, setLocalTasks] = useState([]);

  // ── Load Jira tickets ──────────────────────────────────────────
  const fetchTickets = async () => {
    setTicketsLoading(true);
    try {
      const data = await jira.getTickets();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load Jira tickets:', err);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // ── NL task assignment ─────────────────────────────────────────
  const handleAssign = async () => {
    if (!text.trim()) return;
    setAssigning(true);
    setResult(null);

    try {
      const res = await tasks.assignNL(text);
      setResult({ type: 'success', data: res });
      // Add to local tasks list
      setLocalTasks((prev) => [
        {
          id: res.task_id,
          description: res.description,
          member_name: res.member_name,
          deadline: res.deadline,
          raw_input: res.raw_input,
          status: 'To Do',
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setText('');
    } catch (err) {
      setResult({ type: 'error', message: err.message || 'Failed to assign task' });
    } finally {
      setAssigning(false);
    }
  };

  // ── Local task management ──────────────────────────────────────
  const updateLocalTaskStatus = (taskId, newStatus) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
  };

  const deleteLocalTask = (taskId) => {
    setLocalTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // ── Filtered Jira tickets ──────────────────────────────────────
  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !t.summary?.toLowerCase().includes(q) &&
        !t.key?.toLowerCase().includes(q) &&
        !t.assignee?.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  // ── Status counts ──────────────────────────────────────────────
  const statusCounts = tickets.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="manager-overview">
      {/* Page header */}
      <motion.div
        className="page-header"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Manage Tasks</h1>
        <p className="page-sub">
          View Jira issues, assign tasks with natural language, and manage your workflow
        </p>
      </motion.div>

      {/* ─── NL Task Assignment ─────────────────────────────────── */}
      <Card delay={0.1}>
        <SectionHeader title="Quick Assign">
          <div className="nl-badge">
            <Sparkles size={13} /> AI-Powered
          </div>
        </SectionHeader>

        <p className="task-hint">
          Describe the task naturally. Example:{' '}
          <em>"assign backend to Kailas S S"</em>
        </p>

        <div className="task-input-wrap">
          <textarea
            className="task-textarea"
            placeholder="Describe the task you want to assign…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAssign();
            }}
            rows={2}
          />
          <motion.button
            className="assign-btn"
            onClick={handleAssign}
            disabled={assigning || !text.trim()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {assigning ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <>
                <Send size={16} /> Assign
              </>
            )}
          </motion.button>
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              className={`task-result ${result.type}`}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {result.type === 'success' ? (
                <>
                  <CheckCircle2 size={15} />
                  <span>
                    Task #{result.data.task_id} assigned to{' '}
                    <strong>{result.data.member_name}</strong> &mdash; &ldquo;
                    {result.data.description}&rdquo; (due {result.data.deadline})
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={15} />
                  {result.message}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ─── Locally Created Tasks ──────────────────────────────── */}
      {localTasks.length > 0 && (
        <Card delay={0.15}>
          <SectionHeader title={`Newly Created (${localTasks.length})`} />
          <div className="mt-local-tasks">
            {localTasks.map((t, i) => (
              <motion.div
                key={t.id}
                className="mt-local-task-row"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div className="mt-local-left">
                  <span
                    className="mt-status-dot"
                    style={{ background: STATUS_COLORS[t.status] || '#64748b' }}
                  />
                  <div className="mt-local-info">
                    <span className="mt-local-desc">{t.description}</span>
                    <span className="mt-local-meta">
                      <User size={11} /> {t.member_name} &middot;{' '}
                      <Clock size={11} /> {t.deadline}
                    </span>
                  </div>
                </div>
                <div className="mt-local-actions">
                  <select
                    className="mt-status-select"
                    value={t.status}
                    onChange={(e) => updateLocalTaskStatus(t.id, e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <motion.button
                    className="mt-delete-btn"
                    title="Remove task"
                    onClick={() => deleteLocalTask(t.id)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 size={14} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* ─── Jira Issues ────────────────────────────────────────── */}
      <Card delay={0.2}>
        <SectionHeader title={`Jira Issues (${filteredTickets.length})`}>
          <div className="mt-header-actions">
            <motion.button
              className="mt-refresh-btn"
              onClick={fetchTickets}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={ticketsLoading}
              title="Refresh tickets"
            >
              <RefreshCw size={14} className={ticketsLoading ? 'spin' : ''} />
            </motion.button>
            <a
              href="https://frankenstien.atlassian.net/jira/software/projects/SCRUM/boards"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-goto-jira-btn"
            >
              Go to Jira <ExternalLink size={12} />
            </a>
          </div>
        </SectionHeader>

        {/* Status quick-filters */}
        <div className="mt-status-chips">
          <button
            className={`mt-chip ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({tickets.length})
          </button>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              className={`mt-chip ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
              style={
                statusFilter === s
                  ? { borderColor: STATUS_COLORS[s], color: STATUS_COLORS[s] }
                  : {}
              }
            >
              <span
                className="mt-chip-dot"
                style={{ background: STATUS_COLORS[s] }}
              />
              {s} ({statusCounts[s] || 0})
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="mt-search-bar">
          <Search size={14} />
          <input
            type="text"
            placeholder="Search by title, key, or assignee…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Ticket list */}
        {ticketsLoading && tickets.length === 0 ? (
          <Spinner text="Loading Jira issues…" />
        ) : filteredTickets.length === 0 ? (
          <EmptyState icon={Ticket} message="No issues match your filters" />
        ) : (
          <div className="mt-tickets-list">
            {filteredTickets.map((t, i) => (
              <motion.div
                key={t.key}
                className={`mt-ticket-row ${expandedTicket === t.key ? 'expanded' : ''}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.02 }}
              >
                {/* Collapsed row */}
                <div
                  className="mt-ticket-main"
                  onClick={() =>
                    setExpandedTicket(
                      expandedTicket === t.key ? null : t.key
                    )
                  }
                >
                  <span
                    className="mt-status-dot"
                    style={{ background: STATUS_COLORS[t.status] || '#64748b' }}
                  />
                  <code className="mt-ticket-key">{t.key}</code>
                  <span className="mt-ticket-summary">{t.summary}</span>
                  <div className="mt-ticket-meta-right">
                    <span
                      className="mt-priority-badge"
                      style={{
                        color: PRIORITY_COLORS[t.priority] || '#64748b',
                        background: `${PRIORITY_COLORS[t.priority] || '#64748b'}15`,
                      }}
                    >
                      {t.priority}
                    </span>
                    {t.assignee_avatar ? (
                      <img
                        src={t.assignee_avatar}
                        alt=""
                        className="mt-assignee-avatar"
                        title={t.assignee}
                      />
                    ) : (
                      <span className="mt-unassigned" title="Unassigned">
                        —
                      </span>
                    )}
                    {expandedTicket === t.key ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </div>
                </div>

                {/* Expanded detail */}
                <AnimatePresence>
                  {expandedTicket === t.key && (
                    <motion.div
                      className="mt-ticket-detail"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="mt-detail-grid">
                        <div className="mt-detail-item">
                          <span className="mt-detail-label">Status</span>
                          <span
                            className="mt-status-badge"
                            style={{
                              background: `${STATUS_COLORS[t.status]}18`,
                              color: STATUS_COLORS[t.status],
                            }}
                          >
                            {t.status}
                          </span>
                        </div>
                        <div className="mt-detail-item">
                          <span className="mt-detail-label">Assignee</span>
                          <span className="mt-detail-value">
                            {t.assignee || 'Unassigned'}
                          </span>
                        </div>
                        <div className="mt-detail-item">
                          <span className="mt-detail-label">Reporter</span>
                          <span className="mt-detail-value">{t.reporter}</span>
                        </div>
                        <div className="mt-detail-item">
                          <span className="mt-detail-label">Type</span>
                          <span className="mt-detail-value">{t.issue_type}</span>
                        </div>
                        <div className="mt-detail-item">
                          <span className="mt-detail-label">Priority</span>
                          <span className="mt-detail-value">{t.priority}</span>
                        </div>
                        <div className="mt-detail-item">
                          <span className="mt-detail-label">Created</span>
                          <span className="mt-detail-value">
                            {new Date(t.created).toLocaleDateString()}
                          </span>
                        </div>
                        {t.due_date && (
                          <div className="mt-detail-item">
                            <span className="mt-detail-label">Due Date</span>
                            <span className="mt-detail-value">
                              {new Date(t.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {t.story_points && (
                          <div className="mt-detail-item">
                            <span className="mt-detail-label">Story Points</span>
                            <span className="mt-detail-value">{t.story_points}</span>
                          </div>
                        )}
                        {t.labels?.length > 0 && (
                          <div className="mt-detail-item full">
                            <span className="mt-detail-label">Labels</span>
                            <div className="mt-labels-wrap">
                              {t.labels.map((l) => (
                                <span key={l} className="mt-label-tag">
                                  <Tag size={10} /> {l}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {t.description && (
                          <div className="mt-detail-item full">
                            <span className="mt-detail-label">Description</span>
                            <p className="mt-detail-desc">{t.description}</p>
                          </div>
                        )}
                        {t.comment_count > 0 && (
                          <div className="mt-detail-item">
                            <span className="mt-detail-label">Comments</span>
                            <span className="mt-detail-value">
                              {t.comment_count}
                            </span>
                          </div>
                        )}
                      </div>
                      <a
                        href={t.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-ticket-link"
                      >
                        Open in Jira <ExternalLink size={12} />
                      </a>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
