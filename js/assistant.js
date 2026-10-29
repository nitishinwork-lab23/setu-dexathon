/* ============================================================
   SETU Assistant — help chatbot on every screen
   ------------------------------------------------------------
   Answers doubts about using Setu (how to report, what a status
   means, who is responsible, how phone voting works…) and looks up
   live facts about a problem when asked ("status of R-104").

   Works fully offline: answers come from the built-in knowledge base
   below plus live data from DB — there is no API key or network call,
   so it can never show an error during a demo. To plug in a real LLM
   later, replace `answer()` and keep the same { text, go, related }
   return shape.

   Voice: the mic button uses speech-to-text, and every answer has a
   Listen button (text-to-speech) for people who find reading hard.
   ============================================================ */

const Assistant = {
  MODES: {
    citizen:    { label: 'Citizen help',            roles: ['citizen'] },
    government: { label: 'Government & departments', roles: ['government', 'admin'] },
    university: { label: 'University & students',   roles: ['university', 'student'] },
    industry:   { label: 'Industry & CSR',          roles: ['industry'] },
  },

  // keys: words/phrases (English, Hindi, Bengali) that point to this answer.
  // modes: which modes it belongs to ([] = every mode).  go: optional shortcut button.
  KB: [
    { id:'report', modes:['citizen'], q:'How do I report a problem?',
      keys:['report a problem','how to report','file complaint','raise complaint','submit problem','new report','report','complaint','complain','file','शिकायत','रिपोर्ट','समस्या','दर्ज','অভিযোগ'],
      a:"**To report a problem:**\n1. Open **Report a Problem** in the menu.\n2. Write a short **title** and say what is happening, since when, and who is affected. Tap **Speak instead of typing** if you prefer to talk.\n3. Choose the **domain** (water, roads, farming…) and type your **area**.\n4. Add a **photo**, **voice note** or **location** if you can — it helps reviewers act faster.\n5. Slide **Affected people** to your best guess and press **Submit report**.\n\nYou get a problem ID like R-104. No smartphone? Call the toll-free helpline instead.",
      go:{ role:'citizen', view:'report', label:'Open Report a Problem' } },
    { id:'helpline', modes:['citizen'], q:'I can’t use the app — can I call?',
      keys:['smartphone','no smartphone','keypad','basic phone','feature phone','no internet','without internet','dont have','do not have','cant use','cannot use app','dont have phone','helpline','toll free','tollfree','call','phone number','illiterate','cannot read','cant read','कॉल','फोन','टोल','हेल्पलाइन'],
      a:"Yes. Call the **toll-free helpline** (shown in the left menu and on the **Vote & call** page) any time — it is free and open 24×7. Describe the problem in your own language. If it matches a problem already reported, you are added to it; if it is new, a new problem is opened for you and an operator confirms the location.",
      go:{ role:'citizen', view:'phone', label:'Open Vote & call' } },
    { id:'phonevote', modes:['citizen'], q:'How does voting by phone work?',
      keys:['vote','voting','phone vote','support by phone','missed call','one vote','number for problem','unique number','वोट','समर्थन','ভোট'],
      a:"Every problem has its **own free number** (for example 1800-22-0104). Call it once and your vote is counted — like voting for a favourite contestant. Each phone can vote **once per problem**, but you can vote for as many different problems as you like. Repeat calls are ignored, and your number is stored only in masked form.",
      go:{ role:'citizen', view:'phone', label:'See the vote board' } },
    { id:'lowdata', modes:['citizen'], q:'Slow internet — what should I do?',
      keys:['slow internet','low data','low bandwidth','data saver','2g','3g','weak network','compress','data usage','इंटरनेट','डेटा','ডেটা'],
      a:"Turn on **Low data** in the top bar. Setu then skips remote photos, map tiles and fonts, shrinks your photos to a few KB before saving, and uses your phone’s voice typing instead of uploading audio. It switches on by itself on Data Saver, 2G or 3G.\n\nStill too slow? Use the toll-free helpline — no data needed." },
    { id:'voice', modes:['citizen'], q:'Can I speak instead of typing?',
      keys:['voice','speak','talk','dictate','mic','microphone','read aloud','listen','audio','बोल','आवाज','सुन','কথা'],
      a:"Yes. On the report form tap **Speak instead of typing** and talk in your language — the phone types it for you and no audio is uploaded. You can also record a **voice note**. Every problem card, answer and accountability row has a **Listen** button that reads it aloud." },
    { id:'photo', modes:['citizen'], q:'How do I add a photo or location?',
      keys:['photo','picture','camera','image','evidence','gps','location','attach','फोटो','तस्वीर','लोकेशन','ছবি'],
      a:"On the report form use **Attach photo** (opens your camera) and **Attach location** (uses your phone’s GPS — allow the permission when asked). Photos are compressed automatically. If you skip location, reviewers see an estimate based on the area you typed, marked as *estimated*." },
    { id:'stages', modes:['citizen'], q:'What do the status stages mean?',
      keys:['status','stage','stages','received','verified','assigned','development','pilot','resolved','progress meaning','मतलब','स्थिति','অবস্থা'],
      a:"**Received** – your report is in.\n**Verified** – a reviewer checked it is genuine.\n**Assigned** – a department or a university team owns it.\n**In Development** – a fix is being designed or built.\n**Pilot** – the fix is being tried on the ground.\n**Resolved** – the fix is in place and impact is verified.\n\nOpen **View Progress** to see where each of your reports stands.",
      go:{ role:'citizen', view:'progress', label:'Open View Progress' } },
    { id:'track', modes:['citizen'], q:'How do I track my report?',
      keys:['track','my report','where is my','check status','follow up','trace','मेरी रिपोर्ट','ट्रैक'],
      a:"Open **My Reports** for a list, or **View Progress** for a step-by-step timeline of each one. You can also type a problem ID here, like **R-104**, and I’ll tell you its status, who is responsible and how many days late it is.",
      go:{ role:'citizen', view:'myreports', label:'Open My Reports' } },
    { id:'accountability', modes:['citizen','government'], q:'Who is responsible and how late is it?',
      keys:['responsible','accountable','accountability','authority','officer','who is','delay','delayed','late','days late','overdue','जिम्मेदार','देरी','দায়ী'],
      a:"Every open problem names the **officer responsible** and shows **how many days past the promised date** it is. The **Accountability** page groups this per officer, with their average delay and how many late problems they have replied to. An officer can explain a delay (leave, out of station, someone else in temporary charge) but the explanation **never hides the delay count**.",
      go:{ role:'citizen', view:'accountability', label:'Open Accountability' } },
    { id:'support', modes:['citizen'], q:'What does the heart / “I also face this” do?',
      keys:['support','heart','also face','like','upvote','back this','backing','affected people','समर्थन'],
      a:"Tapping the heart adds **your support** to a problem, which helps reviewers see how many people are affected. You can support each problem once. Supporting by phone counts the same way." },
    { id:'cluster', modes:[], q:'What is a cluster?',
      keys:['cluster','duplicate','same problem','merged','merge','grouped','similar'],
      a:"A **cluster** groups reports of the **same problem** — for example five households reporting one broken pipe. The number on the card, **Cluster (4)**, is how many reports are in the group. Clustering stops duplicate work and shows the real size of the issue. Calls to the helpline that match an existing problem join its cluster too." },
    { id:'spam', modes:['citizen','government'], q:'Why was my report flagged?',
      keys:['spam','flagged','fake','suspicious','rejected','not showing','not visible','blocked'],
      a:"Reports are checked by an AI filter for spam and suspicious wording (all caps, ads, gibberish, very short or no evidence). A flagged report is not deleted — a government reviewer checks it and either **approves** it or confirms it as spam. To avoid a flag, describe the problem clearly and add a photo or location." },
    { id:'priority', modes:['citizen','government'], q:'How is priority decided?',
      keys:['priority','urgent','high priority','medium','low priority','severity','प्राथमिकता'],
      a:"The AI suggests **High / Medium / Low** from how serious the problem is and how many people it affects. A government reviewer can always override it. Higher priority goes to a higher officer (Village Officer → Tahsildar → Sub-Collector → District Collector)." },
    { id:'howlong', modes:['citizen'], q:'How long will it take to fix?',
      keys:['how long','time','when will','eta','due date','deadline','कब तक','कितना समय'],
      a:"Each report gets a **due date** (10 days by default). Simple fixes follow the normal government workflow; harder ones go through the university innovation pipeline, which takes longer. If the due date passes, the card shows **days late** and the officer’s explanation." },
    { id:'edit', modes:['citizen'], q:'Can I edit or delete my report?',
      keys:['edit','delete','remove','change report','withdraw','cancel report','modify'],
      a:"Editing or withdrawing a report is **not available yet**. If you made a mistake, submit a corrected report or call the helpline and ask the operator to add a note." },
    { id:'language', modes:[], q:'How do I change the language?',
      keys:['language','hindi','bengali','khortha','translate','english','भाषा','हिंदी','ভাষা'],
      a:"Use the **EN / हि / खो / বাং** switch in the top bar. The whole app, including what people have typed, is translated. Translation of typed text needs internet; the menus and labels work offline." },
    { id:'login', modes:[], q:'How does login work?',
      keys:['login','log in','sign in','signup','sign up','register','password','aadhaar','aadhar','otp','verify','verification','id proof','demo login'],
      a:"Choose your **role**, enter the ID asked for that role (Aadhaar for citizens, college code for students, GSTIN for industry, employee ID for officials) and verify. You can use OTP **123456** or the **1-click login** buttons to try every role." },
    { id:'privacy', modes:[], q:'Is my data safe?',
      keys:['privacy','safe','data','secure','personal','private','my number','सुरक्षित','गोपनीय'],
      a:"This is a **demo** with sample data, so please don’t enter real personal details. Phone numbers used for voting are stored only **masked** (like 98•••••21) plus a one-way code that detects repeat votes. Real deployments should use encrypted storage and consent." },

    // ---- government
    { id:'gate', modes:['government'], q:'What is the Innovation Gate?',
      keys:['gate','innovation gate','necessity','routine','university pipeline','route','innovation','R&D','research'],
      a:"The **Innovation Necessity Gate** decides how a verified problem is handled. **Routine** – an existing department can fix it with a normal process. **Innovation gap** – no known solution exists, so it is published as a challenge for universities (R&D). The AI shows its reasoning; you make the final call.",
      go:{ role:'government', view:'gate', label:'Open Innovation Gate' } },
    { id:'gov-accountability', modes:['government'], q:'How do I reply to a delay?',
      keys:['reply','respond','explain delay','sick leave','out of station','temporary charge','excuse','not my fault','explain'],
      a:"Open **Accountability**, find the late problem and press **Reply / explain this delay**. Pick a reason (sick leave, out of station, not in position, someone else in temporary charge, other), write a short explanation and, for temporary charge, name the person. It is shown publicly. The delay count stays — the reply adds context.",
      go:{ role:'government', view:'accountability', label:'Open Accountability' } },
    { id:'gov-clusters', modes:['government'], q:'How are clusters merged?',
      keys:['clusters','merge duplicates','auto merge','duplicate reports'],
      a:"The AI groups reports in the same domain and area that describe the same issue and merges them automatically. Open **Clusters** to review the groups. Each merged problem keeps the combined **supports** and **people affected**, so priority reflects the real size of the issue.",
      go:{ role:'government', view:'clusters', label:'Open Clusters' } },
    { id:'gov-spam', modes:['government'], q:'What do I do with the Spam Folder?',
      keys:['spam folder','review spam','approve spam','dismiss'],
      a:"**Spam Folder** lists reports the AI flagged, with its reasons and a confidence score. **Approve** moves a genuine one into the normal queue; **Confirm spam** keeps it out but retained for audit.",
      go:{ role:'government', view:'spam', label:'Open Spam Folder' } },
    { id:'gov-calls', modes:['government'], q:'What are Helpline Calls?',
      keys:['helpline calls','call log','calls','operator','transcript','phone complaints'],
      a:"**Helpline Calls** logs every phone vote and complaint: the masked caller, what was said, and whether it **joined an existing problem**, **opened a new one**, or was a **repeat vote that was ignored**. New problems from calls are flagged until an operator checks the location and priority — press **Mark checked** when done.",
      go:{ role:'government', view:'calls', label:'Open Helpline Calls' } },
    { id:'gov-impact', modes:['government'], q:'What is Impact Verification?',
      keys:['impact','verification','verify impact','evidence','claim','dashboard'],
      a:"When a team says its fix worked, **Impact Verification** is where you check the evidence (before/after readings, photos, citizen confirmations) and mark it verified. Only verified impact appears on the **Impact Dashboard**." },
    { id:'gov-dept', modes:['government'], q:'Which official handles what?',
      keys:['department','village officer','tahsildar','sub collector','sdm','collector','hierarchy','escalate','escalation'],
      a:"Problems escalate up the revenue hierarchy: **Village Officer** (single local, low priority) → **Tahsildar** (block level / medium) → **Sub-Collector (SDM)** (sub-division, high priority) → **District Collector** (large clusters, pilot-ready projects)." },

    // ---- university & students
    { id:'uni-claim', modes:['university'], q:'How do we take up a challenge?',
      keys:['claim','accept','take up','challenge','marketplace','opt in','match score','capabilities','project'],
      a:"Open the **challenge marketplace**, check the **match score** and required capabilities, and press **Claim**. The challenge moves to your workspace where you build a team and work through **Plan → Prototype → Pilot → Deployed**." },
    { id:'uni-milestone', modes:['university'], q:'How do milestones and evidence work?',
      keys:['milestone','evidence','upload','deliverable','maturity','gate','approval','stage','prototype','pilot'],
      a:"Each milestone needs **evidence** (test results, photos, reports). Upload it, then a government reviewer approves it and the next milestone unlocks. Maturity is tagged **Concept → Prototype → Pilot-Ready** so industry partners know how much proof exists." },
    { id:'stu-join', modes:['university'], q:'How can a student join a project?',
      keys:['student','join','team','skills','skill gap','learning path','mentor','credits','certificate'],
      a:"Students browse challenges, see how well their **skills match**, and **join a team**. Missing skills show as **recommended learning** chips — they never block you. Keep your skill profile current so matching stays accurate." },
    { id:'uni-feasible', modes:['university'], q:'How do we judge R&D feasibility?',
      keys:['feasibility','feasible','budget','prototype cost','technology','sensor','iot','ai','approach'],
      a:"Check three things on the challenge: **how many people are affected** (scale), **the constraints** in the problem text (connectivity, power, cost), and **whether a similar solved problem exists** in Solution Intelligence you can reuse. Start with the cheapest prototype that can be tested in the field within a few weeks." },

    // ---- industry
    { id:'ind-offer', modes:['industry'], q:'How do I offer support?',
      keys:['offer','pledge','support','fund','funding','sponsor','csr','partner','commit','donate','grant'],
      a:"Open **Collaboration Hub** (or press **Offer support** / **Fund** on any project). Choose the project, tick how you can help — **mentorship, testing lab, equipment, CSR funding, pilot site, tech transfer** — enter a ₹ amount if funding, and submit. The university dean reviews it and it shows in your commitments.",
      go:{ role:'industry', view:'commitments', label:'Open Collaboration Hub' } },
    { id:'ind-fit', modes:['industry'], q:'What is the CSR fit and funding range?',
      keys:['fit','csr fit','match','range','how much','suggested','amount','indicative','rank','ranking'],
      a:"**CSR fit** ranks projects by how well they match your **focus areas** (the chips at the top), how mature the project is, and how many people it affects. **Suggested funding** is an **indicative** range that grows with maturity and scale — it is a guide, not a quotation." },
    { id:'ind-routes', modes:['industry'], q:'What are deployment routes?',
      keys:['deployment','route','adopt','integration','marketplace listing','internal tooling','scale'],
      a:"After a pilot works, **Deployment Routes** lets you choose how it goes live: **Direct integration** into your product, a **Marketplace listing**, or **Internal tooling** for your own operations.",
      go:{ role:'industry', view:'routes', label:'Open Deployment Routes' } },
  ],

  state: { open: false, mode: 'citizen', msgs: [], mounted: false },

  // ------------------------------------------------------------ matching
  tok(s){ return String(s || '').toLowerCase().split(/[^a-z0-9ऀ-ॿঀ-৿&]+/).filter(Boolean); },

  score(entry, qLower, qToks){
    let sc = 0;
    entry.keys.forEach(k => {
      const kl = k.toLowerCase();
      if (kl.includes(' ')) { if (qLower.includes(kl)) sc += 3.5; }
      else if (qToks.includes(kl)) sc += 2;
      else if (kl.length > 4 && qToks.some(t => t.length > 4 && (t.startsWith(kl.slice(0, 5)) || kl.startsWith(t.slice(0, 5))))) sc += 1;
    });
    if (sc > 0) sc += entry.modes.length === 0 || entry.modes.includes(this.state.mode) ? 1.5 : -0.5;
    return sc;
  },

  // ------------------------------------------- live answers from app data
  liveAnswer(q){
    const m = q.match(/\bR[-\s]?(\d{3,4})\b/i);
    if (m){
      const id = 'R-' + m[1];
      const r = DB.getAllReportsIncludingSpam().find(x => x.id === id);
      if (!r) return { text: `I couldn’t find a problem with ID **${id}**. Check the ID on the card (it looks like R-104).` };
      if (r.spam && !r.spamReviewed) return { text: `**${id}** is being checked by a reviewer because the AI filter flagged it. It will appear in the normal list once approved.` };
      const who = DB.getResponsiblePerson(r), delay = DB.getDelayInfo(r), rep = delay && delay.reply;
      const lines = [
        `**${id} — ${r.title}**`,
        `Place: ${r.area} · Domain: ${r.domain} · Priority: ${r.priority}`,
        `Stage: **${problemStageLabel(r)}** · ${formatCount(r.affected)} people affected · ${r.supports || 0} supports · cluster of ${r.clusterOf || 1}`,
        `Responsible: **${who.name}** (${who.title})${who.actingFor ? ` — acting for ${who.actingFor.name}` : ''}`,
        delay ? `⏱ **${delay.days} day${delay.days === 1 ? '' : 's'} late.** ${delay.reason}` : (r.status === 'done' ? '✅ Resolved.' : 'On schedule.'),
      ];
      if (rep) lines.push(`Officer’s reply: ${(REPLY_KINDS[rep.kind] || {}).label || ''} — ${rep.note}`);
      if (r.voteNumber) lines.push(`Support it free by phone: **${r.voteNumber}**`);
      return { text: lines.join('\n'), related: ['Who is responsible and how late is it?', 'How does voting by phone work?'] };
    }
    if (/\b(my reports?|reports? i (filed|made|submitted))\b/i.test(q) && DB.getSession() && DB.getSession().role === 'citizen'){
      const me = DB.getSession().name;
      const mine = DB.getReports().filter(r => r.citizen === me || me === 'Demo Citizen');
      if (!mine.length) return { text: 'You haven’t filed any reports yet. Open **Report a Problem** to start.', go: { role:'citizen', view:'report', label:'Open Report a Problem' } };
      return { text: `You have **${mine.length}** report${mine.length === 1 ? '' : 's'}:\n` + mine.map(r => `• ${r.id} — ${r.title} (${problemStageLabel(r)})`).join('\n') + '\n\nAsk about any ID for details.', go: { role:'citizen', view:'myreports', label:'Open My Reports' } };
    }
    if (/(how many|total|overall).*(late|delay|overdue)|(late|delay|overdue).*(how many|total|overall)/i.test(q)){
      const t = DB.getAccountability().totals;
      return { text: `Right now **${t.delayed}** open problems are running late, **${t.totalDays}** delay-days in total, the longest being **${t.maxDays} days**. **${t.unanswered}** late problems have no reply from the responsible officer yet.`, go: { role: DB.getSession().role === 'government' ? 'government' : 'citizen', view:'accountability', label:'Open Accountability' } };
    }
    return null;
  },

  answer(q){
    const live = this.liveAnswer(q);
    if (live) return live;
    const ql = q.toLowerCase(), toks = this.tok(q);
    if (/^(hi|hello|hey|namaste|namaskar|नमस्ते|हेलो|নমস্কার)\b/.test(ql) && toks.length <= 3)
      return { text: 'Namaste! I’m the Setu Assistant. Ask me how to report a problem, what a status means, who is responsible for a problem, or how phone voting works.' };
    if (/^(thanks|thank you|thx|dhanyavad|धन्यवाद|শুকরিয়া)/.test(ql))
      return { text: 'You’re welcome! Ask me anything else about Setu.' };
    const scored = this.KB.map(e => ({ e, s: this.score(e, ql, toks) })).filter(x => x.s >= 2).sort((a, b) => b.s - a.s);
    if (!scored.length) return {
      text: 'I’m not sure about that one. I can help with **reporting a problem**, **tracking a report**, **phone voting and the helpline**, **who is responsible**, and how each role uses Setu. You can also type a problem ID like **R-104**.\n\nFor anything urgent, call the toll-free helpline.',
      related: this.suggestions().slice(0, 4),
    };
    const top = scored[0].e;
    const related = scored.slice(1, 4).map(x => x.e.q);
    return { text: top.a, go: top.go, related: related.length ? related : this.suggestions().filter(t => t !== top.q).slice(0, 3) };
  },

  suggestions(){
    return this.KB.filter(e => e.modes.includes(this.state.mode)).map(e => e.q);
  },

  // ------------------------------------------------------------------ UI
  fmt(text){
    return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
  },
  plain(text){ return String(text).replace(/\*\*/g, '').replace(/\*/g, ''); },

  modeForRole(role){
    return Object.keys(this.MODES).find(k => this.MODES[k].roles.includes(role)) || 'citizen';
  },

  mount(){
    const session = DB.getSession();
    if (!session) return;
    this.state.mode = this.modeForRole(session.role);
    this.state.msgs = [];
    if (!document.getElementById('sa-fab')){
      const wrap = document.createElement('div');
      wrap.id = 'sa-root';
      wrap.innerHTML = `
        <button id="sa-fab" class="sa-fab" aria-label="Open Setu Assistant" data-no-translate>${icon('sparkles',20)} <span>Ask Setu</span></button>
        <section id="sa-panel" class="sa-panel" role="dialog" aria-label="Setu Assistant" hidden>
          <header class="sa-head">
            <div class="sa-logo">${icon('sparkles',20)}</div>
            <div class="sa-titles"><div class="sa-title">Setu Assistant</div><div class="sa-sub">Help &amp; how-to · works offline</div></div>
            <button class="icon-btn sa-ic" id="sa-clear" title="Clear chat" aria-label="Clear chat">${icon('x',15)}</button>
            <button class="icon-btn sa-ic" id="sa-close" title="Close" aria-label="Close">${icon('chevronDown',16)}</button>
          </header>
          <div class="sa-modebar"><label for="sa-mode">I need help with</label><select id="sa-mode"></select></div>
          <div class="sa-msgs" id="sa-msgs" aria-live="polite"></div>
          <div class="sa-chips" id="sa-chips"></div>
          <form class="sa-form" id="sa-form" autocomplete="off">
            <button type="button" class="sa-mic" id="sa-mic" data-icon-only="1" data-dictate-into="sa-input" data-dictate-by-id="1" title="Speak your question" aria-label="Speak your question">${icon('mic',18)}</button>
            <input id="sa-input" type="text" placeholder="Ask how to report, track, vote…" data-no-translate />
            <button type="submit" class="sa-send" aria-label="Send">${icon('send',18)}</button>
          </form>
          <div class="sa-foot">Demo assistant · answers from Setu help + live data</div>
        </section>`;
      document.body.appendChild(wrap);
      this.bind();
    }
    document.getElementById('sa-root').hidden = false;
    this.paintModes();
    this.welcome();
    this.setOpen(false);
  },

  unmount(){
    const r = document.getElementById('sa-root');
    if (r) r.hidden = true;
    this.state.open = false;
    this.state.msgs = [];
  },

  paintModes(){
    const sel = document.getElementById('sa-mode');
    sel.innerHTML = Object.keys(this.MODES).map(k => `<option value="${k}" ${k === this.state.mode ? 'selected' : ''}>${this.MODES[k].label}</option>`).join('');
  },

  welcome(){
    this.state.msgs = [];
    document.getElementById('sa-msgs').innerHTML = '';
    const name = firstName((DB.getSession() || {}).name || '');
    this.addBot({ text: `Namaste${name ? ' ' + name : ''}! I’m the **Setu Assistant**. I can explain how things work, help you report or track a problem, and look up the status of any problem ID. What would you like to know?`, related: this.suggestions().slice(0, 4) }, true);
  },

  setOpen(open){
    this.state.open = open;
    document.getElementById('sa-panel').hidden = !open;
    document.getElementById('sa-fab').classList.toggle('hidden-fab', open);
    if (open) setTimeout(() => { const i = document.getElementById('sa-input'); if (i && window.innerWidth > 640) i.focus(); }, 50);
  },

  addUser(text){
    const box = document.getElementById('sa-msgs');
    box.insertAdjacentHTML('beforeend', `<div class="sa-row user"><div class="sa-bubble" data-no-translate>${escapeHtml(text)}</div></div>`);
    box.scrollTop = box.scrollHeight;
  },

  addBot(res, instant){
    const box = document.getElementById('sa-msgs');
    const session = DB.getSession();
    const go = res.go && session && res.go.role === session.role ? res.go : null;
    const html = `
      <div class="sa-row bot">
        <div class="sa-avatar">${icon('sparkles',14)}</div>
        <div class="sa-bubble">
          <div>${this.fmt(res.text)}</div>
          <div class="sa-actions">
            ${go ? `<button class="sa-go" data-sa-go="${go.view}">${icon('arrowRight',13)} ${go.label}</button>` : ''}
            <button class="sa-listen" data-speak-text="${escapeHtml(this.plain(res.text))}" title="Read aloud">${icon('volume',13)} Listen</button>
          </div>
        </div>
      </div>`;
    const finish = () => {
      const t = document.getElementById('sa-typing'); if (t) t.remove();
      box.insertAdjacentHTML('beforeend', html);
      box.scrollTop = box.scrollHeight;
      this.paintChips(res.related);
      if (typeof I18N !== 'undefined') I18N.applyAll(box);
    };
    if (instant) return finish();
    box.insertAdjacentHTML('beforeend', `<div class="sa-row bot" id="sa-typing"><div class="sa-avatar">${icon('sparkles',14)}</div><div class="sa-bubble sa-dots"><i></i><i></i><i></i></div></div>`);
    box.scrollTop = box.scrollHeight;
    setTimeout(finish, 380);
  },

  paintChips(list){
    const chips = (list && list.length ? list : this.suggestions().slice(0, 4));
    document.getElementById('sa-chips').innerHTML = chips.map(c => `<button type="button" class="sa-chip" data-sa-q="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
  },

  ask(q){
    q = String(q || '').trim();
    if (!q) return;
    this.addUser(q);
    let res;
    try { res = this.answer(q); }
    catch (e) { console.warn('Assistant error', e); res = { text: 'Sorry, I couldn’t work that out. Please try asking in a different way, or call the toll-free helpline.' }; }
    this.addBot(res);
  },

  bind(){
    document.getElementById('sa-fab').addEventListener('click', () => this.setOpen(true));
    document.getElementById('sa-close').addEventListener('click', () => this.setOpen(false));
    document.getElementById('sa-clear').addEventListener('click', () => this.welcome());
    document.getElementById('sa-mode').addEventListener('change', (e) => { this.state.mode = e.target.value; this.welcome(); });
    document.getElementById('sa-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const i = document.getElementById('sa-input'); const v = i.value; i.value = ''; this.ask(v);
    });
    document.getElementById('sa-panel').addEventListener('click', (e) => {
      const c = e.target.closest('[data-sa-q]'); if (c) { this.ask(c.dataset.saQ); return; }
      const g = e.target.closest('[data-sa-go]');
      if (g) { navigate(g.dataset.saGo); if (window.innerWidth <= 640) this.setOpen(false); }
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.state.open) this.setOpen(false); });
  },
};
