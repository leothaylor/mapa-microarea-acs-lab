/* Domínio local: apenas dados sintéticos. Sem rede. */
(function(root){
'use strict';
const demo=[
[1,-22.8705,-43.3446,'A','HAS'],[2,-22.8700,-43.3437,'A','Diabetes'],[3,-22.8695,-43.3430,'A','Criança'],
[4,-22.8697,-43.3424,'A','Gestante'],[5,-22.8691,-43.3442,'A','HAS'],[6,-22.8687,-43.3434,'A','Diabetes'],
[7,-22.8688,-43.3419,'B','Criança'],[8,-22.8691,-43.3414,'B','HAS'],[9,-22.8697,-43.3417,'B','Diabetes'],
[10,-22.8704,-43.3412,'B','Gestante'],[11,-22.8708,-43.3407,'B','HAS'],[12,-22.8685,-43.3405,'B','Criança'],
[13,-22.8681,-43.3394,'C','Diabetes'],[14,-22.8690,-43.3397,'C','HAS'],[15,-22.8695,-43.3390,'C','Gestante'],
[16,-22.8703,-43.3396,'C','Criança'],[17,-22.8706,-43.3388,'C','Diabetes'],[18,-22.8683,-43.3387,'C','HAS']
].map(a=>({id:a[0],lat:a[1],lng:a[2],sector:a[3],category:a[4]}));
const areas=[
{id:'A',coords:[[-22.8714,-43.3457],[-22.8680,-43.3455],[-22.8680,-43.3425],[-22.8713,-43.3421]]},
{id:'B',coords:[[-22.8713,-43.3421],[-22.8680,-43.3425],[-22.8678,-43.3403],[-22.8716,-43.3402]]},
{id:'C',coords:[[-22.8716,-43.3402],[-22.8678,-43.3403],[-22.8675,-43.3378],[-22.8719,-43.3374]]}
];
const categories={'HAS':['#dc815c','H'],'Diabetes':['#8169c7','D'],'Gestante':['#d579a7','G'],'Criança':['#328fa4','C']};

const KEY='rotina-acs-lab-map-v01';
const validMonth=m=>typeof m==='string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
const symbols=['H','D','G','C','●','◆','▲','■','★'];
const fresh=()=>({version:3,points:demo.map(p=>({...p,categories:[p.category]})),categories:Object.fromEntries(Object.entries(categories).map(([id,c])=>[id,[...c,id]])),visits:{'2026-10':[1,2,3,7,9,13,14,17]},route:[],month:'2026-10',mode:'routine',groups:[],records:{},nextPointId:19});
function normalize(raw){
 if(!raw || !Array.isArray(raw.points) || !raw.visits || typeof raw.visits!=='object' || !Array.isArray(raw.route)) throw Error('Formato local inválido');
 const groupEntries=raw.version>=3&&raw.categories&&typeof raw.categories==='object'?Object.entries(raw.categories):Object.entries(fresh().categories);
 const groups=Object.fromEntries(groupEntries.filter(([id,c])=>/^[\p{L}\p{N}_-]{1,40}$/u.test(id)&&Array.isArray(c)&&/^#[0-9a-f]{6}$/i.test(c[0])&&symbols.includes(c[1])&&typeof c[2]==='string'&&c[2].trim().length>0&&c[2].length<=32));
 const ids=new Set();
 const points=raw.points.filter(p=>p && Number.isSafeInteger(p.id) && p.id>0 && !ids.has(p.id) && Number.isFinite(p.lat) && Math.abs(p.lat)<=85 && Number.isFinite(p.lng) && Math.abs(p.lng)<=180 && (ids.add(p.id),true)).map(p=>({id:p.id,lat:p.lat,lng:p.lng,sector:areas.some(s=>s.id===p.sector)?p.sector:null,categories:[...new Set((Array.isArray(p.categories)?p.categories:[p.category]).filter(id=>Object.hasOwn(groups,id)))]}));
 const clean=list=>[...new Set(list.filter(id=>ids.has(id)))];
 const visits=Object.fromEntries(Object.entries(raw.visits).filter(([m,v])=>validMonth(m)&&Array.isArray(v)).map(([m,v])=>[m,clean(v)]));
 const records=Object.fromEntries(Object.entries(raw.records||{}).filter(([key,r])=>{const [m,id]=key.split(':');return validMonth(m)&&ids.has(Number(id))&&visits[m]?.includes(Number(id))&&r&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&['routine','action'].includes(r.type);}).map(([key,r])=>[key,{date:r.date,type:r.type}]));
 return {...fresh(),points,categories:groups,visits,route:clean(raw.route),month:validMonth(raw.month)?raw.month:'2026-10',mode:raw.mode==='action'?'action':'routine',groups:[...new Set((Array.isArray(raw.groups)?raw.groups:[raw.group]).filter(id=>Object.hasOwn(groups,id)))],records,nextPointId:Math.max(Number.isSafeInteger(raw.nextPointId)?raw.nextPointId:1,...points.map(p=>p.id+1),1)};
}
function visible(state){return state.points.filter(p=>state.mode==='action'&&!state.groups.length?false:!state.groups.length||p.categories.some(id=>state.groups.includes(id)));}
function putPoint(state,input,id){
 if(!Number.isFinite(input.lat)||Math.abs(input.lat)>85||!Number.isFinite(input.lng)||Math.abs(input.lng)>180)throw Error('Coordenadas inválidas. Latitude: -85 a 85; longitude: -180 a 180.');
 const point={id:id||state.nextPointId,lat:input.lat,lng:input.lng,sector:findSector(input),categories:[...new Set(input.categories.filter(key=>Object.hasOwn(state.categories,key)))]};
 if(id){const i=state.points.findIndex(p=>p.id===id);if(i<0)throw Error('Ponto não encontrado.');state.points[i]=point;}else{state.nextPointId++;state.points.push(point);}return point;
}
function deletePoint(state,id){state.points=state.points.filter(p=>p.id!==id);state.route=state.route.filter(x=>x!==id);for(const m of Object.keys(state.visits))state.visits[m]=state.visits[m].filter(x=>x!==id);for(const key of Object.keys(state.records))if(key.endsWith(':'+id))delete state.records[key];}
function deleteGroup(state,id){delete state.categories[id];state.groups=state.groups.filter(x=>x!==id);state.points.forEach(p=>{p.categories=p.categories.filter(x=>x!==id);});}
function putGroup(state,{name,color,symbol},id){
 name=name.trim();if(!name||name.length>32)throw Error('Use um rótulo de grupo simulado com 1 a 32 caracteres.');
 if(!/^#[0-9a-f]{6}$/i.test(color)||!symbols.includes(symbol))throw Error('Cor ou símbolo inválido.');
 if(Object.entries(state.categories).some(([key,c])=>key!==id&&c[2].toLocaleLowerCase()===name.toLocaleLowerCase()))throw Error('Já existe um grupo com esse rótulo.');
 if(!id){let i=1;while(Object.hasOwn(state.categories,'grupo-'+i))i++;id='grupo-'+i;}state.categories[id]=[color,symbol,name];return id;
}
function visited(state,id){return (state.visits[state.month]||[]).includes(id);}
function toggleVisit(state,id,now=new Date()){
 if(!state.points.some(p=>p.id===id))return;
 const values=new Set(state.visits[state.month]||[]);
 const key=state.month+':'+id;
 if(values.has(id)){values.delete(id);delete state.records[key];}
 else{values.add(id);state.records[key]={date:now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'),type:state.mode};}
 state.visits[state.month]=[...values];
}
function toggleRoute(state,id){if(!state.points.some(p=>p.id===id))return;state.route=state.route.includes(id)?state.route.filter(x=>x!==id):[...state.route,id];}
function moveRoute(state,id,delta){const i=state.route.indexOf(id),j=i+delta;if(i<0||j<0||j>=state.route.length)return;[state.route[i],state.route[j]]=[state.route[j],state.route[i]];}
function findSector(loc){for(const s of areas){let inside=false;for(let i=0,j=s.coords.length-1;i<s.coords.length;j=i++){const yi=s.coords[i][0],xi=s.coords[i][1],yj=s.coords[j][0],xj=s.coords[j][1];if(((yi>loc.lat)!==(yj>loc.lat))&&(loc.lng<(xj-xi)*(loc.lat-yi)/(yj-yi)+xi))inside=!inside;}if(inside)return s.id;}return null;}
const api={KEY,areas,categories,symbols,fresh,normalize,visible,visited,toggleVisit,toggleRoute,moveRoute,findSector,putPoint,deletePoint,putGroup,deleteGroup};
if(typeof module!=='undefined')module.exports=api;else root.Lab=api;
})(typeof window!=='undefined'?window:globalThis);
