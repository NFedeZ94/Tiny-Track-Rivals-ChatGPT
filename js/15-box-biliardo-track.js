/* TTR • circuit 02 • geometry and rules, no DOM or renderer dependencies. */
(function(root){'use strict';
 const W=2600,H=1600, half=100;
 const anchors=[[550,1300],[900,1300],[1250,1280],[1660,1300],[2130,1280],[2280,1090],[2200,890],[1950,805],[1950,625],[2190,495],[2340,260],[2225,240],[2050,245],[1850,280],[1690,465],[1510,465],[1320,250],[1100,250],[760,245],[430,275],[290,455],[400,655],[660,800],[820,965],[660,1080],[410,1050],[275,1150],[355,1290]];
 const mod=(x,n)=>((x%n)+n)%n, clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 const samples=[];
 for(let i=0;i<anchors.length;i++){const [a,b,c,d]=[-1,0,1,2].map(j=>anchors[mod(i+j,anchors.length)]);for(let k=0;k<24;k++){const t=k/24,t2=t*t,t3=t2*t;const f=j=>.5*(2*b[j]+(-a[j]+c[j])*t+(2*a[j]-5*b[j]+4*c[j]-d[j])*t2+(-a[j]+3*b[j]-3*c[j]+d[j])*t3);samples.push({x:f(0),y:f(1)});}}
 const lengths=[0];for(let i=0;i<samples.length;i++)lengths.push(lengths[i]+dist(samples[i],samples[(i+1)%samples.length]));const length=lengths.at(-1);
 function point(p){const u=mod(p,1)*length;let a=0,b=samples.length;while(b-a>1){const m=(a+b)>>1;if(lengths[m]<=u)a=m;else b=m;}const t=(u-lengths[a])/(lengths[a+1]-lengths[a]);return {x:samples[a].x+(samples[(a+1)%samples.length].x-samples[a].x)*t,y:samples[a].y+(samples[(a+1)%samples.length].y-samples[a].y)*t};}
 function tangent(p){let a=point(p-.0007),b=point(p+.0007);return Math.atan2(b.y-a.y,b.x-a.x);}
 const points=Array.from({length:640},(_,i)=>point(i/640));
 const gap=(a,b)=>Math.abs(mod(a-b+.5,1)-.5);
 function nearest(pos,anchor=null,window=.042){let best={distance:Infinity};for(let i=0;i<points.length;i++){if(anchor!==null&&gap((i+.5)/points.length,anchor)>window)continue;const a=points[i],b=points[(i+1)%points.length],dx=b.x-a.x,dy=b.y-a.y,den=dx*dx+dy*dy,t=clamp(((pos.x-a.x)*dx+(pos.y-a.y)*dy)/den,0,1),x=a.x+dx*t,y=a.y+dy*t,d=Math.hypot(pos.x-x,pos.y-y);if(d<best.distance)best={distance:d,x,y,p:mod((i+t)/points.length,1)};}return best;}
 const pocketRadius=40;
 const pockets=[{id:'A',x:2410,y:145,role:'entry'},{id:'B',x:1300,y:145,role:'hazard'},{id:'C',x:190,y:145,role:'exit'},{id:'D',x:190,y:1455,role:'hazard'},{id:'E',x:1300,y:1455,role:'hazard'},{id:'F',x:2410,y:1455,role:'hazard'}].map(p=>({...p,r:pocketRadius,triggerR:pocketRadius-8,rimR:pocketRadius+5}));
 const entryPocket=pockets[0],exitPocket=pockets[2],entry=nearest(entryPocket).p,exit=nearest(exitPocket).p, outlet=point(exit+.009), transit=3.9;
 // Place checkpoint phases outside the pocket branch; all remain mandatory.
 const checkpoints=[.17,.34,.78,.88];
 const pickupPhases=[.10,.39,.76,.92];
 // Shared visual and physical radius for every ball, fixed or mobile.
 const BALL_RADIUS=40;
 const balls=[{x:1040,y:810,r:BALL_RADIUS,n:8,color:'#18222b'},{x:1195,y:755,r:BALL_RADIUS,n:3,color:'#db3c34'},{x:1120,y:885,r:BALL_RADIUS,n:1,color:'#e9bd36'},{x:1325,y:650,r:BALL_RADIUS,n:6,color:'#28a75b'},{x:1495,y:825,r:BALL_RADIUS,n:2,color:'#286dc9'},{x:1540,y:725,r:BALL_RADIUS,n:5,color:'#ed842e'},{x:960,y:1050,r:BALL_RADIUS,n:0,color:'#f5eedb'},{x:500,y:460,r:BALL_RADIUS,n:4,color:'#915dc5'},{x:2145,y:560,r:BALL_RADIUS,n:7,color:'#943b36'}];
// Physical props share geometry with the renderer. The rack has an open centre.
 const cues=[{x:1010,y:570,a:-.23,len:660,w:32,jump:false},{x:1570,y:1080,a:.98,len:580,w:34,jump:true}];
 const rack={x:1110,y:1010,a:.18,vertices:[[-164,88],[164,88],[0,-196]],w:23};
 const chalks=[{x:1040,y:390,a:.2,w:60,h:60},{x:1800,y:980,a:-.22,w:60,h:60}];
 for(const [p,side] of [[.13,-1],[.47,1],[.79,-1]]){const q=point(p),a=tangent(p);chalks.push({x:q.x-Math.sin(a)*side*69,y:q.y+Math.cos(a)*side*69,a:a+.3,w:52,h:52});}
 const world=(o,x,y)=>({x:o.x+x*Math.cos(o.a)-y*Math.sin(o.a),y:o.y+x*Math.sin(o.a)+y*Math.cos(o.a)});
 const local=(o,c)=>({x:(c.x-o.x)*Math.cos(o.a)+(c.y-o.y)*Math.sin(o.a),y:-(c.x-o.x)*Math.sin(o.a)+(c.y-o.y)*Math.cos(o.a)});
 // Three balls fit in the open rack, visibly separated from its rails.
 for(const [n,x,y] of [[8,0,-52],[1,-45,29],[0,45,29]])Object.assign(balls.find(b=>b.n===n),world(rack,x,y));
 function closest(c,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((c.x-a.x)*dx+(c.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return {x:a.x+dx*t,y:a.y+dy*t};}
 function push(c,q,r,old){let dx=c.x-q.x,dy=c.y-q.y,d=Math.hypot(dx,dy);if(d>=r)return false;if(d<.001){dx=old.x-q.x;dy=old.y-q.y;d=Math.hypot(dx,dy)||1;if(!dx&&!dy)dx=1;}const nx=dx/d,ny=dy/d;c.x=q.x+nx*(r+.2);c.y=q.y+ny*(r+.2);if((Math.cos(c.a)*nx+Math.sin(c.a)*ny)*c.speed<0)c.speed*=.55;return true;}
 function propContact(c,old){if(c.jump>0)return null;let hit=null;
  for(const o of cues){const a=local(o,old),b=local(o,c),tip=o.len/2;
   // Jump only over the thin end protruding onto the racing lane, never the butt.
   const contact=closest(b,{x:tip-175,y:0},{x:tip,y:0});
   if(o.jump&&c.jumpCd<=0&&Math.abs(c.speed)>65&&Math.hypot(b.x-contact.x,b.y-contact.y)<21&&Math.abs(b.y-a.y)>.18){c.jump=.42;c.jumpCd=.85;c.jumps=(c.jumps||0)+1;c.claw=0;return 'jump';}
   // The thin end remains traversable at low speed, with a small slowdown.
   const end=o.jump?tip-175:tip;const q=closest(c,world(o,-o.len/2,0),world(o,end,0));if(push(c,q,19+o.w/2,old))hit='cue';else if(o.jump&&Math.hypot(b.x-contact.x,b.y-contact.y)<21&&Math.abs(c.speed)<=65)c.speed*=.94;
  }
  for(let i=0;i<3;i++){const a=rack.vertices[i],b=rack.vertices[(i+1)%3];const q=closest(c,world(rack,...a),world(rack,...b));if(push(c,q,19+rack.w/2,old))hit='rack';}
  for(const o of chalks){const b=local(o,c),hx=o.w/2,hy=o.h/2;let x=clamp(b.x,-hx,hx),y=clamp(b.y,-hy,hy);if(Math.abs(b.x)<hx&&Math.abs(b.y)<hy){if(hx-Math.abs(b.x)<hy-Math.abs(b.y))x=Math.sign(b.x||1)*hx;else y=Math.sign(b.y||1)*hy;const dx=x-b.x,dy=y-b.y,d=Math.hypot(dx,dy)||1;const q=world(o,x+dx/d*19.2,y+dy/d*19.2);c.x=q.x;c.y=q.y;c.speed*=.55;hit='chalk';}else if(push(c,world(o,x,y),19,old))hit='chalk';}
  return hit;
 }
 function pocketEntry(c,pocket,old){const dx=pocket.x-old.x,dy=pocket.y-old.y;return pocket.role==='entry'&&c.p>=entry-.045&&c.p<=entry+.018&&c.speed>50&&Math.cos(c.a)*dx+Math.sin(c.a)*dy>0;}
 function canFinish(c,prev,next){return prev>.95&&next<.05&&c.flags.every(Boolean)&&c.speed>12;}
 for(const [p,side,n,color] of [[.185,-1,9,'#e3be40'],[.355,1,10,'#247bc8'],[.82,-1,11,'#c82d3c']]){const q=point(p),a=tangent(p);balls.push({x:q.x-Math.sin(a)*side*112+(n===11?-35:0),y:q.y+Math.cos(a)*side*112+(n===11?45:0),r:BALL_RADIUS,n,color});}
 const api={id:'box-di-biliardo',name:'Box di Biliardo',index:2,world:{w:W,h:H},laneHalf:half,anchors,points,length,point,tangent,nearest,gap,mod,clamp,pockets,entry,exit,outlet,transit,checkpoints,pickupPhases,balls,entryPocket,exitPocket,cues,rack,chalks,propWorld:world,propContact,pocketEntry,canFinish};
 root.TTRBoxTrack=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
