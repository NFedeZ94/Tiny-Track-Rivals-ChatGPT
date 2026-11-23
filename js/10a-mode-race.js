/* Tiny Track Rivals — Fase 10a: configurazione Gara veloce. Nessuna modifica alle regole. */
(()=>{'use strict';
 window.TTRModeRace=Object.freeze({
  settings(cfg,selectedCar){return {
   num:Number(cfg?.racers||4),pr:selectedCar,
   aiFactor:Number(cfg?.difficulty||1),auto:cfg?.auto!=='0'
  };}
 });
})();
