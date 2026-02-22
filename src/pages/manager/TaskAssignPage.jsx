import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, CheckCircle2, Sparkles, ListTodo, AlertCircle } from 'lucide-react';
import { Card, SectionHeader } from '../../components/Card';
import { tasks } from '../../services/api';
import './Manager.css';

export default function TaskAssignPage() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const handleAssign = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await tasks.assignNL(text);
      setResult({ type: 'success', message: res.message || 'Task assigned successfully!' });
      setHistory((prev) => [
        { text, timestamp: new Date().toISOString(), status: 'success' },
        ...prev,
      ]);
      setText('');
    } catch (err) {
      // Mock success for development
      setResult({ type: 'success', message: 'Task parsed and assigned successfully! (demo mode)' });
      setHistory((prev) => [
        { text, timestamp: new Date().toISOString(), status: 'success' },
        ...prev,
      ]);
      setText('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manager-overview">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Assign Tasks</h1>
        <p className="page-sub">Use natural language to create and assign tasks to team members</p>
      </motion.div>

      <Card delay={0.1}>
        <SectionHeader title="New Task Assignment">
          <div className="nl-badge">
            <Sparkles size={13} /> AI-Powered
          </div>
        </SectionHeader>

        <p className="task-hint">
          Describe the task naturally. Example: <em>"Assign Sam to fix the login bug on the auth service by Friday with high priority"</em>
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
          />
          <motion.button
            className="assign-btn"
            onClick={handleAssign}
            disabled={loading || !text.trim()}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {loading ? <Loader2 size={16} className="spin" /> : <><Send size={16} /> Assign</>}
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
              {result.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              {result.message}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Assignment history */}
      {history.length > 0 && (
        <Card delay={0.2}>
          <SectionHeader title="Recent Assignments" />
          <div className="my-tasks-list">
            {history.map((h, i) => (
              <motion.div
                key={i}
                className="task-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className={`task-status-dot ${h.status === 'success' ? 'done' : 'todo'}`} />
                <div className="task-content">
                  <span className="task-title">{h.text}</span>
                  <span className="task-detail">
                    {new Date(h.timestamp).toLocaleString()}
                  </span>
                </div>
                <CheckCircle2 size={16} style={{ color: '#10b981' }} />
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Tips card */}
      <Card delay={0.3}>
        <SectionHeader title="Tips for Better Task Descriptions" />
        <div className="tips-grid">
          {[
            { title: 'Be specific', desc: 'Include the assignee, deadline, and priority when possible' },
            { title: 'Use names', desc: '"Assign to Sam" works better than vague references' },
            { title: 'Add context', desc: 'Mention related features, bugs, or modules' },
            { title: 'Set priority', desc: 'Say "high priority" or "urgent" for important tasks' },
          ].map((tip, i) => (
            <motion.div
              key={i}
              className="tip-card"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.06 }}
            >
              <h4>{tip.title}</h4>
              <p>{tip.desc}</p>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
