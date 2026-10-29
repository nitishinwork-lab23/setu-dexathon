/* ============================================================
   SETU — University views
   ============================================================ */

const University = {
  nav: [
    { id:'dashboard', label:'Challenge Marketplace', icon:'grid', group:'Core' },
    { id:'projects', label:'My Projects', icon:'layers', group:'Core' },
    { id:'charter', label:'Collaboration Charter', icon:'handshake', group:'Advanced' },
    { id:'team', label:'Team Formation', icon:'users', group:'Advanced' },
    { id:'maturity', label:'Maturity Gate', icon:'shield', group:'Advanced' },
    { id:'pilot', label:'Local Pilot', icon:'target', group:'Advanced' },
    { id:'capability', label:'Capability Profile', icon:'building', group:'Core' },
    { id:'solutions', label:'Solution Library', icon:'bulb', group:'Core' },
    { id:'transparency', label:'Public Transparency', icon:'shield', group:'Advanced' },
  ],

  UNI_NAME: 'BIT Mesra',

  render(view, ctx){
    if (view === 'projects') return this.renderProjects();
    if (view === 'charter') return this.renderCharter();
    if (view === 'team') return this.renderTeamFormation();
    if (view === 'maturity') return this.renderMaturityGate();
    if (view === 'pilot') return this.renderPilot();
    if (view === 'capability') return this.renderCapability();
    if (view === 'solutions') return renderSolutionLibraryHTML();
    if (view === 'transparency') return renderPublicTransparencyHTML();
    return this.renderMarketplace();
  },

  renderMarketplace(){
    const challenges = typeof DB !== 'undefined' && DB.getChallenges ? DB.getChallenges() : [];
    const open = challenges.filter(c=>c.status==='open');
    const districts = typeof DB !== 'undefined' && DB.getAllDistricts ? DB.getAllDistricts() : [];
    return `
      <div class="view-head">
        <div><h1 class="view-title">Challenge marketplace</h1><p class="view-sub">Validated problems matched to your institution's capability profile.</p></div>
      </div>
      
      <div style="display:flex; gap:12px; margin-bottom:24px; align-items:center; flex-wrap:wrap;">
        <div class="field" style="margin:0;">
          <select class="select-box" style="padding:8px;">
            <option value="">All Domains</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Education">Education</option>
          </select>
        </div>
        <div class="field" style="margin:0;">
          <select id="marketplace-district-filter" class="select-box" style="padding:8px;">
            <option value="">All 24 Districts</option>
            ${districts.map(d=>`<option value="${d.name}">${d.name}</option>`).join('')}
          </select>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-outline btn-sm">Open</button>
          <button class="btn btn-ghost btn-sm">Matched</button>
          <button class="btn btn-ghost btn-sm">Claimed</button>
        </div>
      </div>

      <div class="grid grid-2">
        ${open.length ? open.map(c=>`
          <div class="card challenge-card">
            ${c.image ? `<div class="challenge-banner"><img class="challenge-banner-img" src="${c.image}" alt="${c.title}" loading="lazy" onerror="handleImageError(this, '${c.domain}')" /><div class="challenge-banner-overlay"></div></div>` : ''}
            <div class="card-pad">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span class="tag">${c.domain}</span>
                <span class="tag" style="background:var(--accent-soft); color:var(--accent-ink); border-color:transparent;">${c.matchScore}% match</span>
              </div>
              <div style="font-weight:700; font-size:16px; margin-bottom:6px;">${c.title}</div>
              <p class="report-desc" style="margin-bottom:12px;">${c.summary}</p>
              <div class="chip-row" style="margin-bottom:16px;">
                ${c.capabilities.map(cap=>`<span class="chip">${cap}</span>`).join('')}
              </div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-primary" data-claim="${c.id}">${icon('checkCircle',15)} Opt in / Claim</button>
                <button class="btn btn-outline" data-match-details="${c.id}">${icon('eye',15)} Match Details</button>
                ${c.university === this.UNI_NAME ? `<button class="btn btn-secondary" data-start-charter="${c.id}">Start Charter</button>` : ''}
              </div>
            </div>
          </div>
        `).join('') : `<div class="empty-state" style="grid-column:1/-1;">${icon('grid',30)}<p>No open challenges right now — check back soon.</p></div>`}
      </div>
    `;
  },

  renderProjects(){
    const mine = typeof DB !== 'undefined' && DB.getChallenges ? DB.getChallenges().filter(c=>c.university===this.UNI_NAME) : [];
    const steps = ['Plan','Prototype','Pilot','Deployed'];
    return `
      <div class="view-head"><div><h1 class="view-title">My projects</h1><p class="view-sub">Collaboration charter, team and milestone tracking.</p></div></div>
      <div class="grid grid-2">
        ${mine.length ? mine.map(c=>`
          <div class="card challenge-card">
            ${c.image ? `<div class="challenge-banner sm"><img class="challenge-banner-img" src="${c.image}" alt="${c.title}" loading="lazy" onerror="handleImageError(this, '${c.domain}')" /><div class="challenge-banner-overlay"></div></div>` : ''}
            <div class="card-pad">
              <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <div style="font-weight:700; font-size:15.5px;">${c.title}</div>
                <span class="tag">${c.maturity}</span>
              </div>
              ${responsibleHtml(c)}
              <div class="stepper" style="margin:18px 0;">
                ${steps.map((label,i)=>`
                  <div class="stepper-step ${i<c.milestone?'done':''} ${i===c.milestone?'current':''}">
                    <div class="stepper-bar"></div>
                    <div class="stepper-circle">${i<c.milestone?icon('check',13):i+1}</div>
                    <div class="stepper-label">${label}</div>
                  </div>`).join('')}
              </div>
              
              <div class="section-title" style="margin-top:16px;">Milestones</div>
              <div style="display:flex; flex-direction:column; gap:8px; margin-bottom:16px;">
                ${((typeof DB !== 'undefined' && DB.getMilestones ? DB.getMilestones(c.id) : null) || [{label:'Phase 1', deliverable:'Prototype', deadline:'2023-12-01', owner:'University', evidence:['feasibility_report.pdf'], fundingPct:50, equityPct:10, status:'pending'}]).map((m, idx)=>`
                  <div style="background:var(--canvas); padding:12px; border-radius:8px; font-size:13px;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                      <strong>${m.label}: ${m.deliverable}</strong>
                      <span class="tag">${m.status}</span>
                    </div>
                    <div style="color:var(--ink-soft); margin-bottom:8px;">
                      Deadline: ${m.deadline} | Owner: ${m.owner} | Evidence: ${m.evidence ? m.evidence.length : (m.evidenceCount || 0)} files
                    </div>
                    <div style="display:flex; gap:12px; margin-bottom:8px;">
                      <div style="flex:1;">Funding <div class="progress-track" style="margin-top:4px;"><div class="progress-fill" style="width:${m.fundingPct}%;"></div></div></div>
                      <div style="flex:1;">Equity <div class="progress-track" style="margin-top:4px;"><div class="progress-fill" style="width:${m.equityPct}%;"></div></div></div>
                    </div>
                    <div style="display:flex; gap:8px;">
                      <button class="btn btn-secondary btn-sm" data-mentor-review="${c.id}" data-m-idx="${idx}">Review</button>
                      <button class="btn btn-primary btn-sm" data-mentor-approve="${c.id}" data-m-idx="${idx}">Approve</button>
                      <button class="btn btn-danger btn-sm" data-mentor-reject="${c.id}" data-m-idx="${idx}">Reject</button>
                    </div>
                  </div>
                `).join('')}
              </div>

              <div style="font-size:13px; color:var(--ink-soft); margin-bottom:10px;"><strong>Team:</strong> ${c.team.length ? c.team.join(', ') : 'No students assigned yet'}</div>
              <div style="display:flex; flex-wrap:wrap; gap:8px;">
                <button class="btn btn-outline btn-sm" data-team="${c.id}">${icon('users',14)} Manage team</button>
                ${c.milestone < 3 ? `<button class="btn btn-secondary btn-sm" data-advance="${c.id}">${icon('upload',14)} Submit Next Milestone</button>` : `<button class="btn btn-primary btn-sm" data-route="${c.id}">Select Deployment Route</button>`}
              </div>
            </div>
          </div>
        `).join('') : `<div class="empty-state" style="grid-column:1/-1;">${icon('layers',30)}<p>Claim a challenge from the marketplace to start a project.</p></div>`}
      </div>
    `;
  },

  renderCapability(){
    const uni = DB.getUniversities().find(u=>u.name===this.UNI_NAME) || DB.getUniversities()[0];
    return `
      <div class="view-head"><div><h1 class="view-title">Capability profile</h1><p class="view-sub">Kept up to date so the matching engine can find the right challenges for you.</p></div></div>
      <div class="card card-pad" style="max-width:560px;">
        <div style="font-weight:700; font-size:16px; margin-bottom:4px;">${uni.name}</div>
        <div style="font-size:12.5px; color:var(--ink-faint); margin-bottom:16px;">Last verified ${formatDate(uni.verified)}</div>
        <div class="section-title">Departments & capabilities</div>
        <div class="chip-row" style="margin-bottom:18px;">${uni.capabilities.map(c=>`<span class="chip">${c}<button data-remove-cap="${c}">${icon('x',10)}</button></span>`).join('')}</div>
        <div class="form-row" style="margin-bottom:14px;">
          <input type="text" id="new-cap" placeholder="Add a capability e.g. Robotics" />
          <button class="btn btn-secondary" id="add-cap-btn">${icon('plus',14)} Add</button>
        </div>
        <div class="kpi-row" style="margin-top:6px;">
          <div class="kpi-card"><div class="kpi-value">${uni.activeProjects}</div><div class="kpi-label">Active projects</div></div>
        </div>
      </div>
    `;
  },

  renderCharter(){
    const myChallenges = typeof DB !== 'undefined' && DB.getChallenges ? DB.getChallenges().filter(c=>c.university===this.UNI_NAME) : [];
    const options = myChallenges.map(c=>`<option value="${c.id}">${c.title}</option>`).join('');
    
    return `
      <div class="view-head">
        <div><h1 class="view-title">Collaboration Charter</h1><p class="view-sub">Formalize partnership details, IP sharing, and milestones.</p></div>
      </div>
      <div class="card card-pad" style="max-width:800px;">
        <div class="field">
          <label class="field-label">Select Project</label>
          <select id="charter-challenge-sel" class="select-box" style="width:100%; padding:8px; margin-bottom:16px;">
            ${options || '<option>No active projects</option>'}
          </select>
        </div>
        
        <div class="grid grid-2" style="margin-bottom:16px;">
          <div class="field">
            <label class="field-label">Lead University</label>
            <input type="text" class="input-box" value="${this.UNI_NAME}" readonly style="width:100%; padding:8px;">
          </div>
          <div class="field">
            <label class="field-label">Nodal Officer</label>
            <input type="text" class="input-box" placeholder="Name of principal investigator" style="width:100%; padding:8px;">
          </div>
        </div>

        <div class="section-title">Industry Partners</div>
        <div style="margin-bottom:16px;">
          <div class="chip-row">
            <span class="chip gap">TechCorp Inc. <button>${icon('x',10)}</button></span>
          </div>
          <button class="btn btn-secondary btn-sm" style="margin-top:8px;">${icon('plus',14)} Add Partner</button>
        </div>

        <div class="section-title">Roles & Responsibilities</div>
        <table class="data-table" style="width:100%; margin-bottom:16px;">
          <tr><th>Entity</th><th>Responsibility</th></tr>
          <tr><td>University</td><td>Prototyping, Research</td></tr>
          <tr><td>Industry Partner</td><td>Funding, Mentorship</td></tr>
        </table>
        
        <div class="field" style="margin-bottom:16px;">
          <label class="field-label">Assign Mentor</label>
          <select class="select-box" style="width:100%; padding:8px;">
            <option>Dr. Smith (Industry)</option>
            <option>Prof. Jones (Academic)</option>
          </select>
        </div>

        <div class="section-title">IP Template</div>
        <div style="margin-bottom:16px; display:flex; gap:16px;">
          <label><input type="radio" name="ip_template" checked> Case A (Open Source)</label>
          <label><input type="radio" name="ip_template"> Case B (University Owned)</label>
          <label><input type="radio" name="ip_template"> Case C (Joint IP)</label>
          <label><input type="radio" name="ip_template"> Case D (Sponsor Owned)</label>
        </div>

        <div class="section-title">Funding Sources</div>
        <div style="margin-bottom:16px; display:flex; gap:16px;">
          <label><input type="checkbox" checked> Government Grant</label>
          <label><input type="checkbox"> CSR Fund</label>
          <label><input type="checkbox"> University Corpus</label>
        </div>

        <div class="section-title">Milestone Ownership</div>
        <table class="data-table" style="width:100%; margin-bottom:16px;">
          <tr><th>Milestone</th><th>Owner</th></tr>
          <tr><td>Phase 1: Research</td><td>University</td></tr>
          <tr><td>Phase 2: Prototype</td><td>Joint</td></tr>
        </table>
        
        <div style="display:flex; gap:8px;">
          <button class="btn btn-primary" id="save-charter-btn">Save Charter</button>
          <button class="btn btn-outline" id="review-charter-btn">Submit for Review</button>
        </div>
      </div>
    `;
  },

  renderTeamFormation(){
    const myChallenges = typeof DB !== 'undefined' && DB.getChallenges ? DB.getChallenges().filter(c=>c.university===this.UNI_NAME) : [];
    const options = myChallenges.map(c=>`<option value="${c.id}">${c.title}</option>`).join('');
    const students = typeof DB !== 'undefined' && DB.getStudents ? DB.getStudents() : [];
    
    return `
      <div class="view-head">
        <div><h1 class="view-title">Team Formation & Skill Gap</h1><p class="view-sub">Build your project team and address missing capabilities.</p></div>
      </div>
      
      <div class="field" style="max-width:400px; margin-bottom:24px;">
        <label class="field-label">Select Project</label>
        <select id="team-challenge-sel" class="select-box" style="width:100%; padding:8px;">
          ${options || '<option>No active projects</option>'}
        </select>
      </div>

      <div class="grid grid-2">
        <div class="card card-pad">
          <div class="section-title">Required Roles</div>
          <div class="chip-row" style="margin-bottom:16px;">
            <span class="chip">Frontend Dev</span>
            <span class="chip">Data Scientist</span>
            <span class="chip">Hardware Engineer</span>
          </div>
          
          <div class="section-title">Student Candidates</div>
          <table class="data-table" style="width:100%;">
            <tr><th>Student</th><th>Skill-Fit Score</th><th>Action</th></tr>
            ${students.slice(0,3).map(s=>`
              <tr>
                <td>${s.name}</td>
                <td>
                  <div class="progress-track" style="width:80px; display:inline-block; vertical-align:middle; margin-right:8px;"><div class="progress-fill" style="width:${Math.floor(Math.random()*40+60)}%;"></div></div>
                </td>
                <td><button class="btn btn-secondary btn-sm" data-assign-role="${s.name}">Assign Role</button></td>
              </tr>
            `).join('')}
          </table>
        </div>
        
        <div class="card card-pad">
          <div class="section-title">Non-blocking Skill Gaps</div>
          <p style="font-size:13px; margin-bottom:12px;">Identify areas where the team needs upskilling while the project progresses.</p>
          <div class="mini-card" style="margin-bottom:8px; padding:12px; background:var(--canvas); border-radius:8px;">
            <div style="font-weight:600; font-size:14px; margin-bottom:4px;">Current vs Required: Cloud Deployment</div>
            <div class="progress-track" style="margin-bottom:8px;"><div class="progress-fill" style="width:40%; background:var(--warning);"></div></div>
            <button class="btn btn-outline btn-sm">Recommend Learning Module</button>
          </div>
          <div class="mini-card" style="padding:12px; background:var(--canvas); border-radius:8px;">
            <div style="font-weight:600; font-size:14px; margin-bottom:4px;">Current vs Required: Embedded C</div>
            <div class="progress-track" style="margin-bottom:8px;"><div class="progress-fill" style="width:60%; background:var(--warning);"></div></div>
            <button class="btn btn-outline btn-sm">Recommend Learning Module</button>
          </div>
        </div>
      </div>
    `;
  },

  renderMaturityGate(){
    const myChallenges = typeof DB !== 'undefined' && DB.getChallenges ? DB.getChallenges().filter(c=>c.university===this.UNI_NAME) : [];
    const options = myChallenges.map(c=>`<option value="${c.id}">${c.title}</option>`).join('');
    const categories = ['Technical Feasibility', 'Market Viability', 'Regulatory Compliance', 'Security & Privacy', 'Scalability', 'Financial Sustainability'];
    
    return `
      <div class="view-head">
        <div><h1 class="view-title">Maturity Gate</h1><p class="view-sub">Upload evidence to progress through maturity stages.</p></div>
      </div>
      
      <div class="field" style="max-width:400px; margin-bottom:24px;">
        <label class="field-label">Select Project</label>
        <select id="maturity-challenge-sel" class="select-box" style="width:100%; padding:8px;">
          ${options || '<option>No active projects</option>'}
        </select>
      </div>

      <div class="card card-pad" style="max-width:800px;">
        <div class="stepper" style="margin-bottom:24px;">
          <div class="stepper-step done"><div class="stepper-bar"></div><div class="stepper-circle">${icon('check',13)}</div><div class="stepper-label">Prototype</div></div>
          <div class="stepper-step current"><div class="stepper-bar"></div><div class="stepper-circle">2</div><div class="stepper-label">Tested</div></div>
          <div class="stepper-step"><div class="stepper-bar"></div><div class="stepper-circle">3</div><div class="stepper-label">Pilot Ready</div></div>
          <div class="stepper-step"><div class="stepper-bar"></div><div class="stepper-circle">4</div><div class="stepper-label">Deployed</div></div>
        </div>

        <div class="section-title">Evidence Checklist</div>
        <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:24px;">
          ${categories.map(cat=>`
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--canvas); padding:12px; border-radius:8px;">
              <div style="font-weight:500;">${cat}</div>
              <div style="display:flex; gap:8px;">
                <button class="btn btn-outline btn-sm">${icon('upload',14)} Upload</button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div style="display:flex; gap:8px;">
          <button class="btn btn-primary" id="submit-evidence-btn">Submit for Gate Review</button>
        </div>
      </div>
    `;
  },

  renderPilot(){
    const pilots = typeof DB !== 'undefined' && DB.getPilots ? DB.getPilots() : [];
    
    return `
      <div class="view-head">
        <div><h1 class="view-title">Local Pilots</h1><p class="view-sub">Monitor and manage active pilot deployments.</p></div>
      </div>
      
      <div class="grid grid-2">
        ${pilots.length ? pilots.map(p=>`
          <div class="card card-pad">
            <div style="font-weight:700; font-size:16px; margin-bottom:8px;">Pilot: ${p.location || 'Municipal Zone A'}</div>
            <div style="font-size:13px; color:var(--ink-soft); margin-bottom:12px;">
              <div><strong>Authority:</strong> ${p.authority || 'City Council'}</div>
              <div><strong>Partner:</strong> ${p.partner || 'TechCorp'}</div>
              <div><strong>Duration:</strong> ${p.duration || '3 Months'}</div>
              <div><strong>Beneficiaries:</strong> ${p.beneficiaries || '5,000 citizens'}</div>
            </div>
            
            <div style="margin-bottom:12px;">
              <div style="font-size:12px; font-weight:600; margin-bottom:4px;">Constraints</div>
              <div class="chip-row">
                ${(p.constraints || ['Budget Limit', 'Time Constraint']).map(c=>`<span class="chip gap" style="background:var(--danger-soft); color:var(--danger-ink); border:none;">${c}</span>`).join('')}
              </div>
            </div>
            
            <div style="margin-bottom:16px;">
              <div style="font-size:12px; font-weight:600; margin-bottom:4px;">Adaptations</div>
              <div class="chip-row">
                ${(p.adaptations || ['Localized UI', 'Offline Mode']).map(a=>`<span class="chip gap" style="background:var(--success-soft); color:var(--success-ink); border:none;">${a}</span>`).join('')}
              </div>
            </div>
            
            <div style="font-size:12px; font-weight:600; margin-bottom:4px;">Pilot Progress</div>
            <div class="progress-track" style="margin-bottom:16px;"><div class="progress-fill" style="width:${p.progress || 40}%;"></div></div>
            
            <button class="btn btn-secondary btn-sm" data-pilot-upload="${p.id || 'p1'}">${icon('upload',14)} Upload Field Evidence</button>
          </div>
        `).join('') : `<div class="empty-state" style="grid-column:1/-1;">${icon('target',30)}<p>No active pilots found.</p></div>`}
      </div>
    `;
  },

  openRouteModal(challengeId, refresh){
    openModal({
      title: 'Select Deployment Route',
      body: `
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div class="card card-pad route-card" data-route-opt="gov" style="cursor:pointer; border:1px solid var(--border);">
            <div style="font-weight:700; font-size:16px;">Government Deploy</div>
            <p style="font-size:13px; color:var(--ink-soft); margin-top:4px;">Direct implementation by government bodies for public welfare.</p>
          </div>
          <div class="card card-pad route-card" data-route-opt="ind" style="cursor:pointer; border:1px solid var(--border);">
            <div style="font-weight:700; font-size:16px;">Industry Adopt</div>
            <p style="font-size:13px; color:var(--ink-soft); margin-top:4px;">Commercialization and scaling by industry partners.</p>
          </div>
          <div class="card card-pad route-card" data-route-opt="csr" style="cursor:pointer; border:1px solid var(--border);">
            <div style="font-weight:700; font-size:16px;">CSR Fund</div>
            <p style="font-size:13px; color:var(--ink-soft); margin-top:4px;">Deployment funded through Corporate Social Responsibility initiatives.</p>
          </div>
        </div>
      `,
      footer: `<button class="btn btn-outline" data-modal-close>Cancel</button>`,
      onMount: () => {
        document.querySelectorAll('.route-card').forEach(card=>{
          card.addEventListener('click', ()=>{
            if(typeof DB !== 'undefined' && DB.setDeploymentRoute) DB.setDeploymentRoute(challengeId, card.dataset.routeOpt);
            toast('Deployment route selected successfully.');
            closeModal();
            refresh();
          });
        });
      }
    });
  },

  openTeamModal(challengeId, refresh){
    const c = DB.getChallenges().find(c=>c.id===challengeId);
    const students = typeof DB !== 'undefined' && DB.getStudents ? DB.getStudents() : [];
    openModal({
      title: 'Manage team — ' + c.title,
      body: `
        <div class="section-title">Current team</div>
        <div class="chip-row" style="margin-bottom:16px;">${c.team.length ? c.team.map(t=>`<span class="chip">${t}</span>`).join('') : '<span style="color:var(--ink-faint); font-size:13px;">No students yet.</span>'}</div>
        <div class="section-title">Suggested students</div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${students.map(s=>`
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:var(--canvas); border-radius:10px;">
              <div>
                <div style="font-weight:600; font-size:13.5px;">${s.name}</div>
                <div style="font-size:11.5px; color:var(--ink-faint);">${s.skills.join(', ')}</div>
              </div>
              <button class="btn btn-secondary btn-sm" data-add-student="${s.name}" ${c.team.includes(s.name)?'disabled':''}>${c.team.includes(s.name)?'Added':'Add'}</button>
            </div>
          `).join('')}
        </div>
      `,
      footer: `<button class="btn btn-outline" data-modal-close>Done</button>`,
      onMount: () => {
        document.querySelectorAll('[data-add-student]').forEach(btn=>{
          btn.addEventListener('click', ()=>{
            if(typeof DB !== 'undefined' && DB.joinProject) DB.joinProject(btn.dataset.addStudent, challengeId);
            toast(btn.dataset.addStudent + ' added to the team.');
            closeModal();
            refresh();
          });
        });
      }
    });
  },

  bind(view, ctx, refresh){
    const main = document.getElementById('main-view');
    if (!main) return;

    const distFilter = document.getElementById('marketplace-district-filter');
    if (distFilter){
      distFilter.addEventListener('change', ()=>{
        toast(distFilter.value ? 'Filtering by ' + distFilter.value : 'Showing all 24 districts');
      });
    }

    main.querySelectorAll('[data-claim]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if (typeof DB !== 'undefined' && DB.claimChallenge) DB.claimChallenge(btn.dataset.claim, this.UNI_NAME);
        toast('Challenge claimed — collaboration charter created.');
        refresh();
      });
    });

    main.querySelectorAll('[data-advance]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if (typeof DB !== 'undefined' && DB.advanceChallengeMilestone) DB.advanceChallengeMilestone(btn.dataset.advance);
        toast('Milestone approved — funding release requested.');
        refresh();
      });
    });

    main.querySelectorAll('[data-team]').forEach(btn=>{
      btn.addEventListener('click', ()=> this.openTeamModal(btn.dataset.team, refresh));
    });

    const addCapBtn = document.getElementById('add-cap-btn');
    if (addCapBtn){
      addCapBtn.addEventListener('click', ()=>{
        const input = document.getElementById('new-cap');
        const val = input.value.trim();
        if (!val) return;
        if (typeof DB !== 'undefined' && DB.getUniversities) {
          const uni = DB.getUniversities().find(u=>u.name===this.UNI_NAME);
          if (uni && !uni.capabilities.includes(val)){ uni.capabilities.push(val); if(DB.save) DB.save(); }
        }
        toast('Capability added.');
        refresh();
      });
    }

    // New bindings
    main.querySelectorAll('[data-route]').forEach(btn=>{
      btn.addEventListener('click', ()=> this.openRouteModal(btn.dataset.route, refresh));
    });
    
    main.querySelectorAll('[data-mentor-approve]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(typeof DB !== 'undefined' && DB.approveMilestone) DB.approveMilestone(btn.dataset.mentorApprove, parseInt(btn.dataset.mIdx));
        toast('Milestone approved.');
        refresh();
      });
    });

    main.querySelectorAll('[data-mentor-reject]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(typeof DB !== 'undefined' && DB.rejectMilestone) DB.rejectMilestone(btn.dataset.mentorReject, parseInt(btn.dataset.mIdx));
        toast('Milestone rejected.');
        refresh();
      });
    });

    main.querySelectorAll('[data-mentor-review]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        toast('Reviewing milestone evidence...');
      });
    });

    main.querySelectorAll('[data-match-details]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        openModal({
          title: 'Match Details',
          body: '<p>High compatibility found across 3 technical capabilities. Suggested team readiness is 85%.</p>',
          footer: '<button class="btn btn-outline" data-modal-close>Close</button>',
          onMount: ()=>{}
        });
      });
    });

    main.querySelectorAll('[data-start-charter]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if(typeof navigate === 'function') navigate('charter');
      });
    });

    const saveCharterBtn = document.getElementById('save-charter-btn');
    if(saveCharterBtn) saveCharterBtn.addEventListener('click', ()=>toast('Charter saved.'));

    const reviewCharterBtn = document.getElementById('review-charter-btn');
    if(reviewCharterBtn) reviewCharterBtn.addEventListener('click', ()=>toast('Charter submitted for review.'));
    
    main.querySelectorAll('[data-assign-role]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        toast('Role assigned to ' + btn.dataset.assignRole);
      });
    });

    const submitEvidenceBtn = document.getElementById('submit-evidence-btn');
    if(submitEvidenceBtn) submitEvidenceBtn.addEventListener('click', ()=>toast('Evidence submitted for gate review.'));
    
    main.querySelectorAll('[data-pilot-upload]').forEach(btn=>{
      btn.addEventListener('click', ()=>toast('Field evidence uploaded.'));
    });
  }
};
