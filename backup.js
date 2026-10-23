/* Backup local estrito: não envia arquivos ou estado para qualquer servidor. */
(function(root){
'use strict';
const D=typeof module!=='undefined'?require('./domain.js'):root.Lab;
const MAX_BYTES=1024*1024,MAX_POINTS=2000,MAX_GROUPS=32;
const fail=message=>{throw Error(message);};
const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function keys(value,allowed){
 if(!object(value)||Object.keys(value).some(key=>!allowed.includes(key)))fail('O arquivo contém campos desconhecidos ou uma estrutura inválida.');
}
function distinct(values,predicate){return Array.isArray(values)&&new Set(values).size===values.length&&values.every(predicate);}
const month=value=>typeof value==='string'&&/^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const date=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value;
function parse(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BYTES)fail('O backup deve ter no máximo 1 MB.');
 let backup;try{backup=JSON.parse(text);}catch(error){fail('O arquivo não contém JSON válido.');}
 keys(backup,['format','version','createdAt','data']);
 if(backup.format!=='rotina-acs-lab-backup'||backup.version!==1)fail('Formato ou versão de backup não suportado.');
 if(typeof backup.createdAt!=='string'||!Number.isFinite(Date.parse(backup.createdAt)))fail('Data do backup inválida.');
 const s=backup.data;
 keys(s,['version','points','categories','visits','route','month','mode','groups','records','nextPointId']);
 if(s.version!==3||!Array.isArray(s.points)||s.points.length>MAX_POINTS)fail('Estado incompatível ou limite de 2.000 pontos excedido.');
 if(!object(s.categories)||Object.keys(s.categories).length>MAX_GROUPS)fail('O backup deve conter no máximo 32 grupos.');
 const groups=new Set(Object.keys(s.categories)),names=new Set();
 for(const [id,c] of Object.entries(s.categories)){
  if(!/^[\p{L}\p{N}_-]{1,40}$/u.test(id)||!Array.isArray(c)||c.length!==3||!/^#[0-9a-f]{6}$/i.test(c[0])||!D.symbols.includes(c[1])||typeof c[2]!=='string'||!c[2].trim()||c[2].length>32)fail('Grupo com rótulo, cor ou símbolo inválido.');
  const name=c[2].trim().toLocaleLowerCase();if(names.has(name))fail('O backup contém rótulos de grupo repetidos.');names.add(name);
 }
 const ids=new Set();
 for(const p of s.points){
  keys(p,['id','lat','lng','sector','categories']);
  if(!Number.isSafeInteger(p.id)||p.id<1||p.id>=Number.MAX_SAFE_INTEGER||ids.has(p.id))fail('Identificador de ponto inválido ou duplicado.');
  ids.add(p.id);
  if(!Number.isFinite(p.lat)||Math.abs(p.lat)>85||!Number.isFinite(p.lng)||Math.abs(p.lng)>180)fail('Coordenadas fora dos limites do mapa.');
  if(p.sector!==null&&!D.areas.some(a=>a.id===p.sector))fail('Setor desconhecido.');
  if(!distinct(p.categories,id=>groups.has(id)))fail('Categorias de ponto inválidas, duplicadas ou desconhecidas.');
 }
 if(!Number.isSafeInteger(s.nextPointId)||s.nextPointId<=Math.max(0,...ids)||s.nextPointId>=Number.MAX_SAFE_INTEGER)fail('Sequência de identificadores inválida.');
 if(!month(s.month)||!['routine','action'].includes(s.mode)||!distinct(s.groups,id=>groups.has(id)))fail('Competência, modo ou filtros inválidos.');
 if(!distinct(s.route,id=>ids.has(id)))fail('Roteiro com pontos inexistentes ou duplicados.');
 if(!object(s.visits)||Object.keys(s.visits).length>1200)fail('Histórico de execução inválido.');
 for(const [m,list] of Object.entries(s.visits))if(!month(m)||!distinct(list,id=>ids.has(id)))fail('Conclusões com competência ou pontos inválidos.');
 if(!object(s.records))fail('Registros de execução inválidos.');
 for(const [key,r] of Object.entries(s.records)){
  keys(r,['date','type']);const match=/^(\d{4}-\d{2}):([1-9]\d*)$/.exec(key);
  if(!match||!s.visits[match[1]]?.includes(Number(match[2]))||!date(r.date)||!['routine','action'].includes(r.type))fail('Registro de execução sem conclusão correspondente ou com data inválida.');
 }
 return {createdAt:backup.createdAt,state:D.normalize(s)};
}
function serialize(state,now=new Date()){
 const text=JSON.stringify({format:'rotina-acs-lab-backup',version:1,createdAt:now.toISOString(),data:D.normalize(state)},null,2);
 parse(text);return text;
}
const api={MAX_BYTES,MAX_POINTS,MAX_GROUPS,parse,serialize};
if(typeof module!=='undefined')module.exports=api;else root.LabBackup=api;
})(typeof window!=='undefined'?window:globalThis);
