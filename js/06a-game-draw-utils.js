/* Tiny Track Rivals — Fase 6.1: soli disegni puri di coltello e rampa.
 * Trasferimento verbatim dei corpi originali: nessun cambiamento a logica, fisica o grafica.
 * Caricare prima di js/06-game-legacy.js come script classico. */
(()=>{'use strict';
const parts=window.TTRGameParts||(window.TTRGameParts={});
function drawKnife(ctx,x,y){
  ctx.save();ctx.translate(x,y); // +X points from the outside handle toward the playable road
  ctx.shadowColor='#19203388';ctx.shadowBlur=6;ctx.shadowOffsetY=5;
  const steel=ctx.createLinearGradient(0,-12,0,12);
  steel.addColorStop(0,'#f4f8fc');steel.addColorStop(.35,'#a4bac9');steel.addColorStop(.63,'#eaf1f5');steel.addColorStop(1,'#637987');
  // 102-unit tempered-steel blade, exactly 2/5 of the 256-unit carriage width.
  ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(89,-10);ctx.lineTo(103,-3);ctx.lineTo(103,3);
  ctx.lineTo(87,10);ctx.lineTo(0,10);ctx.closePath();ctx.fillStyle=steel;ctx.fill();
  ctx.lineWidth=1.4;ctx.strokeStyle='#3d5160';ctx.stroke();
  ctx.shadowColor='transparent';ctx.strokeStyle='#faffffce';ctx.lineWidth=1.4;
  ctx.beginPath();ctx.moveTo(8,-7);ctx.lineTo(88,-7);ctx.stroke();
  ctx.beginPath();ctx.moveTo(17,6);ctx.lineTo(85,6);ctx.strokeStyle='#61788777';ctx.stroke();
  // Solid steel handle with two steel rivets, exclusively outside the road.
  const grip=ctx.createLinearGradient(0,-14,0,14);
  grip.addColorStop(0,'#e9f2f8');grip.addColorStop(.46,'#7b94a4');grip.addColorStop(.68,'#e0e9ee');grip.addColorStop(1,'#536d7e');
  ctx.beginPath();if(ctx.roundRect)ctx.roundRect(-65,-13,66,26,8);else ctx.rect(-65,-13,66,26);
  ctx.fillStyle=grip;ctx.fill();ctx.lineWidth=1.8;ctx.strokeStyle='#455d70';ctx.stroke();
  for(const px of [-46,-19]){ctx.beginPath();ctx.arc(px,-1,3,0,Math.PI*2);ctx.fillStyle='#f8fcff';ctx.fill();ctx.strokeStyle='#657f90';ctx.lineWidth=1;ctx.stroke();}
  ctx.restore();
}

function drawRamp(ctx,o){
 ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.a+Math.PI/2);
 // +Y is the approach. -Y is the higher leading lip. A genuine wedge-shaped
 // toast slice (not a metal trampoline or the original hard baked-on shadow).
 ctx.fillStyle='rgba(53,32,18,.17)';ctx.beginPath();ctx.ellipse(4,5,46,43,-.08,0,Math.PI*2);ctx.fill();
 // Toast thickness at the elevated far lip, with a curved bread crust.
 ctx.fillStyle='#81502e';ctx.beginPath();ctx.moveTo(-39,-35);
 ctx.quadraticCurveTo(-45,-46,-29,-48);ctx.quadraticCurveTo(-15,-57,1,-49);
 ctx.quadraticCurveTo(22,-56,34,-46);ctx.quadraticCurveTo(44,-43,39,-32);
 ctx.lineTo(34,-22);ctx.lineTo(-35,-23);ctx.closePath();ctx.fill();
 // Side faces build up gradually from 4px at the entry to 11px at the exit.
 const face=ctx.createLinearGradient(-45,0,43,0);
 face.addColorStop(0,'#ae6937');face.addColorStop(.53,'#da9252');face.addColorStop(1,'#8e582f');
 ctx.fillStyle=face;ctx.beginPath();ctx.moveTo(-41,35);ctx.lineTo(41,35);
 ctx.lineTo(39,-37);ctx.lineTo(34,-26);ctx.lineTo(32,41);
 ctx.lineTo(-33,41);ctx.lineTo(-36,-24);ctx.lineTo(-39,-36);ctx.closePath();ctx.fill();
 // Solid crust silhouette with a recognisable rounded toast crown.
 ctx.beginPath();ctx.moveTo(-38,37);ctx.quadraticCurveTo(-44,15,-40,-24);
 ctx.quadraticCurveTo(-45,-43,-29,-46);ctx.quadraticCurveTo(-13,-53,0,-46);
 ctx.quadraticCurveTo(18,-52,30,-45);ctx.quadraticCurveTo(45,-40,40,-24);
 ctx.quadraticCurveTo(44,8,38,37);ctx.quadraticCurveTo(0,45,-38,37);ctx.closePath();
 const crust=ctx.createLinearGradient(0,-48,0,42);
 crust.addColorStop(0,'#8c4f2d');crust.addColorStop(.24,'#a56535');crust.addColorStop(.98,'#b9793c');
 ctx.fillStyle=crust;ctx.fill();ctx.lineWidth=1.8;ctx.strokeStyle='#74452a';ctx.stroke();
 ctx.save();ctx.beginPath();ctx.moveTo(-31,30);ctx.quadraticCurveTo(-36,6,-32,-22);
 ctx.quadraticCurveTo(-36,-36,-24,-38);ctx.quadraticCurveTo(-10,-43,0,-38);
 ctx.quadraticCurveTo(13,-44,23,-37);ctx.quadraticCurveTo(37,-34,32,-21);
 ctx.quadraticCurveTo(35,7,30,30);ctx.quadraticCurveTo(0,35,-31,30);ctx.closePath();ctx.clip();
 const bread=ctx.createLinearGradient(0,34,0,-42);
 bread.addColorStop(0,'#f0bf79');bread.addColorStop(.48,'#f8d9a2');bread.addColorStop(1,'#e8a75e');
 ctx.fillStyle=bread;ctx.fillRect(-44,-46,88,95);
 // Subtle crosswise toast bands communicate the sloping approach.
 for(let j=0;j<4;j++){const y=25-j*18;
  ctx.strokeStyle=j%2?'#b77d4564':'#fff0c677';ctx.lineWidth=2.3;
  ctx.beginPath();ctx.moveTo(-25+j*.45,y);ctx.quadraticCurveTo(0,y-3,25-j*.55,y);ctx.stroke();}
 for(let i=0;i<22;i++){const x=Math.sin(i*37.91)*25,y=Math.cos(i*13.37)*30;
  ctx.fillStyle=i%3===0?'#ac704a60':'#cd975f76';ctx.beginPath();ctx.ellipse(x,y,1.2+i%3*.36,1.1+i%2*.55,0,0,Math.PI*2);ctx.fill();}
 ctx.restore();
 // The bread lip is raised; an understated front-edge highlight makes it legible.
 ctx.strokeStyle='#ffe9c5b8';ctx.lineWidth=2.1;ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(-23,-39);ctx.quadraticCurveTo(0,-45,23,-39);ctx.stroke();
 ctx.restore();
}
parts.drawKnife=drawKnife;
parts.drawRamp=drawRamp;
})();
