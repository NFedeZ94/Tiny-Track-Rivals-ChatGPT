/* Tiny Track Rivals — Fase 11a. Presentazione risultati, miniature e musica post-gara.
 * Estrazione conservativa della Fase 10: non modifica classifiche, tempi, punti o regole.
 */
(()=>{'use strict';
 function create(deps){
  const {getRace,$,SND,t,fmtTime,hideEliminationUI,getShowroomStarts,flow,navigation}=deps;
  let resultsMusicTimer=null;
  function cancelMusicTimer(){if(resultsMusicTimer!==null){clearTimeout(resultsMusicTimer);resultsMusicTimer=null;}}

function ttrResultCarCell(car,isPlayer=false){
 const accent=car.variantAccent||car.profile.color;
 return `<span class="result-car-identity"><canvas class="result-car-thumb" data-racer-id="${car.id}" width="192" height="108" aria-hidden="true"></canvas><span class="result-car-label"><span class="variantDot" style="background:${accent}" aria-hidden="true"></span><span class="result-car-name">${car.profile.name}${isPlayer?' ('+t('you')+')':''}</span></span></span>`;
}
function ttrRenderResultThumbnails(panel,completedRace){
 const paint=()=>{
  if(getRace()!==completedRace||!panel.isConnected)return;
  panel.querySelectorAll('.result-car-thumb').forEach(canvas=>{
   const car=completedRace.cars.find(c=>c.id===Number(canvas.dataset.racerId));
   if(car)window.TTRResultVisuals.drawResultThumbnail(canvas,car,getShowroomStarts());
  });
 };
 paint();window.TTRAssets?.ready?.then(paint);
}
function showEliminationResults(){
 const race=getRace();if(!race||race.mode!=='elimination')return;
 const e=race.elim;const sorted=race.cars.slice().sort((a,b)=>(e.points[b.id]-e.points[a.id])||(a.id-b.id));
 const champion=sorted[0];const won=champion===race.player;
 SND.stopMusic();SND.sfx(won?'victoryJingle':'defeatJingle');
 if(resultsMusicTimer!==null)clearTimeout(resultsMusicTimer);
 const completedRace=race;resultsMusicTimer=setTimeout(()=>{resultsMusicTimer=null;if(getRace()===completedRace&&completedRace.finished)SND.music('menu');},4900);
 const panel=document.createElement('div');panel.className='panel resultsPanel compact elimResults';
 panel.innerHTML=`<div class="flag-tape"></div><p class="eyebrow">ELIMINAZIONE · BETA · COLAZIONE TURBO</p><h2>${won?'VITTORIA!':'FINE SFIDA'}</h2><p class="sub">${champion.profile.name} · ${e.points[champion.id]} punti · ${e.roundsCompleted} manche</p>
 <table class="results compact"><tbody>${sorted.map((c,i)=>`<tr class="${c===race.player?'me':''}"><td>${i+1}°</td><td class="result-car-td">${ttrResultCarCell(c,c===race.player)}</td><td><b>${e.points[c.id]} / ${e.goal} pt.</b></td></tr>`).join('')}</tbody></table>
 <div class="menu-row"><button class="btn" id="again">${t('again')}</button><button class="btn secondary" id="toMenu">${t('menu')}</button></div>
 <p class="note">Regole di punteggio provvisorie · non ancora canoniche</p>`;
 $('screen').innerHTML='';$('screen').appendChild(panel);$('screen').hidden=false;$('screen').style.display='flex';
 $('controls').style.display='none';$('hud').style.display='none';hideEliminationUI();
 ttrRenderResultThumbnails(panel,completedRace);
 const actions=flow.resultActions('elimination',navigation);$('again').onclick=actions.again;$('toMenu').onclick=actions.toMenu;
}

function showResults(){
 const race=getRace();if(!race)return;
 if(race.mode==='elimination')return showEliminationResults();const c=race.player,mode=race.mode,finished=race.cars.slice().sort((a,b)=>a.finishTime==null?1:b.finishTime==null?-1:a.finishTime-b.finishTime);let best='';
 if(mode==='trial'&&c.finishTime!=null)best=window.TTRModeTrial.recordBest(c,fmtTime,t);
 const place=finished.indexOf(c)+1,compact=finished.length>=6;
 let careerAward=flow.recordCareerResult(race,c,place,finished.length);

 SND.stopMusic();
 const outcome=mode==='trial'?'podiumJingle':place===1?'victoryJingle':place<=3?'podiumJingle':'defeatJingle';
 SND.sfx(outcome);
 if(resultsMusicTimer!==null)clearTimeout(resultsMusicTimer);
 const completedRace=race;
 resultsMusicTimer=setTimeout(()=>{resultsMusicTimer=null;if(getRace()===completedRace&&completedRace.finished)SND.music('menu');},4600);
 const rows=finished.map((r,i)=>`<tr class="${r===c?'me':''}"><td>${i+1}°</td><td class="result-car-td">${ttrResultCarCell(r,r===c)}</td><td>${r.done?fmtTime(r.finishTime):t('racing')}</td></tr>`).join('');
 const panel=document.createElement('div');panel.className=`panel resultsPanel${compact?' compact':''}`;panel.innerHTML=`<div class="flag-tape"></div><p class="eyebrow">${t('trackName')} · ${t('results')}</p><h2 class="resultTitle">${mode==='trial'?t('trialDone'):`${t('finish')}: ${place}° ${t('place')}`}</h2><div class="resultSummary"><div class="resultCard"><b>${t('place')}</b>${place}° / ${finished.length}</div><div class="resultCard"><b>${t('yourTime')}</b>${fmtTime(race.time)}</div>${best?`<div class="resultCard" style="grid-column:${compact?'1 / -1':'auto'}"><b>${mode==='trial'?'TIME TRIAL':'INFO'}</b>${best}</div>`:''}</div>${mode==='career'?`<div class="career-result">${careerAward?.newUnlocks?.length?'🏆 MISSIONE COMPLETATA · '+careerAward.newUnlocks.map(id=>(window.TTRVehicleRoster||[]).find(v=>v.id===id)?.name||id).join(', '):'🏁 Progressi Carriera aggiornati'}</div>`:''}<table class="results ${compact?'compact':''}"><tbody>${rows}</tbody></table><div class="menu-row"><button class="btn" id="again">${t('again')}</button><button class="btn secondary" id="toMenu">${t('menu')}</button></div>${compact?'':`<p class="note">${t('demoNote')}</p>`}`;
 $('screen').innerHTML='';$('screen').appendChild(panel);$('screen').hidden=false;$('screen').style.display='flex';$('controls').style.display='none';$('hud').style.display='none';
 ttrRenderResultThumbnails(panel,completedRace);
 const actions=flow.resultActions(mode,navigation);$('again').onclick=actions.again;$('toMenu').onclick=actions.toMenu;
}
 return Object.freeze({showResults,showEliminationResults,cancelMusicTimer});
 }
 window.TTRRaceResults=Object.freeze({create});
})();
