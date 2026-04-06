// ── FastAPI Backend (proxied through Vite in dev) ─────────────────────
const FASTAPI_BASE = import.meta.env.VITE_FASTAPI_URL || '';

// MCP_BASE kept for reference only – all GitHub calls now go through FastAPI
// const MCP_BASE = import.meta.env.VITE_MCP_URL || '/mcp';

// ═══════════════════════════════════════════════════════════════════════
//  IN-MEMORY CACHE  – stale-while-revalidate
// ═══════════════════════════════════════════════════════════════════════
const _cache = new Map();           // key → { data, ts }
const _inflight = new Map();        // key → Promise (dedup concurrent calls)
const DEFAULT_TTL = 15_000;         // 15s – stale quickly for live feel
const HARD_TTL   = 45_000;          // 45s – fully expire fast

function cacheKey(base, path) { return `${base}${path}`; }

function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  const age = Date.now() - entry.ts;
  if (age > HARD_TTL) { _cache.delete(key); return null; }
  return { data: entry.data, stale: age > DEFAULT_TTL };
}

function setCache(key, data) {
  _cache.set(key, { data, ts: Date.now() });
}

/** Clear cache for a specific key or prefix */
export function invalidateCache(prefix) {
  if (!prefix) { _cache.clear(); return; }
  for (const k of _cache.keys()) {
    if (k.startsWith(prefix)) _cache.delete(k);
  }
}

// ── Generic fetch wrapper with auto-retry ─────────────────────────────
async function request(base, path, options = {}) {
  const token = localStorage.getItem('token');
  const method = (options.method || 'GET').toUpperCase();
  const isBodyRequest = method !== 'GET' && method !== 'HEAD';
  const maxRetries = isBodyRequest ? 0 : 2; // only retry GETs

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000); // 10s – fail fast

    try {
      const res = await fetch(`${base}${path}`, {
        headers: {
          ...(isBodyRequest ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
        ...options,
        signal: options.signal || controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Request failed');
      }
      return res.json();
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      // Don't retry if it was intentionally aborted by caller
      if (options.signal?.aborted) throw err;
      console.warn(`[API] ${base}${path} attempt ${attempt + 1}/${maxRetries + 1} failed:`, err.message);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1))); // 500ms, 1s
      }
    }
  }
  throw lastError;
}

/**
 * Cached GET wrapper. Returns cached data instantly if available,
 * and revalidates in the background if stale.
 * For non-GET requests, falls through to raw request().
 */
async function cachedGet(base, path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (method !== 'GET') return request(base, path, options);

  const key = cacheKey(base, path);
  const cached = getCached(key);

  // If fresh cache exists, return immediately
  if (cached && !cached.stale) return cached.data;

  // If stale cache exists, return it AND revalidate in background
  if (cached && cached.stale) {
    // Background refresh (fire and forget)
    if (!_inflight.has(key)) {
      const p = request(base, path, options)
        .then((data) => { setCache(key, data); return data; })
        .finally(() => _inflight.delete(key));
      _inflight.set(key, p);
    }
    return cached.data;
  }

  // No cache – deduplicate concurrent identical requests
  if (_inflight.has(key)) return _inflight.get(key);

  const p = request(base, path, options)
    .then((data) => { setCache(key, data); return data; })
    .finally(() => _inflight.delete(key));
  _inflight.set(key, p);
  return p;
}

// ═══════════════════════════════════════════════════════════════════════
//  AUTH  (FastAPI + Postgres)
// ═══════════════════════════════════════════════════════════════════════
export const auth = {
  login: (username, password) => {
    const body = new URLSearchParams();
    body.append('username', username);
    body.append('password', password);

    return fetch(`${FASTAPI_BASE}/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || 'Login failed');
      }
      return res.json();
    });
  },
  me: () => cachedGet(FASTAPI_BASE, '/auth/me'),
};

// ═══════════════════════════════════════════════════════════════════════
//  TASKS  (FastAPI + Postgres)
// ═══════════════════════════════════════════════════════════════════════
export const tasks = {
  getAll: () => cachedGet(FASTAPI_BASE, '/tasks'),
  getMyTasks: () => cachedGet(FASTAPI_BASE, '/tasks/me'),
  create: (payload) =>
    request(FASTAPI_BASE, '/tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  assignNL: (text) =>
    request(FASTAPI_BASE, '/api/tasks/assign-nl', {
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
  getAll: () => cachedGet(FASTAPI_BASE, '/developers'),
  getStats: (id) => cachedGet(FASTAPI_BASE, `/developers/${id}/stats`),
};

// ═══════════════════════════════════════════════════════════════════════
//  MEETINGS  (FastAPI + Postgres)
// ═══════════════════════════════════════════════════════════════════════
export const meetings = {
  getSummaries: () => cachedGet(FASTAPI_BASE, '/meetings/summaries'),
};

// ═══════════════════════════════════════════════════════════════════════
//  PROJECTS  (FastAPI + Postgres)
// ═══════════════════════════════════════════════════════════════════════
export const projects = {
  getAll: () => cachedGet(FASTAPI_BASE, '/projects'),
  getProgress: (id) => cachedGet(FASTAPI_BASE, `/projects/${id}/progress`),
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
//  SRS UPLOAD  (FastAPI)
// ═══════════════════════════════════════════════════════════════════════
export const srs = {
  upload: async (file) => {
    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${FASTAPI_BASE}/srs/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },
};

// ═══════════════════════════════════════════════════════════════════════
//  JIRA  (FastAPI proxy)
// ═══════════════════════════════════════════════════════════════════════
export const jira = {
  getProject:      () => cachedGet(FASTAPI_BASE, '/api/jira/projects'),
  getTickets:      () => cachedGet(FASTAPI_BASE, '/api/jira/tickets'),
  getBoardSummary: () => cachedGet(FASTAPI_BASE, '/api/jira/board/summary'),
  getSprints:      () => cachedGet(FASTAPI_BASE, '/api/jira/sprints'),
  getUsers:        () => cachedGet(FASTAPI_BASE, '/api/jira/users'),
};

// ═══════════════════════════════════════════════════════════════════════
//  CONFLUENCE  (FastAPI proxy)
// ═══════════════════════════════════════════════════════════════════════
export const confluence = {
  getSpace: () => cachedGet(FASTAPI_BASE, '/api/confluence/space'),
  getPages: () => cachedGet(FASTAPI_BASE, '/api/confluence/pages'),
};

// ═══════════════════════════════════════════════════════════════════════
//  GITHUB  (FastAPI proxy – /api/github/*)
// ═══════════════════════════════════════════════════════════════════════
export const github = {
  health: () => cachedGet(FASTAPI_BASE, '/api/github/health'),

  // Commits
  getCommits: (branch = 'main', sinceDays = 7, perPage = 30) =>
    cachedGet(FASTAPI_BASE, `/api/github/commits?branch=${branch}&since_days=${sinceDays}&per_page=${perPage}`),
  getCommit: (sha) => cachedGet(FASTAPI_BASE, `/api/github/commits/${sha}`),
  getCommitSummary: (sha) => cachedGet(FASTAPI_BASE, `/api/github/commits/${sha}/summary`),
  getCommitsSummary: (sinceDays = 7) =>
    cachedGet(FASTAPI_BASE, `/api/github/commits-summary?since_days=${sinceDays}`),

  // Progress & contributors – parse AI output before returning
  getProgressReport: async (sinceDays = 7) => {
    const raw = await cachedGet(FASTAPI_BASE, `/api/github/progress-report?since_days=${sinceDays}`);
    return parseAIReport(raw);
  },
  getContributors: () => cachedGet(FASTAPI_BASE, '/api/github/contributors'),

  // Repo
  getRepoInfo: () => cachedGet(FASTAPI_BASE, '/api/github/repo-info'),
  getCommitActivity: () => cachedGet(FASTAPI_BASE, '/api/github/commit-activity'),

  // PRs & branches
  getPullRequests: (state = 'all', perPage = 10) =>
    cachedGet(FASTAPI_BASE, `/api/github/pull-requests?state=${state}&per_page=${perPage}`),
  getBranches: () => cachedGet(FASTAPI_BASE, '/api/github/branches'),
};


