/* Desk Drift R3 — procedural desk, individual props, same coordinates as physics. */
(()=>{'use strict';const D=window.TTRDeskTrack;
 const rr=(c,x,y,w,h,r,fill,stroke=null,lw=3)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}};
 const grad=(c,x,y,X,Y,stops)=>{const g=c.createLinearGradient(x,y,X,Y);stops.forEach(([v,col])=>g.addColorStop(v,col));return g;};
 const path=(c,p,closed=false)=>{c.beginPath();p.forEach((q,i)=>i?c.lineTo(q.x,q.y):c.moveTo(q.x,q.y));if(closed)c.closePath();};
 const line=(c,p,w,color,closed=false)=>{path(c,p,closed);c.lineWidth=w;c.strokeStyle=color;c.stroke();};
 const at=(c,o,f)=>{c.save();c.translate(o.x,o.y);c.rotate(o.a||0);f();c.restore();};
 const shadow=(c,x,y,w,h,r)=>rr(c,x+13,y+22,w,h,r,'#25180c55');
 function wood(c,w,h){c.fillStyle=grad(c,0,0,0,h,[[0,'#bb8551'],[.48,'#d8a66c'],[1,'#a36a3e']]);c.fillRect(0,0,w,h);let seed=139;const rnd=()=>((seed=Math.imul(seed,1664525)+1013904223|0)>>>0)/4294967296;for(let i=0;i<3200;i++){const x=rnd()*w,y=rnd()*h,len=40+rnd()*700;c.beginPath();c.moveTo(x,y);c.bezierCurveTo(x+len*.3,y+8*Math.sin(i),x+len*.7,y-8*Math.cos(i),x+len,y);c.strokeStyle=i%3?'#623c2021':'#ffe3ad36';c.lineWidth=1+rnd()*3;c.stroke();}rr(c,0,h-65,w,65,0,'#754925');rr(c,0,h-75,w,20,0,'#e0ad72');}
 function notebook(c,x,y,w,h){at(c,{x,y,a:-.13},()=>{shadow(c,0,0,w,h,20);rr(c,0,0,w,h,22,'#243b53');rr(c,11,9,w-22,h-20,18,'#af9d7d');for(let i=0;i<6;i++)rr(c,16,8-i*3,w-35,h-29,14,i%2?'#f4e4b7':'#deca99');rr(c,22,-10,w-42,h-36,14,'#f7edcf');for(let k=60;k<h-65;k+=43){c.strokeStyle='#93aeb575';c.lineWidth=2;c.beginPath();c.moveTo(70,k);c.lineTo(w-48,k);c.stroke();}for(let k=38;k<h-48;k+=66){rr(c,10,k-6,20,18,6,'#22242b');c.beginPath();c.ellipse(13,k,29,10,0,0,Math.PI*2);c.strokeStyle='#343941';c.lineWidth=7;c.stroke();}rr(c,w-28,h*.38,32,85,5,'#e3bd36');rr(c,w-29,h*.57,34,85,5,'#65adcc');});}
 function keyboard(c){const x=655,y=2185,w=2360,h=300;shadow(c,x,y,w,h,38);rr(c,x,y,w,h,38,'#29313c','#66747c',6);rr(c,x+13,y+10,w-26,h-30,26,'#525c66');const keys=18,kw=117;for(let j=0;j<2;j++)for(let i=0;i<keys;i++){const a=x+35+i*129,b=y+24+j*126;rr(c,a,b+8,kw,105,14,'#222833');rr(c,a+3,b,kw-6,91,13,grad(c,a,b,a,b+90,[[0,'#fcf4e5'],[1,'#c7c2b5']]),'#999991',2);c.fillStyle='#434b52';c.font='bold 22px system-ui';c.textAlign='center';c.fillText(j?'ASDFGHJKLZXCVBNM!?+'[i]||'·':'1234567890QWERTYUI'[i]||'·',a+kw/2,b+49);}}
 function notes(c,x,y,a,color){at(c,{x,y,a},()=>{shadow(c,0,0,240,220,9);rr(c,0,12,240,220,9,'#8e7c43');for(let i=0;i<5;i++)rr(c,0,9-i*3,240,211,7,i%2?color:'#e5ce76');rr(c,0,-9,240,210,7,color);c.strokeStyle='#795c422d';c.lineWidth=3;for(let i=40;i<170;i+=36){c.beginPath();c.moveTo(34,i);c.lineTo(199,i);c.stroke();}});}
 function mouse(c){at(c,{x:3405,y:1770,a:-.22},()=>{shadow(c,-210,-230,420,460,30);rr(c,-210,-230,420,460,30,'#263d62','#3e6490',5);shadow(c,-93,-146,186,285,82);rr(c,-93,-146,186,285,82,grad(c,-93,-146,93,139,[[0,'#fff9ed'],[.5,'#e9e5db'],[1,'#a9a9a4']]),'#a4a59f',4);c.strokeStyle='#8f9391';c.lineWidth=3;c.beginPath();c.moveTo(0,-141);c.lineTo(0,-29);c.stroke();rr(c,-12,-97,24,50,11,'#4d5662');});}
 function stationery(c,o){at(c,o,()=>{const l=o.len,w=o.w,x=-l/2,y=-w/2,r=w/2;shadow(c,x,y,l,w,r);
  if(o.type==='desk-pencil'){
   const tip=Math.min(l*.22,w*1.85),metal=Math.min(l*.10,w*.88),rubber=Math.min(l*.12,w*.85),body=l-tip-metal-rubber;
   const poly=(pts,fill,stroke)=>{path(c,pts.map(([x,y])=>({x,y})),true);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}};
   poly([[x,0],[x+tip,y],[x+tip+body,y],[x+tip+body,-y],[x+tip,-y]],'#bd822b','#825322');
   poly([[x+tip,y],[x+tip+body,y],[x+tip+body,y+w*.28],[x+tip,y+w*.28]],'#ffe48b');
   poly([[x+tip,y+w*.28],[x+tip+body,y+w*.28],[x+tip+body,-y-w*.24],[x+tip,-y-w*.24]],'#f3b83c');
   poly([[x,0],[x+tip,y],[x+tip,-y]],'#e9c89c','#aa8154');poly([[x,0],[x+tip*.32,-w*.13],[x+tip*.32,w*.13]],'#34343a');
   rr(c,x+tip+body,y,metal,w,3,grad(c,0,y,0,-y,[[0,'#e8edef'],[.45,'#9ba5ab'],[.72,'#e3ebed'],[1,'#747c81']]),'#727d82',1.4);
   rr(c,x+tip+body+metal,y,rubber,w,Math.min(7,rubber*.4),'#d8838a','#a35b63',1.4);
  }else if(o.type==='desk-highlighter'){
   const cap=l*.29,col=o.x<1800?'#c8e951':'#ffab55';
   rr(c,x,y+5,l,w,Math.min(10,w*.22),'#55534e','#393e43',2);
   rr(c,x,y,l,w,Math.min(10,w*.22),grad(c,0,y,0,-y,[[0,'#fff5b5'],[.32,col],[1,'#888b38']]),'#5c6542',2);
   rr(c,x,y,cap,w,Math.min(9,w*.2),'#38424b','#252c33',2);rr(c,x+cap*.18,y+w*.12,cap*.58,w*.2,4,'#6c7d81');
   rr(c,x+cap+5,y+w*.12,3,w*.76,1,'#75813a');rr(c,x+cap+14,y+w*.19,l-cap-26,w*.11,3,'#ffffff8c');
   if(l>170){c.fillStyle='#344c3b';c.font=`bold ${Math.max(11,w*.23)}px sans-serif`;c.textAlign='center';c.fillText('HIGHLIGHT',x+cap+(l-cap)/2,w*.16);}
  }else if(o.type==='desk-sharpener'){
   rr(c,x,y+4,l,w,5,'#737e88','#39454c',2);rr(c,x,y,l,w,5,grad(c,0,y,0,-y,[[0,'#e4ebed'],[1,'#8a99a5']]),'#53636d',2);rr(c,x+l*.12,y+w*.24,l*.72,w*.29,3,'#414b52');c.beginPath();c.arc(x+l*.23,0,w*.18,0,Math.PI*2);c.fillStyle='#29343e';c.fill();c.beginPath();c.arc(l*.18,-w*.09,w*.065,0,Math.PI*2);c.fillStyle='#edf4f5';c.fill();
  }else{const tone=o.x<2000?['#ffe8e0','#eca391','#ba635c','#7d4843']:['#fff2da','#e9c18b','#b78956','#7b593b'];
   rr(c,x,y+5,l,w,Math.min(7,w*.16),tone[2],tone[3],2);rr(c,x,y,l,w,Math.min(7,w*.16),grad(c,0,y,0,-y,[[0,tone[0]],[.42,tone[1]],[1,tone[2]]]),tone[3],2);
   const sx=x+l*.28,sw=l*.53;rr(c,sx,y+1,sw,w-2,2,grad(c,0,y,0,-y,[[0,'#dcecf5'],[.25,'#557fa8'],[1,'#274f78']]),'#26445e',1.5);
   rr(c,sx+sw*.12,y+w*.20,sw*.75,w*.18,2,'#e7f0f1');rr(c,sx+sw*.12,y+w*.56,sw*.47,Math.max(2,w*.055),1,'#b8d4e3');
   for(let i=0;i<3;i++){c.beginPath();c.moveTo(x+l*.08+i*l*.035,y+w*.20);c.lineTo(x+l*.11+i*l*.035,y+w*.34);c.strokeStyle='#855c4c44';c.lineWidth=1.2;c.stroke();}
  }
 });}
 function road(c){
  // No painted track: wood grain remains the driving surface.
  D.papers.forEach(o=>at(c,o,()=>{rr(c,-o.rx+4,-o.ry+5,o.rx*2,o.ry*2,3,'#493b263b');rr(c,-o.rx,-o.ry,o.rx*2,o.ry*2,3,'#f8f1d8','#d9c9a5',2);for(let y=-o.ry+13;y<o.ry-6;y+=13){c.beginPath();c.moveTo(-o.rx+12,y);c.lineTo(o.rx-10,y);c.lineWidth=1.4;c.strokeStyle='#97adbb8a';c.stroke();}}));
  D.clips.forEach(o=>at(c,o,()=>{c.lineCap='round';c.lineJoin='round';for(const [dx,dy,col,w] of [[3,4,'#32261766',6],[0,0,'#535d64',5],[0,-1,'#e6edf0',2.5]]){c.beginPath();c.roundRect(-21+dx,-9+dy,42,18,8);c.strokeStyle=col;c.lineWidth=w;c.stroke();c.beginPath();c.moveTo(14+dx,4+dy);c.lineTo(-12+dx,4+dy);c.quadraticCurveTo(-18+dx,4+dy,-18+dx,-1+dy);c.quadraticCurveTo(-18+dx,-5+dy,-12+dx,-5+dy);c.lineTo(9+dx,-5+dy);c.stroke();}}));
  const q=D.point(0),a=D.tangent(0);at(c,{...q,a},()=>{for(let i=0;i<12;i++)for(let j=0;j<2;j++){c.fillStyle=(i+j)%2?'#171d26':'#fff8e6';c.fillRect(-20+j*20,-120+i*20,20,20);}});
 }
 function bridge(c,b){const P=D.shortcutPoint(0),Q=D.shortcutPoint(1),a=D.shortcutTangent(),l=D.shortcutLength,w=D.bridgeHalf*2;at(c,{...P,a},()=>{shadow(c,0,-w/2,l,w,9);});at(b,{...P,a},()=>{const c=b;rr(c,0,-w/2,l*D.gate,w,7,grad(c,0,0,l*D.gate,0,[[0,'#c19a65'],[1,'#b58e58']]),'#917147',2);rr(c,l*D.merge,-w/2,l*(1-D.merge),w,6,'#b58e58','#917147',2); // wood ramps are part of the deck, with a straight ruler resting on two visible supports
  const start=l*.18,end=l*.83;rr(c,l*D.gate,-w/2,start+18-l*D.gate,w,12,grad(c,0,0,start,0,[[0,'#a48055'],[1,'#d5b17d']]),'#6b4e34');rr(c,end-16,-w/2,l-end+16-l*(1-D.merge),w,12,grad(c,end,0,l,0,[[0,'#d5b17d'],[1,'#a48055']]),'#6b4e34');for(let x=l*D.gate+10;x<start;x+=22)rr(c,x,-w/2+8,3,w-16,1,'#7a573b66');for(let x=end+20;x<l*D.merge-7;x+=22)rr(c,x,-w/2+8,3,w-16,1,'#7a573b66');});at(b,{...P,a},()=>{const start=l*.18,end=l*.83;rr(b,start-9,-w/2+9,end-start+19,w,8,'#735b3e','#513b26');rr(b,start,-w/2,end-start,w,7,grad(b,0,-w/2,0,w/2,[[0,'#fff0c3'],[.55,'#e8d4a3'],[1,'#c6a775']]),'#997a4a');for(let i=0;i<=30;i++){const x=start+9+(end-start-18)*i/30,len=i%5===0?30:i%2===0?19:12;rr(b,x,-w/2+4,2,len,0,'#5e4c36');if(i%5===0){b.font='bold 20px system-ui';b.fillStyle='#655039';b.textAlign='center';b.fillText(i,x,-w/2+52);}}rr(b,start+12,w/2-13,end-start-24,3,1,'#ad905c');});}
 function setSquare(c,x,y,a,l,h,col){at(c,{x,y,a},()=>{
  const outer=[[-l/2,-h/2],[-l/2,h/2],[l/2,h/2]],inner=[[-l/2+32,-h/2+63],[-l/2+32,h/2-25],[l/2-82,h/2-25]];
  const trace=(dx,dy)=>{c.beginPath();for(const [i,[xx,yy]] of outer.entries())i?c.lineTo(xx+dx,yy+dy):c.moveTo(xx+dx,yy+dy);c.closePath();for(const [i,[xx,yy]] of inner.entries())i?c.lineTo(xx+dx,yy+dy):c.moveTo(xx+dx,yy+dy);c.closePath();};
  trace(9,13);c.fillStyle='#2b211e40';c.fill('evenodd');trace(0,0);c.fillStyle=col;c.fill('evenodd');c.lineWidth=3;c.strokeStyle='#456d788e';c.stroke();
  for(let i=1;i<Math.floor(l/12);i++){const xx=-l/2+i*12;c.beginPath();c.moveTo(xx,h/2-3);c.lineTo(xx,h/2-(i%5===0?17:9));c.strokeStyle='#294b55b0';c.lineWidth=1.6;c.stroke();}
  for(let i=1;i<Math.floor(h/12);i++){const yy=-h/2+i*12;c.beginPath();c.moveTo(-l/2+3,yy);c.lineTo(-l/2+(i%5===0?17:9),yy);c.stroke();}
 });}
 function render(c,b){const {w,h}=D.world;c.clearRect(0,0,w,h);b?.clearRect(0,0,w,h);wood(c,w,h);notebook(c,610,1030,490,620);notes(c,178,175,-.15,'#f0d15e');notes(c,1650,190,.1,'#ea91bb');notes(c,3450,310,.13,'#a9c86b');keyboard(c);mouse(c);setSquare(c,720,210,.12,260,160,'#a5dbe5a8');setSquare(c,2260,1060,-.46,245,190,'#d5e8b7af');road(c);D.objects.forEach(o=>stationery(c,o));if(b)bridge(c,b);}
 window.TTRDeskVisuals=Object.freeze({ready:Promise.resolve(true),render,stationery});})();
