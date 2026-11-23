/* Tiny Track Rivals — Fase 10b: Time Trial e record personali. */
(()=>{'use strict';
 window.TTRModeTrial=Object.freeze({
  settings(selectedCar){return {num:1,pr:selectedCar,aiFactor:1,auto:true};},
  recordBest(car,fmtTime,t){
   const key=`ttr_tt_colazione_${car.profile.id}`;
   try{
    const previous=Number(localStorage.getItem(key))||Infinity;
    if(car.finishTime<previous){localStorage.setItem(key,String(car.finishTime));return '🏆 '+t('recordNew');}
    return `${t('recordOld')}: ${fmtTime(previous)}`;
   }catch(e){return t('saveUnavailable');}
  }
 });
})();
