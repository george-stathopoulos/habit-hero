// Interface symbols only. The world and characters use separate illustrated assets.
const paths={
 home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
 missions:'<rect x="5" y="5" width="14" height="16" rx="3"/><path d="M9 5V3h6v2M9 11h6m-6 5h6"/>',
 gift:'<rect x="3" y="9" width="18" height="4" rx="1"/><path d="M5 13v8h14v-8M12 9v12"/><path d="M12 9H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z"/>',
 shield:'<path d="m12 3 8 3v6c0 5-8 10-8 10S4 17 4 12V6Z"/><path d="m9 12 2 2 4-5"/>',
 message:'<path d="M21 11a8 8 0 0 1-8 8H7l-4 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/><path d="M7 8h10M7 12h7"/>',
 bell:'<path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 8H3c0-1 3-1 3-8Zm4 12h4"/>',
 switch:'<path d="M16 4h4v4m0-4-6 6M8 20H4v-4m0 4 6-6"/><circle cx="7" cy="7" r="3"/><path d="M2 14c0-3 2-4 5-4m10 4a3 3 0 1 1 0 6m-4 2c0-3 2-5 5-5"/>',
 star:'<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
 heart:'<path d="M12 21S2 15 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 7-10 13-10 13Z"/>',
 arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',back:'<path d="M20 12H4m6-6-6 6 6 6"/>',
 check:'<path d="m5 12 4 4L19 6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 bed:'<path d="M3 7v14m18-10v10M3 17h18M3 11h18v6H3Z"/><path d="M6 11V7h5v4m0 0V7h7v4"/>',
 brush:'<path d="m7 20 8-12 4 3-8 12M14 8l3-5 5 3-3 5m-2-6 3 2"/>',
 read:'<path d="M12 5C8 2 3 3 2 4v15c3-2 7-1 10 1 3-2 7-3 10-1V4c-3-2-7-2-10 1Zm0 0v15M5 7l4 1M5 11l4 1m6-4 4-1m-4 5 4-1"/>',
 outdoor:'<path d="M12 3 5 13h4l-5 6h16l-5-6h4ZM12 19v3"/>',
 sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>'
};
export function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.innerHTML=paths[name]||paths.sparkles;return svg;}
