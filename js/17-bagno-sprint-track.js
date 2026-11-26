/* Bagno Sprint R4: mandatory toothbrush, technical drain cut. */
(()=>{'use strict';const K=window.TTRCore,W=3600,H=2500,laneHalf=126;
 const anchors=[[720,390],[1160,390],[1630,390],[2010,410],[2190,466],[2550,578],[2910,690],[3090,746],[3130,870],[3220,1120],[3110,1340],[2850,1430],[2600,1420],[2420,1450],[2300,1800],[2110,1990],[1840,2070],[1530,1970],[1380,1660],[1200,1510],[960,1450],[740,1400],[470,1270],[330,1030],[330,720],[460,480]];
 const samples=[];for(let i=0;i<anchors.length;i++){const [a,b,c,d]=[-1,0,1,2].map(j=>anchors[K.mod(i+j,anchors.length)]);for(let j=0;j<32;j++){const t=j/32,u=t*t,v=u*t;const f=k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*u+(-a[k]+3*b[k]-3*c[k]+d[k])*v);samples.push({x:f(0),y:f(1)});}}
 const lengths=[0];for(let i=0;i<samples.length;i++)lengths.push(lengths[i]+K.distance(samples[i],samples[(i+1)%samples.length]));const length=lengths.at(-1);
 function point(p){const u=K.mod(p,1)*length;let a=0,b=samples.length;while(b-a>1){const m=(a+b)>>1;if(lengths[m]<=u)a=m;else b=m;}const t=(u-lengths[a])/(lengths[a+1]-lengths[a]),q=samples[a],r=samples[(a+1)%samples.length];return{x:q.x+(r.x-q.x)*t,y:q.y+(r.y-q.y)*t};}
 function tangent(p){const a=point(p-.0006),b=point(p+.0006);return Math.atan2(b.y-a.y,b.x-a.x);}
 const points=Array.from({length:640},(_,i)=>point(i/640));
 const phaseAt=(x,y)=>K.nearestTrack({x,y},points).p;
 const entry=phaseAt(2420,1450),exit=phaseAt(1380,1660),P=point(entry),Q=point(exit);
 // A separate curved, dry ceramic lane close to standing water. Arc-length sampling.
 const branchAnchors=[P,{x:2200,y:1300},{x:1970,y:1220},{x:1730,y:1230},{x:1500,y:1410},Q];
 const bs=[];for(let i=0;i<branchAnchors.length-1;i++){const [a,b,c,d]=[-1,0,1,2].map(j=>branchAnchors[K.clamp(i+j,0,branchAnchors.length-1)]);for(let j=0;j<32;j++){const t=j/32,u=t*t,v=u*t,f=k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*u+(-a[k]+3*b[k]-3*c[k]+d[k])*v);bs.push({x:f('x'),y:f('y')});}}bs.push(Q);
 const bl=[0];for(let i=1;i<bs.length;i++)bl.push(bl[i-1]+K.distance(bs[i-1],bs[i]));const shortcutLength=bl.at(-1);
 function shortcutPoint(t){const u=K.clamp(t,0,1)*shortcutLength;let i=0,j=bl.length-1;while(j-i>1){const m=(i+j)>>1;if(bl[m]<=u)i=m;else j=m;}const v=(u-bl[i])/(bl[j]-bl[i]||1);return{x:bs[i].x+(bs[j].x-bs[i].x)*v,y:bs[i].y+(bs[j].y-bs[i].y)*v};}
 const shortcutSamples=Array.from({length:129},(_,i)=>shortcutPoint(i/128));
 function shortcutTangent(t=0){const a=shortcutPoint(t-.003),b=shortcutPoint(t+.003);return Math.atan2(b.y-a.y,b.x-a.x);}
 function shortcutNearest(c){let best={distance:Infinity};for(let i=0;i<shortcutSamples.length-1;i++){const a=shortcutSamples[i],b=shortcutSamples[i+1],dx=b.x-a.x,dy=b.y-a.y,u=K.clamp(((c.x-a.x)*dx+(c.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1),q={x:a.x+dx*u,y:a.y+dy*u},distance=K.distance(c,q),t=(i+u)/128;if(distance<best.distance)best={...q,t,p:entry+(exit-entry)*t,distance,shortcut:true};}return best;}
 const pool={x:1840,y:1545,rx:255,ry:235};
 const brush={start:phaseAt(2010,410),end:phaseAt(3090,746),half:52};brush.a=tangent((brush.start+brush.end)/2);brush.P=point(brush.start);brush.Q=point(brush.end);brush.length=K.distance(brush.P,brush.Q);
 const onBrushPhase=p=>p>brush.start&&p<brush.end;
 // Widths of the actual toothbrush body, including tapered neck. Landings are wider.
 const brushProfile=[[0,126],[.055,126],[.11,49],[.18,52],[.32,51],[.49,48],[.64,45],[.77,45],[.83,49],[.93,49],[.965,46],[.995,126],[1,126]];
 function brushHalfAt(u){u=K.clamp(u,0,1);for(let i=1;i<brushProfile.length;i++){const [a,x]=brushProfile[i-1],[b,y]=brushProfile[i];if(u<=b){const t=(u-a)/(b-a);return x+(y-x)*t*t*(3-2*t);}}return 126;}
 function brushContact(c){const dx=brush.Q.x-brush.P.x,dy=brush.Q.y-brush.P.y,l=brush.length;const u=((c.x-brush.P.x)*dx+(c.y-brush.P.y)*dy)/(l*l);return {u,side:((c.y-brush.P.y)*dx-(c.x-brush.P.x)*dy)/l,half:brushHalfAt(u)};}
 function brushDeckHalf(u){return Math.min(brush.half,brushHalfAt(u));}
 function brushLimit(c,u){return brushDeckHalf(u)-(c.width||36)*.5;}
 // A small arcade grade: negative downhill, positive uphill. No vertical teleport.
 function gradeAt(p){const bump=(a,b)=>p>=a&&p<=b?Math.sin(Math.PI*(p-a)/(b-a)):0;return -.11*bump(entry-.028,entry+.012)+.13*bump(towel.p-towel.rx/length,towel.p+towel.rx/length);}
 function wetGrip(c){return c.jump>0?1:c.onBridge?.58:damp(c)?.82:1;}

 const props=[],objects=[];
 function offset(p,side){const q=point(p),a=tangent(p);return {...q,x:q.x-Math.sin(a)*side,y:q.y+Math.cos(a)*side,a,p};}
 function solid(type,x,y,r,extra={}){const o={type,x,y,r,solid:true,...extra};props.push(o);objects.push(o);return o;}
 const soaps=[solid('bath-soap',1440,480,43),solid('bath-soap',1890,305,43)];
 const bottles=[solid('bath-bottle',680,800,66,{h:195,color:'#f4a58f',tall:true}),solid('bath-bottle',3410,1010,54,{h:170,color:'#bf92d4',tall:true}),solid('bath-bottle',455,1810,61,{h:180,color:'#91c4a1',tall:true})];
 const sponge={...offset(phaseAt(1100,1490),-83),rx:123,ry:68};
 const towel={...offset(phaseAt(740,1400),0),rx:146,ry:144};
 const puddles=[{...offset(phaseAt(1600,390),-58),rx:112,ry:45}];
 const cotton=[{...offset(phaseAt(3220,1120),-64),rx:57,ry:42},{...offset(phaseAt(3110,1340),62),rx:63,ry:46},{...offset(phaseAt(2850,1430),-67),rx:58,ry:40}];
 const drain={x:1840,y:1545};
 function inEllipse(c,z){const dx=c.x-z.x,dy=c.y-z.y,a=z.a||0;return ((dx*Math.cos(a)+dy*Math.sin(a))/z.rx)**2+((-dx*Math.sin(a)+dy*Math.cos(a))/z.ry)**2<=1;}
 function inSoft(c,z,r=24){const dx=c.x-z.x,dy=c.y-z.y,a=z.a||0,x=Math.abs(dx*Math.cos(a)+dy*Math.sin(a)),y=Math.abs(-dx*Math.sin(a)+dy*Math.cos(a));return Math.hypot(Math.max(0,x-(z.rx-r)),Math.max(0,y-(z.ry-r)))<=r;}
 const wet=c=>inEllipse(c,pool);const damp=c=>puddles.some(z=>inEllipse(c,z));
 const pickupPhases=[.09,.23,.69,.91];
 const sections=[['Sink Start',0],['Splash Zone',phaseAt(1600,390)],['Soap Slalom',phaseAt(2130,470)],['Toothbrush Bridge',brush.start],['Cotton Chaos',phaseAt(3220,1120)],['Basin Dive',entry],['Drain Ring',phaseAt(1840,2070)],['Towel Launch',towel.p],['Mirror Run',phaseAt(330,720)]];
 window.TTRBathTrack=Object.freeze({id:'bagno-sprint',world:{w:W,h:H},laneHalf,length,anchors,points,point,tangent,pickupPhases,props,objects,soaps,bottles,pool,puddles,sponge,towel,drain,entry,exit,shortcutPoint,shortcutSamples,shortcutLength,shortcutTangent,shortcutNearest,bridgeHalf:69,gate:.10,merge:1,wet,damp,cotton,brush,onBrushPhase,brushHalfAt,brushContact,brushProfile,brushDeckHalf,brushLimit,gradeAt,wetGrip,inEllipse,inSoft,sections,upperDeck:c=>!!c.onBridge});
})();
