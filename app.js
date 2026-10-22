/* Rotina ACS LAB. Somente pontos artificiais e nenhuma informação identificável. */
(function(){
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
const names=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const storeKey='rotina-acs-lab-map-v01';
const $=id=>document.getElementById(id);
let state={points:demo,visits:{'2026-10':[1,2,3,7,9,13,14,17]},route:[]};
let month='2026-10',group=null,mode='routine',showAreas=true,adding=false;
try{
const obj=JSON.parse(localStorage.getItem(storeKey)||'null');
if(obj&&Array.isArray(obj.points)&&obj.visits&&Array.isArray(obj.route)){
const valid=p=>p&&Number.isSafeInteger(p.id)&&Number.isFinite(p.lat)&&Number.isFinite(p.lng)&&p.lat>-22.873&&p.lat< -22.866&&p.lng>-43.347&&p.lng< -43.336&&['A','B','C'].includes(p.sector)&&Object.prototype.hasOwnProperty.call(categories,p.category);
state.points=obj.points.filter(valid).slice(0,300);
if(!state.points.length)state.points=demo;
state.visits=Object.fromEntries(Object.entries(obj.visits).filter(x=>/^\d{4}-(0[1-9]|1[0-2])$/.test(x[0])&&Array.isArray(x[1])).map(x=>[x[0],x[1].filter(Number.isSafeInteger)]));
state.route=obj.route.filter(Number.isSafeInteger);
}
}catch(e){console.warn('Demo reiniciada',e);}
function save(){try{localStorage.setItem(storeKey,JSON.stringify(state));}catch(e){console.info('Persistência indisponível',e);}}
function countLabel(n){return 'Ponto fictício '+String(n).padStart(3,'0');}
function visited(p){return (state.visits[month]||[]).includes(p.id);}
function visible(){return state.points.filter(p=>!group||p.category===group);}
function percent(n,d){return d?Math.round(100*n/d):0;}
function tone(n){return n>=75?'#50b487':n>=45?'#edbd69':'#d97772';}
if(!window.L){$('loadfail').classList.add('visible');return;}
const map=L.map('map',{zoomControl:false,preferCanvas:true}).setView([-22.8696,-43.3415],16);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
L.control.zoom({position:'bottomright'}).addTo(map);
const polygons=L.layerGroup().addTo(map),markers=L.layerGroup().addTo(map);
const bounds=L.latLngBounds(areas.flatMap(a=>a.coords));
function openPopup(p){
const card=document.createElement('div'),isDone=visited(p),inRoute=state.route.includes(p.id);
const top=document.createElement('div');top.className='popup-kicker';top.textContent='Dados fictícios · Setor '+p.sector;
const name=document.createElement('div');name.className='popup-title';name.textContent=countLabel(p.id);
const category=document.createElement('div');category.className='popup-sub';category.textContent='Grupo de exemplo: '+p.category;
const status=document.createElement('div');status.className='popup-sub';status.textContent=isDone?'✓ Concluído no mês selecionado':'○ Pendente no mês selecionado';
const actions=document.createElement('div');actions.className='popupactions';
const route=document.createElement('button');route.className='light';route.textContent=inRoute?'Retirar roteiro':'+ Ao roteiro';
route.onclick=()=>{state.route=inRoute?state.route.filter(x=>x!==p.id):[...state.route,p.id];save();render();map.closePopup();};
const visit=document.createElement('button');visit.textContent=isDone?'Desfazer visita':'✓ Concluir';
visit.onclick=()=>{const v=new Set(state.visits[month]||[]);v.has(p.id)?v.delete(p.id):v.add(p.id);state.visits[month]=[...v];save();render();map.closePopup();};
actions.append(route,visit);card.append(top,name,category,status,actions);
return card;
}
function render(){
markers.clearLayers();polygons.clearLayers();const pts=visible(),done=pts.filter(visited).length,all=pts.length;
$('total').textContent=all;$('done').textContent=done;$('pending').textContent=all-done;
$('month').textContent=names[Number(month.slice(5))-1]+' de '+month.slice(0,4);
$('progressbar').style.width=percent(done,all)+'%';$('progresslabel').textContent=done+' de '+all+' pontos';$('progresspct').textContent=percent(done,all)+'%';
$('mapfilter').textContent=group||'Todos os grupos';
$('routine').classList.toggle('active',mode==='routine');$('action').classList.toggle('active',mode==='action');
$('routine').setAttribute('aria-pressed',String(mode==='routine'));$('action').setAttribute('aria-pressed',String(mode==='action'));
$('toggleareas').classList.toggle('active',showAreas);
$('filterhint').textContent=mode==='action'?'Escolha o grupo para visualizar uma ação específica.':'Filtro opcional: veja todos os pontos ou só um grupo.';
const filters=$('filters');filters.replaceChildren();
Object.entries(categories).forEach(item=>{
const key=item[0],color=item[1][0],num=state.points.filter(p=>p.category===key).length;
const chip=document.createElement('button');chip.className='chip'+(group===key?' active':'');chip.setAttribute('aria-pressed',String(group===key));
const dot=document.createElement('i');dot.className='dot';dot.style.background=color;
const label=document.createElement('span');label.textContent=key+' ('+num+')';
chip.append(dot,label);chip.onclick=()=>{group=group===key?null:key;render();};filters.append(chip);
});
const sectorRoot=$('sectors');sectorRoot.replaceChildren();
areas.forEach(s=>{
const part=pts.filter(p=>p.sector===s.id),p=percent(part.filter(visited).length,part.length),color=tone(p);
const item=document.createElement('div');item.className='sectorline';
const label=document.createElement('b');label.textContent='Setor '+s.id;
const bar=document.createElement('div');bar.className='bar';
const fill=document.createElement('span');fill.style.width=p+'%';fill.style.background=color;bar.append(fill);
const value=document.createElement('strong');value.textContent=p+'%';
item.append(label,bar,value);sectorRoot.append(item);
if(showAreas){const polygon=L.polygon(s.coords,{color,fillColor:color,weight:2,fillOpacity:.2});
polygon.bindTooltip('Setor '+s.id+': '+part.filter(visited).length+' de '+part.length+' pontos concluídos',{sticky:true});polygons.addLayer(polygon);}
});
pts.forEach(p=>{
const c=categories[p.category],isDone=visited(p),selected=state.route.includes(p.id);
const html='<div class="pin'+(isDone?' done':'')+(selected?' selected':'')+'"><span style="background:'+c[0]+'">'+c[1]+'</span></div>';
const icon=L.divIcon({html,className:'',iconSize:[32,35],iconAnchor:[16,29],popupAnchor:[0,-25]});
markers.addLayer(L.marker([p.lat,p.lng],{icon,title:countLabel(p.id)}).bindPopup(()=>openPopup(p)));
});
const routes=state.route.map(id=>state.points.find(p=>p.id===id)).filter(Boolean);
$('routecount').textContent=routes.length+' ponto'+(routes.length===1?'':'s');
const routeRoot=$('routelist');routeRoot.replaceChildren();
if(!routes.length){const p=document.createElement('p');p.className='hint';p.textContent='Toque em um marcador e selecione “Ao roteiro”.';routeRoot.append(p);}
routes.forEach(p=>{const line=document.createElement('div');line.className='route';const name=document.createElement('span');name.textContent=countLabel(p.id);
const sector=document.createElement('small');sector.textContent='Setor '+p.sector;const remove=document.createElement('button');remove.textContent='×';remove.title='Remover ponto';remove.onclick=()=>{state.route=state.route.filter(id=>id!==p.id);save();render();};line.append(name,sector,remove);routeRoot.append(line);});
$('fitroute').disabled=!routes.length;$('clearroute').disabled=!routes.length;
}
function changeMonth(delta){const a=month.split('-').map(Number),d=new Date(a[0],a[1]-1+delta,1);month=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');render();}
$('routine').onclick=()=>{mode='routine';group=null;render();};
$('action').onclick=()=>{mode='action';if(!group)group='Diabetes';render();};
$('showall').onclick=()=>{group=null;render();};
$('prev').onclick=()=>changeMonth(-1);$('next').onclick=()=>changeMonth(1);
$('toggleareas').onclick=()=>{showAreas=!showAreas;render();};$('fitall').onclick=()=>map.fitBounds(bounds.pad(.12));
$('fitroute').onclick=()=>{const locs=state.route.map(x=>state.points.find(p=>p.id===x)).filter(Boolean).map(p=>[p.lat,p.lng]);if(locs.length)map.fitBounds(L.latLngBounds(locs).pad(.3),{maxZoom:17});};
$('clearroute').onclick=()=>{state.route=[];save();render();};
$('reset').onclick=()=>{if(!confirm('Restaurar os dados fictícios e perder as alterações de teste?'))return;state={points:demo,visits:{'2026-10':[1,2,3,7,9,13,14,17]},route:[]};month='2026-10';group=null;mode='routine';save();render();map.fitBounds(bounds.pad(.1));};
$('addpoint').onclick=()=>{adding=!adding;$('addpoint').textContent=adding?'Cancelar inclusão':'+ Ponto fictício';if(adding)alert('Toque dentro dos setores de exemplo para adicionar um ponto fictício. Não coloque dados reais.');};
function findSector(loc){for(const s of areas){let inside=false;for(let i=0,j=s.coords.length-1;i<s.coords.length;j=i++){const yi=s.coords[i][0],xi=s.coords[i][1],yj=s.coords[j][0],xj=s.coords[j][1];if(((yi>loc.lat)!==(yj>loc.lat))&&(loc.lng<(xj-xi)*(loc.lat-yi)/(yj-yi)+xi))inside=!inside;}if(inside)return s.id;}return null;}
map.on('click',e=>{if(!adding)return;const sector=findSector(e.latlng);if(!sector){alert('Toque dentro de um setor demonstrativo.');return;}const id=Math.max(0,...state.points.map(x=>x.id))+1;state.points.push({id,lat:e.latlng.lat,lng:e.latlng.lng,sector,category:group||'HAS'});adding=false;$('addpoint').textContent='+ Ponto fictício';save();render();});
render();map.fitBounds(bounds.pad(.08));
if('serviceWorker' in navigator && location.protocol==='https:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();