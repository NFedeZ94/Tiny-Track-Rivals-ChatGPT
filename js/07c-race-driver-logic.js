/* Tiny Track Rivals — Fase 7: logica di gara estratta senza alterare gli algoritmi.
 * Script classico: dipendenze iniettate dalla closure del legacy, nessuno stato globale di gara duplicato. */
(()=>{'use strict';
window.TTRRaceDrivers=Object.freeze({create(deps){
  const {getRace,getOnlineSession,onlineHostInput,controls,keys,trackPoint,mod,angleDiff,clamp,nearestTrack,points}=deps;

function inputFor(c){
 const race=getRace(),onlineSession=getOnlineSession();
if(race?.mode==='online'&&onlineSession?.host&&c.id!==0){const net=onlineHostInput(c);if(net)return net;}if(c===race.player){const steer=(controls.right||keys.ArrowRight||keys.KeyD?1:0)-(controls.left||keys.ArrowLeft||keys.KeyA?1:0);return {steer,gas:race.auto||controls.gas||keys.ArrowUp||keys.KeyW,brake:controls.brake||keys.ArrowDown||keys.KeyS};}
 const target=trackPoint(mod(c.p+.027,1)),desired=Math.atan2(target.y-c.y,target.x-c.x),d=angleDiff(desired,c.a);let steer=clamp(d*2.8,-1,1);const near=nearestTrack(c,points),tooFar=near.distance>55;
 if(tooFar){const go=Math.atan2(near.y-c.y,near.x-c.x),turn=angleDiff(go,c.a);steer=clamp(turn*2.8,-1,1);}
 const v=Math.abs(d);
  if(c.reverseRecovery>0)return {steer:-steer||1,gas:false,brake:true};
  return {steer,gas:v<.58||c.speed<92,brake:v>.75&&c.speed>120};
}
 return Object.freeze({inputFor});
}});
})();
