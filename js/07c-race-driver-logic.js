/* Tiny Track Rivals — Fase 7: logica di gara estratta senza alterare gli algoritmi.
 * Script classico: dipendenze iniettate dalla closure del legacy, nessuno stato globale di gara duplicato. */
(()=>{'use strict';
window.TTRRaceDrivers=Object.freeze({create(deps){
  const {getRace,getOnlineSession,onlineHostInput,controls,keys,trackPoint,mod,angleDiff,clamp,nearestTrack,points,K,props}=deps;

function legacyInputFor(c){
 const race=getRace(),onlineSession=getOnlineSession();
if(race?.mode==='online'&&onlineSession?.host&&c.id!==0){const net=onlineHostInput(c);if(net)return net;}if(c===race.player){const steer=(controls.right||window.TTRKeyboard.down('right')?1:0)-(controls.left||window.TTRKeyboard.down('left')?1:0);return {steer,gas:true,brake:controls.brake||window.TTRKeyboard.down('brake')};}
 const difficulty=race.aiFactor||1,level=difficulty<.95?0:difficulty<1.1?1:2;
 const ramp=props.find(o=>o.type==='ramp');const inZone=c.p>.515&&c.p<.63;
 const visit=(race.elim?.round||0)+':'+c.lapsCompleted;
 if(ramp&&race.mode!=='online'&&inZone&&c.shortcutDecisionLap!==visit&&!c.bridgeMissActive){
  c.shortcutDecisionLap=visit;c.tryShortcut=Math.random()<[.10,.40,.80][level];c.shortcutDecisionCount=(c.shortcutDecisionCount||0)+1;if(c.tryShortcut)c.shortcutAttemptCount=(c.shortcutAttemptCount||0)+1;
  // A less accurate approach, rather than a forced failure, creates skill-dependent results.
  c.rampAimOffset=(Math.random()*2-1)*[49,30,9][level];
 }
 if(c.bridgeMissActive||c.respawnGrace>0||c.p>.82||c.p<.50)c.tryShortcut=false;
 let target=trackPoint(mod(c.p+[.021,.025,.027][level],1));
 if(c.onBridge){const b=K.shortcutNearest(c);target=K.shortcutPoint(Math.min(1,b.t+.075));if(b.t>.96)target=trackPoint(mod(K.shortcutTo+.025,1));}
 else if(c.tryShortcut&&ramp&&inZone){const along=(c.x-ramp.x)*Math.cos(ramp.a)+(c.y-ramp.y)*Math.sin(ramp.a);const lead=along< -105?-90:38,offset=c.rampAimOffset||0;target={x:ramp.x+Math.cos(ramp.a)*lead-Math.sin(ramp.a)*offset,y:ramp.y+Math.sin(ramp.a)*lead+Math.cos(ramp.a)*offset};}
 else if(ramp&&c.p>.54&&c.p<.67){const phase=mod(c.p+.027,1),a=K.tangent(phase),nx=-Math.sin(a),ny=Math.cos(a);const ref=trackPoint(K.shortcutFrom),ra=K.tangent(K.shortcutFrom);const side=(ref.x-ramp.x)*-Math.sin(ra)+(ref.y-ramp.y)*Math.cos(ra)>=0?1:-1;const weight=clamp((phase-.55)/.03,0,1)*clamp((.675-phase)/.035,0,1);target={x:target.x+nx*side*82*weight,y:target.y+ny*side*82*weight};}
 // Avoid tall objects ahead without routing through the grass.
 if(!c.onBridge&&!c.tryShortcut){for(const o of props){if(!o.solid||o.type==='knife')continue;const dx=o.x-c.x,dy=o.y-c.y,dist=Math.hypot(dx,dy);if(dist>o.r+105||dx*Math.cos(c.a)+dy*Math.sin(c.a)<0)continue;const a=K.tangent(c.p),nx=-Math.sin(a),ny=Math.cos(a),side=dx*nx+dy*ny>0?-1:1;target={x:target.x+nx*side*38,y:target.y+ny*side*38};break;}}
 const desired=Math.atan2(target.y-c.y,target.x-c.x),d=angleDiff(desired,c.a);let steer=clamp(d*[2.1,2.5,2.8][level],-1,1);const near=nearestTrack(c,points),tooFar=near.distance>55;
 if(tooFar&&!c.onBridge&&!c.tryShortcut&&!(ramp&&c.p>.54&&c.p<.67&&near.distance<105)){const go=Math.atan2(near.y-c.y,near.x-c.x),turn=angleDiff(go,c.a);steer=clamp(turn*2.8,-1,1);}
 const v=Math.abs(d);
 if(c.reverseRecovery>0)return {steer:-steer||1,gas:false,brake:true};
 const brake=v>[.53,.65,.75][level]&&c.speed>[93,108,120][level];
 return {steer,gas:!brake&&(v<[.46,.53,.58][level]||c.speed<92),brake};
}
 // Offline skill is shared by race, elimination and progressive career.
 // Physics remains identical; no speed or acceleration beyond vehicle limits.
 const skillProfiles=Object.freeze([
   Object.freeze({pace:.80,look:105,line:0,steer:2.1,curveSpeed:.77,pass:0,shortcut:.10,aim:49}),
   Object.freeze({pace:.95,look:125,line:.45,steer:2.55,curveSpeed:.89,pass:34,shortcut:.45,aim:27}),
   Object.freeze({pace:1,look:185,line:1,steer:3.2,curveSpeed:1,pass:52,shortcut:.60,aim:8})
 ]);
 function skillFor(race){
   const f=race.aiFactor||1;
   if(race.mode!=='career')return skillProfiles[f<.95?0:f<1.1?1:2];
   if(race.aiSkillProfile?.factor===f)return race.aiSkillProfile.profile;
   const t=clamp((f-.8)/.33,0,1)*2,i=Math.min(1,Math.floor(t)),u=t-i;
   const a=skillProfiles[i],b=skillProfiles[i+1],profile=Object.fromEntries(Object.keys(a).map(k=>[k,a[k]+(b[k]-a[k])*u]));race.aiSkillProfile={factor:f,profile};return profile;
 }
 const length=K.TRACK_LENGTH;
 const ramp=()=>props.find(o=>o.type==='ramp');
 function linePoint(p,strength){
   const chord=strength>=.999?.021:.014;const q=trackPoint(p),a=trackPoint(p-chord),b=trackPoint(p+chord),heading=K.tangent(p);
   // A bounded chord through the bend, still well inside the drivable lane.
   const n={x:-Math.sin(heading),y:Math.cos(heading)};
   const off=clamp(((a.x+b.x)/2-q.x)*n.x+((a.y+b.y)/2-q.y)*n.y,-(strength>=.999?48:42),strength>=.999?48:42)*strength;
   return {x:q.x+n.x*off,y:q.y+n.y*off};
 }
 function inputFor(c){
   const race=getRace();if(c===race.player||race.mode==='online')return legacyInputFor(c);
   const s=skillFor(race),hardLevel=s.curveSpeed>=.999;
   if(race.trackId==='box-di-biliardo')return window.TTRBoxRules.drive(c,race,s);
   if(hardLevel&&!c.aiPersonality)c.aiPersonality=['aggressive','technical','strategic'][((c.id-1)%3+3)%3];
   const r=ramp(),inZone=c.p>.515&&c.p<.63,visit=(race.elim?.round||0)+':'+c.lapsCompleted;
   if(r&&inZone&&c.shortcutDecisionLap!==visit&&!c.bridgeMissActive){
     c.shortcutDecisionLap=visit;
     const chance=hardLevel?({aggressive:.76,technical:.38,strategic:.66}[c.aiPersonality]??.60):s.shortcut;
     const clear=!hardLevel||!race.cars.some(o=>o!==c&&!o.done&&!o.eliminated&&o.tryShortcut&&Math.hypot(o.x-c.x,o.y-c.y)<95);
     c.tryShortcut=Math.random()<chance&&clear&&(!hardLevel||c.aiRampStreak!==2);
     if(hardLevel)c.aiRampStreak=c.tryShortcut?(c.aiRampStreak||0)+1:0;c.shortcutDecisionCount=(c.shortcutDecisionCount||0)+1;
     if(c.tryShortcut)c.shortcutAttemptCount=(c.shortcutAttemptCount||0)+1;
     c.rampAimOffset=(Math.random()*2-1)*s.aim;
   }
   if(c.bridgeMissActive||c.respawnGrace>0||c.p>.82||c.p<.50||c.aiRecoveryUntil>race.time)c.tryShortcut=false;
   const phase=mod(c.p+(s.look+Math.max(0,c.speed)*.12)/length,1);
   let target=linePoint(phase,s.line),plannedBranch=false;
   const a=K.tangent(phase),nx=-Math.sin(a),ny=Math.cos(a);
   if(c.onBridge){const b=K.shortcutNearest(c);target=K.shortcutPoint(Math.min(1,b.t+.075));if(b.t>.96)target=trackPoint(mod(K.shortcutTo+.025,1));plannedBranch=true;}
   else if(c.tryShortcut&&r&&inZone){const along=(c.x-r.x)*Math.cos(r.a)+(c.y-r.y)*Math.sin(r.a),lead=along< -105?-90:38,off=c.rampAimOffset||0;target={x:r.x+Math.cos(r.a)*lead-Math.sin(r.a)*off,y:r.y+Math.sin(r.a)*lead+Math.cos(r.a)*off};plannedBranch=true;}
   else if(r&&c.p>.54&&c.p<.67){const ref=trackPoint(K.shortcutFrom),ra=K.tangent(K.shortcutFrom),side=(ref.x-r.x)*-Math.sin(ra)+(ref.y-r.y)*Math.cos(ra)>=0?1:-1;const weight=clamp((phase-.55)/.03,0,1)*clamp((.675-phase)/.035,0,1);target={x:target.x+nx*side*82*weight,y:target.y+ny*side*82*weight};plannedBranch=true;}
   let obstacle=null,offset=0,blocked=false;
   if(!plannedBranch){
     for(const o of props){if(!o.solid||o.type==='knife')continue;const dx=o.x-c.x,dy=o.y-c.y,dist=Math.hypot(dx,dy);if(dist>o.r+110||dx*Math.cos(c.a)+dy*Math.sin(c.a)<0)continue;
       const ahead=Math.hypot(target.x-o.x,target.y-o.y);if(ahead>o.r+65)continue;
       const side=(o.x-target.x)*nx+(o.y-target.y)*ny>0?-1:1;offset=side*45;obstacle=o;break;
     }
     // Choose one passing side and hold it; do not weave every simulation step.
     let front=null,frontGap=Infinity;
     for(const other of race.cars){if(other===c||other.eliminated||other.done||other.onBridge||other.jump>0)continue;const dx=other.x-c.x,dy=other.y-c.y,f=dx*Math.cos(c.a)+dy*Math.sin(c.a),side=-dx*Math.sin(c.a)+dy*Math.cos(c.a);if(f>12&&f<140&&Math.abs(side)<46&&f<frontGap){front=other;frontGap=f;}}
     if(front&&front.speed<c.speed+16&&s.pass>0&&!obstacle){
       if(!(c.aiPassUntil>race.time)&&!(c.aiPassCooldown>race.time)){const side=(front.x-target.x)*nx+(front.y-target.y)*ny>0?-1:1;c.aiPassSide=side;c.aiPassUntil=race.time+1.15;c.aiPassCooldown=race.time+2.1;c.aiPassAttempts=(c.aiPassAttempts||0)+1;}
     }
     if(c.aiPassUntil>race.time&&!obstacle)offset=c.aiPassSide*s.pass;
     else if(front&&frontGap<58)blocked=true;
     target={x:target.x+nx*offset,y:target.y+ny*offset};
   }
   const near=nearestTrack(c,points);
   if(c.aiRecoveryUntil>race.time&&!c.onBridge){const q=trackPoint(near.p+.012);target={x:q.x,y:q.y};plannedBranch=false;}
   if(near.distance>(s.curveSpeed>=.999?92:83)&&!plannedBranch&&!(c.aiRecoveryUntil>race.time)){target={x:near.x,y:near.y};}
   const edgeRisk=!c.onBridge&&(c.x<120||c.x>K.WORLD_W-120||c.y<120||c.y>K.WORLD_H-120)&&near.distance>75;
   if(edgeRisk){target=trackPoint(near.p+.006);plannedBranch=false;c.tryShortcut=false;}
   const d=angleDiff(Math.atan2(target.y-c.y,target.x-c.x),c.a),v=Math.abs(d);
   const steer=clamp(d*s.steer,-1,1);
   if(c.reverseRecovery>0)return {steer:-steer||1,gas:false,brake:true};
   // Predict turn severity ahead, not merely current heading error. Preserve
   // full throttle on straights and a useful speed on the approved ramp.
   const bend=Math.abs(angleDiff(K.tangent(c.p+.033),K.tangent(c.p+.008)));
   const cap=c.profile.max*s.pace*(c.boost>0?1.42:1);
   let desired=cap*(1-clamp((bend-.30)*.34,0,.38)*(.10+(1-s.curveSpeed)*3.3));
   const turnThreshold=.65+(s.curveSpeed-.77)*.9+(s.curveSpeed>=.999?.12:0);
   if(v>turnThreshold)desired=Math.min(desired,cap*(1-clamp((v-turnThreshold+.10)*.46,0,.55)));
   if(obstacle)desired=Math.min(desired,cap*(.78+(s.curveSpeed-.77)*.5));
   if(edgeRisk)desired=Math.min(desired,105);
   if(blocked)desired=Math.min(desired,Math.max(75,frontSpeedFallback(c,race)));
   if(plannedBranch&&c.tryShortcut&&v<.45)desired=cap;
   const hard=s.curveSpeed>=.999;
   // Avoid needless throttle/coast oscillation at the vehicle speed limiter.
   // Only hard AI gets the tighter racing-line and throttle calibration.
   const brake=c.speed>desired+(hard?16:12)&&c.speed>85;
   return {steer,gas:!brake&&(hard&&desired>=cap*.96||c.speed<desired+(hard?8:3)),brake};
 }
 function frontSpeedFallback(c,race){let speed=c.speed;for(const other of race.cars){if(other!==c&&!other.done&&!other.eliminated&&Math.hypot(other.x-c.x,other.y-c.y)<90)speed=Math.min(speed,other.speed);}return speed;}
 return Object.freeze({inputFor,skillFor});

}});
})();
