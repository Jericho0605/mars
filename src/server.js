import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {recommendV2} from './recommend-v2.js';
import {roadRoute} from './routing.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function createServer({vehicles=JSON.parse(fs.readFileSync(path.join(root,'data/vehicles.json'))),routeImpl=roadRoute}={}){
 return http.createServer(async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  const json=(value,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname.startsWith('/api/')){
    if(url.pathname==='/api/health'&&req.method==='GET'){json({ok:true,vehicleCount:vehicles.length});return;}
    if(!['/api/recommend','/api/route'].includes(url.pathname)){json({error:'Not found'},404);return;}
    if(req.method!=='POST'){json({error:'POST required'},405);return;}
    const origin=req.headers.origin;if(origin&&new URL(origin).host!==req.headers.host){json({error:'Cross-origin request refused'},403);return;}
    let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>20000){json({error:'Request too large'},413);return;}}
    const input=JSON.parse(body||'{}');
    if(url.pathname==='/api/recommend'){json(recommendV2(vehicles,input));return;}
    try{json(await routeImpl(input));}catch(e){json({error:e.message},/consent|Coordinates/.test(e.message)?400:503);}return;
   }
   if(req.method!=='GET'&&req.method!=='HEAD'){json({error:'GET required'},405);return;}
   const files={'/':'web/index.html','/vehicles.json':'web/vehicles.json','/app.js':'web/app.js','/style.css':'web/style.css','/recommend.js':'src/recommend.js','/profile.js':'src/profile.js','/cost.js':'src/cost.js','/scenarios.js':'src/scenarios.js','/coverage.json':'data/coverage.json','/vehicle-media.js':'src/vehicle-media.js','/vehicle-media.json':'data/vehicle-media.json'};
   for(const key of ['prius','priusPhev','corollaHatchback','corolla','corollaCross','leaf','maverick','hondaCrv','hondaCivicSedan'])for(const ext of ['jpg','png','webp']){const image=`web/images/${key}.${ext}`;if(fs.existsSync(path.join(root,image)))files[`/images/${key}.${ext}`]=image;}
   files['/media.css']='web/media.css';
   files['/selection.js']='src/selection.js';
   files['/image-resolver.js']='src/image-resolver.js';
   files['/selection.css']='web/selection.css';
   files['/vehicle-types.js']='web/vehicle-types.js';
   files['/vehicle-types.css']='web/vehicle-types.css';
   for(const type of ['sedan','hatchback','suv','minivan','pickup','sports-car'])files[`/images/car-types/${type}.png`]=`web/images/car-types/${type}.png`;
   const file=files[url.pathname];if(!file){json({error:'Not found'},404);return;}
   res.setHeader('Content-Type',file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.png')?'image/png':file.endsWith('.webp')?'image/webp':'application/json');
   res.end(req.method==='HEAD'?undefined:fs.readFileSync(path.join(root,file)));
  }catch(e){json({error:e instanceof SyntaxError?'Invalid JSON':e.message},400);}
 });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT??3000),server=createServer();
 server.on('error',e=>{console.error(`Server failed: ${e.message}`);process.exitCode=1;});
 server.listen(port,'127.0.0.1',()=>console.log(`DriveWise: http://127.0.0.1:${server.address().port}`));
}
