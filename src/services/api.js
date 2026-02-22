// ── FastAPI Backend (PostgreSQL data) ──────────────────────────────────
const FASTAPI_BASE = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000';

// ── GitHub MCP Server ─────────────────────────────────────────────────
const MCP_BASE = import.meta.env.VITE_MCP_URL || 'http://localhost:3003';

// ── Generic fetch wrapper ─────────────────────────────────────────────
async function request(base, path, options = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════
//  AUTH  (FastAPI + Postgres)
// ═══════════════════════════════════════════════════════════════════════
export const auth = {
  login: (credentials) =>
    request(FASTAPI_BASE, '/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  me: () => request(FASTAPI_BASE, '/auth/me'),
};

// ═══════════════════════════════════════════════════════════════════════
//  TASKS  (FastAPI + Postgres)
// ═══════════════════════════════════════════════════════════════════════
export const tasks = {
  getAll: () => request(FASTAPI_BASE, '/tasks'),
  getMyTasks: () => request(FASTAPI_BASE, '/tasks/me'),
  create: (payload) =>
    request(FASTAPI_BASE, '/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  assignNL: (text) =>
    request(FASTAPI_BASE, '/tasks/assign', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  update: (id, payload) =>
    request(FASTAPI_BASE, `/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
};

// ═══════════════════════════════════════════════════════════════════════
//  DEVELOPERS  (FastAPI + Postgres)
// ═══════════════════════════════════════════════════════════════════════
export const developers = {
  getAll: () => request(FASTAPI_BASE, '/developers'),
  getStats: (id) => request(FASTAPI_BASE, `/developers/${id}/stats`),
};

// ═══════════════════════════════════════════════════════════════════════
//  MEETINGS  (FastAPI + Postgres)
// ═══════════════════════════════════════════════════════════════════════
export const meetings = {
  getSummaries: () => request(FASTAPI_BASE, '/meetings/summaries'),
};

// ═══════════════════════════════════════════════════════════════════════
//  PROJECTS  (FastAPI + Postgres)
// ═══════════════════════════════════════════════════════════════════════
export const projects = {
  getAll: () => request(FASTAPI_BASE, '/projects'),
  getProgress: (id) => request(FASTAPI_BASE, `/projects/${id}/progress`),
};

// ═══════════════════════════════════════════════════════════════════════
//  AI REPORT PARSER – bulletproof extraction from any MCP / LLM shape
// ═══════════════════════════════════════════════════════════════════════

/** Try every strategy to pull a JS object out of a string. */
function tryParseJSON(str) {
  if (typeof str !== 'string') return null;

  // 1. Strip ALL code-fence variants (```json, ```, ~~~, etc.)
  let s = str.trim();
  s = s.replace(/^`{3,}[a-z]*\s*/i, '').replace(/\s*`{3,}\s*$/i, '');
  s = s.replace(/^~{3,}[a-z]*\s*/i, '').replace(/\s*~{3,}\s*$/i, '');
  s = s.trim();

  // 2. Direct JSON.parse
  try { return JSON.parse(s); } catch { /* continue */ }

  // 3. Extract the first { … } block using brace matching
  const start = s.indexOf('{');
  if (start !== -1) {
    let depth = 0;
    for (let i = start; i < s.length; i++) {
      if (s[i] === '{') depth++;
      else if (s[i] === '}') { depth--; if (depth === 0) {
        try { return JSON.parse(s.slice(start, i + 1)); } catch { break; }
      }}
    }
  }

  return null;
}

/** Regex-based last-resort field extractor. */
function extractFieldsViaRegex(str) {
  if (typeof str !== 'string') return null;

  const sumMatch = str.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (!sumMatch) return null;

  const summary = sumMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ');

  // Extract arrays like "highlights": ["a","b"]
  const extractArray = (key) => {
    const re = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*)\\]`);
    const m = str.match(re);
    if (!m) return [];
    const items = [];
    const itemRe = /"((?:[^"\\]|\\.)*)"/g;
    let im;
    while ((im = itemRe.exec(m[1])) !== null) {
      items.push(im[1].replace(/\\"/g, '"'));
    }
    return items;
  };

  return { summary, highlights: extractArray('highlights'), risks: extractArray('risks') };
}

export function parseAIReport(raw) {
  const EMPTY = { summary: '', highlights: [], risks: [] };
  if (!raw) return EMPTY;

  // ── String input ───────────────────────────────────────────────────
  if (typeof raw === 'string') {
    // Strategy A: parse as JSON (strips code fences automatically)
    const parsed = tryParseJSON(raw);
    if (parsed && typeof parsed === 'object') return parseAIReport(parsed);

    // Strategy B: regex-extract fields from the raw string
    const fields = extractFieldsViaRegex(raw);
    if (fields) return fields;

    // Strategy C: plain-text fallback
    // Strip leftover code-fence markers so plain text is clean
    const clean = raw
      .replace(/`{3,}json/gi, '')
      .replace(/`{3,}/g, '')
      .replace(/~{3,}/g, '')
      .trim();
    return { summary: clean, highlights: [], risks: [] };
  }

  // ── MCP protocol: { content: [{ type:"text", text:"…" }] } ────────
  if (raw.content && Array.isArray(raw.content)) {
    const textBlock = raw.content.find((c) => c.type === 'text');
    if (textBlock?.text) return parseAIReport(textBlock.text);
  }

  // ── Wrapped in a single key ────────────────────────────────────────
  for (const key of ['report', 'result', 'data', 'response', 'output', 'message', 'text', 'progress_report']) {
    if (raw[key] != null) {
      const inner = parseAIReport(raw[key]);
      if (inner.summary) return inner;
    }
  }

  // ── Already a proper { summary, highlights, risks } object ────────
  // CRITICAL: the MCP server may return an object where `summary` itself
  // contains the full LLM output as a code-fenced JSON string. Detect
  // this and parse the embedded JSON to extract real fields.
  if (typeof raw.summary === 'string') {
    const embedded = tryParseJSON(raw.summary) || extractFieldsViaRegex(raw.summary);
    if (embedded && typeof embedded === 'object' && embedded.summary && embedded.summary !== raw.summary) {
      // The summary field contained embedded JSON — use its fields instead
      return {
        summary: embedded.summary || '',
        highlights: Array.isArray(embedded.highlights) ? embedded.highlights : [],
        risks: Array.isArray(embedded.risks) ? embedded.risks : [],
        ...(embedded.contributor_summary && { contributor_summary: embedded.contributor_summary }),
        ...(embedded.velocity && { velocity: embedded.velocity }),
      };
    }
  }

  const summary = typeof raw.summary === 'string'
    ? raw.summary.replace(/`{3,}json/gi, '').replace(/`{3,}/g, '').replace(/~{3,}/g, '').trim()
    : (typeof raw.text === 'string' ? raw.text : '');
  const highlights = Array.isArray(raw.highlights) && raw.highlights.length > 0
    ? raw.highlights
    : [];
  const risks = Array.isArray(raw.risks) && raw.risks.length > 0
    ? raw.risks
    : [];

  // If we still have nothing, try JSON.stringify and regex-extract
  if (!summary && !highlights.length) {
    const asStr = JSON.stringify(raw);
    const fields = extractFieldsViaRegex(asStr);
    if (fields) return fields;
  }

  return {
    summary,
    highlights,
    risks,
    ...(raw.contributor_summary && { contributor_summary: raw.contributor_summary }),
    ...(raw.velocity && { velocity: raw.velocity }),
  };
}

// ═══════════════════════════════════════════════════════════════════════
//  GITHUB MCP SERVER  (http://localhost:3003)
// ═══════════════════════════════════════════════════════════════════════
export const github = {
  health: () => request(MCP_BASE, '/health'),

  // Commits
  getCommits: (branch = 'main', sinceDays = 7, perPage = 30) =>
    request(MCP_BASE, `/api/commits?branch=${branch}&since_days=${sinceDays}&per_page=${perPage}`),
  getCommit: (sha) => request(MCP_BASE, `/api/commits/${sha}`),
  getCommitSummary: (sha) => request(MCP_BASE, `/api/commits/${sha}/summary`),
  getCommitsSummary: (sinceDays = 7) =>
    request(MCP_BASE, `/api/commits-summary?since_days=${sinceDays}`),

  // Progress & contributors – parse AI output before returning
  getProgressReport: async (sinceDays = 7) => {
    const raw = await request(MCP_BASE, `/api/progress-report?since_days=${sinceDays}`);
    return parseAIReport(raw);
  },
  getContributors: () => request(MCP_BASE, '/api/contributors'),

  // Repo
  getRepoInfo: () => request(MCP_BASE, '/api/repo-info'),
  getCommitActivity: () => request(MCP_BASE, '/api/commit-activity'),

  // PRs & branches
  getPullRequests: (state = 'all', perPage = 10) =>
    request(MCP_BASE, `/api/pull-requests?state=${state}&per_page=${perPage}`),
  getBranches: () => request(MCP_BASE, '/api/branches'),
};

// ═══════════════════════════════════════════════════════════════════════
//  SSE STREAM  (/api/stream/dashboard)
// ═══════════════════════════════════════════════════════════════════════
export function subscribeDashboardStream(onData) {
  const es = new EventSource(`${MCP_BASE}/api/stream/dashboard`);

  es.addEventListener('commits', (e) => onData('commits', JSON.parse(e.data)));
  es.addEventListener('contributors', (e) => onData('contributors', JSON.parse(e.data)));
  es.addEventListener('branches', (e) => onData('branches', JSON.parse(e.data)));
  es.addEventListener('pull_requests', (e) => onData('pull_requests', JSON.parse(e.data)));
  es.addEventListener('repo_info', (e) => onData('repo_info', JSON.parse(e.data)));

  es.onerror = () => {
    console.warn('SSE connection lost – will auto-reconnect');
  };

  return () => es.close();
}
