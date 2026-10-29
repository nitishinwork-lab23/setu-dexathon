/* ============================================================
   SETU — App shell: auth, routing, sidebar, modal, helpers
   ============================================================ */

const MODULES = {
  citizen: Citizen,
  government: Government,
  university: University,
  student: Student,
  industry: Industry,
  admin: Admin,
};

let currentView = 'dashboard';

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------
function firstName(name){ return (name||'').split(' ')[0]; }
function escapeHtml(str){
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function initials(name){
  return (name||'?').split(' ').filter(Boolean).slice(0,2).map(w=>w[0].toUpperCase()).join('');
}
function formatDate(iso){
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  return d.toLocaleDateString(undefined, { day:'numeric', month:'short' });
}
function futureDate(days){
  const d = new Date(); d.setDate(d.getDate()+days);
  return d.toISOString().slice(0,10);
}
function isOverdue(iso){
  return new Date(iso) < new Date(new Date().toDateString());
}

// ---------------------------------------------------------------
// Image compression for slow networks.
// Phone photos are 2–6 MB. Before anything is stored or uploaded the photo is
// shrunk and re-encoded as JPEG until it fits a small budget — about 110 KB
// normally and about 40 KB in Low-data mode (roughly 50–100x smaller).
// ---------------------------------------------------------------
function dataUrlBytes(u){ return Math.round((String(u).length - String(u).indexOf(',') - 1) * 3 / 4); }
function fmtBytes(n){ return n >= 1048576 ? (n/1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n/1024)) + ' KB'; }

function compressCanvasSource(source, srcW, srcH, originalBytes){
  const low = lowBwOn();
  let maxDim = low ? 480 : 800;
  const budget = low ? 40 * 1024 : 110 * 1024;
  let quality = low ? 0.6 : 0.75;
  let url = '';
  for (let attempt = 0; attempt < 4; attempt++){
    const scale = Math.min(1, maxDim / Math.max(srcW, srcH));
    const w = Math.max(1, Math.round(srcW * scale)), h = Math.max(1, Math.round(srcH * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
    ctx.drawImage(source, 0, 0, w, h);
    let q = quality;
    url = canvas.toDataURL('image/jpeg', q);
    while (dataUrlBytes(url) > budget && q > 0.35){ q -= 0.08; url = canvas.toDataURL('image/jpeg', q); }
    if (dataUrlBytes(url) <= budget) break;
    maxDim = Math.round(maxDim * 0.75); // still too big: shrink the picture itself
  }
  resizeImageFile.last = { from: originalBytes || 0, to: dataUrlBytes(url), low };
  return url;
}

// File input path (gallery / native camera picker).
function resizeImageFile(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result); // can't decode: keep the original
      img.onload = () => resolve(compressCanvasSource(img, img.naturalWidth || img.width, img.naturalHeight || img.height, file.size));
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// ---------------------------------------------------------------
// Text-to-speech ("Listen") and speech-to-text ("Speak instead").
// Both use the phone/browser's built-in engines, so no audio is sent
// over the network — far less data than recording and uploading audio,
// and it lets people who can't read still hear a problem's status.
// ---------------------------------------------------------------
function appSpeechLang(){
  const lang = (typeof I18N !== 'undefined' && I18N.getLang) ? I18N.getLang() : 'en';
  const meta = (typeof I18N !== 'undefined' && I18N.LANG_META && I18N.LANG_META[lang]) || { speech: 'en-IN', label: 'English' };
  return { lang, speech: meta.speech || 'en-IN', label: meta.label };
}
function speakText(text){
  if (!('speechSynthesis' in window)){ toast('This phone cannot read aloud.'); return; }
  const synth = window.speechSynthesis;
  if (synth.speaking){ synth.cancel(); }
  const { speech } = appSpeechLang();
  const u = new SpeechSynthesisUtterance(String(text));
  u.lang = speech; u.rate = 0.92;
  const voices = synth.getVoices ? synth.getVoices() : [];
  const v = voices.find(x => x.lang === speech) || voices.find(x => x.lang && x.lang.slice(0,2) === speech.slice(0,2));
  if (v) u.voice = v;
  else if (voices.length && speech.slice(0,2) !== 'en') toast('No ' + appSpeechLang().label + ' voice on this device — reading in the default voice.');
  synth.speak(u);
}
function reportSpeech(id){
  const r = DB.getAllReportsIncludingSpam().find(x => x.id === id);
  if (!r) return '';
  const who = DB.getResponsiblePerson(r);
  const delay = DB.getDelayInfo(r);
  const rep = delay && delay.reply;
  const bits = [
    `Problem: ${r.title}. Place: ${r.area}.`,
    `Responsible: ${who.name}, ${who.title}.` + (who.actingFor ? ` Acting for ${who.actingFor.name}.` : ''),
    delay ? `This is ${delay.days} days late.` : 'This is on schedule.',
  ];
  if (rep) bits.push(`The authority says: ${(REPLY_KINDS[rep.kind]||{}).label || ''}. ${rep.note}`);
  bits.push(`${r.supports || 0} people back this problem.`);
  if (r.voteNumber) bits.push(`To back it, call ${String(r.voteNumber).replace(/\D/g,'').split('').join(' ')}. The call is free.`);
  return bits.join(' ');
}

// Dictate into a textarea/input with speech-to-text (no audio is saved).
let _dictation = null;
function dictateInto(target, btn){
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor){ toast('Speech-to-text is not supported in this browser.'); return; }
  if (window.isSecureContext === false){ toast('Speech-to-text needs HTTPS.'); return; }
  const idle = btn.dataset.idleHtml || (btn.dataset.idleHtml = btn.innerHTML);
  if (_dictation){ try { _dictation.stop(); } catch(e){} return; }
  const rec = new Ctor();
  rec.lang = appSpeechLang().speech;
  rec.continuous = true; rec.interimResults = false;
  const base = target.value ? target.value.trim() + ' ' : '';
  let said = '';
  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) said += e.results[i][0].transcript + ' ';
    target.value = (base + said).trim();
  };
  rec.onerror = (e) => { if (e.error !== 'aborted') toast('Speech-to-text did not work (' + e.error + ').'); };
  rec.onend = () => { _dictation = null; btn.classList.remove('recording'); btn.innerHTML = idle; };
  try { rec.start(); _dictation = rec; btn.classList.add('recording'); if (!btn.dataset.iconOnly) btn.innerHTML = icon('mic',14) + ' Listening… tap to stop'; }
  catch(e){ _dictation = null; }
}

// One delegated handler so every view gets Listen / Speak buttons for free.
document.addEventListener('click', (e) => {
  const sp = e.target.closest('[data-speak-report]');
  if (sp){ e.preventDefault(); speakText(reportSpeech(sp.dataset.speakReport)); return; }
  const st = e.target.closest('[data-speak-text]');
  if (st){ e.preventDefault(); speakText(st.dataset.speakText); return; }
  const dc = e.target.closest('[data-dictate-into]');
  if (dc){
    e.preventDefault();
    const scope = dc.dataset.dictateById ? document : (dc.closest('form') || document);
    const target = dc.dataset.dictateById ? document.getElementById(dc.dataset.dictateInto) : scope.querySelector('[name="' + dc.dataset.dictateInto + '"], #' + dc.dataset.dictateInto);
    if (target) dictateInto(target, dc);
  }
});

function handleImageError(imgEl, domain = "Other") {
  if (!imgEl || imgEl.dataset.failed) return;
  imgEl.dataset.failed = "true";
  imgEl.src =
    typeof getSvgFallback === "function"
      ? getSvgFallback(domain)
      : 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%23ccc"><rect width="100" height="100"/></svg>';
}


// ---------------------------------------------------------------
// Responsible person + delay reason
// Shows WHO owns an item and, if it is past its deadline, WHY it is late.
// `item` is a report or challenge; `opts.delayFrom` lets a cluster borrow
// the delay of its most-overdue report.
// ---------------------------------------------------------------
function responsibleHtml(item, opts = {}){
  const who = DB.getResponsiblePerson(item);
  const delay = DB.getDelayInfo(opts.delayFrom || item);
  const reply = delay && delay.reply;
  const kind = reply ? (REPLY_KINDS[reply.kind] || { label: reply.kind }) : null;
  return `<div class="resp-block${delay ? ' is-delayed' : ''}">
    <div class="resp-name">${icon('users',12)} <strong>${escapeHtml(who.name)}</strong><span class="resp-title">${escapeHtml(who.title)}</span></div>
    ${who.actingFor ? `<div class="resp-acting">Acting for ${escapeHtml(who.actingFor.name)} (${escapeHtml(who.actingFor.title)})</div>` : ''}
    ${delay ? `<div class="resp-delay">${icon('clock',12)} <span><strong>Delayed ${delay.days} day${delay.days===1?'':'s'}</strong> — ${delay.reason}</span></div>` : ''}
    ${reply ? `<div class="resp-reply">${icon('flag',12)} <span><strong>${escapeHtml(kind.label)}</strong> — ${escapeHtml(reply.note.length > 140 ? reply.note.slice(0,137) + '…' : reply.note)}</span></div>` : ''}
  </div>`;
}

// ---------------------------------------------------------------
// Low-bandwidth mode (state lives in LowBW, defined in index.html <head>
// so it can also stop the web font from loading).
// Auto-enabled on Data Saver / 2G / 3G; the topbar button overrides it.
// ---------------------------------------------------------------
function lowBwOn(){ return !!(window.LowBW && window.LowBW.isOn()); }

// Swap remote <img> URLs for tiny inline SVG placeholders in an HTML string,
// before the browser ever starts downloading them. Photos the citizen
// uploaded (data: URLs) are already local and are kept.
function lowBwHtml(html){
  if (!lowBwOn() || typeof html !== 'string') return html;
  return html.replace(/<img\b[^>]*>/g, tag => {
    if (!/\ssrc="https?:\/\//.test(tag)) return tag;
    const m = tag.match(/handleImageError\(this,\s*'([^']*)'/);
    const domain = m ? m[1] : 'Other';
    const fb = getSvgFallback(domain).replace(/"/g, '&quot;');
    return tag.replace(/\ssrc="https?:\/\/[^"]*"/, ` src="${fb}"`);
  });
}

function paintLowBwUI(){
  const on = lowBwOn();
  document.documentElement.classList.toggle('low-bw', on);
  const btn = document.getElementById('lowbw-btn');
  if (btn){
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.title = on ? 'Low-bandwidth mode is ON: no remote photos, map tiles or web fonts.'
                   : 'Turn on to save data: no remote photos, map tiles or web fonts.';
    btn.querySelector('.lowbw-label').textContent = on ? 'Low data: On' : 'Low data: Off';
  }
}

// ---------------------------------------------------------------
// GIS map — dependency-free. Pins are placed from DB_LOCATION.resolve()
// (real GPS when captured, locality anchor otherwise). OpenStreetMap tiles
// are drawn underneath when online; in low-bandwidth mode (or if tiles
// fail) the pins sit on a plain grid, so the map is never blank.
// ---------------------------------------------------------------
function renderGisMap(reports, opts = {}){
  const pts = (reports || []).map(r => ({ r, loc: DB_LOCATION.resolve(r) }));
  if (!pts.length) return `<div class="gis-map gis-empty">${icon('pin',24)}<span>No reports to plot yet.</span></div>`;

  const lngToX = (lng, z) => (lng + 180) / 360 * Math.pow(2, z);
  const latToY = (lat, z) => { const t = lat * Math.PI / 180; return (1 - Math.log(Math.tan(t) + 1 / Math.cos(t)) / Math.PI) / 2 * Math.pow(2, z); };

  let minLat = Math.min(...pts.map(p => p.loc.lat)), maxLat = Math.max(...pts.map(p => p.loc.lat));
  let minLng = Math.min(...pts.map(p => p.loc.lng)), maxLng = Math.max(...pts.map(p => p.loc.lng));
  const padLat = Math.max((maxLat - minLat) * 0.2, 0.012), padLng = Math.max((maxLng - minLng) * 0.2, 0.012);
  minLat -= padLat; maxLat += padLat; minLng -= padLng; maxLng += padLng;

  let z = 14, x0, x1, y0, y1;
  for (; z >= 5; z--) {
    x0 = Math.floor(lngToX(minLng, z)); x1 = Math.floor(lngToX(maxLng, z));
    y0 = Math.floor(latToY(maxLat, z)); y1 = Math.floor(latToY(minLat, z));
    if (x1 - x0 + 1 <= 3 && y1 - y0 + 1 <= 3) break;
  }
  if (x1 === x0) x1++;
  if (y1 === y0) y1++;
  const nx = x1 - x0 + 1, ny = y1 - y0 + 1;

  const tiles = [];
  if (!lowBwOn()) {
    const subdomains = ['a', 'b', 'c', 'd'];
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const s = subdomains[Math.abs(tx + ty) % subdomains.length];
      const primaryUrl = `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${tx}/${ty}.png`;
      const fallbackUrl = `https://${s}.basemaps.cartocdn.com/light_all/${z}/${tx}/${ty}.png`;
      tiles.push(`<img class="gis-tile" alt="" loading="lazy" decoding="async" src="${primaryUrl}" style="left:${(tx - x0) / nx * 100}%; top:${(ty - y0) / ny * 100}%; width:${100 / nx}%; height:${100 / ny}%;" onerror="if(this.dataset.triedFallback){this.style.display='none';}else{this.dataset.triedFallback='1';this.src='${fallbackUrl}';}" />`);
    }
  }

  const color = { High: 'var(--danger)', Medium: 'var(--warn)', Low: 'var(--ok)' };
  const pins = pts.map(({ r, loc }) => {
    const left = (lngToX(loc.lng, z) - x0) / nx * 100;
    const top = (latToY(loc.lat, z) - y0) / ny * 100;
    return `<button type="button" class="gis-pin" data-view-location="${r.id}" style="left:${left}%; top:${top}%; --pin:${color[r.priority] || 'var(--accent)'};" title="${r.title} — ${r.area} (${r.priority} priority)" aria-label="${r.title}, ${r.area}"><span></span></button>`;
  }).join('');

  return `<div class="gis-wrap">
    <div class="gis-map" style="aspect-ratio:${nx} / ${ny}; ${opts.maxHeight ? `max-height:${opts.maxHeight}px;` : ''}">
      ${tiles.join('')}${pins}
    </div>
    <div class="gis-legend">
      <span><i style="background:var(--danger)"></i>High</span>
      <span><i style="background:var(--warn)"></i>Medium</span>
      <span><i style="background:var(--ok)"></i>Low</span>
      <span class="gis-count">${pts.length} report${pts.length===1?'':'s'} plotted</span>
    </div>
    <div class="gis-attrib">${lowBwOn() ? 'Low-bandwidth mode: map tiles off · tap a pin for details' : 'Tap a pin for details · © OpenStreetMap contributors, © CARTO'}</div>
  </div>`;
}

let toastTimer = null;
function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  if (typeof I18N !== 'undefined') I18N.applyAll(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.classList.remove('show'), 2600);
}

// ---------------------------------------------------------------
// Modal
// ---------------------------------------------------------------
function openModal({ title, body, footer, onMount, wide }){
  const root = document.getElementById('modal-root');
  root.innerHTML = `
    <div class="modal-backdrop" id="modal-backdrop">
      <div class="modal${wide ? ' modal-wide' : ''}" role="dialog" aria-modal="true">
        <div class="modal-head">
          <div class="modal-title">${title}</div>
          <button class="icon-btn" data-modal-close>${icon('x',16)}</button>
        </div>
        <div class="modal-body">${lowBwHtml(body)}</div>
        ${footer ? `<div class="modal-foot">${footer}</div>` : ''}
      </div>
    </div>
  `;
  root.querySelectorAll('[data-modal-close]').forEach(b=>b.addEventListener('click', closeModal));
  document.getElementById('modal-backdrop').addEventListener('click', (e)=>{
    if (e.target.id === 'modal-backdrop') closeModal();
  });
  if (onMount) onMount();
  if (typeof I18N !== 'undefined') I18N.applyAll(root);
}
function closeModal(){ document.getElementById('modal-root').innerHTML = ''; }

// ---------------------------------------------------------------
// Evidence modal — shows a report's attached photo and/or voice note.
// The voice note plays back the original recording, and — if it was
// transcribed via the Web Speech API at submission time — also shows
// the spoken-language transcript plus its English translation (when
// the note wasn't already in English), so a reviewer who doesn't speak
// the citizen's language can still read what was reported.
// ---------------------------------------------------------------
function openEvidenceModal(report){
  if (!report) return;
  const hasPhoto = !!report.image;
  const hasAudio = !!report.audioNote;
  const transcriptHtml = report.audioTranscript ? `
    <div style="margin-top:10px; padding:10px 12px; border-radius:10px; background:var(--accent-soft, #f1f5f9); font-size:13px; line-height:1.5;">
      <div style="font-weight:600; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
        ${icon('mic',13)} Voice-to-text transcript${report.audioTranscriptLang ? ` (${report.audioTranscriptLang})` : ''}
      </div>
      <div>${escapeHtml(report.audioTranscript)}</div>
      ${report.audioTranscriptEn && report.audioTranscriptEn !== report.audioTranscript ? `
        <div style="font-weight:600; margin:8px 0 4px; display:flex; align-items:center; gap:6px;">
          ${icon('globe',13)} Translated to English
        </div>
        <div>${escapeHtml(report.audioTranscriptEn)}</div>
      ` : ''}
    </div>
  ` : (hasAudio ? `<div style="margin-top:10px; font-size:12px; color:var(--ink-faint);">Transcription wasn't available for this recording (unsupported browser) — audio only.</div>` : '');

  openModal({
    title: 'Evidence',
    body: `
      ${hasPhoto ? `<img src="${report.image}" alt="Report evidence" style="width:100%; border-radius:10px; display:block; margin-bottom:${hasAudio ? '14px' : '0'};" />` : ''}
      ${hasAudio ? `<audio controls src="${report.audioNote}" style="width:100%;"></audio>` : ''}
      ${!hasPhoto && !hasAudio ? `<div class="empty-state">${icon('camera',30)}<p>No photo or voice note was attached to this report.</p></div>` : ''}
      ${transcriptHtml}
    `,
    footer: `<button class="btn btn-primary" data-modal-close>Close</button>`,
  });
}

// ---------------------------------------------------------------
// Precise location modal — shared by Citizen / Government / Admin.
// Resolves a report's coordinates (real GPS if captured, otherwise an
// AI-estimated point for its locality), shows them on an embedded map,
// and reverse-geocodes them into a street-level address live via the
// free OpenStreetMap Nominatim API (same no-key-needed pattern as the
// language toggle's MyMemory calls in i18n.js).
// ---------------------------------------------------------------
function openLocationModal(report){
  if (!report) return;
  const loc = DB.resolveLocation(report);
  const gmapsUrl = `https://www.google.com/maps?q=${loc.lat},${loc.lng}`;

  openModal({
    title: 'Precise location',
    body: `
      <div style="border-radius:10px; overflow:hidden; border:1px solid var(--line); margin-bottom:12px;">
        ${renderGisMap([report], { maxHeight: 220 })}
      </div>
      <div class="tag" style="display:inline-flex; align-items:center; gap:6px; width:fit-content; margin-bottom:8px;">
        ${icon('pin',12)} ${loc.precise ? 'Precise GPS location' : 'AI-estimated location'}
      </div>
      <div style="font-size:13px; color:var(--ink-soft);">
        <div style="margin-bottom:4px;"><strong>Coordinates:</strong> ${loc.lat.toFixed(6)}, ${loc.lng.toFixed(6)}</div>
        <div style="margin-bottom:4px;"><strong>Source:</strong> ${loc.source}</div>
        <div id="loc-modal-address"><strong>Resolved address:</strong> Looking up exact address…</div>
      </div>
    `,
    footer: `
      <a class="btn btn-outline" href="${gmapsUrl}" target="_blank" rel="noopener">${icon('arrowRight',14)} Open in Google Maps</a>
      <button class="btn btn-primary" data-modal-close>Close</button>
    `,
    onMount: () => {
      const addrEl = document.getElementById('loc-modal-address');
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=18&addressdetails=1`)
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          if (!addrEl) return;
          const addr = data && data.display_name ? data.display_name : null;
          addrEl.innerHTML = addr
            ? `<strong>Resolved address:</strong> ${addr}`
            : `<strong>Resolved address:</strong> ${loc.streetGuess ? loc.streetGuess + ', ' : ''}${report.area || 'Unknown locality'}`;
        })
        .catch(() => {
          if (!addrEl) return;
          addrEl.innerHTML = `<strong>Resolved address:</strong> ${loc.streetGuess ? loc.streetGuess + ', ' : ''}${report.area || 'Unknown locality'} <span style="color:var(--ink-faint);">(offline — showing nearest known locality)</span>`;
        });
    },
  });
}

// ---------------------------------------------------------------
// Toll-free helpline — the phone-based alternative to filing online.
// Number lives in DB.settings (admin-editable) so it's not hardcoded
// in multiple templates; this keeps every place that shows it in sync.
// ---------------------------------------------------------------
function telHref(number){ return 'tel:' + String(number || '').replace(/[^0-9+]/g, ''); }

function paintAuthHelpline(){
  const link = document.getElementById('auth-helpline-link');
  if (!link) return;
  const s = DB.getSettings();
  link.textContent = s.tollFreeNumber;
  link.href = telHref(s.tollFreeNumber);
}

function paintSidebarHelpline(session){
  const el = document.getElementById('sidebar-helpline');
  if (!el) return;
  if (!session || session.role !== 'citizen'){ el.classList.add('hidden'); return; }
  const s = DB.getSettings();
  el.classList.remove('hidden');
  el.innerHTML = `
    ${icon('bell',15)}
    <span>Toll-free helpline<br><a href="${telHref(s.tollFreeNumber)}" data-no-translate>${s.tollFreeNumber}</a><small>${s.tollFreeHours || ''}</small></span>
  `;
}

// ---------------------------------------------------------------
// Router
// ---------------------------------------------------------------
function navigate(view){
  currentView = view;
  renderApp();
  document.getElementById('main-view').scrollTo?.(0,0);
  window.scrollTo(0,0);
  closeSidebarMobile();
}

function renderApp(){
  const session = DB.getSession();
  if (!session) return;
  const mod = MODULES[session.role];
  if (!mod) return;
  const ctx = { session };

  // Sidebar
  const sidebarNav = document.getElementById('sidebar-nav');
  if (sidebarNav && mod.nav) {
    // Build sidebar with collapsible groups
    let sidebarHtml = '';
    let lastGroup = null;
    mod.nav.forEach(n => {
      const group = n.group || 'Main';
      if(group !== lastGroup){
        if(lastGroup !== null) sidebarHtml += '</div>'; // close previous group
        sidebarHtml += `<div class="sidebar-group" data-group="${group}">`;
        sidebarHtml += `<div class="sidebar-group-label" data-toggle-group="${group}"><span>${group}</span> <span class="chevron">▼</span></div>`;
        lastGroup = group;
      }
      const iconSvg = typeof icon === 'function' ? icon(n.icon, 18) : '';
      sidebarHtml += `<button class="nav-item nav-btn${n.id===currentView?' active':''}" data-nav="${n.id}">${iconSvg}<span>${n.label}</span></button>`;
    });
    if(lastGroup !== null) sidebarHtml += '</div>';
    sidebarNav.innerHTML = sidebarHtml;

    sidebarNav.querySelectorAll('[data-nav]').forEach(btn=>{
      btn.addEventListener('click', ()=> navigate(btn.dataset.nav));
    });
    sidebarNav.querySelectorAll('[data-toggle-group]').forEach(label => {
      label.addEventListener('click', () => {
        const group = label.closest('.sidebar-group');
        if(group) group.classList.toggle('collapsed');
        label.classList.toggle('collapsed');
      });
    });
  }

  // Main content
  const main = document.getElementById('main-view');
  const mainView = main;
  try {
    if (currentView === 'solutions') {
      main.innerHTML = lowBwHtml(renderSolutionLibraryHTML());
      bindSolutionLibraryEvents(main);
    } else if (currentView === 'transparency') {
      main.innerHTML = lowBwHtml(renderPublicTransparencyHTML());
      bindPublicTransparencyEvents(main);
    } else {
      main.innerHTML = lowBwHtml(mod.render(currentView, ctx));
      if (mod.bind) mod.bind(currentView, ctx, renderApp);
    }
    if (currentView === 'accountability') Accountability.bind(main, renderApp, session);
    if (currentView === 'phone' || currentView === 'calls') Phone.bind(currentView, ctx, renderApp);
  } catch (err) {
    console.error("View rendering error:", err);
    main.innerHTML = `<div class="card card-pad" style="margin:20px;">
      <h2 style="color:var(--danger)">Rendering Error</h2>
      <p style="color:var(--ink-soft); margin-top:8px;">${err.message}</p>
      <button class="btn btn-primary" style="margin-top:14px;" onclick="location.reload()">Reload App</button>
    </div>`;
  }

  // Top bar identity
  const rolePill = document.getElementById('role-pill');
  if (rolePill) rolePill.textContent = (typeof ROLE_LABELS !== 'undefined' && ROLE_LABELS[session.role]) ? ROLE_LABELS[session.role] : session.role;

  const verifiedPill = document.getElementById('verified-id-pill');
  if (verifiedPill) {
    if (session.verifiedId && session.verifiedId.type) {
      verifiedPill.classList.remove('hidden');
      verifiedPill.title = `${session.verifiedId.type}: ${session.verifiedId.value}`;
      verifiedPill.innerHTML = `${icon('checkCircle',11)} ${session.verifiedId.type} verified`;
    } else {
      verifiedPill.classList.add('hidden');
    }
  }
  
  const userAvatar = document.getElementById('user-avatar');
  if (userAvatar) userAvatar.textContent = initials(session.name);

  // Sidebar tip per role
  const tips = {
    citizen: 'Report with a photo and location so reviewers can validate it faster.',
    government: 'The AI suggests priority and routing — you always make the final call.',
    university: 'Keep your capability profile current so matching stays accurate.',
    student: 'Skill gaps aren\u2019t blockers — join a challenge and follow the recommended learning path.',
    industry: 'Pilot-Ready projects have the most evidence behind their maturity tag.',
    admin: 'Use Settings → Reset demo data before a live walkthrough.',
  };
  const sidebarTip = document.getElementById('sidebar-tip');
  if (sidebarTip) sidebarTip.textContent = tips[session.role] || '';
  paintSidebarHelpline(session);

  // Notifications dot
  const unread = DB.getNotifications().filter(n=>!n.read).length;
  const notifDot = document.getElementById('notif-dot');
  if (notifDot) notifDot.classList.toggle('hidden', unread === 0);

  paintLowBwUI();
  if (typeof I18N !== 'undefined') I18N.applyAll(document.body);
}

// ---------------------------------------------------------------
// Notifications popover (simple modal)
// ---------------------------------------------------------------
function showNotifications(){
  const notes = DB.getNotifications();
  let body = notes.length ? notes.map(n=>`
    <div style="display:flex; gap:10px; padding:10px 0; border-bottom:1px solid var(--line-soft);">
      <div style="width:8px; height:8px; border-radius:50%; background:${n.read?'var(--line)':'var(--accent)'}; margin-top:6px; flex-shrink:0;"></div>
      <div><div style="font-size:13.5px;">${n.text}</div><div style="font-size:11.5px; color:var(--ink-faint); margin-top:2px;">${n.time}</div></div>
    </div>
  `).join('') : `<div class="empty-state">${icon('bell',28)}<p>No notifications yet.</p></div>`;

  body += `
    <div style="margin-top:18px; padding-top:14px; border-top:1px solid var(--line);">
      <div style="font-weight:700; font-size:12px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-faint); margin-bottom:10px;">
        Notification Channel Preferences
      </div>
      <div class="notif-pref-row">
        <div>
          <div style="font-weight:600; font-size:13px;">SMS Alerts</div>
          <div style="font-size:11.5px; color:var(--ink-faint);">Instant text message for high-priority updates</div>
        </div>
        <button type="button" class="notif-toggle active" data-pref="SMS" aria-label="Toggle SMS"></button>
      </div>
      <div class="notif-pref-row">
        <div>
          <div style="font-weight:600; font-size:13px;">WhatsApp Updates</div>
          <div style="font-size:11.5px; color:var(--ink-faint);">Weekly progress summary & community actions</div>
        </div>
        <button type="button" class="notif-toggle active" data-pref="WhatsApp" aria-label="Toggle WhatsApp"></button>
      </div>
      <div class="notif-pref-row">
        <div>
          <div style="font-weight:600; font-size:13px;">Automated IVR Calls</div>
          <div style="font-size:11.5px; color:var(--ink-faint);">Voice phone call when report reaches resolution</div>
        </div>
        <button type="button" class="notif-toggle" data-pref="IVR" aria-label="Toggle IVR"></button>
      </div>
    </div>
  `;

  openModal({
    title: 'Notifications',
    body,
    footer: `<button class="btn btn-outline" data-modal-close>Close</button>`,
    onMount: () => {
      document.querySelectorAll('.notif-toggle').forEach(t => {
        t.addEventListener('click', () => {
          t.classList.toggle('active');
          const channel = t.dataset.pref;
          const status = t.classList.contains('active') ? 'enabled' : 'disabled';
          toast(`${channel} notifications ${status}.`);
        });
      });
    }
  });
  DB.markAllRead();
  const notifDot = document.getElementById('notif-dot');
  if (notifDot) notifDot.classList.add('hidden');
}

// ---------------------------------------------------------------
// Sidebar mobile toggle
// ---------------------------------------------------------------
function closeSidebarMobile(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-scrim').classList.add('hidden');
}
function openSidebarMobile(){
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-scrim').classList.remove('hidden');
}

/* ============================================================
   Public Transparency Portal & Solution Library (Phase 5)
   ============================================================ */

function renderPublicTransparencyHTML(){
  const reports = typeof DB !== 'undefined' && DB.getReports ? DB.getReports() : [];
  const challenges = typeof DB !== 'undefined' && DB.getChallenges ? DB.getChallenges() : [];
  const solutions = typeof DB !== 'undefined' && DB.getSolutionLibrary ? DB.getSolutionLibrary() : [];

  const resolved = reports.filter(r => r.status === 'done').length;
  const inProgress = reports.filter(r => r.status === 'progress').length;

  return `
    <div class="transparency-hero">
      <h1>Jharkhand Civic Transparency Portal</h1>
      <p>Real-time open civic monitoring across all 24 Jharkhand districts. Public tracking of citizen issues, university innovations, and department actions.</p>
    </div>

    <div class="transparency-stats">
      <div class="transparency-stat">
        <strong>${reports.length}</strong>
        <span>Total Problems Filed</span>
      </div>
      <div class="transparency-stat">
        <strong style="color:var(--warn);">${inProgress}</strong>
        <span>Active in Development</span>
      </div>
      <div class="transparency-stat">
        <strong style="color:var(--ok);">${resolved}</strong>
        <span>Citizen Verified Fixed</span>
      </div>
      <div class="transparency-stat">
        <strong style="color:var(--accent);">${challenges.length}</strong>
        <span>Academic R&D Projects</span>
      </div>
      <div class="transparency-stat">
        <strong>24</strong>
        <span>Districts Monitored</span>
      </div>
    </div>

    <div class="card card-pad" style="margin-bottom:24px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
        <h3 class="section-title" style="margin:0;">Open Civic Reports Feed</h3>
        <span style="font-size:12px; color:var(--ink-faint);">Live Public Registry · Open Access</span>
      </div>
      <div style="overflow-x:auto;">
        <table class="data-table">
          <thead>
            <tr><th>ID</th><th>Problem Title</th><th>Locality</th><th>Domain</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${reports.slice(0, 10).map(r => `
              <tr>
                <td><strong>${r.id}</strong></td>
                <td>${escapeHtml(r.title)}</td>
                <td>📍 ${escapeHtml(r.area)}</td>
                <td><span class="tag">${r.domain}</span></td>
                <td><span class="tag status-${r.status}">${r.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card card-pad">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
        <div>
          <h3 class="section-title" style="margin:0;">Deployed Solutions in Knowledge Library</h3>
          <p style="font-size:13px; color:var(--ink-soft); margin:2px 0 0;">Field-tested innovations available for local deployment.</p>
        </div>
        <button class="btn btn-outline btn-sm" id="btn-trans-view-all-sol">Explore Full Library →</button>
      </div>
      <div class="sol-grid">
        ${solutions.slice(0, 4).map(s => `
          <div class="sol-card">
            <div class="sol-card-title">${escapeHtml(s.title)}</div>
            <div class="sol-card-meta">
              📍 <strong>${s.district}</strong> · 🏛️ ${s.source}<br/>
              🎯 Impact: ${s.impact}
            </div>
            <div class="sol-card-tags">
              ${(s.tags || []).map(t => `<span class="sol-tag">${t}</span>`).join('')}
            </div>
            <div class="sol-card-footer">
              <span>Cost: <strong>${s.cost}</strong></span>
              <span class="tag status-done">${s.status}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function bindPublicTransparencyEvents(root){
  const btn = root.querySelector('#btn-trans-view-all-sol');
  if (btn) btn.addEventListener('click', () => navigate('solutions'));
}

function openPublicTransparency(){
  openModal({
    title: '🏛️ Public Transparency Portal (Open Access)',
    body: renderPublicTransparencyHTML(),
    footer: `<button class="btn btn-primary" data-modal-close>Close</button>`,
    onMount: () => {
      const modalRoot = document.getElementById('modal-root');
      if (modalRoot) {
        const btn = modalRoot.querySelector('#btn-trans-view-all-sol');
        if (btn) btn.addEventListener('click', () => { closeModal(); openSolutionLibraryModal(); });
      }
    }
  });
}

function renderSolutionLibraryHTML(filterDomain){
  const solutions = typeof DB !== 'undefined' && DB.getSolutionLibrary ? DB.getSolutionLibrary() : [];
  const domains = ['All Domains', 'Water', 'Infrastructure', 'Agriculture', 'Health', 'Education'];

  return `
    <div class="view-head">
      <div><h1 class="view-title">Solution Library</h1><p class="view-sub">Proven, field-tested innovations and open models across Jharkhand districts.</p></div>
    </div>
    <div class="card card-pad" style="margin-bottom:20px;">
      <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
        <input type="text" id="sol-page-search" class="field" placeholder="Search solutions by keyword, district, tag…" style="flex:1; min-width:240px; margin:0;" />
        <select id="sol-page-domain" class="field" style="width:200px; margin:0;">
          ${domains.map(d => `<option value="${d==='All Domains'?'':d}" ${filterDomain===d?'selected':''}>${d}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="sol-grid" id="sol-page-grid">
      ${solutions.map(s => `
        <div class="sol-card" data-domain="${s.domain}" data-text="${(s.title + ' ' + s.description + ' ' + s.district + ' ' + (s.tags||[]).join(' ')).toLowerCase()}">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
            <div class="sol-card-title">${escapeHtml(s.title)}</div>
            <span class="tag">${s.domain}</span>
          </div>
          <p style="font-size:13px; color:var(--ink-soft); margin:6px 0 10px;">${escapeHtml(s.description)}</p>
          <div class="sol-card-meta">
            🏛️ <strong>Source:</strong> ${s.source}<br/>
            📍 <strong>District:</strong> ${s.district} · 🎯 <strong>Impact:</strong> ${s.impact}
          </div>
          <div class="sol-card-tags" style="margin:8px 0;">
            ${(s.tags || []).map(t => `<span class="sol-tag">${t}</span>`).join('')}
          </div>
          <div class="sol-card-footer">
            <span>Model: <strong>${s.fundingModel}</strong> (${s.cost})</span>
            <span class="tag status-done">${s.status}</span>
          </div>
          <button class="btn btn-outline btn-sm" style="margin-top:10px;" onclick="toast('Solution documentation requested.')">Request Implementation Details</button>
        </div>
      `).join('')}
    </div>
  `;
}

function bindSolutionLibraryEvents(root){
  const search = root.querySelector('#sol-page-search');
  const domainFilter = root.querySelector('#sol-page-domain');
  const filterCards = () => {
    const q = (search.value || '').toLowerCase();
    const dm = domainFilter.value;
    root.querySelectorAll('#sol-page-grid .sol-card').forEach(card => {
      const matchQ = (card.dataset.text || '').includes(q);
      const matchD = !dm || card.dataset.domain === dm;
      card.style.display = (matchQ && matchD) ? '' : 'none';
    });
  };
  if (search) search.addEventListener('input', filterCards);
  if (domainFilter) domainFilter.addEventListener('change', filterCards);
}

function openSolutionLibraryModal(initialDomain){
  openModal({
    title: '💡 Jharkhand Solution Library',
    body: renderSolutionLibraryHTML(initialDomain),
    footer: `<button class="btn btn-outline" data-modal-close>Close</button>`,
    onMount: () => {
      const modalRoot = document.getElementById('modal-root');
      if (modalRoot) bindSolutionLibraryEvents(modalRoot);
    }
  });
}

// ---------------------------------------------------------------
// Identity verification — role-specific ID check on the login form.
// This is a prototype-grade mock (format checks + a simulated OTP step
// for Aadhaar) standing in for real integrations: UIDAI eKYC for
// Aadhaar, AISHE/UGC lookup for college codes, GSTN validation for
// GSTIN, and a government HR directory for employee IDs.
// ---------------------------------------------------------------
const KNOWN_COLLEGE_CODES = {
  'BIT-MESRA': 'BIT Mesra',
  'NIT-JSR': 'NIT Jamshedpur',
  'IIT-ISM': 'IIT (ISM) Dhanbad',
};
const ID_RULES = {
  citizen: { method: 'aadhar' },
  student: { method: 'choice' },
  university: {
    method: 'format',
    label: 'College / AISHE Code',
    placeholder: 'e.g. BIT-MESRA',
    pattern: /^[A-Za-z0-9-]{4,20}$/,
    hint: "Your institution's AISHE or university code.",
    errorHint: 'College code should be 4–20 letters/numbers (e.g. BIT-MESRA).',
  },
  industry: {
    method: 'format',
    label: 'GSTIN (GST Identification Number)',
    placeholder: '22AAAAA0000A1Z5',
    pattern: /^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z][1-9A-Za-z]Z[0-9A-Za-z]$/,
    hint: 'The 15-character GST Identification Number issued to your organisation.',
    errorHint: "That doesn't look like a valid 15-character GSTIN.",
  },
  government: {
    method: 'format',
    label: 'Government Employee ID',
    placeholder: 'e.g. JH-GOV-2044',
    pattern: /^[A-Za-z0-9/-]{5,20}$/,
    hint: 'The ID printed on your government-issued employee card.',
    errorHint: 'Employee ID should be 5–20 letters/numbers (e.g. JH-GOV-2044).',
  },
};
const DEMO_OTP = '123456';
let authVerified = { ok: false, idType: null, idValue: null };

function maskId(value=''){
  const v = value.replace(/\s/g, '');
  if (v.length <= 4) return v;
  return v.slice(0, 2) + '•'.repeat(Math.max(v.length - 6, 2)) + v.slice(-4);
}

// Renders the identity-verification block for the currently selected role.
function renderIdSection(role, studentType='college'){
  const box = document.getElementById('auth-id-section');
  if (!box) return;
  authVerified = { ok: false, idType: null, idValue: null };

  if (!role || role === 'admin'){
    box.innerHTML = '';
    box.style.display = 'none';
    return;
  }
  box.style.display = 'block';

  const rule = ID_RULES[role];
  if (rule.method === 'aadhar'){
    box.innerHTML = aadharFieldHtml('citizen');
  } else if (rule.method === 'choice'){
    box.innerHTML = `
      <div class="field">
        <span class="field-label">Verify using</span>
        <div style="display:flex; gap:14px; margin-top:4px;">
          <label style="display:flex; align-items:center; gap:6px; font-size:13.5px; font-weight:500; cursor:pointer;">
            <input type="radio" name="student-id-type" value="college" ${studentType==='college'?'checked':''} /> College ID
          </label>
          <label style="display:flex; align-items:center; gap:6px; font-size:13.5px; font-weight:500; cursor:pointer;">
            <input type="radio" name="student-id-type" value="aadhar" ${studentType==='aadhar'?'checked':''} /> Aadhar
          </label>
        </div>
      </div>
      <div id="student-id-body"></div>
    `;
    document.querySelectorAll('input[name="student-id-type"]').forEach(r=>{
      r.addEventListener('change', () => renderStudentIdBody(r.value));
    });
    renderStudentIdBody(studentType);
  } else {
    box.innerHTML = formatFieldHtml(rule);
    wireFormatField(role, rule);
  }
}

function renderStudentIdBody(type){
  const body = document.getElementById('student-id-body');
  if (!body) return;
  if (type === 'aadhar'){
    body.innerHTML = aadharFieldHtml('student');
    wireAadharField('student');
  } else {
    const rule = { label: 'College ID Card Number', placeholder: 'e.g. BIT/2023/CSE/104', pattern: /^[A-Za-z0-9/-]{4,25}$/, hint: 'The ID printed on your student college ID card.', errorHint: 'College ID should be 4–25 letters/numbers.' };
    body.innerHTML = formatFieldHtml(rule);
    wireFormatField('student', rule);
  }
}

function aadharFieldHtml(){
  return `
    <div class="field">
      <span class="field-label">Aadhar Number</span>
      <input type="text" id="id-aadhar-input" placeholder="1234 5678 9012" maxlength="14" />
      <div class="id-hint">We only use this to confirm you're a real, unique citizen — it is never shown to other users.</div>
    </div>
    <div id="id-action-row" style="display:flex; gap:8px; align-items:center; margin-top:4px;">
      <button type="button" class="btn btn-outline btn-sm" id="id-send-otp">Send OTP</button>
      <span id="id-status" class="id-status"></span>
    </div>
    <div id="id-otp-wrap" style="display:none; margin-top:8px;">
      <div class="field">
        <span class="field-label">Enter OTP</span>
        <input type="text" id="id-otp-input" placeholder="6-digit OTP" maxlength="6" />
        <div class="id-hint">Demo OTP sent to your Aadhar-linked number: <strong>${DEMO_OTP}</strong></div>
      </div>
      <button type="button" class="btn btn-primary btn-sm" id="id-verify-otp">Verify OTP</button>
    </div>
  `;
}

function formatFieldHtml(rule){
  return `
    <div class="field">
      <span class="field-label">${rule.label}</span>
      <input type="text" id="id-format-input" placeholder="${rule.placeholder}" />
      <div class="id-hint">${rule.hint}</div>
    </div>
    <div style="display:flex; gap:8px; align-items:center; margin-top:4px;">
      <button type="button" class="btn btn-outline btn-sm" id="id-format-verify">Verify</button>
      <span id="id-status" class="id-status"></span>
    </div>
  `;
}

function wireAadharField(){
  const input = document.getElementById('id-aadhar-input');
  const sendBtn = document.getElementById('id-send-otp');
  const otpWrap = document.getElementById('id-otp-wrap');
  const status = document.getElementById('id-status');

  input.addEventListener('input', () => {
    let digits = input.value.replace(/\D/g, '').slice(0, 12);
    input.value = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  });

  sendBtn.addEventListener('click', () => {
    const digits = input.value.replace(/\D/g, '');
    if (digits.length !== 12){
      status.textContent = 'Enter a valid 12-digit Aadhar number.';
      status.className = 'id-status error';
      return;
    }
    status.textContent = 'OTP sent.';
    status.className = 'id-status';
    otpWrap.style.display = 'block';
    sendBtn.disabled = true;
    toast(`Demo OTP sent to the mobile number linked with this Aadhar (use ${DEMO_OTP}).`);

    document.getElementById('id-verify-otp').addEventListener('click', () => {
      const otp = document.getElementById('id-otp-input').value.trim();
      if (otp !== DEMO_OTP){
        toast('Incorrect OTP — please try again.');
        return;
      }
      authVerified = { ok: true, idType: 'Aadhar', idValue: maskId(digits) };
      otpWrap.innerHTML = '';
      status.innerHTML = `${icon('checkCircle',13)} Aadhar verified — ${maskId(digits)}`;
      status.className = 'id-status ok';
      input.disabled = true;
      sendBtn.style.display = 'none';
    }, { once: true });
  });
}

function wireFormatField(role, rule){
  const input = document.getElementById('id-format-input');
  const btn = document.getElementById('id-format-verify');
  const status = document.getElementById('id-status');

  btn.addEventListener('click', () => {
    const value = input.value.trim();
    if (!rule.pattern.test(value)){
      status.textContent = rule.errorHint;
      status.className = 'id-status error';
      return;
    }
    let note = `${rule.label} verified.`;
    if (role === 'university'){
      const known = KNOWN_COLLEGE_CODES[value.toUpperCase()];
      note = known ? `Verified — ${known}` : 'Verified (new institution — will be onboarded on first login)';
    }
    authVerified = { ok: true, idType: rule.label, idValue: role === 'industry' ? value.toUpperCase() : value };
    status.innerHTML = `${icon('checkCircle',13)} ${note}`;
    status.className = 'id-status ok';
    input.disabled = true;
    btn.style.display = 'none';
  });
}

/* ============================================================
   Guided Demo Bar
   ============================================================ */
const DEMO_STEPS = [
  { step:1, text:'Welcome to SETU! This guided tour shows key platform features. You are logged in as a Citizen.', highlight:null },
  { step:2, text:'Try reporting a problem — click "Report a Problem" in the sidebar.', highlight:'report' },
  { step:3, text:'Switch roles using the persona switcher in the top bar to see Government, University, or Industry views.', highlight:null },
  { step:4, text:'As Government, review the Priority Board and Innovation Gate for AI-powered triage.', highlight:'dashboard' },
  { step:5, text:'Explore the Department Directory and AI Routing Tool to see how reports reach the right department.', highlight:null }
];
let demoStep = 0;
let demoActive = false;

function startDemo(){
  demoActive = true;
  demoStep = 0;
  paintDemoBar();
}
function stopDemo(){
  demoActive = false;
  const bar = document.getElementById('demo-bar');
  if(bar) bar.classList.add('hidden');
}
function paintDemoBar(){
  const bar = document.getElementById('demo-bar');
  if(!bar) return;
  if(!demoActive){ bar.classList.add('hidden'); return; }
  bar.classList.remove('hidden');
  const s = DEMO_STEPS[demoStep];
  document.getElementById('demo-bar-step').textContent = `Step ${s.step} of ${DEMO_STEPS.length}`;
  document.getElementById('demo-bar-text').textContent = s.text;
  const prevBtn = document.getElementById('demo-bar-prev');
  if(prevBtn) prevBtn.style.visibility = demoStep === 0 ? 'hidden' : 'visible';
  const nextBtn = document.getElementById('demo-bar-next');
  if(nextBtn) nextBtn.textContent = demoStep === DEMO_STEPS.length - 1 ? 'Finish ✓' : 'Next →';
}

/* ============================================================
   Persona Switcher (in-app role switching for demo)
   ============================================================ */
const PERSONA_PRESETS = {
  citizen:     { role:'citizen',     name:'Anjali Kumari',            id:'citizen-demo',  verifiedId:'12••••••9012' },
  government:  { role:'government',  name:'D. Sinha',                 id:'gov-demo',      verifiedId:'JH-GOV-2044' },
  university:  { role:'university',  name:'BIT Mesra — Nodal Officer', id:'uni-demo',      verifiedId:'BIT-MESRA' },
  student:     { role:'student',     name:'Aman Raj',                 id:'student-demo',  verifiedId:'BIT/2023/CSE/104' },
  industry:    { role:'industry',    name:'AgroTech Jharkhand',       id:'industry-demo', verifiedId:'20AGRTC1234H1Z8' },
  admin:       { role:'admin',       name:'Platform Admin',           id:'admin-demo',    verifiedId:'' }
};

function switchPersona(role){
  const preset = PERSONA_PRESETS[role];
  if(!preset) return;
  DB.setSession(preset);
  document.body.className = 'theme-' + role;
  currentView = 'dashboard';
  renderApp();
  toast(`Switched to ${ROLE_LABELS[role] || role} view`);
  // Close persona dropdown
  const dd = document.getElementById('persona-dropdown');
  if(dd) dd.classList.add('hidden');
}


// ---------------------------------------------------------------
// Auth
// ---------------------------------------------------------------
let authMode = 'login';

function setupAuth(){
  const tabs = document.querySelectorAll('.auth-tab');
  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=>{
      tabs.forEach(t=>t.classList.remove('active'));
      tab.classList.add('active');
      authMode = tab.dataset.tab;
      document.getElementById('auth-submit').textContent = authMode === 'signup' ? 'Create account' : 'Log in';
      document.getElementById('signup-name-field').style.display = authMode === 'signup' ? 'flex' : 'none';
    });
  });

  document.getElementById('role-select').addEventListener('change', (e) => {
    renderIdSection(e.target.value);
  });

  document.getElementById('auth-form').addEventListener('submit', (e)=>{
    e.preventDefault();
    const role = document.getElementById('role-select').value;
    if (!role){ toast('Please select a role to continue.'); return; }
    if (role !== 'admin' && !authVerified.ok){
      toast('Please verify your identity before continuing.');
      return;
    }
    let name = document.getElementById('username').value.trim();
    if (authMode === 'signup'){
      const fullName = document.getElementById('signup-name').value.trim();
      if (fullName) name = fullName;
    }

    const roleDefaultNames = {
      citizen: 'Anjali Kumari',
      government: 'D. Sinha',
      university: 'BIT Mesra — Nodal Officer',
      student: 'Aman Raj',
      industry: 'AgroTech Jharkhand',
      admin: 'Platform Admin',
    };

    if (!name) name = roleDefaultNames[role] || ('Demo ' + (ROLE_LABELS[role] || role).split(' ')[0]);

    const displayName = authMode === 'signup' && document.getElementById('signup-name').value.trim()
      ? document.getElementById('signup-name').value.trim()
      : (name || roleDefaultNames[role]);

    DB.setSession({
      role, name: displayName, id: Date.now(),
      verifiedId: role !== 'admin' ? { type: authVerified.idType, value: authVerified.idValue } : null,
    });
    authVerified = { ok: false, idType: null, idValue: null };
    enterApp();
  });

  document.querySelectorAll('.quick-role-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      const roleDefaultNames = {
        citizen: 'Anjali Kumari',
        government: 'D. Sinha',
        university: 'BIT Mesra — Nodal Officer',
        student: 'Aman Raj',
        industry: 'AgroTech Jharkhand',
        admin: 'Platform Admin',
      };
      const demoIds = {
        citizen: { type: 'Aadhar', value: maskId('123456789012') },
        government: { type: 'Government Employee ID', value: 'JH-GOV-2044' },
        university: { type: 'College / AISHE Code', value: 'BIT-MESRA' },
        student: { type: 'College ID Card Number', value: 'BIT/2023/CSE/104' },
        industry: { type: 'GSTIN', value: '20AGRTC1234H1Z8' },
      };
      DB.setSession({ role, name: roleDefaultNames[role] || 'Demo User', id: Date.now(), verifiedId: demoIds[role] || null });
      enterApp();
      startDemo();
    });
  });
}

function enterApp(){
  const session = DB.getSession();
  if (!session) return;
  document.body.className = 'theme-' + session.role;
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  currentView = 'dashboard';
  renderApp();
  if (typeof Assistant !== 'undefined') Assistant.mount();
}

function logout(){
  if (typeof Assistant !== 'undefined') Assistant.unmount();
  DB.clearSession();
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  document.getElementById('auth-form').reset();
  document.body.className = '';
}

// ---------------------------------------------------------------
// Boot
// ---------------------------------------------------------------
document.addEventListener('DOMContentLoaded', async ()=>{
  await DB.init();
  setupAuth();
  paintAuthHelpline();
  if (typeof I18N !== 'undefined') I18N.init();

  const lowBwBtn = document.getElementById('lowbw-btn');
  if (lowBwBtn) lowBwBtn.addEventListener('click', () => {
    LowBW.set(!lowBwOn());
    paintLowBwUI();
    toast(lowBwOn() ? 'Low-bandwidth mode on — photos and map tiles won\u2019t be downloaded.' : 'Low-bandwidth mode off.');
    if (DB.getSession()) renderApp();
  });
  paintLowBwUI();

  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('notif-btn').addEventListener('click', showNotifications);
  document.getElementById('sidebar-toggle').addEventListener('click', openSidebarMobile);
  document.getElementById('sidebar-scrim').addEventListener('click', closeSidebarMobile);

  const existing = DB.getSession();
  if (existing) enterApp();

  // Guided Demo Bar controls
  const demoPrev = document.getElementById('demo-bar-prev');
  const demoNext = document.getElementById('demo-bar-next');
  const demoClose = document.getElementById('demo-bar-close');
  if(demoPrev) demoPrev.addEventListener('click', ()=>{ if(demoStep>0){ demoStep--; paintDemoBar(); } });
  if(demoNext) demoNext.addEventListener('click', ()=>{
    if(demoStep < DEMO_STEPS.length-1){ demoStep++; paintDemoBar(); }
    else stopDemo();
  });
  if(demoClose) demoClose.addEventListener('click', stopDemo);

  // Persona Switcher
  const personaBtn = document.getElementById('persona-switcher-btn');
  const personaDD = document.getElementById('persona-dropdown');
  if(personaBtn && personaDD){
    personaBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      personaDD.classList.toggle('hidden');
    });
    document.addEventListener('click', ()=> personaDD.classList.add('hidden'));
    personaDD.querySelectorAll('.persona-opt').forEach(btn=>{
      btn.addEventListener('click', ()=> switchPersona(btn.dataset.role));
    });
  }

  // Public Transparency Portal (Open access)
  const pubTransBtn = document.getElementById('btn-public-transparency');
  if(pubTransBtn) pubTransBtn.addEventListener('click', openPublicTransparency);
});
