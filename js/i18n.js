/* ============================================================
   SETU — i18n engine
   ------------------------------------------------------------
   Makes the EN / हि / खो / বাং toggle actually translate the
   whole app — every screen, every button, and anything a user
   types in (report titles, descriptions, etc.) — not just a
   handful of hardcoded labels.

   How it works:
   1. A hand-checked dictionary (DICT) gives instant, accurate
      translations for the app's core vocabulary (nav items,
      buttons, statuses, roles, common phrases) in Hindi and
      Bengali. This is offline and always wins when present.
   2. Everything else (headings, sentences, and — importantly —
      free text that citizens/universities/etc. type into forms)
      is sent to the MyMemory translation API on demand and then
      cached (in-memory + localStorage), so it's translated once
      and instant forever after.
   3. A generic DOM walker (not per-file string replacement)
      finds every visible text node and translatable attribute
      (placeholder / aria-label / title) anywhere in the app —
      including inside modals, toasts, tables, and anything a
      render-*.js file produces — and swaps it to the active
      language. A MutationObserver re-applies this automatically
      whenever the app updates the DOM, so nothing is missed and
      no other file needs to change.
   4. The ORIGINAL English string is memoized per DOM node the
      first time it's seen, so switching languages back and
      forth always translates from the true source text, never
      from an already-translated string, and switching back to
      English is an exact, instant restore.

   Note on Khortha (kh / kfy): no public machine-translation
   engine currently supports Khortha, a low-resource regional
   language. Khortha shares a lot of vocabulary with Hindi, so
   the dictionary layer includes genuine Khortha wording where
   we're confident of it, and anything else falls back to the
   Hindi machine translation as the closest available option.
   ============================================================ */

(function (global) {
  const LANG_KEY = 'setu_lang';
  const MT_CACHE_KEY = 'setu_mt_cache_v2';
  const MT_ENDPOINT = 'https://api.mymemory.translated.net/get';

  const LANG_META = {
    en: { label: 'English', code: 'en', mt: null, speech: 'en-IN' },
    hi: { label: 'Hindi', code: 'hi', mt: 'hi', speech: 'hi-IN' },
    kh: { label: 'Khortha', code: 'kfy', mt: 'hi', speech: 'hi-IN' }, // see note above
    bn: { label: 'Bengali', code: 'bn', mt: 'bn', speech: 'bn-IN' },
  };

  // ---------------------------------------------------------------
  // Curated dictionary — exact (normalized) English phrase -> translation.
  // Anything not listed here quietly falls through to machine translation.
  // ---------------------------------------------------------------
  const DICT = {
    hi: {
      'Dashboard': 'डैशबोर्ड',
      'Report a Problem': 'समस्या दर्ज करें',
      'My Reports': 'मेरी रिपोर्टें',
      'View Progress': 'प्रगति देखें',
      'Profile': 'प्रोफ़ाइल',
      'Priority Board': 'प्राथमिकता बोर्ड',
      'Innovation Gate': 'इनोवेशन गेट',
      'Clusters': 'समूह',
      'Impact Dashboard': 'प्रभाव डैशबोर्ड',
      'Challenge Marketplace': 'चुनौती बाज़ार',
      'My Projects': 'मेरी परियोजनाएं',
      'Capability Profile': 'क्षमता प्रोफ़ाइल',
      'Available Challenges': 'उपलब्ध चुनौतियाँ',
      'Skill Profile': 'कौशल प्रोफ़ाइल',
      'Project Marketplace': 'परियोजना बाज़ार',
      'Commitments': 'प्रतिबद्धताएं',
      'Overview': 'अवलोकन',
      'Users': 'उपयोगकर्ता',
      'Content Oversight': 'सामग्री निगरानी',
      'Settings': 'सेटिंग्स',
      'Log in': 'लॉग इन करें',
      'Sign up': 'साइन अप करें',
      'Create account': 'खाता बनाएं',
      'Log out': 'लॉग आउट',
      'Cancel': 'रद्द करें',
      'Submit report': 'रिपोर्ट सबमिट करें',
      'Submit': 'सबमिट करें',
      'Save': 'सहेजें',
      'Close': 'बंद करें',
      'New Report': 'नई रिपोर्ट',
      'Notifications': 'सूचनाएं',
      'No notifications yet.': 'अभी तक कोई सूचना नहीं।',
      'I am a…': 'मैं हूँ…',
      'Select your role': 'अपनी भूमिका चुनें',
      'Full name': 'पूरा नाम',
      'Username / email': 'उपयोगकर्ता नाम / ईमेल',
      'Password': 'पासवर्ड',
      'Or Quick Demo 1-Click Login': 'या त्वरित डेमो 1-क्लिक लॉगिन',
      'Citizen': 'नागरिक',
      'Government / Reviewer': 'सरकार / समीक्षक',
      'Govt': 'सरकार',
      'University': 'विश्वविद्यालय',
      'Uni': 'विश्वविद्यालय',
      'Student': 'छात्र',
      'Industry Partner': 'उद्योग साझेदार',
      'Industry': 'उद्योग',
      'Admin': 'व्यवस्थापक',
      'Title': 'शीर्षक',
      'Description': 'विवरण',
      'Domain': 'क्षेत्र',
      'Area / Locality': 'क्षेत्र / इलाका',
      'Status': 'स्थिति',
      'Priority': 'प्राथमिकता',
      'High': 'उच्च',
      'Medium': 'मध्यम',
      'Low': 'निम्न',
      'Pending': 'लंबित',
      'Pending review': 'समीक्षा लंबित',
      'In progress': 'प्रगति पर',
      'Resolved': 'समाधान हो गया',
      'Received': 'प्राप्त',
      'Verified': 'सत्यापित',
      'Assigned': 'सौंपा गया',
      'In Development': 'विकास में',
      'Pilot': 'पायलट',
      'Support': 'समर्थन',
      'Supported': 'समर्थित',
      'Attach photo': 'फोटो जोड़ें',
      'Attach video': 'वीडियो जोड़ें',
      'Attach doc': 'दस्तावेज़ जोड़ें',
      'Voice note': 'वॉइस नोट',
      'Attach location': 'स्थान जोड़ें',
      'Water': 'जल',
      'Infrastructure': 'बुनियादी ढांचा',
      'Agriculture': 'कृषि',
      'Education': 'शिक्षा',
      'Health': 'स्वास्थ्य',
      'Environment': 'पर्यावरण',
      'Other': 'अन्य',
      'Language set to English': 'भाषा अंग्रेज़ी में सेट की गई',
      'Language set to Hindi': 'भाषा हिन्दी में सेट की गई',
      'Language set to Khortha': 'भाषा खोरठा में सेट की गई',
      'Language set to Bengali': 'भाषा बंगाली में सेट की गई',
      'Yes': 'हाँ',
      'No': 'नहीं',
      'Dept Directory': 'विभाग निर्देशिका',
      'AI Routing': 'AI राउटिंग',
      'Department Directory': 'विभाग निर्देशिका',
      'AI Department Routing': 'AI विभाग राउटिंग',
      'Search departments…': 'विभाग खोजें…',
      'Route a Report': 'रिपोर्ट राउट करें',
      'Select a report to route': 'राउट करने के लिए रिपोर्ट चुनें',
      'Route Now': 'अभी राउट करें',
      'Guided Tour': 'गाइडेड टूर',
      'Switch Role': 'भूमिका बदलें',
      'Ask SETU AI Assistant': 'SETU AI सहायक से पूछें',
      'Solution Library': 'समाधान पुस्तकालय',
      'Public Transparency': 'सार्वजनिक पारदर्शिता',
      'NEP Credits': 'NEP क्रेडिट',
      'Credits Earned via SETU Projects': 'SETU परियोजनाओं से अर्जित क्रेडिट',
      'Certificates': 'प्रमाण पत्र',
      'Download Mock Certificate': 'नमूना प्रमाण पत्र डाउनलोड करें',
      'Confirms Resolved': 'समाधान की पुष्टि',
      'Yes, confirmed': 'हाँ, पुष्टि हुई',
      'No, reopen': 'नहीं, फिर से खोलें',
      'CSR Fit': 'CSR उपयुक्तता',
      'Funding Range': 'वित्त पोषण सीमा',
      'Demo Helpline': 'डेमो हेल्पलाइन',
      'Innovation': 'नवाचार',
      'Implementation': 'कार्यान्वयन',
      'Policy': 'नीति',
      'Resolution Rate': 'समाधान दर',
      'Avg Response Time': 'औसत प्रतिक्रिया समय',
      'Citizen Satisfaction': 'नागरिक संतुष्टि',
      'Departments Engaged': 'विभाग संलग्न',
      'Report Classification': 'रिपोर्ट वर्गीकरण',
      'Top 10 Districts by Reports': 'रिपोर्ट के अनुसार शीर्ष 10 जिले',
      'Realized Outcome Numbers': 'प्राप्त परिणाम संख्याएँ',
      'Citizens benefited': 'लाभान्वित नागरिक',
      'Time saved per day': 'प्रतिदिन बचाया गया समय',
      'Clean water treated (litres/day)': 'उपचारित स्वच्छ जल (लीटर/दिन)',
      'CSR funds mobilized (₹)': 'जुटाए गए CSR कोष (₹)',
      'Active projects': 'सक्रिय परियोजनाएँ',
      'Problems resolved': 'हल की गई समस्याएँ',
      'Escalate': 'ऊपर भेजें',
      'Route to Dept': 'विभाग को भेजें',
      'All Districts': 'सभी जिले',
      'Notification Preferences': 'सूचना प्राथमिकताएँ',
      'Similar solved problems found': 'समान सुलझी समस्याएँ मिलीं',
    },
    bn: {
      'Dashboard': 'ড্যাশবোর্ড',
      'Report a Problem': 'সমস্যা রিপোর্ট করুন',
      'My Reports': 'আমার রিপোর্ট',
      'View Progress': 'অগ্রগতি দেখুন',
      'Profile': 'প্রোফাইল',
      'Priority Board': 'অগ্রাধিকার বোর্ড',
      'Innovation Gate': 'ইনোভেশন গেট',
      'Clusters': 'ক্লাস্টার',
      'Impact Dashboard': 'প্রভাব ড্যাশবোর্ড',
      'Challenge Marketplace': 'চ্যালেঞ্জ মার্কেটপ্লেস',
      'My Projects': 'আমার প্রকল্প',
      'Capability Profile': 'সক্ষমতা প্রোফাইল',
      'Available Challenges': 'উপলব্ধ চ্যালেঞ্জ',
      'Skill Profile': 'দক্ষতা প্রোফাইল',
      'Project Marketplace': 'প্রকল্প মার্কেটপ্লেস',
      'Commitments': 'প্রতিশ্রুতি',
      'Overview': 'সারসংক্ষেপ',
      'Users': 'ব্যবহারকারী',
      'Content Oversight': 'কনটেন্ট তদারকি',
      'Settings': 'সেটিংস',
      'Log in': 'লগ ইন',
      'Sign up': 'সাইন আপ',
      'Create account': 'অ্যাকাউন্ট তৈরি করুন',
      'Log out': 'লগ আউট',
      'Cancel': 'বাতিল করুন',
      'Submit report': 'রিপোর্ট জমা দিন',
      'Submit': 'জমা দিন',
      'Save': 'সংরক্ষণ করুন',
      'Close': 'বন্ধ করুন',
      'New Report': 'নতুন রিপোর্ট',
      'Notifications': 'বিজ্ঞপ্তি',
      'No notifications yet.': 'এখনও কোনো বিজ্ঞপ্তি নেই।',
      'I am a…': 'আমি একজন…',
      'Select your role': 'আপনার ভূমিকা নির্বাচন করুন',
      'Full name': 'পুরো নাম',
      'Username / email': 'ব্যবহারকারীর নাম / ইমেল',
      'Password': 'পাসওয়ার্ড',
      'Or Quick Demo 1-Click Login': 'অথবা কুইক ডেমো ১-ক্লিক লগইন',
      'Citizen': 'নাগরিক',
      'Government / Reviewer': 'সরকার / পর্যালোচক',
      'Govt': 'সরকার',
      'University': 'বিশ্ববিদ্যালয়',
      'Uni': 'বিশ্ববিদ্যালয়',
      'Student': 'শিক্ষার্থী',
      'Industry Partner': 'শিল্প অংশীদার',
      'Industry': 'শিল্প',
      'Admin': 'প্রশাসক',
      'Title': 'শিরোনাম',
      'Description': 'বিবরণ',
      'Domain': 'ক্ষেত্র',
      'Area / Locality': 'এলাকা / স্থান',
      'Status': 'অবস্থা',
      'Priority': 'অগ্রাধিকার',
      'High': 'উচ্চ',
      'Medium': 'মাঝারি',
      'Low': 'নিম্ন',
      'Pending': 'মুলতুবি',
      'Pending review': 'পর্যালোচনা মুলতুবি',
      'In progress': 'চলমান',
      'Resolved': 'সমাধান হয়েছে',
      'Received': 'গৃহীত',
      'Verified': 'যাচাইকৃত',
      'Assigned': 'বরাদ্দকৃত',
      'In Development': 'উন্নয়নাধীন',
      'Pilot': 'পাইলট',
      'Support': 'সমর্থন',
      'Supported': 'সমর্থিত',
      'Attach photo': 'ছবি যুক্ত করুন',
      'Attach video': 'ভিডিও যুক্ত করুন',
      'Attach doc': 'নথি যুক্ত করুন',
      'Voice note': 'ভয়েস নোট',
      'Attach location': 'অবস্থান যুক্ত করুন',
      'Water': 'পানি',
      'Infrastructure': 'অবকাঠামো',
      'Agriculture': 'কৃষি',
      'Education': 'শিক্ষা',
      'Health': 'স্বাস্থ্য',
      'Environment': 'পরিবেশ',
      'Other': 'অন্যান্য',
      'Language set to English': 'ভাষা ইংরেজিতে সেট করা হয়েছে',
      'Language set to Hindi': 'ভাষা হিন্দিতে সেট করা হয়েছে',
      'Language set to Khortha': 'ভাষা খোরঠায় সেট করা হয়েছে',
      'Language set to Bengali': 'ভাষা বাংলায় সেট করা হয়েছে',
      'Yes': 'হ্যাঁ',
      'No': 'না',
      'Dept Directory': 'বিভাগ নির্দেশিকা',
      'AI Routing': 'AI রাউটিং',
      'Department Directory': 'বিভাগ নির্দেশিকা',
      'AI Department Routing': 'AI বিভাগ রাউটিং',
      'Search departments…': 'বিভাগ খুঁজুন…',
      'Route a Report': 'রিপোর্ট রাউট করুন',
      'Select a report to route': 'রাউট করতে রিপোর্ট নির্বাচন করুন',
      'Route Now': 'এখন রাউট করুন',
      'Guided Tour': 'গাইডেড টুর',
      'Switch Role': 'ভূমিকা বদলান',
      'Ask SETU AI Assistant': 'SETU AI সহায়ককে জিজ্ঞাসা করুন',
      'Solution Library': 'সমাধান লাইব্রেরি',
      'Public Transparency': 'জনগণ স্বচ্ছতা',
      'NEP Credits': 'NEP ক্রেডিট',
      'Credits Earned via SETU Projects': 'SETU প্রকল্পের মাধ্যমে অর্জিত ক্রেডিট',
      'Certificates': 'প্রমাণপত্র',
      'Download Mock Certificate': 'নমুনা প্রমাণপত্র ডাউনলোড করুন',
      'Confirms Resolved': 'সমাধান নিশ্চিতকরণ',
      'Yes, confirmed': 'হ্যাঁ, নিশ্চিত',
      'No, reopen': 'না, পুনরায় খুলুন',
      'CSR Fit': 'CSR উপযুক্ততা',
      'Funding Range': 'তহবিল পরিসর',
      'Demo Helpline': 'ডেমো হেল্পলাইন',
      'Innovation': 'উদ্ভাবন',
      'Implementation': 'বাস্তবায়ন',
      'Policy': 'নীতি',
      'Resolution Rate': 'সমাধান হার',
      'Avg Response Time': 'গড় প্রতিক্রিয়া সময়',
      'Citizen Satisfaction': 'নাগরিক সন্তুষ্টি',
      'Departments Engaged': 'বিভাগ সংযুক্ত',
      'Report Classification': 'রিপোর্ট শ্রেণীবিভাগ',
      'Top 10 Districts by Reports': 'রিপোর্ট অনুসারে শীর্ষ 10 জেলা',
      'Realized Outcome Numbers': 'বাস্তবায়িত ফলাফল সংখ্যা',
      'Citizens benefited': 'উপকৃত নাগরিক',
      'Time saved per day': 'প্রতিদিন সাশ্রয়ী সময়',
      'Clean water treated (litres/day)': 'বিশুদ্ধ পানীয় জল পরিশোধিত (লিটার/দিন)',
      'CSR funds mobilized (₹)': 'সংগৃহীত CSR তহবিল (₹)',
      'Active projects': 'সক্রিয় প্রকল্প',
      'Problems resolved': 'সমাধানকৃত সমস্যা',
      'Escalate': 'উপরে পাঠান',
      'Route to Dept': 'বিভাগে পাঠান',
      'All Districts': 'সব জেলা',
      'Notification Preferences': 'সূচনা প্রাথমিকতা',
      'Similar solved problems found': 'সমান সমাধান সমস্যা পাওয়া গেছে',
    },
    // Khortha: genuine wording where confident; otherwise deliberately left
    // out of this dictionary so it falls through to the Hindi MT fallback
    // above rather than guessing.
    kh: {
      'Dashboard': 'डैशबोर्ड',
      'Report a Problem': 'दिक्कत बताव',
      'My Reports': 'हमर रिपोर्ट',
      'View Progress': 'प्रगति देख',
      'Profile': 'प्रोफ़ाइल',
      'Log in': 'लॉग इन करअ',
      'Sign up': 'साइन अप करअ',
      'Log out': 'लॉग आउट',
      'Cancel': 'रद्द करअ',
      'Submit report': 'रिपोर्ट भेजअ',
      'Submit': 'भेजअ',
      'Save': 'सहेजअ',
      'Close': 'बंद करअ',
      'New Report': 'नया रिपोर्ट',
      'Citizen': 'नागरिक',
      'Government / Reviewer': 'सरकार / समीक्षक',
      'University': 'विश्वविद्यालय',
      'Student': 'छात्र',
      'Industry Partner': 'उद्योग साझीदार',
      'Admin': 'व्यवस्थापक',
      'Yes': 'हव',
      'No': 'नाय',
      'Language set to Khortha': 'भाषा खोरठा म सेट भइल',
      'Dept Directory': 'विभाग देखअ',
      'AI Routing': 'AI रास्ता',
      'Solution Library': 'समाधान किताब',
      'Public Transparency': 'सबकर जानकारी',
      'Demo Helpline': 'डेमो हेल्पलाइन',
      'NEP Credits': 'NEP क्रेडिट',
      'Certificates': 'प्रमाण पत्र',
      'Confirms Resolved': 'समाधान पक्का',
      'Switch Role': 'भूमिका बदलअ',
      'All Districts': 'सब जिला',
      'Escalate': 'ऊपर भेजअ',
      'Realized Outcome Numbers': 'जमीन पर भइल नतीजा',
      'Citizens benefited': 'फायदा पावे वाला नागरिक',
      'Time saved per day': 'हर रोज बांचल समय',
      'Clean water treated (litres/day)': 'साफ पानी शोधन (लीटर/दिन)',
      'CSR funds mobilized (₹)': 'जुटाइल CSR फंड (₹)',
      'Active projects': 'चालू प्रोजेक्ट',
      'Problems resolved': 'हल भइल दिक्कत',
    },
  };

  // ---------------------------------------------------------------
  // State
  // ---------------------------------------------------------------
  let currentLang = localStorage.getItem(LANG_KEY) || 'en';
  let mtCache = {};
  try { mtCache = JSON.parse(localStorage.getItem(MT_CACHE_KEY) || '{}'); } catch (e) { mtCache = {}; }
  let saveTimer = null;
  function scheduleSaveCache() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(MT_CACHE_KEY, JSON.stringify(mtCache)); } catch (e) { /* ignore quota errors */ }
    }, 400);
  }

  let genToken = 0;
  let observer = null;
  let applyScheduled = false;

  function normalize(s) { return String(s).replace(/\s+/g, ' ').trim(); }

  function isTranslatable(s) {
    if (!s) return false;
    const t = normalize(s);
    if (!t) return false;
    if (!/[A-Za-z]/.test(t)) return false; // numbers, punctuation, or already non-Latin script
    if (/^[A-Z0-9][A-Z0-9\-_./#:]*$/.test(t) && t.length <= 14) return false; // IDs like RPT-1023
    return true;
  }

  function dictLookup(lang, text) {
    const d = DICT[lang];
    return d ? d[normalize(text)] : undefined;
  }

  function decodeEntities(str) {
    return str
      .replace(/&#39;/g, "'").replace(/&#x27;/g, "'")
      .replace(/&quot;/g, '"').replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  }

  // General-purpose pair translator (arbitrary source -> target), used both
  // by the offline-first UI translator below (always source 'en') and by
  // any feature that needs to translate free text the OTHER direction —
  // e.g. turning a citizen's spoken-Hindi voice note transcript into
  // English for reviewers. Same free, no-key MyMemory endpoint either way.
  function fetchTranslationPair(text, sourceLang, targetLang) {
    const url = `${MT_ENDPOINT}?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;
    return fetch(url).then(r => r.json()).then(data => {
      const out = data && data.responseData && data.responseData.translatedText;
      if (!out || /INVALID|MYMEMORY WARNING/i.test(out)) throw new Error('translation unavailable');
      return decodeEntities(out);
    });
  }

  function fetchTranslation(text, mtLang) {
    return fetchTranslationPair(text, 'en', mtLang);
  }

  // Public one-off translator (not memoized/cached like the UI walker above,
  // since callers like the voice-note transcript only need it once per
  // recording). sourceLang/targetLang are MyMemory language codes (e.g.
  // 'en', 'hi', 'bn') — for app language codes use LANG_META[lang].mt.
  // Resolves to the original text unchanged if source === target or the
  // text is empty; rejects if the MyMemory call fails so callers can
  // fall back gracefully (e.g. show the original-language text only).
  function translateText(text, targetLang, sourceLang) {
    sourceLang = sourceLang || 'en';
    if (!text || !normalize(text) || !targetLang || sourceLang === targetLang) {
      return Promise.resolve(text);
    }
    return fetchTranslationPair(text, sourceLang, targetLang);
  }

  // Small concurrency-limited queue so we don't fire 200 requests at once.
  function runQueue(tasks, limit) {
    limit = limit || 4;
    return new Promise(resolve => {
      if (!tasks.length) return resolve();
      let i = 0, active = 0, done = 0;
      function next() {
        while (active < limit && i < tasks.length) {
          const task = tasks[i++];
          active++;
          task().catch(() => {}).finally(() => {
            active--; done++;
            if (done === tasks.length) resolve(); else next();
          });
        }
      }
      next();
    });
  }

  function silentWrite(fn) {
    if (observer) observer.disconnect();
    try { fn(); } finally {
      if (observer) observer.observe(document.body, OBS_OPTS);
    }
  }

  function handleString(text, meta, applyFn, pending) {
    const d = dictLookup(currentLang, text);
    if (d !== undefined) { applyFn(d); return; }

    const ck = currentLang + '::' + normalize(text);
    if (mtCache[ck] !== undefined) { applyFn(mtCache[ck]); return; }

    if(typeof console !== 'undefined' && console.warn) console.warn('[i18n] Missing key:', text);

    if (!meta.mt) return; // no MT target for this language (shouldn't happen for en)

    pending.push({
      task(myToken) {
        return fetchTranslation(text, meta.mt).then(out => {
          mtCache[ck] = out;
          scheduleSaveCache();
          if (myToken === genToken) silentWrite(() => applyFn(out));
        });
      },
    });
  }

  function walkTextNodes(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const p = node.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest('script, style, [data-no-translate]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    return nodes;
  }

  const TRANSLATABLE_ATTRS = ['placeholder', 'aria-label', 'title'];

  function applyAll(root) {
    root = root || document.body;
    if (currentLang === 'en') { restoreOriginals(root); return; }
    const meta = LANG_META[currentLang];
    const pending = [];
    const myToken = ++genToken;

    silentWrite(() => {
      walkTextNodes(root).forEach(node => {
        if (node.__i18nOrig === undefined) node.__i18nOrig = node.nodeValue;
        const orig = node.__i18nOrig;
        if (!isTranslatable(orig)) return;
        handleString(orig, meta, translated => { node.nodeValue = translated; }, pending);
      });

      root.querySelectorAll(TRANSLATABLE_ATTRS.map(a => `[${a}]`).join(',')).forEach(el => {
        if (el.closest('[data-no-translate]')) return;
        TRANSLATABLE_ATTRS.forEach(attr => {
          if (!el.hasAttribute(attr)) return;
          const storeKey = '__i18nOrig_' + attr;
          if (el[storeKey] === undefined) el[storeKey] = el.getAttribute(attr);
          const orig = el[storeKey];
          if (!isTranslatable(orig)) return;
          handleString(orig, meta, translated => { el.setAttribute(attr, translated); }, pending);
        });
      });
    });

    if (pending.length) {
      runQueue(pending.map(p => () => p.task(myToken)));
    }
  }

  function restoreOriginals(root) {
    silentWrite(() => {
      walkTextNodes(root).forEach(node => {
        if (node.__i18nOrig !== undefined) node.nodeValue = node.__i18nOrig;
      });
      root.querySelectorAll('*').forEach(el => {
        TRANSLATABLE_ATTRS.forEach(attr => {
          const storeKey = '__i18nOrig_' + attr;
          if (el[storeKey] !== undefined) el.setAttribute(attr, el[storeKey]);
        });
      });
    });
  }

  // ---------------------------------------------------------------
  // MutationObserver safety net — catches anything a render-*.js file
  // (or future feature) writes to the DOM, without needing to hook
  // every call site individually.
  // ---------------------------------------------------------------
  const OBS_OPTS = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: TRANSLATABLE_ATTRS };
  let debounceTimer = null;
  function setupObserver() {
    observer = new MutationObserver(() => {
      if (currentLang === 'en') return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => applyAll(document.body), 120);
    });
    observer.observe(document.body, OBS_OPTS);
  }

  // ---------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------
  function getLang() { return currentLang; }

  function setLang(lang, opts) {
    opts = opts || {};
    if (!LANG_META[lang]) return;
    currentLang = lang;
    localStorage.setItem(LANG_KEY, lang);
    document.documentElement.setAttribute('lang', LANG_META[lang].code);

    // Toggle pill UI
    const el = document.getElementById('lang-toggle');
    if (el) {
      el.dataset.active = lang;
      el.querySelectorAll('.lang-toggle-opt').forEach(btn => {
        btn.setAttribute('aria-selected', String(btn.dataset.lang === lang));
      });
    }

    // Re-render the current app view (if logged in) so dynamic content is
    // regenerated from its true English source before translation runs.
    if (typeof global.renderApp === 'function' && typeof global.DB !== 'undefined' && DB.getSession && DB.getSession()) {
      try { global.renderApp(); } catch (e) { /* ignore */ }
    }

    applyAll(document.body);

    if (opts.announce && typeof global.toast === 'function') {
      const msg = dictLookup(lang, `Language set to ${LANG_META[lang].label}`) || `Language set to ${LANG_META[lang].label}`;
      global.toast(msg);
    }
  }

  function init() {
    const el = document.getElementById('lang-toggle');
    if (el) {
      el.querySelectorAll('.lang-toggle-opt').forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.dataset.lang, { announce: true }));
      });
    }
    setupObserver();
    setLang(currentLang);
  }

  global.I18N = { init, setLang, getLang, applyAll, LANG_META, translateText };
})(window);
