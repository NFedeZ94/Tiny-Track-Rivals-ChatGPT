/* Tiny Track Rivals — Fase 7: logica di gara estratta senza alterare gli algoritmi.
 * Script classico: dipendenze iniettate dalla closure del legacy, nessuno stato globale di gara duplicato. */
(()=>{'use strict';
window.TTRRaceSafety=Object.freeze({create(deps){
  const {getRace,setLastHint,trackPoint,tangent,mod,ELIM_RULES_TEST,SND,$,junctionPhaseHop,nearestTrackWindow,phaseGap,points}=deps;

function recoverCar(c,reason='edge'){
 const race=getRace();
 if(race){const log=race.recoveryHistory??=[];if(log.length<512)log.push({car:c.id,reason,time:+race.time.toFixed(3),lap:c.lapsCompleted+1,x:+c.x.toFixed(2),y:+c.y.toFixed(2),phase:c.p,stablePhase:c.routeStableP,pendingPhase:c.routePinch?.phase??null});else race.recoveryHistoryDropped=(race.recoveryHistoryDropped||0)+1;}

 const anchor=c.routePinch?.phase??c.lastCheckpoint??c.lastP??0;
 let safe=c.routePinch?.safe||c.offtrackEntry||c.lastValidPosition||{...trackPoint(anchor),p:anchor,a:tangent(anchor),speed:42,laps:c.lapsCompleted,flags:c.flags.slice(),elimDistance:c.elimDistance};
 let p=mod(safe.p||0,1);if((reason==='cup-cut'||reason==='junction-cut'||reason==='route-cut')&&c.previousValidPosition&&c.previousValidPosition.laps===safe.laps&&mod(p-c.previousValidPosition.p,1)<.10){p=c.previousValidPosition.p;safe=c.previousValidPosition;}if(reason==='cup-cut'&&!safe.mugApexPassed&&p>.30&&p<.44)p=.21;const place=trackPoint(p);
 c.x=place.x;c.y=place.y;c.a=tangent(p);c.p=p;c.lastP=p;
 c.lapsCompleted=safe.laps??c.lapsCompleted;c.flags=(safe.flags||c.flags).slice();
 c.lastValidPosition={x:c.x,y:c.y,p,a:c.a,laps:c.lapsCompleted,flags:c.flags.slice(),mugApexPassed:!!safe.mugApexPassed,elimDistance:safe.elimDistance};c.lastCheckpoint=p;c.previousValidPosition=null;
 c.speed=46;c.jump=0;c.jumpCd=.45;c.boost=0;c.claw=0;c.clawTarget=null;
 c.hitVX=0;c.hitVY=0;c.hitYaw=0;c.impactGrace=0;c.slip=0;c.skidVX=0;c.skidVY=0;c.oilCooldown=0;c.oilSpin=0;
 c.offtrack=false;c.offtrackSeconds=0;c.offtrackEntry=null;c.maxInteriorCut=0;c.offtrackReturnGrace=0;c.offtrackLastDistance=0;c.onBridge=false;c.rampEntryVisual=false;c.bridgeOffSeconds=0;c.bridgeExitVisual=0;c.bridgeContactGrace=0;
 c.bridgeMissActive=false;c.bridgeMissPenalty=0;c.bridgeMissGrace=0;c.bridgeTakeoff=false;c.bridgeFalling=0;c.lapGateBlocked=true;c.respawnGrace=1.1;c.stuckAnchor=null;c.obstacleStuckSeconds=0;
 c.stuckTime=0;c.reverseRecovery=0;c.lastObstacleContact=-100;c.elimDistance=safe.elimDistance??c.elimDistance;c.tryShortcut=false;c.elimBranchStart=null;
 if(race?.mode==='elimination'){
   const now=race.time,progress=c.elimDistance||0;
   const recent=Number.isFinite(c.elimRecoveryWindowStart)&&
     now-c.elimRecoveryWindowStart<ELIM_RULES_TEST.recoveryLoopSeconds&&
     progress-(c.elimRecoveryStartDistance||0)<ELIM_RULES_TEST.recoveryLoopProgress;
   if(!recent){c.elimRecoveryWindowStart=now;c.elimRecoveryStartDistance=progress;c.elimRecoveryCount=1;}
   else c.elimRecoveryCount=(c.elimRecoveryCount||0)+1;
   c.elimLastRecoveryAt=now;
   c.elimLag=0;c.elimProtection=ELIM_RULES_TEST.respawnProtectionSeconds;
   c.elimPrevP=p;c.elimPrevX=c.x;c.elimPrevY=c.y;c.elimTravelSinceCredit=0;
 }
 c.shortcutRespawns=(c.shortcutRespawns||0)+1;c.lastPenaltyReason=reason;c.routeStableP=p;c.routePinch=null;c.orangeLine=null;c.routeResolvedNear=null;c.tableFalling=0;c.tableSpin=0;c.tableFallDir=0;c.auditP=p;c.auditTravel=0;c.auditCleanTime=0;c.auditBridge=false;c.auditOutsideTime=0;c.oilSpin=0;c.bridgeLandingActive=false;c.mugApexPassed=safe.mugApexPassed===true||(safe.mugApexPassed===undefined&&p>.32&&p<.93);
 
 if(c===race.player){SND.sfx('respawn');setLastHint(0);const h=$('hint');if(h){h.textContent='';h.classList.remove('show');}/* Recovery stays silent: no PENALITÀ banner in any mode. */}
}

// 14.14b: Orange Jump inside racing line. This bounded local corridor is not
// a bridge or a general exemption. Credit requires a continuous entry and traversal.
const orangeStart=.485,orangeEnd=.610,orangeWidth=82;
const orangePoints=[trackPoint(orangeStart),{x:1450,y:480},{x:1412,y:412},{x:1374,y:343},{x:1358,y:284},trackPoint(orangeEnd)];
const orangeLengths=[0];for(let i=1;i<orangePoints.length;i++)orangeLengths.push(orangeLengths[i-1]+Math.hypot(orangePoints[i].x-orangePoints[i-1].x,orangePoints[i].y-orangePoints[i-1].y));
const orangeLength=orangeLengths[orangeLengths.length-1];
function orangeProject(c){
  let best=null;
  for(let i=0;i<orangePoints.length-1;i++){
    const a=orangePoints[i],b=orangePoints[i+1],dx=b.x-a.x,dy=b.y-a.y,len=orangeLengths[i+1]-orangeLengths[i];
    const t=Math.max(0,Math.min(1,((c.x-a.x)*dx+(c.y-a.y)*dy)/(len*len)));
    const x=a.x+dx*t,y=a.y+dy*t,d=Math.hypot(c.x-x,c.y-y);
    if(!best||d<best.distance){const u=orangeLengths[i]+t*len;best={x,y,distance:d,u,p:orangeStart+(orangeEnd-orangeStart)*u/orangeLength,nx:-dy/len,ny:dx/len};}
  }return best;
}
function orangeContinuity(c,near,anchor,step,dt){
  if(near.shortcut||anchor<.45||anchor>.635){c.orangeLine=null;return null;}
  const q=orangeProject(c);let state=c.orangeLine;
  if(!state){
    // Arm only while actually on the preceding road, never on the exit arm.
    if(anchor<.472||anchor>.515||near.p<.465||near.p>.525||near.distance>138||q.distance>orangeWidth||q.u>orangeLength*.30||step>35)return null;
    state=c.orangeLine={u:q.u,travel:0,entryU:q.u,entryPhase:anchor,active:false,safe:c.lastValidPosition?{...c.lastValidPosition,flags:c.lastValidPosition.flags.slice()}:null};
  }
  // A large jump or departure from this corridor cannot earn its progress.
  if(q.distance>orangeWidth||step>40||Math.abs(q.u-state.u)>step*2+24){
    c.orangeLine=null;
    if(!state.active)return null;
    if(near.distance<=138&&phaseGap(near.p,anchor)<.025){c.routePinch=null;c.routeStableP=near.p;return {near,penalty:false};}
    c.routeStableP=state.entryPhase;c.routePinch={phase:state.entryPhase,elapsed:0,travel:0,safe:state.safe};return null;
  }
  state.travel+=step;state.u=q.u;
  if(!state.active){
    const local=nearestTrackWindow(c,points,anchor,.022);
    // Leave the main centreline only if the alternative is actually being followed.
    if(state.travel>=35&&q.u-state.entryU>=24&&q.p>anchor+.012&&(local.distance>90||phaseGap(anchor,near.p)>.035))state.active=true;
    else return null;
  }
  c.routePinch=null;
  // A complete traversal, not just landing near a coordinate on the exit arm.
  if(q.u>=orangeLength*.72&&state.travel>=orangeLength*.50&&q.u-state.entryU>=orangeLength*.43&&near.p>=.585&&near.p<=.625&&near.distance<=138&&Math.abs(near.p-anchor)<.0045){
    c.orangeLine=null;c.routeStableP=near.p;c.auditP=near.p;c.auditTravel=0;c.auditCleanTime=0;c.auditOutsideTime=0;return {near,penalty:false};
  }
  const limit=Math.max(.001,step*.00085),delta=Math.max(-limit,Math.min(limit,q.p-anchor));
  const phase=anchor+delta;c.routeStableP=phase;
  return {near:{...q,p:phase,distance:Math.min(138,Math.max(q.distance,near.distance)),shortcut:false,orangeLine:true},penalty:false};
}

function junctionContinuity(c,near,oldX,oldY,dt){
  const step=Math.hypot(c.x-oldX,c.y-oldY);
  if(c.onBridge||c.bridgeLandingActive||c.bridgeMissActive||c.tableFalling>0||c.respawnGrace>0||c.impactGrace>0){
    c.routePinch=null;
    if(c.respawnGrace>0&&!c.onBridge&&!c.bridgeLandingActive&&!c.bridgeMissActive&&!(c.tableFalling>0)){
      const anchor=c.routeStableP??c.lastP??near.p;
      const inside=orangeContinuity(c,near,anchor,step,dt);if(inside)return inside;
      const legal=nearestTrackWindow(c,points,c.routeStableP??anchor,.018);
      // Advance the recovery anchor along the real road, never across another arm.
      if(legal.distance<=158)c.routeStableP=legal.p;
      return {near:{...legal,shortcut:false},penalty:false};
    }
    c.orangeLine=null;c.routeStableP=near.p;return {near,penalty:false};
  }
  let anchor=c.routeStableP??c.lastP??near.p;
  const inside=orangeContinuity(c,near,anchor,step,dt);if(inside)return inside;
  anchor=c.routeStableP??anchor;
  const orangeBend=anchor>.44&&anchor<.61;
  if(orangeBend&&!near.shortcut&&(c.routePinch||phaseGap(anchor,near.p)>.025)){
    const local=nearestTrackWindow(c,points,anchor,.012);
    // A narrow projection follows the car, not the original suspicion point.
    // Never credit the other arm while it is geometrically closer.
    if(local.distance<=158){
      c.routePinch=null;c.routeStableP=local.p;
      return {near:{...local,shortcut:false},penalty:false};
    }
  }
  if(!c.routePinch && !near.shortcut && (junctionPhaseHop(anchor,near.p,step)||(step<55&&phaseGap(anchor,near.p)>.075))){
    c.routePinch={phase:anchor,elapsed:0,travel:0,safe:c.lastValidPosition?{...c.lastValidPosition,flags:c.lastValidPosition.flags.slice()}:null};
  }
  if(c.routePinch){
    const pending=c.routePinch;
    const legal=nearestTrackWindow(c,points,pending.phase,.07);
    const moving=nearestTrackWindow(c,points,anchor,.012);
    pending.elapsed+=dt;pending.travel+=Math.min(step,40);
    if(phaseGap(near.p,pending.phase)<.066 && near.distance<118){
      c.routePinch=null;c.routeStableP=near.p;return {near,penalty:false};
    }
    // Strong evidence from geometry + sustained actual travel, not a noisy nearest-phase projection.
    // Require sustained, substantial travel away from the *previous* arm:
    // tiny inside-corner cuts must not trigger an instant teleport.
    const illegal=(pending.travel>66&&pending.elapsed>.38&&legal.distance>185&&near.distance<105) ||
      (pending.travel>88&&pending.elapsed>.65&&legal.distance>159&&near.distance<42);
    if(illegal||(pending.elapsed>.35&&near.distance<120&&legal.distance>165&&phaseGap(near.p,pending.phase)>.10)){if(pending.safe)c.offtrackEntry=pending.safe;return {near:legal,penalty:true};}
    // Keep the pending origin for evidence and recovery; do not let a wide
    // search silently migrate the accepted route to an unrelated arm.
    if(moving.distance<=158)c.routeStableP=moving.p;
    return {near:{...moving,shortcut:false},penalty:false,pending:true};
  }
  c.routeStableP=near.p;return {near,penalty:false};
}

function finishEdgeTolerance(c,near){
   return !!near && !near.shortcut && (near.p>.905 || near.p<.065)
     && near.distance<=186 && (c.offtrackSeconds||0)<=1.6
     && (!c.offtrackEntry || c.offtrackEntry.p>.80)
     && (c.maxInteriorCut||0)<205 && (c.auditOutsideTime||0)<1.65
     && !c.onBridge && !c.bridgeMissActive && !c.bridgeLandingActive
     && !c.routePinch && !(c.respawnGrace>0) && !(c.tableFalling>0);
 }

function bridgeFall(c){
 const race=getRace();

 if(c.bridgeMissGrace>0)return false;
 c.bridgeTakeoff=false;
 c.onBridge=false;c.rampEntryVisual=false;c.bridgeOffSeconds=0;c.bridgeExitVisual=0;c.bridgeMissGrace=10.0;c.bridgeMissPenalty=1.60;c.bridgeMissActive=true;c.bridgeLandingActive=true;
 c.bridgeFalling=.48;c.jump=0;c.jumpCd=.85;c.boost=0;
 c.speed=Math.min(40,Math.max(12,Math.abs(c.speed)*.22));
 c.hitVX=(c.hitVX||0)*.18;c.hitVY=(c.hitVY||0)*.18;
 c.lapGateBlocked=true;
 if(c===race?.player)SND.sfx('impact');
 return true;
}

function startTableFall(c){
 const race=getRace();

 if((c.tableFalling||0)>0)return false;
 c.tableFalling=1.22;c.tableFallImpact=false;c.tableFallX=c.x;c.tableFallY=c.y;c.tableSpin=(Math.random()<.5?-1:1)*(7.8+Math.random()*1.5);
 c.tableFallDir=(Math.random()<.5?-1:1);
 c.jump=0;c.jumpCd=Math.max(c.jumpCd||0,.92);c.boost=0;c.claw=0;c.clawTarget=null;
 c.speed=Math.min(Math.max(Math.abs(c.speed),42),120);
 c.hitVX=(c.hitVX||0)*.25;c.hitVY=(c.hitVY||0)*.25;c.lapGateBlocked=true;
 if(c===race?.player)SND.sfx('fall');
 return true;
}
 return Object.freeze({recoverCar,junctionContinuity,finishEdgeTolerance,bridgeFall,startTableFall});
}});
})();
