async (page) => {
 const assert=(v,message)=>{if(!v)throw Error(message);};
 if(!['localhost','127.0.0.1'].includes(new URL(page.url()).hostname))throw Error('Execute somente na instância local de teste.');
 await page.addInitScript(()=>{window.confirm=()=>true;});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setViewportSize({width:1366,height:900});
 await page.evaluate(()=>{const s=Lab.fresh();const legacy={points:s.points.map(({categories,...p})=>p),visits:s.visits,route:[1,4,2]};legacy.points.push({id:42,lat:-22.8706,lng:-43.3447,sector:'A',category:'HAS'});localStorage.setItem(Lab.KEY,JSON.stringify(legacy));});
 await page.reload();await page.waitForSelector('.point-marker, .cluster-icon');
 assert(await page.locator('#total').textContent()==='19','Migração: total');assert(await page.locator('#done').textContent()==='8','Migração: oito conclusões');
 await page.locator('#openroute').click();
 await page.getByRole('button',{name:'Mover Ponto fictício 004 abaixo',exact:true}).click();
 assert(JSON.stringify(await page.evaluate(()=>JSON.parse(localStorage.getItem(Lab.KEY)).route))==='[1,2,4]','Reordenação');
 await page.locator('.route').last().getByRole('button',{name:'Concluir',exact:true}).click();
 assert(await page.locator('#done').textContent()==='9','Conclusão');
 await page.reload();await page.waitForSelector('.point-marker, .cluster-icon');assert(await page.locator('#done').textContent()==='9','Conclusão persistente');
 await page.locator('#next').click();assert(await page.locator('#done').textContent()==='0','Isolamento mensal');await page.reload();assert((await page.locator('#month').textContent()).includes('Novembro'),'Competência persistente');await page.locator('#prev').click();
 await page.locator('#addpoint').click();await page.locator('#map').click({position:{x:250,y:200}});await page.locator('#pointdialog').waitFor({state:'visible'});
 await page.locator('#pointlat').fill('0');await page.locator('#pointlng').fill('0');await page.locator('#pointcategories input[value="HAS"]').check();await page.locator('#pointcategories input[value="Diabetes"]').check();await page.getByRole('button',{name:'Salvar ponto fictício',exact:true}).click();
 let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem(Lab.KEY)));const added=saved.points.at(-1);assert(added.id===43&&added.sector===null&&added.categories.length===2,'CRUD criação e grupos');
 await page.getByRole('button',{name:'Editar ponto',exact:true}).click();await page.locator('#picklocation').click();await page.locator('#map').click({position:{x:300,y:250}});await page.getByRole('button',{name:'Salvar ponto fictício',exact:true}).click();
 saved=await page.evaluate(()=>JSON.parse(localStorage.getItem(Lab.KEY)));assert(saved.points.at(-1).lat!==0,'Movimento pelo mapa');
 await page.getByRole('button',{name:'+ Ao roteiro',exact:true}).click();await page.getByRole('button',{name:'✓ Concluir',exact:true}).click();
 await page.getByRole('button',{name:'Editar ponto',exact:true}).click();await page.locator('#deletepoint').click();
 saved=await page.evaluate(()=>JSON.parse(localStorage.getItem(Lab.KEY)));assert(!saved.route.includes(43)&&!saved.visits['2026-10'].includes(43)&&!saved.points.some(p=>p.id===43),'Exclusão limpa referências');
 await page.locator('#openpanel').click();await page.locator('#overviewtab').click();await page.locator('#managegroups').click();
 await page.locator('#groupname').fill('Grupo simulado X');await page.locator('#groupsymbol').selectOption('◆');await page.getByRole('button',{name:'Salvar grupo',exact:true}).click();await page.getByRole('button',{name:'Editar grupo Grupo simulado X',exact:true}).click();await page.locator('#groupname').fill('Grupo simulado Y');await page.getByRole('button',{name:'Salvar grupo',exact:true}).click();
 assert(await page.getByRole('button',{name:'Editar grupo Grupo simulado Y',exact:true}).count()===1,'Renomear grupo');await page.getByRole('button',{name:'Excluir grupo Grupo simulado Y',exact:true}).click();await page.locator('#closegroups').click();
 await page.locator('#action').click();assert(await page.locator('#total').textContent()==='0','Ação exige grupo');await page.locator('#filters button').filter({hasText:'HAS'}).click();await page.locator('#filters button').filter({hasText:'Diabetes'}).click();assert(await page.locator('#total').textContent()==='12','OR sem duplicação');await page.locator('#showall').click();
 const beforeGPS=await page.evaluate(()=>localStorage.getItem(Lab.KEY));
 await page.evaluate(()=>{window.gpsCalls=0;Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition:(success,error)=>{window.gpsCalls++;error({code:1});}}});});
 assert(await page.evaluate(()=>window.gpsCalls)===0,'GPS sem acionamento automático');await page.locator('#gps').click();assert((await page.locator('#notice').textContent()).includes('negada'),'GPS negado');
 await page.evaluate(()=>{navigator.geolocation.getCurrentPosition=success=>success({coords:{latitude:-22.869,longitude:-43.341,accuracy:40}});});await page.locator('#gps').click();assert(await page.locator('.gps-marker').count()===1,'GPS temporário visível');assert(await page.evaluate(()=>localStorage.getItem(Lab.KEY))===beforeGPS,'GPS nunca persistido');await page.locator('#gps').click();assert(await page.locator('.gps-marker').count()===0,'Ocultar GPS');
 // Same-location fixtures verify cluster expansion without using real data.
 await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem(Lab.KEY));s.points[1].lat=s.points[0].lat;s.points[1].lng=s.points[0].lng;localStorage.setItem(Lab.KEY,JSON.stringify(s));});await page.reload();await page.waitForSelector('.cluster-icon');
 await page.locator('#closepanel').click();await page.locator('.leaflet-control-zoom-in').click({clickCount:3});const cluster=page.locator('.cluster-icon').first();await cluster.click();await page.waitForFunction(()=>document.querySelectorAll('.point-marker').length>=2);assert(await page.locator('.point-marker').count()>=2,'Expandir coincidentes');
 const viewports=[];
 for(const [width,height] of [[360,800],[390,844],[430,932],[844,390],[1366,900]]){
  await page.setViewportSize({width,height});await page.reload();await page.waitForSelector('.point-marker, .cluster-icon');
  const closed=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);assert(closed,'Overflow fechado '+width);
  await page.locator('#openroute').click();const panel=await page.locator('#panel').boundingBox(),attr=await page.locator('.leaflet-control-attribution').boundingBox(),map=await page.locator('#map').boundingBox();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Overflow aberto '+width);assert(map.height>100,'Mapa utilizável '+width);
  if(width<=860&&height>500)assert(attr.y+attr.height<=panel.y,'Atribuição não coberta '+width);
  await page.locator('#closepanel').click();viewports.push({width,height,mapHeight:Math.round(map.height)});
 }
 assert(errors.length===0,'Erros JS: '+errors.join('; '));
 return {result:'PASS',checks:['migração V0.1 com alteração local','roteiro e reordenação','conclusão e persistência','competência','CRUD e movimento','grupos CRUD','filtros OR','GPS negado e temporário','agrupamento','responsividade'],viewports,errors};
}
