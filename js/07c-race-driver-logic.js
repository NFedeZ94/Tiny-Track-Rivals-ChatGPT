/* Tiny Track Rivals — Fase 7: logica di gara estratta senza alterare gli algoritmi.
 * Script classico: dipendenze iniettate dalla closure del legacy, nessuno stato globale di gara duplicato. */
(()=>{'use strict';
window.TTRRaceDrivers=Object.freeze({create(deps){
  const {getRace,getOnlineSession,onlineHostInput,controls,keys,trackPoint,mod,angleDiff,clamp,nearestTrack,points,K,props}=deps;

function inputFor(c){
 const race=getRace(),onlineSession=getOnlineSession();
if(race?.mode==='online'&&onlineSession?.host&&c.id!==0){const net=onlineHostInput(c);if(net)return net;}if(c===race.player){const steer=(controls.right||window.TTRKeyboard.down('right')?1:0)-(controls.left||window.TTRKeyboard.down('left')?1:0);return {steer,gas:race.auto||controls.gas||window.TTRKeyboard.down('gas'),brake:controls.brake||window.TTRKeyboard.down('brake')};}
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
 return Object.freeze({inputFor});
}});
})();
