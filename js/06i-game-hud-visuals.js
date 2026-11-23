/* Tiny Track Rivals — Fase 6i: presentazione HUD, senza logica di gameplay. */
(()=>{'use strict';
function render({position,lap,time,item,typeNames}){
 const $=id=>document.getElementById(id);
 $('position').textContent=position;$('lap').textContent=lap;
 $('time').textContent=time;$('item').textContent=item?typeNames[item]:'—';
 const power=$('use');if(power){const clawGraphic='<svg aria-hidden="true" viewBox="0 0 64 64" width="32" height="32"><path fill="#90aabe" stroke="#13283a" stroke-width="4" d="M26 6h12l5 22-5 9H26l-5-9z"/><path fill="#dce5e8" stroke="#173043" stroke-width="4" stroke-linejoin="round" d="M23 30C11 28 5 37 7 48c2 9 13 12 21 4l-5-9c-5 5-10 3-10-3 1-5 5-7 10-6zM41 30c12-2 18 7 16 18-2 9-13 12-21 4l5-9c5 5 10 3 10-3-1-5-5-7-10-6z"/><circle cx="32" cy="24" r="7" fill="#e8b84d" stroke="#173043" stroke-width="3"/></svg>';
 const icons={turbo:'⚡',oil:'🛢',claw:clawGraphic};const key=item||'empty';if(power.dataset.power!==key){power.dataset.power=key;power.innerHTML='<span class="power-token '+key+'">'+(icons[key]||'?')+'</span>';power.setAttribute('aria-label',item?'Attiva '+typeNames[item]:'Nessun power-up');}}
}
window.TTRHudVisuals=Object.freeze({render});
})();
