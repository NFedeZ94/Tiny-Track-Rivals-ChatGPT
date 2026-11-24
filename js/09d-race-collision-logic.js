/* Tiny Track Rivals — Fase 9: collisioni con ostacoli e tra veicoli.
 * Estrazione meccanica dei blocchi della fase 8. Nessuna modifica a condizioni, costanti o ordine.
 * Lo stato resta nella closure del legacy; dipendenze iniettate esplicitamente. */
(()=>{'use strict';
window.TTRRaceCollisions=Object.freeze({create(deps){
 const {getRace,props,contactWithProp,stuckRecoveryStep,recoverCar,resolveCarContacts,eliminationActive,edgeOfTable,startTableFall,SND}=deps;
function handleObstacles(c,oldX,oldY,dt) {
 const race=getRace();
 // Orange rind in v62 is a solid obstacle: no auto-launch and no jump award.
 // Static object collisions; jump avoids low obstacles.
 let touchedObstacle=false;
 if(c.onBridge){c.stuckAnchor=null;c.obstacleStuckSeconds=0;return;}
 for(const o of props){const reach=(o.type==='knife'?o.length||168:o.r||40)+(c.length||65)+18;if(Math.abs(o.x-c.x)>reach&&Math.abs(o.x-oldX)>reach||Math.abs(o.y-c.y)>reach&&Math.abs(o.y-oldY)>reach)continue;if(contactWithProp(c,o,{x:oldX,y:oldY})){
   touchedObstacle=true;
   if(c===race.player&&c.jump<=0&&race.time-(c.lastPropHit||-10)>.35){c.lastPropHit=race.time;SND.sfx('impact');}
 }}
 if(stuckRecoveryStep(c,dt,race.time,touchedObstacle))recoverCar(c,'stuck');
}


function handleCars() {
 const race=getRace();
 // SAT collision response: no overlap and no sticky joints, with temporary lateral knockback.
 const contacts=resolveCarContacts(race.mode==='elimination'?eliminationActive():race.cars);
 // A strong bump can physically carry another car beyond the tabletop boundary;
 // run the fall detector AFTER collision resolution, not only before it.
 for(const c of race.cars)if(!c.done&&!(c.tableFalling>0)&&edgeOfTable(c))startTableFall(c);
 for(const hit of contacts.hits){race.effects.push({kind:'impactBurst',x:hit.x,y:hit.y,t:.32,ttl:.32,nx:hit.nx,ny:hit.ny,intensity:hit.intensity});}
 if(contacts.impacts>0&&contacts.maxImpulse>24&&race.time-race.lastImpactSound>.24){SND.sfx('impact');race.lastImpactSound=race.time;}
}
 return Object.freeze({handleObstacles, handleCars});
}});
})();
