/* Tiny Track Rivals — Fase 7: logica di gara estratta senza alterare gli algoritmi.
 * Script classico: dipendenze iniettate dalla closure del legacy, nessuno stato globale di gara duplicato. */
(()=>{'use strict';
window.TTRRaceDrivers=Object.freeze({create(deps){
  const {getRace,getOnlineSession,onlineHostInput,controls,keys,trackPoint,mod,angleDiff,clamp,nearestTrack,points,K,props}=deps;

function inputFor(c){
 const race=getRace(),onlineSession=getOnlineSession();
if(race?.mode==='online'&&onlineSession?.host&&c.id!==0){const net=onlineHostInput(c);if(net)return net;}if(c===race.player){const steer=(controls.right||window.TTRKeyboard.down('right')?1:0)-(controls.left||window.TTRKeyboard.down('left')?1:0);return {steer,gas:race.auto||controls.gas||window.TTRKeyboard.down('gas'),brake:controls.brake||window.TTRKeyboard.down('brake')};}
 let target=trackPoint(mod(c.p+.027,1));
 const ramp=props.find(o=>o.type==='ramp');const difficulty=race.aiFactor||1;
 if(ramp&&race.mode!=='online'&&!c.bridgeMissActive&&c.p>.53&&c.p<.625&&c.shortcutDecisionLap!==c.lapsCompleted){c.shortcutDecisionLap=c.lapsCompleted;c.tryShortcut=Math.random()<(difficulty>=1.1?.72:difficulty>=1?.30:.08);}
 if(c.bridgeMissActive||c.respawnGrace>0||c.p>.82||c.p<.50)c.tryShortcut=false;
 if(c.onBridge){const b=K.shortcutNearest(c);target=K.shortcutPoint(Math.min(1,b.t+.075));if(b.t>.96)target=trackPoint(mod(K.shortcutTo+.025,1));}
 else if(c.tryShortcut&&ramp&&c.p>.53&&c.p<.625){const along=(c.x-ramp.x)*Math.cos(ramp.a)+(c.y-ramp.y)*Math.sin(ramp.a);const lead=along< -105?-90:38;target={x:ramp.x+Math.cos(ramp.a)*lead,y:ramp.y+Math.sin(ramp.a)*lead};}
 const desired=Math.atan2(target.y-c.y,target.x-c.x),d=angleDiff(desired,c.a);let steer=clamp(d*2.8,-1,1);const near=nearestTrack(c,points),tooFar=near.distance>55;
 if(tooFar&&!c.onBridge&&!c.tryShortcut){const go=Math.atan2(near.y-c.y,near.x-c.x),turn=angleDiff(go,c.a);steer=clamp(turn*2.8,-1,1);}
 const v=Math.abs(d);
  if(c.reverseRecovery>0)return {steer:-steer||1,gas:false,brake:true};
  return {steer,gas:v<.58||c.speed<92,brake:v>.75&&c.speed>120};
}
 return Object.freeze({inputFor});
}});
})();
