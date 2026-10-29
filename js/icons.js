/* ============================================================
   SETU — Inline SVG icon helper
   Usage: icon('camera', 18)
   ============================================================ */

const ICONS = {
  grid: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',
  report: '<path d="M9 2h6l1 3h3v16H5V5h3l1-3z"/><path d="M9 9h6M9 13h6M9 17h3" stroke-linecap="round"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
  user: '<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  camera: '<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>',
  mic: '<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" stroke-linecap="round"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" stroke-linecap="round"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z"/>',
  check: '<path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/>',
  checkCircle: '<circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6" stroke-linecap="round" stroke-linejoin="round"/>',
  x: '<path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>',
  plus: '<path d="M12 5v14M5 12h14" stroke-linecap="round"/>',
  bell: '<path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 01-3.4 0" stroke-linecap="round"/>',
  logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5M21 12H9" stroke-linecap="round" stroke-linejoin="round"/>',
  building: '<path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18"/><path d="M10 6h4M10 10h4M10 14h4M6 22h12"/>',
  flag: '<path d="M4 22V4"/><path d="M4 4h13l-2 4 2 4H4"/>',
  users: '<path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>',
  graduationCap: '<path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
  handshake: '<path d="M12 8l-4 4 4 4 4-4-4-4z"/><path d="M2 12l4-4M22 12l-4-4M2 16l4 4M22 16l-4 4"/>',
  crown: '<path d="M2 18h20l-2-9-5 4-3-7-3 7-5-4z"/><path d="M4 21h16"/>',
  sparkles: '<path d="M12 3l1.7 5.1a2 2 0 001.2 1.2L20 11l-5.1 1.7a2 2 0 00-1.2 1.2L12 19l-1.7-5.1a2 2 0 00-1.2-1.2L4 11l5.1-1.7a2 2 0 001.2-1.2L12 3z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.3-4.3" stroke-linecap="round"/>',
  chevronRight: '<path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/>',
  chevronDown: '<path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>',
  arrowRight: '<path d="M5 12h14M12 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/>',
  filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  layers: '<path d="M12 2l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5M3 17l9 5 9-5"/>',
  briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>',
  microscope: '<path d="M6 18h8M7 18v-4M10 2v4M14 2v4M7 14h10M12 6a4 4 0 014 4v1a4 4 0 01-4 4"/>',
  droplet: '<path d="M12 2s7 8 7 13a7 7 0 01-14 0c0-5 7-13 7-13z"/>',
  leaf: '<path d="M11 20A7 7 0 019.8 6.1C15.5 5 17 4.48 20 3c0 8.66-2 14-9 17z"/><path d="M2 21c0-9 4-13 4-13"/>',
  trend: '<path d="M23 6l-9.5 9.5-5-5L1 18" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 6h6v6"/>',
  bulb: '<path d="M9 18h6M10 22h4M12 2a6 6 0 00-4.5 10.5c.7.7 1.5 1.7 1.5 2.5h6c0-.8.8-1.8 1.5-2.5A6 6 0 0012 2z"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-linecap="round" stroke-linejoin="round"/>',
  upload: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16" stroke-linecap="round" stroke-linejoin="round"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M17 5h3a2 2 0 01-2 4h-1M7 5H4a2 2 0 002 4h1"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" stroke-linecap="round"/>',
  wifi: '<path d="M5 12.5a11 11 0 0114 0M8.5 16a6 6 0 017 0" stroke-linecap="round"/><circle cx="12" cy="19" r="1" fill="currentColor" stroke="none"/>',
  play: '<path d="M6 3l14 9-14 9V3z"/>',
  volume: '<path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" stroke-linecap="round"/>',
  file: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>',
  route: '<circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M12 19h4.5a3.5 3.5 0 000-7h-9a3.5 3.5 0 010-7H12" stroke-linecap="round"/>',
};

function icon(name, size=18, extraAttrs=''){
  const body = ICONS[name] || ICONS.grid;
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" ${extraAttrs}>${body}</svg>`;
}
