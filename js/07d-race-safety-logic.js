/* Tiny Track Rivals — Fase 7: logica di gara estratta senza alterare gli algoritmi.
 * Script classico: dipendenze iniettate dalla closure del legacy, nessuno stato globale di gara duplicato. */
(()=>{'use strict';
window.TTRRaceSafety=Object.freeze({create(deps){
  const {getRace,setLastHint,trackPoint,tangent,mod,ELIM_RULES_TEST,SND,$,junctionPhaseHop,nearestTrackWindow,phaseGap,points}=deps;

function recoverCar(c,reason='edge'){
 const race=getRace();

 const anchor=c.routePinch?.phase??c.lastCheckpoint??c.lastP??0;
 let safe=c.routePinch?.safe||c.offtrackEntry||c.lastValidPosition||{...trackPoint(anchor),p:anchor,a:tangent(anchor),speed:42,laps:c.lapsCompleted,flags:c.flags.slice(),elimDistance:c.elimDistance};
 let p=mod(safe.p||0,1);if((reason==='cup-cut'||reason==='junction-cut'||reason==='route-cut')&&c.previousValidPosition&&c.previousValidPosition.laps===safe.laps&&mod(p-c.previousValidPosition.p,1)<.10){p=c.previousValidPosition.p;safe=c.previousValidPosition;}if(reason==='cup-cut'&&!safe.mugApexPassed&&p>.30&&p<.44)p=.21;const place=trackPoint(p);
 c.x=place.x;c.y=place.y;c.a=tangent(p);c.p=p;c.lastP=p;
 c.lapsCompleted=safe.laps??c.lapsCompleted;c.flags=(safe.flags||c.flags).slice();
 c.lastValidPosition={x:c.x,y:c.y,p,a:c.a,laps:c.lapsCompleted,flags:c.flags.slice(),mugApexPassed:!!safe.mugApexPassed,elimDistance:safe.elimDistance};c.lastCheckpoint=p;c.previousValidPosition=null;
 c.speed=46;c.jump=0;c.jumpCd=.45;c.boost=0;c.claw=0;c.clawTarget=null;
 c.hitVX=0;c.hitVY=0;c.hitYaw=0;c.impactGrace=0;c.slip=0;c.skidVX=0;c.skidVY=0;c.oilCooldown=0;c.oilSpin=0;
 c.offtrack=false;c.offtrackSeconds=0;c.offtrackEntry=null;c.maxInteriorCut=0;c.offtrackReturnGrace=0;c.offtrackLastDistance=0;c.onBridge=false;c.rampEntryVisual=false;c.bridgeOffSeconds=0;c.bridgeExitVisual=0;
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
 c.shortcutRespawns=(c.shortcutRespawns||0)+1;c.lastPenaltyReason=reason;c.routeStableP=p;c.routePinch=null;c.routeResolvedNear=null;c.tableFalling=0;c.tableSpin=0;c.tableFallDir=0;c.auditP=p;c.auditTravel=0;c.auditCleanTime=0;c.auditBridge=false;c.auditOutsideTime=0;c.oilSpin=0;c.bridgeLandingActive=false;c.mugApexPassed=safe.mugApexPassed===true||(safe.mugApexPassed===undefined&&p>.32&&p<.93);
 
 if(c===race.player){SND.sfx('respawn');setLastHint(0);const h=$('hint');if(h){h.textContent='';h.classList.remove('show');}/* Recovery stays silent: no PENALITÀ banner in any mode. */}
}

function junctionContinuity(c,near,oldX,oldY,dt){
  const step=Math.hypot(c.x-oldX,c.y-oldY);
  if(c.onBridge||c.bridgeLandingActive||c.bridgeMissActive||c.tableFalling>0||c.respawnGrace>0||c.impactGrace>0){
    c.routePinch=null;if(c.respawnGrace>0){const legal=nearestTrackWindow(c,points,c.routeStableP??c.lastP??near.p,.055);return {near:legal,penalty:false};}c.routeStableP=near.p;return {near,penalty:false};
  }
  const anchor=c.routeStableP??c.lastP??near.p;
  if(!c.routePinch && !near.shortcut && (junctionPhaseHop(anchor,near.p,step)||(step<55&&phaseGap(anchor,near.p)>.075))){
    c.routePinch={phase:anchor,elapsed:0,travel:0,safe:c.lastValidPosition?{...c.lastValidPosition,flags:c.lastValidPosition.flags.slice()}:null};
  }
  if(c.routePinch){
    const pending=c.routePinch;
    const legal=nearestTrackWindow(c,points,pending.phase,.07);
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
    c.routeStableP=legal.p;
    return {near:{...legal,shortcut:false},penalty:false,pending:true};
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
