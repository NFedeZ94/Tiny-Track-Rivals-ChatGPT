/* Tiny Track Rivals — Fase 8B: countdown e timer di gara.
 * Nessun cambiamento a durate, effetti, cooldown, suoni o pausa.
 * Script classico; lo stato della gara resta nella closure del legacy. */
(()=>{'use strict';
window.TTRRaceTiming=Object.freeze({create(deps){
 const {getRace,showHint,t,SND}=deps;

 function advanceCountdown(dt){
   const race=getRace();
 const old=Math.ceil(race.countdown);race.countdown-=dt;if(Math.ceil(Math.max(0,race.countdown))!==old){SND.sfx(old>1?'count':'go');}if(race.countdown<=0){showHint(t('go'),.9);SND.music('race');}
 }
 function advanceLiveFrame(dt){
   const race=getRace();
   race.time+=dt;
 race.pickups.forEach(p=>p.cool=Math.max(0,p.cool-dt));race.oils=race.oils.filter(p=>(p.t-=dt)>0);race.effects=race.effects.filter(p=>(p.t-=dt)>0);
 }
 return Object.freeze({advanceCountdown,advanceLiveFrame});
}});
})();
