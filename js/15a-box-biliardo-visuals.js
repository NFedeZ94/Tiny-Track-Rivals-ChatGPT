/* Box di Biliardo: static environment from approved prototype 0.2. */
(()=>{'use strict';const T=window.TTRBoxTrack,W=T.world.w,H=T.world.h;function render(b){
 const round=(c,x,y,w,h,r)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
 const line=(c,a,z,color,w)=>{c.beginPath();c.moveTo(a.x,a.y);c.lineTo(z.x,z.y);c.strokeStyle=color;c.lineWidth=w;c.stroke();};
 let seed=51;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function paint(){let bg=b.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#4b2f26');bg.addColorStop(1,'#251a1c');b.fillStyle=bg;b.fillRect(0,0,W,H);
  for(let i=0;i<18;i++){b.strokeStyle=i%2?'#ffffff0a':'#0c060830';b.lineWidth=1+rand()*4;b.beginPath();b.moveTo(0,i*94);b.bezierCurveTo(850,i*94+60,1500,i*94-75,W,i*94);b.stroke();}
  b.shadowColor='#000b';b.shadowBlur=30;b.shadowOffsetY=18;round(b,75,65,2450,1470,95);b.fillStyle='#1d1616';b.fill();b.shadowBlur=0;b.shadowOffsetY=0;
  let wood=b.createLinearGradient(80,65,80,1535);wood.addColorStop(0,'#aa6938');wood.addColorStop(.07,'#684026');wood.addColorStop(.5,'#472a20');wood.addColorStop(.93,'#9b5c32');wood.addColorStop(1,'#583321');round(b,85,70,2430,1460,83);b.fillStyle=wood;b.fill();b.lineWidth=8;b.strokeStyle='#d1965688';b.stroke();
  for(let y of [95,1505])for(let i=0;i<12;i++){b.strokeStyle='#e3b07a22';b.lineWidth=2;b.beginPath();b.moveTo(150,y+i*1.7);b.bezierCurveTo(600,y-8,1900,y+15,2450,y+i*1.7);b.stroke();}
  round(b,145,105,2310,1390,66);b.fillStyle='#102f29';b.fill();b.strokeStyle='#c59254';b.lineWidth=5;b.stroke();
  let felt=b.createLinearGradient(250,145,2300,1450);felt.addColorStop(0,'#226d50');felt.addColorStop(.5,'#175b45');felt.addColorStop(1,'#124839');round(b,180,145,2240,1310,38);b.fillStyle=felt;b.fill();
  b.save();round(b,180,145,2240,1310,38);b.clip();for(let i=0;i<39000;i++){const x=180+rand()*2240,y=145+rand()*1310;b.fillStyle=i%3?'#b9e9bb0b':'#092c1a19';b.fillRect(x,y,1+rand()*2,1+rand()*2);}b.restore();
  // Cushions: dark sides, bright upper lips and brass sights.
  for(const y of [145,1455]){line(b,{x:245,y},{x:1240,y},'#0c3328',33);line(b,{x:1360,y},{x:2355,y},'#0c3328',33);line(b,{x:245,y:y+(y<800?8:-8)},{x:1240,y:y+(y<800?8:-8)},'#3b9871',10);line(b,{x:1360,y:y+(y<800?8:-8)},{x:2355,y:y+(y<800?8:-8)},'#3b9871',10);}
  for(const x of [180,2420]){line(b,{x,y:220},{x,y:1380},'#103c30',35);line(b,{x:x+(x<1000?8:-8),y:220},{x:x+(x<1000?8:-8),y:1380},'#3a9068',10);}
  for(let i=1;i<8;i++)for(let y of [100,1500]){if(i===4)continue;let x=200+i*275;b.save();b.translate(x,y);b.rotate(Math.PI/4);b.fillStyle='#ebd8a3';b.fillRect(-9,-9,18,18);b.restore();}for(let i=1;i<4;i++)for(let x of [113,2487]){b.save();b.translate(x,145+i*325);b.rotate(Math.PI/4);b.fillStyle='#ebd8a3';b.fillRect(-9,-9,18,18);b.restore();}
  // Same felt across the entire table; only chalk dashes define the road.
  b.save();round(b,180,145,2240,1310,38);b.clip();b.lineJoin='round';
  for(const side of [-1,1]){b.beginPath();T.points.forEach((p,i)=>{const a=T.tangent(i/T.points.length),x=p.x-Math.sin(a)*94*side,y=p.y+Math.cos(a)*94*side;i?b.lineTo(x,y):b.moveTo(x,y);});b.closePath();b.strokeStyle='#ddf0bc9c';b.lineWidth=3.5;b.setLineDash([22,20]);b.stroke();b.setLineDash([]);}
  b.restore();
  // Start line and painted grid.
  let s=T.point(0),a=T.tangent(0);b.save();b.translate(s.x,s.y);b.rotate(a);for(let row=0;row<2;row++)for(let col=0;col<10;col++){b.fillStyle=(row+col)%2?'#172c26':'#f7f2d5';b.fillRect(-18+row*18,-100+col*20,18,20);}for(let i=0;i<4;i++){let x=-65-Math.floor(i/2)*78,y=i%2===0?-42:42;b.strokeStyle='#f1edce80';b.lineWidth=3;b.strokeRect(x-26,y-21,52,42);}b.restore();
  // Decorative chalk logo / score typography in the unoccupied felt.
  b.save();b.translate(1130,510);b.rotate(-.12);b.fillStyle='#d9efcf2c';b.textAlign='center';b.font='900 84px system-ui';b.fillText('8  BALL',0,0);b.font='800 34px system-ui';b.fillText('BOX DI BILIARDO',0,47);b.restore();
  // Large wooden cues, their geometry matches physical collision shapes.
  for(const o of T.cues){const {x,y,a,len,w}=o;b.save();b.translate(x,y);b.rotate(a);b.shadowColor='#071b14bb';b.shadowBlur=10;b.shadowOffsetY=8;let c=b.createLinearGradient(0,-w/2,0,w/2);c.addColorStop(0,'#f8dfb3');c.addColorStop(.35,'#c99b61');c.addColorStop(1,'#64412a');b.fillStyle=c;b.beginPath();b.moveTo(-len/2,-w/2);b.lineTo(len/2,-w*.21);b.lineTo(len/2,w*.21);b.lineTo(-len/2,w/2);b.closePath();b.fill();b.shadowBlur=0;b.shadowOffsetY=0;b.fillStyle='#42282a';b.fillRect(-len/2,-w/2,len*.24,w);b.fillStyle='#e2d7b3';b.fillRect(-len/2+len*.24,-w*.44,8,w*.88);b.fillStyle='#cfddd1';b.fillRect(len/2-17,-w*.22,12,w*.44);b.fillStyle='#6cb2c4';b.fillRect(len/2-5,-w*.22,5,w*.44);b.restore();}
  // Hollow rack: three wooden rails, no invisible filled triangle.
  {const o=T.rack;b.save();b.translate(o.x,o.y);b.rotate(o.a);b.lineJoin='round';b.lineCap='round';b.beginPath();o.vertices.forEach(([x,y],i)=>i?b.lineTo(x,y):b.moveTo(x,y));b.closePath();b.shadowColor='#09150dba';b.shadowBlur=12;b.shadowOffsetY=10;b.strokeStyle='#512c1a';b.lineWidth=o.w+8;b.stroke();b.shadowBlur=0;b.shadowOffsetY=0;b.strokeStyle='#b67443';b.lineWidth=o.w;b.stroke();b.strokeStyle='#edba79';b.lineWidth=5;b.stroke();b.restore();}
  for(const o of T.chalks){b.save();b.translate(o.x,o.y);b.rotate(o.a);b.shadowColor='#081c16aa';b.shadowBlur=9;b.shadowOffsetY=8;b.fillStyle='#11364b';b.fillRect(-o.w/2,-o.h/2,o.w,o.h);b.shadowBlur=0;b.shadowOffsetY=0;b.fillStyle='#3789b1';b.fillRect(-o.w/2,-o.h/2,o.w,o.h*.80);b.strokeStyle='#94c8d9';b.lineWidth=3;b.strokeRect(-o.w/2+3,-o.h/2+3,o.w-6,o.h*.80-6);b.fillStyle='#25678b';b.beginPath();b.arc(0,-o.h*.08,o.w*.21,0,Math.PI*2);b.fill();b.restore();}
  // Billiard pockets are actual world-space triggers. A/C are visually signposted.
  for(const p of T.pockets){const active=p.role!=='hazard';b.beginPath();b.arc(p.x,p.y,p.r+10,0,Math.PI*2);b.fillStyle='#171f1d';b.fill();b.strokeStyle=active?(p.role==='entry'?'#e4b63c':'#52cbdf'):'#62462e';b.lineWidth=7;b.stroke();const q=b.createRadialGradient(p.x-10,p.y-10,0,p.x,p.y,47);q.addColorStop(0,'#02080a');q.addColorStop(1,'#15251e');b.fillStyle=q;b.beginPath();b.arc(p.x,p.y,p.r-1,0,Math.PI*2);b.fill();if(active){b.fillStyle=p.role==='entry'?'#ffd45b':'#7be8f5';b.font='900 30px system-ui';b.textAlign='center';b.fillText(p.id,p.x,p.y+10);}}

 }

 function ball(c,o){c.save();c.shadowColor='#07180dc0';c.shadowBlur=13;c.shadowOffsetY=9;let q=c.createRadialGradient(o.x-o.r*.35,o.y-o.r*.4,3,o.x,o.y,o.r);q.addColorStop(0,'#fff');q.addColorStop(.22,o.color);q.addColorStop(1,'#10191d');c.fillStyle=q;c.beginPath();c.arc(o.x,o.y,o.r,0,Math.PI*2);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;if(o.n){c.fillStyle='#f3eee1';c.beginPath();c.arc(o.x+1,o.y-1,o.r*.43,0,Math.PI*2);c.fill();c.fillStyle='#171c24';c.font=`900 ${Math.round(o.r*.54)}px system-ui`;c.textAlign='center';c.textBaseline='middle';c.fillText(o.n,o.x+1,o.y);}c.restore();}

paint();for(const o of T.balls)ball(b,o);
}window.TTRBoxVisuals=Object.freeze({render});})();
