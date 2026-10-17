import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import {v3Page} from '../../cloudflare/v3-page.mjs';
const root=resolve('app');
const mime={'.css':'text/css','.js':'text/javascript','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
export function previewServer(){return createServer(async(req,res)=>{
 const u=new URL(req.url,'http://localhost');
 if(u.pathname==='/qa'){
  res.writeHead(200,{'content-type':'text/html; charset=utf-8'});
  res.end(`<!doctype html><html><head><title>Habit Hero responsive review</title><style>body{background:#dce7dd;font:14px system-ui;margin:16px}.grid{display:flex;align-items:flex-start;gap:16px;width:max-content}iframe{border:1px solid #a4b7a6;border-radius:18px;background:#fbfaf5;height:900px}h2{font-size:14px}</style></head><body><h1>Habit Hero · Playful · phone layouts</h1><div class="grid">${[320,390,430,768].map(width=>`<section><h2>${width}px</h2><iframe title="${width}px" width="${width}" src="/habit-hero/v3/preview/"></iframe></section>`).join('')}</div></body></html>`);return;
 }
 if(/^\/habit-hero\/v3\/(child|preview)\/?$/.test(u.pathname)){const page=v3Page(u.pathname.includes('/preview'));page.headers.set('content-security-policy',page.headers.get('content-security-policy').replace("frame-ancestors 'none'","frame-ancestors 'self'"));res.writeHead(200,Object.fromEntries(page.headers));res.end(await page.text());return;}
 if(u.pathname.startsWith('/habit-hero/app/')){const file=resolve(root,decodeURIComponent(u.pathname.slice('/habit-hero/app/'.length)));if(file.startsWith(root+'/')&&existsSync(file)&&statSync(file).isFile()){res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream'});res.end(readFileSync(file));return;}}
 if(u.pathname.startsWith('/api/')){res.writeHead(401,{'content-type':'application/json'});res.end('{"detail":"Not authenticated"}');return;}
 res.writeHead(404);res.end('Not found');
});}
if(process.argv[1]===fileURLToPath(import.meta.url)){const server=previewServer();server.listen(4173,'127.0.0.1',()=>console.log('Habit Hero v3: http://127.0.0.1:4173/habit-hero/v3/preview/'));}
