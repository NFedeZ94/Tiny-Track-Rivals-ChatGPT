/* Desk Drift R3. Manual ruler bridge, independent of Bagno Sprint transit. */
(()=>{'use strict';const D=window.TTRDeskTrack,K=window.TTRCore;
 const signed=(a,b)=>K.mod(b-a+.5,1)-.5,exitAssistDuration=.75;
 const axis=D.shortcutTangent(),fx=Math.cos(axis),fy=Math.sin(axis),P=D.shortcutPoint(0);
 const gatePhase=K.nearestTrack(D.shortcutPoint(D.gate),D.points).p;
 const along=c=>((c.x-P.x)*fx+(c.y-P.y)*fy)/D.shortcutLength;
 function enter(){return false;} // no assisted travel or input interception
 function transit(){return false;}
 function environment(c,old,dt,race,recover,SND){
  const p=K.mod(c.routeStableP??c.p,1),step=K.distance(c,old),physical=step<=40?step:0;
  const b=D.shortcutNearest(c),u=along(c),prevU=along(old),n=K.nearestTrackWindow(c,D.points,p,.032),advance=signed(p,n.p)*D.length;
  // Enter via the actual ramp gate, not by proximity to the deck.
  if(!c.onBridge&&!(c.respawnGrace>0)&&physical>.02&&prevU<D.gate&&u>=D.gate&&b.distance<D.bridgeHalf-12&&Math.abs(signed(D.entry,p))<.055&&Math.cos(K.angleDiff(c.a,axis))>.65&&c.speed>0){c.onBridge=true;c.bridgeOffSeconds=0;c.routePinch=null;c.deskTry=false;if(c===race.player)SND?.sfx('ramp');}
  if(c.onBridge){
   if(u<D.gate-.08||b.distance>D.bridgeHalf+5){c.bridgeOffSeconds=(c.bridgeOffSeconds||0)+dt;c.offtrack=true;c.routePinch={phase:p};if(c.bridgeOffSeconds>.18){recover(c,'desk-bridge-fall');return false;}return true;}
   c.bridgeOffSeconds=0;c.offtrack=false;c.offtrackSeconds=0;c.routePinch=null;
   const phase=gatePhase+(D.exit-gatePhase)*K.clamp((b.t-D.gate)/(1-D.gate),0,1);c.routeStableP=phase;c.routeResolvedNear={...b,p:phase};c.routeDecision='desk-manual-bridge';
   if(prevU<D.merge&&u>=D.merge&&b.distance<D.bridgeHalf-8&&c.speed>0&&Math.cos(K.angleDiff(c.a,axis))>.35){c.onBridge=false;c.routeStableP=D.exit;c.routeResolvedNear={...D.point(D.exit),distance:K.distance(c,D.point(D.exit)),p:D.exit,shortcut:false};c.deskTry=false;if(c===race.player)SND?.sfx('landing');}
   return true;
  }
  // Same bounded phase correction as the stability hotfix, but no global arm snap.
  let stable=p;const allowed=Math.min(24,physical*1.85+.12),from=K.nearestTrackWindow(old,D.points,p,.012);
  if(physical>.02&&n.distance<=D.laneHalf+24&&from.distance<=D.laneHalf+30){const a=D.tangent(n.p),align=((c.x-old.x)*Math.cos(a)+(c.y-old.y)*Math.sin(a))/physical;if(Math.abs(advance)<=allowed||align*Math.sign(advance)>.12)stable=K.mod(p+K.clamp(advance,-allowed,allowed)/D.length,1);}
  const near=K.nearestTrackWindow(c,D.points,stable,.009);c.routeStableP=stable;c.offtrack=near.distance>D.laneHalf+16;c.offtrackSeconds=c.offtrack?(c.offtrackSeconds||0)+dt:0;c.routeResolvedNear={...near,p:stable,shortcut:false};c.routeDecision=c.offtrack?'desk-outside':'desk-local';c.routePinch=c.offtrack?{phase:stable}:null;
  if(race.time-(c.routeTraceAt??-Infinity)>=.099){const log=c.routeTrace??=[];log.push({t:+race.time.toFixed(3),x:+c.x.toFixed(2),y:+c.y.toFixed(2),p:c.p,stable,near:n.p,d:+near.distance.toFixed(1),decision:c.routeDecision});if(log.length>40)log.shift();c.routeTraceAt=race.time;}
  if(c.offtrackSeconds>.8&&near.distance>D.laneHalf+38&&!(c.respawnGrace>0)){recover(c,'desk-route-cut');return false;}
  if(!c.offtrack&&near.distance<80&&!(c.respawnGrace>0)&&c.speed>=0&&Math.cos(K.angleDiff(c.a,D.tangent(stable)))>.2){c.lastCheckpoint=stable;c.lastValidPosition={...D.point(stable),p:stable,a:D.tangent(stable),laps:c.lapsCompleted,flags:c.flags.slice(),elimDistance:c.elimDistance};}
  return true;
 }
 function drive(c,race,s){const p=c.routeStableP??c.p,near=K.nearestTrackWindow(c,D.points,p,.028),hard=s.pace>=.999;
  if(hard&&!c.aiPersonality)c.aiPersonality=['aggressive','technical','strategic'][((c.id-1)%3+3)%3];
  const speed=Math.abs(c.speed),look=65+Math.min(58,speed*.20),phase=p+look/D.length,a=D.tangent(phase),normal=D.point(phase),nx=-Math.sin(a),ny=Math.cos(a);
  let target=normal,lead=null,gap=Infinity;
  for(const o of race.cars){if(o===c||o.done||o.eliminated||o.jump>0)continue;const dx=o.x-c.x,dy=o.y-c.y,f=dx*Math.cos(c.a)+dy*Math.sin(c.a),l=-dx*Math.sin(c.a)+dy*Math.cos(c.a);if(f>10&&f<135&&Math.abs(l)<45&&f<gap){lead=o;gap=f;}}
  const valid=q=>K.nearestTrackWindow(q,D.points,phase,.035).distance<D.laneHalf-(c.width||36)*.5-8;
  const safe=q=>valid(q)&&!D.props.some(o=>K.distance(q,o)<o.r+32)&&!race.cars.some(o=>o!==c&&!o.done&&!o.eliminated&&K.distance(q,o)<42);
  if(lead&&s.pass>0&&near.distance<75&&lead.speed<c.speed+12&&!(c.aiPassCooldown>race.time)){const side=((lead.x-normal.x)*nx+(lead.y-normal.y)*ny)>0?-1:1;for(const dir of [side,-side]){const q={x:normal.x+nx*dir*s.pass,y:normal.y+ny*dir*s.pass};if(safe(q)){c.aiPassSide=dir;c.aiPassUntil=race.time+1;c.aiPassCooldown=race.time+2;c.aiPassAttempts=(c.aiPassAttempts||0)+1;break;}}}
  if(c.aiPassUntil>race.time){const q={x:normal.x+nx*c.aiPassSide*s.pass,y:normal.y+ny*c.aiPassSide*s.pass};if(safe(q))target=q;else c.aiPassUntil=0;}
  for(const o of D.props){if(K.distance(c,o)>160||K.distance(target,o)>o.r+35)continue;const side=((o.x-normal.x)*nx+(o.y-normal.y)*ny)>0?-1:1;const q={x:normal.x+nx*side*46,y:normal.y+ny*side*46};if(safe(q))target=q;break;}
  if(near.distance>100||c.aiRecoveryUntil>race.time)target=D.point(p+.008);
  const visit=(race.elim?.round||0)+':'+c.lapsCompleted;
  if(p>D.entry-.045&&p<D.entry+.008&&c.deskChoiceVisit!==visit){c.deskChoiceVisit=visit;c.deskTry=Math.random()<(s.pace<.9?.12:s.pace<.99?.42:.76);c.shortcutDecisionCount=(c.shortcutDecisionCount||0)+1;if(c.deskTry)c.shortcutAttemptCount=(c.shortcutAttemptCount||0)+1;}
  if(c.onBridge||c.deskTry&&p>D.entry-.035&&p<D.entry+.035){const b=D.shortcutNearest(c);target=D.shortcutPoint(Math.min(1,b.t+.12));if(c.onBridge&&b.t>.85)target=D.point(D.exit+.009);}
  if(!c.onBridge&&(p>D.entry+.035||c.aiRecoveryUntil>race.time))c.deskTry=false;
  const oil=(c.onBridge||c.deskTry)?{target,slow:false}:window.TTRRaceDrivers.avoidOil(c,race,s,target,a,valid,D.props);target=oil.target;
  const d=K.angleDiff(Math.atan2(target.y-c.y,target.x-c.x),c.a),steer=K.clamp(d*(hard?3.7:3.3),-1,1);
  if(c.reverseRecovery>0)return {steer:-steer||1,gas:false,brake:true};
  const bend=Math.max(Math.abs(K.angleDiff(D.tangent(p+.017),D.tangent(p))),Math.abs(K.angleDiff(D.tangent(p+.029),D.tangent(p+.012))));
  const cap=c.profile.max*s.pace*(c.boost>0?1.42:1);let desired=cap*(1-K.clamp((bend-.20)*(hard?.48:.63),0,.6));
  if(Math.abs(d)>.30)desired=Math.min(desired,cap*(1-K.clamp((Math.abs(d)-.25)*.68,0,.65)));
  if(lead&&gap<60&&!(c.aiPassUntil>race.time))desired=Math.min(desired,Math.max(70,lead.speed));if(c.onBridge||c.deskTry)desired=Math.min(cap,205);else if(near.distance>95)desired=Math.min(desired,110);if(oil.slow)desired=Math.min(desired,cap*.68);
  const brake=c.speed>desired+12&&c.speed>70;return {steer,gas:!brake&&(desired>=cap*.96||c.speed<desired+5),brake};
 }
 window.TTRDeskRules=Object.freeze({environment,drive,enter,transit,exitAssistDuration});})();
