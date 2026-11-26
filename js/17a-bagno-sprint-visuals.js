/* Bagno Sprint R4 — independently drawn 2.5D bathroom props. */
(()=>{'use strict';const T=window.TTRBathTrack;
 const tau=Math.PI*2;
 function rr(c,x,y,w,h,r,fill,stroke,lw=3){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
 function ell(c,x,y,rx,ry,fill,stroke,lw=3){c.beginPath();c.ellipse(x,y,rx,ry,0,0,tau);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
 function grad(c,x,y,x2,y2,stops){const g=c.createLinearGradient(x,y,x2,y2);for(const [p,s] of stops)g.addColorStop(p,s);return g;}
 function rad(c,x,y,r,stops){const g=c.createRadialGradient(x-r*.24,y-r*.27,0,x,y,r);for(const [p,s] of stops)g.addColorStop(p,s);return g;}
 function path(c,pts,close=false){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));if(close)c.closePath();}
 function line(c,pts,w,color,close=false){c.lineWidth=w;c.strokeStyle=color;c.lineCap='round';c.lineJoin='round';path(c,pts,close);c.stroke();}
 function at(c,o,f){c.save();c.translate(o.x,o.y);c.rotate(o.a||0);f();c.restore();}
 let seed=123;function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 function counter(c){const {w,h}=T.world;c.fillStyle=grad(c,0,0,w,h,[[0,'#eee8dd'],[.5,'#d5cabe'],[1,'#b4a99d']]);c.fillRect(0,0,w,h);seed=31;
  for(let i=0;i<22000;i++){c.fillStyle=i%3?'#8d7d691c':'#ffffff45';c.fillRect(rnd()*w,rnd()*h,2+rnd()*5,1+rnd()*3);}
  // mirror on the rear wall and countertop front lip
  rr(c,90,40,w-180,205,25,'#585e61');rr(c,108,54,w-216,171,15,grad(c,0,54,0,225,[[0,'#93b1bb'],[.45,'#e4f4f5'],[1,'#8ca6ae']]),'#fff',4);
  c.save();c.beginPath();c.roundRect(108,54,w-216,171,15);c.clip();for(let i=0;i<7;i++){c.fillStyle='#f7ffff45';c.beginPath();c.moveTo(i*550,54);c.lineTo(i*550+110,54);c.lineTo(i*550-20,225);c.lineTo(i*550-130,225);c.fill();}c.restore();
  rr(c,54,h-128,w-108,95,22,'#8c8175');rr(c,54,h-142,w-108,37,15,'#efe6d7');
 }
 function basin(c){const {x,y,rx,ry}=T.pool;ell(c,x+25,y+42,1190,818,'#635d5360');ell(c,x,y,1180,812,grad(c,x-900,y-700,x+900,y+700,[[0,'#fff'],[.52,'#e8e8e2'],[1,'#a4b1b5']]),'#a5abad',7);
  // recessed bowl: white rim, shaded slopes, then the standing water
  ell(c,x,y,1075,712,'#fcfcf6','#fff',6);ell(c,x,y+12,1000,646,rad(c,x,y+12,1090,[[0,'#c1cdd0'],[.63,'#dbe3e2'],[.86,'#9dabb1'],[1,'#718b95']]),'#aab5b8',5);
  ell(c,x,y+25,865,550,grad(c,x,y-530,x,y+560,[[0,'#a3b7be'],[.32,'#d0dfdf'],[1,'#eef4ee']]),'#c2d1d1',4);
  const water=grad(c,x,y-ry,x,y+ry,[[0,'#3188ad'],[.42,'#72c9da'],[1,'#b1e4e5']]);ell(c,x,y,rx,ry,water,'#e4f9f7',7);
  c.save();c.beginPath();c.ellipse(x,y,rx-4,ry-4,0,0,tau);c.clip();seed=173;for(let i=0;i<45;i++){const xx=x+(rnd()-.5)*2*rx,yy=y+(rnd()-.5)*2*ry;c.strokeStyle=i%3?'#dcffff60':'#2a779b35';c.lineWidth=3+rnd()*4;c.beginPath();c.ellipse(xx,yy,25+rnd()*95,6+rnd()*11,0,0,tau);c.stroke();}c.restore();
  const d=T.drain;ell(c,d.x,d.y,83,83,'#408b9a8c');ell(c,d.x,d.y,67,67,grad(c,d.x-70,d.y-70,d.x+70,d.y+70,[[0,'#e7fbfb'],[.48,'#668c99'],[1,'#d2ebee']]),'#afdae2',4);for(let i=0;i<7;i++){const a=i*tau/7;ell(c,d.x+37*Math.cos(a),d.y+37*Math.sin(a),9,9,'#214953');}ell(c,d.x,d.y,11,11,'#214953');
 }
 function faucet(c){const x=1840,y=625;ell(c,x+17,y+35,120,66,'#344e5960');ell(c,x,y,106,62,'#70858b','#f2ffff',7);const chrome=grad(c,x-70,y,x+70,y,[[0,'#50646d'],[.23,'#d2e7e9'],[.43,'#fff'],[.68,'#839fa7'],[1,'#405761']]);rr(c,x-70,y-130,140,165,52,chrome,'#66838b',4);rr(c,x-55,y-115,110,300,40,chrome,'#607b85',4);ell(c,x,y+170,54,32,'#526f7c','#c5e0e5',4);
  // tap lever stands proud of the chrome body
  rr(c,x+49,y-91,128,29,12,chrome,'#647e87',3);ell(c,x+156,y-77,24,21,'#b4ced4');
  // Tap closed; standing water stays in the actual low basin.

 }
 function road(c){const pts=T.points,br=T.brush;
  // Draw only the supported ceramic lanes. The toothbrush replaces, rather than covers, the missing road.
  const n=pts.length,i0=Math.ceil(br.start*n),i1=Math.floor(br.end*n),base=pts.slice(i1).concat(pts.slice(0,i0+1));
  line(c,base,2*T.laneHalf+18,'#4a6c7040');line(c,base,2*T.laneHalf+7,'#6b8185');line(c,base,2*T.laneHalf-3,'#f9f9f1');line(c,base,2*T.laneHalf-22,'#d5d4c7');line(c,base,2*T.laneHalf-36,'#e7e2d5');c.setLineDash([20,30]);line(c,base,3,'#fffaf1ac');c.setLineDash([]);
  // The descent and ascent are integrated ceramic ramps, shaded with the same width as the road.
  for(const [p0,p1,reverse] of [[T.entry-.028,T.entry+.012,false],[T.exit+.01,T.exit+.049,true]]){const a=T.point(p0),b=T.point(p1),seg=Array.from({length:36},(_,i)=>T.point(p0+(p1-p0)*i/35));const g=grad(c,a.x,a.y,b.x,b.y,reverse?[[0,'#aabbbf'],[1,'#eee8dc']]:[[0,'#eee8dc'],[1,'#aabbbf']]);line(c,seg,2*T.laneHalf-38,g);for(let i=5;i<34;i+=6){const p=p0+(p1-p0)*i/35,q=T.point(p),a=T.tangent(p);at(c,{...q,a},()=>{rr(c,-3,-T.laneHalf+24,6,2*T.laneHalf-48,3,'#617f8730');});}}
  // The optional route has a narrower, glossier ceramic surface. No painted arrows.
  line(c,T.shortcutSamples,2*T.bridgeHalf+10,'#dce7e49c');line(c,T.shortcutSamples,2*T.bridgeHalf,'#c7d9d9');line(c,T.shortcutSamples,2*T.bridgeHalf-26,'#d5e3e0');
  c.save();c.globalAlpha=.42;for(let i=1;i<12;i++){let q=T.shortcutPoint(i/12),a=T.shortcutTangent(i/12);at(c,{...q,a},()=>{ell(c,0,-24,22,7,'#f3ffff');ell(c,14,24,13,4,'#f3ffff');});}c.restore();
  for(let i=0,n=Math.round(T.length/45);i<n;i++){const p=i/n;if(T.onBrushPhase(p))continue;const q=T.point(p),a=T.tangent(p);for(const side of [-1,1]){const o={x:q.x-Math.sin(a)*side*(T.laneHalf-8),y:q.y+Math.cos(a)*side*(T.laneHalf-8),a};if(T.shortcutNearest(o).distance<T.bridgeHalf+24&&(Math.abs(p-T.entry)<.05||Math.abs(p-T.exit)<.05))continue;at(c,o,()=>rr(c,-21,-7,42,14,3,i%2?'#f9faf4':'#358aa9'));}}
  at(c,{...T.point(0),a:T.tangent(0)},()=>{for(let i=0;i<12;i++)for(let j=0;j<2;j++){c.fillStyle=(i+j)%2?'#20313c':'#fff';c.fillRect(-20+j*20,-120+i*20,20,20);}});
 }
 function puddle(c,z){at(c,z,()=>{ell(c,0,0,z.rx,z.ry,'#69c4e5bb','#bff1fa',4);ell(c,-10,-8,z.rx*.72,z.ry*.6,'#d8f6fa70');});}
 function bottle(c,o){const {x,y,r,h,color}=o;ell(c,x+22,y+15,r*1.25,r*.75,'#35464b55');ell(c,x,y,r,r*.68,'#45626a');rr(c,x-r,y-h,r*2,h+12,r*.44,grad(c,x-r,y,x+r,y,[[0,'#56747d'],[.16,color],[.42,'#f5ffffb9'],[.64,color],[1,'#41626b']]),'#54747a',4);ell(c,x,y-h,r*.87,r*.45,color,'#d9f1ee',3);rr(c,x-r*.47,y-h-37,r*.94,49,11,grad(c,x-r,y,x+r,y,[[0,'#778b90'],[.5,'#fff'],[1,'#859ba0']]),'#617b82',3);ell(c,x,y-h-37,r*.45,12,'#e8f0ed');rr(c,x-r*.71,y-h*.55,r*1.42,h*.31,7,'#f5f3e7');c.fillStyle='#52707b';c.font=`bold ${Math.round(r*.33)}px sans-serif`;c.textAlign='center';c.fillText('FRESH',x,y-h*.36);}
 function soap(c,o){ell(c,o.x+6,o.y+9,o.r,o.r*.75,'#78605660');rr(c,o.x-o.r,o.y-o.r*.63,o.r*2,o.r*1.48,18,'#c07d8b','#9b6675');rr(c,o.x-o.r,o.y-o.r*.85,o.r*2,o.r*1.45,19,grad(c,o.x,o.y-o.r,o.x,o.y+o.r,[[0,'#ffe1e3'],[1,'#dc8eaa']]),'#fbe2de',3);ell(c,o.x,o.y-7,20,9,null,'#ae7585',2);}
 function sponge(c,o){at(c,o,()=>{ell(c,7,16,o.rx,o.ry,'#61533350');rr(c,-o.rx,-o.ry+16,o.rx*2,o.ry*2,31,'#b98d2e','#9f7625',4);rr(c,-o.rx,-o.ry,o.rx*2,o.ry*2,31,grad(c,0,-o.ry,0,o.ry,[[0,'#fff0a0'],[.56,'#efcb57'],[1,'#d4a63a']]),'#f3d77a',4);c.save();c.beginPath();c.roundRect(-o.rx+5,-o.ry+5,o.rx*2-10,o.ry*2-10,27);c.clip();seed=765;for(let i=0;i<480;i++){const x=(rnd()-.5)*o.rx*2,y=(rnd()-.5)*o.ry*2,r=2+rnd()*6;ell(c,x,y,r,r*.62,i%4?'#9b742e62':'#fff6b6aa');ell(c,x-1,y-1,r*.65,r*.35,'#6f54252a');}c.restore();});}
 function towel(c,o){at(c,o,()=>{const X=o.rx,Y=o.ry;rr(c,-X+6,-Y+15,2*X,2*Y,24,'#334a6450');rr(c,-X,-Y+9,2*X,2*Y,20,'#285781');rr(c,-X,-Y,2*X,2*Y,20,grad(c,-X,0,X,0,[[0,'#9cc5d9'],[.4,'#78aec7'],[.72,'#4c83aa'],[1,'#285a86']]),'#a6d2e0',3);
  // Folded fabric rises toward the same lip used by the jump trigger.
  for(let i=0;i<3;i++){let x=X*.28+i*X*.17;rr(c,x,-Y+6, X*.42-i*X*.07,2*Y-12,18,grad(c,x,0,x+X*.42,0,[[0,'#b3d9e4'],[.35,'#659fbd'],[1,'#386b96']]),'#86b3ca',2);}
  c.save();c.beginPath();c.roundRect(-X+4,-Y+4,2*X-8,2*Y-8,16);c.clip();seed=532;for(let i=0;i<850;i++){const x=(rnd()-.5)*2*X,y=(rnd()-.5)*2*Y;ell(c,x,y,2.3,1.5,i%2?'#d1ecf470':'#315e8a55');}c.restore();
  for(const y of [-Y+11,Y-11]){c.setLineDash([4,6]);line(c,[{x:-X+17,y},{x:X-16,y}],2,'#c5dce9');c.setLineDash([]);}for(let y=-Y+12;y<Y-8;y+=9)line(c,[{x:-X+2,y},{x:-X-8,y:y+2}],3,'#7faac7');});}
 function cotton(c,o){at(c,o,()=>{ell(c,5,12,o.rx,o.ry,'#6c70735c');seed=724;for(let i=0;i<30;i++){let a=rnd()*tau,r=Math.sqrt(rnd()),x=Math.cos(a)*r*(o.rx-13),y=Math.sin(a)*r*(o.ry-13),v=12+rnd()*14;ell(c,x,y,v,v*.89,rad(c,x,y,v,[[0,'#fffef8'],[.68,'#f6f2e8'],[1,'#c8ccca']]));}});}
 function bridge(c){const {P,Q,length:L}=T.brush,a=Math.atan2(Q.y-P.y,Q.x-P.x);
  at(c,{...P,a},()=>{
   // Only the two ends are solid ceramic; the dark recessed slot separates them.
   rr(c,L*.06,-T.laneHalf+5,L*.88,2*T.laneHalf-10,24,grad(c,0,-T.laneHalf,0,T.laneHalf,[[0,'#667b81'],[.5,'#344d56'],[1,'#8ba1a8']]),'#9aadb0',3);
   for(const x of [-36,L*.94])rr(c,x,-T.laneHalf, L*.06+36,2*T.laneHalf,19,grad(c,0,-T.laneHalf,0,T.laneHalf,[[0,'#fcfcf5'],[.5,'#dadcd3'],[1,'#9dafb2']]),'#b1c1c2',3);
   // Use the physical width profile for the actual visible contour. Smoothly rounded tail and shoulders.
   function silhouette(){const p=[];for(let i=0;i<=84;i++){const u=.075+.905*i/84;p.push({x:u*L,y:-Math.min(85,T.brushHalfAt(u))});}for(let i=84;i>=0;i--){const u=.075+.905*i/84;p.push({x:u*L,y:Math.min(85,T.brushHalfAt(u))});}path(c,p,true);}
   c.save();c.translate(9,17);silhouette();c.fillStyle='#1a334a91';c.fill();c.restore();
   c.save();c.translate(0,8);silhouette();c.fillStyle='#155273';c.fill();c.restore();
   silhouette();c.fillStyle=grad(c,0,-85,0,85,[[0,'#d9f7f8'],[.2,'#66c6d9'],[.55,'#239ac2'],[.86,'#166e9b'],[1,'#0f5078']]);c.fill();c.strokeStyle='#bcf0f3';c.lineWidth=3;c.stroke();
   // Grip follows the widening handle, then tapers naturally into a white neck.
   c.save();silhouette();c.clip();
   ell(c,L*.17,0,L*.082,57,grad(c,0,-57,0,57,[[0,'#f6ffff'],[1,'#b5e2e8']]),'#d7fbff',3);
   rr(c,L*.23,-54,L*.28,108,36,grad(c,0,-54,0,54,[[0,'#277f9d'],[.5,'#1f678b'],[1,'#164d70']]),'#80cbd6',3);
   for(let i=0;i<7;i++){const u=.25+i*.035;rr(c,L*u,-37,9,74,4,'#b7e6ed86');}
   const neck=[{x:L*.49,y:-56},{x:L*.61,y:-40},{x:L*.68,y:-34},{x:L*.74,y:-34},{x:L*.80,y:-60},{x:L*.80,y:60},{x:L*.74,y:34},{x:L*.68,y:34},{x:L*.61,y:40},{x:L*.49,y:56}];path(c,neck,true);c.fillStyle=grad(c,0,-56,0,56,[[0,'#fff'],[.5,'#ecf6f4'],[1,'#b1ced2']]);c.fill();
   rr(c,L*.775,-65,L*.176,130,32,grad(c,0,-65,0,65,[[0,'#fffef9'],[1,'#cbe2e0']]),'#a5c6cc',3);
   for(let row=0;row<5;row++)for(let col=0;col<5;col++){const x=L*(.79+col*.031),y=-49+row*24+(col%2?2:0);ell(c,x+2,y+5,8.8,10.3,'#799ba5');ell(c,x,y,8.8,10.3,row===0||row===4?'#7bd0d9':'#f7fffa','#b8d8db',1);for(let k=0;k<3;k++)line(c,[{x:x-4+k*4,y:y-6},{x:x-3+k*4,y:y+5}],1,'#eaffff');}
   c.restore();
  });
 }
 function render(c,b){const {w,h}=T.world;c.clearRect(0,0,w,h);b.clearRect(0,0,w,h);counter(c);basin(c);road(c);faucet(c);T.puddles.forEach(o=>puddle(c,o));T.soaps.forEach(o=>soap(c,o));T.bottles.forEach(o=>bottle(c,o));T.cotton.forEach(o=>cotton(c,o));sponge(c,T.sponge);towel(c,T.towel);bridge(c);}
 window.TTRBathVisuals=Object.freeze({render,ready:Promise.resolve(true)});
})();
