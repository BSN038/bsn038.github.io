// api/ask.js  (Vercel Serverless Function - CommonJS)
const fs = require("fs");
const path = require("path");

// --- Load Knowledge Base once ---
let KB = null;
function loadKB() {
  if (KB) return KB;
  const kbPath = path.resolve(process.cwd(), "kb", "site.json");
  try {
    KB = JSON.parse(fs.readFileSync(kbPath, "utf8"));
  } catch (err) {
    console.error("KB load error:", err);
    KB = { meta: {}, sections: {}, faqs: [] };
  }
  return KB;
}

function findAnswer(q) {
  const kb = loadKB();
  const text = (q || "").toLowerCase();

  const faq = (kb.faqs || []).find(
    (f) =>
      (f.q || "").toLowerCase().includes(text) ||
      text.includes((f.q || "").toLowerCase())
  );
  if (faq) return faq.a;

  if (/\b(what is|que es|bkc)\b/i.test(q)) {
    const a = (kb.faqs || []).find((f) => /what is bkc/i.test(f.q));
    if (a) return a.a;
  }
  if (/\b(open|hours|openings?|locations?|address|where)\b/i.test(q)) {
    const s = kb.sections?.openings;
    if (s?.summary) {
      const maps = (s.map_links || [])
        .map((m) => `${m.label}: ${m.url}`)
        .join(" · ");
      return `${s.summary}${maps ? ` — ${maps}` : ""}`;
    }
  }
  if (/\b(contact|email|phone|reach)\b/i.test(q)) {
    const s = kb.sections?.contact;
    const link = s?.links?.[0]?.url || "/contact.html";
    return `${s?.summary || "Use the site’s Contact page for enquiries."} ${link}`;
  }
  if (/\bskills?\b/i.test(q)) {
    const s = kb.sections?.skills;
    if (s) return `Soft: ${s.soft.join(" ")} Hard: ${s.hard.join(" ")} More: ${s.links?.[0]?.url || "/skills.html"
      }`;
  }
  if (/\bbusiness|brand|restaurant|rotisserie|plated|storefront\b/i.test(q)) {
    const s = kb.sections?.business;
    if (s) {
      const links = (s.links || []).map((l) => `${l.label}: ${l.url}`).join(" · ");
      return `${s.summary} Highlights: ${s.highlights.join(" ")} ${links}`;
    }
  }

  const policy =
    kb.meta?.policy ||
    "Answer only using this site’s pages; if not covered, say you don’t know.";
  return `I don’t have that in my local notes. Please check: /index.html, /business.html, /skills.html, /contact.html. (${policy})`;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });

  try {
    const { message } = req.body || {};
    const reply = findAnswer(String(message || "").trim());
    return res.status(200).json({ ok: true, source: "kb", reply });
  } catch (err) {
    console.error("api/ask error:", err);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
};
