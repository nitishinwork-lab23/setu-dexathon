/* ============================================================
   SETU — Student views
   ============================================================ */

const Student = {
  nav: [
    { id:'dashboard', label:'Available Challenges', icon:'grid', group:'Projects' },
    { id:'myprojects', label:'My Projects', icon:'layers', group:'Projects' },
    { id:'learning', label:'Learning Path', icon:'bulb', group:'Growth' },
    { id:'profile', label:'Skill Profile', icon:'user', group:'Growth' },
  ],

  DEFAULT_NAME: 'Aman Raj',

  currentStudent(ctx){
    const name = ctx && ctx.session ? ctx.session.name : this.DEFAULT_NAME;
    return DB.getStudentByName(name) ||
           DB.getStudentByName(this.DEFAULT_NAME) ||
           (DB.getStudents && DB.getStudents()[0]) ||
           { name: 'Student', projects: [], skills: ['IoT', 'Sensors'], university: 'BIT Mesra' };
  },

  render(view, ctx){
    if (view === 'myprojects') return this.renderMyProjects(ctx);
    if (view === 'learning') return this.renderLearningPath(ctx);
    if (view === 'profile') return this.renderProfile(ctx);
    return this.renderChallenges(ctx);
  },

  renderChallenges(ctx){
    const me = this.currentStudent(ctx);
    const open = DB.getChallenges().filter(c => c.status !== 'done');
    return `
      <div class="view-head">
        <div><h1 class="view-title">Available challenges</h1><p class="view-sub">Real, validated problems you can join and learn from.</p></div>
      </div>
      <div class="grid grid-2">
        ${open.map(c=>{
          const joined = me && me.projects.includes(c.id);
          const matched = me ? c.capabilities.filter(cap=>me.skills.includes(cap)) : [];
          const gap = me ? c.capabilities.filter(cap=>!me.skills.includes(cap) && cap!=='To be assessed') : [];
          return `
          <div class="card challenge-card">
            ${c.image ? `<div class="challenge-banner"><img class="challenge-banner-img" src="${c.image}" alt="${c.title}" loading="lazy" onerror="handleImageError(this, '${c.domain}')" /><div class="challenge-banner-overlay"></div></div>` : ''}
            <div class="card-pad">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <span class="tag">${c.domain}</span>
                <span class="tag" style="background:var(--accent-soft); color:var(--accent-ink); border-color:transparent;">${c.maturity}</span>
              </div>
              <div style="font-weight:700; font-size:16px; margin-bottom:6px;">${c.title}</div>
              <p class="report-desc" style="margin-bottom:12px;">${c.summary}</p>
              <div class="chip-row" style="margin-bottom:12px;">
                ${matched.map(cap=>`<span class="chip">${cap}</span>`).join('')}
                ${gap.map(cap=>`<span class="chip gap">${icon('bulb',11)} ${cap} — learning path</span>`).join('')}
              </div>
              <div style="font-size:12.5px; color:var(--ink-faint); margin-bottom:12px;">Team: ${c.team.length ? c.team.join(', ') : 'Open — no members yet'}</div>
              <button class="btn ${joined?'btn-outline':'btn-primary'}" data-join="${c.id}" ${joined?'disabled':''}>
                ${joined ? icon('check',15)+' Joined' : icon('users',15)+' Join this challenge'}
              </button>
            </div>
          </div>`;
        }).join('')}
      </div>
    `;
  },

  renderMyProjects(ctx){
    const me = this.currentStudent(ctx);
    const mine = me ? DB.getChallenges().filter(c=>me.projects.includes(c.id)) : [];
    return `
      <div class="view-head"><div><h1 class="view-title">My projects</h1><p class="view-sub">Challenges you've joined and their current stage.</p></div></div>
      <div class="grid grid-2">
        ${mine.length ? mine.map(c=>{
          const milestones = DB.getMilestones ? (DB.getMilestones(c.id) || []) : [];
          return `
          <div class="card challenge-card" style="grid-column: 1 / -1;">
            ${c.image ? `<div class="challenge-banner sm"><img class="challenge-banner-img" src="${c.image}" alt="${c.title}" loading="lazy" onerror="handleImageError(this, '${c.domain}')" /><div class="challenge-banner-overlay"></div></div>` : ''}
            <div class="card-pad">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                <div style="font-weight:700; font-size:15.5px;">${c.title}</div>
                <span class="tag">${c.maturity}</span>
              </div>
              <div style="font-size:13px; color:var(--ink-soft); margin-bottom:10px;">Lead institution: ${c.university || 'Not yet assigned'}</div>
              <div style="margin-bottom:12px;">${responsibleHtml(c)}</div>
              
              <div class="section-title" style="margin-top:20px;">Milestones</div>
              <div class="grid grid-2">
                ${milestones.map((m, idx) => {
                  const overdue = isOverdue ? (isOverdue(m.deadline) && m.status !== 'approved') : false;
                  return `
                  <div class="card card-pad" style="border:1px solid var(--surface-hover);">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                      <div style="font-weight:600;">${m.label}</div>
                      <span class="tag" style="${m.status==='approved'?'background:var(--success-soft);color:var(--success-ink);':(m.status==='submitted'?'background:var(--accent-soft);color:var(--accent-ink);':'')}">${m.status}</span>
                    </div>
                    <div style="font-size:13px; margin-bottom:4px;">Deliverable: ${m.deliverable}</div>
                    <div style="font-size:13px; margin-bottom:4px; color:${overdue ? 'var(--danger)' : 'var(--ink-soft)'};">
                      ${icon('clock', 12)} Deadline: ${formatDate ? formatDate(m.deadline) : m.deadline} ${overdue ? '(Overdue)' : ''}
                    </div>
                    <div style="font-size:13px; margin-bottom:12px; color:var(--ink-soft);">Owner: ${m.owner}</div>
                    
                    <div style="display:flex; gap:16px; margin-bottom:12px;">
                      <div style="flex:1;">
                        <div style="font-size:11px; margin-bottom:4px;">Funding</div>
                        <div class="progress-track"><div class="progress-fill" style="width:${m.fundingPct}%"></div></div>
                      </div>
                      <div style="flex:1;">
                        <div style="font-size:11px; margin-bottom:4px;">Equity</div>
                        <div class="progress-track"><div class="progress-fill" style="width:${m.equityPct}%"></div></div>
                      </div>
                    </div>
                    
                    <div class="stepper" style="margin-bottom:12px; font-size:11px; display:flex; gap:8px;">
                      <div class="stepper-step ${m.status!=='locked'?'active':''}"><div class="stepper-dot"></div><div>In Progress</div></div>
                      <div class="stepper-step ${m.status==='submitted'||m.status==='approved'?'active':''}"><div class="stepper-dot"></div><div>Review</div></div>
                      <div class="stepper-step ${m.status==='approved'?'active':''}"><div class="stepper-dot"></div><div>Approved</div></div>
                    </div>
                    
                    <div style="display:flex; gap:8px; margin-top:16px;">
                      <button class="btn btn-outline btn-sm upload-btn" data-cid="${c.id}" data-idx="${idx}" ${m.status!=='in-progress'?'disabled':''}>${icon('upload', 14)} Upload</button>
                      <button class="btn btn-primary btn-sm submit-btn" data-cid="${c.id}" data-idx="${idx}" ${m.status!=='in-progress'?'disabled':''}>Submit</button>
                    </div>
                  </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        `}).join('') : `<div class="empty-state" style="grid-column:1/-1;">${icon('layers',30)}<p>You haven't joined a challenge yet.</p></div>`}
      </div>
    `;
  },

  renderLearningPath(ctx){
    const me = this.currentStudent(ctx);
    const paths = me && DB.getLearningPaths ? DB.getLearningPaths(me.name) : [];
    
    return `
      <div class="view-head">
        <div><h1 class="view-title">Learning Path</h1><p class="view-sub">Close your skill gaps to unlock new challenges.</p></div>
      </div>
      <div class="grid grid-2">
        <div style="grid-column: 1 / -1; display:flex; gap: 20px; flex-wrap:wrap;">
          <div style="flex: 2; min-width:300px;">
            ${paths.length ? paths.map(raw => {
              const cid = raw.cid || raw.challengeId;
              const ch = DB.getChallenges().find(c => c.id === cid);
              const done = raw.completedTopics || 0;
              const topics = (raw.topics || []).map((t, i) => typeof t === 'string'
                ? { name: t, completed: i < done }
                : { name: t.name || t.title || 'Untitled topic', completed: !!t.completed });
              const resources = raw.resources || [];
              const status = raw.mentorApproved ? 'approved' : (raw.studentReady ? 'ready' : '');
              const checkedCount = topics.filter(t=>t.completed).length;
              const totalTopics = topics.length;
              const progress = totalTopics > 0 ? (checkedCount/totalTopics)*100 : 0;
              return `
              <div class="card card-pad" style="margin-bottom: 20px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                  <div style="font-weight:700; font-size:18px;">${raw.skill}</div>
                  <div>
                    ${status === 'ready' ? '<span class="tag status-progress">Awaiting mentor approval</span>' : ''}
                    ${status === 'approved' ? '<span class="tag status-done">Approved</span>' : ''}
                  </div>
                </div>
                <div style="font-size:13px; color:var(--ink-soft); margin-bottom:12px;">For challenge: ${ch ? ch.title : cid}</div>

                <div class="progress-track" style="margin-bottom:6px;">
                  <div class="progress-fill" style="width:${progress}%"></div>
                </div>
                <div style="font-size:12px; color:var(--ink-faint); margin-bottom:12px;">${checkedCount} of ${totalTopics} topics completed</div>

                <div style="margin-bottom:16px;">
                  <div class="section-title">Topics</div>
                  ${topics.map(t => `
                    <div style="margin-bottom:4px;">
                      <label style="display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" ${t.completed ? 'checked' : ''} disabled />
                        <span style="${t.completed ? 'text-decoration:line-through; color:var(--ink-faint);' : ''}">${t.name}</span>
                      </label>
                    </div>
                  `).join('')}
                </div>

                <div style="margin-bottom:16px;">
                  <div class="section-title">Resources</div>
                  ${resources.map(r => `
                    <div style="display:flex; align-items:center; gap:8px; font-size:13px; margin-bottom:4px;">
                      ${icon(r.type === 'video' ? 'play' : 'file', 14)}
                      <a href="${r.url || '#'}" style="color:var(--accent); text-decoration:none;">${r.title}</a>
                    </div>
                  `).join('')}
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--line-soft); padding-top:12px; margin-top:12px;">
                  <div style="font-size:13px; color:var(--ink-soft);">${icon('clock', 12)} Est. ${raw.estimatedHours} hours</div>
                  <button class="btn btn-primary btn-sm mark-ready-btn" data-skill="${raw.skill}" data-cid="${cid}" ${status ? 'disabled' : ''}>${status ? 'Marked ready' : 'Mark Ready'}</button>
                </div>
              </div>
              `;
            }).join('') : '<div class="empty-state">No learning paths assigned yet.</div>'}
          </div>
          
          <div style="flex: 1; min-width:280px;" class="card">
             <div class="card-pad" style="border-bottom: 1px solid var(--surface-hover);">
               <div style="font-weight:700;">AI Mentor</div>
             </div>
             <div class="chat-container" id="mentor-chat" style="height:400px; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px; background:var(--surface);">
               <div style="background:var(--surface-hover); padding:10px 14px; border-radius:12px; align-self:flex-start; max-width:85%; font-size:14px;">
                 Hi ${firstName ? firstName(me?me.name:'') : (me?me.name:'')}, I'm your AI Mentor. I can help explain topics or guide you through your learning path. What do you need help with?
               </div>
             </div>
             <div class="card-pad" style="border-top: 1px solid var(--surface-hover); display:flex; gap:8px;">
               <input type="text" id="mentor-input" placeholder="Ask a question..." style="flex:1; border:1px solid var(--ink-faint); border-radius:6px; padding:8px;" />
               <button class="btn btn-primary" id="mentor-send">${icon('send', 14)}</button>
             </div>
          </div>
        </div>
      </div>
    `;
  },

  renderProfile(ctx){
    const me = this.currentStudent(ctx);
    if (!me) return `<div class="empty-state">${icon('user',30)}<p>No student profile found for this demo account.</p></div>`;
    return `
      <div class="view-head"><div><h1 class="view-title">Skill profile</h1><p class="view-sub">University mentors and the matching engine use this to place you on the right team.</p></div></div>
      <div class="card card-pad" style="max-width:560px;">
        <div style="display:flex; align-items:center; gap:14px; margin-bottom:18px;">
          <div class="avatar" style="width:52px; height:52px; font-size:18px;">${initials(me.name)}</div>
          <div><div style="font-weight:700; font-size:16px;">${me.name}</div><div style="font-size:12.5px; color:var(--ink-faint);">${me.university}</div></div>
        </div>
        <div class="section-title">Verified skills</div>
        <div class="chip-row" id="skill-chip-row" style="margin-bottom:16px;">
          ${me.skills.map(s=>`<span class="chip">${s}<button data-remove-skill="${s}">${icon('x',10)}</button></span>`).join('')}
        </div>
        <div class="form-row" style="margin-bottom:20px;">
          <input type="text" id="new-skill" placeholder="Add a skill e.g. Data Visualization" />
          <button class="btn btn-secondary" id="add-skill-btn">${icon('plus',14)} Add</button>
        </div>

        ${me.gap.length ? `
          <div class="section-title">Recommended learning (skill gap)</div>
          <div class="chip-row">${me.gap.map(g=>`<span class="chip gap">${icon('bulb',11)} ${g}</span>`).join('')}</div>
          <p style="font-size:12.5px; color:var(--ink-faint); margin-top:8px;">Complete the recommended path and request mentor approval to unlock roles needing these skills.</p>
        ` : ''}
        ${ctx.session.verifiedId && ctx.session.verifiedId.type ? `
          <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--line-soft); display:flex; align-items:center; gap:8px; font-size:13px; color:var(--ok);">
            ${icon('checkCircle',15)} Identity verified via <strong>${ctx.session.verifiedId.type}</strong> — ${ctx.session.verifiedId.value}
          </div>
        ` : ''}

        <div class="card card-pad" style="margin-top:20px; border:2px solid var(--accent-soft); background:linear-gradient(135deg,var(--accent-softer),#fff);">
          <div class="section-title">🎓 NEP 2020 Credits & Credentials</div>
          <div class="nep-credits-card" style="margin-bottom:14px;">
            <div class="nep-credits-number">${me.nepCredits || 0}</div>
            <div class="nep-credits-label">Academic Credits Earned via SETU Projects</div>
          </div>
          ${(me.nepCertificates && me.nepCertificates.length) ? `
            <div style="font-weight:600; font-size:13px; margin-bottom:6px;">Awarded Certificates</div>
            <ul class="nep-cert-list">
              ${me.nepCertificates.map(c => `<li>📄 ${c}</li>`).join('')}
            </ul>
            <button class="btn btn-sm btn-outline" data-download-cert style="margin-top:12px;">📥 Download NEP Certificate</button>
          ` : ''}
        </div>
      </div>
    `;
  },

  bind(view, ctx, refresh){
    const main = document.getElementById('main-view');
    const me = this.currentStudent(ctx);

    main.querySelectorAll('[data-join]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        if (!me) { toast('No student profile found for this demo account.'); return; }
        DB.joinProject(me.name, btn.dataset.join);
        toast('You joined the challenge team.');
        refresh();
      });
    });

    const addSkillBtn = document.getElementById('add-skill-btn');
    if (addSkillBtn){
      addSkillBtn.addEventListener('click', ()=>{
        const input = document.getElementById('new-skill');
        const val = input.value.trim();
        if (!val || !me) return;
        DB.addSkill(me.name, val);
        toast('Skill added to your profile.');
        refresh();
      });
    }

    if (view === 'learning') {
      main.querySelectorAll('.mark-ready-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const cid = e.target.dataset.cid;
          if(DB.markStudentReady) DB.markStudentReady(me.name, cid);
          toast('Marked as ready for approval.');
          refresh();
        });
      });
      const mentorSend = document.getElementById('mentor-send');
      const mentorInput = document.getElementById('mentor-input');
      const chatContainer = document.getElementById('mentor-chat');
      if (mentorSend && mentorInput && chatContainer) {
        mentorSend.addEventListener('click', () => {
          const text = mentorInput.value.trim();
          if (!text) return;
          chatContainer.innerHTML += `<div style="background:var(--accent); color:white; padding:10px 14px; border-radius:12px; align-self:flex-end; max-width:85%; font-size:14px;">${text}</div>`;
          mentorInput.value = '';
          setTimeout(() => {
            chatContainer.innerHTML += `<div style="background:var(--surface-hover); padding:10px 14px; border-radius:12px; align-self:flex-start; max-width:85%; font-size:14px;">That's a great question! Based on your learning path, I recommend checking out the provided video resource to understand this concept better.</div>`;
            chatContainer.scrollTop = chatContainer.scrollHeight;
          }, 800);
        });
      }
    }

    if (view === 'myprojects') {
      main.querySelectorAll('.upload-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const cid = e.currentTarget.dataset.cid;
          const idx = e.currentTarget.dataset.idx;
          if (DB.uploadDeliverable) DB.uploadDeliverable(cid, idx, 'Document.pdf');
          toast('Deliverable uploaded.');
          refresh();
        });
      });
      main.querySelectorAll('.submit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          toast('Submitted for approval.');
          refresh();
        });
      });
    }

    main.querySelectorAll('[data-download-cert]').forEach(btn => {
      btn.addEventListener('click', () => toast('NEP Certificate downloaded!'));
    });
  },
};
