/* Tiny Track Rivals — Fase 9: CPU: recupero da blocco e uso tattico dei power-up.
 * Estrazione meccanica dei blocchi della fase 8. Nessuna modifica a condizioni, costanti o ordine.
 * Lo stato resta nella closure del legacy; dipendenze iniettate esplicitamente. */
(()=>{'use strict';
window.TTRRaceCPU=Object.freeze({create(deps){
 const {getRace,getOnlineSession,distance,recoverCar,clawTarget,props,useItem}=deps;
function updateRecovery(c,dt) {
 const race=getRace(),onlineSession=getOnlineSession();
 // CPU recovery: attempt steering and reversing before checkpoint respawn.
 if(c!==race.player&&!(race.mode==='online'&&onlineSession?.members[c.id])){const progress=distance(c,{x:c.lastMoveX??c.x,y:c.lastMoveY??c.y});
  c.stuckTime=(c.stuckTime||0)+(Math.abs(c.speed)<24&&progress<3?dt:-dt*.65);
  c.stuckTime=Math.max(0,c.stuckTime);
  if(c.stuckTime>2.3&&c.reverseRecovery<=0)c.reverseRecovery=.75;
  if(c.stuckTime>5){recoverCar(c,'cpu-stuck');c.speed=48;}
  c.lastMoveX=c.x;c.lastMoveY=c.y;
 }
}


function useTacticalPowerup(c) {
 const race=getRace(),onlineSession=getOnlineSession();
 // AI uses boosts tactically, not excessive oil spam.
 if(c!==race.player&&!(race.mode==='online'&&onlineSession?.members[c.id])&&c.item){if(c.item==='turbo'&&c.speed>95&&Math.random()<.005)useItem(c);else if(c.item==='oil'&&Math.random()<.0008)useItem(c);else if(c.item==='claw'&&clawTarget(c,race.cars,props,162,.30)&&Math.random()<.09)useItem(c);}
}
 return Object.freeze({updateRecovery, useTacticalPowerup});
}});
})();
