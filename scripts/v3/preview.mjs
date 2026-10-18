import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {householdPage} from '../../cloudflare/household-page.mjs';
import {v3ParentPage} from '../../cloudflare/v3-parent-page.mjs';
import {v3Page} from '../../cloudflare/v3-page.mjs';
const root=resolve('app');
const mime={'.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
export function previewServer(){return createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');
 if(/^\/habit-hero\/v3\/(parent|parent-preview)\/?$/.test(u.pathname)){const page=v3ParentPage(u.pathname.includes('parent-preview'));page.headers.set('content-security-policy',page.headers.get('content-security-policy').replace("frame-ancestors 'none'","frame-ancestors 'self'"));res.writeHead(200,Object.fromEntries(page.headers));let html=await page.text();if(u.searchParams.has('qa'))html=html.replace('</body>','<script type="module" src="/parent-metrics.js"></script></body>');res.end(html);return;}
 if(u.pathname==='/qa-phone'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});res.end('<!doctype html><html><body style="margin:0"><iframe title="Child phone layout" style="border:0;width:390px;height:940px" src="/habit-hero/v3/preview/?qa=1#home"></iframe></body></html>');return;}
 if(u.pathname==='/qa-parent'){
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
  const width=Number(u.searchParams.get('width'))||390;
  res.end(`<!doctype html><html><head><title>Parent responsive review</title></head><body style="margin:0;background:#ddd"><iframe title="Parent layout" style="border:0;width:${[320,390,768,1280].includes(width)?width:390}px;height:940px" src="/habit-hero/v3/parent-preview/?qa=parent"></iframe><pre id="metrics"></pre><script>addEventListener('message',e=>{if(e.origin===location.origin)document.getElementById('metrics').textContent=JSON.stringify(e.data)});</script></body></html>`);return;
 }
 if(u.pathname==='/qa'){
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
  const view=['home','messages'].includes(u.searchParams.get('view'))?u.searchParams.get('view'):'home';
  const requested=Number(u.searchParams.get('width')),widths=[320,390,430,768,1024,1280].includes(requested)?[requested]:[320,390,768,1280];
  res.end(`<!doctype html><html><head><title>Habit Hero responsive review</title><style>body{background:#dce7dd;font:14px system-ui;margin:16px}.grid{display:flex;align-items:flex-start;gap:16px;width:max-content}iframe{border:1px solid #a4b7a6;border-radius:18px;background:#fbfaf5;height:900px}h2{font-size:14px}pre{white-space:pre-wrap;max-width:850px;font:12px/1.5 monospace}</style></head><body><h1>Habit Hero · responsive review</h1><pre id="results">Waiting for layouts…</pre><div class="grid">${widths.map(width=>`<section><h2>${width}px</h2><iframe title="${width}px" width="${width}" src="/habit-hero/v3/preview/?qa=1#${view}"></iframe></section>`).join('')}</div><script>const results=new Map();addEventListener('message',event=>{if(event.origin!==location.origin||event.data?.type!=='habit-hero-layout')return;results.set(event.data.width,event.data);document.getElementById('results').textContent=Array.from(results.values()).sort((a,b)=>a.width-b.width).map(value=>JSON.stringify(value)).join(' | ');});</script></body></html>`);return;
 }
 if(u.pathname==='/parent-metrics.js'){res.writeHead(200,{'content-type':'text/javascript'});res.end(`setTimeout(()=>parent.postMessage({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,nav:getComputedStyle(document.querySelector('nav')).display,cards:document.querySelectorAll('.card').length,bodyFont:getComputedStyle(document.body).fontSize,introFont:getComputedStyle(document.querySelector('.intro')).fontSize,switchHeight:document.getElementById('parentSwitch').getBoundingClientRect().height,switchFont:getComputedStyle(document.getElementById('parentSwitch')).fontSize},location.origin),800);`);return;}
 if(u.pathname==='/qa-metrics.js'){res.writeHead(200,{'content-type':'text/javascript'});res.end(readFileSync(resolve('scripts/v3/qa-metrics.js')));return;}
 if(u.pathname==='/qa-switch'){const page=householdPage();res.writeHead(200,Object.fromEntries(page.headers));res.end((await page.text()).replaceAll('/habit-hero/v3/child/#home','/habit-hero/v3/preview/#home'));return;}
 if(u.pathname==='/api/child/pin/status'){res.writeHead(200,{'content-type':'application/json'});res.end('{"requires_pin":true}');return;}
 if(u.pathname==='/api/household'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({setup:false,parent_name:'Preview parent',has_parent_pin:true,children:[{id:'preview-child',display_name:'Preview child'}]}));return;}
 if(/^\/habit-hero\/v3\/(child|preview)\/?$/.test(u.pathname)){const page=v3Page(u.pathname.includes('/preview'));page.headers.set('content-security-policy',page.headers.get('content-security-policy').replace("frame-ancestors 'none'","frame-ancestors 'self'"));res.writeHead(200,Object.fromEntries(page.headers));let html=await page.text();if(u.searchParams.has('qa'))html=html.replace('</body>','<script type="module" src="/qa-metrics.js"></script></body>');res.end(html);return;}
 if(u.pathname.startsWith('/habit-hero/app/')){const file=resolve(root,decodeURIComponent(u.pathname.slice('/habit-hero/app/'.length)));if(file.startsWith(root+'/')&&existsSync(file)&&statSync(file).isFile()){res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file));return;}}
 if(u.pathname.startsWith('/api/')){res.writeHead(401,{'content-type':'application/json'});res.end('{"detail":"Not authenticated"}');return;}
 res.writeHead(404);res.end('Not found');
});}
if(process.argv[1]===fileURLToPath(import.meta.url)){const server=previewServer();server.listen(4173,'127.0.0.1',()=>console.log('Habit Hero v3: http://127.0.0.1:4173/habit-hero/v3/preview/'));}
