/* Desk Drift 03 — independent, arc-length sampled graybox geometry. */
(()=>{'use strict';const K=window.TTRCore,S=2.8,W=3853,H=2646,laneHalf=126;
 const map=(x,y)=>({x:(x-16)*S,y:(y-95)*S});
 const raw=[[595,780],[430,780],[265,780],[190,768],[132,720],[102,652],[96,560],[113,472],[151,400],[216,332],[286,285],[364,259],[437,255],[515,255],[595,237],[665,232],[720,255],[742,300],[711,348],[659,391],[626,438],[625,484],[655,513],[705,519],[785,496],[866,465],[904,428],[910,380],[907,339],[930,308],[977,291],[1040,290],[1110,310],[1190,341],[1260,375],[1303,414],[1312,441],[1291,465],[1253,473],[1200,458],[1140,447],[1087,465],[1049,505],[1040,550],[1055,595],[1082,644],[1098,688],[1087,734],[1045,765],[983,780],[850,780],[710,780]];
 const anchors=raw.map(([x,y])=>{const q=map(x,y);return[q.x,q.y]});
 const samples=[];for(let i=0;i<anchors.length;i++){const [a,b,c,d]=[-1,0,1,2].map(j=>anchors[K.mod(i+j,anchors.length)]);for(let j=0;j<32;j++){const t=j/32,u=t*t,v=u*t;const f=k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*u+(-a[k]+3*b[k]-3*c[k]+d[k])*v);samples.push({x:f(0),y:f(1)});}}
 const lengths=[0];for(let i=0;i<samples.length;i++)lengths.push(lengths[i]+K.distance(samples[i],samples[(i+1)%samples.length]));const length=lengths.at(-1);
 function point(p){const u=K.mod(p,1)*length;let a=0,b=samples.length;while(b-a>1){const m=(a+b)>>1;if(lengths[m]<=u)a=m;else b=m;}const t=(u-lengths[a])/(lengths[a+1]-lengths[a]),q=samples[a],r=samples[(a+1)%samples.length];return{x:q.x+(r.x-q.x)*t,y:q.y+(r.y-q.y)*t};}
 function tangent(p){const a=point(p-.0006),b=point(p+.0006);return Math.atan2(b.y-a.y,b.x-a.x);}
 const points=Array.from({length:640},(_,i)=>point(i/640));
 function phaseAt(x,y){return K.nearestTrack(map(x,y),points).p;}
 const pickupPhases=[[420,255],[905,428],[911,778]].map(q=>phaseAt(...q));
 const entry=phaseAt(977,291),exit=phaseAt(1140,447);
 // Short route follows the ruler then lands on the returning arm, omitting the far right hook.
 const P=point(entry),Q=point(exit),C1=map(1220,295),C2=map(1300,485);
 const shortcutPoint=t=>{t=K.clamp(t,0,1);const u=1-t;return{x:u*u*u*P.x+3*u*u*t*C1.x+3*u*t*t*C2.x+t*t*t*Q.x,y:u*u*u*P.y+3*u*u*t*C1.y+3*u*t*t*C2.y+t*t*t*Q.y};};
 const shortcutSamples=Array.from({length:81},(_,i)=>shortcutPoint(i/80));
 const shortcutLength=shortcutSamples.slice(1).reduce((n,q,i)=>n+K.distance(q,shortcutSamples[i]),0);
 const shortcutTangent=t=>{const a=shortcutPoint(t-.001),b=shortcutPoint(t+.001);return Math.atan2(b.y-a.y,b.x-a.x);};
 function shortcutNearest(c){let b={distance:Infinity,t:0};for(let i=0;i<80;i++){const a=shortcutSamples[i],q=shortcutSamples[i+1],dx=q.x-a.x,dy=q.y-a.y,u=K.clamp(((c.x-a.x)*dx+(c.y-a.y)*dy)/(dx*dx+dy*dy),0,1),x=a.x+u*dx,y=a.y+u*dy,d=Math.hypot(c.x-x,c.y-y);if(d<b.distance)b={x,y,distance:d,t:(i+u)/80,p:entry+(exit-entry)*(i+u)/80,shortcut:true};}return b;}
 // Obstacles already painted in the concept art. Chain of small round colliders rather than one oversized circle.
 const props=[];const artworkScale=W/1000;
 function stationery(type,ax,ay,bx,by,r,n){for(let i=0;i<n;i++){const u=n===1?0:i/(n-1);props.push({type,x:(ax+(bx-ax)*u)*artworkScale,y:(ay+(by-ay)*u)*artworkScale,r:r*artworkScale,solid:true});}}
 stationery('desk-highlighter',382,207,450,157,13,5);
 stationery('desk-eraser',517,245,578,219,11,5);
 stationery('desk-pencil',523,361,665,318,6,8);
 window.TTRDeskTrack=Object.freeze({id:'desk-drift',world:{w:W,h:H},laneHalf,length,anchors,points,point,tangent,pickupPhases,props,entry,exit,shortcutPoint,shortcutSamples,shortcutLength,shortcutTangent,shortcutNearest,map});
})();
