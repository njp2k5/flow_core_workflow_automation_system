import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Zap,
  BookOpen,
  Ticket,
  Clock,
  ArrowRight,
  Sparkles,
  RotateCcw,
  AlertTriangle,
  FileUp,
  Layers,
} from 'lucide-react';
import { Card, SectionHeader } from '../../components/Card';
import { srs } from '../../services/api';
import './GetStarted.css';

/* ── Processing phase steps for the shimmer animation ─────────────── */
const PROCESSING_STEPS = [
  { icon: FileText,    label: 'Parsing SRS document…',          duration: 3000 },
  { icon: Layers,      label: 'Extracting sections & requirements…', duration: 3000 },
  { icon: Sparkles,    label: 'Generating Confluence pages…',    duration: 4000 },
  { icon: Ticket,      label: 'Creating Jira stories & tasks…',  duration: 4000 },
  { icon: Zap,         label: 'Assigning issues to team members…', duration: 3000 },
  { icon: CheckCircle2, label: 'Finalizing…',                    duration: 2000 },
];

export default function GetStartedPage() {
  const [file, setFile]             = useState(null);
  const [dragging, setDragging]     = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [result, setResult]         = useState(null);
  const [error, setError]           = useState(null);
  const [stepIndex, setStepIndex]   = useState(0);
  const [elapsed, setElapsed]       = useState(0);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // ── Step auto-advance during upload ─────────────────────────────
  useEffect(() => {
    if (!uploading) return;
    const timeout = setTimeout(() => {
      setStepIndex((prev) => (prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev));
    }, PROCESSING_STEPS[stepIndex]?.duration ?? 3000);
    return () => clearTimeout(timeout);
  }, [uploading, stepIndex]);

  // ── Elapsed timer ───────────────────────────────────────────────
  useEffect(() => {
    if (uploading) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [uploading]);

  // ── Drag & drop handlers ────────────────────────────────────────
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setFile(dropped);
      setResult(null);
      setError(null);
    }
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setResult(null);
      setError(null);
    }
  };

  // ── Upload ──────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file || uploading) return;
    setUploading(true);
    setStepIndex(0);
    setResult(null);
    setError(null);

    try {
      const data = await srs.upload(file);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    setStepIndex(0);
    setElapsed(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Helpers ─────────────────────────────────────────────────────
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const decisionIcon = (text) => {
    if (text.startsWith('✅')) return <CheckCircle2 size={14} className="decision-icon success" />;
    if (text.startsWith('🔄')) return <ArrowRight size={14} className="decision-icon skip" />;
    if (text.startsWith('❌')) return <XCircle size={14} className="decision-icon error" />;
    if (text.startsWith('📄')) return <FileText size={14} className="decision-icon page" />;
    if (text.startsWith('📊') || text.startsWith('📋')) return <Layers size={14} className="decision-icon info" />;
    return <Zap size={14} className="decision-icon info" />;
  };

  return (
    <div className="manager-overview get-started-page">
      {/* Page header */}
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Get Started</h1>
        <p className="page-sub">Upload an SRS document to auto-generate Confluence pages and Jira tasks</p>
      </motion.div>

      {/* ─── Upload zone ──────────────────────────────────────────── */}
      {!uploading && !result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="upload-card" delay={0.05}>
            <div
              className={`drop-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md"
                onChange={handleFileSelect}
                className="file-input-hidden"
              />

              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div
                    key="file-selected"
                    className="drop-zone-content"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <div className="file-preview-icon">
                      <FileText size={28} />
                    </div>
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatSize(file.size)}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-file"
                    className="drop-zone-content"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <div className="upload-icon-wrap">
                      <FileUp size={32} />
                    </div>
                    <span className="drop-zone-title">Drop your SRS document here</span>
                    <span className="drop-zone-hint">or click to browse &middot; PDF, DOCX, TXT, MD</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Error message */}
            {error && (
              <motion.div className="upload-error" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="upload-actions">
              <button
                className="upload-btn primary"
                disabled={!file}
                onClick={handleUpload}
              >
                <Upload size={16} />
                Process Document
              </button>
              {file && (
                <button className="upload-btn ghost" onClick={handleReset}>
                  <RotateCcw size={14} />
                  Clear
                </button>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* ─── Processing state ─────────────────────────────────────── */}
      {uploading && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="processing-card" delay={0}>
            <div className="processing-header">
              <div className="processing-spinner-wrap">
                <Loader2 size={28} className="spin" />
              </div>
              <div>
                <h2 className="processing-title">Processing your document</h2>
                <p className="processing-file">{file?.name} &middot; {elapsed}s elapsed</p>
              </div>
            </div>

            {/* Step progress */}
            <div className="processing-steps">
              {PROCESSING_STEPS.map((step, i) => {
                const StepIcon = step.icon;
                const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending';
                return (
                  <motion.div
                    key={i}
                    className={`processing-step ${state}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                  >
                    <div className="step-icon-wrap">
                      {state === 'done' ? (
                        <CheckCircle2 size={16} />
                      ) : state === 'active' ? (
                        <Loader2 size={16} className="spin" />
                      ) : (
                        <StepIcon size={16} />
                      )}
                    </div>
                    <span className="step-label">{step.label}</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Shimmer bar */}
            <div className="processing-progress-bar">
              <motion.div
                className="processing-progress-fill"
                initial={{ width: '0%' }}
                animate={{ width: `${Math.min(((stepIndex + 1) / PROCESSING_STEPS.length) * 100, 95)}%` }}
                transition={{ duration: 1, ease: 'easeInOut' }}
              />
              <div className="processing-shimmer" />
            </div>

            <p className="processing-hint">
              <Sparkles size={14} /> AI is analyzing your SRS and generating structured output…
            </p>
          </Card>
        </motion.div>
      )}

      {/* ─── Results ──────────────────────────────────────────────── */}
      {result && (
        <motion.div className="results-section" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Success banner */}
          <motion.div
            className="result-banner"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <div className="result-banner-icon">
              <CheckCircle2 size={24} />
            </div>
            <div className="result-banner-text">
              <h2>Document processed successfully!</h2>
              <p>
                <strong>{result.document_title}</strong>
                {result.project_name && <> &middot; Project: <strong>{result.project_name}</strong></>}
                {' '}&middot; {result.sections_count} sections &middot; {result.processing_time_ms ? `${(result.processing_time_ms / 1000).toFixed(1)}s` : ''}
              </p>
            </div>
          </motion.div>

          {/* Stats row */}
          <div className="result-stats-row">
            <motion.div className="result-stat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <BookOpen size={18} className="result-stat-icon confluence" />
              <span className="result-stat-value">{result.confluence_pages?.length ?? 0}</span>
              <span className="result-stat-label">Confluence Pages</span>
            </motion.div>
            <motion.div className="result-stat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Ticket size={18} className="result-stat-icon jira" />
              <span className="result-stat-value">{(result.jira_tasks?.length ?? 0) + (result.jira_stories?.length ?? 0)}</span>
              <span className="result-stat-label">Jira Issues</span>
            </motion.div>
            <motion.div className="result-stat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <Layers size={18} className="result-stat-icon sections" />
              <span className="result-stat-value">{result.sections_count ?? 0}</span>
              <span className="result-stat-label">Sections</span>
            </motion.div>
            <motion.div className="result-stat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Clock size={18} className="result-stat-icon time" />
              <span className="result-stat-value">{result.processing_time_ms ? `${(result.processing_time_ms / 1000).toFixed(1)}s` : '—'}</span>
              <span className="result-stat-label">Processing Time</span>
            </motion.div>
          </div>

          {/* Confluence pages */}
          {result.confluence_pages?.length > 0 && (
            <Card delay={0.2}>
              <SectionHeader title={`Confluence Pages (${result.confluence_pages.length})`} />
              <div className="result-pages-grid">
                {result.confluence_pages.map((p, i) => (
                  <motion.a
                    key={p.page_id}
                    href={p.page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="result-page-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 + i * 0.06 }}
                    whileHover={{ y: -4, scale: 1.02 }}
                  >
                    <div className="result-page-icon">
                      <BookOpen size={18} />
                    </div>
                    <span className="result-page-type">{p.page_type}</span>
                    <span className={`result-page-action ${p.action}`}>{p.action}</span>
                    <ExternalLink size={12} className="result-page-ext" />
                  </motion.a>
                ))}
              </div>
            </Card>
          )}

          {/* Jira tasks */}
          {(result.jira_tasks?.length > 0 || result.jira_stories?.length > 0) && (
            <Card delay={0.35}>
              <SectionHeader title={`Jira Issues (${(result.jira_tasks?.length ?? 0) + (result.jira_stories?.length ?? 0)})`} />
              <div className="result-jira-list">
                {[...(result.jira_tasks || []), ...(result.jira_stories || [])].map((t, i) => (
                  <motion.div
                    key={t.key || i}
                    className="result-jira-item"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.04 }}
                  >
                    <Ticket size={14} className="result-jira-icon" />
                    <code className="result-jira-key">{t.key}</code>
                    <span className="result-jira-summary">{t.summary}</span>
                    {t.assignee && <span className="result-jira-assignee">{t.assignee}</span>}
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          {/* Decisions / Log */}
          {result.decisions?.length > 0 && (
            <Card delay={0.45}>
              <SectionHeader title="Processing Log" />
              <div className="result-decisions-list">
                {result.decisions.map((d, i) => (
                  <motion.div
                    key={i}
                    className="result-decision-row"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.025 }}
                  >
                    {decisionIcon(d)}
                    <span className="decision-text">{d.replace(/^[^\s]+\s/, '')}</span>
                  </motion.div>
                ))}
              </div>
            </Card>
          )}

          {/* Error in result */}
          {result.error && (
            <Card delay={0.55}>
              <div className="result-error-banner">
                <AlertTriangle size={16} />
                <span>{result.error}</span>
              </div>
            </Card>
          )}

          {/* Start over */}
          <motion.div className="result-footer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <button className="upload-btn ghost" onClick={handleReset}>
              <RotateCcw size={14} /> Upload Another Document
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
