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

// Playful activity badges: editable vector icons, never cropped scene thumbnails.
let badgeSequence=0;
export function habitIcon(name){
 const id='habit-'+(++badgeSequence),paint=color=>`url(#${id}-${color})`;
 const gold=paint('gold'),pink=paint('pink'),mint=paint('mint'),purple=paint('purple');
 const shapes={
  bed:`<ellipse cx="32" cy="54" rx="24" ry="4" fill="#bf9365" opacity=".18"/><rect x="8" y="18" width="7" height="37" rx="3.5" fill="${gold}" stroke="#c79344" stroke-width="1.2"/><path d="M14 30h34a8 8 0 0 1 8 8v12H14Z" fill="#fffcf2" stroke="#dbbf84" stroke-width="1.3"/><rect x="18" y="25" width="15" height="10" rx="4" fill="${mint}" stroke="#76bcb0" stroke-width="1"/><path d="M34 31h13a9 9 0 0 1 9 9v8H14V35h20Z" fill="${pink}" stroke="#ce81a9" stroke-width="1.2"/><path d="M38 35v10m7-9v9m-7-5h13" stroke="#fff7" stroke-width="1.5"/><rect x="10" y="46" width="47" height="6" rx="3" fill="${gold}"/><rect x="49" y="41" width="7" height="15" rx="3.5" fill="${gold}" stroke="#c79344" stroke-width="1.2"/><circle cx="11.5" cy="17" r="4" fill="#ffe6a4" stroke="#d8ac5e" stroke-width="1"/>`,
  brush:`<ellipse cx="31" cy="56" rx="17" ry="3" fill="#6ca8a3" opacity=".15"/><g transform="rotate(24 32 32)"><rect x="28" y="25" width="9" height="31" rx="4.5" fill="${mint}" stroke="#4caca0" stroke-width="1.2"/><path d="M31 32v17" stroke="#fff9" stroke-width="2"/><rect x="24" y="9" width="17" height="22" rx="6" fill="${purple}" stroke="#9680c2" stroke-width="1.2"/><rect x="24" y="8" width="13" height="18" rx="4" fill="#fffdf5"/><path d="M27 11v12m4-12v12m4-12v12" stroke="#b3e3dd" stroke-width="2.2"/></g><circle cx="13" cy="17" r="5" fill="#fff" stroke="#a3d8dc" stroke-width="1.5"/><circle cx="48" cy="35" r="4" fill="#fff" stroke="#c8b5e9" stroke-width="1.5"/><circle cx="17" cy="32" r="2.5" fill="#f5c2d8"/>`,
  read:`<ellipse cx="32" cy="54" rx="25" ry="4" fill="#8c77aa" opacity=".16"/><path d="M7 18q12-4 25 2 13-6 25-2v32q-14-3-25 3-12-6-25-3Z" fill="${purple}" stroke="#8d71b3" stroke-width="1.4"/><path d="M11 16q10-2 21 4v29q-11-6-21-4Zm42 0q-10-2-21 4v29q11-6 21-4Z" fill="#fff9e8" stroke="#e9d8b5" stroke-width="1.2"/><path d="M16 25q5 0 10 2m-10 5 10 2m-10 5 7 2" stroke="#d4c5e7" stroke-width="2.3"/><path d="m43 25 2.5 5 5.5.8-4 4 .9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-4 5.5-.8Z" fill="${gold}" stroke="#dbb14e" stroke-width="1"/><path d="M32 21v27" stroke="#dfcba4" stroke-width="1.3"/><path d="M17 15v12l4-3 4 3V17" fill="${pink}"/>`,
  outdoor:`<ellipse cx="32" cy="54" rx="23" ry="5" fill="#a7ce7e" opacity=".5"/><path d="M28 31h8v23h-8Z" fill="${gold}" stroke="#b79552" stroke-width="1"/><path d="m32 39 9-7m-9 2-9-6" stroke="#b79552" stroke-width="2"/><path d="M20 37C7 38 6 21 18 19 16 7 32 5 38 15c13-5 22 14 9 20-5 5-12 5-16 1-3 3-7 3-11 1Z" fill="${mint}" stroke="#60ad7b" stroke-width="1.3"/><path d="M18 21q2-8 10-7" stroke="#efffd2" stroke-width="3" fill="none"/><circle cx="20" cy="45" r="3" fill="${pink}"/><circle cx="44" cy="48" r="3" fill="${pink}"/><circle cx="20" cy="45" r="1" fill="#fff3b0"/>`,
  sparkles:`<ellipse cx="32" cy="55" rx="18" ry="3" fill="#d4a954" opacity=".15"/><path d="m32 8 7 14 16 2.5-11.5 11 2.8 16L32 44l-14.3 7.5 2.8-16L9 24.5 16 22Z" fill="${gold}" stroke="#d7aa45" stroke-width="1.5"/><path d="m32 14 4.5 10-10 2" stroke="#fff7cc" stroke-width="3" fill="none"/><circle cx="9" cy="13" r="3" fill="${pink}"/><circle cx="55" cy="45" r="3" fill="${purple}"/><path d="M52 10v7m-3.5-3.5h7" stroke="#8bc8ba" stroke-width="2"/>`
 };
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 64 64');svg.setAttribute('aria-hidden','true');svg.classList.add('habit-icon');
 svg.innerHTML=`<defs><linearGradient id="${id}-gold" x2=".3" y2="1"><stop stop-color="#fff2a6"/><stop offset="1" stop-color="#efb94f"/></linearGradient><linearGradient id="${id}-pink" x2=".3" y2="1"><stop stop-color="#ffdae8"/><stop offset="1" stop-color="#e799c5"/></linearGradient><linearGradient id="${id}-mint" x2=".3" y2="1"><stop stop-color="#c0efb8"/><stop offset="1" stop-color="#65c8b0"/></linearGradient><linearGradient id="${id}-purple" x2=".3" y2="1"><stop stop-color="#dcccf8"/><stop offset="1" stop-color="#ac8bd9"/></linearGradient></defs>${shapes[name]||shapes.sparkles}`;
 return svg;
}
