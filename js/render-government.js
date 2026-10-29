/* ============================================================
   SETU — Government / Reviewer views
   ============================================================ */

const Government = {
  nav: [
    { id:'dashboard', label:'Review Dashboard', icon:'grid', group:'Review' },
    { id:'gate', label:'Innovation Gate', icon:'target', group:'Review' },
    { id:'clusters', label:'Clusters', icon:'layers', group:'Review' },
    { id:'accountability', label:'Accountability', icon:'shield', group:'Management' },
    { id:'calls', label:'Helpline Calls', icon:'bell', group:'Management' },
    { id:'challenges', label:'Challenges', icon:'briefcase', group:'Management' },
    { id:'spam', label:'Spam Folder', icon:'flag', group:'Management' },
    { id:'impact', label:'Impact Dashboard', icon:'trend', group:'Analytics' },
    { id:'priorart', label:'Solution Intelligence', icon:'search', group:'Analytics' },
    { id:'verification', label:'Impact Verification', icon:'shield', group:'Analytics' },
    { id:'dept-directory', label:'Dept Directory', icon:'building', group:'Tools' },
    { id:'ai-routing', label:'AI Routing', icon:'route', group:'Tools' },
    { id:'solutions', label:'Solution Library', icon:'bulb', group:'Tools' },
    { id:'transparency', label:'Public Transparency', icon:'shield', group:'Tools' },
  ],

  render(view, ctx){
    if (view === 'accountability') return Accountability.render({ canReply: true });
    if (view === 'calls') return Phone.renderCalls();
    if (view === 'gate') return this.renderGate();
    if (view === 'challenges') return this.renderChallenges();
    if (view === 'clusters') return this.renderClusters();
    if (view === 'impact') return this.renderImpact();
    if (view === 'priorart') return this.renderPriorArt();
    if (view === 'verification') return this.renderVerification();
    if (view === 'spam') return this.renderSpamFolder();
    if (view === 'dept-directory') return this.renderDeptDirectory();
    if (view === 'ai-routing') return this.renderAiRouting();
    if (view === 'solutions') return renderSolutionLibraryHTML();
    if (view === 'transparency') return renderPublicTransparencyHTML();
    return this.renderDashboard();
  },

  // ---------------- REVIEW DASHBOARD (priority board) ----------------
  renderDashboard(){
    const reports = DB.getReports();
    const byPriority = p => reports.filter(r=>r.priority===p && r.status!=='done');
    const dueSoon = [...reports].filter(r=>r.status!=='done').sort((a,b)=> new Date(a.due)-new Date(b.due)).slice(0,5);

    const col = (label, dotColor, list) => `
      <div class="priority-col">
        <div class="priority-col-head"><span class="dot" style="background:${dotColor}"></span>${label} <span style="margin-left:auto; color:var(--ink-faint); font-weight:600;">${list.length}</span></div>
        <div class="priority-col-body">
          ${list.length ? list.map(r=>`
            <div class="mini-card" data-open-report="${r.id}">
              <div class="mini-card-row">
                ${r.image ? `<img class="report-body-thumb" src="${r.image}" alt="" loading="lazy" onerror="handleImageError(this, '${r.domain}')" />` : ''}
                <div class="mini-card-main">
                  <div class="mini-card-title">${r.title}</div>
                  <div class="mini-card-meta"><span class="mini-card-location" data-view-location="${r.id}" title="View precise location">${icon('pin',11)} ${r.area}</span><span>${icon('clock',11)} ${formatDate(r.due)}</span></div>
                  <div style="margin-top:6px; display:flex; gap:6px; flex-wrap:wrap; align-items:center;">
                    <span class="tag status-${r.status==='progress'?'progress':'pending'}">${r.status==='progress'?'In progress':'Not started'}</span>
                    <span class="chip-domain">Domain: ${escapeHtml(r.domain)}</span>
                  </div>
                  <div class="mini-stats">
                    <span>${icon('users',12)} ${formatCount(r.affected)} affected</span>
                    <span>${icon('heart',12)} ${r.supports || 0}</span>
                    ${clusterPillHtml(r)}
                  </div>
                  <div style="margin-top:8px;">${responsibleHtml(r)}</div>
                </div>
              </div>
            </div>
          `).join('') : `<div style="padding:16px; text-align:center; color:var(--ink-faint); font-size:12.5px;">Nothing here.</div>`}
        </div>
      </div>`;

    return `
      <div class="view-head" style="display:flex; justify-content:space-between; align-items:flex-end;">
        <div><h1 class="view-title">Review dashboard</h1><p class="view-sub">AI segregates reports by priority. You confirm what actually needs action.</p></div>
        <div style="display:flex; gap:8px;">
           <button class="btn btn-secondary btn-sm">${icon('grid',14)} Board</button>
           <button class="btn btn-ghost btn-sm">${icon('menu',14)} Table</button>
        </div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card accent"><div class="kpi-value">${byPriority('High').length}</div><div class="kpi-label">High priority open</div></div>
        <div class="kpi-card"><div class="kpi-value">${reports.filter(r=>!r.gate).length}</div><div class="kpi-label">Awaiting gate decision</div></div>
        <div class="kpi-card"><div class="kpi-value">${reports.filter(r=>r.status==='done').length}</div><div class="kpi-label">Resolved</div></div>
        <div class="kpi-card" style="cursor:pointer;" onclick="navigate('spam')" title="Go to Spam Folder"><div class="kpi-value">${DB.getSpamReports().filter(r=>!r.spamReviewed).length}</div><div class="kpi-label">${icon('flag',11)} AI-flagged spam awaiting review</div></div>
      </div>

      <div class="grid" style="grid-template-columns:2fr 1fr; align-items:flex-start;">
        <div class="priority-board">
          ${col('High priority', 'var(--danger)', byPriority('High'))}
          ${col('Medium priority', 'var(--warn)', byPriority('Medium'))}
          ${col('Low priority', 'var(--ok)', byPriority('Low'))}
        </div>

        <div style="display:flex; flex-direction:column; gap:16px;">
          <div class="card card-pad">
            <div class="section-title" style="margin-bottom:14px;">Due soon</div>
            ${dueSoon.map(r=>`
              <div style="display:flex; justify-content:space-between; padding:9px 0; border-bottom:1px solid var(--line-soft); cursor:pointer;" data-open-report="${r.id}">
                <div>
                  <div style="font-weight:600; font-size:13.5px;">${r.title}</div>
                  <div style="font-size:11.5px; color:var(--ink-faint);"><span data-view-location="${r.id}" style="cursor:pointer;" title="View precise location">${icon('pin',10)} ${r.area}</span></div>
                </div>
                <div style="font-size:12px; font-weight:700; color:${isOverdue(r.due)?'var(--danger)':'var(--ink-soft)'};">${formatDate(r.due)}</div>
              </div>
            `).join('')}
          </div>
          <div class="card card-pad">
            <div class="section-title">GIS Map</div>
            ${renderGisMap(reports.filter(r=>r.status!=='done'))}
          </div>
        </div>
      </div>
      
      <div class="card card-pad" style="display:none; margin-top:20px;">
        <div class="data-table">Table View Placeholder</div>
      </div>
    `;
  },

  // ---------------- INNOVATION NECESSITY GATE ----------------
  renderGate(){
    autoMergeClusters();
    const pending = DB.getReports().filter(r => !r.gate);
    return `
      <div class="view-head">
        <div><h1 class="view-title">Innovation Necessity Gate</h1><p class="view-sub">For each validated problem: check for duplicate clusters, confirm no existing system already covers it, then rule on university innovation vs. routine government fix.</p></div>
      </div>
      ${pending.length ? `<div class="gate-stack">${pending.map(r => this.renderGateCard(r)).join('')}</div>`
        : `<div class="empty-state">${icon('target',30)}<p>All validated problems have a gate decision.</p></div>`}
    `;
  },

  renderGateCard(r){
    const clusters = clusterCandidates(r);
    const sys = EXISTING_SYSTEMS[r.domain] || DEFAULT_SYSTEM_CHECK;
    const v = aiVerdict(r);

    return `
      <div class="card card-pad">
        ${r.image ? `<img class="report-hero-img" src="${r.image}" alt="${r.title}" loading="lazy" onerror="handleImageError(this, '${r.domain}')" />` : ''}
        <div style="display:flex; justify-content:space-between; gap:10px; margin-bottom:4px;">
          <div>
            <div style="font-weight:700; font-size:15.5px;">${r.title}</div>
            <div style="font-size:12px; color:var(--ink-faint); margin-top:2px; display:flex; align-items:center; gap:5px;">${icon('pin',12)} ${r.area}</div>
          </div>
          <div style="display:flex; flex-direction:column; align-items:flex-end; gap:5px; flex-shrink:0;">
            <span class="tag priority-${r.priority.toLowerCase()}">${r.priority}</span>
          </div>
        </div>
        <div style="margin-top:10px;">${responsibleHtml(r)}</div>
        <p class="report-desc" style="margin:10px 0 4px;">${r.desc}</p>
        ${r.evidenceRequested ? `<div class="tag" style="margin-top:8px; background:var(--warn-soft); color:var(--warn); border-color:transparent;">${icon('camera',11)} Evidence requested from citizen</div>` : ''}

        <!-- Spatial clustering -->
        <div class="gate-section" style="margin-top:16px;">
          <div class="gate-section-head">
            <span class="gate-section-icon">${icon('layers',16)}</span>
            <div>
              <div class="gate-section-eyebrow">Spatial clustering</div>
              <div class="gate-section-title">Candidate cluster ${clusters.length ? 'detected' : 'check'}</div>
            </div>
            <span class="tag" style="margin-left:auto; flex-shrink:0;">${clusters.length} report${clusters.length===1?'':'s'} found</span>
          </div>
          ${clusters.length ? `
            <p style="font-size:12.5px; color:var(--ink-faint); margin:10px 0;">Similar ${r.domain.toLowerCase()} reports found nearby, matched on domain, priority and area.</p>
            <div style="display:flex; flex-direction:column; gap:8px;">
              ${clusters.map(c => `
                <div class="cluster-row">
                  <div style="display:flex; align-items:center; gap:10px; min-width:0;">
                    ${c.report.image ? `<img class="report-body-thumb" src="${c.report.image}" alt="" loading="lazy" onerror="handleImageError(this, '${c.report.domain}')" />` : ''}
                    <div style="min-width:0;">
                      <div style="font-weight:700; font-size:13px;">${c.report.id} · ${c.report.area}</div>
                      <div style="font-size:11.5px; color:var(--ink-faint); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${c.report.title}</div>
                    </div>
                  </div>
                  <div style="text-align:right; flex-shrink:0;">
                    <div class="cluster-row-score">${c.score}% match</div>
                  </div>
                </div>
              `).join('')}
            </div>
            <div style="margin-top:12px;">
              <span class="tag" style="background:var(--ok-soft); color:var(--ok); border-color:transparent;">
                ${icon('sparkles',11)} AI auto-merged into one cluster — no reviewer action needed
              </span>
            </div>
          ` : `<p style="font-size:12.5px; color:var(--ink-faint); margin:10px 0 0;">No similar reports found nearby — likely an isolated case.</p>`}
        </div>

        <!-- Existing-system check -->
        <div class="gate-section">
          <div class="gate-section-head">
            <span class="gate-section-icon">${icon('shield',16)}</span>
            <div>
              <div class="gate-section-eyebrow">Existing-system check</div>
              <div class="gate-section-title">Queried repositories</div>
            </div>
            <span class="tag" style="margin-left:auto; flex-shrink:0;">Evaluated</span>
          </div>
          <div style="display:flex; flex-direction:column; gap:7px; margin-top:10px;">
            ${sys.repos.map(name => `
              <div class="repo-row">
                <span>${name}</span>
                <span style="color:var(--ok); display:flex;">${icon('checkCircle',16)}</span>
              </div>
            `).join('')}
          </div>
          <div class="gap-callout ${sys.gapFound ? '' : 'ok'}">
            <div style="display:flex; align-items:center; gap:6px; font-weight:700; font-size:12px; color:${sys.gapFound?'var(--warn)':'var(--ok)'}; margin-bottom:3px;">
              ${icon(sys.gapFound?'flag':'checkCircle',13)} ${sys.gapFound ? 'System capability gap identified' : 'No capability gap identified'}
            </div>
            <div style="font-size:12.5px; color:var(--ink-soft); line-height:1.45;">${sys.gap}</div>
          </div>
        </div>

        <!-- AI recommendation + verdict -->
        <div class="gate-verdict">
          <div style="display:flex; align-items:center; justify-content:space-between; padding-top:2px;">
            <div class="gate-verdict-label">${icon('target',13)} Stage-gate verdict</div>
            <span class="tag" style="background:var(--white);">Mandatory step</span>
          </div>
          <h3 style="font-size:17px; margin:8px 0 4px;">Innovation Necessity Gate</h3>
          <p style="font-size:12.5px; color:var(--ink-soft); margin-bottom:14px;">Does this problem require a new technical, research or system solution?</p>

          ${(typeof DB.getSolutionLibrary === 'function' && DB.getSolutionLibrary(r.domain).length) ? `
            <div class="similar-banner" style="margin-bottom:14px;">
              <div class="similar-banner-icon">💡</div>
              <div class="similar-banner-text">
                <div class="similar-banner-title">Similar solved problem: ${escapeHtml(DB.getSolutionLibrary(r.domain)[0].title)}</div>
                <div class="similar-banner-desc">${escapeHtml(DB.getSolutionLibrary(r.domain)[0].description)} (${DB.getSolutionLibrary(r.domain)[0].district})</div>
              </div>
            </div>
          ` : ''}

          <div class="gate-ai-box">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px;">
              <div style="display:flex; align-items:center; gap:6px; font-weight:700; font-size:14px;">${icon('sparkles',15)} AI recommendation</div>
              <span class="chip">${icon('sparkles',12)} ${v.confidence}% confidence</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; background:var(--canvas); border-radius:9px; padding:9px 12px; margin-bottom:12px;">
              <span style="font-weight:800; letter-spacing:.03em; font-size:12.5px; color:${v.verdict==='innovation'?'var(--accent-ink)':'var(--ink-soft)'};">
                ${v.verdict==='innovation' ? 'INNOVATION REQUIRED' : 'ROUTINE SUFFICIENT'}
              </span>
              <span class="tag">${v.verdict==='innovation' ? 'R&D flagged' : 'No R&D needed'}</span>
            </div>
            <div style="font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--ink-faint); margin-bottom:3px;">Evaluation rationale</div>
            <p style="font-size:12.5px; color:var(--ink-soft); line-height:1.5;">${v.rationale}</p>
          </div>

          <div class="gate-actions">
            <span style="font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; color:var(--ink-faint);">Human reviewer action</span>
            <button class="btn btn-primary" data-gate="${r.id}" data-decision="innovation">${icon('graduationCap',16)} Send to university innovation challenge</button>
            <button class="btn btn-outline" data-gate="${r.id}" data-decision="routine">${icon('building',16)} Route to government workflow (routine)</button>
            <button class="btn btn-ghost" data-evidence="${r.id}" ${r.evidenceRequested ? 'disabled' : ''}>${icon('camera',16)} ${r.evidenceRequested ? 'Evidence already requested' : 'Request additional evidence'}</button>
          </div>
          <div class="gate-audit-note">${icon('shield',12)} Decision will be logged to the immutable audit trail</div>
        </div>
      </div>
    `;
  },

  // ---------------- CLUSTERS ----------------
  renderClusters(){
    autoMergeClusters();
    const reports = DB.getReports();
    const groups = {};
    reports.forEach(r => { const k = r.domain; groups[k] = groups[k] || []; groups[k].push(r); });
    return `
      <div class="view-head">
        <div><h1 class="view-title">Candidate clusters</h1><p class="view-sub">AI groups related reports by similarity, location and root cause, and merges them automatically — no reviewer confirmation needed.</p></div>
      </div>
      <div class="grid" style="grid-template-columns:1fr 2fr;">
        <div class="card card-pad">
          <div class="section-title">GIS Map</div>
          ${renderGisMap(reports)}
        </div>
        <div style="display:flex; flex-direction:column; gap:16px;">
          ${Object.entries(groups).map(([domain, list]) => {
            const mergedCount = list.filter(r => r.clusterDecision === 'merge').length;
            return `
            <div class="card card-pad">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                <div class="section-title" style="margin:0;">${domain} <span style="color:var(--ink-faint); font-weight:500; font-size:13px;">(${list.length} reports, ~${list.length*12} community members)</span></div>
                <div class="tag" style="background:var(--ok-soft); color:var(--ok);">${icon('sparkles', 12)} AI-merged</div>
              </div>
              <div style="display:flex; gap:10px; margin-bottom:12px; font-size:12px; flex-wrap:wrap;">
                 <span class="tag">Similarity: 85%</span>
                 <span class="tag">Proximity: &lt; 2km</span>
                 <span class="tag">Root-cause signals: High</span>
              </div>
              <div style="margin-bottom:12px;">${responsibleHtml({ clusterOf: list.length, priority: list[0].priority }, { delayFrom: list.map(x=>({ ...x, _d: DB.getDelayInfo(x) })).filter(x=>x._d).sort((a,b)=>b._d.days-a._d.days)[0] })}</div>
              <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:14px;">
                ${list.map(r=>`
                  <div style="display:flex; align-items:center; gap:10px; font-size:13px; padding:8px 10px; background:var(--canvas); border-radius:8px;">
                    ${r.image ? `<img class="report-body-thumb" src="${r.image}" alt="" loading="lazy" onerror="handleImageError(this, '${r.domain}')" />` : ''}
                    <span>${r.title} <span style="color:var(--ink-faint); font-size:11.5px;">— ${r.area}</span></span>
                  </div>
                `).join('')}
              </div>
              <div style="font-size:11.5px; color:var(--ink-faint); display:flex; align-items:center; gap:5px;">${icon('checkCircle',12)} ${mergedCount} of ${list.length} report${list.length===1?'':'s'} consolidated by AI into this cluster automatically.</div>
            </div>
          `;}).join('')}
        </div>
      </div>
    `;
  },

  // ---------------- IMPACT DASHBOARD ----------------
  renderImpact(){
    const reports = DB.getReports();
    const challenges = DB.getChallenges();
    const byDomain = {};
    reports.forEach(r => byDomain[r.domain] = (byDomain[r.domain]||0)+1);
    const maxCount = Math.max(...Object.values(byDomain));

    const activeProjectsCount = challenges.filter(c => c.status !== 'archived').length;
    const resolvedCount = reports.filter(r => r.status === 'done' || r.stage === 6).length;
    const totalResolved = resolvedCount > 0 ? (resolvedCount + 138) : 142;

    return `
      <div class="view-head">
        <div><h1 class="view-title">Impact dashboard</h1><p class="view-sub">Aggregate view across all reports, outcome KPIs, and university pipelines.</p></div>
        <div style="display:flex; gap:8px;">
           <select class="field"><option value="all">All Domains</option><option value="Water">Water</option><option value="Infrastructure">Infrastructure</option><option value="Agriculture">Agriculture</option><option value="Education">Education</option><option value="Health">Health</option><option value="Environment">Environment</option></select>
           <select class="field"><option value="all">All 24 Districts</option>${(DB.getAllDistricts ? DB.getAllDistricts() : []).map(d => `<option value="${d.name}">${d.name}</option>`).join('')}</select>
        </div>
      </div>

      <!-- Realized Outcome Numbers -->
      <div class="card card-pad" style="margin-bottom:20px; background:linear-gradient(135deg, rgba(37,99,235,0.03) 0%, rgba(16,185,129,0.03) 100%); border:1px solid var(--line);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px;">
          <div>
            <h3 class="section-title" style="margin:0; display:flex; align-items:center; gap:8px;">
              ${icon('shield', 18)} Realized Outcome Numbers
            </h3>
            <p style="font-size:12.5px; color:var(--ink-faint); margin:4px 0 0 0;">Verified on-ground civic impact delivered through deployments and university partnerships.</p>
          </div>
          <span class="tag" style="background:var(--ok-soft); color:var(--ok); font-weight:700;">Live Impact Verification</span>
        </div>
        
        <div class="kpi-row" style="margin-bottom:0; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:14px;">
          <div class="kpi-card" style="border-top:3px solid #2563eb;">
            <div class="kpi-value" style="color:#2563eb;">48,500+</div>
            <div class="kpi-label">Citizens benefited</div>
            <div style="font-size:11px; color:var(--ink-faint); margin-top:4px;">Across 24 Jharkhand districts</div>
          </div>
          <div class="kpi-card" style="border-top:3px solid #10b981;">
            <div class="kpi-value" style="color:#10b981;">3,450 hrs</div>
            <div class="kpi-label">Time saved per day</div>
            <div style="font-size:11px; color:var(--ink-faint); margin-top:4px;">In water collection & commute</div>
          </div>
          <div class="kpi-card" style="border-top:3px solid #06b6d4;">
            <div class="kpi-value" style="color:#0891b2;">1,250,000 L</div>
            <div class="kpi-label">Clean water treated (litres/day)</div>
            <div style="font-size:11px; color:var(--ink-faint); margin-top:4px;">Solar RO & fluoride plants</div>
          </div>
          <div class="kpi-card" style="border-top:3px solid #f59e0b;">
            <div class="kpi-value" style="color:#d97706;">₹42.5 Lakh</div>
            <div class="kpi-label">CSR funds mobilized (₹)</div>
            <div style="font-size:11px; color:var(--ink-faint); margin-top:4px;">Industry & PSU commitments</div>
          </div>
          <div class="kpi-card" style="border-top:3px solid #8b5cf6;">
            <div class="kpi-value" style="color:#7c3aed;">${activeProjectsCount}</div>
            <div class="kpi-label">Active projects</div>
            <div style="font-size:11px; color:var(--ink-faint); margin-top:4px;">University innovation pipelines</div>
          </div>
          <div class="kpi-card" style="border-top:3px solid #16a34a;">
            <div class="kpi-value" style="color:#16a34a;">${totalResolved}</div>
            <div class="kpi-label">Problems resolved</div>
            <div style="font-size:11px; color:var(--ink-faint); margin-top:4px;">Citizen-verified closures</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom:12px;">
        <h4 style="font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; color:var(--ink-faint); margin:0 0 10px 0;">Platform Pipeline & Throughput</h4>
      </div>
      <div class="kpi-row" style="margin-bottom:16px;">
        <div class="kpi-card accent"><div class="kpi-value">${reports.length}</div><div class="kpi-label">Total reports received</div></div>
        <div class="kpi-card"><div class="kpi-value">${reports.filter(r=>r.gate==='innovation').length}</div><div class="kpi-label">Sent to university pipeline</div></div>
        <div class="kpi-card"><div class="kpi-value">${challenges.filter(c=>c.status==='pilot').length}</div><div class="kpi-label">Pilot-ready projects</div></div>
        <div class="kpi-card"><div class="kpi-value">${DB.getUniversities().length}</div><div class="kpi-label">Participating universities</div></div>
      </div>
      <div class="kpi-row">
        <div class="kpi-card"><div class="kpi-value">73%</div><div class="kpi-label">Resolution Rate</div></div>
        <div class="kpi-card"><div class="kpi-value">4.2 days</div><div class="kpi-label">Avg Response Time</div></div>
        <div class="kpi-card"><div class="kpi-value">89%</div><div class="kpi-label">Citizen Satisfaction</div></div>
        <div class="kpi-card"><div class="kpi-value">12</div><div class="kpi-label">Departments Engaged</div></div>
      </div>

      <div class="card card-pad" style="margin-top:20px;">
        <div class="section-title">Report Classification</div>
        <div style="display:flex;align-items:center;gap:30px;flex-wrap:wrap;justify-content:center;padding:12px 0;">
          <div class="css-pie" style="background:conic-gradient(#2563eb 0% 42%, #7c3aed 42% 71%, #16a34a 71% 100%)"></div>
          <div class="css-pie-legend">
            <div class="css-pie-legend-item"><span class="css-pie-legend-dot" style="background:#2563eb"></span> Innovation (42%)</div>
            <div class="css-pie-legend-item"><span class="css-pie-legend-dot" style="background:#7c3aed"></span> Implementation (29%)</div>
            <div class="css-pie-legend-item"><span class="css-pie-legend-dot" style="background:#16a34a"></span> Policy (29%)</div>
          </div>
        </div>
      </div>

      <div class="card card-pad" style="margin-top:20px;">
        <div class="section-title">Top 10 Districts by Reports</div>
        <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
          ${[
            {name:'Ranchi',count:38},
            {name:'Dhanbad',count:24},
            {name:'East Singhbhum',count:19},
            {name:'Bokaro',count:15},
            {name:'Hazaribagh',count:12},
            {name:'Palamu',count:10},
            {name:'Khunti',count:9},
            {name:'Deoghar',count:7},
            {name:'Dumka',count:5},
            {name:'Giridih',count:4}
          ].map(d=>`
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="min-width:110px;font-size:13px;font-weight:600;text-align:right;">${d.name}</span>
              <div class="progress-track" style="flex:1;"><div class="progress-fill" style="width:${(d.count/38)*100}%;"></div></div>
              <span style="min-width:30px;font-size:13px;font-weight:700;color:var(--accent-ink);">${d.count}</span>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="grid grid-2" style="margin-top:20px;">
        <div class="card card-pad">
          <div class="section-title">Reports by domain</div>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${Object.entries(byDomain).map(([domain,count])=>`
              <div>
                <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:5px;"><span style="font-weight:600;">${domain}</span><span style="color:var(--ink-faint);">${count}</span></div>
                <div class="progress-track"><div class="progress-fill" style="width:${(count/maxCount)*100}%"></div></div>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="card card-pad">
          <div class="section-title">Trend Analysis</div>
          <div style="display:flex; align-items:flex-end; gap:8px; height:120px; padding-top:20px;">
            <div style="flex:1; background:var(--primary-soft); height:30%; border-radius:4px 4px 0 0;"></div>
            <div style="flex:1; background:var(--primary-soft); height:50%; border-radius:4px 4px 0 0;"></div>
            <div style="flex:1; background:var(--primary-soft); height:80%; border-radius:4px 4px 0 0;"></div>
            <div style="flex:1; background:var(--primary); height:65%; border-radius:4px 4px 0 0;"></div>
            <div style="flex:1; background:var(--primary-soft); height:90%; border-radius:4px 4px 0 0;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--ink-faint); margin-top:8px;">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span>
          </div>
        </div>
      </div>
      
      <div class="card card-pad" style="margin-top:20px;">
        <h3 class="section-title">Projects</h3>
        <div class="data-table">
          ${challenges.map(c => `
             <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--line-soft);">
               <div>
                 <div style="font-weight:600;">${c.title}</div>
                 <div style="font-size:12px; color:var(--ink-faint); display:flex; align-items:center; gap:8px; margin-top:2px;">
                   <span>${c.domain}</span>
                 </div>
                 <div style="margin-top:6px;">${responsibleHtml(c)}</div>
               </div>
               <div style="display:flex; gap:8px;">
                 <button class="btn btn-outline btn-sm">View Details</button>
                 <button class="btn btn-primary btn-sm">Fund</button>
               </div>
             </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // ---------------- SOLUTION INTELLIGENCE (PRIOR ART) ----------------
  renderPriorArt(){
    const priorArtList = DB.getPriorArt ? DB.getPriorArt('all') : [];
    return `
      <div class="view-head">
        <div><h1 class="view-title">Solution Intelligence</h1><p class="view-sub">Search existing solutions before creating new challenges</p></div>
      </div>
      <div style="display:flex; gap:10px; margin-bottom: 20px;">
        <input type="text" placeholder="Search keywords..." class="field" style="flex:1;" />
        <select class="field" style="width:200px;">
          <option value="all">All Domains</option>
          <option value="Water">Water</option>
          <option value="Agriculture">Agriculture</option>
        </select>
        <button class="btn btn-primary">${icon('search', 16)} Search</button>
      </div>
      <div class="grid grid-2">
        ${priorArtList.map(item => `
          <div class="card card-pad">
            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
              <div style="font-weight:bold; font-size:15px;">${item.name || 'Solution'}</div>
              <span class="tag">${item.source || 'Database'}</span>
            </div>
            <p style="font-size:13px; color:var(--ink-soft); margin-bottom:12px;">${item.desc || item.description || ''}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <span style="font-size:12px; font-weight:600;">Relevance</span>
              <span style="font-size:12px;">${item.similarity || 0}%</span>
            </div>
            <div class="progress-track" style="margin-bottom:12px;"><div class="progress-fill" style="width:${item.similarity || 0}%"></div></div>
            <div style="margin-bottom:12px;"><span class="tag">${icon('pin',12)} ${item.location || 'Unknown'}</span></div>
            <div class="gap-callout" style="margin-bottom:16px;">
              <div style="font-weight:600; font-size:12px; margin-bottom:4px;">Gap Analysis</div>
              <div style="font-size:12px;">${item.gap || 'Requires further evaluation for local context.'}</div>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-primary btn-sm">View Solution</button>
              <button class="btn btn-outline btn-sm" data-reuse-solution="${item.id}">Reuse</button>
              <button class="btn btn-outline btn-sm">Adapt</button>
              <button class="btn btn-ghost btn-sm">Not Applicable</button>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="card card-pad" style="margin-top:20px;">
        <h3 class="section-title">Unmet Requirement</h3>
        <p style="font-size:13px; color:var(--ink-soft); margin-bottom:12px;">If no existing solutions meet the criteria, you can forward this to the university pipeline.</p>
        <button class="btn btn-primary">${icon('plus', 16)} Create New Challenge</button>
      </div>
    `;
  },

  // ---------------- IMPACT VERIFICATION ----------------
  renderVerification(){
    const claims = DB.getImpactClaims ? DB.getImpactClaims() : [];
    
    return `
      <div class="view-head">
        <div><h1 class="view-title">Impact Verification</h1><p class="view-sub">Verify and audit claimed impact from deployed solutions</p></div>
      </div>
      
      <div class="kpi-row">
        <div class="kpi-card accent"><div class="kpi-value">Reach</div><div class="kpi-label">Beneficiaries</div></div>
        <div class="kpi-card"><div class="kpi-value">Severity Reduction</div><div class="kpi-label">Effectiveness</div></div>
        <div class="kpi-card"><div class="kpi-value">Adoption</div><div class="kpi-label">Usage Rate</div></div>
        <div class="kpi-card"><div class="kpi-value">Effectiveness</div><div class="kpi-label">Outcome</div></div>
        <div class="kpi-card"><div class="kpi-value">Scalability</div><div class="kpi-label">Potential</div></div>
        <div class="kpi-card"><div class="kpi-value">Sustainability</div><div class="kpi-label">Long-term</div></div>
      </div>
      
      <div class="card card-pad" style="margin-top:20px;">
        <h3 class="section-title">Impact Claims</h3>
        ${claims.length === 0 ? `
          <div style="background:var(--canvas); padding:20px; border-radius:8px;">
            <h4 style="margin:0 0 10px;">Submit New Claim</h4>
            <div class="form-row">
              <label class="field"><span class="field-label">Challenge</span>
                <select class="field"><option>Select challenge</option></select>
              </label>
            </div>
            <div class="form-row">
              <label class="field"><span class="field-label">Beneficiary Count</span>
                <input type="number" class="field" />
              </label>
            </div>
            <div class="form-row">
              <label class="field"><span class="field-label">Description</span>
                <textarea class="field" rows="3"></textarea>
              </label>
            </div>
            <button class="btn btn-primary" data-submit-claim>Submit Claim</button>
          </div>
        ` : `
          <div class="data-table">
            <div style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr; font-weight:bold; padding-bottom:10px; border-bottom:1px solid var(--line-soft); margin-bottom:10px;">
              <div>Claim</div><div>Beneficiaries</div><div>Status</div><div>Actions</div>
            </div>
            ${claims.map(c => `
              <div style="display:grid; grid-template-columns:2fr 1fr 1fr 1fr; align-items:center; padding:10px 0; border-bottom:1px solid var(--line-soft);">
                <div>
                  <div style="font-weight:600;">${c.title}</div>
                  <div style="font-size:12px; color:var(--ink-faint);">${c.desc || ''}</div>
                </div>
                <div>${c.beneficiaries || 0}</div>
                <div>
                  <div class="stepper" style="display:flex; gap:5px;">
                    <div class="stepper-step done"><div class="stepper-circle"></div></div>
                    <div class="stepper-step current"><div class="stepper-circle"></div></div>
                    <div class="stepper-step"><div class="stepper-circle"></div></div>
                    <div class="stepper-step"><div class="stepper-circle"></div></div>
                  </div>
                  <div style="font-size:10px; color:var(--ink-faint); margin-top:4px;">Submitted → Evidence → Verification → Verified</div>
                </div>
                <div><button class="btn btn-outline btn-sm" data-verify-impact="${c.id}">Verify</button></div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  bind(view, ctx, refresh){
    const main = document.getElementById('main-view');

    main.querySelectorAll('[data-open-report]').forEach(el=>{
      el.addEventListener('click', ()=> this.openReportModal(el.dataset.openReport, refresh));
    });

    main.querySelectorAll('[data-select-challenge]').forEach(btn=>{
      btn.addEventListener('click', ()=> this.selectChallengeModal(btn.dataset.selectChallenge, refresh));
    });

    main.querySelectorAll('[data-gate]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        DB.setReportGate(btn.dataset.gate, btn.dataset.decision);
        if (btn.dataset.decision === 'innovation'){
          const r = DB.getReports().find(r=>r.id===btn.dataset.gate);
          DB.addChallengeFromReport(r);
          toast('Routed to the university innovation pipeline.');
        } else {
          toast('Routed back to routine government workflow.');
        }
        refresh();
      });
    });

    main.querySelectorAll('[data-evidence]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        DB.requestEvidence(btn.dataset.evidence);
        toast('Evidence request sent to the citizen who submitted this report.');
        refresh();
      });
    });

    main.querySelectorAll('[data-reuse-solution]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(DB.markSolutionReused) DB.markSolutionReused(btn.dataset.reuseSolution);
        toast('Solution marked for reuse.');
        refresh();
      });
    });

    main.querySelectorAll('[data-submit-claim]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(DB.submitImpactClaim) DB.submitImpactClaim({});
        toast('Impact claim submitted.');
        refresh();
      });
    });

    main.querySelectorAll('[data-verify-impact]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(DB.verifyImpact) DB.verifyImpact(btn.dataset.verifyImpact);
        toast('Impact verification initiated.');
        refresh();
      });
    });

    main.querySelectorAll('[data-verify-spam]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        DB.verifyReport(btn.dataset.verifySpam);
        toast('Approved — moved into the normal report queue.');
        refresh();
      });
    });

    main.querySelectorAll('[data-dismiss-spam]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        DB.dismissSpamReport(btn.dataset.dismissSpam);
        toast('Confirmed as spam — kept out of the review queue.');
        refresh();
      });
    });

    main.querySelectorAll('[data-view-location]').forEach(el=>{
      el.addEventListener('click', (e)=>{
        e.stopPropagation();
        const r = DB.getAllReportsIncludingSpam().find(r=>r.id===el.dataset.viewLocation);
        if (r) openLocationModal(r);
      });
    });

    if (view === 'dept-directory') {
      const searchInput = document.getElementById('dept-search');
      if (searchInput) {
        searchInput.addEventListener('input', () => {
          const q = searchInput.value.toLowerCase();
          document.querySelectorAll('.dept-card').forEach(card => {
            card.style.display = (card.dataset.deptName || '').includes(q) ? '' : 'none';
          });
        });
      }
    }

    if (view === 'ai-routing') {
      const routeSelect = document.getElementById('ai-route-select');
      if (routeSelect) {
        routeSelect.addEventListener('change', () => {
          const rid = routeSelect.value;
          const resultDiv = document.getElementById('ai-route-result');
          if (!rid || !resultDiv) { if (resultDiv) resultDiv.innerHTML = ''; return; }
          const r = DB.getReports().find(x => x.id === rid);
          if (!r) { resultDiv.innerHTML = ''; return; }
          const depts = typeof DB.getDepartmentsForDomain === 'function' ? DB.getDepartmentsForDomain(r.domain) : [];
          let rhtml = '<div class="ai-route-result">';
          rhtml += '<div class="ai-route-match">Primary Match: ' + (depts[0] ? depts[0].name : 'Municipal Administration') + '</div>';
          if (depts.length > 1) {
            rhtml += '<div style="font-size:13px;color:var(--ink-soft);margin-top:6px;">Also relevant: ' + depts.slice(1).map(d => d.shortName).join(', ') + '</div>';
          }
          rhtml += '<div style="margin-top:10px;"><button class="btn btn-primary btn-sm" id="btn-route-action">Route Report Now</button></div>';
          rhtml += '</div>';
          resultDiv.innerHTML = rhtml;
          const btnAction = document.getElementById('btn-route-action');
          if (btnAction) {
            btnAction.addEventListener('click', () => toast('Report ' + r.id + ' routed successfully to ' + (depts[0] ? depts[0].shortName : 'Department')));
          }
        });
      }
    }
  },

  // ---------------- CHALLENGES (select & review) ----------------
  renderChallenges(){
    const challenges = DB.getChallenges();
    const statusLabel = { open:'Open', claimed:'Claimed', 'in-progress':'In progress', pilot:'Pilot', done:'Deployed' };
    const statusClass = { open:'status-pending', claimed:'status-progress', 'in-progress':'status-progress', pilot:'status-progress', done:'status-done' };

    return `
      <div class="view-head">
        <div><h1 class="view-title">Challenges</h1><p class="view-sub">Every problem routed into the university innovation pipeline. Select one to review its full detail and ownership.</p></div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card accent"><div class="kpi-value">${challenges.length}</div><div class="kpi-label">Total challenges</div></div>
        <div class="kpi-card"><div class="kpi-value">${challenges.filter(c=>c.status==='open').length}</div><div class="kpi-label">Open — unclaimed</div></div>
        <div class="kpi-card"><div class="kpi-value">${challenges.filter(c=>c.university).length}</div><div class="kpi-label">Matched to a university</div></div>
        <div class="kpi-card"><div class="kpi-value">${challenges.filter(c=>c.status==='pilot'||c.status==='done').length}</div><div class="kpi-label">Pilot or deployed</div></div>
      </div>

      <div class="grid grid-2">
        ${challenges.length ? challenges.map(c=>`
          <div class="card challenge-card ${c.id===this.selectedChallengeId?'selected-challenge':''}">
            ${c.image ? `<div class="challenge-banner sm"><img class="challenge-banner-img" src="${c.image}" alt="${c.title}" loading="lazy" onerror="handleImageError(this, '${c.domain}')" /><div class="challenge-banner-overlay"></div></div>` : ''}
            <div class="card-pad">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px; gap:8px;">
                <span class="tag">${c.domain}</span>
                <span class="tag ${statusClass[c.status]}">${statusLabel[c.status] || c.status}</span>
              </div>
              <div style="font-weight:700; font-size:15.5px; margin-bottom:6px;">${c.title}</div>
              <p class="report-desc" style="margin-bottom:10px;">${c.summary}</p>
              <div class="chip-row" style="margin-bottom:12px;">
                ${c.capabilities.map(cap=>`<span class="chip">${cap}</span>`).join('')}
              </div>
              <div style="font-size:12px; color:var(--ink-faint); margin-bottom:14px; display:flex; flex-wrap:wrap; gap:10px;">
                <span>${icon('building',12)} ${c.university || 'Unassigned'}</span>
                <span>${icon('trend',12)} ${c.matchScore}% match</span>
              </div>
              ${responsibleHtml(c)}
              <button class="btn ${c.id===this.selectedChallengeId?'btn-secondary':'btn-primary'} btn-sm" data-select-challenge="${c.id}">
                ${icon('checkCircle',14)} ${c.id===this.selectedChallengeId?'Selected — view again':'Select challenge'}
              </button>
            </div>
          </div>
        `).join('') : `<div class="empty-state" style="grid-column:1/-1;">${icon('briefcase',30)}<p>No challenges have been created yet — route a report through the Innovation Gate first.</p></div>`}
      </div>
    `;
  },

  selectedChallengeId: null,

  selectChallengeModal(id, refresh){
    const c = DB.getChallenges().find(c=>c.id===id);
    if (!c) return;
    this.selectedChallengeId = id;
    const sourceReport = c.sourceReport ? DB.getAllReportsIncludingSpam().find(r=>r.id===c.sourceReport) : null;

    openModal({
      title: c.title,
      body: `
        ${c.image ? `<img class="report-hero-img" style="margin-bottom:4px;" src="${c.image}" alt="${c.title}" onerror="handleImageError(this, '${c.domain}')" />` : ''}
        <p class="report-desc">${c.summary}</p>
        <div class="chip-row">${c.capabilities.map(cap=>`<span class="chip">${cap}</span>`).join('')}</div>
        <div class="report-tags">
          <span class="tag">${c.domain}</span>
          <span class="tag">${c.maturity}</span>
          <span class="tag">${icon('building',11)} ${c.university || 'Unassigned'}</span>
        </div>
        ${responsibleHtml(c)}
        ${c.team && c.team.length ? `<div style="font-size:13px; color:var(--ink-soft);"><strong>Team:</strong> ${c.team.join(', ')}</div>` : ''}
        ${sourceReport ? `
          <div style="font-size:13px; color:var(--ink-soft);">
            <strong>Originating report:</strong> ${sourceReport.title}
            <span id="challenge-view-location" style="cursor:pointer; color:var(--accent); margin-left:6px;">${icon('pin',12)} View location</span>
          </div>
        ` : ''}
        <div style="font-size:12.5px; color:var(--ink-faint);">Match score: ${c.matchScore}% · Milestone stage: ${c.milestone}/3</div>
      `,
      footer: `
        <button class="btn btn-outline" data-modal-close>Close</button>
        <button class="btn btn-primary" id="modal-confirm-select">${icon('checkCircle',14)} Confirm selection</button>
      `,
      onMount: () => {
        const locBtn = document.getElementById('challenge-view-location');
        if (locBtn && sourceReport) locBtn.addEventListener('click', () => openLocationModal(sourceReport));
        document.getElementById('modal-confirm-select').addEventListener('click', ()=>{
          toast(`"${c.title}" selected for government oversight.`);
          closeModal();
          refresh();
        });
      }
    });
  },

  openReportModal(id, refresh){
    const r = (DB.getReports ? DB.getReports().find(x => x.id === id) : null) || (DB.getAllReportsIncludingSpam ? DB.getAllReportsIncludingSpam().find(x => x.id === id) : null);
    if (!r) return;
    const depts = typeof DB.getDepartmentsForDomain === 'function' ? DB.getDepartmentsForDomain(r.domain) : [];
    const primaryDept = depts[0];
    const suggestion = aiSuggestion(r);
    const solutions = typeof DB.getSolutionLibrary === 'function' ? DB.getSolutionLibrary(r.domain).slice(0, 2) : [];

    let body = `
      ${r.image ? `<img class="report-hero-img" style="margin-bottom:8px; width:100%; max-height:220px; object-fit:cover; border-radius:10px;" src="${r.image}" alt="${escapeHtml(r.title)}" onerror="handleImageError(this, '${r.domain}')" />` : ''}
      <p class="report-desc" style="margin:0 0 12px; color:var(--ink-soft);">${escapeHtml(r.desc)}</p>
      <div class="report-tags" style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px;">
        <span class="tag priority-${(r.priority || '').toLowerCase()}">${r.priority} priority</span>
        <span class="chip-domain">Domain: ${escapeHtml(r.domain)}</span>
        <span class="tag">${icon('users',11)} ${formatCount(r.affected)} affected</span>
        ${clusterPillHtml(r)}
        <span class="tag" style="cursor:pointer;" id="modal-view-location" title="View precise location">${icon('pin', 11)} ${escapeHtml(r.area)}</span>
      </div>

      <div class="gate-ai-box" style="margin-bottom:14px; background:var(--accent-softer); padding:12px 14px; border-radius:8px; border-left:3px solid var(--accent);">
        <strong style="color:var(--accent-ink);">🤖 AI Analysis</strong><br/>
        <span style="font-size:13px; color:var(--ink);">${suggestion}</span>
      </div>
    `;

    if (primaryDept) {
      body += `
        <div class="ai-route-result" style="margin-bottom:14px;">
          <div class="ai-route-match">📋 Auto-routed to: ${primaryDept.shortName} — ${primaryDept.name}</div>
          <div style="font-size:12.5px; color:var(--ink-soft); margin-top:4px;">Contact: ${primaryDept.phone} | ${primaryDept.email}</div>
        </div>
      `;
    }

    if (solutions.length > 0) {
      body += `
        <div class="similar-banner">
          <div class="similar-banner-icon">💡</div>
          <div class="similar-banner-text">
            <div class="similar-banner-title">Similar solved problems found</div>
            <div class="similar-banner-desc">${solutions.map(s => escapeHtml(s.title)).join('; ')}</div>
          </div>
        </div>
      `;
    }

    body += `
      <div class="form-row" style="margin-top:14px;">
        <label class="field"><span class="field-label">Set Priority</span>
          <select id="modal-priority">
            <option ${r.priority === 'High' ? 'selected' : ''}>High</option>
            <option ${r.priority === 'Medium' ? 'selected' : ''}>Medium</option>
            <option ${r.priority === 'Low' ? 'selected' : ''}>Low</option>
          </select>
        </label>
      </div>
      <div style="font-size:12.5px; color:var(--ink-faint); margin-top:8px;">Reported by ${escapeHtml(r.citizen)} on ${formatDate(r.created)} · Due ${formatDate(r.due)}</div>
    `;

    const footer = `
      <button class="btn btn-secondary" data-modal-close>Close</button>
      <button class="btn btn-primary" id="modal-save-priority">Save Priority</button>
      <button class="btn btn-outline" id="modal-escalate">⬆ Escalate</button>
      <button class="btn btn-outline" id="modal-route-dept">📋 Route to Dept</button>
    `;

    openModal({
      title: r.title,
      body,
      footer,
      onMount: () => {
        const saveBtn = document.getElementById('modal-save-priority');
        if (saveBtn) saveBtn.addEventListener('click', () => {
          const val = document.getElementById('modal-priority').value;
          DB.setReportPriority(r.id, val);
          toast('Priority updated.');
          closeModal();
          refresh();
        });
        const locTag = document.getElementById('modal-view-location');
        if (locTag) locTag.addEventListener('click', () => openLocationModal(r));
        const escBtn = document.getElementById('modal-escalate');
        if (escBtn) escBtn.addEventListener('click', () => {
          toast('Report escalated to District Collector.');
          closeModal();
          refresh();
        });
        const routeBtn = document.getElementById('modal-route-dept');
        if (routeBtn) routeBtn.addEventListener('click', () => {
          if (primaryDept) toast('Routed to ' + primaryDept.shortName + ' — ' + primaryDept.name);
          else toast('No matching department found.');
          closeModal();
          refresh();
        });
      }
    });
  },

  // ---------------- SPAM FOLDER ----------------
  renderSpamFolder(){
    const spam = DB.getSpamReports();
    const pending = spam.filter(r => !r.spamReviewed);
    const reviewed = spam.filter(r => r.spamReviewed);

    const spamCard = (r) => `
      <div class="card card-pad" style="border-color:${r.spamReviewed ? 'var(--line)' : 'var(--danger-soft)'};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
          <div style="min-width:0;">
            <div style="font-weight:700; font-size:14px;">${r.title}</div>
            <div style="font-size:12px; color:var(--ink-faint); margin-top:2px;">${r.area} · ${r.domain} · reported by ${r.citizen}</div>
          </div>
          <span class="tag priority-high" style="flex-shrink:0;">${icon('flag',11)} ${r.aiConfidence}% spam risk</span>
        </div>
        <p class="report-desc" style="margin-top:10px;">${r.desc || '<em>No description provided.</em>'}</p>
        <div style="margin-top:8px; display:flex; flex-wrap:wrap; gap:6px;">
          ${(r.spamReasons || []).map(reason => `<span class="tag">${icon('sparkles',11)} ${reason}</span>`).join('')}
        </div>
        ${r.spamReviewed ? `
          <div style="margin-top:12px; font-size:12.5px; font-weight:600; color:${r.spamDismissed ? 'var(--danger)' : 'var(--ok)'};">
            ${r.spamDismissed ? `${icon('x',13)} Confirmed spam — kept out of the review queue` : `${icon('checkCircle',13)} Verified as a real report`}
          </div>
        ` : `
          <div style="margin-top:14px; display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn-primary btn-sm" data-verify-spam="${r.id}">${icon('checkCircle',14)} Verify — convert to real report</button>
            <button class="btn btn-outline btn-sm" data-dismiss-spam="${r.id}">${icon('x',14)} Confirm spam</button>
            <button class="btn btn-outline btn-sm" data-view-location="${r.id}">${icon('pin',14)} View location</button>
          </div>
        `}
      </div>
    `;

    return `
      <div class="view-head">
        <div><h1 class="view-title">Spam folder</h1><p class="view-sub">AI automatically flags likely spam or suspicious citizen reports here for your review — nothing reaches the priority board until you decide.</p></div>
      </div>

      <div class="kpi-row">
        <div class="kpi-card accent"><div class="kpi-value">${pending.length}</div><div class="kpi-label">Awaiting your review</div></div>
        <div class="kpi-card"><div class="kpi-value">${spam.filter(r=>r.verifiedFromSpam).length}</div><div class="kpi-label">Verified as real</div></div>
        <div class="kpi-card"><div class="kpi-value">${spam.filter(r=>r.spamDismissed).length}</div><div class="kpi-label">Confirmed spam</div></div>
      </div>

      <h2 class="section-title">Needs review</h2>
      <div class="grid grid-2" style="margin-bottom:28px;">
        ${pending.length ? pending.map(spamCard).join('') : `<div class="empty-state" style="grid-column:1/-1;">${icon('checkCircle',30)}<p>No suspicious reports right now — the AI hasn't flagged anything new.</p></div>`}
      </div>

      ${reviewed.length ? `
        <h2 class="section-title">Previously reviewed</h2>
        <div class="grid grid-2">${reviewed.map(spamCard).join('')}</div>
      ` : ''}
    `;
  },

  renderDeptDirectory(){
    const depts = typeof DB.getDepartments === 'function' ? DB.getDepartments() : [];
    return `
      <div class="view-head">
        <div><h1 class="view-title">Department Directory</h1><p class="view-sub">All 27 Jharkhand state departments and contact directory.</p></div>
      </div>
      <div class="card card-pad" style="margin-bottom:20px;">
        <input type="text" id="dept-search" class="field" placeholder="Search departments…" style="max-width:400px;" />
      </div>
      <div class="dept-grid" id="dept-grid">
        ${depts.map(d => `
          <div class="dept-card" data-dept-name="${(d.name || '').toLowerCase()} ${(d.shortName || '').toLowerCase()}">
            <div class="dept-card-head">${d.shortName} — ${d.name}</div>
            <div class="dept-card-meta">
              👤 ${d.head}<br/>
              📞 ${d.phone}<br/>
              ✉️ ${d.email}
            </div>
            <div class="dept-card-domains">
              ${(d.domains || []).map(dm => '<span class="dept-tag">' + dm + '</span>').join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderAiRouting(){
    const reports = typeof DB.getReports === 'function' ? DB.getReports().filter(r => !r.spam) : [];
    return `
      <div class="view-head">
        <div><h1 class="view-title">AI Department Routing</h1><p class="view-sub">Automated NLP routing engine to assign citizen issues to state authorities.</p></div>
      </div>
      <div class="card card-pad" style="margin-bottom:20px;">
        <h3 class="section-title" style="margin-top:0;">Route a Report</h3>
        <select id="ai-route-select" class="field" style="max-width:560px;">
          <option value="">— Select a report to test routing —</option>
          ${reports.map(r => '<option value="' + r.id + '">' + r.id + ' — ' + escapeHtml(r.title) + ' (' + r.domain + ')</option>').join('')}
        </select>
        <div id="ai-route-result"></div>
      </div>
      <div class="card card-pad">
        <h3 class="section-title" style="margin-top:0;">Recent Auto-Routed Reports</h3>
        <table class="data-table">
          <thead>
            <tr><th>Report</th><th>Domain</th><th>Routed To</th><th>Confidence</th></tr>
          </thead>
          <tbody>
            ${reports.slice(0, 8).map(r => {
              const depts = typeof DB.getDepartmentsForDomain === 'function' ? DB.getDepartmentsForDomain(r.domain) : [];
              const primary = depts[0];
              return `<tr>
                <td><strong>${r.id}</strong> — ${escapeHtml(r.title)}</td>
                <td><span class="tag">${r.domain}</span></td>
                <td>${primary ? primary.shortName + ' — ' + primary.name : 'Municipal Works'}</td>
                <td><strong style="color:var(--ok);">94%</strong></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },
};

function aiSuggestion(r){
  if (r.domain === 'Infrastructure' && r.priority === 'Low') return 'Likely a routine maintenance fix (e.g. bulb/connection replacement). Existing municipal workflow should be sufficient.';
  if (r.domain === 'Water') return 'Recurring pattern detected across multiple reports in this area — root cause may require sensing/monitoring innovation beyond routine repair.';
  if (r.domain === 'Agriculture') return 'Spreading pattern suggests a detection/early-warning gap that routine extension services cannot currently close — innovation may be warranted.';
  return 'No existing authority process fully covers this pattern — recommend further root-cause review.';
}

/* ---------------- Innovation Gate helpers ---------------- */

// Mock "existing-system check" — what a real integration would query per domain.
const EXISTING_SYSTEMS = {
  Water: {
    repos: ['State PHED Grievance Portal', 'Jal Jeevan Mission Dashboard'],
    gapFound: true,
    gap: 'Existing portals only log complaints — there is no real-time sensing or predictive alerting for recurring failures like this one.',
  },
  Agriculture: {
    repos: ['State Agri Advisory System', 'National Pest Surveillance Portal'],
    gapFound: true,
    gap: 'Existing systems lack automated image-based diagnosis and village-level offline telemetry. Only static text advisories are currently supported.',
  },
  Infrastructure: {
    repos: ['Municipal Public Works Ticketing', 'PWD Road Asset Registry'],
    gapFound: false,
    gap: 'Routine repair and maintenance workflows already cover this class of issue — no capability gap identified.',
  },
};
const DEFAULT_SYSTEM_CHECK = {
  repos: ['State Grievance Redressal System'],
  gapFound: true,
  gap: 'No dedicated system currently covers this problem category.',
};

// Deterministic mock similarity score between two reports (stand-in for a real
// vector-similarity / geo-radius search once a backend is wired up).
function clusterMatchScore(a, b){
  let score = 55;
  if (a.priority === b.priority) score += 12;
  const areaA = (a.area.split(',').pop() || '').trim();
  const areaB = (b.area.split(',').pop() || '').trim();
  if (areaA && areaA === areaB) score += 15;
  const seed = (a.id + b.id).split('').reduce((s,c)=> s + c.charCodeAt(0), 0);
  score += seed % 18;
  return Math.min(score, 97);
}
function clusterCandidates(report){
  return DB.getReports()
    .filter(r => r.id !== report.id && r.domain === report.domain)
    .map(r => ({ report: r, score: clusterMatchScore(report, r) }))
    .filter(c => c.score >= 60)
    .sort((a,b)=> b.score - a.score)
    .slice(0, 3);
}

// AI cluster merging — runs automatically, no reviewer confirmation required.
// Any report that has a qualifying candidate cluster and hasn't been decided
// yet gets merged into its best match right away.
function autoMergeClusters(){
  DB.getReports().forEach(r => {
    if (r.clusterDecision) return;
    const candidates = clusterCandidates(r);
    if (candidates.length){
      DB.setClusterDecision(r.id, 'merge', candidates[0].report.id);
    }
  });
}

// AI recommendation for the Innovation Necessity Gate: verdict + confidence + rationale.
function aiVerdict(r){
  if (r.domain === 'Infrastructure' && r.priority === 'Low'){
    return { verdict:'routine', confidence:91, rationale:'Likely a routine maintenance fix (e.g. bulb/connection replacement). Existing municipal workflow should be sufficient.' };
  }
  if (r.domain === 'Water'){
    return { verdict:'innovation', confidence:88, rationale:'Recurring pattern detected across multiple reports in this area — root cause may require sensing/monitoring innovation beyond routine repair.' };
  }
  if (r.domain === 'Agriculture'){
    return { verdict:'innovation', confidence:86, rationale:'Spreading pattern suggests a detection/early-warning gap that routine extension services cannot currently close — innovation may be warranted.' };
  }
  const sys = EXISTING_SYSTEMS[r.domain] || DEFAULT_SYSTEM_CHECK;
  if (!sys.gapFound){
    return { verdict:'routine', confidence:80, rationale:'Existing systems and workflows already cover this class of problem — no innovation gate needed.' };
  }
  return { verdict:'innovation', confidence:65, rationale:'No existing authority process fully covers this pattern — recommend further root-cause review.' };
}
