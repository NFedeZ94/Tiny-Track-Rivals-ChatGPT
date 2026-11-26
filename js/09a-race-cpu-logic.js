/* Tiny Track Rivals — CPU recovery and tactical power-ups. */
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
function tacticalTurboSafe(c,race){
 const K=window.TTRCore,T=race.trackId==='garage-grid'?window.TTRGarageTrack:race.trackId==='desk-drift'?window.TTRDeskTrack:race.trackId==='bagno-sprint'?window.TTRBathTrack:race.trackId==='box-di-biliardo'?window.TTRBoxTrack:null;
 if(c.onBridge||c.jump>0||c.slip>.1||c.oilSpin>0||c.boost>0||c.respawnGrace>0||c.reverseRecovery>0||c.aiRecoveryUntil>race.time||c.aiOilSeen||c.deskTry||c.tryShortcut||c.boxTryPocket||c.boxTransit>0||c.bridgeExitVisual>0||c.deskExitRamp||c.jamTimer>0)return false;
 const p=c.routeStableP??c.p,point=T?T.point:K.trackPoint,tangent=T?T.tangent:K.tangent,length=T?T.length:K.TRACK_LENGTH;
 if(T?.brush&&p>T.brush.start-.045&&p<T.brush.end+.007)return false;
 const horizon=Math.max(150,c.speed*.85),a=tangent(p),fx=Math.cos(c.a),fy=Math.sin(c.a);
 if(Math.abs(K.angleDiff(a,c.a))>.35)return false;
 for(const d of [horizon*.45,horizon*.85,horizon*1.15]){
  const phase=K.mod(p+d/length,1),q=point(phase);
  if(Math.abs(K.angleDiff(tangent(phase),a))>.46||T?.wet?.(q)||T?.pockets?.some(o=>distance(o,q)<(o.r||30)+45))return false;
  if(props.some(o=>o.solid&&distance(o,q)<(o.r||25)+40))return false;
 }
 const ahead=o=>{const dx=o.x-c.x,dy=o.y-c.y,f=dx*fx+dy*fy,l=-dx*fy+dy*fx;return f>0&&f<horizon&&Math.abs(l)<52;};
 if(race.cars.some(o=>o!==c&&!o.done&&!o.eliminated&&!o.boxTransit&&!!o.onBridge===!!c.onBridge&&ahead(o)&&o.speed<c.speed+25))return false;
 if(race.oils?.some(o=>o.owner!==c.id&&(o.t??1)>0&&ahead(o)&&(race.trackId!=='desk-drift'||!o.deskDeck)))return false;
 return true;
}
function useTacticalPowerup(c) {
 const race=getRace(),onlineSession=getOnlineSession();
 if(c===race.player||(race.mode==='online'&&onlineSession?.members[c.id])||!c.item)return;
 if(race.mode==='online'){const f=1;if(c.item==='turbo'&&c.speed>95&&Math.random()<.005*f)useItem(c);else if(c.item==='oil'&&Math.random()<.0008*f)useItem(c);else if(c.item==='claw'&&clawTarget(c,race.cars,props,162,.30)&&Math.random()<.09*f)useItem(c);return;}
 const level=race.aiFactor<.95?0:race.aiFactor<1.1?1:2;
 if((c.aiItemCheckAt||0)>race.time)return;
 c.aiItemCheckAt=race.time+[.95,.48,.10][level]+Math.random()*.12;
 if(c.item==='turbo'){
   const aligned=Math.abs(c.steer||0)<[.35,.48,.58][level];
   if(c.speed>95&&aligned&&!c.onBridge&&(level===2?tacticalTurboSafe(c,race):Math.random()<[.25,.65][level]))useItem(c);
 }else if(c.item==='oil'){
   const behind=race.cars.some(o=>o!==c&&!o.done&&!o.eliminated&&!o.onBridge&&Math.hypot(o.x-c.x,o.y-c.y)<175&&(o.x-c.x)*Math.cos(c.a)+(o.y-c.y)*Math.sin(c.a)<-20);
   const pursuing=level===2&&race.cars.some(o=>o!==c&&!o.done&&!o.eliminated&&!o.boxTransit&&!!o.onBridge===!!c.onBridge&&distance(c,o)<245&&(o.x-c.x)*Math.cos(c.a)+(o.y-c.y)*Math.sin(c.a)<-20&&Math.abs(-(o.x-c.x)*Math.sin(c.a)+(o.y-c.y)*Math.cos(c.a))<65);
   if((!c.onBridge&&behind||pursuing&&(race.trackId==='desk-drift'||!c.onBridge))&&Math.random()<[.25,.65,.95][level])useItem(c);
 }else if(c.item==='claw'&&clawTarget(c,race.cars,props,162,.30)&&Math.random()<[.25,.65,.95][level])useItem(c);
}
 return Object.freeze({updateRecovery,useTacticalPowerup});
}});
})();
