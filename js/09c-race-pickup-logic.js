/* Tiny Track Rivals — Fase 9: raccolta power-up e cooldown.
 * Estrazione meccanica dei blocchi della fase 8. Nessuna modifica a condizioni, costanti o ordine.
 * Lo stato resta nella closure del legacy; dipendenze iniettate esplicitamente. */
(()=>{'use strict';
window.TTRRacePickups=Object.freeze({create(deps){
 const {getRace,circleRotatedRect,pickupType,K,SND}=deps;
function collect(c) {
 const race=getRace();
 // Pickup collision: a fixed 1.5× visible-box diameter (22 * 1.5 / 2).
 for(const p of race.pickups){if(p.cool>0||c.item||c.jump>0)continue;if(circleRotatedRect(p,c,p.r)){c.item=pickupType(race.mode,Math.random());p.cool=K.pickupRespawnSeconds(race.cars.length);if(c===race.player){if(race.mode==='career'&&race.careerStats)race.careerStats.pickups++;SND.sfx('pickup');}}}
}
 return Object.freeze({collect});
}});
})();
