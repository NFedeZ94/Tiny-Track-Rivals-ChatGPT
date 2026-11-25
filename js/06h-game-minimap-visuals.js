/* Tiny Track Rivals — Fase 6h: grafica delle minimappe.
 * Estratto dal legacy senza modificare gli algoritmi di disegno.
 */
(()=>{'use strict';
function drawTrackPreview(canvas,{points,point,tangent,world,theme='plain',shortcuts=[],pickups=[],pockets=[]}){
 if(!canvas||!points?.length)return;
 const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height;
 const x0=Math.min(...points.map(p=>p.x)),x1=Math.max(...points.map(p=>p.x)),y0=Math.min(...points.map(p=>p.y)),y1=Math.max(...points.map(p=>p.y));
 const pad=theme==='plain'?24:16;
 const k=Math.min((W-pad*2)/(x1-x0),(H-pad*2)/(y1-y0));
 const cx=(x0+x1)/2,cy=(y0+y1)/2;
 ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(W/2,H/2);ctx.scale(k,k);ctx.translate(-cx,-cy);
 const left=cx-W/(2*k),top=cy-H/(2*k),right=cx+W/(2*k),bottom=cy+H/(2*k);
 if(theme==='breakfast')window.TTRCircuitVisuals.paintClothPattern(ctx,left,top,right,bottom);
 else {let bg='#111d40';if(theme==='billiard'){bg=ctx.createLinearGradient(250,145,2300,1450);bg.addColorStop(0,'#226d50');bg.addColorStop(.5,'#175b45');bg.addColorStop(1,'#124839');}ctx.fillStyle=bg;ctx.fillRect(left,top,right-left,bottom-top);}
 ctx.lineCap='round';ctx.lineJoin='round';
 function path(list,close=false){ctx.beginPath();list.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));if(close)ctx.closePath();}
 path(points,true);ctx.strokeStyle=theme==='breakfast'?'#50382f':theme==='billiard'?'#11382d':'#274f86';ctx.lineWidth=8/k;ctx.stroke();
 ctx.strokeStyle=theme==='breakfast'?'#fff5dd':theme==='billiard'?'#dcefc7':'#f2d78e';ctx.lineWidth=3/k;ctx.stroke();
 if(theme==='plain'){
  for(const line of shortcuts){path(line);ctx.strokeStyle='#073f61';ctx.lineWidth=6/k;ctx.stroke();ctx.strokeStyle='#46f5e2';ctx.lineWidth=3/k;ctx.stroke();}
  for(const q of pickups){const r=3.5/k;path([{x:q.x,y:q.y-r},{x:q.x+r,y:q.y},{x:q.x,y:q.y+r},{x:q.x-r,y:q.y}],true);ctx.fillStyle='#26d8f1';ctx.fill();}
  for(const p of pockets){ctx.beginPath();ctx.arc(p.x,p.y,5/k,0,Math.PI*2);ctx.fillStyle=p.role==='entry'?'#ffd45b':'#46f5e2';ctx.fill();ctx.fillStyle='#111d40';ctx.font=`bold ${7/k}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.id,p.x,p.y);}
 }
 const f=point(0),a=tangent(0);ctx.save();ctx.translate(f.x,f.y);ctx.rotate(a);
 const cell=2.6/k;for(let row=0;row<2;row++)for(let col=0;col<6;col++){ctx.fillStyle=(row+col)%2?'#122239':'#fff';ctx.fillRect((row-1)*cell,(col-3)*cell,cell,cell);}
 ctx.restore();ctx.restore();
}
function drawActualMinimap(canvas,points,trackPoint){
 drawTrackPreview(canvas,{points,point:trackPoint,tangent:p=>{const a=trackPoint(p-.001),b=trackPoint(p+.001);return Math.atan2(b.y-a.y,b.x-a.x);}});
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

window.TTRMinimapVisuals=Object.freeze({drawTrackPreview,drawActualMinimap,createRaceMiniBase,renderRaceMini});
})();
