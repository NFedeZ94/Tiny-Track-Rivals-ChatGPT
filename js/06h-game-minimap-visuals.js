/* Tiny Track Rivals — Fase 6h: grafica delle minimappe.
 * Estratto dal legacy senza modificare gli algoritmi di disegno.
 */
(()=>{'use strict';
function drawActualMinimap(canvas,points,trackPoint){
 if(!canvas||!Array.isArray(points)||!points.length)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);
 ctx.fillStyle='#091a39';ctx.fillRect(0,0,W,H);
 const x0=Math.min(...points.map(p=>p.x)),x1=Math.max(...points.map(p=>p.x));
 const y0=Math.min(...points.map(p=>p.y)),y1=Math.max(...points.map(p=>p.y));
 const k=Math.min((W-30)/Math.max(1,x1-x0),(H-24)/Math.max(1,y1-y0));
 ctx.save();ctx.translate(W/2,H/2);ctx.scale(k,k);ctx.translate(-(x0+x1)/2,-(y0+y1)/2);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
 ctx.strokeStyle='#274f86';ctx.lineWidth=85;ctx.stroke();ctx.strokeStyle='#f2d78e';ctx.lineWidth=23;ctx.stroke();
 const start=trackPoint(0);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(start.x,start.y,38,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#132f53';ctx.beginPath();ctx.arc(start.x,start.y,19,0,Math.PI*2);ctx.fill();ctx.restore();
}

function createRaceMiniBase(points,shortcutSamples,WORLD_W,WORLD_H){
const miniBase=document.createElement('canvas');miniBase.width=280;miniBase.height=180;
const miniBg=miniBase.getContext('2d');miniBg.save();miniBg.translate(140,90);miniBg.scale(245/WORLD_W,153/WORLD_H);miniBg.translate(-WORLD_W/2,-WORLD_H/2);
miniBg.beginPath();points.forEach((p,i)=>i?miniBg.lineTo(p.x,p.y):miniBg.moveTo(p.x,p.y));miniBg.closePath();
miniBg.strokeStyle='#dce8e9';miniBg.lineWidth=52;miniBg.stroke();miniBg.strokeStyle='#5d778c';miniBg.lineWidth=37;miniBg.stroke();
miniBg.save();miniBg.beginPath();shortcutSamples.forEach((q,i)=>i?miniBg.lineTo(q.x,q.y):miniBg.moveTo(q.x,q.y));
miniBg.lineCap='round';miniBg.lineJoin='round';miniBg.strokeStyle='#083d55';miniBg.lineWidth=33;miniBg.stroke();
miniBg.strokeStyle='#46f5e2';miniBg.lineWidth=20;miniBg.stroke();miniBg.restore();miniBg.restore();
return miniBase;
}
function renderRaceMini(mg,miniBase,race,WORLD_W,WORLD_H){if(!race)return;mg.clearRect(0,0,280,180);mg.drawImage(miniBase,0,0);mg.save();mg.translate(140,90);mg.scale(245/WORLD_W,153/WORLD_H);mg.translate(-WORLD_W/2,-WORLD_H/2);
for(const c of race.cars){mg.fillStyle=c===race.player?'#ffdc76':'#ff766f';mg.beginPath();mg.arc(c.x,c.y,c===race.player?20:14,0,Math.PI*2);mg.fill();}mg.restore();}

window.TTRMinimapVisuals=Object.freeze({drawActualMinimap,createRaceMiniBase,renderRaceMini});
})();
