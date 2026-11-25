/* Bagno Sprint — overhead 2.5D sink concept. Static layers are baked at world initialization. */
(()=>{'use strict';const T=window.TTRBathTrack;
 function path(c,pts,closed=false){c.beginPath();pts.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));if(closed)c.closePath();}
 function rr(c,x,y,w,h,r,fill,stroke,lw=3){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
 function ell(c,x,y,rx,ry,fill,stroke,lw=3){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
 function linear(c,x,y,x1,y1,colors){const g=c.createLinearGradient(x,y,x1,y1);colors.forEach(([p,v])=>g.addColorStop(p,v));return g;}
 function radial(c,x,y,rx,colors){const g=c.createRadialGradient(x,y,0,x,y,rx);colors.forEach(([p,v])=>g.addColorStop(p,v));return g;}
 function at(c,o,fn){c.save();c.translate(o.x,o.y);c.rotate(o.a||0);fn(c);c.restore();}
 function line(c,pts,width,color,close=false){path(c,pts,close);c.lineWidth=width;c.strokeStyle=color;c.stroke();}
 function counter(c){const {w,h}=T.world;c.fillStyle=linear(c,0,0,w,h,[[0,'#d9ccc0'],[.5,'#bfb1a0'],[1,'#d6c8b5']]);c.fillRect(0,0,w,h);let seed=532;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223|0)>>>0)/4294967296;
 for(let i=0;i<42000;i++){const x=rnd()*w,y=rnd()*h,r=1+rnd()*4;c.fillStyle=i%3?'#79675816':'#fff8ec38';c.fillRect(x,y,r*2,r);}
 for(let i=0;i<52;i++){const x=rnd()*w,y=rnd()*h;c.strokeStyle=i%3?'#83776a25':'#fff7e94d';c.lineWidth=3+rnd()*9;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+70,y-120,x+240,y+160,x+340,y-50);c.stroke();}
 // Mirror and steel perimeter, entirely behind the race route.
 rr(c,75,25,w-150,192,28,'#474949','#9b8d7c',6);rr(c,92,39,w-184,159,18,linear(c,0,39,0,198,[[0,'#53717c'],[.42,'#b7d5dc'],[1,'#7898a4']]),'#e8f2f0',4);c.save();c.beginPath();c.roundRect(92,39,w-184,159,18);c.clip();for(let i=0;i<6;i++){c.fillStyle='#e2faff25';c.beginPath();c.moveTo(i*720,40);c.lineTo(i*720+130,40);c.lineTo(i*720+10,198);c.lineTo(i*720-120,198);c.fill();}c.restore();
 rr(c,35,730,102,1030,15,'#7d8585','#71675e',5);rr(c,46,745,80,1000,9,linear(c,46,745,126,1745,[[0,'#d7ecec'],[.38,'#84abb8'],[.66,'#c9e0e4'],[1,'#7396a3']]),'#f4fafa',4);
 rr(c,62,h-132,w-124,86,18,'#9d8a78','#7d6c5d',5);rr(c,62,h-144,w-124,41,14,'#e5d7c6');}
 function basin(c){const x=1810,y=1370;ell(c,x+25,y+38,1100,850,'#5b504b55');ell(c,x,y,1100,850,linear(c,x-800,y-800,x+600,y+850,[[0,'#ffffff'],[.42,'#eae5df'],[1,'#b2b2b0']]),'#817c75',8);ell(c,x,y,1040,790,'#f9f8f4','#fff',7);
 ell(c,x,y+10,985,745,radial(c,x-100,y-140,1050,[[0,'#c8cfce'],[.50,'#dbe0df'],[.78,'#e5e7e4'],[.93,'#b3c1c2'],[1,'#8e9e9e']]),'#a3adac',6);ell(c,x,y+115,770,540,radial(c,x-160,y+40,850,[[0,'#d3dcda'],[.7,'#e8e8e3'],[1,'#c5cecd']]),'#d3ddda',4);
 // top rim highlight to make the sink read as a lavabo rather than a tub
 c.strokeStyle='#ffffffc6';c.lineWidth=8;c.beginPath();c.ellipse(x,y-16,1020,776,0,3.68,5.74);c.stroke();
 c.strokeStyle='#99aaaf66';c.lineWidth=12;c.beginPath();c.ellipse(x,y+138,706,486,0,.58,2.58);c.stroke();
 // faucet mounted on the upper white rim, not down inside the bowl
 rr(c,1678,402,265,238,76,'#42545a36');
 ell(c,1808,462,150,96,'#64767b','#edf8f7',7);
 rr(c,1712,374,190,176,50,linear(c,1712,0,1902,0,[[0,'#45565d'],[.18,'#f8ffff'],[.36,'#9baeb2'],[.64,'#fff'],[1,'#495d66']]),'#738188',4);
 rr(c,1760,490,92,168,32,linear(c,1760,0,1852,0,[[0,'#43565b'],[.22,'#eef7f6'],[.55,'#a3b7bd'],[.81,'#fff'],[1,'#596e77']]),'#71878c');
 rr(c,1764,352,250,34,18,linear(c,1764,352,2014,386,[[0,'#5f727a'],[.45,'#fbffff'],[1,'#95aab0']]),'#51656d',4);
 ell(c,1988,369,15,13,'#478dc0');
 // small stream from the faucet onto the upper ceramic shelf, reinforcing the high-to-low depth read
 c.strokeStyle='#8ed7efb6';c.lineWidth=10;c.beginPath();c.moveTo(1988,369);c.quadraticCurveTo(2012,392,1988,430);c.stroke();
 c.strokeStyle='#d7f8ffd9';c.lineWidth=4;c.beginPath();c.moveTo(1988,370);c.quadraticCurveTo(2002,392,1988,428);c.stroke();
 // drain is a real visual island, not a route portal.
 const {x:dx,y:dy}=T.drain;ell(c,dx+8,dy+9,116,116,'#7e8c8d66');ell(c,dx,dy,107,107,linear(c,dx-100,dy-100,dx+100,dy+100,[[0,'#f8ffff'],[.35,'#819196'],[.62,'#e3eded'],[1,'#42545d']]),'#73858a',5);ell(c,dx,dy,81,81,'#283a41','#c2d2d5',5);for(let i=0;i<7;i++){const a=i*2*Math.PI/7;ell(c,dx+48*Math.cos(a),dy+48*Math.sin(a),16,16,'#101b20','#9fafb1',3);}ell(c,dx,dy,18,18,'#111c23','#b8c8c9');}
function bottle(c,x,y,w,h,body){rr(c,x+15,y+18,w,h,38,'#584d474f');rr(c,x,y+30,w,h-30,36,linear(c,x,y,x+w,y+h,[[0,'#ffffffb0'],[.12,body],[.77,body],[1,'#304c65']]),'#486171',4);rr(c,x+w*.24,y,w*.52,50,10,linear(c,x,0,x+w,0,[[0,'#e8efed'],[.5,'#fff'],[1,'#919d9e']]),'#64757b');rr(c,x+12,y+h*.4,w-24,h*.36,10,'#eaf2ed');c.fillStyle='#547284';c.font='bold 19px sans-serif';c.textAlign='center';c.fillText('FRESH',x+w/2,y+h*.56);rr(c,x+22,y+h*.61,w-44,6,3,'#8eafb4');}
 function cloth(c,x,y,w,h,color,light){rr(c,x+12,y+18,w,h,26,'#534b4755');rr(c,x,y+10,w,h,26,color,'#4d6b80',4);rr(c,x,y,w,h-12,26,light,'#8fa4ae',4);for(let y1=14;y1<h-15;y1+=9){c.strokeStyle=y1%3?'#e9f7ff29':'#315b7b25';c.lineWidth=3;c.beginPath();c.moveTo(x+10,y+y1);c.lineTo(x+w-10,y+y1);c.stroke();}for(let i=0;i<w-15;i+=12){c.strokeStyle=light;c.lineWidth=4;c.beginPath();c.moveTo(x+10+i,y+h-8);c.lineTo(x+10+i,y+h+9);c.stroke();}}
 function road(c){c.lineCap='round';c.lineJoin='round';const p=T.points;line(c,p,2*T.laneHalf+32,'#34454d51',true);line(c,p,2*T.laneHalf+15,'#657b81',true);line(c,p,2*T.laneHalf+3,'#e7e4dc',true);line(c,p,2*T.laneHalf-17,'#afa89c',true);line(c,p,2*T.laneHalf-26,'#c9c2b6',true);line(c,p,2*T.laneHalf-100,'#d5cdc1',true);// In the bowl, the driving surface is the ceramic itself, not a floating road.
 c.save();c.beginPath();c.ellipse(1810,1380,985,745,0,0,Math.PI*2);c.clip();
 line(c,p,2*T.laneHalf-17,'#9eafb1',true);line(c,p,2*T.laneHalf-30,'#d4dfde',true);line(c,p,2*T.laneHalf-100,'#e4eae6',true);c.restore();
 c.setLineDash([24,24]);line(c,p,3.5,'#fff9e6c4',true);c.setLineDash([]);
 const n=Math.round(T.length/39);for(let i=0;i<n;i++){const p=i/n,q=T.point(p),a=T.tangent(p),nx=-Math.sin(a),ny=Math.cos(a);for(const side of [-1,1]){const edge={x:q.x+nx*side*(T.laneHalf-4),y:q.y+ny*side*(T.laneHalf-4),a};if(T.shortcutNearest(edge).distance<78&&p>T.entry-.045&&p<T.exit+.045)continue;at(c,edge,()=>{rr(c,-19,-9,38,21,3,'#435a6588');rr(c,-19,-11,38,17,3,i%2?'#f7f9f6':'#267eae');rr(c,-17,-10,34,4,2,'#ffffff50');});}}
 const q=T.point(0),a=T.tangent(0);at(c,{...q,a},()=>{for(let i=0;i<12;i++)for(let j=0;j<2;j++){c.fillStyle=(i+j)%2?'#1e303a':'#fffdf4';c.fillRect(-22+j*22,-120+i*20,22,20);}c.fillStyle='#26333a';c.font='bold 24px sans-serif';c.textAlign='center';c.fillText('START / FINISH',4,-143);});}
 function puddle(c,z){at(c,z,()=>{ell(c,0,0,z.rx,z.ry,'#6bb6d088','#83c6d6',4);ell(c,-20,-14,z.rx*.72,z.ry*.69,'#c0e4ed67');for(let i=0;i<10;i++){const a=i*2.4;ell(c,Math.cos(a)*z.rx*.83,Math.sin(a)*z.ry*.85,10+i%5,6+i%3,'#a9e4eb99','#e4fbff9e',2);}c.strokeStyle='#f3ffffbe';c.lineWidth=4;c.beginPath();c.ellipse(0,0,z.rx*.83,z.ry*.71,0,3.5,5.5);c.stroke();});}
 function soap(c,o,i){at(c,o,()=>{rr(c,-39+7,-34+9,78,68,20,'#60534b55');rr(c,-39,-34,78,68,20,i%2?'#d9ae64':'#c96882','#9b6571',3);rr(c,-39,-40,78,68,19,linear(c,0,-40,0,28,[[0,i%2?'#ffedb9':'#ffd0da'],[1,i%2?'#dfb56f':'#e88ca2']]),'#fff6e6aa',3);c.strokeStyle='#8b5d6b55';c.lineWidth=2;c.beginPath();c.ellipse(0,-5,14,9,-.4,0,Math.PI*2);c.stroke();});}
 function cotton(c,o){ell(c,o.x+8,o.y+10,o.r,o.r*.88,'#554d4350');for(let i=0;i<13;i++){const a=i*2.4,r=i===0?0:o.r*.54;ell(c,o.x+Math.cos(a)*r,o.y+Math.sin(a)*r,o.r*.47,o.r*.44,radial(c,o.x+Math.cos(a)*r-5,o.y+Math.sin(a)*r-7,o.r*.5,[[0,'#fffdf8'],[.7,'#eee7dd'],[1,'#c6bdb1']]),'#e1d8ca',1.5);}}
 function brush(c,b){const p=T.deckPoints;c.lineCap=b.lineCap='round';c.lineJoin=b.lineJoin='round';
 // soft deck shadow clearly detached from the lower ceramic shortcut
 c.save();c.translate(12,20);line(c,p,250,'#21374442');c.restore();
 // slimmer straight upper bridge so the underpass remains visible
 line(b,p,210,'#56727c');line(b,p,194,'#cfe0e0');line(b,p,176,'#f7fbf5');
 const q=T.point(T.deckStart+145/T.length),a=T.tangent(T.deckStart+145/T.length);
 at(b,{...q,a},()=>{rr(b,-150,-88,300,176,30,'#1e4961','#4e6979',4);rr(b,-150,-93,300,166,30,'#2583ab','#c4e8ef',4);
 rr(b,-145,-70,198,120,26,linear(b,0,-70,0,50,[[0,'#abddea'],[.38,'#4ea9c9'],[1,'#2382af']]),'#d3edf1',4);
 for(let i=0;i<5;i++)rr(b,-124+i*29,-55,10,90,4,'#e2f5f69e');
 rr(b,56,-90,94,160,26,'#edf5f3','#8fb9c7',4);for(let k=0;k<5;k++)for(let i=0;i<4;i++)rr(b,66+i*18,-72+k*26,14,20,5,k%2?'#b5d6e4':'#fbfff6','#9fbbc3',1);
 });
 // simpler ceramic approach on the upper lane; removes the ambiguous white trait in the penultimate bend
 const tail=p.slice(27);
 line(b,tail,132,'#c6d8da');line(b,tail,114,'#eef4ef');
 // visible mouths of the underpass: a small shadow below and rim above, no road-like slab
 for(const ph of [T.deckStart,T.deckEnd]){const q=T.point(ph),a=T.tangent(ph);at(c,{...q,a},()=>{rr(c,-12,-104,24,208,10,'#29506333');at(c,{x:0,y:0,a:0},()=>{});});}
 }
function towel(c){const o=T.towel;at(c,o,()=>{cloth(c,-188,-115,376,230,'#315e8d','#578db9');
  rr(c,-182,-108,364,216,22,linear(c,-180,0,180,0,[[0,'#23445f88'],[.42,'#5488ab22'],[.80,'#b3d9f14d'],[1,'#ecfaff65']]));
  for(let i=0;i<9;i++)rr(c,-170+i*40,-105,7,210,3,'#d5e5e9a0');


 });}
 function descent(c){const q=T.basinEntry;at(c,q,()=>{
  // Broad gradient and successive transverse bands give a continuous sloping ceramic entrance.
  rr(c,-172,-110,344,220,17,linear(c,-172,0,172,0,[[0,'#eee2d34a'],[.26,'#c4d9db99'],[.63,'#628b9a66'],[1,'#9fb9be22']]));
  for(let i=0;i<5;i++){const x=-120+i*56;c.strokeStyle='rgba(255,255,255,'+(.30-i*.038)+')';c.lineWidth=4;c.beginPath();c.moveTo(x,-99);c.quadraticCurveTo(x+14,0,x,99);c.stroke();}


 });}
 function wetBypass(c){const branch=T.shortcutSamples;
  // A narrow wet cut on the inner ceramic, visibly distinct from the upper bridge.
  c.save();c.beginPath();c.ellipse(1810,1380,985,745,0,0,Math.PI*2);c.clip();
  line(c,branch,112,'#3d7e9522');line(c,branch,92,'#76b8c966');line(c,branch,62,'#d3f1f4b8');
  for(let i=4;i<branch.length-3;i+=7){const q=branch[i],a=T.shortcutTangent((i+3)/80);at(c,{...q,a},()=>{ell(c,0,0,18,24,'#84c8db2c');ell(c,-7,-8,6,4,'#f2ffff9a');});}
  c.strokeStyle='#87a1a8';c.lineWidth=2;c.setLineDash([8,18]);path(c,branch,false);c.stroke();c.setLineDash([]);
  // emphasize the entry/exit of the cut so the player understands where it starts and rejoins
  for(const pt of [branch[0],branch[branch.length-1]]){ell(c,pt.x,pt.y,34,22,'#ccecf099','#8ebdca',2);}
  c.restore();
 }
function render(c,b){const {w,h}=T.world;c.clearRect(0,0,w,h);b.clearRect(0,0,w,h);counter(c);basin(c);
 bottle(c,80,380,118,300,'#d994b2');bottle(c,3320,370,155,320,'#48b3c6');bottle(c,3440,1000,100,260,'#e9b77f');cloth(c,2710,1995,640,280,'#8d8279','#c9b8a5');cloth(c,90,1980,470,215,'#336e91','#6598b4');rr(c,500,1120,155,240,28,'#d4aa4b','#9c793d',5);for(let i=0;i<90;i++)ell(c,516+(i*37)%125,1140+(i*53)%196,3+i%4,2+i%3,'#a37b3d66');
 road(c);descent(c);puddle(c,T.water);puddle(c,T.landingWater);T.soaps.forEach((o,i)=>soap(c,o,i));T.cotton.forEach(o=>cotton(c,o));towel(c);
 wetBypass(c);brush(c,b);
 }
 window.TTRBathVisuals=Object.freeze({render,ready:Promise.resolve(true)});
})();
