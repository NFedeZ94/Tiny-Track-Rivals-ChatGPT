/* Tiny Track Rivals — collisioni con ostacoli e tra veicoli; 14.22p: cue dei materiali.
 * Mantiene ordine, soglie e dipendenze della fase 9. */
(()=>{'use strict';
window.TTRRaceCollisions=Object.freeze({create(deps){
 const {getRace,props,contactWithProp,stuckRecoveryStep,recoverCar,resolveCarContacts,eliminationActive,edgeOfTable,startTableFall,SND}=deps;
 const cues={'box-ball':'boxBall','desk-clip':'spoon','desk-pencil':'boxWood','desk-eraser':'boxRack','desk-highlighter':'boxChalk','desk-sharpener':'spoon','bath-soap':'slowSurface','bath-bottle':'boxBall','knife':'spoon','spoon':'spoon','toast':'boxWood','cookie':'boxRack','cookie_alt':'boxRack','cereal':'boxChalk','glass':'boxBall','plate_croissant':'boxBall'};
function handleObstacles(c,oldX,oldY,dt) {
 const race=getRace();
 let touchedObstacle=race.trackId==='box-di-biliardo'&&!!c.boxPropContact;c.boxPropContact=false;
 if(c.onBridge){c.stuckAnchor=null;c.obstacleStuckSeconds=0;return;}
 for(const o of props){const reach=(o.type==='knife'?o.length||168:o.r||40)+(c.length||65)+18;if(Math.abs(o.x-c.x)>reach&&Math.abs(o.x-oldX)>reach||Math.abs(o.y-c.y)>reach&&Math.abs(o.y-oldY)>reach)continue;if(contactWithProp(c,o,{x:oldX,y:oldY})){
   touchedObstacle=true;
   if(c===race.player&&c.jump<=0&&race.time-(c.lastPropHit||-10)>.35){c.lastPropHit=race.time;SND.sfx(cues[o.type]||'impact');}
 }}
 if(stuckRecoveryStep(c,dt,race.time,touchedObstacle))recoverCar(c,'stuck');
}
function handleCars() {
 const race=getRace();
 const active=race.mode==='elimination'?eliminationActive():race.cars;
 const narrow=race.trackId==='bagno-sprint'?window.TTRBathRules:race.trackId==='desk-drift'?window.TTRDeskRules:null;
 const before=narrow?active.map(c=>[c,narrow.contactSnapshot(c)]):[];
 const contacts=resolveCarContacts(active);
 if(narrow)for(const [c,old] of before)narrow.softenContact(c,old);
 for(const c of race.cars)if(!c.done&&!(c.tableFalling>0)&&edgeOfTable(c))startTableFall(c);
 for(const hit of contacts.hits){race.effects.push({kind:'impactBurst',x:hit.x,y:hit.y,t:.32,ttl:.32,nx:hit.nx,ny:hit.ny,intensity:hit.intensity});}
 if(contacts.impacts>0&&contacts.maxImpulse>24&&race.time-race.lastImpactSound>.24){SND.sfx('impact');race.lastImpactSound=race.time;}
}
 return Object.freeze({handleObstacles, handleCars});
}});
})();
