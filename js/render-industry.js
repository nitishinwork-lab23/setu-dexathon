/* ============================================================
   SETU — Industry Partner views
   ============================================================ */

const Industry = {
  nav: [
    { id:'dashboard', label:'Project Marketplace', icon:'grid', group:'Invest' },
    { id:'commitments', label:'My Commitments', icon:'handshake', group:'Invest' },
    { id:'routes', label:'Deployment Routes', icon:'arrowRight', group:'Deploy' },
  ],

  PARTNER_NAME: 'AgroTech Jharkhand',

  render(view, ctx){
    if (view === 'commitments') return this.renderCommitments(ctx);
    if (view === 'routes') return this.renderRoutes(ctx);
    return this.renderMarketplace(ctx);
  },

  maturityFilterBar(active){
    const domains = ['All Domains', 'Agriculture', 'Healthcare', 'Education', 'Smart City'];
    const maturities = ['All', 'Prototype', 'Pilot-Ready'];
    const partnerships = ['All Support', 'API', 'Hardware', 'Cloud', 'Mentorship', 'Funding'];
    
    return `<div style="display:flex; gap:16px; margin-bottom:24px; flex-wrap:wrap; align-items:center;">
      <select class="field" style="width:200px; margin-bottom:0;" id="domain-filter">
        ${domains.map(d=>`<option value="${d}">${d}</option>`).join('')}
      </select>
      <div style="display:flex; gap:8px;" id="maturity-filter">
        ${maturities.map(o=>`<button class="btn ${active===o?'btn-primary':'btn-outline'} btn-sm" data-filter="${o}">${o}</button>`).join('')}
      </div>
      <select class="field" style="width:200px; margin-bottom:0;" id="partnership-filter">
        ${partnerships.map(p=>`<option value="${p}">${p}</option>`).join('')}
      </select>
    </div>`;
  },

  renderMarketplace(ctx){
    const challenges = DB.getChallenges();
    return `
      <div class="view-head">
        <div><h1 class="view-title">Project marketplace</h1><p class="view-sub">Validated, maturity-tagged innovation projects ready for support.</p></div>
      </div>
      ${this.maturityFilterBar('All')}
      <div class="grid grid-2" id="industry-grid">
        ${challenges.map(c=>this.projectCard(c, ctx)).join('')}
      </div>
    `;
  },

  projectCard(c, ctx){
    const ip = DB.getIndustryProjects().find(p=>p.challengeId===c.id);
    const interested = ip && ip.interestedPartners.includes(this.PARTNER_NAME);
    const badgeColor = c.maturity === 'Pilot-Ready' ? 'status-done' : (c.maturity === 'Prototype' ? 'status-progress' : 'status-pending');
    
    const supportTypes = ['API Access', 'Cloud Credits', 'Mentorship']; // mock support types
    
    return `
      <div class="card challenge-card" data-maturity="${c.maturity}" data-domain="${c.domain}">
        <div class="challenge-banner">
          <img class="challenge-banner-img" src="${c.image || getSvgFallback(c.domain)}" alt="${c.title}" loading="lazy" onerror="handleImageError(this, '${c.domain}')" />
          <div class="challenge-banner-overlay"></div>
        </div>
        <div class="card-pad">
          <div style="display:flex; justify-content:space-between; margin-bottom:12px; flex-wrap:wrap; gap:8px;">
            <span class="tag">${c.domain}</span>
            <span class="tag ${badgeColor}">${c.maturity}</span>
          </div>
          ${ip ? `
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px; flex-wrap:wrap;">
              ${ip.csrCategory ? `<span class="csr-badge high-fit">★ CSR: ${ip.csrCategory}</span>` : ''}
              ${ip.csrFocus ? `<span class="csr-badge medium-fit">${ip.csrFocus}</span>` : ''}
              ${ip.fundingRange ? `<span class="funding-range">₹${(ip.fundingRange.min/100000).toFixed(1)}L – ₹${(ip.fundingRange.max/100000).toFixed(1)}L</span>` : ''}
            </div>
          ` : ''}
          <div style="font-weight:700; font-size:18px; margin-bottom:8px;">${c.title}</div>
          <p class="report-desc" style="margin-bottom:8px;"><strong>Problem:</strong> ${c.summary}</p>
          <p class="report-desc" style="margin-bottom:16px;"><strong>Solution:</strong> Proposed solution leveraging technology to address the issue.</p>
          <div style="font-size:13px; color:var(--ink-faint); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
            ${icon('building', 14)} ${c.university ? c.university : 'University pending'} · ${icon('users', 14)} Team of ${c.team.length}
          </div>
          <div style="margin-bottom:16px;">${responsibleHtml(c)}</div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:20px;">
            ${supportTypes.map(s=>`<span class="chip">${s}</span>`).join('')}
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button class="btn btn-outline btn-sm">View Project</button>
            <button class="btn ${interested?'btn-outline':'btn-primary'} btn-sm" data-interest="${c.id}" ${interested?'disabled':''}>
              ${interested ? icon('check',14)+' Interest sent' : 'Express Interest'}
            </button>
            <button class="btn btn-outline btn-sm">Partner</button>
            <button class="btn btn-outline btn-sm">Fund</button>
            <button class="btn btn-outline btn-sm">Adopt</button>
          </div>
        </div>
      </div>`;
  },

  renderCommitments(ctx){
    const myProjects = DB.getIndustryProjects().filter(p=>p.interestedPartners.includes(this.PARTNER_NAME));
    const challenges = DB.getChallenges();
    return `
      <div class="view-head"><div><h1 class="view-title">My commitments</h1><p class="view-sub">Projects you've expressed interest in or are supporting.</p></div></div>
      <div class="grid grid-2">
        ${myProjects.length ? myProjects.map(p=>{
          const c = challenges.find(ch=>ch.id===p.challengeId);
          if (!c) return '';
          return `
          <div class="card card-pad">
            <div style="font-weight:700; margin-bottom:6px;">${c.title}</div>
            <div style="font-size:12.5px; color:var(--ink-faint); margin-bottom:10px;">${c.university || 'University pending'} · ${c.maturity}</div>
            <div class="progress-track" style="margin-bottom:6px;"><div class="progress-fill" style="width:${(c.milestone/3)*100}%"></div></div>
            <div style="font-size:12px; color:var(--ink-faint);">Milestone ${c.milestone} of 3</div>
          </div>`;
        }).join('') : `<div class="empty-state" style="grid-column:1/-1;">${icon('handshake',30)}<p>You haven't expressed interest in any projects yet.</p></div>`}
      </div>
    `;
  },

  renderRoutes(ctx) {
    const myProjects = DB.getIndustryProjects().filter(p=>p.interestedPartners.includes(this.PARTNER_NAME));
    const challenges = DB.getChallenges();
    return `
      <div class="view-head">
        <div><h1 class="view-title">Deployment Routes</h1><p class="view-sub">Track adoption and deployment of your committed projects.</p></div>
      </div>
      <div class="grid grid-2">
        ${myProjects.length ? myProjects.map(p=>{
          const c = challenges.find(ch=>ch.id===p.challengeId);
          if (!c) return '';
          return `
          <div class="card card-pad">
            <div style="font-weight:700; font-size:16px; margin-bottom:8px;">${c.title}</div>
            <div style="display:flex; justify-content:space-between; margin-bottom:16px;">
              <span class="tag">Deployment Phase</span>
              <span class="tag status-progress">In Progress</span>
            </div>
            <div class="stepper" style="margin-bottom:16px;">
              <div class="stepper-step" style="color:var(--primary); font-weight:600;">${icon('checkCircle',16)} Planning</div>
              <div class="stepper-step" style="color:var(--primary); font-weight:600;">${icon('checkCircle',16)} Integration</div>
              <div class="stepper-step" style="color:var(--ink-faint);">${icon('clock',16)} Launch</div>
            </div>
            <div style="display:flex; gap:8px;">
               <select class="field" style="margin:0; flex:1;" id="route-select-${c.id}">
                 <option value="direct">Direct Integration</option>
                 <option value="marketplace">Marketplace Listing</option>
                 <option value="internal">Internal Tooling</option>
               </select>
               <button class="btn btn-primary" data-route-set="${c.id}">Set Route</button>
            </div>
          </div>`;
        }).join('') : `<div class="empty-state" style="grid-column:1/-1;">${icon('arrowRight',30)}<p>No committed projects yet.</p></div>`}
      </div>
    `;
  },

  bind(view, ctx, refresh){
    const main = document.getElementById('main-view');

    main.querySelectorAll('[data-interest]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        DB.expressInterest(btn.dataset.interest, this.PARTNER_NAME);
        toast('Interest sent — the university team will be notified.');
        refresh();
      });
    });

    main.querySelectorAll('#maturity-filter [data-filter]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        main.querySelectorAll('#maturity-filter [data-filter]').forEach(b=>b.classList.replace('btn-primary','btn-outline'));
        btn.classList.replace('btn-outline','btn-primary');
        const f = btn.dataset.filter;
        main.querySelectorAll('.challenge-card').forEach(card=>{
          card.style.display = (f==='All' || card.dataset.maturity===f) ? '' : 'none';
        });
      });
    });

    main.querySelectorAll('[data-route-set]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.routeSet;
        const select = main.querySelector(`#route-select-${id}`);
        if (DB.setDeploymentRoute) {
            DB.setDeploymentRoute(id, select.value);
        }
        toast('Deployment route updated.');
      });
    });
  },
};
