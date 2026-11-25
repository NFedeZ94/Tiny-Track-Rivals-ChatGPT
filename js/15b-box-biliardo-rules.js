/* Box 02: environment-specific rules, invoked by the common fixed-step race loop. */
(()=>{'use strict';const B=window.TTRBoxTrack,K=window.TTRCore;
 const signed=(a,b)=>K.mod(b-a+.5,1)-.5;
 function obstacles(){const out=B.balls.map(o=>({...o,type:'box-ball',solid:true}));
  for(const o of B.chalks)out.push({...o,r:Math.hypot(o.w,o.h)/2,type:'box-proxy',solid:true});
  for(const o of B.cues){const end=o.len/2-(o.jump?175:0);for(let x=-o.len/2;x<=end;x+=32)out.push({...B.propWorld(o,x,0),r:o.w/2,type:'box-proxy',solid:true});}
  for(let i=0;i<3;i++){const a=B.rack.vertices[i],b=B.rack.vertices[(i+1)%3],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/24);for(let j=0;j<=n;j++){const t=j/n;out.push({...B.propWorld(B.rack,a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t),r:B.rack.w/2,type:'box-proxy',solid:true});}}return out;
 }
 function transit(c,dt,race){if(!(c.boxTransit>0))return false;c.boxTransit=Math.max(0,c.boxTransit-dt);c.speed=0;
  if(c.boxTransit>0){if(c.boxTransit<.8){const u=1-c.boxTransit/.8;c.x=B.exitPocket.x+(B.outlet.x-B.exitPocket.x)*u;c.y=B.exitPocket.y+(B.outlet.y-B.exitPocket.y)*u;c.a=Math.atan2(B.outlet.y-B.exitPocket.y,B.outlet.x-B.exitPocket.x);}return true;}
  const p=B.exit+.009,advance=K.forwardProgress(c.p,p);Object.assign(c,{x:B.outlet.x,y:B.outlet.y,p,lastP:p,a:B.tangent(p),routeStableP:p,auditP:p,auditTravel:0,auditCleanTime:0,auditOutsideTime:0,offtrack:false,offtrackSeconds:0,offtrackEntry:null,routePinch:null,routeResolvedNear:null,speed:155,respawnGrace:1.05,claw:0,clawTarget:null,hitVX:0,hitVY:0,skidVX:0,skidVY:0,boxOutside:0,boxTryPocket:false,boxPasses:(c.boxPasses||0)+1});
  if(race.mode==='elimination'){c.elimDistance=(c.elimDistance||0)+advance*B.length;c.elimPrevP=p;c.elimPrevX=c.x;c.elimPrevY=c.y;c.elimTravelSinceCredit=0;c.elimProtection=1.2;}
  c.lastCheckpoint=p;c.previousValidPosition=null;c.lastValidPosition={x:c.x,y:c.y,p,a:c.a,laps:c.lapsCompleted,flags:c.flags.slice(),elimDistance:c.elimDistance};return true;
 }
 function environment(c,old,dt,race,recover,SND){
  for(const pocket of B.pockets){if(c.respawnGrace>0||c.jump>0||Math.hypot(c.x-pocket.x,c.y-pocket.y)>pocket.r-12)continue;
   if(B.pocketEntry(c,pocket,old)){c.boxTransit=B.transit;c.claw=0;c.clawTarget=null;c.x=pocket.x;c.y=pocket.y;c.speed=0;c.boost=0;c.hitVX=c.hitVY=c.skidVX=c.skidVY=0;if(c===race.player)SND.sfx('ramp');}else recover(c,'box-pocket');return false;}
  let hit=false;if(c.x<196||c.x>2404){c.x=K.clamp(c.x,196,2404);c.a=Math.PI-c.a;hit=true;}if(c.y<161||c.y>1439){c.y=K.clamp(c.y,161,1439);c.a=-c.a;hit=true;}if(hit)c.speed*=.55;
  const prop=B.propContact(c,old);c.boxPropContact=!!(prop&&prop!=='jump'||hit);if(prop==='jump'){c.jumpTotal=.42;if(c===race.player)SND.sfx('ramp');}else if(prop||hit){if(c===race.player&&race.time-(c.lastPropHit??-10)>.35){c.lastPropHit=race.time;SND.sfx('impact');}}
  // Use the previously accepted phase, not the globally nearest arm of a hairpin.
  const prev=c.routeStableP??c.lastP??c.p,near=K.nearestTrackWindow(c,B.points,prev,.012),step=Math.hypot(c.x-old.x,c.y-old.y),delta=signed(prev,near.p);
  const plausible=(step*2.3+.15)/B.length;
  if(near.distance<=142&&step>.02)c.routeStableP=K.mod(prev+K.clamp(delta,-plausible,plausible),1);
  const accepted=K.nearestTrackWindow(c,B.points,c.routeStableP,.004);
  const d=accepted.distance;c.offtrack=d>142;c.boxOutside=c.offtrack?(c.boxOutside||0)+dt:Math.max(0,(c.boxOutside||0)-dt*2);
  if(c.boxOutside>1.65&&d>205&&!(c.respawnGrace>0)){recover(c,'box-route-cut');return false;}
  c.routeResolvedNear={...accepted,p:c.routeStableP,shortcut:false};
  if(!c.offtrack&&d<88&&!(c.respawnGrace>0)&&c.speed>=0&&Math.cos(K.angleDiff(c.a,B.tangent(c.routeStableP)))>.15){const p=c.routeStableP,q=B.point(p);c.lastCheckpoint=p;c.lastValidPosition={...q,p,a:B.tangent(p),laps:c.lapsCompleted,flags:c.flags.slice(),elimDistance:c.elimDistance};}
  return true;
 }
 function cpuTarget(c,race,s,normal){const p=c.p,visit=(race.elim?.round||0)+':'+c.lapsCompleted;
  if(p>B.entry-.065&&p<B.entry-.012&&c.boxDecision!==visit){c.boxDecision=visit;const chance=s.pace>=.999?({aggressive:.68,technical:.30,strategic:.55}[c.aiPersonality]??.50):s.shortcut;const clear=!race.cars.some(o=>o!==c&&!o.done&&!o.eliminated&&o.boxTryPocket&&Math.hypot(o.x-c.x,o.y-c.y)<100);c.boxTryPocket=Math.random()<chance&&clear&&(c.boxStreak||0)<2;c.boxStreak=c.boxTryPocket?(c.boxStreak||0)+1:0;c.shortcutDecisionCount=(c.shortcutDecisionCount||0)+1;if(c.boxTryPocket)c.shortcutAttemptCount=(c.shortcutAttemptCount||0)+1;}
  if(p<B.entry-.07||p>B.entry+.025||c.respawnGrace>0)c.boxTryPocket=false;
  return c.boxTryPocket&&p>B.entry-.045&&p<B.entry+.018?B.entryPocket:normal;
 }
 // A separate path planner, not a second physics engine. Shorter look-ahead
 // and curvature-aware speed are needed on the much tighter billiard bends.
 const guides=obstacles(),N=640,offsets=[-64,-48,-32,-16,0,16,32,48,64];
 const guide=Array.from({length:N},(_,i)=>{const p=i/N,q=B.point(p),a=B.tangent(p),nx=-Math.sin(a),ny=Math.cos(a);let best=0,cost=Infinity;
   for(const off of offsets){const x=q.x+nx*off,y=q.y+ny*off;let score=Math.abs(off)*.34;
    if(x<218||x>2382||y<183||y>1417)score+=1000;
    for(const o of guides){const d=Math.hypot(x-o.x,y-o.y),gap=d-o.r-30;if(gap<22)score+=(22-gap)**2*.5;}
    for(const o of B.pockets){const d=Math.hypot(x-o.x,y-o.y);if(d<o.r+28)score+=(o.r+28-d)**2;}
    if(score<cost){cost=score;best=off;}}
   return best;});
 function guidance(p){const q=B.point(p),a=B.tangent(p),i=Math.round(K.mod(p,1)*N)%N;let off=0,w=0;for(let j=-5;j<=5;j++){const v=6-Math.abs(j);off+=guide[K.mod(i+j,N)]*v;w+=v;}off/=w;return{x:q.x-Math.sin(a)*off,y:q.y+Math.cos(a)*off};}
 function drive(c,race,s){const p=c.routeStableP??c.p,near=K.nearestTrackWindow(c,B.points,p,.022),hard=s.pace>=.999;
   if(hard&&!c.aiPersonality)c.aiPersonality=['aggressive','technical','strategic'][((c.id-1)%3+3)%3];
   const speed=Math.abs(c.speed),look=(hard?62:52)+Math.min(40,speed*.14),lookP=look/B.length;
   const normal=guidance(p+lookP);let target=cpuTarget(c,race,s,normal),branch=target!==normal;
   if(branch){const bearing=K.angleDiff(Math.atan2(target.y-c.y,target.x-c.x),c.a);if(Math.abs(bearing)>1.12||p>B.entry+.006||c.aiRecoveryUntil>race.time){c.boxTryPocket=false;target=normal;branch=false;}}
   if(c.aiRecoveryUntil>race.time||near.distance>120){target=guidance(p+.007);branch=false;c.boxTryPocket=false;}
   let d=K.angleDiff(Math.atan2(target.y-c.y,target.x-c.x),c.a);const steer=K.clamp(d*(hard?3.7:3.4),-1,1);
   if(c.reverseRecovery>0)return {steer:-steer||1,gas:false,brake:true};
   const bend=Math.max(Math.abs(K.angleDiff(B.tangent(p+.012),B.tangent(p))),Math.abs(K.angleDiff(B.tangent(p+.023),B.tangent(p+.008))));
   const cap=c.profile.max*s.pace*(c.boost>0?1.42:1);let desired=cap*(1-K.clamp((bend-.16)*.65,0,.60));
   if(Math.abs(d)>.34)desired=Math.min(desired,cap*(1-K.clamp((Math.abs(d)-.28)*.68,0,.66)));
   if(branch)desired=Math.min(desired,cap*.83);
   if(near.distance>95)desired=Math.min(desired,110);
   const brake=c.speed>desired+12&&c.speed>75;return {steer,gas:!brake&&(desired>=cap*.96||c.speed<desired+3),brake};
 }
 window.TTRBoxRules=Object.freeze({obstacles,transit,environment,cpuTarget,drive});})();
