/* ============================================================
   SETU — Phone participation views
   ------------------------------------------------------------
   Citizen  : "Vote & Call" — toll-free numbers, the vote board
              (reality-show style) and a call simulator.
   Government: "Helpline calls" — log of every call and what it did.

   The simulator calls the same code a real telephony provider will
   reach through the server's /api/ivr/* webhooks (js/ivr-core.js),
   so what you see here is what the phone line will do.
   ============================================================ */

const Phone = {
  spokenNumber(n){ return String(n || '').replace(/\D/g, '').split('').join(' '); },

  resultText(kind, res){
    const r = res.report;
    switch (res.status || res.action){
      case 'counted':   return { ok:true,  text:`Thank you. Your vote for "${r.title}" is counted. ${r.supports} people now back this problem.` };
      case 'duplicate': return { ok:false, text:`This phone number has already voted for "${r.title}". Each phone can vote once for each problem. You can still vote for other problems.` };
      case 'unknown_problem': return { ok:false, text:'Sorry, that problem number was not found. Please check the number and try again.' };
      case 'bad_number': return { ok:false, text:'Please enter a valid 10-digit mobile number.' };
      case 'empty':     return { ok:false, text:'Please say a little more about the problem — at least a full sentence.' };
      case 'joined':    return res.duplicate
        ? { ok:false, text:`Your phone is already counted for "${r.title}" (${r.id}). Thank you for calling again.` }
        : { ok:true,  text:`Thank you. This looks like an existing problem: "${r.title}" (${r.id}). You have been added to it — ${r.supports} people now back it. Its number is ${r.voteNumber}.` };
      case 'created':   return { ok:true,  text:`Thank you. A new problem has been recorded as ${r.id}. Its own voting number is ${r.voteNumber}. An operator will confirm the location. Ask neighbours to call that number to support it.` };
      default: return { ok:false, text:'Something went wrong.' };
    }
  },

  // ------------------------------------------------ citizen: Vote & Call
  renderCitizen(){
    const s = DB.getSettings();
    const board = DB.getVoteBoard();
    const max = Math.max(1, ...board.map(r => r.supports || 0));
    const problems = board;
    return `
      <div class="view-head">
        <div>
          <h1 class="view-title">Vote &amp; call</h1>
          <p class="view-sub">No smartphone or data needed. Use any phone — the calls are free.</p>
        </div>
      </div>

      <div class="grid grid-2 phone-hero">
        <div class="card card-pad phone-box">
          <div class="phone-box-label">${icon('mic',14)} Report a problem · 24×7</div>
          <a class="phone-big" href="${telHref(s.tollFreeNumber)}" data-no-translate>${s.tollFreeNumber}</a>
          <p class="phone-help">Call and describe the problem in your own language. If it is already reported, you are added to it. If it is new, a new problem is opened for you.</p>
          <button class="btn btn-ghost btn-sm" data-speak-text="Report a problem by phone. Call ${this.spokenNumber(s.tollFreeNumber)}. Describe the problem in your own language. The call is free, any time, every day.">${icon('volume',14)} Listen</button>
        </div>
        <div class="card card-pad phone-box">
          <div class="phone-box-label">${icon('heart',14)} Back a problem · one vote per phone</div>
          <div class="phone-big phone-big-sm" data-no-translate>${s.voteNumberPrefix}<em>XXXX</em></div>
          <p class="phone-help">Every problem below has its own free number. Call it once and your vote is counted — like voting for a favourite contestant. You can vote for different problems, but only once for each.</p>
          <button class="btn btn-ghost btn-sm" data-speak-text="Back a problem by phone. Every problem has its own free number. Call it once to add your vote. You can vote for different problems but only once for each problem.">${icon('volume',14)} Listen</button>
        </div>
      </div>

      <h2 class="section-title" style="margin-top:28px;">Vote board — problems people want fixed first</h2>
      <div class="card vote-board">
        ${board.map((r, i) => {
          const pv = (r.phoneVotes || []).length;
          return `
          <div class="vote-row">
            <div class="vote-rank">${i + 1}</div>
            <div class="vote-main">
              <div class="vote-title">${escapeHtml(r.title)}</div>
              <div class="vote-meta">${r.id} · ${icon('pin',11)} ${escapeHtml(r.area)} · ${pv} by phone</div>
              <div class="vote-bar"><div style="width:${Math.round(((r.supports || 0) / max) * 100)}%"></div></div>
            </div>
            <div class="vote-count"><strong>${r.supports || 0}</strong><span>votes</span></div>
            <div class="vote-call">
              <a class="btn btn-primary btn-sm" href="${telHref(r.voteNumber)}" data-no-translate>${icon('bell',14)} ${r.voteNumber}</a>
              <button class="btn btn-ghost btn-sm" data-speak-report="${r.id}" title="Read aloud">${icon('volume',14)}</button>
            </div>
          </div>`;
        }).join('') || `<div class="empty-state">${icon('heart',30)}<p>No open problems to vote on.</p></div>`}
      </div>

      <h2 class="section-title" style="margin-top:28px;">Try a phone call</h2>
      <div class="card card-pad" style="max-width:720px;">
        <div class="phone-demo-note">${icon('wifi',14)} <span>Try the phone line here. When the toll-free numbers are connected, the phone company sends the same information to the server.</span></div>

        <div class="auth-tabs" style="margin-bottom:14px;">
          <button class="auth-tab active" data-sim-tab="vote">Vote for a problem</button>
          <button class="auth-tab" data-sim-tab="complain">Report a new problem</button>
        </div>

        <form id="sim-form" class="form-grid" novalidate>
          <label class="field">
            <span class="field-label">Caller's mobile number</span>
            <input type="tel" id="sim-from" inputmode="numeric" placeholder="e.g. 98765 43210" autocomplete="off" />
          </label>

          <div id="sim-vote-fields">
            <label class="field">
              <span class="field-label">Number dialled</span>
              <select id="sim-to">
                ${problems.map(r => `<option value="${r.voteNumber}">${r.voteNumber} — ${escapeHtml(r.title)}</option>`).join('')}
              </select>
            </label>
          </div>

          <div id="sim-complain-fields" hidden>
            <label class="field">
              <span class="field-label">Language spoken</span>
              <select id="sim-lang">
                <option value="English">English</option><option value="Hindi">Hindi</option>
                <option value="Khortha">Khortha</option><option value="Bengali">Bengali</option>
              </select>
            </label>
            <label class="field" style="margin-top:10px;">
              <span class="field-label">What the caller says <small style="font-weight:400;color:var(--ink-faint);">(the phone line turns speech into text)</small></span>
              <textarea id="sim-say" rows="3" placeholder="e.g. The water tank in our ward is overflowing every night and flooding the lane"></textarea>
            </label>
            <button type="button" class="btn btn-outline btn-sm" id="sim-dictate" style="margin-top:8px;" data-dictate-into="sim-say" data-dictate-by-id="1">${icon('mic',14)} Speak instead of typing</button>
          </div>

          <label class="phone-check"><input type="checkbox" id="sim-voice" checked /> Read the phone's reply aloud</label>
          <div style="display:flex; gap:10px;">
            <button type="submit" class="btn btn-primary">${icon('bell',16)} Place call</button>
          </div>
        </form>
        <div id="sim-result" class="phone-result" hidden></div>
      </div>
    `;
  },

  // ---------------------------------------------- government: Helpline calls
  renderCalls(){
    const log = DB.getCallLog();
    const count = (f) => log.filter(f).length;
    const resultChip = (c) => {
      const map = {
        counted:          ['status-done',     'Vote counted'],
        duplicate:        ['status-pending',  'Repeat vote ignored'],
        unknown_problem:  ['priority-high',   'Wrong number'],
        joined:           ['status-progress', 'Joined existing problem'],
        joined_duplicate: ['status-pending',  'Already counted'],
        created:          ['status-done',     'New problem opened'],
      };
      const m = map[c.result] || ['', c.result];
      return `<span class="tag ${m[0]}">${m[1]}</span>`;
    };
    const rows = log.map(c => {
      const r = DB.getReports().find(x => x.id === c.reportId);
      const review = r && r.needsOperatorReview;
      return `
        <tr>
          <td style="white-space:nowrap;">${Accountability.fmtWhen(c.at)}<br><span style="color:var(--ink-faint);font-size:12px;">${new Date(c.at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span></td>
          <td data-no-translate>${escapeHtml(c.caller)}</td>
          <td><span class="tag">${c.type === 'vote' ? 'Vote call' : 'Complaint call'}</span></td>
          <td style="max-width:320px;">${c.transcript ? `<div class="call-say">“${escapeHtml(c.transcript)}”</div>${c.lang ? `<div style="font-size:11.5px;color:var(--ink-faint);">${escapeHtml(c.lang)}${c.matchScore ? ` · match ${c.matchScore}%` : ''}</div>` : ''}` : `<span style="color:var(--ink-faint);">Dialled <span data-no-translate>${escapeHtml(c.dialed || '')}</span></span>`}</td>
          <td>${resultChip(c)}${r ? `<div style="margin-top:4px;"><span role="button" tabindex="0" data-open-report="${r.id}" style="color:var(--accent);font-weight:600;font-size:12.5px;cursor:pointer;">${r.id} · ${escapeHtml(r.title.slice(0, 40))}</span></div>` : ''}</td>
          <td>${review ? `<button class="btn btn-outline btn-sm" data-call-reviewed="${c.id}">${icon('check',13)} Mark checked</button>` : (c.type === 'complaint' ? '<span style="color:var(--ok);font-size:12.5px;font-weight:600;">Checked</span>' : '')}</td>
        </tr>`;
    }).join('');
    return `
      <div class="view-head">
        <div>
          <h1 class="view-title">Helpline calls</h1>
          <p class="view-sub">Every call to the complaint line and to each problem's voting number, and what it did.</p>
        </div>
      </div>
      <div class="kpi-row">
        <div class="kpi-card accent"><div class="kpi-value">${log.length}</div><div class="kpi-label">Calls logged</div></div>
        <div class="kpi-card"><div class="kpi-value">${count(c => c.result === 'created')}</div><div class="kpi-label">New problems opened</div></div>
        <div class="kpi-card"><div class="kpi-value">${count(c => c.result === 'joined')}</div><div class="kpi-label">Joined an existing problem</div></div>
        <div class="kpi-card"><div class="kpi-value">${count(c => c.result === 'duplicate' || c.result === 'joined_duplicate')}</div><div class="kpi-label">Repeat votes blocked</div></div>
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>When</th><th>Caller</th><th>Type</th><th>What was said / dialled</th><th>Outcome</th><th>Operator</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="6"><div class="empty-state">${icon('bell',30)}<p>No calls yet.</p></div></td></tr>`}</tbody>
        </table>
      </div>
      <p class="phone-foot">Phone numbers are stored masked (98•••••21) plus a one-way code that only detects repeat votes.</p>
    `;
  },

  // ----------------------------------------------------------------- binding
  bind(view, ctx, refresh){
    const main = document.getElementById('main-view');

    main.querySelectorAll('[data-call-reviewed]').forEach(b => b.addEventListener('click', () => {
      DB.markCallReviewed(b.dataset.callReviewed);
      toast('Marked as checked.');
      refresh();
    }));

    const form = document.getElementById('sim-form');
    if (!form) return;
    let mode = Phone._mode || 'vote';
    const applyMode = (keepResult) => {
      main.querySelectorAll('[data-sim-tab]').forEach(x => x.classList.toggle('active', x.dataset.simTab === mode));
      document.getElementById('sim-vote-fields').hidden = mode !== 'vote';
      document.getElementById('sim-complain-fields').hidden = mode !== 'complain';
      if (!keepResult) document.getElementById('sim-result').hidden = true;
    };
    main.querySelectorAll('[data-sim-tab]').forEach(t => t.addEventListener('click', () => {
      mode = Phone._mode = t.dataset.simTab; applyMode(false);
    }));
    applyMode(true);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const from = document.getElementById('sim-from').value;
      let res;
      if (mode === 'vote') res = DB.castPhoneVote(document.getElementById('sim-to').value, from);
      else res = DB.fileHelplineComplaint(from, document.getElementById('sim-say').value, { lang: document.getElementById('sim-lang').value });
      const out = this.resultText(mode, res);
      const box = document.getElementById('sim-result');
      box.hidden = false;
      box.className = 'phone-result ' + (out.ok ? 'ok' : 'warn');
      box.innerHTML = `<div class="phone-result-head">${icon(out.ok ? 'checkCircle' : 'flag', 16)} ${out.ok ? 'The phone says' : 'The phone says'}</div><div>${escapeHtml(out.text)}</div>`;
      if (document.getElementById('sim-voice').checked) speakText(out.text);
      if (out.ok) {
        // refresh the board in the background but keep the result visible
        const keep = box.outerHTML;
        refresh();
        const nb = document.getElementById('sim-result');
        if (nb) { nb.outerHTML = keep; }
      }
    });
  },
};
