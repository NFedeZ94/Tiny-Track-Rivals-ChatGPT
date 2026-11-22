/* Tiny Track Rivals — Fase 6.5 / modulo 06e: effetti visivi degli ostacoli.
   Logica fisica, collisioni, percorsi e parametri di gioco restano nel legacy.
   Disegno copiato senza cambi agli algoritmi; clock e riferimenti ambientali sono passati esplicitamente.
*/
(()=>{'use strict';
function milkOrganicPath(ctx,rx,ry,shape){
 // Intentional uneven silhouette with rounded corners (no repeated circles or identical outlines).
 const left=[
  [.86,-.36],[1,.02],[.75,.32],[.37,.42],[.17,.84],[-.17,.63],
  [-.43,.48],[-.99,.38],[-1.04,-.05],[-.68,-.25],[-.81,-.60],[-.27,-.78],[.11,-.57],[.48,-.54]
 ];
 const right=[
  [1.02,-.25],[.90,.18],[.70,.38],[.43,.28],[.22,.74],[-.04,.56],
  [-.30,.43],[-.53,.69],[-.70,.25],[-1.02,.32],[-1.07,-.14],
  [-.82,-.28],[-.62,-.73],[-.35,-.46],[-.08,-.79],[.17,-.46],
  [.46,-.64],[.74,-.32]
 ];
 const verts=(shape==='left'?left:right).map(([x,y])=>({x:x*rx,y:y*ry}));
 const last=verts[verts.length-1],first=verts[0];
 ctx.beginPath();ctx.moveTo((last.x+first.x)/2,(last.y+first.y)/2);
 for(let i=0;i<verts.length;i++){
  const p=verts[i],q=verts[(i+1)%verts.length];
  ctx.quadraticCurveTo(p.x,p.y,(p.x+q.x)/2,(p.y+q.y)/2);
 }
 ctx.closePath();
}

function drawMilkCerealSpill(ctx,o){
 ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.angle||0);
 const rx=o.rx||o.r,ry=o.ry||o.r*.7,shape=o.spillShape||'left';
 ctx.translate(2,3);milkOrganicPath(ctx,rx,ry,shape);
 ctx.fillStyle='#5b463941';ctx.fill();ctx.translate(-2,-3);
 milkOrganicPath(ctx,rx,ry,shape);
 ctx.fillStyle='#fff3da';ctx.fill();ctx.strokeStyle='#e3cba8';ctx.lineWidth=1.8;ctx.stroke();
 // Translucent gloss is small and cannot hide the vehicle (decals draw beneath cars).
 ctx.save();ctx.translate(-rx*.09,-ry*.15);ctx.scale(.86,.65);
 milkOrganicPath(ctx,rx,ry,shape);ctx.fillStyle='#ffffff48';ctx.fill();ctx.restore();
 const pieces=shape==='left'?7:15;
 for(let i=0;i<pieces;i++){
  const a=i*2.3999632+(shape==='left'?.7:.25),
   q=.17+.53*((i*7%13)/12),x=Math.cos(a)*rx*q,y=Math.sin(a)*ry*q;
  ctx.save();ctx.translate(x,y);ctx.rotate(a*.35);
  ctx.fillStyle=i%3===0?'#ba853e':i%3===1?'#d9ab5b':'#edc986';
  ctx.beginPath();ctx.moveTo(-3.2,-2.6);ctx.quadraticCurveTo(2.1,-5,5.1,-1.1);
  ctx.quadraticCurveTo(6,3.5,0,4);ctx.quadraticCurveTo(-5,2.5,-3.2,-2.6);ctx.fill();ctx.restore();
 }
 ctx.restore();
}

function drawMilkOverflow(ctx,o){
 const x=o.x,y=o.y;
 ctx.save();ctx.translate(x,y);
 // Ground stream is BELOW puddle/cereal decals, and below the upright bowl.
 ctx.lineCap='round';ctx.lineJoin='round';
 ctx.fillStyle='#e1cbb071';ctx.beginPath();
 ctx.moveTo(-66,-8);ctx.bezierCurveTo(-90,6,-53,44,-77,64);
 ctx.bezierCurveTo(-85,76,-119,73,-113,94);
 ctx.bezierCurveTo(-105,106,-63,93,-52,78);
 ctx.bezierCurveTo(-40,56,-63,19,-51,-5);ctx.closePath();ctx.fill();
 ctx.fillStyle='#fff1d4';ctx.beginPath();
 ctx.moveTo(-64,-13);ctx.bezierCurveTo(-81,12,-54,42,-73,67);
 ctx.bezierCurveTo(-88,84,-108,76,-109,92);
 ctx.bezierCurveTo(-97,103,-69,86,-54,72);
 ctx.bezierCurveTo(-44,55,-65,18,-49,-11);ctx.closePath();ctx.fill();
 ctx.fillStyle='#fff2dd';ctx.beginPath();
 ctx.moveTo(56,-10);ctx.bezierCurveTo(81,6,65,47,91,66);
 ctx.bezierCurveTo(118,83,149,70,169,90);
 ctx.bezierCurveTo(196,108,206,91,226,107);
 ctx.bezierCurveTo(216,119,183,118,163,108);
 ctx.bezierCurveTo(129,97,113,111,91,95);
 ctx.bezierCurveTo(56,74,42,34,45,-7);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#fffdf0aa';ctx.lineWidth=3;ctx.beginPath();
 ctx.moveTo(64,34);ctx.bezierCurveTo(89,79,124,84,166,92);ctx.stroke();
 ctx.restore();
}

function drawMilkCerealCup(ctx,o,clock){
 const x=o.x,y=o.y;
 ctx.save();ctx.translate(x,y);
 // Soft contact shadow: the bowl rests on the cloth, with no tilt or floating.
 ctx.fillStyle='#49382d65';ctx.beginPath();ctx.ellipse(5,39,81,20,0,0,Math.PI*2);ctx.fill();
 // Squat, symmetrical ceramic bowl: flat base and broad, perfectly level lip.
 const body=ctx.createLinearGradient(0,-44,0,51);
 body.addColorStop(0,'#fbfbf5');body.addColorStop(.60,'#dfe5ef');body.addColorStop(1,'#a5b6c7');
 ctx.beginPath();ctx.moveTo(-78,-23);
 ctx.bezierCurveTo(-79,13,-62,42,-45,48);
 ctx.quadraticCurveTo(0,60,45,48);
 ctx.bezierCurveTo(62,42,79,13,78,-23);ctx.closePath();
 ctx.fillStyle=body;ctx.fill();ctx.strokeStyle='#8c9cb6';ctx.lineWidth=3;ctx.stroke();
 ctx.fillStyle='#f5f4ee';ctx.beginPath();ctx.ellipse(0,-27,82,34,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#6685ad';ctx.beginPath();ctx.ellipse(0,-27,74,27,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#fff5df';ctx.beginPath();ctx.ellipse(0,-27,68,22,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#fffdf28c';ctx.beginPath();ctx.ellipse(-15,-32,45,11,-.05,0,Math.PI*2);ctx.fill();
 // Flakes clearly visible INSIDE the milk; no fixed random numbers per frame.
 for(let i=0;i<21;i++){
  const a=i*2.3999632,rr=9+((i*11)%17)*2.6;
  const px=Math.cos(a)*rr,py=-27+Math.sin(a)*rr*.34;
  ctx.save();ctx.translate(px,py);ctx.rotate(a);
  ctx.beginPath();ctx.moveTo(-4,-2.5);ctx.quadraticCurveTo(2.4,-4.9,5,0);
  ctx.quadraticCurveTo(3.4,4.2,-1.6,3.4);ctx.quadraticCurveTo(-4.7,1.1,-4,-2.5);
  ctx.fillStyle=i%4===0?'#bd853e':i%3?'#d6a55c':'#e6c78b';ctx.fill();ctx.restore();
 }
 ctx.strokeStyle='#fffdf9';ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(0,-27,79,32,0,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle='#bfd0e0';ctx.lineWidth=2.2;ctx.beginPath();ctx.ellipse(0,-27,83,35,0,0,Math.PI*2);ctx.stroke();
 ctx.restore();
 // A few drifting flakes, on BOTH sides, over the matching milk streams.
 for(let i=0;i<7;i++){
  const side=i<2?-1:1,q=((clock*.30+i/7)%1);
  const px=x+side*(55+q*(side<0?39:144)),py=y+3+q*(side<0?85:104);
  ctx.fillStyle=i%3===0?'#fff4df':i%3===1?'#d9ad64':'#b98242';
  ctx.beginPath();ctx.ellipse(px,py,2.7+(i%2),2+(i%3)*.4,q*3,0,Math.PI*2);ctx.fill();
 }
}

function drawCoffeeAnimation(ctx,o,clock){
 const r=o.r||48,wave=Math.sin(clock*1.35+o.x*.002);
 ctx.save();ctx.translate(o.x,o.y);
 ctx.fillStyle='rgba(77,40,25,.27)';ctx.beginPath();ctx.ellipse(-r*.04,-r*.10,r*.36,r*.24,-.08,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle='rgba(247,214,166,.42)';ctx.lineWidth=1.4;ctx.beginPath();
 ctx.ellipse(-r*.07+wave*1.6,-r*.12,r*.20,r*.095,-.10,.25,2.70);ctx.stroke();
 // Four tall, diffuse vapour ribbons; visible against BOTH red gingham and
 // dark coffee without reading as hard white stripes or opaque smoke columns.
 for(let i=0;i<4;i++){
  const phase=(clock*.25+i*.27)%1;
  const dx=(i-1.5)*r*.235+Math.sin(clock*.7+i)*2.2;
  const rise=phase*r*.32;
  const alpha=.33+.39*Math.pow(Math.sin(Math.PI*(phase*.87+.08)),.8);
  const drawWisp=()=>{ctx.beginPath();ctx.moveTo(dx,-r*.50-rise*.12);
   ctx.bezierCurveTo(dx-9*Math.sin(clock*.72+i),-r*.83-rise*.34,
      dx+10*Math.cos(clock*.73+i),-r*1.12-rise*.68,
      dx+4*Math.sin(clock*.55+i),-r*1.57-rise);ctx.stroke();};
  ctx.globalAlpha=alpha;ctx.lineCap='round';ctx.shadowColor='rgba(235,237,223,.47)';ctx.shadowBlur=4.7;
  ctx.strokeStyle='rgba(246,247,231,.70)';ctx.lineWidth=4.1+i*.3;drawWisp();
  ctx.shadowBlur=0;ctx.strokeStyle='rgba(120,112,99,.44)';ctx.lineWidth=1.4;drawWisp();
 }
 ctx.restore();
}

function drawJamPour(ctx,jamPatch,jamSpillPath,clock){
  // v80: thick, lumpy jam slowly bulges from the overturned jar. No traveling
  // neon stripe or glassy moving patch; the puddle shape is unchanged.
  ctx.save();ctx.translate(jamPatch.x,jamPatch.y);ctx.rotate(jamPatch.angle);
  jamSpillPath(ctx);ctx.clip();
  const pulse=Math.sin(clock*.68)*2;
  // A continuous narrow tongue originates at the jar mouth (local +Y) and
  // merges into the wide puddle. Dark rim defines its physical thickness.
  ctx.beginPath();ctx.moveTo(-19,174);ctx.bezierCurveTo(-33,137,-15,105,-23,78);
  ctx.bezierCurveTo(-35,47,-20,18,-29,-3);ctx.bezierCurveTo(-35,-30,-17,-54,-15,-71);
  ctx.bezierCurveTo(-2,-61,-11,-18,4,10);ctx.bezierCurveTo(14,35,-3,65,8,91);
  ctx.bezierCurveTo(19,121,16,152,22,174);ctx.closePath();
  ctx.fillStyle='rgba(81,12,38,.27)';ctx.fill();
  // Slow soft bulges, slightly different sizes, so movement reads as viscous
  // fruit rather than water. Restrained two-tone shading, very little gloss.
  for(let i=0;i<13;i++){
    const y=146-i*18 + Math.sin(clock*.58+i*1.33)*2.8;
    const x=Math.sin(i*2.77)*22 + Math.cos(clock*.40+i)*1.8;
    const rx=7+(i*7%10),ry=4+(i*11%7);
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(i*4.7)*.25);
    ctx.fillStyle=i%3===0?'rgba(91,17,43,.45)':'rgba(187,43,78,.30)';
    ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(228,104,124,.23)';ctx.beginPath();ctx.ellipse(-rx*.22,-ry*.22,rx*.55,ry*.43,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  // Raised viscous edge along the pour, not a sharp reflective streak.
  ctx.lineWidth=4.8;ctx.lineCap='round';ctx.strokeStyle='rgba(79,13,38,.32)';
  ctx.beginPath();ctx.moveTo(-19+pulse*.2,156);
  ctx.bezierCurveTo(-29,115,-14,81,-26,39);
  ctx.bezierCurveTo(-30,14,-18,-34,-15,-61);ctx.stroke();
  ctx.restore();
 }

window.TTRObstacleVisuals=Object.freeze({
 drawMilkCerealSpill,
 drawMilkOverflow,
 drawMilkCerealCup,
 drawCoffeeAnimation,
 drawJamPour
});
})();
