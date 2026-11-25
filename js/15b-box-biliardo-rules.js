/* Box 02: environment-specific rules, invoked by the common fixed-step race loop. */
(()=>{'use strict';const B=window.TTRBoxTrack,K=window.TTRCore;
 const signed=(a,b)=>K.mod(b-a+.5,1)-.5;
 function obstacles(){const out=B.balls.map(o=>({...o,type:'box-ball',solid:true}));
  for(const o of B.chalks)out.push({...o,r:Math.hypot(o.w,o.h)/2,type:'box-proxy',solid:true});
  for(const o of B.cues){const end=o.len/2-(o.jump?175:0);for(let x=-o.len/2;x<=end;x+=32)out.push({...B.propWorld(o,x,0),r:o.w/2,type:'box-proxy',solid:true});}
  for(let i=0;i<3;i++){const a=B.rack.vertices[i],b=B.rack.vertices[(i+1)%3],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/24);for(let j=0;j<=n;j++){const t=j/n;out.push({...B.propWorld(B.rack,a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t),r:B.rack.w/2,type:'box-proxy',solid:true});}}return out;
 }
 // Sequence the visible exit animation and outlet in entry order. Waiting cars
 // remain hidden in the tunnel; no collision immunity is added on release.
 const exitDuration=.8,exitAssistDuration=1.05;
 function exitPose(u){const v=1-u,a=B.tangent(B.exit+.009),handle=70;
   const q={x:B.outlet.x-Math.cos(a)*handle,y:B.outlet.y-Math.sin(a)*handle},p=B.exitPocket,r=B.outlet;
   return {x:v*v*p.x+2*v*u*q.x+u*u*r.x,y:v*v*p.y+2*v*u*q.y+u*u*r.y,
     a:Math.atan2(v*(q.y-p.y)+u*(r.y-q.y),v*(q.x-p.x)+u*(r.x-q.x))};}
 const active=(o,c)=>o!==c&&!o.done&&!o.eliminated;
 // Use conservative bounding circles (including a small visual clearance).
 const radius=c=>Math.hypot(c.length||69,c.width||41)*.5;
 function clearOf(c,pose,race){return !race.cars.some(o=>active(o,c)&&!(o.boxTransit>=exitDuration)&&
    Math.hypot(pose.x-o.x,pose.y-o.y)<radius(c)+radius(o)+12);}
 function priorWaiting(c,next,race){return race.cars.some(o=>active(o,c)&&o.boxTransit>0&&
   (o.boxEntryOrder??Infinity)<(c.boxEntryOrder??Infinity)&&o.boxTransit>=next);}
 function transit(c,dt,race,SND){if(!(c.boxTransit>0))return false;c.speed=0;
  const next=Math.max(0,c.boxTransit-dt);
  if(next<exitDuration){const pose=exitPose(1-next/exitDuration);
    // FIFO progress and physical clearance permit multiple visible cars, but
    // a follower can never overtake or overlap its predecessor in the tunnel.
    if(priorWaiting(c,next,race)||!clearOf(c,pose,race)){
      if(c.boxTransit>=exitDuration)c.boxTransit=exitDuration;
      return true;
    }
    Object.assign(c,pose);
  }
  c.boxTransit=next;if(next>0)return true;
  const p=B.exit+.009,advance=K.forwardProgress(c.p,p);Object.assign(c,{x:B.outlet.x,y:B.outlet.y,p,lastP:p,a:B.tangent(p),routeStableP:p,auditP:p,auditTravel:0,auditCleanTime:0,auditOutsideTime:0,offtrack:false,offtrackSeconds:0,offtrackEntry:null,routePinch:null,routeResolvedNear:null,speed:Math.min(112,(c.profile?.max||250)*.40),boxExitAssist:exitAssistDuration,respawnGrace:1.05,claw:0,clawTarget:null,hitVX:0,hitVY:0,hitYaw:0,skidVX:0,skidVY:0,slip:0,oilSpin:0,steer:0,boxOutside:0,boxRouteCredit:0,routeTrace:[],routeTraceAt:null,routeDecision:null,boxTryPocket:false,boxPasses:(c.boxPasses||0)+1});
  if(race.mode==='elimination'){c.elimDistance=(c.elimDistance||0)+advance*B.length;c.elimPrevP=p;c.elimPrevX=c.x;c.elimPrevY=c.y;c.elimTravelSinceCredit=0;c.elimProtection=1.2;}
  c.lastCheckpoint=p;c.previousValidPosition=null;c.lastValidPosition={x:c.x,y:c.y,p,a:c.a,laps:c.lapsCompleted,flags:c.flags.slice(),elimDistance:c.elimDistance};if(c===race.player)SND?.sfx('boxPocket');return true;
 }
 function environment(c,old,dt,race,recover,SND){
  for(const pocket of B.pockets){if(c.respawnGrace>0||c.jump>0||Math.hypot(c.x-pocket.x,c.y-pocket.y)>pocket.triggerR)continue;
   if(B.pocketEntry(c,pocket,old)){c.boxTransit=B.transit;c.boxEntryTime=race.time;c.boxEntryOrder=race.boxEntrySerial=(race.boxEntrySerial||0)+1;c.claw=0;c.clawTarget=null;c.x=pocket.x;c.y=pocket.y;c.speed=0;c.boost=0;c.hitVX=c.hitVY=c.skidVX=c.skidVY=0;if(c===race.player)SND.sfx('boxPocket');}else recover(c,'box-pocket');return false;}
  let hit=false;if(c.x<196||c.x>2404){c.x=K.clamp(c.x,196,2404);c.a=Math.PI-c.a;hit=true;}if(c.y<161||c.y>1439){c.y=K.clamp(c.y,161,1439);c.a=-c.a;hit=true;}if(hit)c.speed*=.55;
  const prop=B.propContact(c,old);c.boxPropContact=!!(prop&&prop!=='jump'||hit);if(prop==='jump'){c.jumpTotal=.42;if(c===race.player)SND.sfx('ramp');}else if(prop||hit){if(c===race.player&&race.time-(c.lastPropHit??-10)>.35){c.lastPropHit=race.time;SND.sfx(({cue:'boxWood',rack:'boxRack',chalk:'boxChalk'})[prop]||'impact');}}
  // Track the local arm even on wide bends. When it is lost, reacquire only
  // a physically reachable phase, never the globally closest arm for free.
  const prev=c.routeStableP??c.lastP??c.p,step=Math.hypot(c.x-old.x,c.y-old.y);
  const near=K.nearestTrackWindow(c,B.points,prev,.012),delta=signed(prev,near.p);
  // Credit is measured in world units, not elapsed time. Stationary cars and
  // teleports cannot buy progress. A small reserve absorbs tight-corner geometry.
  const physical=step<=40?step:0,localLimit=physical*2.3+.15;
  let credit=Math.min(B.length*.14,(c.boxRouteCredit||0)+physical*1.35);
  let advance=0,decision='box-local',global=null;
  // At the top-right hairpin the visible lane overlaps its outgoing arm.
  // A local handoff is allowed only within that junction, with both projections
  // on the lane and real forward motion along the outgoing arm. Never grant
  // credit for crossing unrelated parts of the table.
  let seam=false;
  if(physical>.02&&prev>=.39&&prev<=.43&&near.distance<=B.laneHalf+3){
    global=K.nearestTrack(c,B.points);const gain=signed(prev,global.p);
    const a=B.tangent(global.p),alignment=((c.x-old.x)*Math.cos(a)+(c.y-old.y)*Math.sin(a))/physical;
    if(global.p>=.435&&global.p<=.47&&gain>=.018&&gain<=.045&&global.distance<=B.laneHalf-10&&near.distance>global.distance+18&&alignment>.5){
      const before=K.nearestTrack(old,B.points);
      if(before.distance<=B.laneHalf){advance=gain*B.length;credit=24;decision='box-junction-handoff';seam=true;}
    }
  }
  // Bottom-left hairpin: the inner racing line joins the outgoing arm before
  // the centreline apex. Only permit a local, forward handoff inside this
  // specific junction, never a free phase jump from the rest of the table.
  if(!seam&&physical>.02&&prev>=.825&&prev<=.865&&c.x>=490&&c.x<=755&&c.y>=885&&c.y<=1085&&near.distance<=190){
    global=K.nearestTrack(c,B.points);const gain=signed(prev,global.p);
    const a=B.tangent(global.p),alignment=((c.x-old.x)*Math.cos(a)+(c.y-old.y)*Math.sin(a))/physical;
    if(global.p>=.875&&global.p<=.915&&gain>=.018&&gain<=.075&&global.distance<=132&&near.distance>global.distance+18&&alignment>.45){
      const before=K.nearestTrack(old,B.points);
      if(before.distance<=142&&c.boxOutside<.15){advance=gain*B.length;credit=24;decision='box-final-junction-handoff';seam=true;}
    }
  }
  if(!seam&&physical>.02&&near.distance<=142){
    advance=K.clamp(delta*B.length,-Math.max(localLimit,credit),Math.max(localLimit,credit));
    credit=Math.max(0,credit-Math.abs(advance));
    if(Math.abs(delta*B.length-advance)<1)credit=Math.min(credit,24);
  }else if(!seam&&physical>.02){
    global=K.nearestTrack(c,B.points);
    const gain=signed(prev,global.p)*B.length;
    if(global.distance<=142&&Math.abs(gain)<=credit+12&&Math.abs(gain)<=B.length*.14&&Math.abs(gain)>0.01){
      advance=gain;credit=Math.min(24,Math.max(0,credit-Math.abs(gain)));decision='box-rejoin';
    }else if(near.distance<=205){
      // Maintain phase through a wide but continuous bend; no checkpoint is
      // granted until the car actually returns to the usable lane.
      advance=K.clamp(delta*B.length,-Math.min(localLimit,credit),Math.min(localLimit,credit));
      credit=Math.max(0,credit-Math.abs(advance));decision='box-wide-continuous';
    }else decision='box-rejoin-pending';
  }
  c.boxRouteCredit=credit;c.routeStableP=K.mod(prev+advance/B.length,1);
  const accepted=K.nearestTrackWindow(c,B.points,c.routeStableP,.004),d=accepted.distance;
  c.offtrack=d>142;c.boxOutside=c.offtrack?(c.boxOutside||0)+dt:Math.max(0,(c.boxOutside||0)-dt*2);
  // Trace both projections so a later report can distinguish a real cut from
  // a stale phase. A bounded ring covers the preceding four seconds.
  const log=c.routeTrace??=[];
  if(c.routeTraceAt==null||race.time-c.routeTraceAt>=.099){
    log.push({t:+race.time.toFixed(3),x:+c.x.toFixed(2),y:+c.y.toFixed(2),p:c.p,stable:c.routeStableP,near:near.p,d:+d.toFixed(1),globalPhase:global?.p??null,globalDistance:global?+global.distance.toFixed(1):null,credit:+credit.toFixed(1),decision});
    if(log.length>40)log.shift();c.routeTraceAt=race.time;
  }
  c.routeDecision={kind:decision,localDistance:+near.distance.toFixed(2),acceptedDistance:+d.toFixed(2),globalPhase:global?.p??null,globalDistance:global?.distance??null,credit,elapsed:c.boxOutside};
  if(c.boxOutside>1.65&&d>205&&!(c.respawnGrace>0)){c.routeDecision.kind='box-route-penalty';recover(c,'box-route-cut');return false;}
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
   let leader=null,gap=Infinity;
   if(!branch&&s.pass>0&&near.distance<85&&!(c.aiRecoveryUntil>race.time)){
     const a=B.tangent(p),nx=-Math.sin(a),ny=Math.cos(a),fx=Math.cos(a),fy=Math.sin(a);
     for(const o of race.cars){if(o===c||o.done||o.eliminated||o.boxTransit>0||o.jump>0)continue;const dx=o.x-c.x,dy=o.y-c.y,f=dx*fx+dy*fy,l=dx*nx+dy*ny;if(f>12&&f<135&&Math.abs(l)<49&&f<gap){leader=o;gap=f;}}
     const laneSafe=side=>{const q={x:normal.x+nx*side*s.pass*.75,y:normal.y+ny*side*s.pass*.75};const n=K.nearestTrackWindow(q,B.points,p+lookP,.018);return n.distance<75&&q.x>220&&q.x<2380&&q.y>185&&q.y<1415&&!guides.some(o=>Math.hypot(q.x-o.x,q.y-o.y)<o.r+32)&&!B.pockets.some(o=>Math.hypot(q.x-o.x,q.y-o.y)<o.r+35);};
     if(leader&&leader.speed<c.speed+12&&!(c.aiPassUntil>race.time)&&!(c.aiPassCooldown>race.time)){
       const pref=((leader.x-normal.x)*nx+(leader.y-normal.y)*ny)>0?-1:1;
       const side=laneSafe(pref)?pref:laneSafe(-pref)?-pref:0;
       if(side){c.aiPassSide=side;c.aiPassUntil=race.time+1.0;c.aiPassCooldown=race.time+2.0;c.aiPassAttempts=(c.aiPassAttempts||0)+1;}
     }
     if(c.aiPassUntil>race.time&&laneSafe(c.aiPassSide)){target={x:normal.x+nx*c.aiPassSide*s.pass*.75,y:normal.y+ny*c.aiPassSide*s.pass*.75};}else if(c.aiPassUntil>race.time)c.aiPassUntil=0;
   }else c.aiPassUntil=0;
   if(branch){const bearing=K.angleDiff(Math.atan2(target.y-c.y,target.x-c.x),c.a);if(Math.abs(bearing)>1.12||p>B.entry+.006||c.aiRecoveryUntil>race.time){c.boxTryPocket=false;target=normal;branch=false;}}
   if(c.aiRecoveryUntil>race.time||near.distance>120){target=guidance(p+.007);branch=false;c.boxTryPocket=false;}
   const oil=(!branch&&near.distance<85&&!(c.aiRecoveryUntil>race.time))?window.TTRRaceDrivers.avoidOil(c,race,s,target,B.tangent(p+lookP),q=>q.x>220&&q.x<2380&&q.y>185&&q.y<1415&&K.nearestTrackWindow(q,B.points,p+lookP,.033).distance<B.laneHalf-(c.width||36)*.5-5&&!B.pockets.some(o=>Math.hypot(q.x-o.x,q.y-o.y)<o.r+35),guides):{target,slow:false};
   target=oil.target;
   let d=K.angleDiff(Math.atan2(target.y-c.y,target.x-c.x),c.a);const steer=K.clamp(d*(hard?3.7:3.4),-1,1);
   if(c.reverseRecovery>0)return {steer:-steer||1,gas:false,brake:true};
   const bend=Math.max(Math.abs(K.angleDiff(B.tangent(p+.012),B.tangent(p))),Math.abs(K.angleDiff(B.tangent(p+.023),B.tangent(p+.008))));
   const cap=c.profile.max*s.pace*(c.boost>0?1.42:1);let desired=cap*(1-K.clamp((bend-(hard?.25:.16))*(hard?.48:.65),0,hard?.48:.60));
   if(Math.abs(d)>.34)desired=Math.min(desired,cap*(1-K.clamp((Math.abs(d)-.28)*.68,0,.66)));
   if(branch)desired=Math.min(desired,cap*.83);
   if(leader&&gap<60&&!(c.aiPassUntil>race.time))desired=Math.min(desired,Math.max(80,leader.speed));
   if(near.distance>95)desired=Math.min(desired,110);
   if(oil.slow)desired=Math.min(desired,cap*.68);
   else if(c.aiOilSeen?.side)desired=Math.min(desired,cap*.86);
   const brake=c.speed>desired+(hard?16:12)&&c.speed>75;return {steer,gas:!brake&&(desired>=cap*.96||c.speed<desired+(hard?7:3)),brake};
 }
 function cameraPose(c){
   if(!(c?.boxTransit>0))return null;
   if(c.boxTransit<exitDuration)return {x:c.x,y:c.y};
   const t=K.clamp((B.transit-c.boxTransit)/(B.transit-exitDuration),0,1),u=t*t*(3-2*t);
   return {x:B.entryPocket.x+(B.exitPocket.x-B.entryPocket.x)*u,y:B.entryPocket.y+(B.exitPocket.y-B.entryPocket.y)*u};
 }
 window.TTRBoxRules=Object.freeze({obstacles,transit,environment,cpuTarget,drive,cameraPose,exitAssistDuration});})();
