/* Tiny Track Rivals — Fase 9: olio e chiazze latte: contatto e slittamento.
 * 14.22p: suono latte distinto dall'olio. Fisica invariata. */
(()=>{'use strict';
window.TTRRaceOil=Object.freeze({create(deps){
 const {getRace,milkCerealSpills,oilHit,SND}=deps;
function handleOilContact(c,oldX,oldY) {
 const race=getRace();
 for(let si=0,n=race.oils.length+milkCerealSpills.length;si<n;si++){
  const milk=si>=race.oils.length;
  const oil=milk?milkCerealSpills[si-race.oils.length]:race.oils[si];
  if(!(c.oilCooldown>0)&&!(c.oilSpin>0)&&oilHit(c,oldX,oldY,oil)){
   c.slip=Math.max(c.slip,1.22);c.oilCooldown=1.55;c.oilSpin=1.16;
   const sign=Math.abs(c.steer)>.16?Math.sign(c.steer):(c.id%2?1:-1);
   c.oilSpinDir=sign;
   c.skidVX=(c.skidVX||0)-Math.sin(c.a)*sign*65;
   c.skidVY=(c.skidVY||0)+Math.cos(c.a)*sign*65;
   c.speed*=.80;
   if(c===race.player)SND.sfx(milk?'boxPocket':'oilSkid');
 }}
}
 return Object.freeze({handleOilContact});
}});
})();
