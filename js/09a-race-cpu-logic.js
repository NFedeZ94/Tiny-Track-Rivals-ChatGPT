/* Tiny Track Rivals — Fase 9: CPU: recupero da blocco e uso tattico dei power-up.
 * Estrazione meccanica dei blocchi della fase 8. Nessuna modifica a condizioni, costanti o ordine.
 * Lo stato resta nella closure del legacy; dipendenze iniettate esplicitamente. */
(()=>{'use strict';
window.TTRRaceCPU=Object.freeze({create(deps){
 const {getRace,getOnlineSession,distance,recoverCar,clawTarget,props,useItem}=deps;
function updateRecovery(c,dt) {
 const race=getRace(),onlineSession=getOnlineSession();
 // CPU recovery: attempt steering and reversing before checkpoint respawn.
 if(c.onBridge||c.bridgeExitVisual>0){c.aiProgressWindow=null;c.stuckTime=0;c.reverseRecovery=0;c.lastMoveX=c.x;c.lastMoveY=c.y;return;}
 if(c!==race.player&&!(race.mode==='online'&&onlineSession?.members[c.id])){const progress=distance(c,{x:c.lastMoveX??c.x,y:c.lastMoveY??c.y});
  c.stuckTime=(c.stuckTime||0)+(Math.abs(c.speed)<24&&progress<3?dt:-dt*.65);
  c.stuckTime=Math.max(0,c.stuckTime);
  if(c.stuckTime>2.3&&c.reverseRecovery<=0)c.reverseRecovery=.75;
  if(c.stuckTime>5){recoverCar(c,'cpu-stuck');c.speed=48;}
  if(race.mode!=='online'){
   const q=c.routeResolvedNear?.p??c.p, phase=(q%1+1)%1;
   let w=c.aiProgressWindow;
   if(!w||w.lap!==c.lapsCompleted||w.round!==race.elim?.round||w.recoveries!==(c.shortcutRespawns||0))w=c.aiProgressWindow={p:phase,time:race.time,lap:c.lapsCompleted,round:race.elim?.round,recoveries:c.shortcutRespawns||0};
   const advance=(phase-w.p+1)%1;
   if(advance>.008&&advance<.5){w.p=phase;w.time=race.time;w.attempted=false;}
   else if(race.time-w.time>3.2){c.tryShortcut=false;c.aiRecoveryUntil=race.time+2.2;if(!w.attempted){w.attempted=true;c.reverseRecovery=.55;}else if(race.time-w.time>6){recoverCar(c,'cpu-no-progress');c.speed=48;c.aiProgressWindow=null;}}
  }
  c.lastMoveX=c.x;c.lastMoveY=c.y;
 }
}


function useTacticalPowerup(c) {
 const race=getRace(),onlineSession=getOnlineSession();
 // Tactical decisions on elapsed time, not random rolls on every frame.
 if(c===race.player||(race.mode==='online'&&onlineSession?.members[c.id])||!c.item)return;
 if(race.mode==='online'){const f=1;if(c.item==='turbo'&&c.speed>95&&Math.random()<.005*f)useItem(c);else if(c.item==='oil'&&Math.random()<.0008*f)useItem(c);else if(c.item==='claw'&&clawTarget(c,race.cars,props,162,.30)&&Math.random()<.09*f)useItem(c);return;}
 const level=race.aiFactor<.95?0:race.aiFactor<1.1?1:2;
 if((c.aiItemCheckAt||0)>race.time)return;
 c.aiItemCheckAt=race.time+[.95,.48,.20][level]+Math.random()*.12;
 if(c.item==='turbo'){
   const aligned=Math.abs(c.steer||0)<[.35,.48,.56][level];
   if(c.speed>95&&aligned&&!c.onBridge&&Math.random()<[.25,.65,.95][level])useItem(c);
 }else if(c.item==='oil'){
   const behind=race.cars.some(o=>o!==c&&!o.done&&!o.eliminated&&!o.onBridge&&Math.hypot(o.x-c.x,o.y-c.y)<175&&(o.x-c.x)*Math.cos(c.a)+(o.y-c.y)*Math.sin(c.a)<-20);
   if(!c.onBridge&&behind&&Math.random()<[.25,.65,.95][level])useItem(c);
 }else if(c.item==='claw'&&clawTarget(c,race.cars,props,162,.30)&&Math.random()<[.25,.65,.95][level])useItem(c);

}
 return Object.freeze({updateRecovery, useTacticalPowerup});
}});
})();
