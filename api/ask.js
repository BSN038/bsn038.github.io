// api/ask.js  (Vercel Serverless Function - CommonJS)
const fs = require("fs");
const path = require("path");

// --- Load Knowledge Base once (robust path resolution) ---
let KB = null;

function resolveKBPath() {
  const candidates = [
    // When Vercel bundles includeFiles into the function folder:
    path.join(__dirname, "kb", "site.json"),
    // When the function code lives in /api and kb is one level up:
    path.join(__dirname, "..", "kb", "site.json"),
    // When the working dir is the project root:
    path.join(process.cwd(), "kb", "site.json"),
    // Generic fallback:
    path.resolve("kb", "site.json"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (_) { }
  }
  return null;
}

function loadKB() {
  if (KB) return KB;

  const kbPath = resolveKBPath();
  if (!kbPath) {
    console.error(
      "KB path not found. Tried __dirname/kb, __dirname/../kb, cwd/kb, and root/kb."
    );
    KB = { meta: {}, sections: {}, faqs: [] };
    return KB;
  }

  try {
    const raw = fs.readFileSync(kbPath, "utf8");
    KB = JSON.parse(raw);
  } catch (err) {
    console.error("KB load error:", err);
    KB = { meta: {}, sections: {}, faqs: [] };
  }
  return KB;
}

// --- Simple matcher over the KB ---
function findAnswer(q) {
  const kb = loadKB();
  const text = String(q || "").toLowerCase();

  // 1) Exact/contains on FAQs
  const faq = (kb.faqs || []).find((f) => {
    const fq = String(f.q || "").toLowerCase();
    return fq.includes(text) || text.includes(fq);
  });
  if (faq) return faq.a;

  // 2) Light-weight routing by keywords
  if (/\b(what\s+is|qué\s+es|que\s+es|bkc)\b/i.test(text)) {
    const a = (kb.faqs || []).find((f) => /what is bkc/i.test(f.q || ""));
    if (a) return a.a;
  }

  if (/\b(open|hours|opening|openings?|location|locations?|address|where)\b/i.test(text)) {
    const s = kb.sections?.openings;
    if (s?.summary) {
      const maps = (s.map_links || [])
        .map((m) => `${m.label}: ${m.url}`)
        .join(" · ");
      return `${s.summary}${maps ? ` — ${maps}` : ""}`;
    }
  }

  if (/\b(contact|email|phone|reach)\b/i.test(text)) {
    const s = kb.sections?.contact;
    const link = s?.links?.[0]?.url || "/contact.html";
    return `${s?.summary || "Use the site’s Contact page for enquiries."} ${link}`;
  }

  if (/\bskills?\b/i.test(text)) {
    const s = kb.sections?.skills;
    if (s) {
      const soft = Array.isArray(s.soft) ? s.soft.join(", ") : "";
      const hard = Array.isArray(s.hard) ? s.hard.join(", ") : "";
      const more = s.links?.[0]?.url || "/skills.html";
      return `Soft: ${soft}. Hard: ${hard}. More: ${more}`;
    }
  }

  if (/\b(business|brand|restaurant|rotisserie|plated|storefront)\b/i.test(text)) {
    const s = kb.sections?.business;
    if (s) {
      const links = (s.links || []).map((l) => `${l.label}: ${l.url}`).join(" · ");
      const highlights = Array.isArray(s.highlights) ? s.highlights.join(", ") : "";
      return `${s.summary} Highlights: ${highlights}. ${links}`;
    }
  }

  // 3) Fallback policy
  const policy =
    kb.meta?.policy ||
    "Answer only using this site’s pages; if not covered, say you don’t know.";
  return `I don’t have that in my local notes. Please check: /index.html, /business.html, /skills.html, /contact.html. (${policy})`;
}

// --- Vercel handler ---
module.exports = async function handler(req, res) {
  // CORS (safe for this project)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const { message } = req.body || {};
    const reply = findAnswer(String(message || "").trim());
    return res.status(200).json({ ok: true, source: "kb", reply });
  } catch (err) {
    console.error("api/ask error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};
