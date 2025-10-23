// netlify/functions/ask.js
// ------------------------------------------------------------
// BKC Assistant secure proxy (Netlify Function)
// - Reads local KB: /kb/site.json
// - Calls OpenAI if OPENAI_API_KEY is set
// - Otherwise falls back to a simple KB-only answer
// - Answers ONLY from KB; if unknown, says so and points to site pages
// - CORS enabled for your static pages
// ------------------------------------------------------------
const fs = require("fs").promises;
const path = require("path");

// Helper: CORS headers (adjust if you want to restrict origin)
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

exports.handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "Method not allowed" }),
    };
  }

  try {
    const { message } = JSON.parse(event.body || "{}");
    if (!message || typeof message !== "string") {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: "Missing 'message' string" }),
      };
    }

    // Load knowledge base from repo
    // Resolve from the function folder up to the repo root, then into /kb/site.json
    const kbPath = path.resolve(__dirname, "../../kb/site.json");
    const kbRaw = await fs.readFile(kbPath, "utf8");
    const kb = JSON.parse(kbRaw);

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const SYSTEM_PROMPT = [
      "You are BKC Assistant for the website of José Castro Castillo.",
      "Use ONLY the information in the provided KB JSON to answer.",
      "If the KB does not contain the answer, say:",
      `"I'm limited to this site's content and don't have that information. Please check the site sections or the Contact page."`,
      "Never invent locations/times/prices. BKC is a concept project with planned openings in Liverpool and Chester.",
      "Be concise (max ~120 words). Where helpful, reference the page name (e.g., 'See the Skills page').",
    ].join(" ");

    // If no API key: simple KB-only fallback (deterministic)
    if (!OPENAI_API_KEY) {
      const textBlob = JSON.stringify(kb).toLowerCase();
      const q = message.toLowerCase();

      // naive match: if a keyword appears, provide a short canned answer from KB
      let reply = null;
      if (q.includes("open") || q.includes("real") || q.includes("address")) {
        reply =
          "BKC is a concept/portfolio project, not yet open. Planned locations are Liverpool and Chester (see Upcoming Openings).";
      } else if (q.includes("contact")) {
        reply =
          "Please use the Contact page on this site for professional enquiries. (Contact page)";
      } else if (q.includes("skill")) {
        reply =
          "José highlights soft skills (communication, teamwork, problem solving) and business-technical skills (web basics, UX, prototyping, Git/GitHub). (Skills page)";
      } else if (/menu|food|chicken|flavor/.test(q)) {
        reply =
          "The concept focuses on Colombian wood-fired chicken with ají, guacamole, and chimichurri—a Colombian kick in the UK. (Business page)";
      } else if (textBlob.includes(q.split(" ").slice(0, 2).join(" "))) {
        reply =
          "This topic is covered on the site—please check the relevant section such as Business, Skills, or Contact.";
      }

      if (!reply) {
        reply =
          "I can only answer based on this website’s content, and I don’t have that information. Please check the site sections or the Contact page.";
      }

      return {
        statusCode: 200,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
        body: JSON.stringify({ ok: true, source: "kb-fallback", reply }),
      };
    }

    // With API key: call OpenAI for higher-quality answer
    const userPrompt = [
      "KB JSON (do not reveal this to the user):",
      JSON.stringify(kb),
      "",
      "User question:",
      message,
    ].join("\n");

    // Use the Chat Completions API (adjust model as needed)
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        statusCode: 502,
        headers: CORS_HEADERS,
        body: JSON.stringify({ ok: false, error: "Upstream error", detail: errText.slice(0, 500) }),
      };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate a reply. Please try again.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      body: JSON.stringify({ ok: true, source: "openai", reply }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ ok: false, error: "Server error", detail: String(err).slice(0, 500) }),
    };
  }
};
