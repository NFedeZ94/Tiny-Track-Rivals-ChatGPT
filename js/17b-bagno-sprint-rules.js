/* Bagno Sprint 04: bounded route tracking and CPU path planner, common vehicle physics. */
(()=>{'use strict';const D=window.TTRBathTrack,K=window.TTRCore;
 const signed=(a,b)=>K.mod(b-a+.5,1)-.5;
 const exitAssistDuration=.75;
 const arc=[0];for(let i=1;i<D.shortcutSamples.length;i++)arc.push(arc[i-1]+K.distance(D.shortcutSamples[i-1],D.shortcutSamples[i]));
 function tAt(u){const d=K.clamp(u,0,1)*arc.at(-1);let i=1;while(i<arc.length-1&&arc[i]<d)i++;return (i-1+(d-arc[i-1])/(arc[i]-arc[i-1]))/(arc.length-1);}
 function enter(c,old,race,SND){
  if(c.deskBridge||c.respawnGrace>0||c.speed<95||c.jump>0||c.slip>.25||c.deskBridgeCooldown>race.time)return false;
  const p=D.point(D.entry),a=D.tangent(D.entry),fx=Math.cos(a),fy=Math.sin(a),along=q=>(q.x-p.x)*fx+(q.y-p.y)*fy,lateral=(c.x-p.x)*(-fy)+(c.y-p.y)*fx;
  if(Math.abs(signed(D.entry,c.routeStableP??c.p))>.018||along(old)>0||along(c)<0||lateral<20||lateral>106||Math.abs(K.angleDiff(a,c.a))>.62)return false;
  if(race.cars.some(o=>o!==c&&!o.done&&!o.eliminated&&o.deskBridge))return false;
  c.deskBridge={u:0,from:{x:c.x,y:c.y,a:c.a},speed:K.clamp(c.speed*(c.speed>255?.70:.93),135,245),wetRisk:c.speed>255};c.onBridge=true;c.routePinch=null;c.offtrack=false;c.offtrackSeconds=0;c.hitVX=c.hitVY=c.hitYaw=0;c.claw=0;c.clawTarget=null;c.routeResolvedNear={...p,p:D.entry,distance:0,shortcut:true};c.routeStableP=D.entry;
  if(c===race.player)SND?.sfx('offtrack');return true;
 }
 function transit(c,dt,race,SND,brake=false){const b=c.deskBridge;if(!b)return false;
  const old=b.u,rate=(brake?Math.max(90,b.speed*.45):b.speed)/D.shortcutLength;let u=Math.min(1,old+dt*rate);
  if(u>=.985){const q=D.point(D.exit);if(race.cars.some(o=>o!==c&&!o.done&&!o.eliminated&&K.distance(o,q)<(Math.hypot(o.length||69,o.width||40)+Math.hypot(c.length||69,c.width||40))*.5+12))u=Math.max(old,.975);}
  b.u=u;const t=tAt(u),q=D.shortcutPoint(t),a=D.shortcutTangent(t),blend=K.clamp(u/.12,0,1),w=blend*blend*(3-2*blend);c.x=q.x+(b.from.x-D.shortcutPoint(0).x)*(1-w);c.y=q.y+(b.from.y-D.shortcutPoint(0).y)*(1-w);c.a=a+K.angleDiff(b.from.a,a)*(1-w);c.speed=(u===old?0:rate*D.shortcutLength);c.routeStableP=D.entry+(D.exit-D.entry)*u;c.routeResolvedNear={x:c.x,y:c.y,p:c.routeStableP,distance:0,shortcut:true};c.offtrack=false;
  if(u>=1){const q=D.point(D.exit);Object.assign(c,q,{a:D.tangent(D.exit),speed:Math.min(135,b.speed),onBridge:false,deskBridge:null,deskBridgeCooldown:race.time+2,deskExitAssist:exitAssistDuration,routeStableP:D.exit,routeResolvedNear:{...q,p:D.exit,distance:0,shortcut:false},hitVX:0,hitVY:0,hitYaw:0,slip:b.wetRisk?.22:0,skidVX:0,skidVY:0});if(c===race.player)SND.sfx('landing');}
  return true;
 }
 function environment(c,old,dt,race,recover,SND){const p=K.mod(c.routeStableP??c.p,1),n=K.nearestTrackWindow(c,D.points,p,.032),step=K.distance(c,old),advance=signed(p,n.p)*D.length;
  // Only credit progress proportional to actual movement; hold on excursions.
  const allowed=Math.min(24,step*1.6+2.5);let stable=p;
  if(n.distance<=D.laneHalf+24&&Math.abs(advance)<=allowed)stable=K.mod(n.p,1);
  const near=K.nearestTrackWindow(c,D.points,stable,.006);c.routeStableP=stable;c.offtrack=near.distance>D.laneHalf+16;
  c.offtrackSeconds=c.offtrack?(c.offtrackSeconds||0)+dt:0;
  c.routeResolvedNear={...near,p:stable,shortcut:false};
  c.routeDecision=c.offtrack?'bath-outside':'bath-local';
  if(race.time-(c.routeTraceAt??-Infinity)>=.099){const log=c.routeTrace??=[];log.push({t:+race.time.toFixed(3),x:+c.x.toFixed(2),y:+c.y.toFixed(2),p:c.p,stable,near:n.p,d:+near.distance.toFixed(1),decision:c.routeDecision});if(log.length>40)log.shift();c.routeTraceAt=race.time;}
  if(c.offtrack)c.routePinch={phase:stable};else c.routePinch=null;
  if(c.offtrackSeconds>1.1&&near.distance>D.laneHalf+38&&!(c.respawnGrace>0)){recover(c,'bath-route-cut');return false;}
  if(!c.offtrack){
   const ramp=D.towel,fx=Math.cos(ramp.a),fy=Math.sin(ramp.a),along=q=>(q.x-ramp.x)*fx+(q.y-ramp.y)*fy,lat=(c.x-ramp.x)*(-fy)+(c.y-ramp.y)*fx;
   if(c.jump<=0&&!(c.jumpCd>0)&&!(c.respawnGrace>0)&&c.speed>100&&along(old)<0&&along(c)>=0&&Math.abs(lat)<100&&Math.abs(K.angleDiff(c.a,ramp.a))<.65){c.jump=.82;c.jumpTotal=.82;c.jumpCd=1.5;if(c===race.player)SND?.sfx('ramp');}
   const wet=c.jump<=0&&D.wet(c),cotton=c.jump<=0&&D.inCotton(c);
   if(wet){c.slip=Math.max(c.slip||0,.18);c.speed*=Math.exp(-dt*.85);if(!c.bathWet&&c===race.player)SND?.sfx('offtrack');}c.bathWet=wet;
   if(cotton){c.speed*=Math.exp(-dt*2.1);if(!c.bathCotton&&c===race.player)SND?.sfx('jamSurface');}c.bathCotton=cotton;
   if(c.jump<=0)for(const o of D.soaps){const dx=c.x-o.x,dy=c.y-o.y,d=Math.hypot(dx,dy),limit=o.r+Math.min(22,(c.width||36)/2);if(d<limit){const nx=d>0?dx/d:-Math.sin(o.a),ny=d>0?dy/d:Math.cos(o.a);c.x+=nx*(limit-d+.4);c.y+=ny*(limit-d+.4);c.speed*=.64;c.slip=Math.max(c.slip||0,.12);}}
  }
  if(!c.offtrack&&near.distance<85&&!(c.respawnGrace>0)&&c.speed>=0&&Math.cos(K.angleDiff(c.a,D.tangent(stable)))>.2){c.lastCheckpoint=stable;c.lastValidPosition={...D.point(stable),p:stable,a:D.tangent(stable),laps:c.lapsCompleted,flags:c.flags.slice(),elimDistance:c.elimDistance};}
  return true;
 }
 function drive(c,race,s){const p=c.routeStableP??c.p,near=K.nearestTrackWindow(c,D.points,p,.028),hard=s.pace>=.999;
  if(hard&&!c.aiPersonality)c.aiPersonality=['aggressive','technical','strategic'][((c.id-1)%3+3)%3];
  const speed=Math.abs(c.speed),look=65+Math.min(58,speed*.20),phase=p+look/D.length,a=D.tangent(phase),normal=D.point(phase),nx=-Math.sin(a),ny=Math.cos(a);
  let target=normal,lead=null,gap=Infinity;
  for(const o of race.cars){if(o===c||o.done||o.eliminated||o.jump>0)continue;const dx=o.x-c.x,dy=o.y-c.y,f=dx*Math.cos(c.a)+dy*Math.sin(c.a),l=-dx*Math.sin(c.a)+dy*Math.cos(c.a);if(f>10&&f<135&&Math.abs(l)<45&&f<gap){lead=o;gap=f;}}
  const valid=q=>K.nearestTrackWindow(q,D.points,phase,.035).distance<D.laneHalf-(c.width||36)*.5-8;
  const safe=q=>valid(q)&&!D.soaps.some(o=>K.distance(q,o)<o.r+32)&&!race.cars.some(o=>o!==c&&!o.done&&!o.eliminated&&K.distance(q,o)<42);
  if(lead&&s.pass>0&&near.distance<75&&lead.speed<c.speed+12&&!(c.aiPassCooldown>race.time)){const side=((lead.x-normal.x)*nx+(lead.y-normal.y)*ny)>0?-1:1;for(const dir of [side,-side]){const q={x:normal.x+nx*dir*s.pass,y:normal.y+ny*dir*s.pass};if(safe(q)){c.aiPassSide=dir;c.aiPassUntil=race.time+1;c.aiPassCooldown=race.time+2;c.aiPassAttempts=(c.aiPassAttempts||0)+1;break;}}}
  if(c.aiPassUntil>race.time){const q={x:normal.x+nx*c.aiPassSide*s.pass,y:normal.y+ny*c.aiPassSide*s.pass};if(safe(q))target=q;else c.aiPassUntil=0;}
  for(const o of D.soaps){if(K.distance(c,o)>180||Math.abs(signed(phase,o.p))*D.length>150)continue;const side=(o.x-normal.x)*nx+(o.y-normal.y)*ny>0?-1:1;const q={x:normal.x+nx*side*45,y:normal.y+ny*side*45};if(valid(q))target=q;break;}
  if(near.distance>100||c.aiRecoveryUntil>race.time)target=D.point(p+.008);
  const visit=(race.elim?.round||0)+':'+c.lapsCompleted;
  if(p>D.entry-.065&&p<D.entry+.006&&c.deskChoiceVisit!==visit){c.deskChoiceVisit=visit;c.deskTry=Math.random()<(s.pace<.9?.12:s.pace<.99?.42:.76);c.shortcutDecisionCount=(c.shortcutDecisionCount||0)+1;if(c.deskTry)c.shortcutAttemptCount=(c.shortcutAttemptCount||0)+1;}
  if(c.deskTry&&p>D.entry-.055&&p<D.entry+.006&&!race.cars.some(o=>o!==c&&!o.done&&!o.eliminated&&o.deskBridge)){const q=D.point(phase),ang=D.tangent(phase);target={x:q.x-Math.sin(ang)*52,y:q.y+Math.cos(ang)*52};}
  if(p>D.entry+.015)c.deskTry=false;
  const oil=window.TTRRaceDrivers.avoidOil(c,race,s,target,a,valid,D.soaps);target=oil.target;
  const d=K.angleDiff(Math.atan2(target.y-c.y,target.x-c.x),c.a),steer=K.clamp(d*(hard?3.7:3.3),-1,1);
  if(c.reverseRecovery>0)return {steer:-steer||1,gas:false,brake:true};
  const bend=Math.max(Math.abs(K.angleDiff(D.tangent(p+.017),D.tangent(p))),Math.abs(K.angleDiff(D.tangent(p+.029),D.tangent(p+.012))));
  const cap=c.profile.max*s.pace*(c.boost>0?1.42:1);let desired=cap*(1-K.clamp((bend-.20)*(hard?.48:.63),0,.6));
  if(Math.abs(d)>.30)desired=Math.min(desired,cap*(1-K.clamp((Math.abs(d)-.25)*.68,0,.65)));
  if(lead&&gap<60&&!(c.aiPassUntil>race.time))desired=Math.min(desired,Math.max(70,lead.speed));if(near.distance>95)desired=Math.min(desired,110);if(oil.slow)desired=Math.min(desired,cap*.68);
  const brake=c.speed>desired+12&&c.speed>70;return {steer,gas:!brake&&(desired>=cap*.96||c.speed<desired+5),brake};
 }
 window.TTRBathRules=Object.freeze({environment,drive,enter,transit,exitAssistDuration});})();
