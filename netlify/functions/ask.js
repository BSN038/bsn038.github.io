// netlify/functions/ask.js
/* Simple BKC Assistant proxy using the local KB (kb/site.json).
   No external API calls; answers only from your repo content. */

const fs = require('fs');
const path = require('path');

// ---- Load knowledge base once (on cold start) ----
let KB = null;
function loadKB() {
  if (KB) return KB;
  const kbPath = path.resolve(process.cwd(), 'kb', 'site.json');
  try {
    const raw = fs.readFileSync(kbPath, 'utf8');
    KB = JSON.parse(raw);
  } catch (err) {
    KB = { meta: {}, sections: {}, faqs: [] };
    console.error('KB load error:', err);
  }
  return KB;
}

// ---- Very small matcher over sections + FAQs ----
function findAnswer(q) {
  const kb = loadKB();
  const text = (q || '').toLowerCase();

  // 1) Exact/near FAQ match
  const faq = (kb.faqs || []).find(f =>
    (f.q || '').toLowerCase().includes(text) ||
    text.includes((f.q || '').toLowerCase())
  );
  if (faq) return faq.a;

  // 2) Keyword routes
  if (/\b(what is|que es|bkc)\b/i.test(q)) {
    const a = (kb.faqs || []).find(f => /what is bkc/i.test(f.q));
    if (a) return a.a;
  }
  if (/\b(open|hours|openings?|locations?|address|where)\b/i.test(q)) {
    const s = kb.sections?.openings;
    if (s?.summary) {
      const maps = (s.map_links || []).map(m => `${m.label}: ${m.url}`).join(' · ');
      return `${s.summary}${maps ? ` — ${maps}` : ''}`;
    }
  }
  if (/\b(contact|email|phone|reach)\b/i.test(q)) {
    const s = kb.sections?.contact;
    const link = s?.links?.[0]?.url || '/contact.html';
    return `${s?.summary || 'Use the site’s Contact page for enquiries.'} ${link}`;
  }
  if (/\bskills?\b/i.test(q)) {
    const s = kb.sections?.skills;
    if (s) {
      return `Soft: ${s.soft.join(' ')} Hard: ${s.hard.join(' ')} More: ${s.links?.[0]?.url || '/skills.html'}`;
    }
  }
  if (/\bbusiness|brand|restaurant|rotisserie|plated|storefront\b/i.test(q)) {
    const s = kb.sections?.business;
    if (s) {
      const links = (s.links || []).map(l => `${l.label}: ${l.url}`).join(' · ');
      return `${s.summary} Highlights: ${s.highlights.join(' ')} ${links}`;
    }
  }

  // 3) Default policy
  const policy = kb.meta?.policy ||
    "Answer only using this site’s pages; if not covered, say you don’t know.";
  return `I don’t have that in my local notes. Please check: /index.html, /business.html, /skills.html, /contact.html. (${policy})`;
}

// ---- CORS helper ----
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Method Not Allowed' }) };
  }

  try {
    const { message } = JSON.parse(event.body || '{}');
    const reply = findAnswer(String(message || '').trim());
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, source: 'kb', reply })
    };
  } catch (err) {
    console.error('ask.js error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: 'Server error' })
    };
  }
};
