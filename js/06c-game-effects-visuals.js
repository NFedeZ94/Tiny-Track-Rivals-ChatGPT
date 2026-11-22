/* Tiny Track Rivals — fase 6.3. Effetti grafici estratti dal legacy senza cambiare gli algoritmi. */
(()=>{'use strict';
function drawClawCable(ctx,user,target,clock){
 const angle=Math.atan2(target.y-user.y,target.x-user.x),fx=Math.cos(angle),fy=Math.sin(angle);
 const sx=user.x+fx*24,sy=user.y+fy*24,tx=target.x-fx*15,ty=target.y-fy*15;
 ctx.save();ctx.lineCap='round';
 ctx.strokeStyle='#142331';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(tx,ty);ctx.stroke();
 ctx.strokeStyle='#d1e3ec';ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.lineDashOffset=-clock*37;
 ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(tx,ty);ctx.stroke();ctx.setLineDash([]);
 // A gripping metal claw, with two opposing curved pincers around the rival's bumper.
 ctx.translate(tx,ty);ctx.rotate(angle);ctx.shadowColor='#061222';ctx.shadowBlur=5;
 ctx.fillStyle='#e9eff4';ctx.strokeStyle='#243648';ctx.lineWidth=2.8;
 ctx.beginPath();ctx.moveTo(-13,-7);ctx.lineTo(0,-14);ctx.lineTo(11,-14);ctx.lineTo(16,-7);ctx.lineTo(5,-4);ctx.lineTo(-2,-7);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.beginPath();ctx.moveTo(-13,7);ctx.lineTo(0,14);ctx.lineTo(11,14);ctx.lineTo(16,7);ctx.lineTo(5,4);ctx.lineTo(-2,7);ctx.closePath();ctx.fill();ctx.stroke();
 ctx.fillStyle='#f6bd4b';ctx.strokeStyle='#1b2737';ctx.beginPath();ctx.roundRect(-16,-6,18,12,3);ctx.fill();ctx.stroke();
 ctx.fillStyle='#a4bbc7';ctx.beginPath();ctx.arc(-8,0,3,0,Math.PI*2);ctx.fill();
 ctx.restore();
}
function renderOil(ctx,o,clock){
 ctx.save();ctx.translate(o.x,o.y);ctx.rotate(.14);const b=Math.sin(clock*4+(o.phase||0));
 ctx.fillStyle='#18142373';ctx.beginPath();ctx.ellipse(3,7,39,24,0,0,Math.PI*2);ctx.fill();
 ctx.beginPath();ctx.moveTo(-36,-5);ctx.bezierCurveTo(-40,-20,-16,-27,1,-19);ctx.bezierCurveTo(22,-31,41,-12,37,2);
 ctx.bezierCurveTo(51,18,10,26,-6,22);ctx.bezierCurveTo(-34,28,-43,12,-36,-5);ctx.closePath();
 ctx.fillStyle='#14192bed';ctx.strokeStyle='#151524';ctx.lineWidth=5;ctx.lineJoin='round';ctx.fill();ctx.stroke();
 ctx.strokeStyle='#85a9c5a8';ctx.lineWidth=2.6;ctx.beginPath();ctx.ellipse(-4,-3,22+b,10,0,3.3,5.95);ctx.stroke();
 ctx.fillStyle='#e8e9f1bb';for(const [x,y,r] of [[-16,-8,3],[9,8,2.4],[22,-7,1.6]]){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
function renderEffect(ctx,e,clamp){ctx.save();const life=clamp(e.t/e.ttl,0,1);
 if(e.kind==='impactBurst'){
   const p=1-life,energy=e.intensity||.4;
   ctx.translate(e.x,e.y);ctx.globalAlpha=.68*life;
   ctx.strokeStyle=energy>.68?'#ffe29b':'#c8d8dc';ctx.lineWidth=1.4+energy;
   for(let i=0;i<6;i++){
     const angle=i*Math.PI/3+p*.7,length=(5+energy*14)*(1+p*.8);
     ctx.beginPath();ctx.moveTo(Math.cos(angle)*5,Math.sin(angle)*5);
     ctx.lineTo(Math.cos(angle)*length,Math.sin(angle)*length);ctx.stroke();
   }
   ctx.restore();return;
 }
 if(e.kind==='fallCloud'){
   const p=1-life;
   for(let i=0;i<12;i++){
     const a=(i/12)*Math.PI*2+e.x*.031;
     const radius=23+i%3*9+p*39;
     const px=e.x+Math.cos(a)*radius,py=e.y+Math.sin(a)*radius*.75;
     ctx.globalAlpha=.84*Math.pow(life,.55);
     ctx.fillStyle=i%4===0?'#d5bdaa':i%3===0?'#f0f0ed':'#cdd3d8';
     ctx.beginPath();ctx.arc(px,py,14+(i%4)*4+Math.sin(p*Math.PI)*16,0,Math.PI*2);ctx.fill();
   }
   ctx.globalAlpha=.62*life;ctx.fillStyle='#eff2f1';ctx.beginPath();ctx.ellipse(e.x,e.y,38+p*38,27+p*25,0,0,Math.PI*2);ctx.fill();
   ctx.restore();return;
 }
 if(e.kind==='poof'){const p=1-life;ctx.globalAlpha=.48*life;for(let i=0;i<6;i++){const ang=i*(Math.PI/3)+p*1.6;ctx.fillStyle=i<3?'rgba(240,242,245,.8)':'rgba(201,176,144,.45)';ctx.beginPath();ctx.arc(e.x+Math.cos(ang)*(12+p*26),e.y+Math.sin(ang*.8)*(10+p*18),8+i+p*7,0,Math.PI*2);ctx.fill();}ctx.restore();return;}ctx.globalAlpha=life;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 19px system-ui';ctx.strokeStyle='#0a1325';ctx.lineWidth=4;ctx.strokeText(e.text,e.x,e.y-30*(1-life));ctx.fillStyle=e.color;ctx.fillText(e.text,e.x,e.y-30*(1-life));ctx.restore();}
window.TTRGameEffectsVisuals=Object.freeze({drawClawCable,renderOil,renderEffect});
})();
