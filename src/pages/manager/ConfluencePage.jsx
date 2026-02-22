import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Globe,
  ExternalLink,
  Clock,
  User,
  BookOpen,
  Search,
  Layers,
} from 'lucide-react';
import { Card, StatCard, SectionHeader, Spinner, EmptyState } from '../../components/Card';
import { confluence } from '../../services/api';
import './Confluence.css';

export default function ConfluencePage() {
  const [space, setSpace]     = useState(null);
  const [pages, setPages]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [spaceData, pagesData] = await Promise.all([
          confluence.getSpace(),
          confluence.getPages(),
        ]);
        setSpace(spaceData);
        setPages(Array.isArray(pagesData) ? pagesData : []);
      } catch (err) {
        console.error('Failed to load Confluence data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredPages = pages.filter((p) =>
    !searchQuery || p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.created_by?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by creator
  const byAuthor = pages.reduce((acc, p) => {
    const author = p.created_by || 'Unknown';
    acc[author] = (acc[author] || 0) + 1;
    return acc;
  }, {});

  const recentPages = [...pages].sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated)).slice(0, 5);

  return (
    <div className="manager-overview">
      {/* Page header */}
      <motion.div className="page-header" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="confluence-header-row">
          <div>
            <h1>Confluence</h1>
            <p className="page-sub">
              {space ? (
                <>
                  {space.name} &middot; <code className="project-key">{space.key}</code> &middot; {space.type}
                </>
              ) : 'Documentation and knowledge base'}
            </p>
          </div>
          {space?.url && (
            <a href={space.url} target="_blank" rel="noopener noreferrer" className="confluence-external-link">
              Open in Confluence <ExternalLink size={14} />
            </a>
          )}
        </div>
      </motion.div>

      {/* Stat grid */}
      {loading && !space ? (
        <Card delay={0.05}><Spinner text="Loading Confluence data…" /></Card>
      ) : (
      <>
      <div className="stat-grid">
        <StatCard icon={FileText} label="Total Pages" value={pages.length} color="#6366f1" delay={0.05} />
        <StatCard icon={User} label="Contributors" value={Object.keys(byAuthor).length} color="#10b981" delay={0.1} />
        <StatCard icon={Layers} label="Space Type" value={space?.type || '—'} color="#f59e0b" delay={0.15} />
        <StatCard icon={BookOpen} label="Latest Version" value={recentPages[0]?.version ?? '—'} color="#8b5cf6" delay={0.2} />
      </div>

      {/* Two-column layout: Space Info + Recent Activity */}
      <div className="overview-grid">
        {/* Space info */}
        <Card delay={0.25}>
          <SectionHeader title="Space Info" />
          {space ? (
            <div className="confluence-space-info">
              <div className="confluence-info-row">
                <span className="confluence-info-label">Name</span>
                <span className="confluence-info-value">{space.name}</span>
              </div>
              <div className="confluence-info-row">
                <span className="confluence-info-label">Key</span>
                <code className="confluence-info-code">{space.key}</code>
              </div>
              <div className="confluence-info-row">
                <span className="confluence-info-label">Type</span>
                <span className="confluence-info-value confluence-type-badge">{space.type}</span>
              </div>
              {space.description && (
                <div className="confluence-info-row">
                  <span className="confluence-info-label">Description</span>
                  <span className="confluence-info-value">{space.description}</span>
                </div>
              )}
              {space.home_page_title && (
                <div className="confluence-info-row">
                  <span className="confluence-info-label">Home Page</span>
                  <span className="confluence-info-value">{space.home_page_title}</span>
                </div>
              )}
              <a href={space.url} target="_blank" rel="noopener noreferrer" className="confluence-space-link">
                <Globe size={14} /> Visit Space
              </a>
            </div>
          ) : (
            <EmptyState icon={Globe} message="No space information available" />
          )}
        </Card>

        {/* Recent Activity */}
        <Card delay={0.3}>
          <SectionHeader title="Recently Updated" />
          {recentPages.length === 0 ? (
            <EmptyState icon={Clock} message="No recent activity" />
          ) : (
            <div className="confluence-recent-list">
              {recentPages.map((p, i) => (
                <motion.div
                  key={p.id}
                  className="confluence-recent-item"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                >
                  <div className="confluence-recent-icon">
                    <FileText size={14} />
                  </div>
                  <div className="confluence-recent-info">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="confluence-recent-title">
                      {p.title}
                    </a>
                    <span className="confluence-recent-meta">
                      Updated by {p.last_updated_by} &middot; {new Date(p.last_updated).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <span className="confluence-recent-version">v{p.version}</span>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Contributors breakdown */}
      <Card delay={0.35}>
        <SectionHeader title="Contributors" />
        <div className="confluence-contributors-grid">
          {Object.entries(byAuthor).map(([author, count], i) => (
            <motion.div
              key={author}
              className="confluence-contributor-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              whileHover={{ y: -3 }}
            >
              <div className="confluence-contributor-avatar">
                {author.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span className="confluence-contributor-name">{author}</span>
              <span className="confluence-contributor-count">
                <FileText size={12} /> {count} page{count !== 1 ? 's' : ''}
              </span>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* All pages */}
      <Card delay={0.4}>
        <SectionHeader title={`Pages (${filteredPages.length})`}>
          <div className="confluence-search-wrap">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search pages…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="confluence-search-input"
            />
          </div>
        </SectionHeader>

        {filteredPages.length === 0 ? (
          <EmptyState icon={FileText} message="No pages found" />
        ) : (
          <div className="confluence-pages-list">
            {filteredPages.map((p, i) => (
              <motion.a
                key={p.id}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="confluence-page-row"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.04 }}
              >
                <div className="confluence-page-icon">
                  <FileText size={16} />
                </div>
                <div className="confluence-page-info">
                  <span className="confluence-page-title">{p.title}</span>
                  <span className="confluence-page-meta">
                    Created by {p.created_by} &middot; {new Date(p.created_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}
                  </span>
                </div>
                <div className="confluence-page-right">
                  <span className={`confluence-page-status ${p.status}`}>{p.status}</span>
                  <span className="confluence-page-version">v{p.version}</span>
                  <ExternalLink size={12} className="confluence-page-ext" />
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </Card>
      </>
      )}
    </div>
  );
}
