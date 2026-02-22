import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, Calendar } from 'lucide-react';
import { Card, SectionHeader, Spinner, EmptyState } from '../../components/Card';
import { meetings } from '../../services/api';
import './Manager.css';

export default function MeetingsPage() {
  const [meetingList, setMeetingList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await meetings.getSummaries();
        setMeetingList(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to load meetings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="manager-overview">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Meeting Summaries</h1>
        <p className="page-sub">AI-generated summaries from past meetings</p>
      </motion.div>

      {loading && meetingList.length === 0 ? (
        <Card delay={0.1}><Spinner text="Loading meeting summaries…" /></Card>
      ) : meetingList.length === 0 ? (
        <Card delay={0.1}>
          <EmptyState icon={FileText} message="No meeting summaries available" />
        </Card>
      ) : (
        <div className="meeting-list">
          {meetingList.map((m, i) => (
            <Card key={m.id} delay={0.1 + i * 0.08}>
              <div className="meeting-item-inner">
                <div className="meeting-title">{m.title}</div>
                <div className="meeting-date">
                  <Calendar size={12} /> {new Date(m.date).toLocaleDateString('en-US', {
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                  })}
                </div>
                <p className="meeting-summary">{m.summary}</p>
                {m.participants?.length > 0 && (
                  <div className="meeting-participants">
                    <Users size={12} style={{ color: 'var(--text-muted)' }} />
                    {m.participants.map((p) => (
                      <span key={p} className="meeting-tag">{p}</span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
