/* Rotina ACS LAB: somente pontos artificiais. */
(function(){
'use strict';
const D=window.Lab, $=id=>document.getElementById(id);
const names=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
let state=D.fresh(), storageBlocked=false, showAreas=true, adding=false;
let pointDraft=null,editingGroup=null,gpsLayer=null,gpsPending=false,standalonePopup=null;
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
function button(text,action,className='btn secondary',aria){const b=el('button',className,text);b.type='button';if(aria)b.setAttribute('aria-label',aria);b.onclick=event=>{event.stopPropagation();action(event);};return b;}
if(!window.L){$('loadfail').classList.add('visible');return;}
const map=L.map('map',{zoomControl:false,preferCanvas:true,fadeAnimation:false,zoomAnimation:!matchMedia('(prefers-reduced-motion: reduce)').matches}).setView([-22.8696,-43.3415],16);
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
function changed(message){
 const focusKey=document.activeElement?.dataset.focusKey;
 save();render();
 if(focusKey)document.querySelector('[data-focus-key="'+CSS.escape(focusKey)+'"]')?.focus({preventScroll:true});
 if(message&&!storageBlocked&&$('savestatus').textContent!=='Não salvo')notify(message);
}
function openPopup(p){
 const card=el('div'),isDone=visited(p),inRoute=state.route.includes(p.id);
 card.append(el('div','popup-kicker','Dados fictícios · '+(p.sector?'Setor '+p.sector:'Sem setor')),el('div','popup-title',label(p.id)),el('div','popup-sub','Grupos: '+(p.categories.map(id=>state.categories[id][2]).join(', ')||'Sem grupo')),el('div','popup-sub',(isDone?'✓ Concluído':'○ Pendente')+' · '+state.month));
 const actions=el('div','popupactions');
 actions.append(button(inRoute?'Retirar do roteiro':'+ Ao roteiro',()=>{D.toggleRoute(state,p.id);changed(inRoute?'Ponto retirado do roteiro.':'Ponto incluído no roteiro.');},'light'),button(isDone?'Desfazer visita':'✓ Concluir',()=>{D.toggleVisit(state,p.id);changed(isDone?'Visita desfeita.':'Visita concluída no mês selecionado.');},''));
 actions.append(button('Editar ponto',()=>editPoint(p),'light'));card.append(actions);return card;
}
const cluster=L.markerClusterGroup?L.markerClusterGroup({maxClusterRadius:38,showCoverageOnHover:false,animate:false,spiderfyOnMaxZoom:true,iconCreateFunction:c=>L.divIcon({html:'<span aria-label="'+c.getChildCount()+' pontos agrupados">'+c.getChildCount()+'</span>',className:'cluster-icon',iconSize:[46,46]})}).addTo(map):L.layerGroup().addTo(map);
if(!L.markerClusterGroup)notify('Agrupamento indisponível. Os pontos continuam acessíveis individualmente.');
function updateMarkers(pts){
 const ids=new Set(pts.map(p=>p.id));
 for(const [id,marker] of markers)if(!ids.has(id)){cluster.removeLayer(marker);markers.delete(id);}
 pts.forEach(p=>{
  const c=state.categories[p.categories[0]]||['#526e63','●'],done=visited(p),order=state.route.indexOf(p.id)+1;
  const html='<div class="pin'+(done?' done':'')+(order?' selected':'')+'"><span style="background:'+c[0]+'">'+(order||c[1])+'</span>'+(done?'<b class="pin-check">✓</b>':'')+(p.categories.length>1?'<b class="pin-multi">+'+(p.categories.length-1)+'</b>':'')+'</div>';
  const icon=L.divIcon({html,className:'point-marker',iconSize:[44,44],iconAnchor:[22,38],popupAnchor:[0,-32]});
  const title=label(p.id)+(order?' · roteiro '+order:'')+(done?' · concluído':' · pendente');
  let marker=markers.get(p.id);
  if(!marker){marker=L.marker([p.lat,p.lng],{icon,title}).bindPopup(()=>openPopup(state.points.find(v=>v.id===p.id)),{maxWidth:290,autoPanPadding:[20,20]});markers.set(p.id,marker);cluster.addLayer(marker);}
  else {if(marker._labIcon!==html)marker.setIcon(icon);if(marker._labLat!==p.lat||marker._labLng!==p.lng){cluster.removeLayer(marker);marker.setLatLng([p.lat,p.lng]);cluster.addLayer(marker);}}
  marker._labLat=p.lat;marker._labLng=p.lng;marker._labIcon=html;marker.options.title=title;marker.options.alt=title;marker.getElement()?.setAttribute('aria-label',title);marker.getElement()?.setAttribute('title',title);
  if(marker.isPopupOpen()){const active=document.activeElement;const index=[...marker.getPopup().getElement().querySelectorAll('button')].indexOf(active);marker.setPopupContent(openPopup(p));if(index>=0)marker.getPopup().getElement().querySelectorAll('button')[index]?.focus({preventScroll:true});}
 });
}
function render(){
 const pts=D.visible(state),done=pts.filter(visited).length,all=pts.length;
 $('total').textContent=all;$('done').textContent=done;$('pending').textContent=all-done;
 $('month').textContent=names[Number(state.month.slice(5))-1]+' de '+state.month.slice(0,4);
 $('progressbar').style.width=percent(done,all)+'%';$('progresslabel').textContent=done+' de '+all+' pontos';$('progresspct').textContent=all?percent(done,all)+'%':'Sem dados';
 $('mapfilter').textContent=(state.mode==='action'?'Ação · ':'Rotina · ')+(state.groups.length?state.groups.map(id=>state.categories[id][2]).join(' ou '):state.mode==='action'?'Escolha ao menos um grupo':'Todos os grupos');
 for(const mode of ['routine','action']){$(mode).classList.toggle('active',state.mode===mode);$(mode).setAttribute('aria-pressed',String(state.mode===mode));}
 $('toggleareas').setAttribute('aria-pressed',String(showAreas));
 $('filterhint').textContent=state.mode==='action'?'Selecione ao menos um grupo. Filtros usam OU, sem contar pontos duas vezes.':'Selecione vários grupos (OU) ou mostre todos. Cada ponto é contado uma vez.';
 const filters=$('filters');filters.replaceChildren();
 for(const [key,c] of Object.entries(state.categories)){
  const num=state.points.filter(p=>p.categories.includes(key)).length;
  const chip=button(c[1]+' '+c[2]+' ('+num+')',()=>{state.groups=state.groups.includes(key)?state.groups.filter(x=>x!==key):[...state.groups,key];changed();},'chip'+(state.groups.includes(key)?' active':''));
  chip.setAttribute('aria-pressed',String(state.groups.includes(key)));const dot=el('i','dot');dot.style.background=c[0];chip.prepend(dot);filters.append(chip);
  chip.dataset.focusKey='filter-'+key;
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
 if(standalonePopup?.isOpen()){const point=state.points.find(p=>p.id===standalonePopup.pointId);if(point)standalonePopup.setContent(openPopup(point));else map.closePopup();}
 const routes=state.route.map(id=>state.points.find(p=>p.id===id)).filter(Boolean);
 routeLine.setLatLngs(routes.map(p=>[p.lat,p.lng]));
 $('routecount').textContent=routes.length+' pontos';$('openroute').textContent='Roteiro ('+routes.length+')';
 const hidden=routes.filter(p=>!pts.some(v=>v.id===p.id)).length;
 $('routehidden').textContent=hidden?hidden+' ponto(s) do roteiro fora do filtro. A linha mantém o roteiro completo.':'';
 const root=$('routelist');root.replaceChildren();
 if(!routes.length)root.append(el('li','empty','Seu roteiro começa no mapa. Abra um ponto e toque em “Ao roteiro”.'));
 routes.forEach((p,i)=>{
  const item=el('li','route'),title=el('div','route-title');
  title.append(el('b','route-number',i+1),button(label(p.id),()=>focusPoint(p),'linkbtn'),el('small','',visited(p)?'✓ Concluído':'Pendente'));
  const controls=el('div','route-controls');
  const move=delta=>{D.moveRoute(state,p.id,delta);changed('Ordem do roteiro atualizada.');root.querySelector('[data-move="'+p.id+':'+delta+'"]')?.focus();};
  const up=button('↑',()=>move(-1),'iconbtn','Mover '+label(p.id)+' acima'),down=button('↓',()=>move(1),'iconbtn','Mover '+label(p.id)+' abaixo');up.disabled=i===0;down.disabled=i===routes.length-1;up.dataset.move=p.id+':-1';down.dataset.move=p.id+':1';
  controls.append(up,down,button(visited(p)?'Desfazer':'Concluir',()=>{D.toggleVisit(state,p.id);changed('Execução atualizada.');},'btn secondary'),button('×',()=>{D.toggleRoute(state,p.id);changed('Ponto retirado do roteiro.');},'iconbtn danger','Remover '+label(p.id)+' do roteiro'));
  [...controls.children].forEach((control,index)=>{control.dataset.focusKey='route-'+p.id+'-'+index;});
  item.append(title,controls);root.append(item);
 });
 $('fitroute').disabled=!routes.length;$('clearroute').disabled=!routes.length;
}
function changeMonth(delta){const [y,m]=state.month.split('-').map(Number),d=new Date(y,m-1+delta,1);state.month=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');changed();}
function cancelAdd(){adding=false;$('addpoint').textContent='+ Ponto fictício';$('map').classList.remove('placing');}
function fitAll(){const coords=state.points.map(p=>[p.lat,p.lng]);map.fitBounds(coords.length?L.latLngBounds(coords).pad(.15):bounds,{maxZoom:17});}
for(const mode of ['routine','action'])$(mode).onclick=()=>{state.mode=mode;changed();};
$('showall').onclick=()=>{state.groups=[];state.mode='routine';changed();};
$('prev').onclick=()=>changeMonth(-1);$('next').onclick=()=>changeMonth(1);
$('toggleareas').onclick=()=>{showAreas=!showAreas;render();};$('fitall').onclick=fitAll;
$('openpanel').onclick=()=>{const open=document.body.classList.contains('panel-closed');panel(open);(open?$('closepanel'):$('openpanel')).focus();};
$('closepanel').onclick=()=>{panel(false);$('openpanel').focus();};
$('overviewtab').onclick=()=>panel(true,'overview');$('routetab').onclick=()=>panel(true,'route');
$('openroute').onclick=()=>{panel(true,'route');$('routetab').focus();};
$('fitroute').onclick=()=>{const locs=state.route.map(id=>state.points.find(p=>p.id===id)).filter(Boolean).map(p=>[p.lat,p.lng]);if(locs.length){panel(false);map.fitBounds(L.latLngBounds(locs).pad(.2),{maxZoom:18});}};
$('clearroute').onclick=()=>{if(confirm('Limpar todo o roteiro? As visitas concluídas serão mantidas.')){state.route=[];changed('Roteiro limpo.');}};
$('reset').onclick=()=>{if(!confirm('Restaurar a demo e substituir todas as alterações fictícias deste navegador?'))return;state=D.fresh();storageBlocked=false;cancelAdd();changed('Demo restaurada.');fitAll();};
$('addpoint').onclick=()=>{if(adding){cancelAdd();if(pointDraft)showPointDialog();notify('Escolha de posição cancelada.');return;}pointDraft={id:null,categories:[...state.groups]};startPick();};
map.on('click',e=>{if(!adding)return;pointDraft.lat=e.latlng.lat;pointDraft.lng=e.latlng.lng;cancelAdd();showPointDialog();notify('Posição escolhida. Revise os grupos e salve o ponto fictício.');});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!document.querySelector('dialog[open]')){if(adding){cancelAdd();if(Number.isFinite(pointDraft?.lat))showPointDialog();return;}panel(false);$('openpanel').focus();}});
function focusPoint(p){
 panel(false);map.setView([p.lat,p.lng],18,{animate:false});
 // A detail popup also works for points hidden by filters or coincident clusters.
 standalonePopup=L.popup({maxWidth:290,autoPanPadding:[20,20]}).setLatLng([p.lat,p.lng]).setContent(openPopup(p)).openOn(map);standalonePopup.pointId=p.id;
}
function startPick(){adding=true;$('addpoint').textContent='Cancelar posição';$('map').classList.add('placing');panel(false);map.closePopup();notify('Toque no mapa para escolher uma posição fictícia, em qualquer região. Escape cancela.');}
function editPoint(p){cancelAdd();pointDraft={...p,categories:[...p.categories]};map.closePopup();showPointDialog();}
function showPointDialog(){
 $('pointtitle').textContent=pointDraft.id?'Editar '+label(pointDraft.id):'Novo ponto fictício';
 $('deletepoint').hidden=!pointDraft.id;$('pointerror').textContent='';
 $('pointlat').value=pointDraft.lat??'';$('pointlng').value=pointDraft.lng??'';
 const root=$('pointcategories');root.replaceChildren();
 for(const [id,c] of Object.entries(state.categories)){const row=el('label'),input=el('input');input.type='checkbox';input.value=id;input.checked=pointDraft.categories.includes(id);row.append(input,document.createTextNode(c[1]+' '+c[2]));root.append(row);}
 if(!Object.keys(state.categories).length)root.append(el('p','hint','Nenhum grupo. Você pode salvar sem grupo e criar grupos no painel.'));
 updateSectorHint();$('pointdialog').showModal();
}
function readDraft(){pointDraft.categories=[...$('pointcategories').querySelectorAll('input:checked')].map(i=>i.value);pointDraft.lat=$('pointlat').valueAsNumber;pointDraft.lng=$('pointlng').valueAsNumber;}
function updateSectorHint(){const lat=$('pointlat').valueAsNumber,lng=$('pointlng').valueAsNumber;const sector=D.findSector({lat,lng});$('pointsector').textContent=sector?'Setor '+sector+' · identificado pela posição':'Sem setor · pontos fora dos polígonos também são permitidos';}
$('pointlat').oninput=updateSectorHint;$('pointlng').oninput=updateSectorHint;
$('closepoint').onclick=()=>{$('pointdialog').close();pointDraft=null;$('addpoint').focus();};
$('picklocation').onclick=()=>{readDraft();$('pointdialog').close();startPick();};
$('pointform').onsubmit=e=>{
 e.preventDefault();readDraft();
 try{const p=D.putPoint(state,pointDraft,pointDraft.id);$('pointdialog').close();changed('Ponto fictício salvo'+(D.visible(state).some(v=>v.id===p.id)?'.':'. Ele está fora do filtro atual.'));focusPoint(p);pointDraft=null;}
 catch(error){$('pointerror').textContent=error.message;}
};
$('deletepoint').onclick=()=>{if(!confirm('Excluir este ponto fictício, suas conclusões e sua referência no roteiro?'))return;D.deletePoint(state,pointDraft.id);$('pointdialog').close();pointDraft=null;map.closePopup();changed('Ponto fictício e referências excluídos.');$('addpoint').focus();};
function clearGroupForm(){editingGroup=null;$('groupform').reset();$('groupformtitle').textContent='Novo grupo';$('grouperror').textContent='';}
function renderGroups(){
 const root=$('grouplist');root.replaceChildren();
 for(const [id,c] of Object.entries(state.categories)){
  const row=el('div','group-row'),dot=el('i','dot');dot.style.background=c[0];row.append(dot,el('span','',c[1]+' '+c[2]));
  row.append(button('Editar',()=>{editingGroup=id;$('groupname').value=c[2];$('groupcolor').value=c[0];$('groupsymbol').value=c[1];$('groupformtitle').textContent='Editar grupo';$('grouperror').textContent='';$('groupname').focus();},'btn secondary','Editar grupo '+c[2]),button('×',()=>{if(!confirm('Excluir o grupo '+c[2]+'? Os pontos e as conclusões serão preservados.'))return;D.deleteGroup(state,id);changed('Grupo excluído. Pontos preservados.');clearGroupForm();renderGroups();},'iconbtn danger','Excluir grupo '+c[2]));root.append(row);
 }
}
for(const symbol of D.symbols){const option=el('option','',symbol);option.value=symbol;$('groupsymbol').append(option);}
$('managegroups').onclick=()=>{clearGroupForm();renderGroups();$('groupdialog').showModal();};
$('closegroups').onclick=()=>$('groupdialog').close();$('newgroup').onclick=clearGroupForm;
$('groupform').onsubmit=e=>{e.preventDefault();try{D.putGroup(state,{name:$('groupname').value,color:$('groupcolor').value,symbol:$('groupsymbol').value},editingGroup);changed('Grupo simulado salvo.');clearGroupForm();renderGroups();}catch(error){$('grouperror').textContent=error.message;}};
$('gps').onclick=()=>{
 if(gpsLayer){map.removeLayer(gpsLayer);gpsLayer=null;$('gps').textContent='Minha localização';$('gps').setAttribute('aria-pressed','false');notify('Localização temporária removida. Nada foi salvo.');return;}
 if(!navigator.geolocation){notify('Este navegador não oferece geolocalização. Você pode navegar manualmente no mapa.');return;}
 if(gpsPending)return;gpsPending=true;$('gps').disabled=true;notify('Aguardando permissão de localização. Sua posição não será salva.');
 const finish=()=>{gpsPending=false;$('gps').disabled=false;};
 navigator.geolocation.getCurrentPosition(position=>{
  finish();const {latitude:lat,longitude:lng,accuracy}=position.coords;
  gpsLayer=L.layerGroup().addTo(map);const circle=L.circle([lat,lng],{radius:accuracy,color:'#2167ab',fillOpacity:.08,weight:1}).addTo(gpsLayer);
  const marker=L.marker([lat,lng],{draggable:true,title:'Localização temporária: arraste para ajustar',icon:L.divIcon({className:'gps-marker',iconSize:[22,22]})}).addTo(gpsLayer);
  marker.on('dragend',()=>{gpsLayer.removeLayer(circle);notify('Posição temporária ajustada manualmente. Não foi salva e não representa a precisão do GPS.');});
  panel(false);map.setView([lat,lng],16);$('gps').textContent='Ocultar localização';$('gps').setAttribute('aria-pressed','true');notify('Localização temporária · precisão aproximada de '+Math.round(accuracy)+' m. Arraste o ponto azul para ajustar. Nada foi salvo.');
 },error=>{finish();notify(error.code===1?'Permissão de localização negada. Continue navegando manualmente.':error.code===3?'Tempo de localização esgotado. Tente novamente ou navegue manualmente.':'Localização indisponível. Continue navegando manualmente.');},{enableHighAccuracy:false,timeout:10000,maximumAge:0});
};
new ResizeObserver(()=>map.invalidateSize({pan:false})).observe($('map'));
render();panel(!matchMedia('(max-width: 860px)').matches,'overview');fitAll();
if('serviceWorker' in navigator && location.protocol==='https:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>notify('Cache local indisponível; o aplicativo continua online.')));
})();
