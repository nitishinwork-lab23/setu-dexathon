/* ============================================================
   SETU — Phone (IVR) core: voting + complaint matching
   ------------------------------------------------------------
   Pure functions over the plain app-state object. The SAME file
   runs in the browser (window.IVR, used by the call simulator)
   and on the server (require('./js/ivr-core.js'), used by the
   /api/ivr/* webhooks), so a real telephony provider and the demo
   behave identically.

   How phone participation works
   - Every problem gets its own toll-free number (voteNumber) and a
     short code (voteCode, the last digits). Calling that number —
     or the general line and entering the code — counts as ONE vote
     from that caller for THAT problem. The same phone can still vote
     for other problems, like voting for different contestants.
   - The general 24/7 line takes new complaints. The transcript of the
     call is matched against open problems: a close match joins that
     problem's cluster (and counts as the caller's vote), otherwise a
     new problem is created and flagged for an operator to check.

   Privacy: phone numbers are never stored in full — only a masked
   form (98•••••21) and a one-way hash used to detect repeat votes.
   NOTE: the hash below is a small, fast, UNSALTED hash so it can run
   in a browser synchronously. For production use an HMAC with a
   server-side secret (crypto.createHmac) so numbers can't be guessed
   back from the hashes.
   ============================================================ */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.IVR = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const DEFAULT_PREFIX = "1800-22-";

  // ---------------------------------------------------------- phone helpers
  function normalizePhone(num) {
    let d = String(num || "").replace(/\D/g, "");
    if (d.length > 10) d = d.slice(-10); // drop +91 / 0 prefixes
    return d;
  }
  function validPhone(num) {
    return /^[6-9]\d{9}$/.test(normalizePhone(num)); // Indian mobile numbers
  }
  function hashPhone(num) {
    // two independent 32-bit FNV-1a style passes -> 16 hex chars
    const s = normalizePhone(num);
    let h1 = 0x811c9dc5, h2 = 0x01000193 ^ 0x5bd1e995;
    for (let i = 0; i < s.length; i++) {
      h1 = Math.imul(h1 ^ s.charCodeAt(i), 0x01000193) >>> 0;
      h2 = Math.imul(h2 ^ s.charCodeAt(i), 0x85ebca6b) >>> 0;
    }
    return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0");
  }
  function maskPhone(num) {
    const s = normalizePhone(num);
    return s.length >= 4 ? s.slice(0, 2) + "•••••" + s.slice(-2) : "•••";
  }

  // ----------------------------------------------- numbers / codes per problem
  function prefixOf(data) {
    return (data && data.settings && data.settings.voteNumberPrefix) || DEFAULT_PREFIX;
  }
  function codeFromId(id) {
    const n = parseInt(String(id).replace(/\D/g, ""), 10) || 0;
    return String(n).padStart(4, "0").slice(-4);
  }
  function dialDigits(s) { return String(s || "").replace(/\D/g, ""); }

  // Gives every report a voteCode/voteNumber and empty vote/call lists.
  // Safe to run repeatedly (older saved states are upgraded in place).
  function ensureFields(data) {
    if (!data) return data;
    data.settings = data.settings || {};
    if (!data.settings.voteNumberPrefix) data.settings.voteNumberPrefix = DEFAULT_PREFIX;
    if (!data.callLog) data.callLog = [];
    (data.reports || []).forEach((r) => {
      if (!r.voteCode) r.voteCode = codeFromId(r.id);
      if (!r.voteNumber) r.voteNumber = prefixOf(data) + r.voteCode;
      if (!Array.isArray(r.phoneVotes)) r.phoneVotes = [];
    });
    return data;
  }

  // Accepts the problem's own number (1800-22-0101) or just its code (0101,
  // as typed on the general line's keypad).
  function findProblem(data, dialed) {
    const d = dialDigits(dialed);
    if (!d) return null;
    return (data.reports || []).find(
      (r) => !r.spam && (dialDigits(r.voteNumber) === d || (d.length <= 4 && r.voteCode === d.padStart(4, "0")))
    ) || null;
  }

  // ------------------------------------------------------------------ votes
  function nextCallId(data) {
    // time + random so ids made by the browser demo and by the server never collide
    return "CALL-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
  }
  function logCall(data, entry) {
    const call = Object.assign(
      { id: nextCallId(data), at: new Date().toISOString(), reviewed: false },
      entry
    );
    data.callLog.unshift(call);
    return call;
  }

  // result.status: 'counted' | 'duplicate' | 'unknown_problem' | 'bad_number'
  function castVote(data, dialed, from) {
    ensureFields(data);
    if (!validPhone(from)) return { status: "bad_number" };
    const r = findProblem(data, dialed);
    if (!r) {
      logCall(data, { type: "vote", caller: maskPhone(from), dialed: String(dialed), result: "unknown_problem" });
      return { status: "unknown_problem" };
    }
    const h = hashPhone(from);
    if (r.phoneVotes.some((v) => v.h === h)) {
      const call = logCall(data, { type: "vote", caller: maskPhone(from), dialed: r.voteNumber, reportId: r.id, result: "duplicate" });
      return { status: "duplicate", report: r, call };
    }
    r.phoneVotes.push({ h, m: maskPhone(from), at: new Date().toISOString() });
    r.supports = (r.supports || 0) + 1;
    const call = logCall(data, { type: "vote", caller: maskPhone(from), dialed: r.voteNumber, reportId: r.id, result: "counted" });
    return { status: "counted", report: r, call };
  }

  // -------------------------------------------------------- complaint matching
  const STOP = new Set((
    "a an the is are was were be been of in on at to for from and or but with without near by it its this that these those " +
    "i we you they he she my our your their there here very not no has have had do does did can could will would since about " +
    "again also just still please sir madam hai hain ka ki ke ko me mein se par aur hum mera mere nahi nahin raha rahi rahe"
  ).split(/\s+/));

  function stem(w) {
    return w.replace(/(ing|ed|es|s)$/, (m, x, off) => (off >= 3 ? "" : m));
  }
  function tokens(text) {
    return String(text || "")
      .toLowerCase()
      .split(/[^a-z0-9ऀ-ॿঀ-৿]+/)
      .filter((w) => w.length > 2 && !STOP.has(w))
      .map(stem);
  }

  // Keyword hints (English + common Hindi/Hinglish words) so a spoken
  // complaint can be put in the right domain even if no problem matches.
  const DOMAIN_WORDS = {
    Water: "water pani पानी tank tap pipe borewell handpump drinking sewage drain leak supply जल নল জল",
    Infrastructure: "road sadak सड़क streetlight light bijli बिजली electricity pole bridge pothole drain building",
    Agriculture: "crop paddy fasal फसल farm seed fertilizer irrigation kheti खेती pest disease",
    Education: "school teacher class student book mid-day midday शिक्षक स्कूल",
    Health: "hospital clinic doctor medicine dispensary ambulance fever dengue malaria अस्पताल",
    Environment: "garbage waste kooda कचरा pollution smoke tree burning dump plastic",
  };
  function detectDomain(text) {
    const t = new Set(tokens(text));
    let best = null, bestN = 0;
    Object.keys(DOMAIN_WORDS).forEach((d) => {
      const n = DOMAIN_WORDS[d].split(/\s+/).filter((w) => t.has(stem(w.toLowerCase()))).length;
      if (n > bestN) { best = d; bestN = n; }
    });
    return best || "Other";
  }

  function similarity(textA, textB) {
    const A = new Set(tokens(textA)), B = new Set(tokens(textB));
    if (!A.size || !B.size) return { score: 0, shared: 0 };
    let shared = 0;
    A.forEach((w) => { if (B.has(w)) shared++; });
    return { score: shared / Math.sqrt(A.size * B.size), shared };
  }

  const MATCH_MIN_SCORE = 0.22;
  const MATCH_MIN_SHARED = 2;

  // Best existing open problem for a spoken/typed complaint, or null.
  function matchComplaint(data, transcript) {
    const domain = detectDomain(transcript);
    let best = null;
    (data.reports || []).forEach((r) => {
      if (r.spam || r.status === "done") return;
      if (domain !== "Other" && r.domain !== domain) return;
      const s = similarity(transcript, `${r.title} ${r.desc} ${r.area}`);
      if (s.shared >= MATCH_MIN_SHARED && s.score >= MATCH_MIN_SCORE && (!best || s.score > best.score)) {
        best = { report: r, score: s.score, shared: s.shared };
      }
    });
    return best;
  }

  function isoDate(offsetDays) {
    const d = new Date(); d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
  }

  // The caller has described a problem on the general complaint line.
  // action: 'joined' (existing cluster) | 'created' (new problem) | 'bad_number' | 'empty'
  function fileComplaint(data, from, transcript, opts) {
    opts = opts || {};
    ensureFields(data);
    const text = String(transcript || "").trim();
    if (!validPhone(from)) return { action: "bad_number" };
    if (text.length < 8) return { action: "empty" };

    const m = matchComplaint(data, text);
    const h = hashPhone(from);

    if (m) {
      const r = m.report;
      const dup = r.phoneVotes.some((v) => v.h === h);
      if (!dup) {
        r.phoneVotes.push({ h, m: maskPhone(from), at: new Date().toISOString() });
        r.supports = (r.supports || 0) + 1;
      }
      r.clusterOf = (r.clusterOf || 1) + (dup ? 0 : 1);
      r.helplineCalls = (r.helplineCalls || 0) + 1;
      const call = logCall(data, {
        type: "complaint", caller: maskPhone(from), transcript: text, lang: opts.lang || "",
        reportId: r.id, result: dup ? "joined_duplicate" : "joined", matchScore: Math.round(m.score * 100),
      });
      return { action: "joined", report: r, call, duplicate: dup, score: m.score };
    }

    // No match -> brand-new problem, reviewed by an operator
    const domain = detectDomain(text);
    const n = (data.reports || []).reduce((mx, r) => Math.max(mx, parseInt(String(r.id).replace(/\D/g, ""), 10) || 0), 100) + 1;
    const title = text.length > 70 ? text.slice(0, 67).replace(/\s+\S*$/, "") + "…" : text;
    const r = {
      id: "R-" + n,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      area: opts.area || "To be confirmed by operator",
      desc: text,
      domain,
      priority: "Medium",
      status: "pending",
      due: isoDate(10),
      citizen: "Phone caller " + maskPhone(from),
      supports: 1,
      hasPhoto: false, hasLocation: false, hasAudio: true,
      image: null,
      created: isoDate(0),
      stage: 1,
      clusterOf: 1,
      gate: null,
      spam: false,
      source: "helpline",
      needsOperatorReview: true,
      audioTranscript: text,
      audioTranscriptLang: opts.lang || "",
      phoneVotes: [{ h, m: maskPhone(from), at: new Date().toISOString() }],
    };
    (data.reports = data.reports || []).unshift(r);
    ensureFields(data);
    const call = logCall(data, {
      type: "complaint", caller: maskPhone(from), transcript: text, lang: opts.lang || "",
      reportId: r.id, result: "created",
    });
    return { action: "created", report: r, call };
  }

  // ---------------------------------------------------------------- merge
  // The server receives whole-state snapshots from browsers while phone
  // webhooks change the same file. Before a snapshot overwrites the file,
  // fold the phone-owned data (votes, helpline-created problems, call log)
  // of the existing state back in so a stale browser can't erase votes.
  function mergePhoneData(existing, incoming) {
    if (!existing || !incoming) return incoming;
    const byId = {};
    (incoming.reports || []).forEach((r) => (byId[r.id] = r));
    (existing.reports || []).forEach((e) => {
      const i = byId[e.id];
      if (!i) {
        if (e.source === "helpline") { (incoming.reports = incoming.reports || []).unshift(e); byId[e.id] = e; }
        return;
      }
      const have = new Set((i.phoneVotes || []).map((v) => v.h));
      const extra = (e.phoneVotes || []).filter((v) => !have.has(v.h));
      if (extra.length) {
        i.phoneVotes = (i.phoneVotes || []).concat(extra);
        i.supports = (i.supports || 0) + extra.length;
      }
      if ((e.clusterOf || 1) > (i.clusterOf || 1)) i.clusterOf = e.clusterOf;
      if ((e.helplineCalls || 0) > (i.helplineCalls || 0)) i.helplineCalls = e.helplineCalls;
    });
    const seen = new Set((incoming.callLog || []).map((c) => c.id));
    const extraCalls = (existing.callLog || []).filter((c) => !seen.has(c.id));
    if (extraCalls.length) {
      incoming.callLog = (incoming.callLog || []).concat(extraCalls)
        .sort((a, b) => String(b.at).localeCompare(String(a.at)));
    }
    return incoming;
  }

  return {
    DEFAULT_PREFIX, normalizePhone, validPhone, hashPhone, maskPhone,
    ensureFields, findProblem, castVote, fileComplaint, matchComplaint,
    detectDomain, similarity, mergePhoneData, tokens,
  };
});
