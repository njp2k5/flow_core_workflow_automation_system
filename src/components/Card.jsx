import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import './Card.css';

/* ── Animated card wrapper ─────────────────────────────────────────── */
export function Card({ children, className = '', delay = 0, ...props }) {
  return (
    <motion.div
      className={`card ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/* ── Stat card with icon ───────────────────────────────────────────── */
export function StatCard({ icon: Icon, label, value, sub, color = 'var(--accent)', delay = 0 }) {
  return (
    <Card className="stat-card" delay={delay}>
      <div className="stat-icon" style={{ background: `${color}18`, color }}>
        <Icon size={20} />
      </div>
      <div className="stat-body">
        <span className="stat-value">{value ?? '—'}</span>
        <span className="stat-label">{label}</span>
        {sub && <span className="stat-sub">{sub}</span>}
      </div>
    </Card>
  );
}

/* ── Section header ────────────────────────────────────────────────── */
export function SectionHeader({ title, action, children }) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {action && action}
      {children}
    </div>
  );
}

/* ── Loading spinner ───────────────────────────────────────────────── */
export function Spinner({ size = 24, text = 'Loading…' }) {
  return (
    <div className="spinner-wrap">
      <Loader2 size={size} className="spin" />
      {text && <span>{text}</span>}
    </div>
  );
}

/* ── Empty state ───────────────────────────────────────────────────── */
export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="empty-state">
      {Icon && <Icon size={36} />}
      <p>{message}</p>
    </div>
  );
}
