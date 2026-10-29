/* SETU backend — Node stdlib only, no dependencies, no build step.
   Serves the static app and persists the shared app state to data.json.

   ponytail: the whole app state is one JSON blob, last-write-wins. Fine for a
   demo on one LAN. Split into per-table routes + a real DB when two officials
   editing at once starts clobbering each other. */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const IVR = require("./js/ivr-core.js"); // same code the browser demo runs

const ROOT = __dirname;
const STATE_FILE = path.join(ROOT, "data.json");
const PORT = process.env.PORT || 3000;
const MAX_BODY = 25 * 1024 * 1024; // camera photos are stored as data URLs
// Phone webhooks are refused unless this is set, so nobody can stuff the vote
// board by posting to /api/ivr/*. Give the same value to your telephony provider.
const IVR_SECRET = process.env.IVR_SECRET || "";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function readBody(req, cb) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > MAX_BODY) {
      req.destroy();
      cb(new Error("body too large"));
    }
  });
  req.on("end", () => cb(null, body));
}

// ---- phone (IVR) webhooks ---------------------------------------------
// A telephony provider (Exotel, Knowlarity, Twilio, ...) calls these when
// someone dials a problem's number or the general complaint line.
//   POST /api/ivr/vote      { to | code, from }        -> one vote per phone per problem
//   POST /api/ivr/complaint { from, transcript, lang } -> joins a cluster or opens a problem
// Body may be JSON or form-encoded. Auth: header x-ivr-secret or ?secret=.
function parseParams(body, ct) {
  if (/json/.test(ct || "")) { try { return JSON.parse(body || "{}"); } catch { return null; } }
  return Object.fromEntries(new URLSearchParams(body || ""));
}
function secretOk(req, url) {
  if (!IVR_SECRET) return false;
  const given = String(req.headers["x-ivr-secret"] || new URL(url, "http://x").searchParams.get("secret") || "");
  const a = Buffer.from(given), b = Buffer.from(IVR_SECRET);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function sendJson(res, code, obj) {
  res.writeHead(code, { "Content-Type": MIME[".json"] });
  res.end(JSON.stringify(obj));
}
function writeState(data) {
  const tmp = STATE_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data));
  fs.renameSync(tmp, STATE_FILE);
}
function handleIvr(req, res) {
  const route = req.url.split("?")[0];
  if (req.method !== "POST") return res.writeHead(405).end();
  if (!IVR_SECRET) return sendJson(res, 503, { error: "IVR_SECRET is not set on the server" });
  if (!secretOk(req, req.url)) return sendJson(res, 401, { error: "bad secret" });
  if (!fs.existsSync(STATE_FILE)) return sendJson(res, 409, { error: "no state yet — open the app once first" });
  readBody(req, (err, body) => {
    if (err) return sendJson(res, 413, { error: "too large" });
    const p = parseParams(body, req.headers["content-type"]);
    if (!p) return sendJson(res, 400, { error: "invalid json" });
    const from = p.from || p.From || p.CallFrom || "";
    let data;
    try { data = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { return sendJson(res, 500, { error: "state unreadable" }); }
    IVR.ensureFields(data);
    let out;
    if (route === "/api/ivr/vote") {
      const r = IVR.castVote(data, p.to || p.To || p.CallTo || p.code || "", from);
      out = { status: r.status, problem: r.report && r.report.id, votes: r.report && r.report.supports };
    } else {
      const r = IVR.fileComplaint(data, from, p.transcript || p.SpeechResult || "", { lang: p.lang || "" });
      out = { status: r.action, problem: r.report && r.report.id, number: r.report && r.report.voteNumber, votes: r.report && r.report.supports };
    }
    try { writeState(data); } catch { return sendJson(res, 500, { error: "write failed" }); }
    sendJson(res, 200, out);
  });
}

const server = http.createServer((req, res) => {
  if (req.url.split("?")[0] === "/api/ivr/vote" || req.url.split("?")[0] === "/api/ivr/complaint") return handleIvr(req, res);
  // ---- state API ----
  if (req.url === "/api/state") {
    if (req.method === "GET") {
      // 204 = nothing saved yet, client seeds itself from data.js
      if (!fs.existsSync(STATE_FILE)) return res.writeHead(204).end();
      res.writeHead(200, { "Content-Type": MIME[".json"] });
      return fs.createReadStream(STATE_FILE).pipe(res);
    }
    if (req.method === "PUT") {
      return readBody(req, (err, body) => {
        if (err) return res.writeHead(413).end("too large");
        let incoming;
        try {
          incoming = JSON.parse(body); // reject anything that isn't valid JSON
        } catch {
          return res.writeHead(400).end("invalid json");
        }
        // Phone votes/calls arrive through the webhooks while browsers send whole
        // snapshots: fold the phone-owned data in so a stale browser can't erase it.
        try {
          if (fs.existsSync(STATE_FILE)) {
            const existing = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
            if (incoming && Array.isArray(incoming.reports)) body = JSON.stringify(IVR.mergePhoneData(existing, incoming));
          }
        } catch { /* unreadable old state: just take the new one */ }
        // write-then-rename so a crash mid-write can't truncate the state
        const tmp = STATE_FILE + ".tmp";
        fs.writeFile(tmp, body, (e) => {
          if (e) return res.writeHead(500).end("write failed");
          fs.rename(tmp, STATE_FILE, (e2) =>
            e2 ? res.writeHead(500).end("write failed") : res.writeHead(204).end()
          );
        });
      });
    }
    return res.writeHead(405).end();
  }

  // ---- static files ----
  const url = decodeURIComponent(req.url.split("?")[0]);
  const file = path.join(ROOT, url === "/" ? "index.html" : url);
  if (!file.startsWith(ROOT) || file === STATE_FILE) {
    return res.writeHead(403).end("forbidden");
  }
  fs.readFile(file, (err, buf) => {
    if (err) return res.writeHead(404).end("not found");
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(buf);
  });
});

server.listen(PORT, () => console.log(`Setu running on http://localhost:${PORT}`));
