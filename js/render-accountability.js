/* ============================================================
   SETU — Accountability board
   ------------------------------------------------------------
   Public view of WHO is responsible for each open problem and HOW
   MANY DAYS it is late. Citizens see it read-only; government users
   can answer under each late problem (the "reply column"):
   sick leave / out of station / not in position / someone else holds
   temporary charge / other, plus a descriptive note.

   Rules baked in:
   - A reply never removes or pauses the delay count. Both are shown.
   - Replies are labelled self-declared (not verified).
   - If someone else is named in temporary charge, they are shown as
     the person now responsible (see DB.getResponsiblePerson).
   ============================================================ */

const Accountability = {
  // days late -> severity band used for colour + wording
  band(days){
    if (days <= 0) return { cls: 'ok',   label: 'On schedule' };
    if (days <= 7) return { cls: 'warn', label: 'Slightly late' };
    if (days <= 30) return { cls: 'high', label: 'Late' };
    return { cls: 'bad', label: 'Seriously late' };
  },

  fmtWhen(iso){
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleDateString(undefined, { day:'numeric', month:'short', year:'numeric' });
  },

  replyHtml(rep){
    if (!rep) return '';
    const k = REPLY_KINDS[rep.kind] || { label: rep.kind };
    return `
      <div class="acct-reply">
        <div class="acct-reply-head">
          ${icon('flag',12)} <strong>${escapeHtml(rep.authorityName)} replied</strong>
          <span class="acct-reply-kind">${escapeHtml(k.label)}</span>
          <span class="acct-reply-when">${this.fmtWhen(rep.at)}</span>
        </div>
        <div class="acct-reply-note">${escapeHtml(rep.note)}</div>
        ${rep.substitute ? `<div class="acct-reply-sub">${icon('users',12)} <span>In temporary charge: <strong>${escapeHtml(rep.substitute.name)}</strong>${rep.substitute.title ? ' — ' + escapeHtml(rep.substitute.title) : ''}</span></div>` : ''}
        <div class="acct-reply-foot">Self-declared by the authority — not independently verified. The delay count above is unchanged.</div>
      </div>`;
  },

  replyForm(item){
    const r = item.report;
    return `
      <details class="acct-form-wrap">
        <summary>${icon('send',13)} ${item.reply ? 'Update my reply' : 'Reply / explain this delay'}</summary>
        <form class="acct-form" data-reply-form="${r.id}">
          <label class="field">
            <span class="field-label">Reason</span>
            <select name="kind" required>
              <option value="" disabled selected>Choose a reason…</option>
              ${Object.keys(REPLY_KINDS).map(k => `<option value="${k}">${REPLY_KINDS[k].label}</option>`).join('')}
            </select>
          </label>
          <div class="acct-sub-fields" hidden>
            <label class="field"><span class="field-label">Name of person in temporary charge</span>
              <input type="text" name="subName" placeholder="e.g. Mohan Lal Munda" /></label>
            <label class="field"><span class="field-label">Their designation</span>
              <input type="text" name="subTitle" placeholder="e.g. Deputy Collector (acting SDM)" /></label>
          </div>
          <label class="field">
            <span class="field-label">Explain in your own words <small style="font-weight:400;color:var(--ink-faint);">(citizens will read this)</small></span>
            <textarea name="note" rows="3" placeholder="Since when, what you have already done, and who will act next…" required></textarea>
          </label>
          <div class="acct-form-actions">
            <button type="button" class="btn btn-outline btn-sm" data-dictate-into="note">${icon('mic',14)} Speak instead</button>
            <button type="submit" class="btn btn-primary btn-sm">${icon('check',14)} Publish reply</button>
          </div>
          <div class="acct-form-err" role="alert" hidden></div>
        </form>
      </details>`;
  },

  itemRow(item, canReply){
    const r = item.report;
    const band = this.band(item.days);
    const acting = item.acting;
    const phoneVotes = (r.phoneVotes || []).length;
    return `
      <div class="acct-item">
        <div class="acct-item-top">
          <div class="acct-item-main">
            <div class="acct-item-title">${escapeHtml(r.title)}</div>
            <div class="acct-item-meta">${r.id} · ${icon('pin',11)} ${escapeHtml(r.area)} · ${icon('heart',11)} ${r.supports || 0} back this${phoneVotes ? ` (${phoneVotes} by phone)` : ''}</div>
          </div>
          <div class="acct-days acct-${band.cls}" title="${band.label}">
            <strong>${item.days}</strong><span>${item.days === 1 ? 'day' : 'days'} late</span>
          </div>
        </div>
        ${acting.actingFor ? `<div class="acct-acting">${icon('users',12)} <span>Now handled by <strong>${escapeHtml(acting.name)}</strong>, ${escapeHtml(acting.title)} — acting for ${escapeHtml(acting.actingFor.name)}</span></div>` : ''}
        ${this.replyHtml(item.reply)}
        ${!item.reply && item.days > 0 ? `<div class="acct-noreply">${icon('clock',12)} No reply from the authority yet.</div>` : ''}
        <div class="acct-item-actions">
          <button class="btn btn-ghost btn-sm" data-speak-report="${r.id}" title="Read this aloud">${icon('volume',14)} Listen</button>
        </div>
        ${canReply ? this.replyForm(item) : ''}
      </div>`;
  },

  authorityCard(a, canReply){
    const rate = a.delayed ? Math.round((a.answered / a.delayed) * 100) : 100;
    const band = this.band(a.avgDays);
    return `
      <section class="card acct-card">
        <header class="acct-card-head">
          <div class="acct-avatar">${initials(a.name)}</div>
          <div class="acct-who">
            <div class="acct-name">${escapeHtml(a.name)}</div>
            <div class="acct-title">${escapeHtml(a.title)}</div>
          </div>
          <div class="acct-total acct-${a.totalDays ? band.cls : 'ok'}">
            <strong>${a.totalDays}</strong><span>delay-days in total</span>
          </div>
        </header>
        <div class="acct-stats">
          <div><strong>${a.assigned}</strong><span>open problems</span></div>
          <div><strong>${a.delayed}</strong><span>running late</span></div>
          <div><strong>${a.avgDays}</strong><span>avg days late</span></div>
          <div><strong>${a.maxDays}</strong><span>longest delay</span></div>
          <div><strong>${a.resolved}</strong><span>resolved</span></div>
        </div>
        <div class="acct-rate" title="Share of late problems where the authority has replied">
          <div class="acct-rate-label"><span>Replied to late problems</span><strong>${a.answered} of ${a.delayed}</strong></div>
          <div class="acct-rate-bar"><div style="width:${rate}%"></div></div>
        </div>
        <div class="acct-items">
          ${a.items.length ? a.items.map(it => this.itemRow(it, canReply)).join('') : `<div class="acct-empty">Nothing open — all problems for this office are resolved.</div>`}
        </div>
      </section>`;
  },

  render(opts = {}){
    const canReply = !!opts.canReply;
    const { authorities, totals } = DB.getAccountability();
    return `
      <div class="view-head">
        <div>
          <h1 class="view-title">Accountability board</h1>
          <p class="view-sub">${canReply
            ? 'Every late problem is shown publicly with the named authority. Use the reply box under a problem to explain — for example leave, absence, or who holds temporary charge.'
            : 'Who is responsible for each problem, and how many days late it is. Authorities can reply publicly under each problem.'}</p>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card accent"><div class="kpi-value">${totals.delayed}</div><div class="kpi-label">Problems running late</div></div>
        <div class="kpi-card"><div class="kpi-value">${totals.totalDays}</div><div class="kpi-label">Total delay-days</div></div>
        <div class="kpi-card"><div class="kpi-value">${totals.maxDays}</div><div class="kpi-label">Longest delay (days)</div></div>
        <div class="kpi-card"><div class="kpi-value" style="color:${totals.unanswered ? 'var(--danger)' : 'var(--ok)'};">${totals.unanswered}</div><div class="kpi-label">Late with no reply from authority</div></div>
      </div>

      <div class="acct-note">${icon('shield',14)} <span>Days late = days past the promised date. A reply adds context but <strong>does not remove or pause</strong> the count. Replies are self-declared and not verified.</span></div>

      <div class="acct-grid">
        ${authorities.map(a => this.authorityCard(a, canReply)).join('')}
      </div>`;
  },

  bind(main, refresh, session){
    // show/hide the "temporary charge" fields
    main.querySelectorAll('[data-reply-form]').forEach(form => {
      const kind = form.querySelector('[name="kind"]');
      const sub = form.querySelector('.acct-sub-fields');
      kind.addEventListener('change', () => { sub.hidden = !(REPLY_KINDS[kind.value] && REPLY_KINDS[kind.value].needsSubstitute); });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const err = form.querySelector('.acct-form-err');
        const fd = new FormData(form);
        const res = DB.addAuthorityReply({
          reportId: form.dataset.replyForm,
          kind: fd.get('kind'),
          note: fd.get('note'),
          substitute: { name: fd.get('subName'), title: fd.get('subTitle') },
          by: session && session.name,
        });
        if (!res.ok){ err.hidden = false; err.textContent = res.error; return; }
        toast('Reply published — citizens can now see it.');
        refresh();
      });
    });
  },
};
