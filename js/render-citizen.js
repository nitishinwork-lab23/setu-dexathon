/* ============================================================
   SETU — Citizen views
   ============================================================ */

const Citizen = {
  nav: [
    { id:'dashboard', label:'Dashboard', icon:'grid', group:'Reports' },
    { id:'report', label:'Report a Problem', icon:'plus', group:'Reports' },
    { id:'myreports', label:'My Reports', icon:'report', group:'Reports' },
    { id:'progress', label:'View Progress', icon:'trend', group:'Activity' },
    { id:'accountability', label:'Accountability', icon:'shield', group:'Activity' },
    { id:'phone', label:'Vote & Call', icon:'bell', group:'Activity' },
    { id:'solutions', label:'Solution Library', icon:'bulb', group:'Activity' },
    { id:'transparency', label:'Public Transparency', icon:'shield', group:'Activity' },
    { id:'profile', label:'Profile', icon:'user', group:'Account' },
  ],

  stageLabels: ['Received','Verified','Assigned','In Development','Pilot','Resolved'],

  render(view, ctx){
    if (view === 'report') return this.renderReportForm();
    if (view === 'myreports') return this.renderMyReports(ctx);
    if (view === 'progress') return this.renderProgress(ctx);
    if (view === 'profile') return this.renderProfile(ctx);
    if (view === 'accountability') return Accountability.render({ canReply: false });
    if (view === 'phone') return Phone.renderCitizen();
    if (view === 'solutions') return renderSolutionLibraryHTML();
    if (view === 'transparency') return renderPublicTransparencyHTML();
    return this.renderDashboard(ctx);
  },

  // ---------------- DASHBOARD (Google Classroom style feed) ----------------
  renderDashboard(ctx){
    const myName = ctx.session.name;
    const reports = DB.getReports().filter(r => r.citizen === myName || myName === 'Demo Citizen');
    const totalSupports = reports.reduce((s,r)=>s+r.supports,0);
    const active = reports.filter(r=>r.status!=='done').length;

    return `
      <div class="view-head">
        <div>
          <h1 class="view-title">Welcome back, ${firstName(myName)}</h1>
          <p class="view-sub">Here's what's happening with the problems you've reported.</p>
        </div>
        <button class="btn btn-primary" data-action="go-report">${icon('plus',16)} New Report</button>
      </div>

      <div class="kpi-row">
        <div class="kpi-card accent"><div class="kpi-value">${reports.length}</div><div class="kpi-label">Reports filed</div></div>
        <div class="kpi-card"><div class="kpi-value">${active}</div><div class="kpi-label">Active / in progress</div></div>
        <div class="kpi-card"><div class="kpi-value">${totalSupports}</div><div class="kpi-label">Community supports</div></div>
      </div>

      <h2 class="section-title">Your reports</h2>
      <div class="grid grid-3" id="citizen-report-grid">
        ${reports.length ? reports.map(r=>this.reportCard(r)).join('') : this.emptyReports()}
      </div>

      <h2 class="section-title" style="margin-top:32px;">Other problems near you — add your support</h2>
      <div class="grid grid-3">
        ${DB.getReports().filter(r=>r.citizen!==myName).slice(0,3).map(r=>this.reportCard(r, true)).join('')}
      </div>
    `;
  },

  emptyReports(){
    return `<div class="empty-state" style="grid-column:1/-1;">
      ${icon('report',36)}
      <p>No reports yet — tap <strong>+ New Report</strong> to report your first issue.</p>
    </div>`;
  },

  reportCard(r, othersOnly=false){
    const statusMap = { pending:'Pending review', progress:'In progress', done:'Resolved' };
    const statusClass = { pending:'status-pending', progress:'status-progress', done:'status-done' };
    return `
    <div class="report-card">
      <div class="report-banner ${r.image ? 'has-image' : ''}">
        ${r.image ? `<img class="report-banner-img" src="${r.image}" alt="${r.title}" loading="lazy" onerror="handleImageError(this, '${r.domain}')" />` : ''}
        <div class="report-banner-title">${r.title}</div>
        <div class="report-banner-meta" data-view-location="${r.id}" style="cursor:pointer;" title="View precise location">${icon('pin',11)} ${r.area}</div>
        <div class="report-thumb">${icon(r.hasPhoto?'camera':'flag',18)}</div>
      </div>
      <div class="report-body">
        <p class="report-desc">${r.desc}</p>
        ${responsibleHtml(r)}
        <div class="report-tags" style="margin-top:10px;">
          <span class="tag priority-${r.priority.toLowerCase()}">${r.priority} priority</span>
          <span class="tag ${statusClass[r.status]}">${statusMap[r.status]}</span>
          <span class="tag">${r.domain}</span>
          ${gateChipHtml(r)}
          ${r.isAutoImage ? `<span class="tag auto-image-tag">✨ Auto-Attached Photo</span>` : ''}
        </div>
      </div>
      <div class="report-foot">
        <button class="support-btn ${r.supportedByMe?'supported':''}" data-support="${r.id}" ${r.supportedByMe?'disabled':''}>
          ${icon('heart',14)} ${r.supportedByMe ? 'Supported' : 'Support'} · ${r.supports}
        </button>
        <span class="due-chip">${icon('clock',13)} Due ${formatDate(r.due)}</span>
      </div>
      <div class="pcard-foot" style="padding:10px 16px;">
        <span class="pcard-affected" title="Estimated people affected">${icon('users',15)} ${formatCount(r.affected)} affected</span>
        <span class="pill-heart static" title="People backing this problem">${icon('heart',13)} ${r.supports || 0}</span>
        ${clusterPillHtml(r)}
        <button type="button" class="pcard-inspect" data-inspect="${r.id}">Inspect ${icon('arrowRight',14)}</button>
      </div>
      <div class="report-phone">
        <span>${icon('bell',12)} Vote free: <a href="${telHref(r.voteNumber)}" data-no-translate>${r.voteNumber}</a></span>
        <button type="button" class="btn btn-ghost btn-sm" data-speak-report="${r.id}" title="Read aloud">${icon('volume',13)} Listen</button>
      </div>
    </div>`;
  },

  // ---------------- REPORT FORM ----------------
  renderReportForm(){
    return `
      <div class="view-head">
        <div>
          <h1 class="view-title">Report a problem</h1>
          <p class="view-sub">Add a photo, your location, and a short description. Our AI routes your issue directly to the right department.</p>
        </div>
      </div>

      <div class="card card-pad" style="max-width:640px;">
        <div style="background:var(--accent-soft); color:var(--accent-ink); padding:8px 12px; border-radius:6px; margin-bottom:16px; font-size:13px; display:flex; align-items:center; gap:8px;">
          ${icon('wifi', 14)} <span>Offline mode: Reports will sync automatically when connection is restored.</span>
        </div>

        <div style="background:var(--canvas); border:1px dashed var(--line); color:var(--ink-soft); padding:8px 12px; border-radius:6px; margin-bottom:16px; font-size:13px; display:flex; align-items:center; gap:8px;">
          ${icon('bell', 14)} <span>Can't file online? Call our toll-free helpline: <a href="tel:${(DB.getSettings().tollFreeNumber||'').replace(/[^0-9+]/g,'')}" style="color:var(--accent); font-weight:700;" data-no-translate>${DB.getSettings().tollFreeNumber}</a> (${DB.getSettings().tollFreeHours}) — an operator will file it for you.</span>
        </div>
        
        <details class="card" style="margin-bottom: 16px; border: 1px solid var(--surface-hover); background:var(--surface);">
          <summary style="font-weight:600; cursor:pointer; outline:none; padding:12px;">AI Validation Preview</summary>
          <div style="padding:0 12px 12px 12px; font-size:13px; color:var(--ink-soft);">
            <div style="margin-bottom:4px;">Relevance Score: <strong>85%</strong></div>
            <div style="margin-bottom:4px;">Urgency Score: <strong>High</strong></div>
            <div>Detected Domain: <strong>Infrastructure</strong></div>
          </div>
        </details>

        <div class="similar-banner" style="margin-bottom:16px;">
          <div class="similar-banner-icon">💡</div>
          <div class="similar-banner-text">
            <div class="similar-banner-title">Check Jharkhand Solution Library first!</div>
            <div class="similar-banner-desc">Proven solutions for solar water filtration, pothole detection, and crop disease alert are already deployed in Jharkhand. Search existing solutions before submitting duplicate issues.</div>
          </div>
        </div>

        <form id="report-form" class="form-grid">
          <label class="field">
            <span class="field-label">Title</span>
            <input type="text" id="rf-title" placeholder="e.g. Streetlight not working near school" required />
          </label>

          <div class="field">
            <span class="field-label" style="display:flex; justify-content:space-between; align-items:center;">
              <label for="rf-desc">Description</label>
              <button type="button" class="btn btn-outline btn-sm" data-dictate-into="rf-desc" data-dictate-by-id="1" title="Speak — the phone types it for you">${icon('mic',14)} Speak instead of typing</button>
            </span>
            <textarea id="rf-desc" placeholder="Describe what's happening, since when, and who is affected…" required></textarea>
            <span class="id-hint">Speaking uses the phone's built-in voice typing — no audio is uploaded, so it uses very little data.</span>
          </div>

          <label class="field">
            <span class="field-label" style="display:flex; justify-content:space-between;"><span>Affected People</span><span id="rf-affected-val">100</span></span>
            <input type="range" id="rf-affected" min="1" max="10000" value="100" oninput="document.getElementById('rf-affected-val').innerText=this.value" />
          </label>

          <div class="form-row">
            <label class="field">
              <span class="field-label">Domain</span>
              <select id="rf-domain">
                <option>Water</option><option>Infrastructure</option><option>Agriculture</option>
                <option>Education</option><option>Health</option><option>Environment</option><option>Other</option>
              </select>
            </label>
            <label class="field">
              <span class="field-label">Area / Locality</span>
              <input type="text" id="rf-area" placeholder="e.g. Ward 6, Ranchi" required />
            </label>
          </div>

          <div class="field">
            <span class="field-label">Evidence & Photo Capture</span>
            <div class="capture-row">
              <button type="button" class="capture-btn" id="rf-camera">${icon('camera',18)} Attach photo</button>
              <button type="button" class="capture-btn" id="rf-video" onclick="toast('Video attached')">${icon('play',18)} Attach video</button>
              <button type="button" class="capture-btn" id="rf-doc" onclick="toast('Document attached')">${icon('file',18)} Attach doc</button>
              <button type="button" class="capture-btn" id="rf-mic">${icon('mic',18)} Voice note</button>
              <button type="button" class="capture-btn" id="rf-location">${icon('pin',18)} Attach location</button>
            </div>
            <div class="capture-preview" id="rf-evidence-preview">No custom photo attached yet.</div>
            <div class="capture-preview" id="rf-transcript-box" style="display:none;"></div>
            <img id="rf-photo-preview" class="rf-photo-preview" alt="Attached photo preview" />
            <input type="file" id="rf-file-input" accept="image/*" capture="environment" style="display:none;" />
          </div>

          <div class="capture-preview">${icon('clock',13)} Timestamp will be recorded automatically: <strong id="rf-now"></strong></div>

          <div style="display:flex; gap:10px; margin-top:6px;">
            <button type="submit" class="btn btn-primary">${icon('send',16)} Submit report</button>
            <button type="button" class="btn btn-outline" data-action="go-dashboard">Cancel</button>
          </div>
        </form>
      </div>
    `;
  },

  // ---------------- MY REPORTS ----------------
  renderMyReports(ctx){
    const myName = ctx.session.name;
    const reports = DB.getReports().filter(r => r.citizen === myName || myName === 'Demo Citizen');
    return `
      <div class="view-head">
        <div><h1 class="view-title">My reports</h1><p class="view-sub">Everything you've submitted, in one place.</p></div>
        <button class="btn btn-primary" data-action="go-report">${icon('plus',16)} New Report</button>
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Report</th><th>Domain</th><th>Priority</th><th>Status</th><th>Due</th><th>Supports</th></tr></thead>
          <tbody>
            ${reports.length ? reports.map(r=>`
              <tr>
                <td><strong>${r.title}</strong><br><span style="color:var(--ink-faint); font-size:12px;">${r.area}</span></td>
                <td>${r.domain}</td>
                <td><span class="tag priority-${r.priority.toLowerCase()}">${r.priority}</span></td>
                <td><span class="tag status-${r.status==='done'?'done':(r.status==='progress'?'progress':'pending')}">${r.status==='done'?'Resolved':(r.status==='progress'?'In progress':'Pending')}</span></td>
                <td>${formatDate(r.due)}</td>
                <td>${icon('heart',12)} ${r.supports}</td>
              </tr>`).join('') : `<tr><td colspan="6"><div class="empty-state">${icon('report',30)}<p>No reports yet.</p></div></td></tr>`}
          </tbody>
        </table>
      </div>
    `;
  },

  // ---------------- VIEW PROGRESS ----------------
  renderProgress(ctx){
    const myName = ctx.session.name;
    const reports = DB.getReports().filter(r => r.citizen === myName || myName === 'Demo Citizen');
    return `
      <div class="view-head">
        <div><h1 class="view-title">View progress</h1><p class="view-sub">Track each report from submission through to a verified outcome.</p></div>
      </div>
      <div class="grid grid-2">
        ${reports.length ? reports.map(r => `
          <div class="card card-pad">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:14px;">
              <div>
                <div style="font-weight:700;">${r.title}</div>
                <div style="font-size:12px; color:var(--ink-faint);">${r.id} · ${r.area}</div>
              </div>
              <span class="tag priority-${r.priority.toLowerCase()}">${r.priority}</span>
            </div>
            ${responsibleHtml(r)}
            <div style="height:12px;"></div>
            ${this.timeline(r)}
            ${r.status === 'done' && !r.citizenConfirmed ? `
              <div class="citizen-confirm-bar" style="margin-top:14px;">
                <span class="confirm-icon">✅</span>
                <span style="flex:1;">This issue is marked as resolved. Can you confirm it's fixed?</span>
                <div class="citizen-confirm-actions">
                  <button class="btn btn-sm btn-primary" data-confirm-resolved="${r.id}">Yes, confirmed</button>
                  <button class="btn btn-sm btn-outline" data-reopen-report="${r.id}">No, reopen</button>
                </div>
              </div>
            ` : (r.status === 'done' && r.citizenConfirmed ? `
              <div class="citizen-confirm-bar" style="margin-top:14px; background:var(--ok-soft); border-color:#bbf7d0;">
                <span class="confirm-icon">✅</span>
                <span><strong>Citizen Confirmed:</strong> You verified this issue is resolved.</span>
              </div>
            ` : '')}
            <div style="display:flex; gap:8px; margin-top:16px; flex-wrap:wrap;">
              <button class="btn btn-outline btn-sm action-face-this ${r.supportedByMe?'supported':''}" data-id="${r.id}" ${r.supportedByMe?'disabled':''}>${icon('heart',14)} ${r.supportedByMe ? 'Marked as faced by you' : 'I also face this'}</button>
              <button class="btn btn-outline btn-sm action-view-evidence" data-id="${r.id}">${icon('camera',14)} View Evidence</button>
              <button class="btn btn-outline btn-sm action-view-location" data-id="${r.id}">${icon('pin',14)} View Location</button>
              <button class="btn btn-outline btn-sm" data-speak-report="${r.id}">${icon('volume',14)} Listen</button>
            </div>
          </div>
        `).join('') : `<div class="empty-state">${icon('trend',30)}<p>Nothing to track yet — submit a report to see its journey here.</p></div>`}
      </div>
    `;
  },

  timeline(r){
    return `<div class="timeline" style="flex-direction:column;">
      ${this.stageLabels.map((label,i)=>{
        const idx = i+1;
        const done = idx < r.stage;
        const current = idx === r.stage;
        return `<div class="timeline-step ${done?'done':''} ${current?'current':''}">
          ${idx < this.stageLabels.length ? '<div class="timeline-line"></div>' : ''}
          <div class="timeline-dot ${current?'pulse':''}">${done?icon('check',13):idx}</div>
          <div class="timeline-content">
            <div class="timeline-label">${label}</div>
            <div class="timeline-meta">${current ? 'Currently here' : (done ? 'Completed' : 'Upcoming')}</div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  },

  // ---------------- PROFILE ----------------
  renderProfile(ctx){
    const s = ctx.session;
    return `
      <div class="view-head"><div><h1 class="view-title">Profile</h1><p class="view-sub">Your account details on Setu.</p></div></div>
      <div class="card card-pad" style="max-width:480px;">
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:20px;">
          <div class="avatar" style="width:56px; height:56px; font-size:20px;">${initials(s.name)}</div>
          <div>
            <div style="font-weight:700; font-size:17px;">${s.name}</div>
            <div class="role-pill" style="margin-top:4px;">Citizen</div>
          </div>
        </div>
        <div class="form-grid">
          <label class="field"><span class="field-label">Full name</span><input type="text" value="${s.name}" disabled /></label>
          <label class="field"><span class="field-label">Role</span><input type="text" value="Citizen" disabled /></label>
          <label class="field"><span class="field-label">Preferred locality</span><input type="text" placeholder="e.g. Ward 6, Ranchi" /></label>
        </div>
        ${s.verifiedId && s.verifiedId.type ? `
          <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--line-soft); display:flex; align-items:center; gap:8px; font-size:13px; color:var(--ok);">
            ${icon('checkCircle',15)} Identity verified via <strong>${s.verifiedId.type}</strong> — ${s.verifiedId.value}
          </div>
        ` : ''}
      </div>
    `;
  },

  bind(view, ctx, refresh){
    const main = document.getElementById('main-view');

    main.querySelectorAll('[data-support]').forEach(btn=>{
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        DB.supportReport(btn.dataset.support);
        toast('Thanks — your support was added to this report.');
        refresh();
      });
    });
    main.querySelectorAll('[data-action="go-report"]').forEach(b=>b.addEventListener('click', ()=>navigate('report')));
    main.querySelectorAll('[data-action="go-dashboard"]').forEach(b=>b.addEventListener('click', ()=>navigate('dashboard')));

    main.querySelectorAll('[data-view-location]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const r = DB.getReports().find(r => r.id === el.dataset.viewLocation);
        if (r) openLocationModal(r);
      });
    });

    if (view === 'progress') {
      main.querySelectorAll('.action-face-this').forEach(btn => {
        btn.addEventListener('click', (e) => {
          if (e.currentTarget.disabled) return;
          DB.supportReport(e.currentTarget.dataset.id);
          toast('Thanks, marked as faced by you.');
          refresh();
        });
      });
      main.querySelectorAll('.action-view-evidence').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = DB.getReports().find(r => r.id === btn.dataset.id);
          if (r) openEvidenceModal(r);
        });
      });
      main.querySelectorAll('.action-view-location').forEach(btn => {
        btn.addEventListener('click', () => {
          const r = DB.getReports().find(r => r.id === btn.dataset.id);
          if (r) openLocationModal(r);
        });
      });
      main.querySelectorAll('[data-confirm-resolved]').forEach(btn => {
        btn.addEventListener('click', () => {
          const reports = DB.getReports();
          const r = reports.find(x => x.id === btn.dataset.confirmResolved);
          if (r) {
            r.citizenConfirmed = true;
            if (DB.save) DB.save();
            toast('Thank you! Your confirmation helps improve civic services.');
            refresh();
          }
        });
      });
      main.querySelectorAll('[data-reopen-report]').forEach(btn => {
        btn.addEventListener('click', () => {
          const reports = DB.getReports();
          const r = reports.find(x => x.id === btn.dataset.reopenReport);
          if (r) {
            r.status = 'progress';
            r.citizenConfirmed = false;
            if (DB.save) DB.save();
            toast('Report reopened. Municipal authority notified.');
            refresh();
          }
        });
      });
    }

    if (view === 'report'){
      const nowEl = document.getElementById('rf-now');
      if (nowEl) nowEl.textContent = new Date().toLocaleString();

      let hasPhoto=false, hasMic=false, hasLoc=false;
      let photoDataUrl=null, audioDataUrl=null, locationData=null;
      let mediaRecorder=null, recordedChunks=[], micStream=null;
      let voiceTranscript=null; // { original, lang, langLabel, translated } once speech-to-text finishes
      let recognition=null;
      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
      const preview = document.getElementById('rf-evidence-preview');
      const transcriptBox = document.getElementById('rf-transcript-box');
      const photoPreviewEl = document.getElementById('rf-photo-preview');
      const updatePreview = () => {
        const parts = [];
        if (hasPhoto) parts.push('photo attached');
        if (hasMic) parts.push('voice note attached' + (voiceTranscript ? ' (transcribed)' : ''));
        if (hasLoc) parts.push(`location attached (${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)})`);
        preview.textContent = parts.length ? parts.join(' · ') : 'No evidence attached yet.';
      };
      const showTranscriptBox = (html) => {
        if (!transcriptBox) return;
        transcriptBox.style.display = 'block';
        transcriptBox.innerHTML = html;
      };

      // ---- Camera: opens the real camera via getUserMedia, falls back to the native file/camera picker ----
      const camBtn = document.getElementById('rf-camera');
      const fileInput = document.getElementById('rf-file-input');

      const setPhoto = (dataUrl) => {
        hasPhoto = true;
        photoDataUrl = dataUrl;
        camBtn.classList.add('active');
        camBtn.innerHTML = `${icon('camera',18)} Photo attached`;
        photoPreviewEl.src = dataUrl;
        photoPreviewEl.classList.add('show');
        const st = resizeImageFile.last;
        if (st && st.to){
          toast(st.from ? `Photo shrunk from ${fmtBytes(st.from)} to ${fmtBytes(st.to)} to save your data.` : `Photo ready (${fmtBytes(st.to)}).`);
        }
        updatePreview();
      };

      camBtn.addEventListener('click', async () => {
        if (!navigator.mediaDevices?.getUserMedia){
          fileInput.click();
          return;
        }
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: lowBwOn() ? 640 : 1280 } } });
        } catch (err){
          toast('Camera unavailable — pick a photo instead.');
          fileInput.click();
          return;
        }
        const stopStream = () => stream.getTracks().forEach(t => t.stop());
        openModal({
          title: 'Take a photo',
          body: `
            <video id="cam-preview" autoplay playsinline muted style="width:100%; border-radius:10px; background:#000;"></video>
            <canvas id="cam-canvas" style="display:none;"></canvas>
          `,
          footer: `<button type="button" class="btn btn-outline" id="cam-cancel">Cancel</button>
                   <button type="button" class="btn btn-primary" id="cam-shoot">${icon('camera',16)} Capture</button>`,
          onMount: () => {
            const video = document.getElementById('cam-preview');
            video.srcObject = stream;
            document.getElementById('modal-backdrop').addEventListener('click', (e) => { if (e.target.id === 'modal-backdrop') stopStream(); });
            document.querySelector('[data-modal-close]')?.addEventListener('click', stopStream);
            document.getElementById('cam-cancel').addEventListener('click', () => { stopStream(); closeModal(); });
            document.getElementById('cam-shoot').addEventListener('click', () => {
              const dataUrl = compressCanvasSource(video, video.videoWidth, video.videoHeight, 0);
              stopStream();
              closeModal();
              setPhoto(dataUrl);
              toast('Photo captured from camera.');
            });
          },
        });
      });

      fileInput.addEventListener('change', () => {
        if (!fileInput.files.length) return;
        resizeImageFile(fileInput.files[0]).then(setPhoto);
      });

      // ---- Voice note: records real audio via getUserMedia + MediaRecorder ----
      const micBtn = document.getElementById('rf-mic');
      micBtn.addEventListener('click', async () => {
        if (mediaRecorder && mediaRecorder.state === 'recording'){
          mediaRecorder.stop();
          if (recognition){ try { recognition.stop(); } catch(e){ /* already stopped */ } }
          return;
        }
        if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined'){
          hasMic = !hasMic;
          micBtn.classList.toggle('active', hasMic);
          micBtn.innerHTML = hasMic ? `${icon('mic',18)} Recording added` : `${icon('mic',18)} Voice note`;
          toast('Microphone unavailable — voice note simulated.');
          updatePreview();
          return;
        }
        try {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err){
          toast('Microphone permission denied.');
          return;
        }
        recordedChunks = [];
        voiceTranscript = null;
        if (transcriptBox){ transcriptBox.style.display = 'none'; transcriptBox.innerHTML = ''; }
        // 12 kbps in Low-data mode is plenty for speech (about 90 KB per minute).
        try { mediaRecorder = new MediaRecorder(micStream, { audioBitsPerSecond: lowBwOn() ? 12000 : 24000 }); }
        catch(e){ mediaRecorder = new MediaRecorder(micStream); }
        mediaRecorder.ondataavailable = (e) => { if (e.data.size) recordedChunks.push(e.data); };
        mediaRecorder.onstop = () => {
          micStream.getTracks().forEach(t => t.stop());
          micBtn.classList.remove('recording');
          const blob = new Blob(recordedChunks, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onload = () => {
            audioDataUrl = reader.result;
            hasMic = true;
            micBtn.classList.add('active');
            micBtn.innerHTML = `${icon('mic',18)} Voice note recorded`;
            toast('Voice note recorded.');
            updatePreview();
          };
          reader.readAsDataURL(blob);
        };
        mediaRecorder.start();
        micBtn.classList.add('recording');
        micBtn.innerHTML = `${icon('mic',18)} Recording… tap to stop`;
        toast('Recording voice note — tap the button again to stop.');

        // ---- Speech-to-text: transcribe live while recording, in whatever
        // language the app UI is currently set to, then machine-translate
        // the transcript to English (if it wasn't already) so reviewers who
        // don't speak the citizen's language can still read what was said.
        if (!SpeechRecognitionCtor){
          showTranscriptBox(`${icon('mic',13)} Voice-to-text isn't supported in this browser (Web Speech API missing) — the recording will still be attached as audio.`);
        } else if (window.isSecureContext === false){
          showTranscriptBox(`${icon('mic',13)} Voice-to-text needs HTTPS (or localhost) — this page is loaded over an insecure origin, so the browser is blocking it. The recording will still be attached as audio.`);
        } else {
          const appLang = (typeof I18N !== 'undefined' && I18N.getLang) ? I18N.getLang() : 'en';
          const meta = (typeof I18N !== 'undefined' && I18N.LANG_META && I18N.LANG_META[appLang]) || { label:'English', mt:null, speech:'en-IN' };
          let finalText = '';
          let gotAnyResult = false;
          recognition = new SpeechRecognitionCtor();
          recognition.lang = meta.speech || 'en-IN';
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (e) => {
            gotAnyResult = true;
            let interim = '';
            for (let i = e.resultIndex; i < e.results.length; i++){
              const chunk = e.results[i][0].transcript;
              if (e.results[i].isFinal) finalText += chunk + ' '; else interim += chunk;
            }
            showTranscriptBox(`${icon('mic',13)} Transcribing (${meta.label})… <em>${escapeHtml((finalText + interim).trim()) || '…'}</em>`);
          };
          recognition.onerror = (e) => {
            console.warn('SpeechRecognition error:', e.error, e);
            const reasons = {
              'not-allowed': 'microphone access for speech-to-text was blocked — check the site permissions (there can be a separate prompt from the recording one).',
              'service-not-allowed': "the browser's speech recognition service isn't allowed here (common on http:// origins or some corporate networks that block it).",
              'network': "the browser's speech recognition service needs an internet connection and couldn't reach it.",
              'language-not-supported': `this browser build doesn't support the "${recognition.lang}" language pack for speech recognition.`,
              'no-speech': "no speech was detected before the mic timed out.",
              'audio-capture': 'no microphone could be found to use for speech recognition.',
              'aborted': null, // normal when we call recognition.stop() ourselves — not an error worth surfacing
            };
            if (e.error === 'aborted') return;
            const reason = reasons[e.error] || `speech recognition failed (${e.error}).`;
            showTranscriptBox(`${icon('mic',13)} Voice-to-text didn't work this time: ${reason} The recording is still attached as audio.`);
          };
          recognition.onend = () => {
            const spokenText = finalText.trim();
            if (!spokenText){
              if (!gotAnyResult && transcriptBox && transcriptBox.textContent.includes('Transcribing')) {
                // stopped before any words were recognized, and no error fired — just clear the "transcribing…" placeholder
                transcriptBox.style.display = 'none';
                transcriptBox.innerHTML = '';
              }
              return;
            }
            voiceTranscript = { original: spokenText, lang: appLang, langLabel: meta.label, translated: null };
            showTranscriptBox(`${icon('mic',13)} Transcript (${meta.label}): <em>${escapeHtml(spokenText)}</em>`);
            updatePreview();
            // Only round-trip to the translator when the note wasn't spoken
            // in English and a machine-translation target exists for it.
            if (appLang !== 'en' && meta.mt && typeof I18N !== 'undefined' && I18N.translateText){
              I18N.translateText(spokenText, 'en', meta.mt).then(translated => {
                if (!voiceTranscript || voiceTranscript.original !== spokenText) return; // superseded by a re-recording
                voiceTranscript.translated = translated;
                showTranscriptBox(`
                  ${icon('mic',13)} Transcript (${meta.label}): <em>${escapeHtml(spokenText)}</em><br>
                  ${icon('globe',13)} Translated to English: <em>${escapeHtml(translated)}</em>
                `);
              }).catch((err) => {
                console.warn('Transcript translation failed:', err);
                showTranscriptBox(`${icon('mic',13)} Transcript (${meta.label}): <em>${escapeHtml(spokenText)}</em><br><span style="color:var(--ink-faint); font-size:12px;">(Translation to English is temporarily unavailable.)</span>`);
              });
            }
          };
          try {
            recognition.start();
          } catch (e) {
            console.warn('SpeechRecognition failed to start:', e);
            showTranscriptBox(`${icon('mic',13)} Voice-to-text couldn't start (${e.message || e.name}). The recording will still be attached as audio.`);
            recognition = null;
          }
        }
      });

      // ---- Location: reads the real device position via the Geolocation API ----
      const locBtn = document.getElementById('rf-location');
      locBtn.addEventListener('click', () => {
        if (!navigator.geolocation){
          hasLoc = true;
          locationData = { lat: 0, lng: 0 };
          locBtn.classList.add('active');
          locBtn.innerHTML = `${icon('pin',18)} Location captured`;
          toast('Geolocation unavailable — location simulated.');
          updatePreview();
          return;
        }
        locBtn.disabled = true;
        locBtn.innerHTML = `${icon('pin',18)} Locating…`;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            locationData = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            hasLoc = true;
            locBtn.disabled = false;
            locBtn.classList.add('active');
            locBtn.innerHTML = `${icon('pin',18)} Location captured`;
            toast(`Location attached (${locationData.lat.toFixed(4)}, ${locationData.lng.toFixed(4)}).`);
            updatePreview();
          },
          () => {
            locBtn.disabled = false;
            locBtn.innerHTML = `${icon('pin',18)} Attach location`;
            toast('Could not get your location — check site permissions.');
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });

      document.getElementById('report-form').addEventListener('submit', (e)=>{
        e.preventDefault();
        const title = document.getElementById('rf-title').value.trim();
        const desc = document.getElementById('rf-desc').value.trim();
        const domain = document.getElementById('rf-domain').value;
        const area = document.getElementById('rf-area').value.trim();
        if (!title || !desc || !area) return;

        const finalImage = photoDataUrl || getAutoImageForDomain(domain);

        const saved = DB.addReport({
          title, desc, domain, area,
          priority: 'Medium',
          affected: parseInt(document.getElementById('rf-affected').value, 10) || 1,
          citizen: ctx.session.name,
          hasPhoto: true,
          hasLocation: hasLoc, hasAudio: hasMic,
          image: finalImage,
          isAutoImage: !photoDataUrl,
          // In Low-data mode, if speech-to-text worked, send the words and skip the audio file.
          audioNote: (lowBwOn() && voiceTranscript) ? undefined : (audioDataUrl || undefined),
          audioTranscript: voiceTranscript ? voiceTranscript.original : undefined,
          audioTranscriptLang: voiceTranscript ? voiceTranscript.langLabel : undefined,
          audioTranscriptEn: voiceTranscript ? (voiceTranscript.translated || (voiceTranscript.lang === 'en' ? voiceTranscript.original : undefined)) : undefined,
          location: locationData || undefined,
          due: futureDate(10),
        });
        if (saved.spam) {
          toast('Report received — our AI flagged it for extra verification before it goes live.');
        } else {
          toast(photoDataUrl ? 'Report submitted with your photo!' : 'Report submitted — AI auto-attached domain image.');
        }
        setTimeout(()=> navigate('myreports'), 400);
      });
    }
  },
};
