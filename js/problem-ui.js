/* ============================================================
   SETU — Shared problem card + detail modal
   ------------------------------------------------------------
   One consistent design for a problem everywhere it appears:
   ID · priority · stage, location, title, short description,
   Domain and Gate chips, and a footer with people affected,
   supports, and how many same-problem reports are clustered.
   ============================================================ */

// ₹ formatting in the Indian system: ₹4,00,000 or short ₹4 L / ₹1.2 Cr
function formatINR(n){ return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN'); }
function formatINRShort(n){
  n = Math.round(Number(n) || 0);
  const trim = (x) => String(+x.toFixed(2));
  if (n >= 1e7) return '₹' + trim(n / 1e7) + ' Cr';
  if (n >= 1e5) return '₹' + trim(n / 1e5) + ' L';
  if (n >= 1e3) return '₹' + trim(n / 1e3) + 'K';
  return '₹' + n;
}
function formatCount(n){ return (n === null || n === undefined || isNaN(n)) ? '—' : Number(n).toLocaleString('en-IN'); }

const STAGE_LABELS = ['Received', 'Verified', 'Assigned', 'In Development', 'Pilot', 'Resolved'];

function problemStageLabel(r){
  if (r.status === 'done') return 'Resolved';
  return STAGE_LABELS[Math.max(0, Math.min(5, (r.stage || 1) - 1))];
}
function gateChipHtml(r){
  if (r.gate === 'innovation') return `<span class="chip-gate gate-innovation">Gate: Innovation gap (University R&amp;D)</span>`;
  if (r.gate === 'routine') return `<span class="chip-gate gate-routine">Gate: Routine government workflow</span>`;
  return `<span class="chip-gate gate-open">Gate: Awaiting review</span>`;
}
function clusterPillHtml(r){
  const n = r.clusterOf || 1;
  return `<span class="pill-cluster" title="${n === 1 ? 'No duplicate reports yet' : n + ' reports of the same problem are grouped together'}">${icon('layers',13)} Cluster (${n})</span>`;
}

/* opts.supportable: show the heart as a live Support button (citizen)
   opts.phone:       show the free vote number + Listen row               */
function problemCardHtml(r, opts = {}){
  const stage = problemStageLabel(r);
  const stageCls = r.status === 'done' ? 'st-done' : (r.status === 'progress' ? 'st-progress' : 'st-pending');
  const prio = (r.priority || 'Medium');
  const heart = opts.supportable
    ? `<button class="pill-heart ${r.supportedByMe ? 'on' : ''}" data-support="${r.id}" ${r.supportedByMe ? 'disabled' : ''} title="${r.supportedByMe ? 'You support this' : 'Support this problem'}">${icon('heart',13)} ${r.supports || 0}</button>`
    : `<span class="pill-heart static" title="People backing this problem">${icon('heart',13)} ${r.supports || 0}</span>`;
  return `
    <article class="pcard" data-problem="${r.id}">
      <div class="pcard-top">
        <span class="pcard-id" data-no-translate>${r.id}</span>
        <span class="chip-prio prio-${prio.toLowerCase()}">${prio} priority</span>
        <span class="chip-stage ${stageCls}">${r.status === 'done' ? icon('checkCircle',13) : ''} ${stage}</span>
      </div>
      <div class="pcard-loc" data-view-location="${r.id}" title="View precise location">${icon('pin',14)} ${escapeHtml(r.area)}</div>
      <h3 class="pcard-title">${escapeHtml(r.title)}</h3>
      <p class="pcard-desc">${escapeHtml(r.desc)}</p>
      <div class="pcard-chips">
        ${gateChipHtml(r)}
        <span class="chip-domain">Domain: ${escapeHtml(r.domain)}</span>
        ${r.source === 'helpline' ? `<span class="chip-domain">${icon('bell',11)} Via helpline</span>` : ''}
      </div>
      ${opts.responsible === false ? '' : `<div class="pcard-resp">${responsibleHtml(r)}</div>`}
      <div class="pcard-foot">
        <span class="pcard-affected" title="Estimated people affected">${icon('users',15)} ${formatCount(r.affected)} affected</span>
        ${heart}
        ${clusterPillHtml(r)}
        <button type="button" class="pcard-inspect" data-inspect="${r.id}">Inspect ${icon('arrowRight',14)}</button>
      </div>
      ${opts.phone ? `
      <div class="report-phone">
        <span>${icon('bell',12)} Vote free: <a href="${telHref(r.voteNumber)}" data-no-translate>${r.voteNumber}</a></span>
        <button type="button" class="btn btn-ghost btn-sm" data-speak-report="${r.id}" title="Read aloud">${icon('volume',13)} Listen</button>
      </div>` : ''}
    </article>`;
}

// Map the six citizen-facing stages onto the four project phases.
const PROBLEM_PHASES = [
  { key: 'Ideation',   sub: 'Validation & architecture', icon: 'bulb',   upTo: 3 },
  { key: 'Prototype',  sub: 'Build & lab testing',       icon: 'layers', upTo: 4 },
  { key: 'Pilot',      sub: 'On-ground field trial',     icon: 'target', upTo: 5 },
  { key: 'Deployment', sub: 'Scale & verified impact',   icon: 'send',   upTo: 6 },
];
function phaseStatuses(r){
  const stage = r.status === 'done' ? 6 : (r.stage || 1);
  const cur = stage <= 3 ? 0 : stage - 3;                 // index of active phase
  return PROBLEM_PHASES.map((p, i) => r.status === 'done' ? 'done' : (i < cur ? 'done' : (i === cur ? 'active' : 'upcoming')));
}

function openProblemDetail(id){
  const r = DB.getAllReportsIncludingSpam().find(x => x.id === id);
  if (!r) return;
  const loc = DB.resolveLocation(r);
  const stage = r.status === 'done' ? 6 : (r.stage || 1);
  const pct = Math.round((stage / 6) * 100);
  const phases = phaseStatuses(r);
  const pv = (r.phoneVotes || []).length;
  const history = DB.getReplyHistory ? DB.getReplyHistory(r.id) : [];
  openModal({
    wide: true,
    title: `<div class="pd-title-row"><span class="pcard-id" data-no-translate>${r.id}</span><span class="chip-domain">${escapeHtml(r.domain)}</span><span class="chip-prio prio-${(r.priority||'Medium').toLowerCase()}">${(r.priority||'Medium').toUpperCase()}</span></div><div class="pd-title">${escapeHtml(r.title)}</div>`,
    body: `
      ${r.image && !String(r.image).startsWith('data:image/svg') ? `<img class="report-hero-img" src="${r.image}" alt="" onerror="handleImageError(this, '${r.domain}')" />` : ''}
      <p class="report-desc" style="font-size:14px;">${escapeHtml(r.desc)}</p>

      <div class="pd-info">
        <div>
          <div class="pd-info-h">${icon('pin',15)} Physical location</div>
          <div class="pd-info-v">${escapeHtml(r.area)}</div>
          <div class="pd-info-s pd-mono">${loc.lat.toFixed(5)}° N, ${loc.lng.toFixed(5)}° E · ${loc.precise ? 'Device GPS' : 'Estimated from locality'}</div>
        </div>
        <div>
          <div class="pd-info-h">${icon('users',15)} Citizen impact &amp; reporter</div>
          <div class="pd-info-v">${formatCount(r.affected)} people affected</div>
          <div class="pd-info-s">Submitted by <strong>${escapeHtml(r.citizen || 'Citizen')}</strong>${r.created ? ' (' + formatDate(r.created) + ')' : ''}</div>
          <div class="pd-info-s">${icon('heart',11)} ${r.supports || 0} supports${pv ? ` (${pv} by phone)` : ''} · ${icon('layers',11)} ${r.clusterOf || 1} same-problem report${(r.clusterOf || 1) === 1 ? '' : 's'}</div>
        </div>
      </div>

      <div class="pd-tl">
        <div class="pd-tl-head">
          <div>
            <div class="pd-tl-title">${icon('target',16)} Project milestone timeline</div>
            <div class="pd-tl-sub">From problem to verified field deployment</div>
          </div>
          <div class="pd-progress"><span>Overall progress</span><strong>${pct}%</strong><div class="pd-bar"><i style="width:${pct}%"></i></div></div>
        </div>
        <div class="pd-phases">
          ${PROBLEM_PHASES.map((p, i) => `
            <div class="pd-phase ${phases[i]}">
              <div class="pd-phase-ic">${phases[i] === 'done' ? icon('check',18) : icon(p.icon,18)}</div>
              <div class="pd-phase-name"><em>0${i + 1}</em> ${p.key}</div>
              <div class="pd-phase-sub">${p.sub}</div>
              <span class="pd-phase-tag">${phases[i] === 'done' ? 'Done' : (phases[i] === 'active' ? 'In progress' : 'Upcoming')}</span>
            </div>`).join('')}
        </div>
      </div>

      <div>
        <div class="pd-info-h" style="margin-bottom:6px;">${icon('shield',15)} Who is responsible</div>
        ${responsibleHtml(r)}
        ${history.length > 1 ? `<div class="pd-info-s" style="margin-top:6px;">${history.length} replies on record — see the Accountability board.</div>` : ''}
      </div>

      <div class="pd-phone">${icon('bell',14)} <span>Back this problem for free from any phone: <a href="${telHref(r.voteNumber)}" data-no-translate>${r.voteNumber}</a></span>
        <button type="button" class="btn btn-ghost btn-sm" data-speak-report="${r.id}">${icon('volume',13)} Listen</button></div>
    `,
    footer: `<button class="btn btn-outline" data-modal-close>Close</button>`,
  });
}

// One delegated handler: any [data-inspect] opens the detail modal.
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-inspect]');
  if (el){ e.preventDefault(); openProblemDetail(el.dataset.inspect); }
});
