/* ============================================================
   SETU — Data layer (mock backend, persisted to localStorage)
   Replace this file's functions with real API calls when you
   wire up FastAPI/Firebase — the render files never touch
   localStorage directly, only these DB.* helpers.
   ============================================================ */

const STORE_KEY = "setu_platform_v1";

const ROLE_LABELS = {
  citizen: 'Citizen',
  government: 'Government / Reviewer',
  university: 'University',
  student: 'Student',
  industry: 'Industry Partner',
  admin: 'Admin',
};

// Which government official is responsible, escalating up the standard
// revenue-administration hierarchy as a report/project gets more serious —
// shown on the Government dashboard so reviewers know who owns it.
//   Village Officer  → single, hyperlocal, low-priority report
//   Tahsildar        → tahsil/block-level issue, medium priority, or an
//                       early-stage (Concept) university project
//   Sub-Collector (SDM) → sub-division-wide, high-priority issue, or a
//                       project that has reached Prototype stage
//   District Collector → large multi-report cluster, or a project that has
//                       reached Pilot-Ready — needs district-level sign-off
const OFFICIAL_BY_PRIORITY = {
  Low: "Village Officer",
  Medium: "Tahsildar",
  High: "Sub-Collector (SDM)",
};
const OFFICIAL_BY_MATURITY = {
  Concept: "Tahsildar",
  Prototype: "Sub-Collector (SDM)",
  "Pilot-Ready": "District Collector",
};
const DEFAULT_OFFICIAL = "Tahsildar";

// Named person behind each office (demo roster — replace with the real
// directory / HRMS lookup when a backend is wired up).
const OFFICIAL_NAMES = {
  "Village Officer": "Sunita Devi",
  "Tahsildar": "Rakesh Prasad",
  "Sub-Collector (SDM)": "Anil Kumar Tirkey",
  "District Collector": "Vandana Mahto",
};

// Default explanation shown next to the responsible person when a report is
// past its due date. A report can override it with its own `delayReason`.
const REPORT_DELAY_REASONS = {
  1: "Site verification not done yet — field team has not visited the location.",
  2: "Verified, but no university team has claimed the challenge yet.",
  3: "Team assigned, but waiting for budget / permission approvals.",
  4: "Prototype development is taking longer than planned.",
  5: "Pilot waiting for local-body clearance and community scheduling.",
};
const DEFAULT_REPORT_DELAY_REASON = "Pending action from the responsible office.";

// ------------------------------------------------------------------
// Authority replies ("not my fault" / explanation column).
// An authority who is shown as delayed can answer in public with one of
// these reasons plus a free-text note. The reply NEVER hides the delay —
// both are shown side by side so citizens can judge for themselves.
// ------------------------------------------------------------------
const REPLY_KINDS = {
  sick_leave:      { label: "On sick leave",                         needsSubstitute: false },
  out_of_station:  { label: "Out of station / emergency",            needsSubstitute: false },
  not_in_position: { label: "Not in this position at present",       needsSubstitute: false },
  temp_charge:     { label: "Someone else holds temporary charge",   needsSubstitute: true  },
  other:           { label: "Other — not my fault (explained below)", needsSubstitute: false },
};

const JHARKHAND_DEPARTMENTS = [
  {id:'DEPT-01',name:'Dept of Drinking Water & Sanitation',shortName:'DWS',head:'Secretary, DWS',phone:'0651-2400001',domains:['Water'],email:'dws@jharkhand.gov.in'},
  {id:'DEPT-02',name:'Dept of Rural Development',shortName:'RDD',head:'Secretary, RDD',phone:'0651-2400002',domains:['Infrastructure','Water'],email:'rdd@jharkhand.gov.in'},
  {id:'DEPT-03',name:'Dept of Agriculture, Animal Husbandry & Co-operative',shortName:'AGRI',head:'Secretary, Agriculture',phone:'0651-2400003',domains:['Agriculture'],email:'agri@jharkhand.gov.in'},
  {id:'DEPT-04',name:'Dept of Health, Medical Education & Family Welfare',shortName:'HEALTH',head:'Secretary, Health',phone:'0651-2400004',domains:['Health'],email:'health@jharkhand.gov.in'},
  {id:'DEPT-05',name:'Dept of Urban Development & Housing',shortName:'UDH',head:'Secretary, UDH',phone:'0651-2400005',domains:['Infrastructure','Water'],email:'udh@jharkhand.gov.in'},
  {id:'DEPT-06',name:'Dept of Road Construction',shortName:'RCD',head:'Secretary, RCD',phone:'0651-2400006',domains:['Infrastructure'],email:'rcd@jharkhand.gov.in'},
  {id:'DEPT-07',name:'Dept of Energy',shortName:'ENERGY',head:'Secretary, Energy',phone:'0651-2400007',domains:['Infrastructure'],email:'energy@jharkhand.gov.in'},
  {id:'DEPT-08',name:'Dept of Water Resources',shortName:'WRD',head:'Secretary, WRD',phone:'0651-2400008',domains:['Water'],email:'wrd@jharkhand.gov.in'},
  {id:'DEPT-09',name:'Dept of School Education & Literacy',shortName:'SCHOOLEDU',head:'Secretary, School Education',phone:'0651-2400009',domains:['Education'],email:'schooledu@jharkhand.gov.in'},
  {id:'DEPT-10',name:'Dept of Higher & Technical Education',shortName:'HTE',head:'Secretary, HTE',phone:'0651-2400010',domains:['Education'],email:'hte@jharkhand.gov.in'},
  {id:'DEPT-11',name:'Dept of Forest, Environment & Climate Change',shortName:'FOREST',head:'Secretary, Forest',phone:'0651-2400011',domains:['Environment'],email:'forest@jharkhand.gov.in'},
  {id:'DEPT-12',name:'Dept of Industries',shortName:'IND',head:'Secretary, Industries',phone:'0651-2400012',domains:['Other'],email:'industries@jharkhand.gov.in'},
  {id:'DEPT-13',name:'Dept of Mines & Geology',shortName:'MINES',head:'Secretary, Mines',phone:'0651-2400013',domains:['Environment'],email:'mines@jharkhand.gov.in'},
  {id:'DEPT-14',name:'Dept of Labour, Employment, Training & Skill Development',shortName:'LABOUR',head:'Secretary, Labour',phone:'0651-2400014',domains:['Education','Other'],email:'labour@jharkhand.gov.in'},
  {id:'DEPT-15',name:'Dept of Social Welfare, Women & Child Development',shortName:'SWD',head:'Secretary, SWD',phone:'0651-2400015',domains:['Health','Education'],email:'swd@jharkhand.gov.in'},
  {id:'DEPT-16',name:'Dept of Planning & Development',shortName:'PLAN',head:'Secretary, Planning',phone:'0651-2400016',domains:['Other'],email:'planning@jharkhand.gov.in'},
  {id:'DEPT-17',name:'Dept of Finance',shortName:'FIN',head:'Secretary, Finance',phone:'0651-2400017',domains:['Other'],email:'finance@jharkhand.gov.in'},
  {id:'DEPT-18',name:'Dept of Revenue & Land Reforms',shortName:'REV',head:'Secretary, Revenue',phone:'0651-2400018',domains:['Other'],email:'revenue@jharkhand.gov.in'},
  {id:'DEPT-19',name:'Dept of Home, Jail & Disaster Management',shortName:'HOME',head:'Secretary, Home',phone:'0651-2400019',domains:['Other'],email:'home@jharkhand.gov.in'},
  {id:'DEPT-20',name:'Dept of Food, Public Distribution & Consumer Affairs',shortName:'FOOD',head:'Secretary, Food',phone:'0651-2400020',domains:['Health','Other'],email:'food@jharkhand.gov.in'},
  {id:'DEPT-21',name:'Dept of Transport',shortName:'TRANS',head:'Secretary, Transport',phone:'0651-2400021',domains:['Infrastructure'],email:'transport@jharkhand.gov.in'},
  {id:'DEPT-22',name:'Dept of IT & e-Governance',shortName:'IT',head:'Secretary, IT',phone:'0651-2400022',domains:['Other'],email:'it@jharkhand.gov.in'},
  {id:'DEPT-23',name:'Dept of Tourism, Art, Culture, Sports & Youth Affairs',shortName:'TOURISM',head:'Secretary, Tourism',phone:'0651-2400023',domains:['Other'],email:'tourism@jharkhand.gov.in'},
  {id:'DEPT-24',name:'Dept of Panchayati Raj',shortName:'PR',head:'Secretary, Panchayati Raj',phone:'0651-2400024',domains:['Infrastructure','Water'],email:'pr@jharkhand.gov.in'},
  {id:'DEPT-25',name:'Dept of Science & Technology',shortName:'DST',head:'Secretary, S&T',phone:'0651-2400025',domains:['Education','Other'],email:'dst@jharkhand.gov.in'},
  {id:'DEPT-26',name:'Dept of Tribal Welfare',shortName:'TRIBAL',head:'Secretary, Tribal Welfare',phone:'0651-2400026',domains:['Education','Health'],email:'tribal@jharkhand.gov.in'},
  {id:'DEPT-27',name:'Dept of Building Construction',shortName:'BCD',head:'Secretary, BCD',phone:'0651-2400027',domains:['Infrastructure'],email:'bcd@jharkhand.gov.in'}
];

const DOMAIN_DEPT_MAP = {
  'Water':          ['DEPT-01','DEPT-08','DEPT-05','DEPT-02'],
  'Infrastructure': ['DEPT-06','DEPT-05','DEPT-02','DEPT-27','DEPT-21'],
  'Agriculture':    ['DEPT-03','DEPT-02'],
  'Education':      ['DEPT-09','DEPT-10','DEPT-14'],
  'Health':         ['DEPT-04','DEPT-15','DEPT-20'],
  'Environment':    ['DEPT-11','DEPT-13'],
  'Other':          ['DEPT-12','DEPT-16','DEPT-22']
};

const SOLUTION_LIBRARY = [
  {id:'SOL-01',title:'Solar-Powered Water Purification Unit',domain:'Water',description:'Compact solar-powered RO unit designed for rural Jharkhand. Serves 500 households at ₹0.10/litre.',source:'IIT (ISM) Dhanbad Pilot 2025',status:'Deployed',district:'Dhanbad',impact:'2,400 households served',tags:['solar','purification','rural'],fundingModel:'CSR + State Grant',cost:'₹8.5 Lakh'},
  {id:'SOL-02',title:'AI Pothole Detection from Dashcam Feed',domain:'Infrastructure',description:'ML model that identifies and classifies road damage severity from vehicle dashcam footage in real-time.',source:'SIH 2024 Winner — Team RoadGuard',status:'Pilot',district:'Ranchi',impact:'14 km road surveyed',tags:['AI','roads','computer-vision'],fundingModel:'Government Budget',cost:'₹2.1 Lakh'},
  {id:'SOL-03',title:'Crop Disease Alert System via SMS',domain:'Agriculture',description:'Phone-camera based leaf disease detection with SMS alerts for farmers without smartphones. Works offline.',source:'BIT Mesra Research Lab',status:'Pilot-Ready',district:'Khunti',impact:'500 farmers in trial',tags:['SMS','agriculture','offline'],fundingModel:'CSR',cost:'₹4.2 Lakh'},
  {id:'SOL-04',title:'Community Health Worker Tracking App',domain:'Health',description:'GPS-enabled attendance and visit tracking for ASHA workers with offline sync capability.',source:'NIT Jamshedpur Capstone',status:'Prototype',district:'Gumla',impact:'Proof of concept',tags:['health','mobile','GPS'],fundingModel:'Government Grant',cost:'₹1.8 Lakh'},
  {id:'SOL-05',title:'Smart Streetlight Controller with Fault Alert',domain:'Infrastructure',description:'IoT-based controller that detects bulb failure and auto-reports to municipal dashboard.',source:'SIH 2024 — Smart City Track',status:'Deployed',district:'Ranchi',impact:'340 streetlights monitored',tags:['IoT','streetlight','smart-city'],fundingModel:'Municipal Budget',cost:'₹12 Lakh'},
  {id:'SOL-06',title:'Rainwater Harvesting Design Toolkit',domain:'Water',description:'Open-source parametric design tool for community rainwater harvesting systems, customized for Jharkhand terrain.',source:'Ranchi University Civil Dept',status:'Available',district:'Ranchi',impact:'15 systems installed',tags:['rainwater','design','open-source'],fundingModel:'Self-funded',cost:'₹3.5 Lakh per unit'},
  {id:'SOL-07',title:'Tribal Language E-Learning Module',domain:'Education',description:'Interactive learning app with content in Mundari, Santhali, Ho, and Khortha for primary school students.',source:'Jharkhand Rai University',status:'Prototype',district:'Simdega',impact:'Prototype tested with 120 students',tags:['education','tribal','e-learning'],fundingModel:'NGO + University',cost:'₹5.6 Lakh'},
  {id:'SOL-08',title:'Fluoride Removal Filter for Hand Pumps',domain:'Water',description:'Low-cost activated alumina filter attachment for existing hand pumps in fluoride-affected areas.',source:'UNICEF Jharkhand + IIT(ISM)',status:'Deployed',district:'Palamu',impact:'80 hand pumps fitted',tags:['fluoride','filter','hand-pump'],fundingModel:'UNICEF + State',cost:'₹0.45 Lakh per unit'}
];

// ------------------------------------------------------------------
// Industry / CSR collaboration vocabulary
// ------------------------------------------------------------------
const SUPPORT_TYPES = {
  MENTORSHIP:       { label: "Technical mentorship",   desc: "Industry experts guide the student team" },
  TESTING_FACILITY: { label: "Testing lab access",     desc: "Certify prototypes in your testing facility" },
  EQUIPMENT:        { label: "Hardware & materials",   desc: "Sponsor sensors, panels, controllers, test rigs" },
  FUNDING:          { label: "CSR grant / funding",    desc: "Financial support for pilot and scale-up" },
  PILOT_SITE:       { label: "Field pilot site",       desc: "Offer a plant, farm or site for the pilot" },
  TECH_TRANSFER:    { label: "Tech transfer / licence", desc: "Take the solution to manufacturing" },
};
const PARTNER_TYPES = {
  INDUSTRY: "Large industry", CSR_FOUNDATION: "CSR foundation", STARTUP: "Deep-tech startup", MSME: "Local MSME",
};
const CSR_FOCUS_DOMAINS = ["Water", "Agriculture", "Health", "Education", "Infrastructure", "Environment"];

// ------------------------------------------------------------------
// Location resolution — turns a coarse "area" string (or a captured
// GPS point) into a precise, map-ready coordinate + human address.
// Real GPS captures (from the report form) are used as-is; older /
// seeded reports only have a locality name, so we resolve those to a
// real-world anchor point for that locality and add a small, per-report
// deterministic offset so reports in the same ward don't all stack on
// exactly one pixel — a stand-in for what a real geocoding service
// would return.
// ------------------------------------------------------------------
const AREA_ANCHORS = [
  { match: /ward\s*6/i, lat: 23.3665, lng: 85.3350, label: "Ward 6, Ranchi" },
  { match: /ward\s*3/i, lat: 23.3801, lng: 85.3247, label: "Ward 3, Ranchi" },
  { match: /ward\s*9/i, lat: 23.3556, lng: 85.3444, label: "Ward 9, Ranchi" },
  { match: /bariatu/i, lat: 23.3841, lng: 85.3298, label: "Bariatu, Ranchi" },
  { match: /khunti/i, lat: 23.0734, lng: 85.2779, label: "Khunti District" },
  { match: /ranchi/i, lat: 23.3441, lng: 85.3096, label: "Ranchi" },
  { match: /dhanbad/i, lat: 23.7957, lng: 86.4304, label: 'Dhanbad' },
  { match: /bokaro/i, lat: 23.6693, lng: 86.1511, label: 'Bokaro' },
  { match: /jamshedpur|east.?singhbhum/i, lat: 22.8046, lng: 86.2029, label: 'East Singhbhum' },
  { match: /hazaribagh/i, lat: 23.9966, lng: 85.3619, label: 'Hazaribagh' },
  { match: /deoghar/i, lat: 24.4764, lng: 86.6944, label: 'Deoghar' },
  { match: /giridih/i, lat: 24.1851, lng: 86.3007, label: 'Giridih' },
  { match: /dumka/i, lat: 24.2651, lng: 87.2500, label: 'Dumka' },
  { match: /palamu/i, lat: 24.0271, lng: 84.0524, label: 'Palamu' },
  { match: /garhwa/i, lat: 24.1846, lng: 83.7942, label: 'Garhwa' },
  { match: /chatra/i, lat: 24.2053, lng: 84.8710, label: 'Chatra' },
  { match: /koderma/i, lat: 24.4675, lng: 85.5935, label: 'Koderma' },
  { match: /gumla/i, lat: 23.0438, lng: 84.5410, label: 'Gumla' },
  { match: /simdega/i, lat: 22.6156, lng: 84.5097, label: 'Simdega' },
  { match: /lohardaga/i, lat: 23.4355, lng: 84.6832, label: 'Lohardaga' },
  { match: /west.?singhbhum/i, lat: 22.5732, lng: 85.8281, label: 'West Singhbhum' },
  { match: /seraikela|kharsawan/i, lat: 22.6907, lng: 86.0841, label: 'Seraikela-Kharsawan' },
  { match: /ramgarh/i, lat: 23.6305, lng: 85.5259, label: 'Ramgarh' },
  { match: /latehar/i, lat: 23.7406, lng: 84.4983, label: 'Latehar' },
  { match: /jamtara/i, lat: 23.9585, lng: 86.8014, label: 'Jamtara' },
  { match: /pakur/i, lat: 24.6341, lng: 87.8458, label: 'Pakur' },
  { match: /sahebganj/i, lat: 25.2424, lng: 87.6371, label: 'Sahebganj' },
  { match: /godda/i, lat: 24.8271, lng: 87.2124, label: 'Godda' },
  { match: /jharkhand/i, lat: 23.6102, lng: 85.2799, label: "Jharkhand" },
];
function anchorForArea(area = "") {
  return AREA_ANCHORS.find((a) => a.match.test(area)) || { lat: 23.3441, lng: 85.3096, label: area || "Jharkhand" };
}
// Small deterministic hash so the same report always resolves to the
// same "precise" pin instead of jumping around on every re-render.
function hashStr(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
const STREET_NAMES = [
  "Main Road", "Church Road", "Circular Road", "Kutchery Road", "Station Road",
  "Bank Colony Lane", "Harmu Bypass", "Old Ranchi Road", "Panch Mandir Marg", "Doranda Road",
];
const DB_LOCATION = {
  // Best-known location for a report: real captured GPS if we have it,
  // otherwise a resolved locality anchor + a deterministic micro-offset.
  resolve(report) {
    if (report && report.location && typeof report.location.lat === "number" && (report.location.lat !== 0 || report.location.lng !== 0)) {
      return { lat: report.location.lat, lng: report.location.lng, precise: true, source: "Device GPS captured at time of report" };
    }
    const anchor = anchorForArea(report ? report.area : "");
    const h = hashStr((report && (report.id || report.title)) || "x");
    // Offset within roughly a 400m box around the locality anchor.
    const dLat = (((h % 1000) / 1000) - 0.5) * 0.006;
    const dLng = ((((h >> 5) % 1000) / 1000) - 0.5) * 0.006;
    const street = STREET_NAMES[h % STREET_NAMES.length];
    return {
      lat: anchor.lat + dLat,
      lng: anchor.lng + dLng,
      precise: false,
      source: "AI-estimated from reported locality (no device GPS on file)",
      streetGuess: street,
    };
  },
};

// ------------------------------------------------------------------
// AI spam / suspicious-report detection.
// Runs on every new citizen submission and scores it 0-100 for risk.
// This is a lightweight heuristic model standing in for a real
// text-classification service — swap `scoreReport` for an API call to
// a trained model and keep the same {score, reasons} return shape.
// ------------------------------------------------------------------
const SPAM_KEYWORDS = [
  "lottery", "winner", "click here", "click this link", "free money", "cash prize",
  "http://", "https://", "www.", "bit.ly", "whatsapp me", "call now for", "投注", "casino",
  "loan approved", "crypto", "bitcoin", "work from home", "earn ₹", "earn rs",
  "congratulations you", "claim your", "viagra", "act now",
];
function scoreReportForSpam(report) {
  const reasons = [];
  let score = 0;
  const title = (report.title || "").trim();
  const desc = (report.desc || "").trim();
  const text = (title + " " + desc).toLowerCase();

  // 1. Promotional / phishing language
  const hitKeyword = SPAM_KEYWORDS.find((k) => text.includes(k));
  if (hitKeyword) { score += 45; reasons.push("Contains promotional/phishing language typical of spam"); }

  // 2. Too little substance to be a real civic report
  if (desc.length > 0 && desc.length < 12) { score += 25; reasons.push("Description is too short to describe a real problem"); }
  if (title.length < 6) { score += 10; reasons.push("Title is unusually short"); }

  // 3. Gibberish / keyboard-mashing detection (long runs with few real vowels)
  const letters = text.replace(/[^a-z]/g, "");
  if (letters.length >= 8) {
    const vowels = (letters.match(/[aeiou]/g) || []).length;
    if (vowels / letters.length < 0.18) { score += 30; reasons.push("Text pattern looks like random characters, not a description"); }
  }

  // 4. Excessive repetition / shouting
  if (/(.)\1{4,}/.test(text)) { score += 20; reasons.push("Repeated-character spam pattern detected"); }
  const letterOnlyTitle = title.replace(/[^A-Za-z]/g, "");
  if (letterOnlyTitle.length > 8 && letterOnlyTitle === letterOnlyTitle.toUpperCase()) { score += 10; reasons.push("Title is in all caps"); }

  // 5. No evidence at all (no photo, no location, no voice note) is a weaker
  //    signal on its own, but stacks with anything else above.
  if (!report.hasPhoto && !report.hasLocation && !report.hasAudio) { score += 12; reasons.push("No photo, location or voice note attached as evidence"); }

  return { score: Math.min(score, 100), reasons };
}
function classifyReportSpam(report) {
  const { score, reasons } = scoreReportForSpam(report);
  return {
    spam: score >= 55,
    aiConfidence: score,
    spamReasons: reasons,
  };
}

const DOMAIN_IMAGES = {
  Water: [
    "https://images.unsplash.com/photo-1527066236128-2ff79f7b9705?q=80&w=1176&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/vector-1747371435265-f56fa411e5f5?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8d2F0ZXJ8ZW58MHx8MHx8fDA%3D",
    "https://plus.unsplash.com/premium_vector-1721648761219-562e9176297b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjF8fHdhdGVyfGVufDB8fDB8fHww",
  ],
  Infrastructure: [
    "https://images.unsplash.com/photo-1529926691761-20fb82067c71?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1465447142348-e9952c393450?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjd8fGluZnJhc3RydWN0dXJlfGVufDB8fDB8fHww",
    "https://plus.unsplash.com/premium_photo-1685214899734-c32964fd5c42?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mzd8fGluZnJhc3RydWN0dXJlfGVufDB8fDB8fHww",
  ],
  Agriculture: [
    "https://plus.unsplash.com/premium_photo-1661962692059-55d5a4319814?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    "https://images.unsplash.com/photo-1656407410275-e63e689bcd90?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGFncmljdWx0dXJlfGVufDB8fDB8fHww",
    "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YWdyaWN1bHR1cmV8ZW58MHx8MHx8fDA%3D",
  ],
  Education: [
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZWR1Y2F0aW9ufGVufDB8fDB8fHww",
    "https://media.istockphoto.com/id/1422516934/photo/rear-view-of-middle-school-students-studying-in-classroom.webp?a=1&b=1&s=612x612&w=0&k=20&c=nHr03034c2-1DFa09MYqdOJ8QlARTOg-PUvjQ21ZTT4=",
    "https://images.unsplash.com/photo-1588607327673-83b8f3791d6a?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZWR1Y2FpdG9ufGVufDB8fDB8fHww",
  ],
  Health: [
    "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8aGVhbHRoY2FyZXxlbnwwfHwwfHx8MA%3D%3D",
    "https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTl8fGhlYWx0aHxlbnwwfHwwfHx8MA%3D%3D",
    "https://plus.unsplash.com/premium_photo-1673953509975-576678fa6710?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8aGVhbHRofGVufDB8fDB8fHww",
  ],
  Environment: [
    "https://images.unsplash.com/reserve/bOvf94dPRxWu0u3QsPjF_tree.jpg?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dHJlZXN8ZW58MHx8MHx8fDA%3D",
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=900&q=80",
  ],
  Other: [
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=900&q=80",
  ],
};

function getSvgFallback(domain = "Other") {
  const colors = {
    Water: ["#1e3a8a", "#3b82f6"],
    Infrastructure: ["#1f2937", "#4b5563"],
    Agriculture: ["#14532d", "#22c55e"],
    Education: ["#7c2d12", "#ea580c"],
    Health: ["#7f1d1d", "#ef4444"],
    Environment: ["#064e3b", "#10b981"],
    Other: ["#312e81", "#6366f1"],
  };
  const [c1, c2] = colors[domain] || colors.Other;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="600" height="350" fill="url(#g)"/>
    <circle cx="300" cy="175" r="110" fill="#ffffff" opacity="0.08"/>
    <path d="M250 140 H350 V210 H250 Z" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.4"/>
    <text x="300" y="185" font-family="system-ui, sans-serif" font-weight="700" font-size="28" fill="#ffffff" text-anchor="middle">${domain} Issue</text>
  </svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function getAutoImageForDomain(domain = "Other", index = null) {
  const imgs = DOMAIN_IMAGES[domain] || DOMAIN_IMAGES.Other;
  if (Array.isArray(imgs)) {
    if (typeof index === "number" && !isNaN(index)) {
      return imgs[index % imgs.length] || imgs[0] || getSvgFallback(domain);
    }
    const randomIndex = Math.floor(Math.random() * imgs.length);
    return imgs[randomIndex] || imgs[0] || getSvgFallback(domain);
  }
  return imgs || getSvgFallback(domain);
}

function seedDataRaw() {
  return {
    session: null, // {role, name, id}

    settings: {
      // Toll-free helpline: the phone-based alternative for citizens who
      // can't or don't want to file online (no smartphone/data, low
      // literacy, etc). Admin-editable so it isn't hardcoded in the UI.
      tollFreeNumber: "1800-123-4567",
      tollFreeHours: "24x7, all days",
      // Each problem gets its own voting number = this prefix + 4-digit code.
      // Demo values: replace with the real numbers from your telecom provider.
      voteNumberPrefix: "1800-22-",
    },

    reports: [
      {
        id: "R-101",
        title: "Overhead tank overflowing every night",
        area: "Ward 6, Ranchi",
        desc: "Water overflows from the community tank between 11pm–1am, wasting hundreds of litres and flooding the lane.",
        domain: "Water",
        priority: "High",
        status: "progress",
        due: "2026-09-18",
        citizen: "Anjali Kumari",
        supports: 14,
        hasPhoto: true,
        hasLocation: true,
        image: getAutoImageForDomain("Water"),
        created: "2026-08-29",
        stage: 2,
        clusterOf: 2,
        gate: "innovation", // 'innovation' | 'routine' | null (undecided)
      },
      {
        id: "R-102",
        title: "Streetlight not working near school",
        area: "Ward 3, Ranchi",
        desc: "Streetlight pole #14 outside the primary school has been dark for 2 weeks. Likely a blown bulb.",
        domain: "Infrastructure",
        priority: "Low",
        status: "pending",
        due: "2026-09-10",
        citizen: "Anjali Kumari",
        supports: 5,
        hasPhoto: true,
        hasLocation: true,
        image: getAutoImageForDomain("Infrastructure"),
        created: "2026-09-01",
        stage: 1,
        clusterOf: 1,
        gate: "routine",
      },
      {
        id: "R-103",
        title: "Contaminated drinking water supply",
        area: "Bariatu, Ranchi",
        desc: "Tap water has a foul smell and slight yellow tint for the past 3 days. Multiple households affected.",
        domain: "Water",
        priority: "High",
        status: "progress",
        due: "2026-09-12",
        citizen: "Rohit Verma",
        supports: 31,
        hasPhoto: true,
        hasLocation: true,
        image: getAutoImageForDomain("Water"),
        created: "2026-08-25",
        stage: 3,
        clusterOf: 3,
        gate: "innovation",
      },
      {
        id: "R-104",
        title: "Crop disease spreading in paddy fields",
        area: "Khunti District",
        desc: "Leaf blight visible across ~40% of paddy fields this season, spreading fast after recent rain.",
        domain: "Agriculture",
        priority: "High",
        status: "progress",
        due: "2026-09-15",
        citizen: "Suresh Mahto",
        supports: 22,
        hasPhoto: true,
        hasLocation: true,
        image: getAutoImageForDomain("Agriculture"),
        created: "2026-08-20",
        stage: 4,
        clusterOf: 1,
        gate: "innovation",
      },
      {
        id: "R-105",
        title: "Pothole causing accidents on main road",
        area: "Ward 9, Ranchi",
        desc: "Large pothole near the market junction has caused two two-wheeler accidents this month.",
        domain: "Infrastructure",
        priority: "Medium",
        status: "pending",
        due: "2026-09-09",
        citizen: "Meena Devi",
        supports: 9,
        hasPhoto: true,
        hasLocation: true,
        image: getAutoImageForDomain("Infrastructure"),
        created: "2026-09-02",
        stage: 1,
        clusterOf: 1,
        gate: null,
      },
      {
        id: "R-106",
        title: "Low water pressure in supply lines",
        area: "Ward 6, Ranchi",
        desc: "Pressure has dropped noticeably over the last 10 days, taps run for only 20 minutes a day.",
        domain: "Water",
        priority: "Medium",
        status: "done",
        due: "2026-09-05",
        citizen: "Anjali Kumari",
        supports: 11,
        hasPhoto: false,
        hasLocation: true,
        image: getAutoImageForDomain("Water"),
        isAutoImage: true,
        created: "2026-08-18",
        stage: 6,
        clusterOf: 2,
        gate: "routine",
        citizenConfirmed: true,
      },
      // ---- Sample AI-flagged reports, pre-seeded so the Spam Folder has
      // a few instances to review straight away ----
      {
        id: "R-107",
        title: "🎉 YOU HAVE WON A PRIZE! Claim now",
        area: "Ward 6, Ranchi",
        desc: "Click here http://bit.ly/claim-now and WhatsApp me for your cash prize!!!",
        domain: "Other",
        priority: "Low",
        status: "pending",
        due: "2026-09-20",
        citizen: "Unknown User",
        supports: 0,
        hasPhoto: false,
        hasLocation: false,
        image: getAutoImageForDomain("Other"),
        created: "2026-09-08",
        stage: 1,
        clusterOf: 1,
        gate: null,
        spam: true,
        aiFlagged: true,
        aiConfidence: 92,
        spamReasons: [
          "Contains promotional/phishing language typical of spam",
          "No photo, location or voice note attached as evidence",
        ],
        spamReviewed: false,
      },
      {
        id: "R-108",
        title: "asdkj askjd aksjdaksj",
        area: "Ranchi",
        desc: "kjasdlkjasld kjasldkjasld kjaslkdj",
        domain: "Other",
        priority: "Low",
        status: "pending",
        due: "2026-09-21",
        citizen: "Guest",
        supports: 0,
        hasPhoto: false,
        hasLocation: false,
        image: getAutoImageForDomain("Other"),
        created: "2026-09-09",
        stage: 1,
        clusterOf: 1,
        gate: null,
        spam: true,
        aiFlagged: true,
        aiConfidence: 72,
        spamReasons: [
          "Text pattern looks like random characters, not a description",
          "No photo, location or voice note attached as evidence",
        ],
        spamReviewed: false,
      },
      {
        id: "R-109",
        title: "FREE LOAN APPROVED INSTANTLY CALL NOW",
        area: "Bariatu, Ranchi",
        desc: "loan approved for everyone, earn ₹50000 from home, act now!",
        domain: "Other",
        priority: "Low",
        status: "pending",
        due: "2026-09-19",
        citizen: "Unknown User",
        supports: 0,
        hasPhoto: false,
        hasLocation: false,
        image: getAutoImageForDomain("Other"),
        created: "2026-09-07",
        stage: 1,
        clusterOf: 1,
        gate: null,
        spam: true,
        aiFlagged: true,
        aiConfidence: 85,
        spamReasons: [
          "Contains promotional/phishing language typical of spam",
          "Title is in all caps",
        ],
        spamReviewed: true,
        spamDismissed: true,
      },
      {
        id: "R-110",
        title: "No water",
        area: "Ward 3, Ranchi",
        desc: "no water since 2 days",
        domain: "Water",
        priority: "Medium",
        status: "pending",
        due: "2026-09-22",
        citizen: "Ramesh Oraon",
        supports: 2,
        hasPhoto: false,
        hasLocation: false,
        image: getAutoImageForDomain("Water"),
        created: "2026-09-10",
        stage: 1,
        clusterOf: 1,
        gate: null,
        spam: false,
        aiFlagged: true,
        aiConfidence: 61,
        spamReasons: [
          "Description is too short to describe a real problem",
          "No photo, location or voice note attached as evidence",
        ],
        spamReviewed: true,
        verifiedFromSpam: true,
      },
      {
        id: "R-111",
        title: "Roooooad is baaaaaad pleeeease fix asap",
        area: "Ward 9, Ranchi",
        desc: "Roooooad is fuuuuull of hooooles pleeeeease fix soooooon",
        domain: "Infrastructure",
        priority: "Low",
        status: "pending",
        due: "2026-09-23",
        citizen: "Unknown User",
        supports: 0,
        hasPhoto: false,
        hasLocation: false,
        image: getAutoImageForDomain("Infrastructure"),
        created: "2026-09-11",
        stage: 1,
        clusterOf: 1,
        gate: null,
        spam: true,
        aiFlagged: true,
        aiConfidence: 58,
        spamReasons: [
          "Repeated-character spam pattern detected",
          "No photo, location or voice note attached as evidence",
        ],
        spamReviewed: false,
      },
      {
        id: "R-112",
        title: "Invest in crypto and double your money fast",
        area: "Ranchi",
        desc: "Bitcoin investment opportunity, guaranteed returns, act now, whatsapp me for details",
        domain: "Other",
        priority: "Low",
        status: "pending",
        due: "2026-09-24",
        citizen: "Unknown User",
        supports: 0,
        hasPhoto: false,
        hasLocation: false,
        image: getAutoImageForDomain("Other"),
        created: "2026-09-11",
        stage: 1,
        clusterOf: 1,
        gate: null,
        spam: true,
        aiFlagged: true,
        aiConfidence: 90,
        spamReasons: [
          "Contains promotional/phishing language typical of spam",
          "No photo, location or voice note attached as evidence",
        ],
        spamReviewed: false,
      },
      {
        id: "R-113",
        title: "qwqwqw eeeee rrrrr tytyty",
        area: "Khunti District",
        desc: "zxzxzx cvcvcv bnbnbn",
        domain: "Other",
        priority: "Low",
        status: "pending",
        due: "2026-09-25",
        citizen: "Guest",
        supports: 0,
        hasPhoto: false,
        hasLocation: false,
        image: getAutoImageForDomain("Other"),
        created: "2026-09-12",
        stage: 1,
        clusterOf: 1,
        gate: null,
        spam: true,
        aiFlagged: true,
        aiConfidence: 66,
        spamReasons: [
          "Text pattern looks like random characters, not a description",
          "No photo, location or voice note attached as evidence",
        ],
        spamReviewed: false,
      },
      {
        id: "R-114",
        title: "Drain blocked",
        area: "Ward 9, Ranchi",
        desc: "blocked drain",
        domain: "Infrastructure",
        priority: "Low",
        status: "pending",
        due: "2026-09-26",
        citizen: "Sita Kumari",
        supports: 1,
        hasPhoto: false,
        hasLocation: false,
        image: getAutoImageForDomain("Infrastructure"),
        created: "2026-09-12",
        stage: 1,
        clusterOf: 1,
        gate: null,
        spam: true,
        aiFlagged: true,
        aiConfidence: 57,
        spamReasons: [
          "Description is too short to describe a real problem",
          "No photo, location or voice note attached as evidence",
        ],
        spamReviewed: false,
      },
      {
        id: 'R-115',
        title: 'Groundwater contamination in Chatpur village',
        area: 'Chatpur, Palamu',
        desc: 'Hand-pump water has turned yellowish-brown and smells of iron. Over 200 families dependent on this source. Children reporting stomach ailments.',
        domain: 'Water',
        priority: 'High',
        status: 'pending',
        due: '2026-10-25',
        citizen: 'Birsa Munda',
        supports: 18,
        hasPhoto: true,
        hasLocation: true,
        image: 'https://images.unsplash.com/photo-1527066236128-2ff79f7b9705?q=80&w=1176&auto=format&fit=crop',
        created: '2026-10-01',
        stage: 1,
        clusterOf: 1,
        gate: null,
      },
    ],

    challenges: [
      {
        id: "C-201",
        title: "Low-connectivity smart water monitoring",
        domain: "Water",
        sourceReport: "R-101",
        capabilities: ["IoT", "Embedded Systems", "Data Analytics"],
        matchScore: 92,
        status: "open", // open | claimed | in-progress | pilot | done
        university: null,
        team: [],
        maturity: "Concept",
        image: getAutoImageForDomain("Water"),
        summary:
          "Design a low-power, low-maintenance sensor + alert system for overflow-prone community tanks that works with intermittent connectivity.",
        milestone: 0,
      },
      {
        id: "C-202",
        title: "Rapid water-quality field testing kit",
        domain: "Water",
        sourceReport: "R-103",
        capabilities: ["Chemistry", "Materials Science", "Mobile App"],
        matchScore: 87,
        status: "in-progress",
        university: "BIT Mesra",
        team: ["Priya Singh", "Aman Raj"],
        maturity: "Prototype",
        image: getAutoImageForDomain("Water"),
        summary:
          "A low-cost strip/sensor kit + companion app to flag contamination within minutes at the household level.",
        milestone: 1,
      },
      {
        id: "C-203",
        title: "Early crop-disease detection via imaging",
        domain: "Agriculture",
        sourceReport: "R-104",
        capabilities: ["Computer Vision", "Machine Learning", "Agronomy"],
        matchScore: 95,
        status: "pilot",
        university: "BIT Mesra",
        team: ["Aman Raj", "Kavita Oraon", "Vishal Toppo"],
        maturity: "Pilot-Ready",
        image: getAutoImageForDomain("Agriculture"),
        summary:
          "A phone-camera based model that identifies leaf blight and other common diseases early enough to act.",
        milestone: 3,
      },
      {
        id: "C-204",
        title: "Pothole hazard prediction from citizen reports",
        domain: "Infrastructure",
        sourceReport: "R-105",
        capabilities: ["Data Analytics", "GIS Mapping", "Civil Engineering"],
        matchScore: 78,
        status: "open",
        university: null,
        team: [],
        maturity: "Concept",
        image: getAutoImageForDomain("Infrastructure"),
        summary:
          "Use clustered citizen reports and road-condition data to flag high-risk stretches before accidents happen, not just after.",
        milestone: 0,
      },
      {
        id: "C-205",
        title: "Offline-first attendance & learning tracker for rural schools",
        domain: "Education",
        sourceReport: null,
        capabilities: ["Mobile App", "Backend", "UX Design"],
        matchScore: 81,
        status: "claimed",
        university: "NIT Jamshedpur",
        team: ["Kavita Oraon"],
        maturity: "Concept",
        image: getAutoImageForDomain("Education"),
        summary:
          "A lightweight app that lets teachers log attendance and basic learning outcomes without needing continuous internet connectivity.",
        milestone: 0,
      },
    ],

    universities: [
      {
        name: "BIT Mesra",
        capabilities: [
          "IoT",
          "Machine Learning",
          "Computer Vision",
          "Embedded Systems",
          "Civil Engineering",
        ],
        activeProjects: 2,
        verified: "2026-08-01",
      },
      {
        name: "NIT Jamshedpur",
        capabilities: [
          "Materials Science",
          "Chemistry",
          "Data Analytics",
          "Structural Engineering",
        ],
        activeProjects: 1,
        verified: "2026-07-20",
      },
      {
        name: "Jharkhand Rai University",
        capabilities: ["Mobile App", "UI/UX", "Agronomy", "Public Health"],
        activeProjects: 0,
        verified: "2026-08-10",
      },
      {
        name: 'IIT (ISM) Dhanbad',
        capabilities: ['Mining Engineering', 'Environmental Science', 'Data Analytics', 'AI/ML', 'Geological Survey'],
        activeProjects: 0,
        verified: '2026-09-01',
      },
      {
        name: 'Ranchi University',
        capabilities: ['Public Health', 'Social Science', 'Agriculture', 'Education', 'Hindi Literature'],
        activeProjects: 0,
        verified: '2026-08-15',
      },
    ],

    students: [
      {
        name: "Aman Raj",
        university: "BIT Mesra",
        skills: ["Machine Learning", "Python", "Computer Vision"],
        gap: ["IoT"],
        projects: ["C-202", "C-203"],
        nepCredits: 12,
        nepCertificates: ['Innovation Practicum — 4 credits', 'Field Research — 4 credits', 'Community Engagement — 4 credits'],
      },
      {
        name: "Priya Singh",
        university: "BIT Mesra",
        skills: ["Chemistry", "Materials Science"],
        gap: [],
        projects: ["C-202"],
        nepCredits: 8,
        nepCertificates: ['Lab Research — 4 credits', 'Technical Writing — 4 credits'],
      },
      {
        name: "Kavita Oraon",
        university: "BIT Mesra",
        skills: ["Agronomy", "Data Analytics"],
        gap: ["Machine Learning"],
        projects: ["C-203"],
        nepCredits: 6,
        nepCertificates: ['Field Research — 4 credits', 'Data Collection — 2 credits'],
      },
      {
        name: "Vishal Toppo",
        university: "BIT Mesra",
        skills: ["Embedded Systems", "IoT"],
        gap: [],
        projects: ["C-203"],
        nepCredits: 4,
        nepCertificates: ['Hardware Prototyping — 4 credits'],
      },
    ],

    industryProjects: [
      {
        challengeId: "C-203",
        interestedPartners: ["AgroTech Jharkhand"],
        resourcesOffered: [],
        csrFocus: 'Rural Development',
        fundingRange: { min: 200000, max: 1500000 },
        csrCategory: 'Agriculture & Livelihood',
      },
      {
        challengeId: "C-202",
        interestedPartners: [],
        resourcesOffered: [],
        csrFocus: 'Clean Water',
        fundingRange: { min: 100000, max: 800000 },
        csrCategory: 'Health & Sanitation',
      },
    ],

    users: [
      {
        name: "Anjali Kumari",
        role: "citizen",
        status: "active",
        joined: "2026-06-02",
      },
      {
        name: "Rohit Verma",
        role: "citizen",
        status: "active",
        joined: "2026-06-10",
      },
      {
        name: "Suresh Mahto",
        role: "citizen",
        status: "active",
        joined: "2026-07-01",
      },
      {
        name: "D. Sinha",
        role: "government",
        status: "active",
        joined: "2026-05-15",
      },
      {
        name: "BIT Mesra — Nodal Officer",
        role: "university",
        status: "active",
        joined: "2026-05-20",
      },
      {
        name: "Aman Raj",
        role: "student",
        status: "active",
        joined: "2026-06-05",
      },
      {
        name: "AgroTech Jharkhand",
        role: "industry",
        status: "active",
        joined: "2026-07-12",
      },
      {
        name: "Platform Admin",
        role: "admin",
        status: "active",
        joined: "2026-01-01",
      },
    ],

    notifications: [
      {
        text: 'Your report "Overhead tank overflowing" moved to In Development.',
        time: "2h ago",
        read: false,
        role: "citizen",
      },
      {
        text: "Reviewer confirmed a cluster including your streetlight report.",
        time: "1d ago",
        read: false,
        role: "citizen",
      },
      {
        text: "Milestone 1 approved for Rapid water-quality testing kit.",
        time: "3d ago",
        read: true,
        role: "student",
      },
      {
        text: "New challenge published: Low-connectivity smart water monitoring.",
        time: "4d ago",
        read: false,
        role: "university",
      },
      {
        text: "AgroTech Jharkhand expressed interest in crop-disease detection project.",
        time: "2d ago",
        read: false,
        role: "industry",
      },
      {
        text: "3 new reports flagged for cluster review.",
        time: "5h ago",
        read: false,
        role: "government",
      },
    ],

    priorArtSolutions: [
      {
        id: "PA-1",
        name: "Jal Jeevan Mission Portal",
        source: "Ministry of Jal Shakti",
        domain: "Water",
        description: "National water supply monitoring dashboard with household-level tap connection tracking.",
        relevance: 72,
        similarity: 65,
        location: "All India",
        status: "active",
        gap: "No real-time overflow alerting; designed for supply tracking, not anomaly detection.",
      },
      {
        id: "PA-2",
        name: "SWAJAL Smart Water ATM",
        source: "DRDO / Community Projects",
        domain: "Water",
        description: "Solar-powered water dispensing units with IoT-based quality and quantity monitoring.",
        relevance: 58,
        similarity: 40,
        location: "Uttarakhand, UP",
        status: "active",
        gap: "Fixed dispensing units only; not applicable to overflow in community tanks.",
      },
      {
        id: "PA-3",
        name: "SIH 2024 — Smart Streetlight System",
        source: "Smart India Hackathon",
        domain: "Infrastructure",
        description: "IoT-based streetlight monitoring with fault detection and remote switching.",
        relevance: 88,
        similarity: 82,
        location: "Prototype (Delhi NCR)",
        status: "prototype",
        gap: "Tested only in urban setting; connectivity and power reliability differ in Ranchi.",
      },
      {
        id: "PA-4",
        name: "e-NAM Crop Health Module",
        source: "Ministry of Agriculture",
        domain: "Agriculture",
        description: "Electronic marketplace with crop health advisory based on satellite imagery.",
        relevance: 45,
        similarity: 30,
        location: "All India",
        status: "active",
        gap: "Advisory only; no real-time field-level leaf disease detection from phone cameras.",
      },
      {
        id: "PA-5",
        name: "IIIT-H PlantDoc Dataset",
        source: "IIIT Hyderabad Research",
        domain: "Agriculture",
        description: "Open dataset of 2,598 images across 13 plant species for disease classification.",
        relevance: 91,
        similarity: 78,
        location: "Research",
        status: "available",
        gap: "Dataset only; no deployment model or mobile app. Can be integrated into solution.",
      },
    ],

    charters: [
      {
        challengeId: "C-202",
        leadUniversity: "BIT Mesra",
        nodalOfficer: "Dr. S. Kumar",
        partners: [],
        roles: [
          { institution: "BIT Mesra", role: "Lead Research", assignee: "Dr. S. Kumar" },
          { institution: "BIT Mesra", role: "Student Team Lead", assignee: "Priya Singh" },
        ],
        mentors: ["Dr. Meera Sharma"],
        ipTemplate: "Case B",
        fundingSources: ["Government", "University"],
        milestoneOwnership: [
          { milestone: "Plan", owner: "Dr. S. Kumar", verifier: "D. Sinha" },
          { milestone: "Prototype", owner: "Priya Singh", verifier: "Dr. Meera Sharma" },
        ],
        status: "active",
      },
    ],

    milestoneDetails: {
      "C-202": [
        { label: "Plan", deliverable: "Research plan & feasibility study", deadline: "2026-09-20", owner: "Dr. S. Kumar", evidence: ["feasibility_report.pdf"], fundingPct: 10, equityPct: 5, status: "approved" },
        { label: "Prototype", deliverable: "Working strip + companion app MVP", deadline: "2026-10-15", owner: "Priya Singh", evidence: [], fundingPct: 30, equityPct: 15, status: "in-progress" },
        { label: "Pilot", deliverable: "Field test in 50 households", deadline: "2026-11-30", owner: "Aman Raj", evidence: [], fundingPct: 40, equityPct: 30, status: "locked" },
        { label: "Deployed", deliverable: "Full deployment + training", deadline: "2027-01-15", owner: "Team", evidence: [], fundingPct: 20, equityPct: 50, status: "locked" },
      ],
      "C-203": [
        { label: "Plan", deliverable: "ML model architecture & dataset plan", deadline: "2026-08-15", owner: "Aman Raj", evidence: ["model_arch.pdf", "dataset_plan.pdf"], fundingPct: 10, equityPct: 5, status: "approved" },
        { label: "Prototype", deliverable: "Trained model + mobile app prototype", deadline: "2026-09-20", owner: "Aman Raj", evidence: ["prototype_demo.mp4"], fundingPct: 25, equityPct: 15, status: "approved" },
        { label: "Pilot", deliverable: "Field test in Khunti paddy fields", deadline: "2026-10-30", owner: "Kavita Oraon", evidence: ["field_results.pdf"], fundingPct: 40, equityPct: 30, status: "in-progress" },
        { label: "Deployed", deliverable: "District-wide rollout + farmer training", deadline: "2027-01-01", owner: "Team", evidence: [], fundingPct: 25, equityPct: 50, status: "locked" },
      ],
    },

    pilots: [
      {
        challengeId: "C-203",
        location: "Khunti District, Jharkhand",
        localAuthority: "District Agriculture Officer",
        fieldPartner: "AgroTech Jharkhand",
        duration: "8 weeks",
        targetBeneficiaries: 500,
        constraints: ["Intermittent connectivity", "Hindi/Mundari language", "Monsoon season", "Low smartphone penetration"],
        adaptations: ["Offline-first mode", "Voice-based UI", "Waterproof casing"],
        progress: "in-progress",
        startDate: "2026-09-15",
        evidenceFiles: [],
      },
    ],

    impactClaims: [],

    learningPaths: [
      {
        studentName: "Aman Raj",
        challengeId: "C-202",
        skill: "IoT",
        topics: ["Arduino Basics", "ESP32 Sensor Integration", "MQTT Protocol", "Cloud Connectivity"],
        resources: [
          { title: "IoT with ESP32 — Coursera", url: "#", type: "course" },
          { title: "MQTT Essentials — HiveMQ", url: "#", type: "tutorial" },
          { title: "Sensor Data Pipeline — YouTube", url: "#", type: "video" },
        ],
        estimatedHours: 40,
        completedTopics: 1,
        mentorApproved: false,
        studentReady: false,
      },
      {
        studentName: "Kavita Oraon",
        challengeId: "C-203",
        skill: "Machine Learning",
        topics: ["Python for ML", "Image Classification", "Transfer Learning", "Model Deployment"],
        resources: [
          { title: "Fast.ai Practical Deep Learning", url: "#", type: "course" },
          { title: "PyTorch Image Classification", url: "#", type: "tutorial" },
          { title: "TensorFlow Lite for Mobile", url: "#", type: "docs" },
        ],
        estimatedHours: 60,
        completedTopics: 2,
        mentorApproved: false,
        studentReady: true,
      },
    ],
  };
}

// ------------------------------------------------------------------
// Accountability + phone-participation defaults. Runs on fresh seeds AND
// on older saved states (localStorage / data.json) so upgrading never
// leaves a report without its own voting number or an empty call log.
// ------------------------------------------------------------------
function applyAccountabilityDefaults(d) {
  if (typeof IVR !== "undefined") IVR.ensureFields(d);
  if (!d.authorityReplies) d.authorityReplies = [];
  if (!d.callLog) d.callLog = [];
  // "People affected" estimate shown on every problem card. Older saved
  // problems had none, so give them a stable demo figure.
  const KNOWN_AFFECTED = { "R-101": 1200, "R-102": 450, "R-103": 3200, "R-104": 1750, "R-105": 2800, "R-106": 900, "R-110": 600 };
  (d.reports || []).forEach((r) => {
    if (r.affected === undefined && r.source !== "helpline") {
      r.affected = KNOWN_AFFECTED[r.id] || (80 + (hashStr(r.id) % 36) * 25);
    }
  });
  if (!d.partnerProfile) d.partnerProfile = { name: "AgroTech Jharkhand", type: "STARTUP", focus: ["Agriculture", "Water"], email: "csr@agrotech-demo.example" };
  if (!d.pledges) {
    const day = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString().slice(0, 10); };
    d.pledges = [
      { id: "P-1", challengeId: "C-203", partner: "AgroTech Jharkhand", partnerType: "STARTUP", supportTypes: ["MENTORSHIP", "TESTING_FACILITY"], amount: 150000, notes: "Drone imaging trials on partner farms in Khunti; weekly agronomy mentoring.", contact: "Neha Sinha", email: "csr@agrotech-demo.example", status: "Accepted", date: day(21) },
      { id: "P-2", challengeId: "C-202", partner: "Jharkhand Steel CSR Foundation", partnerType: "CSR_FOUNDATION", supportTypes: ["FUNDING", "EQUIPMENT"], amount: 400000, notes: "Funds 200 field test kits for Bariatu and Ward 6 households.", contact: "R. K. Mahto", email: "foundation@jsf-demo.example", status: "Accepted", date: day(14) },
      { id: "P-3", challengeId: "C-202", partner: "Adityapur Components MSME", partnerType: "MSME", supportTypes: ["EQUIPMENT", "PILOT_SITE"], amount: 80000, notes: "Moulded sensor housings and a pilot site at the plant canteen water line.", contact: "Sunil Oraon", email: "works@adityapur-demo.example", status: "Under review", date: day(5) },
    ];
  }
  if (d.accountabilityDemoSeeded) return d;
  d.accountabilityDemoSeeded = true;

  const daysAgo = (n) => { const x = new Date(); x.setDate(x.getDate() - n); return x.toISOString(); };
  const has = (id) => (d.reports || []).some((r) => r.id === id);
  const reply = (reportId, authorityTitle, kind, note, substitute, ago) => {
    if (!has(reportId)) return;
    d.authorityReplies.push({
      id: "AR-" + (d.authorityReplies.length + 1), reportId, authorityTitle,
      authorityName: OFFICIAL_NAMES[authorityTitle] || authorityTitle,
      kind, note, substitute: substitute || null, by: OFFICIAL_NAMES[authorityTitle] || authorityTitle, at: daysAgo(ago),
    });
  };
  reply("R-102", "Village Officer", "sick_leave",
    "I have been on medical leave since 14 October. The Panchayat secretary has been asked to arrange a bulb replacement for pole #14; I will confirm on return.", null, 9);
  reply("R-101", "Sub-Collector (SDM)", "temp_charge",
    "I was transferred to the election cell on 20 October. The Deputy Collector is holding temporary charge of this sub-division and is responsible for this complaint now.",
    { name: "Mohan Lal Munda", title: "Deputy Collector (acting SDM)" }, 6);
  reply("R-103", "District Collector", "out_of_station",
    "Called away for the state flood-review meeting in Delhi until 2 November. Water-quality samples have been sent; I will review results on return.", null, 3);

  // A believable spread of phone votes so the vote board isn't empty in the demo.
  const demoVotes = { "R-101": 6, "R-103": 12, "R-104": 8, "R-105": 5, "R-102": 3, "R-110": 4 };
  Object.keys(demoVotes).forEach((id) => {
    const r = (d.reports || []).find((x) => x.id === id);
    if (!r || !Array.isArray(r.phoneVotes)) return;
    for (let i = 0; i < demoVotes[id]; i++) {
      const tail = String(10 + ((hashStr(id + i) % 89))).padStart(2, "0");
      r.phoneVotes.push({ h: "demo" + id + i, m: ["98", "70", "62", "94", "88"][i % 5] + "•••••" + tail, at: daysAgo(i % 7) });
    }
    // phone votes are part of the public support count shown on the report
    r.supports = (r.supports || 0) + 0;
  });

  if (has("R-103")) {
    d.callLog.unshift({
      id: "CALL-DEMO1", at: daysAgo(2), type: "complaint", caller: "94•••••07", lang: "Hindi",
      transcript: "Hamare mohalle mein pani se badbu aa rahi hai, peela pani aa raha hai, bacche bimar ho rahe hain.",
      reportId: "R-103", result: "joined", matchScore: 41, reviewed: true,
    });
  }
  return d;
}

function seedData() {
  return applyAccountabilityDefaults(seedDataRaw());
}

const DB = {
  _data: null,
  _offline: false, // true when there's no server (file:// or Live Server)

  // Fetch the shared state once, before the app renders. Everything after this
  // stays synchronous, so no render-*.js file has to know a backend exists.
  async init() {
    try {
      const res = await fetch("/api/state");
      if (res.status === 204) {
        this._data = seedData(); // empty server: seed it
        this.save();
      } else {
        this._data = await res.json();
      }
    } catch (e) {
      this._offline = true; // fall back to the old localStorage behaviour
    }
    return this.load();
  },

  load() {
    if (this._data) {
      if (!this._migrated) { applyAccountabilityDefaults(this._data); this._migrated = true; }
      return this._data;
    }
    try {
      const raw = this._offline ? localStorage.getItem(STORE_KEY) : null;
      this._data = raw ? JSON.parse(raw) : seedData();
      // Migrate older localStorage snapshots (saved before "settings" existed)
      // so upgrading the app doesn't leave existing demo data without it.
      if (this._data && !this._data.settings) {
        this._data.settings = seedData().settings;
      }
      if (this._data && this._data.reports) {
        this._data.reports.forEach((r) => {
          if (
            !r.image ||
            typeof r.image !== "string" ||
            r.image.includes("undefined")
          ) {
            r.image = getAutoImageForDomain(r.domain);
          }
        });
      }
      if (this._data && this._data.challenges) {
        this._data.challenges.forEach((c) => {
          if (
            !c.image ||
            typeof c.image !== "string" ||
            c.image.includes("undefined")
          ) {
            c.image = getAutoImageForDomain(c.domain);
          }
        });
      }
    } catch (e) {
      this._data = seedData();
    }
    applyAccountabilityDefaults(this._data);
    this._migrated = true;
    return this._data;
  },
  save() {
    if (this._offline) {
      localStorage.setItem(STORE_KEY, JSON.stringify(this._data));
      return;
    }
    // ponytail: fire-and-forget PUT of the whole snapshot. Swap for per-record
    // POSTs if the state ever gets big enough for this to feel slow.
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      fetch("/api/state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this._data),
      }).catch(() => {});
    }, 150);
  },
  reset() {
    this._data = seedData();
    this.save();
  },

  // ---- settings ----
  getSettings() {
    return this.load().settings;
  },
  updateSettings(patch) {
    const d = this.load();
    d.settings = { ...d.settings, ...patch };
    this.save();
    return d.settings;
  },

  // ---- session ----
  // Stays in localStorage, not in the shared snapshot — otherwise one person
  // logging in as a citizen would log everyone else in as that citizen too.
  getSession() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY + "_session"));
    } catch (e) {
      return null;
    }
  },
  setSession(session) {
    localStorage.setItem(STORE_KEY + "_session", JSON.stringify(session));
  },
  clearSession() {
    localStorage.removeItem(STORE_KEY + "_session");
  },

  // ---- reports ----
  // Excludes anything the AI has flagged as spam/suspicious — those live in
  // the Spam Folder (getSpamReports) until a government official verifies
  // or dismisses them.
  getReports() {
    return this.load().reports.filter((r) => !r.spam);
  },
  getAllReportsIncludingSpam() {
    return this.load().reports;
  },
  // Everything the AI has ever flagged, whether still pending, verified, or
  // dismissed — this is the full Spam Folder history.
  getSpamReports() {
    return this.load().reports.filter((r) => r.aiFlagged);
  },
  addReport(report) {
    const d = this.load();
    report.id = "R-" + (100 + d.reports.length + 1);
    report.created = new Date().toISOString().slice(0, 10);
    report.supports = 0;
    report.stage = 1;
    report.status = "pending";
    report.gate = null;
    if (!report.image) {
      report.image = getAutoImageForDomain(report.domain);
      report.isAutoImage = true;
    }
    // Run the AI spam/suspicious check on every new submission.
    const verdict = classifyReportSpam(report);
    report.spam = verdict.spam;
    report.aiFlagged = verdict.spam;
    report.aiConfidence = verdict.aiConfidence;
    report.spamReasons = verdict.spamReasons;
    report.spamReviewed = false;
    d.reports.unshift(report);
    this.save();
    return report;
  },
  // Government official approves a flagged report as legitimate — it is
  // converted into a normal, actionable report and re-enters the standard
  // review flow (priority board, gate, etc), while staying visible in the
  // Spam Folder's reviewed history.
  verifyReport(id) {
    const r = this.load().reports.find((r) => r.id === id);
    if (r) {
      r.spam = false;
      r.spamReviewed = true;
      r.verifiedFromSpam = true;
      this.save();
    }
    return r;
  },
  // Government official confirms a flagged report really is spam — it stays
  // out of the active queue permanently but is kept for audit purposes.
  dismissSpamReport(id) {
    const r = this.load().reports.find((r) => r.id === id);
    if (r) {
      r.spamReviewed = true;
      r.spamDismissed = true;
      this.save();
    }
    return r;
  },
  // Best available location for a report — real GPS if captured, otherwise
  // an AI-resolved locality anchor. See DB_LOCATION above.
  resolveLocation(report) {
    return DB_LOCATION.resolve(report);
  },
  supportReport(id) {
    const r = this.getReports().find((r) => r.id === id);
    if (r && !r.supportedByMe) {
      r.supports++;
      r.supportedByMe = true;
      this.save();
    }
    return r;
  },
  setReportGate(id, gate) {
    const r = this.getReports().find((r) => r.id === id);
    if (r) {
      r.gate = gate;
      r.status = gate === "innovation" ? "progress" : "progress";
      r.stage = 2;
      this.save();
    }
    return r;
  },
  setReportPriority(id, priority) {
    const r = this.getReports().find((r) => r.id === id);
    if (r) {
      r.priority = priority;
      this.save();
    }
    return r;
  },
  setClusterDecision(id, decision, withId) {
    const r = this.getReports().find((r) => r.id === id);
    if (r) {
      r.clusterDecision = decision;
      r.clusterWith = decision === "merge" ? withId : null;
      this.save();
    }
    return r;
  },
  requestEvidence(id) {
    const r = this.getReports().find((r) => r.id === id);
    if (r) {
      r.evidenceRequested = true;
      this.save();
    }
    return r;
  },

  // ---- challenges ----
  getChallenges() {
    return this.load().challenges;
  },
  claimChallenge(id, university) {
    const c = this.getChallenges().find((c) => c.id === id);
    if (c) {
      c.status = "claimed";
      c.university = university;
      this.save();
    }
    return c;
  },
  advanceChallengeMilestone(id) {
    const c = this.getChallenges().find((c) => c.id === id);
    if (c && c.milestone < 3) {
      c.milestone++;
      this.save();
    }
    return c;
  },
  addChallengeFromReport(report) {
    const d = this.load();
    const c = {
      id: "C-" + (200 + d.challenges.length + 1),
      title: report.title,
      domain: report.domain,
      sourceReport: report.id,
      image: report.image || getAutoImageForDomain(report.domain),
      capabilities: ["To be assessed"],
      matchScore: 0,
      status: "open",
      university: null,
      team: [],
      maturity: "Concept",
      summary: report.desc,
      milestone: 0,
    };
    d.challenges.unshift(c);
    this.save();
    return c;
  },

  // Responsible government official for a report or a university project —
  // escalates up the hierarchy as priority/maturity/scale increases.
  getResponsibleOfficial(item) {
    if (!item) return DEFAULT_OFFICIAL;
    if (item.maturity) {
      return OFFICIAL_BY_MATURITY[item.maturity] || DEFAULT_OFFICIAL;
    }
    if ((item.clusterOf || 1) >= 3) return "District Collector";
    return OFFICIAL_BY_PRIORITY[item.priority] || DEFAULT_OFFICIAL;
  },


  // The person the report was ORIGINALLY routed to (by office).
  getAssignedPerson(item) {
    const title = this.getResponsibleOfficial(item);
    return { name: OFFICIAL_NAMES[title] || "Unassigned", title };
  },

  // Newest authority reply for a report (or null).
  getLatestReply(reportId) {
    const all = (this.load().authorityReplies || []).filter((x) => x.reportId === reportId);
    return all.length ? all[all.length - 1] : null;
  },
  getReplyHistory(reportId) {
    return (this.load().authorityReplies || []).filter((x) => x.reportId === reportId).slice().reverse();
  },

  // Named person responsible right now. If the assigned authority says
  // someone else holds temporary charge, that person is shown as responsible
  // (with a note of whom they are acting for).
  getResponsiblePerson(item) {
    const assigned = this.getAssignedPerson(item);
    const rep = item && item.id && item.due ? this.getLatestReply(item.id) : null;
    if (rep && rep.kind === "temp_charge" && rep.substitute && rep.substitute.name) {
      return { name: rep.substitute.name, title: rep.substitute.title || "Acting charge", actingFor: assigned };
    }
    return assigned;
  },

  // Authority answers in public. Returns { ok, error?, reply? }.
  addAuthorityReply({ reportId, kind, note, substitute, by }) {
    const d = this.load();
    const r = (d.reports || []).find((x) => x.id === reportId);
    if (!r) return { ok: false, error: "Report not found." };
    const k = REPLY_KINDS[kind];
    if (!k) return { ok: false, error: "Please choose a reason." };
    note = String(note || "").trim();
    if (note.length < 15) return { ok: false, error: "Please explain in a few words (at least 15 characters) — this is shown to citizens." };
    let sub = null;
    if (k.needsSubstitute) {
      const n = String((substitute && substitute.name) || "").trim();
      const t = String((substitute && substitute.title) || "").trim();
      if (!n) return { ok: false, error: "Please give the name of the person who is in temporary charge." };
      sub = { name: n, title: t || "Acting charge" };
    }
    const assigned = this.getAssignedPerson(r);
    const reply = {
      id: "AR-" + ((d.authorityReplies || []).length + 1), reportId, authorityTitle: assigned.title,
      authorityName: assigned.name, kind, note, substitute: sub, by: by || assigned.name, at: new Date().toISOString(),
    };
    (d.authorityReplies = d.authorityReplies || []).push(reply);
    this.save();
    return { ok: true, reply };
  },

  // Everything the accountability dashboard needs, computed from live data.
  // A reply never reduces the delay count — it only adds context.
  getAccountability() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysLate = (iso) => Math.floor((today - new Date(iso)) / 86400000);
    const reports = this.getReports();
    const byTitle = {};
    Object.keys(OFFICIAL_NAMES).forEach((title) => {
      byTitle[title] = { title, name: OFFICIAL_NAMES[title], assigned: 0, delayed: 0, totalDays: 0, maxDays: 0, answered: 0, unanswered: 0, resolved: 0, items: [] };
    });
    reports.forEach((r) => {
      const who = this.getAssignedPerson(r);
      const a = byTitle[who.title] || (byTitle[who.title] = { title: who.title, name: who.name, assigned: 0, delayed: 0, totalDays: 0, maxDays: 0, answered: 0, unanswered: 0, resolved: 0, items: [] });
      if (r.status === "done") { a.resolved++; return; }
      a.assigned++;
      const days = r.due ? Math.max(0, daysLate(r.due)) : 0;
      const reply = this.getLatestReply(r.id);
      const item = { report: r, days, reply, acting: this.getResponsiblePerson(r), ageDays: r.created ? Math.max(0, daysLate(r.created)) : 0 };
      a.items.push(item);
      if (days > 0) {
        a.delayed++; a.totalDays += days; a.maxDays = Math.max(a.maxDays, days);
        if (reply) a.answered++; else a.unanswered++;
      }
    });
    const authorities = Object.values(byTitle).map((a) => {
      a.items.sort((x, y) => y.days - x.days);
      a.avgDays = a.delayed ? Math.round(a.totalDays / a.delayed) : 0;
      return a;
    }).sort((x, y) => y.totalDays - x.totalDays);
    const totals = authorities.reduce((t, a) => ({
      open: t.open + a.assigned, delayed: t.delayed + a.delayed, totalDays: t.totalDays + a.totalDays,
      unanswered: t.unanswered + a.unanswered, maxDays: Math.max(t.maxDays, a.maxDays), resolved: t.resolved + a.resolved,
    }), { open: 0, delayed: 0, totalDays: 0, unanswered: 0, maxDays: 0, resolved: 0 });
    return { authorities, totals };
  },

  // ---- phone participation (see js/ivr-core.js) ----
  castPhoneVote(dialed, from) {
    const res = IVR.castVote(this.load(), dialed, from);
    this.save();
    return res;
  },
  fileHelplineComplaint(from, transcript, opts) {
    const res = IVR.fileComplaint(this.load(), from, transcript, opts);
    this.save();
    return res;
  },
  getCallLog() { return this.load().callLog || []; },
  markCallReviewed(id) {
    const c = this.getCallLog().find((x) => x.id === id);
    if (c) { c.reviewed = true; const r = (this.load().reports || []).find((x) => x.id === c.reportId); if (r) r.needsOperatorReview = false; this.save(); }
    return c;
  },
  // Reality-show style board: problems ranked by total community backing.
  getVoteBoard() {
    return this.getReports().filter((r) => r.status !== "done")
      .slice().sort((a, b) => (b.supports || 0) - (a.supports || 0));
  },

  // Returns { days, reason } when the item is past its deadline, else null.
  //  - reports: past `due` and not resolved
  //  - challenges: earliest milestone past its deadline and not approved
  getDelayInfo(item) {
    if (!item) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysLate = (iso) => Math.floor((today - new Date(iso)) / 86400000);

    if (item.due) {
      if (item.status === "done") return null;
      const n = daysLate(item.due);
      if (!(n > 0)) return null;
      return { days: n, reason: item.delayReason || REPORT_DELAY_REASONS[item.stage] || DEFAULT_REPORT_DELAY_REASON, reply: item.id ? this.getLatestReply(item.id) : null };
    }

    if (item.maturity !== undefined && item.id) {
      const ms = this.getMilestones(item.id) || [];
      const late = ms
        .filter((m) => m.status !== "approved" && m.deadline && daysLate(m.deadline) > 0)
        .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0];
      if (!late) return null;
      const why = late.delayReason || (
        late.status === "submitted" ? "Deliverable submitted — waiting for reviewer approval." :
        late.status === "locked" ? "Blocked until the previous milestone is approved." :
        "Deliverable not submitted yet."
      );
      return { days: daysLate(late.deadline), reason: `${late.label} milestone (owner: ${late.owner}) — ${why}` };
    }
    return null;
  },

  // ---- students ----
  getStudents() {
    return this.load().students;
  },
  getStudentByName(name) {
    return this.getStudents().find((s) => s.name === name);
  },
  addSkill(name, skill) {
    const s = this.getStudentByName(name);
    if (s && skill && !s.skills.includes(skill)) {
      s.skills.push(skill);
      this.save();
    }
    return s;
  },
  joinProject(name, challengeId) {
    const s = this.getStudentByName(name);
    const c = this.getChallenges().find((c) => c.id === challengeId);
    if (s && c) {
      if (!s.projects.includes(challengeId)) s.projects.push(challengeId);
      if (!c.team.includes(name)) c.team.push(name);
      this.save();
    }
    return s;
  },

  // ---- universities ----
  getUniversities() {
    return this.load().universities;
  },

  // ---- industry ----
  getIndustryProjects() {
    return this.load().industryProjects;
  },
  expressInterest(challengeId, partnerName) {
    const d = this.load();
    let ip = d.industryProjects.find((p) => p.challengeId === challengeId);
    if (!ip) {
      ip = { challengeId, interestedPartners: [], resourcesOffered: [] };
      d.industryProjects.push(ip);
    }
    if (!ip.interestedPartners.includes(partnerName))
      ip.interestedPartners.push(partnerName);
    this.save();
    return ip;
  },

  // ---- industry pledges (CSR / MSME / startup offers of support) ----
  getPartnerProfile() { return this.load().partnerProfile; },
  setPartnerFocus(focus) {
    const d = this.load(); d.partnerProfile.focus = focus.slice(); this.save(); return d.partnerProfile;
  },
  getPledges(partner) {
    const all = this.load().pledges || [];
    return partner ? all.filter((p) => p.partner === partner) : all;
  },
  addPledge(p) {
    const d = this.load();
    const amount = Math.max(0, Math.round(Number(p.amount) || 0));
    if (!d.challenges.some((c) => c.id === p.challengeId)) return { ok: false, error: "Please choose a project." };
    if (!p.supportTypes || !p.supportTypes.length) return { ok: false, error: "Choose at least one way you can help." };
    if (p.supportTypes.includes("FUNDING") && amount <= 0) return { ok: false, error: "Enter the grant amount in ₹." };
    const prof = d.partnerProfile;
    const pledge = {
      id: "P-" + ((d.pledges || []).length + 1), challengeId: p.challengeId, partner: prof.name, partnerType: p.partnerType || prof.type,
      supportTypes: p.supportTypes.filter((t) => SUPPORT_TYPES[t]), amount, notes: String(p.notes || "").trim(),
      contact: p.contact || prof.name, email: p.email || prof.email, status: "Under review", date: new Date().toISOString().slice(0, 10),
    };
    d.pledges.unshift(pledge);
    // keep the older "interested partners" list in sync for other screens
    let ip = d.industryProjects.find((x) => x.challengeId === p.challengeId);
    if (!ip) { ip = { challengeId: p.challengeId, interestedPartners: [], resourcesOffered: [] }; d.industryProjects.push(ip); }
    if (!ip.interestedPartners.includes(prof.name)) ip.interestedPartners.push(prof.name);
    this.save();
    return { ok: true, pledge };
  },
  getIndustryStats() {
    const pledges = this.getPledges();
    const projects = new Set(pledges.map((p) => p.challengeId));
    return {
      pledges: pledges.length,
      amount: pledges.reduce((t, p) => t + (p.amount || 0), 0),
      projects: projects.size,
      partners: new Set(pledges.map((p) => p.partner)).size,
      open: this.getChallenges().filter((c) => c.status !== "done").length,
    };
  },

  // ---- users / admin ----
  getUsers() {
    return this.load().users;
  },
  toggleUserStatus(name) {
    const u = this.getUsers().find((u) => u.name === name);
    if (u) {
      u.status = u.status === "active" ? "suspended" : "active";
      this.save();
    }
    return u;
  },

  // ---- notifications ----
  getNotifications() {
    return this.load().notifications;
  },
  markAllRead() {
    this.getNotifications().forEach((n) => (n.read = true));
    this.save();
  },
  addNotification(text, role) {
    const d = this.load();
    d.notifications.unshift({ text, time: "Just now", read: false, role: role || "all" });
    this.save();
  },

  // ---- prior-art / solution intelligence ----
  getPriorArt(domain) {
    const all = this.load().priorArtSolutions || [];
    return domain ? all.filter(s => s.domain === domain) : all;
  },
  markSolutionReused(id) {
    const s = (this.load().priorArtSolutions || []).find(s => s.id === id);
    if (s) { s.reused = true; this.save(); }
    return s;
  },

  // ---- charters ----
  getCharters() {
    return this.load().charters || [];
  },
  getCharter(challengeId) {
    return this.getCharters().find(c => c.challengeId === challengeId) || null;
  },
  saveCharter(data) {
    const d = this.load();
    if (!d.charters) d.charters = [];
    const idx = d.charters.findIndex(c => c.challengeId === data.challengeId);
    if (idx >= 0) d.charters[idx] = data;
    else d.charters.push(data);
    this.save();
    return data;
  },

  // ---- milestone details ----
  getMilestones(challengeId) {
    const d = this.load();
    if (!d.milestoneDetails) d.milestoneDetails = {};
    return d.milestoneDetails[challengeId] || null;
  },
  uploadDeliverable(challengeId, milestoneIdx, fileName) {
    const d = this.load();
    if (!d.milestoneDetails) d.milestoneDetails = {};
    const ms = d.milestoneDetails[challengeId];
    if (ms && ms[milestoneIdx]) {
      ms[milestoneIdx].evidence.push(fileName);
      ms[milestoneIdx].status = "submitted";
      this.save();
    }
  },
  approveMilestone(challengeId, milestoneIdx) {
    const d = this.load();
    const ms = d.milestoneDetails ? d.milestoneDetails[challengeId] : null;
    if (ms && ms[milestoneIdx]) {
      ms[milestoneIdx].status = "approved";
      if (ms[milestoneIdx + 1]) ms[milestoneIdx + 1].status = "in-progress";
      this.save();
    }
  },
  rejectMilestone(challengeId, milestoneIdx) {
    const d = this.load();
    const ms = d.milestoneDetails ? d.milestoneDetails[challengeId] : null;
    if (ms && ms[milestoneIdx]) {
      ms[milestoneIdx].status = "in-progress";
      this.save();
    }
  },

  // ---- deployment route ----
  setDeploymentRoute(challengeId, route) {
    const c = this.getChallenges().find(c => c.id === challengeId);
    if (c) { c.deploymentRoute = route; this.save(); }
    return c;
  },

  // ---- pilots ----
  getPilots() {
    return this.load().pilots || [];
  },
  getPilot(challengeId) {
    return this.getPilots().find(p => p.challengeId === challengeId) || null;
  },
  savePilot(data) {
    const d = this.load();
    if (!d.pilots) d.pilots = [];
    const idx = d.pilots.findIndex(p => p.challengeId === data.challengeId);
    if (idx >= 0) d.pilots[idx] = data;
    else d.pilots.push(data);
    this.save();
    return data;
  },
  updatePilotProgress(challengeId, progress) {
    const p = this.getPilot(challengeId);
    if (p) { p.progress = progress; this.save(); }
    return p;
  },

  // ---- impact claims ----
  getImpactClaims() {
    return this.load().impactClaims || [];
  },
  submitImpactClaim(data) {
    const d = this.load();
    if (!d.impactClaims) d.impactClaims = [];
    data.id = "IC-" + (d.impactClaims.length + 1);
    data.status = "submitted";
    data.submittedDate = new Date().toISOString().slice(0, 10);
    d.impactClaims.push(data);
    this.save();
    return data;
  },
  verifyImpact(claimId) {
    const ic = this.getImpactClaims().find(c => c.id === claimId);
    if (ic) { ic.status = "verified"; this.save(); }
    return ic;
  },

  // ---- learning paths ----
  getLearningPaths(studentName) {
    const all = this.load().learningPaths || [];
    return studentName ? all.filter(l => l.studentName === studentName) : all;
  },
  saveLearningPath(data) {
    const d = this.load();
    if (!d.learningPaths) d.learningPaths = [];
    const idx = d.learningPaths.findIndex(l => l.studentName === data.studentName && l.challengeId === data.challengeId);
    if (idx >= 0) d.learningPaths[idx] = data;
    else d.learningPaths.push(data);
    this.save();
    return data;
  },
  markStudentReady(studentName, challengeId) {
    const lp = (this.load().learningPaths || []).find(l => l.studentName === studentName && l.challengeId === challengeId);
    if (lp) { lp.studentReady = true; this.save(); }
    return lp;
  },
  approveMentorRole(studentName, challengeId) {
    const lp = (this.load().learningPaths || []).find(l => l.studentName === studentName && l.challengeId === challengeId);
    if (lp) { lp.mentorApproved = true; this.save(); }
    return lp;
  },

  getDepartments(){ return JHARKHAND_DEPARTMENTS; },
  getDepartmentsForDomain(domain){ return (DOMAIN_DEPT_MAP[domain]||[]).map(id => JHARKHAND_DEPARTMENTS.find(d=>d.id===id)).filter(Boolean); },
  getSolutionLibrary(domain){ return domain ? SOLUTION_LIBRARY.filter(s=>s.domain===domain) : SOLUTION_LIBRARY; },
  getAllDistricts(){ return AREA_ANCHORS.filter(a=>a.label).map(a=>({name:a.label,lat:a.lat,lng:a.lng})); },

};
