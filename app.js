/* Rotina ACS LAB: somente pontos artificiais. */
(function(){
'use strict';
const D=window.Lab, $=id=>document.getElementById(id);
const names=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
let state=D.fresh(), storageBlocked=false, showAreas=true, adding=false;
const notify=message=>{$('notice').textContent=message;};
try{const raw=localStorage.getItem(D.KEY);if(raw)state=D.normalize(JSON.parse(raw));}
catch(error){storageBlocked=true;notify('Não foi possível ler os dados locais. Eles foram preservados. Restaure a demo somente se quiser substituí-los.');}
function save(){
 if(storageBlocked){$('savestatus').textContent='Não salvo';return;}
 try{localStorage.setItem(D.KEY,JSON.stringify(state));$('savestatus').textContent='Salvo neste navegador';}
 catch(error){$('savestatus').textContent='Não salvo';notify('Armazenamento indisponível. As mudanças duram somente nesta sessão.');}
}
const label=id=>'Ponto fictício '+String(id).padStart(3,'0');
const visited=p=>D.visited(state,p.id);
const percent=(n,d)=>d?Math.round(100*n/d):0;
const tone=(n,total)=>!total?'#82958e':n>=75?'#50b487':n>=45?'#edbd69':'#d97772';
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function button(text,action,className='btn secondary',aria){const b=el('button',className,text);b.type='button';if(aria)b.setAttribute('aria-label',aria);b.onclick=action;return b;}
if(!window.L){$('loadfail').classList.add('visible');return;}
const map=L.map('map',{zoomControl:false,preferCanvas:true}).setView([-22.8696,-43.3415],16);
const tiles=L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
tiles.on('tileerror',()=>notify('Algumas ruas não carregaram. Verifique a conexão; os pontos continuam disponíveis.'));
L.control.zoom({position:'bottomright'}).addTo(map);
const polygons=new Map(),markers=new Map();
const routeLine=L.polyline([],{color:'#123934',weight:3,dashArray:'8 8',interactive:false}).addTo(map);
const bounds=L.latLngBounds(D.areas.flatMap(a=>a.coords));
function panel(open,view){
 document.body.classList.toggle('panel-closed',!open);$('panel').inert=!open;$('openpanel').setAttribute('aria-expanded',String(open));
 if(view){$('overview').hidden=view!=='overview';$('routeview').hidden=view!=='route';$('overviewtab').setAttribute('aria-pressed',String(view==='overview'));$('routetab').setAttribute('aria-pressed',String(view==='route'));$('paneltitle').textContent=view==='route'?'Meu roteiro':'Planejar visitas';}
 map.invalidateSize({pan:false});
}
function changed(message){save();render();if(message)notify(message);}
function openPopup(p){
 const card=el('div'),isDone=visited(p),inRoute=state.route.includes(p.id);
 card.append(el('div','popup-kicker','Dados fictícios · '+(p.sector?'Setor '+p.sector:'Sem setor')),el('div','popup-title',label(p.id)),el('div','popup-sub','Grupo de exemplo: '+p.category),el('div','popup-sub',(isDone?'✓ Concluído':'○ Pendente')+' · '+state.month));
 const actions=el('div','popupactions');
 actions.append(button(inRoute?'Retirar do roteiro':'+ Ao roteiro',()=>{D.toggleRoute(state,p.id);changed(inRoute?'Ponto retirado do roteiro.':'Ponto incluído no roteiro.');},'light'),button(isDone?'Desfazer visita':'✓ Concluir',()=>{D.toggleVisit(state,p.id);changed(isDone?'Visita desfeita.':'Visita concluída no mês selecionado.');},''));
 card.append(actions);return card;
}
function updateMarkers(pts){
 const ids=new Set(pts.map(p=>p.id));
 for(const [id,marker] of markers)if(!ids.has(id)){map.removeLayer(marker);markers.delete(id);}
 pts.forEach(p=>{
  const c=D.categories[p.category],done=visited(p),order=state.route.indexOf(p.id)+1;
  const html='<div class="pin'+(done?' done':'')+(order?' selected':'')+'"><span style="background:'+c[0]+'">'+(order||c[1])+'</span>'+(done?'<b class="pin-check">✓</b>':'')+'</div>';
  const icon=L.divIcon({html,className:'point-marker',iconSize:[44,44],iconAnchor:[22,38],popupAnchor:[0,-32]});
  const title=label(p.id)+(order?' · roteiro '+order:'')+(done?' · concluído':' · pendente');
  let marker=markers.get(p.id);
  if(!marker){marker=L.marker([p.lat,p.lng],{icon,title}).addTo(map).bindPopup(()=>openPopup(p),{maxWidth:290,autoPanPadding:[20,20]});markers.set(p.id,marker);}
  else {if(marker._labIcon!==html)marker.setIcon(icon);marker.setLatLng([p.lat,p.lng]);}
  marker._labIcon=html;marker.getElement()?.setAttribute('aria-label',title);marker.getElement()?.setAttribute('title',title);
  if(marker.isPopupOpen()){const active=document.activeElement;const index=[...marker.getPopup().getElement().querySelectorAll('button')].indexOf(active);marker.setPopupContent(openPopup(p));if(index>=0)marker.getPopup().getElement().querySelectorAll('button')[index]?.focus({preventScroll:true});}
 });
}
function render(){
 const pts=D.visible(state),done=pts.filter(visited).length,all=pts.length;
 $('total').textContent=all;$('done').textContent=done;$('pending').textContent=all-done;
 $('month').textContent=names[Number(state.month.slice(5))-1]+' de '+state.month.slice(0,4);
 $('progressbar').style.width=percent(done,all)+'%';$('progresslabel').textContent=done+' de '+all+' pontos';$('progresspct').textContent=all?percent(done,all)+'%':'Sem dados';
 $('mapfilter').textContent=(state.mode==='action'?'Ação · ':'Rotina · ')+(state.group||'Todos os grupos');
 for(const mode of ['routine','action']){$(mode).classList.toggle('active',state.mode===mode);$(mode).setAttribute('aria-pressed',String(state.mode===mode));}
 $('toggleareas').setAttribute('aria-pressed',String(showAreas));
 $('filterhint').textContent=state.mode==='action'?'Escolha um grupo para iniciar a ação específica.':'Filtro opcional. Planejar não altera as conclusões do mês.';
 const filters=$('filters');filters.replaceChildren();
 for(const [key,c] of Object.entries(D.categories)){
  const num=state.points.filter(p=>p.category===key).length;
  const chip=button(key+' ('+num+')',()=>{state.group=state.group===key?null:key;changed();},'chip'+(state.group===key?' active':''));
  chip.setAttribute('aria-pressed',String(state.group===key));const dot=el('i','dot');dot.style.background=c[0];chip.prepend(dot);filters.append(chip);
 }
 const sectorRoot=$('sectors');sectorRoot.replaceChildren();
 D.areas.forEach(s=>{
  const part=pts.filter(p=>p.sector===s.id),n=part.filter(visited).length,pct=percent(n,part.length),color=tone(pct,part.length);
  const item=el('div','sectorline'),bar=el('div','bar'),fill=el('span');fill.style.width=pct+'%';fill.style.background=color;bar.append(fill);
  item.append(el('b','','Setor '+s.id),bar,el('strong','',part.length?pct+'%':'Sem dados'));sectorRoot.append(item);
  let polygon=polygons.get(s.id);if(!polygon){polygon=L.polygon(s.coords,{weight:2,fillOpacity:.16});polygons.set(s.id,polygon);}
  polygon.setStyle({color,fillColor:color});polygon.bindTooltip('Setor '+s.id+': '+(part.length?n+' de '+part.length+' concluídos':'sem dados'),{sticky:true});
  if(showAreas)polygon.addTo(map);else polygon.remove();
 });
 updateMarkers(pts);
 const routes=state.route.map(id=>state.points.find(p=>p.id===id)).filter(Boolean);
 routeLine.setLatLngs(routes.map(p=>[p.lat,p.lng]));
 $('routecount').textContent=routes.length+' pontos';$('openroute').textContent='Roteiro ('+routes.length+')';
 const hidden=routes.filter(p=>!pts.some(v=>v.id===p.id)).length;
 $('routehidden').textContent=hidden?hidden+' ponto(s) do roteiro fora do filtro. A linha mantém o roteiro completo.':'';
 const root=$('routelist');root.replaceChildren();
 if(!routes.length)root.append(el('li','empty','Seu roteiro começa no mapa. Abra um ponto e toque em “Ao roteiro”.'));
 routes.forEach((p,i)=>{
  const item=el('li','route'),title=el('div','route-title');
  title.append(el('b','route-number',i+1),button(label(p.id),()=>{panel(false);map.setView([p.lat,p.lng],18);if(markers.has(p.id))markers.get(p.id).openPopup();else L.popup().setLatLng([p.lat,p.lng]).setContent(openPopup(p)).openOn(map);},'linkbtn'),el('small','',visited(p)?'✓ Concluído':'Pendente'));
  const controls=el('div','route-controls');
  const move=delta=>{D.moveRoute(state,p.id,delta);changed('Ordem do roteiro atualizada.');root.querySelector('[data-move="'+p.id+':'+delta+'"]')?.focus();};
  const up=button('↑',()=>move(-1),'iconbtn','Mover '+label(p.id)+' acima'),down=button('↓',()=>move(1),'iconbtn','Mover '+label(p.id)+' abaixo');up.disabled=i===0;down.disabled=i===routes.length-1;up.dataset.move=p.id+':-1';down.dataset.move=p.id+':1';
  controls.append(up,down,button(visited(p)?'Desfazer':'Concluir',()=>{D.toggleVisit(state,p.id);changed('Execução atualizada.');},'btn secondary'),button('×',()=>{D.toggleRoute(state,p.id);changed('Ponto retirado do roteiro.');},'iconbtn danger','Remover '+label(p.id)+' do roteiro'));
  item.append(title,controls);root.append(item);
 });
 $('fitroute').disabled=!routes.length;$('clearroute').disabled=!routes.length;
}
function changeMonth(delta){const [y,m]=state.month.split('-').map(Number),d=new Date(y,m-1+delta,1);state.month=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');changed();}
function cancelAdd(){adding=false;$('addpoint').textContent='+ Ponto fictício';$('map').classList.remove('placing');}
function fitAll(){const coords=state.points.map(p=>[p.lat,p.lng]);map.fitBounds(coords.length?L.latLngBounds(coords).pad(.15):bounds,{maxZoom:17});}
for(const mode of ['routine','action'])$(mode).onclick=()=>{state.mode=mode;changed();};
$('showall').onclick=()=>{state.group=null;state.mode='routine';changed();};
$('prev').onclick=()=>changeMonth(-1);$('next').onclick=()=>changeMonth(1);
$('toggleareas').onclick=()=>{showAreas=!showAreas;render();};$('fitall').onclick=fitAll;
$('openpanel').onclick=()=>{const open=document.body.classList.contains('panel-closed');panel(open);(open?$('closepanel'):$('openpanel')).focus();};
$('closepanel').onclick=()=>{panel(false);$('openpanel').focus();};
$('overviewtab').onclick=()=>panel(true,'overview');$('routetab').onclick=()=>panel(true,'route');
$('openroute').onclick=()=>{panel(true,'route');$('routetab').focus();};
$('fitroute').onclick=()=>{const locs=state.route.map(id=>state.points.find(p=>p.id===id)).filter(Boolean).map(p=>[p.lat,p.lng]);if(locs.length){panel(false);map.fitBounds(L.latLngBounds(locs).pad(.2),{maxZoom:18});}};
$('clearroute').onclick=()=>{if(confirm('Limpar todo o roteiro? As visitas concluídas serão mantidas.')){state.route=[];changed('Roteiro limpo.');}};
$('reset').onclick=()=>{if(!confirm('Restaurar a demo e substituir todas as alterações fictícias deste navegador?'))return;state=D.fresh();storageBlocked=false;cancelAdd();changed('Demo restaurada.');fitAll();};
$('addpoint').onclick=()=>{if(adding){cancelAdd();notify('Inclusão cancelada.');return;}adding=true;$('addpoint').textContent='Cancelar inclusão';$('map').classList.add('placing');panel(false);map.closePopup();notify('Toque dentro de um setor para adicionar um ponto fictício. Escape cancela.');};
map.on('click',e=>{if(!adding)return;const sector=D.findSector(e.latlng);if(!sector){notify('Escolha um local dentro dos setores demonstrativos.');return;}const id=Math.max(0,...state.points.map(p=>p.id))+1;state.points.push({id,lat:e.latlng.lat,lng:e.latlng.lng,sector,category:state.group||'HAS'});cancelAdd();changed('Ponto fictício adicionado.');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){cancelAdd();panel(false);$('openpanel').focus();}});
new ResizeObserver(()=>map.invalidateSize({pan:false})).observe($('map'));
render();panel(!matchMedia('(max-width: 860px)').matches,'overview');fitAll();
if('serviceWorker' in navigator && location.protocol==='https:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>notify('Cache local indisponível; o aplicativo continua online.')));
})();
