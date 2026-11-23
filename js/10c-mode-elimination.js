/* Tiny Track Rivals — Fase 10c: regole Eliminazione e stato delle manche. */
(()=>{'use strict';
 window.TTRModeElimination=Object.freeze({
  settings(cfg,selectedCar){return {
   num:Number(cfg?.racers||4),pr:selectedCar,
   aiFactor:Number(cfg?.difficulty||1),auto:cfg?.auto!=='0'
  };},
  initialState(num,goalInput,defaultGoal){return {
   goal:Math.max(3,Math.min(7,Number(goalInput||defaultGoal))),
   points:Array(num).fill(0),round:1,roundTime:0,state:'race',
   timer:0,winner:null,roundsCompleted:0
  };},
  create(deps){
   const {getRace,getI18N,K,SND,$,LANE_HALF,TRACK_LENGTH,nearestTrack,nearestTrackWindow,
    nearestCourse,tangent,points,elimBanner,elimDisplayName,refreshEliminationBoard,
    eliminationNewRound,eliminationCameraLeader,eliminationViewBounds,
    eliminationPhysicalOvertake,eliminationProjectedAhead,ELIM_RULES_TEST,
    hideEliminationUI,showResults}=deps;
function eliminationActive(){const race=getRace();return race.cars.filter(c=>!c.eliminated&&!c.done);}

function knockOutElimination(c,reason='distacco'){const race=getRace();
 if(!race||race.mode!=='elimination'||race.elim.state!=='race'||c.eliminated||c.done)return false;
 c.eliminated=true;c.done=true;c.speed=0;c.jump=0;c.boost=0;c.item=null;c.claw=0;c.clawTarget=null;
 race.effects.push({kind:'elimMark',text:'✕',color:'#ff7878',x:c.x,y:c.y,t:.84,ttl:.84,reason});
 if(c===race.player)SND.sfx('elimOut');
 refreshEliminationBoard();return true;
}

function awardEliminationPoint(winner){const race=getRace();const I18N=getI18N();
 const e=race.elim;if(e.state!=='race')return false;
 const physicalNearest=nearestTrack(winner,points);
 const near=physicalNearest.distance<=LANE_HALF+130?physicalNearest:nearestTrackWindow(winner,points,winner.p,.07);
 e.restartPhase=Number.isFinite(near.p)?near.p:winner.p;
 e.restartWorld={x:winner.x,y:winner.y};
 e.state='celebration';e.winner=winner.id;e.points[winner.id]++;e.timer=2.2;e.roundsCompleted++;
 winner.elimCelebration=1.56;race.oils=[];SND.stopMusic();SND.sfx(e.points[winner.id]>=e.goal?'victoryJingle':'elimPoint');
 const lang=I18N.lang||'it';
 $('elimBannerTitle').textContent=e.points[winner.id]>=e.goal?'VITTORIA!':'PUNTO! +1';
 $('elimBannerSub').textContent=`${winner.profile.name} · ${elimDisplayName(winner)} · ${e.points[winner.id]} / ${e.goal}`;
 elimBanner.style.display='flex';refreshEliminationBoard();
 return true;
}

function eliminationProgressUpdate(c,pr,dt){
 // Rank racers by *credible forward course progress*, including a shallow legal
 // inside-corner cut. Leaving the crumb lane is NOT itself a camera disqualification:
 // only the existing recovery/route guards decide whether that drive was illegal.
 if(c.eliminated||c.done||c.tableFalling>0)return;
 const prev=c.elimPrevP??pr;
 const deltaX=c.x-(c.elimPrevX??c.x),deltaY=c.y-(c.elimPrevY??c.y);
 const moved=Math.hypot(deltaX,deltaY);
 const forward=K.forwardProgress(prev,pr),reverse=K.forwardProgress(pr,prev);
 const gain=forward*TRACK_LENGTH;
 const near=nearestCourse(c,points);
 const recovering=(c.respawnGrace>0)||c.bridgeMissActive||c.bridgeLandingActive||!!c.routePinch;
 const legal=c.speed>9&&!recovering&&near.distance<=228&&
   (!(c.offtrack)||((c.offtrackSeconds||0)<2.2||(c.offtrackReturnGrace||0)>0));
 // Two independent, bounded measures of forward motion: phase progression
 // PLUS physical displacement along the track tangent. The latter handles
 // shallow inside-corner overtakes when projection is stationary or regresses.
 if(!legal){c.elimTravelSinceCredit=0;}
 else {
   const frameLimit=Math.max(9,Math.abs(c.speed)*dt*1.9+5);
   const continuous=moved<=frameLimit*1.45;
   c.elimTravelSinceCredit=Math.min(420,(c.elimTravelSinceCredit||0)+Math.min(moved,frameLimit));
   const plausible=Math.max(28,c.elimTravelSinceCredit*1.65+22);
   const projected=(reverse>.5&&forward<.09&&gain<=plausible&&continuous)?gain:0;
   const tx=Math.cos(tangent(prev)),ty=Math.sin(tangent(prev));
   const tangentTravel=deltaX*tx+deltaY*ty;
   // Strictly local, forward-only, no teleports, and never award shortcut
   // progression twice. A lateral collision cannot manufacture a camera lead.
   const physical=(!near.shortcut&&continuous&&tangentTravel>0&&
     tangentTravel>=moved*.22)?Math.min(tangentTravel*.91,frameLimit):0;
   const credit=Math.max(projected,physical);
   if(credit>.01){c.elimDistance=(c.elimDistance||0)+credit;c.elimTravelSinceCredit=0;}
 }
 c.elimPrevP=pr;c.elimPrevX=c.x;c.elimPrevY=c.y;
}

function eliminationEvaluate(dt){const race=getRace();
 const e=race.elim;if(e.state!=='race'||race.countdown>0)return;
 e.roundTime+=dt;
 let active=eliminationActive();
 if(active.length===1){awardEliminationPoint(active[0]);return;}
 if(active.length===0){eliminationNewRound();return;}
 const leader=eliminationCameraLeader();
 const view=eliminationViewBounds(),margin=ELIM_RULES_TEST.edgeMargin;
 const lensSettled=Math.abs(leader.x-view.x)<view.halfW*.43&&
                   Math.abs(leader.y-view.y)<view.halfH*.43;
 const cameraSettled=race.time-(e.lastLeaderSwitchTime??-999)>=ELIM_RULES_TEST.leaderSwitchGrace;
 const queued=[];
 for(const c of active){
   c.elimProtection=Math.max(0,(c.elimProtection||0)-dt);
   const progress=c.elimDistance||0;
   if(!Number.isFinite(c.elimLastMeaningfulProgress))c.elimLastMeaningfulProgress=progress;
   if(progress-c.elimLastMeaningfulProgress>=20){
     c.elimLastMeaningfulProgress=progress;c.elimStallSeconds=0;
   }else c.elimStallSeconds=Math.min(40,(c.elimStallSeconds||0)+dt);
   if(e.roundTime<ELIM_RULES_TEST.minimumRoundSeconds)continue;
   const recoveryCount=c.elimRecoveryCount||0;
   const recoveringRepeatedly=recoveryCount>=ELIM_RULES_TEST.recoveryLoopCount&&
      race.time-(c.elimRecoveryWindowStart??-999)<=ELIM_RULES_TEST.recoveryLoopSeconds&&
      progress-(c.elimRecoveryStartDistance||0)<ELIM_RULES_TEST.recoveryLoopProgress;
   // Three rescues in one short span with negligible forward progress represent
   // the same stuck loop, even when each rescue refreshes respawn protection.
   if(recoveringRepeatedly&&
      ((c.elimStallSeconds||0)>1.0||recoveryCount>=4)){
       queued.push([c,'respawn ripetuti']);continue;
   }
   if(c!==leader&&recoveryCount>=1&&(c.elimStallSeconds||0)>9){
       queued.push([c,'bloccata']);continue;
   }
   if(c===leader){c.elimLag=0;continue;}
   const physical=Math.hypot(leader.x-c.x,leader.y-c.y);
   const beyondX=Math.abs(c.x-view.x)-view.halfW-margin;
   const beyondY=Math.abs(c.y-view.y)-view.halfH-margin;
   const outside=beyondX>0||beyondY>0;
   const behind=(leader.elimDistance||0)-(c.elimDistance||0);
   const isActuallyInFront=eliminationPhysicalOvertake(c,leader)||
                           eliminationProjectedAhead(c,leader);
   // A competitor far behind and continuously outside the real viewport must
   // not wait for a second exit because of camera settling or a recovery loop.
   const farBehind=behind>220&&Math.max(beyondX,beyondY)>30;
   const protectedRecovery=(c.respawnGrace>0)||(c.elimProtection>0)||
       (c.impactGrace>0)||(c.bridgeMissGrace>0)||(c.bridgeMissActive);
   const safeToCheck=outside&&!isActuallyInFront&&behind>35&&
       physical>ELIM_RULES_TEST.physicalSeparation&&!(c.tableFalling>0)&&
       (farBehind||(cameraSettled&&lensSettled));
   // Accumulate independently for each racer; brief camera shifts do not
   // zero the timer. Deeply trailing cars cannot renew immunity indefinitely.
   c.elimLag=safeToCheck?(c.elimLag||0)+dt:Math.max(0,(c.elimLag||0)-dt*.7);
   const enoughOutside=c.elimLag>=ELIM_RULES_TEST.sustainedTrailSeconds;
   if(safeToCheck&&enoughOutside&&(!protectedRecovery||farBehind))
     queued.push([c,'fuori schermo']);
 }
 // Commit the entire batch before checking whether only one competitor remains.
 for(const [car,reason] of queued)knockOutElimination(car,reason);
 active=eliminationActive();
 if(active.length===1)awardEliminationPoint(active[0]);
 else if(active.length===0)eliminationNewRound();
}

function eliminationEndPoint(dt){const race=getRace();
 const e=race.elim;if(e.state!=='celebration')return false;
 e.timer=Math.max(0,e.timer-dt);
 for(const c of race.cars)c.elimCelebration=Math.max(0,(c.elimCelebration||0)-dt);
 if(e.timer<=0){
  if(e.points[e.winner]>=e.goal){race.finished=true;hideEliminationUI();showResults();}
  else eliminationNewRound();
 }
 return true;
}
   return Object.freeze({eliminationActive,knockOutElimination,awardEliminationPoint,
    eliminationProgressUpdate,eliminationEvaluate,eliminationEndPoint});
  }
 });
})();
