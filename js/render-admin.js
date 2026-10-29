/* ============================================================
   SETU — Admin views
   ============================================================ */

const Admin = {
  nav: [
    { id:'dashboard', label:'Overview', icon:'grid', group:'Monitor' },
    { id:'system', label:'System Monitor', icon:'target', group:'Monitor' },
    { id:'users', label:'Users', icon:'users', group:'Manage' },
    { id:'content', label:'Reports & Challenges', icon:'layers', group:'Manage' },
    { id:'settings', label:'Settings', icon:'settings', group:'Manage' },
  ],

  render(view, ctx){
    if (view === 'system') return this.renderSystem();
    if (view === 'users') return this.renderUsers();
    if (view === 'content') return this.renderContent();
    if (view === 'settings') return this.renderSettings();
    return this.renderDashboard();
  },

  renderDashboard(){
    const users = DB.getUsers();
    const reports = DB.getReports();
    const challenges = DB.getChallenges();
    const pilots = DB.getPilots ? DB.getPilots() : [];
    const impact = DB.getImpactClaims ? DB.getImpactClaims() : [];
    const byRole = {};
    users.forEach(u => byRole[u.role] = (byRole[u.role]||0)+1);

    return `
      <div class="view-head"><div><h1 class="view-title">Platform overview</h1><p class="view-sub">System-wide numbers across all roles.</p></div></div>
      <div class="kpi-row" style="margin-bottom:16px;">
        <div class="kpi-card accent"><div class="kpi-value">${users.length}</div><div class="kpi-label">Total users</div></div>
        <div class="kpi-card"><div class="kpi-value">${reports.length}</div><div class="kpi-label">Reports filed</div></div>
        <div class="kpi-card"><div class="kpi-value">${challenges.length}</div><div class="kpi-label">Active challenges</div></div>
        <div class="kpi-card"><div class="kpi-value">${DB.getUniversities().length}</div><div class="kpi-label">Universities onboarded</div></div>
      </div>
      <div class="kpi-row">
        <div class="kpi-card"><div class="kpi-value">${pilots.length}</div><div class="kpi-label">Active Pilots</div></div>
        <div class="kpi-card"><div class="kpi-value">${impact.length}</div><div class="kpi-label">Impact Claims</div></div>
        <div class="kpi-card"><div class="kpi-value">${challenges.filter(c=>c.status==='done').length}</div><div class="kpi-label">Completed</div></div>
        <div class="kpi-card"><div class="kpi-value">12</div><div class="kpi-label">Recent Activities</div></div>
      </div>
      <div class="grid grid-2" style="margin-top:24px;">
        <div class="card card-pad">
          <div class="section-title">Users by role</div>
          ${Object.entries(byRole).map(([role,count])=>`
            <div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--line-soft); font-size:13.5px;">
              <span>${typeof ROLE_LABELS !== 'undefined' && ROLE_LABELS[role] ? ROLE_LABELS[role] : role}</span><span style="font-weight:700;">${count}</span>
            </div>`).join('')}
        </div>
        <div class="card card-pad">
          <div class="section-title">Challenge status</div>
          ${['open','claimed','in-progress','pilot','done'].map(status=>{
            const count = challenges.filter(c=>c.status===status).length;
            return `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--line-soft); font-size:13.5px;">
              <span style="text-transform:capitalize;">${status.replace('-',' ')}</span><span style="font-weight:700;">${count}</span>
            </div>`;
          }).join('')}
        </div>
        <div class="card card-pad" style="grid-column:1/-1;">
          <div class="section-title">Recent Activity Feed</div>
          <div style="font-size:13.5px;">
            <div style="padding:8px 0; border-bottom:1px solid var(--line-soft);"><strong>Dr. Sharma</strong> approved a milestone for Project X.</div>
            <div style="padding:8px 0; border-bottom:1px solid var(--line-soft);"><strong>AgroTech</strong> expressed interest in Soil Health Sensor.</div>
            <div style="padding:8px 0;"><strong>Student Team A</strong> submitted a prototype.</div>
          </div>
        </div>
      </div>
    `;
  },

  renderSystem(){
    return `
      <div class="view-head"><div><h1 class="view-title">System Monitor</h1><p class="view-sub">Platform health and audit logs.</p></div></div>
      
      <div class="kpi-row" style="margin-bottom:16px;">
        <div class="kpi-card"><div class="kpi-value">99.9%</div><div class="kpi-label">API Uptime</div></div>
        <div class="kpi-card"><div class="kpi-value">12ms</div><div class="kpi-label">DB Latency</div></div>
        <div class="kpi-card"><div class="kpi-value">Active</div><div class="kpi-label">AI Engine</div></div>
        <div class="kpi-card"><div class="kpi-value">45%</div><div class="kpi-label">Storage Used</div></div>
      </div>
      <div class="card card-pad" style="margin-bottom:24px;">
         <div class="section-title">Storage Usage</div>
         <div class="progress-track"><div class="progress-fill" style="width:45%"></div></div>
      </div>

      <div class="grid grid-2">
        <div class="card" style="grid-column:1/-1;">
          <div class="card-pad border-bottom"><div class="section-title" style="margin:0;">Audit Log</div></div>
          <table class="data-table">
            <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Resource</th><th>Status</th></tr></thead>
            <tbody>
              <tr><td>10:20 AM</td><td>Admin</td><td>Update Settings</td><td>System</td><td><span class="tag status-done">Success</span></td></tr>
              <tr><td>09:15 AM</td><td>AgroTech</td><td>Express Interest</td><td>Project-12</td><td><span class="tag status-done">Success</span></td></tr>
              <tr><td>08:30 AM</td><td>Dr. Sharma</td><td>Approve Milestone</td><td>Project-5</td><td><span class="tag status-done">Success</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderUsers(){
    const users = DB.getUsers();
    return `
      <div class="view-head"><div><h1 class="view-title">Users</h1><p class="view-sub">Manage access across all roles.</p></div></div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Name</th><th>Role</th><th>Joined</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${users.map(u=>`
              <tr>
                <td><strong>${u.name}</strong></td>
                <td><span class="role-pill">${ROLE_LABELS[u.role]}</span></td>
                <td>${formatDate(u.joined)}</td>
                <td><span class="tag ${u.status==='active'?'status-done':'priority-high'}">${u.status}</span></td>
                <td><button class="btn btn-outline btn-sm" data-toggle-user="${u.name}">${u.status==='active'?'Suspend':'Reactivate'}</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderContent(){
    const reports = DB.getReports();
    const challenges = DB.getChallenges();
    return `
      <div class="view-head"><div><h1 class="view-title">Reports & challenges</h1><p class="view-sub">Full system record for moderation and audit.</p></div></div>
      <h2 class="section-title">Reports</h2>
      <div class="card" style="margin-bottom:26px;">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Title</th><th>Priority</th><th>Gate</th><th>Status</th></tr></thead>
          <tbody>
            ${reports.map(r=>`
              <tr>
                <td>${r.id}</td><td>${r.title}</td>
                <td><span class="tag priority-${r.priority.toLowerCase()}">${r.priority}</span></td>
                <td>${r.gate ? `<span class="tag">${r.gate==='innovation'?'Innovation':'Routine'}</span>` : '<span class="tag status-pending">Pending</span>'}</td>
                <td>${r.status}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <h2 class="section-title">Challenges</h2>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>ID</th><th>Title</th><th>University</th><th>Maturity</th><th>Status</th></tr></thead>
          <tbody>
            ${challenges.map(c=>`
              <tr>
                <td>${c.id}</td><td>${c.title}</td><td>${c.university || '—'}</td>
                <td>${c.maturity}</td><td>${c.status}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  renderSettings(){
    const s = DB.getSettings();
    return `
      <div class="view-head"><div><h1 class="view-title">Settings</h1><p class="view-sub">Basic platform configuration.</p></div></div>

      <div class="card card-pad" style="max-width:520px; margin-bottom:20px;">
        <div class="section-title">Citizen toll-free helpline</div>
        <p style="font-size:13px; color:var(--ink-faint); margin-bottom:14px;">Shown on the login screen, the citizen sidebar, and the report form — for citizens without a smartphone or data connection who'd rather call in a report.</p>
        <div class="form-grid">
          <label class="field">
            <span class="field-label">Toll-free number</span>
            <input type="text" id="settings-tollfree-number" value="${s.tollFreeNumber}" placeholder="e.g. 1800-123-4567" />
          </label>
          <label class="field">
            <span class="field-label">Availability</span>
            <input type="text" id="settings-tollfree-hours" value="${s.tollFreeHours}" placeholder="e.g. 24x7, all days" />
          </label>
        </div>
        <button class="btn btn-primary" id="save-helpline-btn" style="margin-top:12px;">${icon('check',15)} Save</button>
      </div>

      <div class="card card-pad" style="max-width:520px;">
        <div class="section-title">Reset demo data</div>
        <p style="font-size:13px; color:var(--ink-faint); margin-bottom:14px;">Restores all reports, challenges and users to their original seed values. Useful before a live demo.</p>
        <button class="btn btn-danger" id="reset-data-btn">Reset all data</button>
      </div>
    `;
  },

  bind(view, ctx, refresh){
    const main = document.getElementById('main-view');
    main.querySelectorAll('[data-toggle-user]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        DB.toggleUserStatus(btn.dataset.toggleUser);
        refresh();
      });
    });
    const resetBtn = document.getElementById('reset-data-btn');
    if (resetBtn){
      resetBtn.addEventListener('click', ()=>{
        const session = DB.getSession();
        DB.reset();
        DB.setSession(session);
        toast('Demo data reset.');
        refresh();
      });
    }
    const saveHelplineBtn = document.getElementById('save-helpline-btn');
    if (saveHelplineBtn){
      saveHelplineBtn.addEventListener('click', ()=>{
        const number = document.getElementById('settings-tollfree-number').value.trim();
        const hours = document.getElementById('settings-tollfree-hours').value.trim();
        if (!number){ toast('Enter a toll-free number before saving.'); return; }
        DB.updateSettings({ tollFreeNumber: number, tollFreeHours: hours });
        toast('Helpline details updated.');
        refresh();
      });
    }
  },
};
