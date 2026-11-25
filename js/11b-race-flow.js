/* Tiny Track Rivals — Fase 11b. Impostazioni modalità e collegamento risultati/menu/carriera.
 * Nessun cambiamento alle regole delle gare o al sistema di progressione.
 */
(()=>{'use strict';
 function careerDifficulty(state,medalCount){
  const wins=Math.max(0,Number(state.wins)||0),medals=medalCount?.(state)||0;
  return Math.min(1.13,.80+Math.min(12,wins)*.0125+Math.min(36,medals)*.005);
 }
 function modeSettings(mode,cfg,selectedCar,onlineSession,careerFactor){
  return mode==='race'?window.TTRModeRace.settings(cfg,selectedCar):
   mode==='trial'?window.TTRModeTrial.settings(selectedCar):
   mode==='elimination'?window.TTRModeElimination.settings(cfg,selectedCar):
   {num:mode==='online'&&onlineSession?onlineSession.capacity:mode==='career'?4:Number(cfg?.racers||4),
    pr:selectedCar,aiFactor:mode==='career'?careerFactor:1,auto:true};
 }
 function recordCareerResult(race,c,place,racerCount){
  if(race.mode!=='career'||!c.done||race.careerRecorded)return null;
  race.careerRecorded=true;
  return window.TTRCareer?.recordResult({mode:'career',finished:true,laps:c.lapsCompleted,place,racerCount,
   trackIndex:race.trackIndex??0,carId:c.profile.id,respawns:c.shortcutRespawns||0,pickups:race.careerStats?.pickups||0,
   turbos:race.careerStats?.turbos||0,oils:race.careerStats?.oils||0,claws:race.careerStats?.claws||0});
 }
 function resultActions(mode,nav){
  return {
   again:()=>{if(mode==='online'){nav.onlineQuit();nav.mainMenu();nav.onlineOpenPanel();}else nav.openCircuitLoading(mode);},
   toMenu:mode==='career'?()=>{nav.mainMenu();nav.openCareer();}:nav.mainMenu
  };
 }
 window.TTRRaceFlow=Object.freeze({careerDifficulty,modeSettings,recordCareerResult,resultActions});
})();
