# 🔍 Setu Platform — Feature Audit Report for Developer
**Website:** https://hilarious-travesseiro-5cd21c.netlify.app/  
**Audited Against:** Full 24-Section Feature Specification  
**Date:** September 7, 2026

---

## ⚡ Quick Status Overview

| # | Page / Section | Status | Priority |
|---|---|---|---|
| 0 | Global Header & Navigation | ⚠️ Partial | Medium |
| 1 | Landing / Role Selection | ⚠️ Partial | 🔴 HIGH |
| 2 | Citizen: Report a Problem | ⚠️ Partial | 🔴 HIGH |
| 3 | Citizen: My Reports / Tracking | ⚠️ Partial | Medium |
| 4 | Govt Reviewer Dashboard | ⚠️ Partial | Medium |
| 5 | Cluster Review | ⚠️ Partial | Medium |
| 6 | Innovation Necessity Gate | ✅ Done | — |
| 7 | Prior-Art / Solution Intelligence | ❌ Missing | 🔴 HIGH |
| 8 | University Challenge Marketplace | ⚠️ Partial | Medium |
| 9 | Collaboration Charter | ❌ Missing | 🔴 HIGH |
| 10 | Team Formation + Skill Gap | ❌ Missing | 🔴 HIGH |
| 11 | Learning Path / AI Mentor | ⚠️ Partial | Medium |
| 12 | Project Workspace | ⚠️ Partial | 🔴 HIGH |
| 13 | Maturity / Evidence Gate | ⚠️ Partial | Medium |
| 14 | Industry / CSR Marketplace | ❌ Missing | 🔴 HIGH |
| 15 | Govt / Industry / CSR Route Selection | ❌ Missing | 🔴 HIGH |
| 16 | Local Pilot | ❌ Missing | Medium |
| 17 | Impact Verification | ❌ Missing | Medium |
| 18 | Govt Impact Dashboard | ⚠️ Partial | Medium |
| 19 | Failure / Improvement Loop | ❌ Missing | Medium |
| 20 | Ecosystem Intelligence Graph | ❌ Missing | Low |
| 21 | Notifications | ⚠️ Partial (Stub) | Medium |
| 22 | Profile / Capability Profile | ⚠️ Partial | Low |
| 23 | Admin / System Monitoring | ❌ Missing | Low |

> ✅ Done &nbsp;&nbsp; ⚠️ Partial — some features missing &nbsp;&nbsp; ❌ Missing — page doesn't exist

---

## 📋 Detailed Fix List (Page by Page)

---

### Section 0 — Global Header & Navigation
**Status:** ⚠️ Partial

✅ Working: Logo, role label, notification bell icon, logout button

❌ Fix needed:
- Add nav views for **Faculty Mentor** and **Industry / CSR** roles (currently missing from role switcher)
- Clicking the profile avatar should open a **profile dropdown menu** (Settings, Switch Role, View Profile)

---

### Page 1 — Landing / Role Selection
**Status:** ⚠️ Partial &nbsp; 🔴 HIGH PRIORITY

✅ Working: Login modal with role dropdown

❌ Fix needed — The app goes straight to a login modal. Need a **proper public landing page** before login with:
- Platform logo + project name + tagline + short description
- **8-stage workflow diagram:** `Real Problem → Intelligence → Decision → Learning → Innovation → Validation → Pilot → Impact`
- **7 role selection cards** (Citizen, Govt Reviewer, University, Student, Faculty Mentor, Industry/CSR, Admin) — each card clickable to lead to role-specific login/signup
- Buttons: `Continue`, `Login`, `Sign Up`, `Learn More / How It Works`

---

### Page 2 — Citizen: Report a Problem
**Status:** ⚠️ Partial &nbsp; 🔴 HIGH PRIORITY

✅ Working: Title field, description field, voice recording, image upload, Save Draft button, Submit button

❌ Fix needed:
- **Domain field** with AI auto-suggestion tags (Agriculture, Water, Education, etc.) — currently absent
- **Video upload** button and **supporting document** attachment button
- **GPS location** auto-capture + lat/long display + **interactive map preview**
- **"Time Captured"** auto-fill field
- **Affected People slider** for impact estimate
- **AI validation section** after input (Completeness check, Severity score, Evidence check, Suspicious flag) — show as collapsible panel below form
- **Offline indicator banner** (currently offline Save exists but no visual offline status indicator)

---

### Page 3 — Citizen: My Reports / Tracking
**Status:** ⚠️ Partial

✅ Working: Report list cards, status badges, 6-stage milestone tracker

❌ Fix needed:
- Milestone tracker is a **horizontal modal** — spec requires **vertical inline timeline** with colored dots and a **pulse animation** on the active stage
- Add **"Confirm I Also Face This Problem"** button on each report card
- Add **"View Evidence"**, **"View Location"**, **"View Outcome"** action buttons per report card

---

### Page 4 — Govt / Reviewer Dashboard
**Status:** ⚠️ Partial

✅ Working: KPI cards, Priority Kanban board (High/Med/Low columns)

❌ Fix needed:
- Add **tabular report table** view (alternative to kanban) with columns: Report ID, Title, Domain, Location, Date, Severity, Evidence Status, AI Confidence, Action
- Add **"Run Existing-System Check"** button on each report card
- Add **GIS map panel** showing geographic distribution of incoming reports

---

### Page 5 — Cluster Review
**Status:** ⚠️ Partial

✅ Working: Cluster cards by domain, Merge / Split / Reject buttons

❌ Fix needed:
- Add **split-view layout**: interactive GIS map on the LEFT showing report pins + cluster boundary, cluster detail panel on the RIGHT
- Show **similarity score %**, **location proximity**, **time pattern**, and **root-cause signals** on each cluster card
- Add **"I Also Face This Problem"** community count per cluster
- Allow selecting individual reports within a cluster to view/remove them

---

### Page 6 — Innovation Necessity Gate ✅ FULLY DONE
No action needed. This is the most complete screen.

---

### Page 7 — Prior-Art / Solution Intelligence
**Status:** ❌ MISSING &nbsp; 🔴 HIGH PRIORITY

Need to **build this page from scratch:**
- Search bar with keywords, domain filter
- Query sources: Govt scheme repos, past SIH projects, institutional project repos, validated solution archive
- **Solution result cards**: Name, Source, Description, Relevance score, Similarity %, Evidence/reference, Location applicability
- Action buttons per card: `View Solution`, `Reuse`, `Adapt`, `Integrate`, `Not Applicable — Proceed as New Challenge`
- **Unmet Requirement section** (shown when no solution matches): Existing solution → Why it doesn't fit → Missing capability → New challenge definition form

---

### Page 8 — University: Challenge Marketplace
**Status:** ⚠️ Partial

✅ Working: AI-matched challenge cards with match %, skill tags, Opt-in button

❌ Fix needed:
- Add **filter bar** at top: Domain, District, Required Capability, Match Score range, Status
- Add **"View Match Details"** breakdown popover on each card
- Add **"Start Collaboration Charter"** button on claimed challenges
- Add **University Capability Sidebar**: Departments, Faculty expertise, Labs, Equipment, Student skill pools, Verified capacity, Last Verified Date

---

### Page 9 — Collaboration Charter
**Status:** ❌ MISSING &nbsp; 🔴 HIGH PRIORITY

Need to **build this page/modal from scratch:**
- Lead university + University Nodal Officer fields
- Add/Remove partner institutions
- Roles & Responsibilities section (Institution / Faculty / Student / Industry)
- Faculty mentor picker (Lead + Partner mentors)
- **IP Template selector**: Case A, Case B, Case C, Case D (dropdown/radio)
- Funding source picker: Government / Industry / CSR / University / Other
- Milestone ownership + Verification authority assignment table
- Buttons: `Add Institution`, `Add Mentor`, `Assign Role`, `Save Charter`, `Review Charter`, `Create Project Workspace`

---

### Page 10 — Team Formation + Skill Gap
**Status:** ❌ MISSING &nbsp; 🔴 HIGH PRIORITY

Need to **build this page from scratch:**
- Required roles list (AI/ML, IoT/ECE, Civil, Backend, Frontend, Data, Research, Testing)
- Per role: student candidate list ranked by **Skill-Fit Score** — show Student Name, Institution, Skills, Experience, Past Projects, Current Workload
- **Non-blocking Skill Gap Card** — if student is missing a skill: show Current Skills vs Required Skills → Recommended Learning Path → `Request Mentor Approval` button
- ⚠️ **Important rule:** A skill gap should NOT block role assignment. Flow = Skill Gap → Learning Path → Mentor Approval → Assignment
- Buttons per student: `View Student`, `Assign Role`, `Recommend Learning`, `View Learning Path`, `Approve Readiness`

---

### Page 11 — Learning Path / AI Mentor
**Status:** ⚠️ Partial

✅ Working: Skill tags on student profiles, basic skill manager tab

❌ Fix needed:
- Build a **dedicated Learning Path view** per student per challenge: Topics list, curated Resources, Estimated completion time
- Add **"Ask AI Mentor"** chat widget (can be a simple text input + simulated response)
- Add **Mentor approval flow**: `Mark Ready` (student) → `Approve Role` (mentor)

---

### Page 12 — Project Workspace
**Status:** ⚠️ Partial &nbsp; 🔴 HIGH PRIORITY

✅ Working: Project list, 4-stage milestone stepper (Plan/Prototype/Pilot/Deployed), team member list

❌ Fix needed:
- Each **milestone card** must show: Deliverable, Deadline, Owner, Evidence, **Funding %**, **Equity/IP %**, Approval Status, Delay badge
- Add **student-role actions**: `Upload Deliverable`, `Upload Evidence`, `Submit for Approval`
- Add **mentor-role actions**: `Review`, `Approve`, `Reject / Request Changes`, `Unlock Next Stage`
- Add **system actions**: `Calculate Funding Release`, `Calculate Equity/IP Release`, `Update Status`
- Funding workflow display: `Milestone Complete → Evidence → Faculty Verification → Govt/Industry Approval → Funding Release → Next Milestone`
- Status badges per milestone: `Locked`, `In Progress`, `Submitted`, `Approved`, `Delayed`, `Pilot Ready`, `Completed`

---

### Page 13 — Maturity / Evidence Gate
**Status:** ⚠️ Partial

✅ Working: Milestone stepper includes Pilot and Deployed states

❌ Fix needed:
- Build a **dedicated Maturity Gate screen** (accessible from Project Workspace)
- **Evidence checklist** with categories: Technical Evidence, Test Reports, Mentor Verification, Field Evidence, User Feedback, Reliability
- File upload area per checklist item
- Maturity level tags: `Prototype`, `Tested`, `Pilot Ready`, `Deployed`
- Buttons: `Upload Evidence`, `Review Evidence`, `Approve`, `Request More Evidence`, `Mark Pilot Ready`, `Reject / Improve`

---

### Page 14 — Industry / CSR Marketplace
**Status:** ❌ MISSING &nbsp; 🔴 HIGH PRIORITY

Need to **build this page from scratch:**
- Filter bar: Domain, District, Maturity Level, Project Stage, Partnership Type
- **Proposal cards** (only show Pilot Ready / Deployed projects): Project name, Problem, Solution summary, Domain, Location, Maturity tag, Impact info, Required support type, University + Team info
- Maturity badges on cards: `Prototype`, `Tested`, `Pilot Ready`, `Deployed`
- Action buttons: `View Project`, `Express Interest`, `Direct Connect`, `Partner`, `Fund`, `Pilot`, `Adopt`, `Co-develop`
- Industry support types chip selector: API, Hardware, Cloud, Dataset, Mentoring, Testing, Funding, Pilot Access, Adoption, Tech Transfer

---

### Page 15 — Govt / Industry / CSR Route Selection
**Status:** ❌ MISSING &nbsp; 🔴 HIGH PRIORITY

Need to **build this page/modal from scratch** — appears after Maturity Gate:
- Header: "Choose Deployment Route"
- **3 large route selection cards:**
  1. **GOVERNMENT — Deploy** → button: `Route to Government`
  2. **INDUSTRY — Adopt / Co-develop / Pilot** → buttons: `Express Interest`, `Partner`, `Pilot`
  3. **CSR — Fund / Support Impact** → buttons: `Request CSR Support`, `Fund Project`, `Support Impact`
- Route status display: Selected Route, Responsible Organization, Contact, Deployment Status

---

### Page 16 — Local Pilot
**Status:** ❌ MISSING

Need to **build this page from scratch:**
- Pilot details: Location, Local Authority, Field Partner, Duration, Target Beneficiaries
- Local constraints section: Infrastructure, Connectivity, Language, Climate, Regulations, Cost, Culture
- Local Adaptation checklist
- Pilot progress stepper: `Planned` → `Started` → `In Progress` → `Completed`
- Buttons: `Start Pilot`, `Upload Pilot Evidence`, `Update Progress`, `Complete Pilot`, `Request Re-test`

---

### Page 17 — Impact Verification
**Status:** ❌ MISSING

Need to **build this page from scratch:**
- Impact Claim form (e.g., "5,000 beneficiaries")
- Evidence upload section: Deployment records, Survey data, Usage data, Photos, Reports
- Verification panel (Government + Field Partner + Platform evidence sign-off)
- **6 Impact Dimension scorecards**: Reach, Severity, Adoption, Effectiveness, Scalability, Sustainability
- Status flow display: `Claim Submitted` → `Evidence Uploaded` → `Under Verification` → `Verified Impact`
- Buttons: `Submit Impact Claim`, `Upload Evidence`, `Verify`, `Reject Evidence`, `Mark Verified Impact`

---

### Page 18 — Govt Impact Dashboard
**Status:** ⚠️ Partial

✅ Working: KPI cards, domain bar chart

❌ Fix needed:
- Add **interactive district-level heat map** showing problem concentration, active projects, pilots, and verified impact
- Add **completion rate trend chart** and projects-by-stage breakdown chart
- Add per-project action row: `Upload Evidence`, `View Impact`, `Verify Impact`
- Additional KPI cards needed: Gate Pass Rate, Deployments, Patents/Startups, Verified Beneficiaries
- Filters: District, Domain, Date Range

---

### Page 19 — Failure / Improvement Loop
**Status:** ❌ MISSING

Need to **build this page from scratch** — triggered from a completed/failed pilot:
- Central question: **"Did the pilot work?"** (Yes/No toggle or two large buttons)
- **YES path:** `Pilot Successful` → `Deploy` → `Measure Impact` → `Reuse / Scale` buttons
- **NO path:** `Pilot Failed` → `Analyze Root Cause` → `Create Improvement Plan` → `Re-match Capabilities` → `Re-test` → `Start New Pilot` buttons

---

### Page 20 — Ecosystem Intelligence Graph
**Status:** ❌ MISSING

Need to **build this page from scratch** (can be data-visualization heavy, lower priority for MVP):
- **6 network/graph panels** with domain/district/university filters:
  1. Problem Graph (recurring problems, location, severity)
  2. Capability Graph (universities, faculty, infrastructure)
  3. Talent Graph (verified skills, student contributions)
  4. Solution Graph (research, prototypes, pilots, deployments)
  5. Industry Graph (capabilities, interests, partnerships)
  6. Impact Graph (what worked, where, verified impact)

---

### Page 21 — Notifications
**Status:** ⚠️ Partial (Stub)

✅ Working: Bell icon in header

❌ Fix needed:
- Bell click should open a **notification drawer/panel** — currently no panel appears
- Show role-specific event messages (see notification types per role in spec)
- Each notification needs: timestamp, event message, `View` button, `Mark Read` button
- Add **"Mark All Read"** button at top of panel

---

### Page 22 — Profile / Capability Profile
**Status:** ⚠️ Partial

✅ Working: University capability tag manager, student skill tag manager

❌ Fix needed:
- Add **Citizen profile view** (Name, My Reports count, Location preferences)
- Add **Faculty profile** (Expertise, Projects, Mentorship capacity)
- Add **Industry profile** (Industry type, Capabilities, Partnership history, Support types)
- Add **Last Verified Date** tag on university capability profile (important for match confidence scoring)
- Add `Edit Profile`, `Update Skills`, `Verify Profile` buttons

---

### Page 23 — Admin / System Monitoring
**Status:** ❌ MISSING (Low Priority for MVP)

Need to **build this page from scratch:**
- System stats dashboard: Total Users, Reports, Challenges, Universities, Students, Mentors, Industry Partners, Projects, Pilots, Deployments
- Live API status + AI call log + Firestore health indicators
- Role & permission management table
- Audit log viewer with filters
- Privacy controls panel
- Buttons: `Manage Users`, `Manage Roles`, `View Audit Logs`, `Review Flags`, `System Settings`

---

## 🎯 Summary: What's Done vs What's Needed

| Category | Count |
|---|---|
| ✅ Fully Implemented | **1 page** (Innovation Necessity Gate) |
| ⚠️ Partially Implemented — needs fixes | **12 pages** |
| ❌ Missing — needs to be built from scratch | **11 pages** |

### 🔴 Build These First (Critical Path / Demo Blockers)
1. **Page 1** — Public Landing Page with role cards & workflow diagram
2. **Page 7** — Prior-Art / Solution Intelligence
3. **Page 9** — Collaboration Charter modal
4. **Page 10** — Team Formation + Skill Gap
5. **Page 12** — Complete Project Workspace (milestone funding %, evidence upload, mentor actions)
6. **Page 14** — Industry / CSR Marketplace
7. **Page 15** — Deployment Route Selection (Govt / Industry / CSR)

### 🟡 Fix These Next (Core UX Completeness)
- Page 2: GPS/map, AI domain suggestion, video upload, affected people slider
- Page 3: Vertical timeline with pulse, "I Also Face This" button
- Page 5: Map split view, similarity scores on clusters
- Page 21: Working notification drawer with role-specific events

### 🟢 Lower Priority / Post-MVP
- Page 16: Local Pilot tracking
- Page 17: Impact Verification pipeline
- Page 19: Failure / Improvement Loop
- Page 20: Ecosystem Intelligence Graph
- Page 23: Admin System Monitoring

---

*Report generated by automated feature audit · Setu Platform · September 7, 2026*
