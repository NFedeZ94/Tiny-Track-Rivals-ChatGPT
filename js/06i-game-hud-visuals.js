/* TTR 14.4 — compact borderless HUD; custom vector power icons. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const put=(el,v)=>{v=String(v);if(el.textContent!==v)el.textContent=v;};
const paths={turbo:'<path d="M4 20h18M3 32h15M8 44h12" stroke="#57baff" stroke-width="5" stroke-linecap="round"/><path d="M34 4 16 35h16l-7 25 33-37H40L50 4Z" fill="#ffd24d" stroke="#14243b" stroke-width="3" stroke-linejoin="round"/>',oil:'<ellipse cx="32" cy="53" rx="27" ry="8" fill="#475775" stroke="#14243b" stroke-width="3"/><path d="M32 4C24 18 13 29 13 39a19 19 0 0 0 38 0C51 29 40 18 32 4Z" fill="#566c8c" stroke="#14243b" stroke-width="3"/><path d="M25 25q-8 12-3 18" fill="none" stroke="#d7f0ff" stroke-width="4" stroke-linecap="round"/>',claw:'<path d="M25 4h14l3 21-10 8-10-8Z" fill="#8aa6c3" stroke="#14243b" stroke-width="3"/><path d="M23 24Q5 22 5 40q0 17 19 19l4-12q-14-4-8-14l8-1ZM41 24q18-2 18 16 0 17-19 19l-4-12q14-4 8-14l-8-1Z" fill="#d6e5f3" stroke="#14243b" stroke-width="3"/><circle cx="32" cy="24" r="7" fill="#ffd45b" stroke="#14243b" stroke-width="3"/>'};
const icon=k=>paths[k]?`<svg aria-hidden="true" viewBox="0 0 64 64" width="36" height="36">${paths[k]}</svg>`:'?';
function trialBlock(id,label){let el=$(id);if(!el){el=document.createElement('div');el.className='statBlock trial-only';el.id=id;el.innerHTML='<small></small><strong></strong><span class="trial-notice"></span>';$('hud').querySelector('.hudTop').append(el);}put(el.querySelector('small'),label);return el;}
function render({position,lap,time,item,typeNames,trial}){
 const h=$('hud');h.classList.toggle('hud-trial',!!trial);
 put($('position'),position);put($('lap'),lap);put($('time'),time);put($('item'),item?typeNames[item]:'—');
 const total=$('time').parentElement.querySelector('small');if(trial){total.textContent='TEMPO TOTALE';$('time').textContent=window.TTRTrialSession.formatTime(trial.total);const a=trialBlock('trialCurrent','GIRO ATTUALE'),b=trialBlock('trialBest','GIRO MIGLIORE');a.querySelector('strong').textContent=window.TTRTrialSession.formatTime(trial.current);b.querySelector('strong').textContent=trial.best==null?'—':window.TTRTrialSession.formatTime(trial.best);const n=a.querySelector('.trial-notice');n.textContent=trial.notice?.gap==null?'':window.TTRTrialSession.formatGap(trial.notice.gap);n.className='trial-notice '+(trial.notice?.gap<0?'trial-fast':trial.notice?.gap>0?'trial-slow':'');b.querySelector('.trial-notice').textContent=trial.notice?.newBest?'NUOVO MIGLIORE!':'';}else total.textContent=window.TTRI18N?.t('time')||'TEMPO';
 const power=$('use');if(power){const key=item||'empty';if(power.dataset.power!==key){power.dataset.power=key;power.innerHTML='<span class="power-token '+key+'">'+icon(key)+'</span>';power.setAttribute('aria-label',item?'Attiva '+typeNames[item]:'Nessun power-up');}}
}
window.TTRHudVisuals=Object.freeze({render,icon});
})();
