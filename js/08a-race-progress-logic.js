/* Tiny Track Rivals — Fase 8A: checkpoint, giri, linea del traguardo.
 * Estrazione 1:1 da update(dt), senza cambiare regole, soglie o ordine delle chiamate.
 * Script classico; lo stato della gara resta nella closure del legacy. */
(()=>{'use strict';
window.TTRRaceProgress=Object.freeze({create(deps){
 const {getRace,nearestCourse,points,eliminationProgressUpdate,finishEdgeTolerance,
   finishLinePlane,trackPoint,tangent,showHint,t,SND}=deps;

 function updateCarProgress(c,dt,oldX,oldY){
 const race=getRace();
 // Checkpoint and three-lap progress.
 let closest=c.routeResolvedNear||nearestCourse(c,points),pr=closest.p;c.p=pr;const oldP=c.lastP;
 if(race.mode==='elimination')eliminationProgressUpdate(c,pr,dt);
 // Checkpoints demand valid forward road progress; finish has a generous gate across
 // the full usable width so an imperfect racing line does not forfeit the lap.
 const clearLane=!c.offtrack&&!c.bridgeMissActive&&!(c.respawnGrace>0)&&!(c.tableFalling>0);
 if(clearLane&&closest.distance<=150){
   if(pr>.81)c.lapGateBlocked=false;
   if(pr>.17&&pr<.36)c.flags[0]=true;
   if(c.flags[0]&&pr>.43&&pr<.62)c.flags[1]=true;
   if(c.flags[1]&&pr>.68&&pr<.86)c.flags[2]=true;
 }
 // True finish-line intersection from position, also if the inner racing line
 // makes nearest-track phase fail to wrap at this particular curve.
 // Outside the crumbs (road-edge distance 138), allow up to 48 additional
 // world units only at the finish and only before the respawn/cut threshold.
 // Checkpoints are still earned on road. This never grants a shortcut lap.
 const legalOuterFinish=c.offtrack&&finishEdgeTolerance(c,closest);
 const finishSurfaceOk=clearLane||legalOuterFinish;
 const blockedGate=c.lapGateBlocked||!finishSurfaceOk;
 const gateReady=c.flags.every(Boolean);
 const planeCrossed=finishLinePlane({x:oldX,y:oldY},c,trackPoint(0),tangent(0),186,blockedGate,gateReady,c.speed);
 // Legacy phase-based seam is retained for comparison in tests, NOT used for laps:
 // finishGateCrossing(oldP,pr,closest.distance,blockedGate,gateReady,c.speed)
 const crossed=planeCrossed;
 if(crossed){if(race.mode==='trial'&&c===race.player){const lap=race.trialSession?.completeLap(race.time,c);if(lap?.newBest){window.TTRModeTrial.saveLap(race);if(lap.number>1)SND.sfx('pickup');}}c.lapsCompleted++;c.flags=[false,false,false];c.mugApexPassed=false;c.lapGateBlocked=true;
   if(c.lapsCompleted>=3&&race.mode!=='elimination'){c.done=true;c.finishTime=race.time;}
   else if(c===race.player){SND.sfx('lap');}
 }
 c.lastP=pr;
 }
 return Object.freeze({updateCarProgress});
}});
})();
