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
 if(c.eliminated||c.done||c.tableFalling>0)return;
 const prev=c.elimPrevP??pr;
 const moved=Math.hypot(c.x-(c.elimPrevX??c.x),c.y-(c.elimPrevY??c.y));
 c.elimPrevX=c.x;c.elimPrevY=c.y;
 c.elimTravelSinceCredit=Math.min(240,(c.elimTravelSinceCredit||0)+moved);
 // The safety module owns legal route validation; a provisional pinch must never score.
 if(c.routePinch||c.bridgeMissActive)return;
 let near=c.routeResolvedNear||nearestCourse(c,points);
 if(c.onBridge){const bridge=K.shortcutNearest(c);if(bridge.distance<75)near=bridge;}
 else if(near.shortcut){near=nearestTrackWindow(c,points,prev,.055);}
 const signed=(K.forwardProgress(prev,near.p)+.5)%1-.5;
 const distance=signed*TRACK_LENGTH;
 const budget=Math.max(28,c.elimTravelSinceCredit*3+20);
 if(near.distance>228||Math.abs(distance)>budget){
   // Reproject locally, rather than rebasing onto an unrelated neighbouring bend.
   if(c.onBridge)return;
   near=nearestTrackWindow(c,points,prev,.045);
 }
 const delta=((K.forwardProgress(prev,near.p)+.5)%1-.5)*TRACK_LENGTH;
 if(near.distance>228||Math.abs(delta)>budget)return;
 c.elimDistance=(c.elimDistance||0)+delta;c.elimPrevP=near.p;
 c.elimTravelSinceCredit=0;
}
function eliminationRanking(){const active=eliminationActive();return active.sort((a,b)=>(b.elimDistance||0)-(a.elimDistance||0)||a.id-b.id);}
function eliminationEvaluate(dt){const race=getRace(),e=race.elim;
 if(e.state!=='race'||race.countdown>0)return;
 e.roundTime+=dt;
 const ranked=eliminationRanking();
 if(ranked.length===1){awardEliminationPoint(ranked[0]);return;}
 if(!ranked.length){eliminationNewRound();return;}
 const leader=eliminationCameraLeader(),last=ranked.at(-1),view=eliminationViewBounds(),margin=ELIM_RULES_TEST.edgeMargin;
 for(const c of ranked){c.elimProtection=Math.max(0,(c.elimProtection||0)-dt);if(c!==last)c.elimLag=0;}
 // Use one ordering for camera and KO. Require sustained exit from BOTH the current
 // viewport and its leader-centred target; camera movement itself cannot knock out a racer.
 const outside=(x,y)=>Math.abs(last.x-x)>view.halfW+margin||Math.abs(last.y-y)>view.halfH+margin;
 const gap=(leader.elimDistance||0)-(last.elimDistance||0);
 const settled=race.time-(e.lastLeaderSwitchTime??-999)>=ELIM_RULES_TEST.leaderSwitchGrace;
 const safe=e.roundTime>=ELIM_RULES_TEST.minimumRoundSeconds&&last!==leader&&settled&&
   !last.tableFalling&&!last.routePinch&&outside(view.x,view.y)&&outside(leader.x,leader.y)&&
   gap>80&&Math.hypot(last.x-leader.x,last.y-leader.y)>ELIM_RULES_TEST.physicalSeparation;
 last.elimLag=safe?(last.elimLag||0)+dt:0;
 if(safe&&last.elimLag>=ELIM_RULES_TEST.sustainedTrailSeconds&&!(last.respawnGrace>0)&&!(last.elimProtection>0))knockOutElimination(last,'fuori schermo');
 const active=eliminationActive();if(active.length===1)awardEliminationPoint(active[0]);
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
    eliminationProgressUpdate,eliminationRanking,eliminationEvaluate,eliminationEndPoint});
  }
 });
})();
