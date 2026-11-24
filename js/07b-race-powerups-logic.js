/* Tiny Track Rivals — Fase 7: logica di gara estratta senza alterare gli algoritmi.
 * Script classico: dipendenze iniettate dalla closure del legacy, nessuno stato globale di gara duplicato. */
(()=>{'use strict';
window.TTRRacePowerups=Object.freeze({create(deps){
  const {getRace,getOnlineSession,onlineSend,SND,clawTarget,props,distance,showHint,t}=deps;

function useItem(c){
 const race=getRace(),onlineSession=getOnlineSession();
if(!c||!c.item||c.done)return;
 if(race?.mode==='online'&&onlineSession&&!onlineSession.host&&c===race.player){onlineSend({type:'action',action:'item'});return;}const type=c.item;c.item=null;
 if(c===race.player&&race.mode==='career'&&race.careerStats&&Object.prototype.hasOwnProperty.call(race.careerStats,{turbo:'turbos',oil:'oils',claw:'claws'}[type]))race.careerStats[{turbo:'turbos',oil:'oils',claw:'claws'}[type]]++;
 if(type==='turbo'){c.boost=1.05;if(c===race.player)SND.sfx('turbo');}
 if(type==='oil'){let x=c.x-Math.cos(c.a)*56,y=c.y-Math.sin(c.a)*56;race.oils.push({x,y,t:9,r:34,owner:c.id,phase:Math.random()*6.28});if(c===race.player)SND.sfx('oil');}
 if(type==='claw'){
   const target=clawTarget(c,race.cars,props,162,.30);
   if(target){c.claw=1.28;c.clawTarget=target;c.clawStartDist=distance(c,target);if(c===race.player)SND.sfx('claw');}
   else if(c===race.player){SND.sfx('clawFail');}
 }
}
 return Object.freeze({useItem});
}});
})();
