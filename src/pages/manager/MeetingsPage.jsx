import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, Calendar } from 'lucide-react';
import { Card, SectionHeader, Spinner, EmptyState } from '../../components/Card';
import { meetings } from '../../services/api';
import './Manager.css';

const MOCK_MEETINGS = [
  {
    id: 1,
    title: 'Sprint 12 Retrospective',
    date: '2026-02-21T15:00:00Z',
    summary: 'Team discussed the successful deployment of the NL task assignment feature. Agreed to prioritize test coverage improvement and dependency updates for the next sprint. Action items assigned to Sam and Jordan.',
    participants: ['Alex Morgan', 'Sam Rivera', 'Jordan Lee', 'Casey Kim'],
  },
  {
    id: 2,
    title: 'Architecture Review – MCP Integration',
    date: '2026-02-19T10:00:00Z',
    summary: 'Reviewed the GitHub MCP server integration architecture. Decided to use SSE for real-time dashboard updates instead of polling. Discussed rate limiting strategy for LLM endpoints.',
    participants: ['Alex Morgan', 'Sam Rivera', 'Casey Kim'],
  },
  {
    id: 3,
    title: 'Sprint 12 Planning',
    date: '2026-02-17T09:30:00Z',
    summary: 'Planned sprint 12 deliverables: NL task assignment, meeting summary pipeline, and progress tracking dashboard. Estimated 34 story points total. Casey flagged risk of dependency on external LLM API availability.',
    participants: ['Alex Morgan', 'Sam Rivera', 'Jordan Lee', 'Casey Kim', 'Taylor Chen'],
  },
  {
    id: 4,
    title: 'Daily Standup',
    date: '2026-02-16T09:00:00Z',
    summary: 'Quick standup: Sam working on NL parser, Jordan finishing auth fix, Casey deploying meeting summaries. No blockers reported. Alex to review PRs by EOD.',
    participants: ['Alex Morgan', 'Sam Rivera', 'Jordan Lee', 'Casey Kim'],
  },
];

export default function MeetingsPage() {
  const [meetingList, setMeetingList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await meetings.getSummaries();
        setMeetingList(Array.isArray(data) ? data : []);
      } catch {
        setMeetingList(MOCK_MEETINGS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <Spinner text="Loading meeting summaries…" />;

  return (
    <div className="manager-overview">
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1>Meeting Summaries</h1>
        <p className="page-sub">AI-generated summaries from past meetings</p>
      </motion.div>

      {meetingList.length === 0 ? (
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
