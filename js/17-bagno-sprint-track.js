/* Bagno Sprint 04 — lavabo concept, arc-length sampled geometry. */
(()=>{'use strict';const K=window.TTRCore,S=1,W=3600,H=2500,laneHalf=126;
 const map=(x,y)=>({x:x*S,y:y*S});
 const raw=[[740,390],[1060,390],[1350,405],[1630,390],[1920,405],[2170,400],[2320,555],[2290,770],[2290,1010],[2290,1180],[2520,1120],[2760,910],[2990,820],[3200,930],[3270,1170],[3150,1430],[2820,1600],[2600,1550],[2330,1530],[2300,1770],[2110,1950],[1850,1990],[1620,1790],[1530,1470],[1370,1480],[1110,1590],[860,1690],[740,1720],[495,1690],[345,1490],[330,1170],[330,860],[355,620],[510,440]];
 const anchors=raw.map(([x,y])=>{const q=map(x,y);return[q.x,q.y]});
 const samples=[];for(let i=0;i<anchors.length;i++){const [a,b,c,d]=[-1,0,1,2].map(j=>anchors[K.mod(i+j,anchors.length)]);for(let j=0;j<32;j++){const t=j/32,u=t*t,v=u*t;const f=k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*u+(-a[k]+3*b[k]-3*c[k]+d[k])*v);samples.push({x:f(0),y:f(1)});}}
 const lengths=[0];for(let i=0;i<samples.length;i++)lengths.push(lengths[i]+K.distance(samples[i],samples[(i+1)%samples.length]));const length=lengths.at(-1);
 function point(p){const u=K.mod(p,1)*length;let a=0,b=samples.length;while(b-a>1){const m=(a+b)>>1;if(lengths[m]<=u)a=m;else b=m;}const t=(u-lengths[a])/(lengths[a+1]-lengths[a]),q=samples[a],r=samples[(a+1)%samples.length];return{x:q.x+(r.x-q.x)*t,y:q.y+(r.y-q.y)*t};}
 function tangent(p){const a=point(p-.0006),b=point(p+.0006);return Math.atan2(b.y-a.y,b.x-a.x);}
 const points=Array.from({length:640},(_,i)=>point(i/640));
 function phaseAt(x,y){return K.nearestTrack(map(x,y),points).p;}
 const pickupPhases=[[1290,405],[2990,820],[1850,1990],[330,1170]].map(q=>phaseAt(...q));
 const entry=phaseAt(2600,1550),exit=phaseAt(1370,1480);
 // Wet interior bypass, north of the ordinary drain ring.
 const P=point(entry),Q=point(exit),C1=map(2210,790),C2=map(1710,1050);
 const shortcutPoint=t=>{t=K.clamp(t,0,1);const u=1-t;return{x:u*u*u*P.x+3*u*u*t*C1.x+3*u*t*t*C2.x+t*t*t*Q.x,y:u*u*u*P.y+3*u*u*t*C1.y+3*u*t*t*C2.y+t*t*t*Q.y};};
 const shortcutSamples=Array.from({length:81},(_,i)=>shortcutPoint(i/80));
 const shortcutLength=shortcutSamples.slice(1).reduce((n,q,i)=>n+K.distance(q,shortcutSamples[i]),0);
 const shortcutTangent=t=>{const a=shortcutPoint(t-.001),b=shortcutPoint(t+.001);return Math.atan2(b.y-a.y,b.x-a.x);};
 function shortcutNearest(c){let b={distance:Infinity,t:0};for(let i=0;i<80;i++){const a=shortcutSamples[i],q=shortcutSamples[i+1],dx=q.x-a.x,dy=q.y-a.y,u=K.clamp(((c.x-a.x)*dx+(c.y-a.y)*dy)/(dx*dx+dy*dy),0,1),x=a.x+u*dx,y=a.y+u*dy,d=Math.hypot(c.x-x,c.y-y);if(d<b.distance)b={x,y,distance:d,t:(i+u)/80,p:entry+(exit-entry)*(i+u)/80,shortcut:true};}return b;}
 const props=[];
 const offset=(x,y,lateral)=>{const p=phaseAt(x,y),q=point(p),a=tangent(p);return {x:q.x-Math.sin(a)*lateral,y:q.y+Math.cos(a)*lateral,p,a};};
 const water={...offset(1100,390,0),rx:148,ry:104};
 const landingWater={...offset(650,1710,0),rx:76,ry:100};
 const basinEntry=offset(2820,1600,0),drain=map(1920,1570);
 const soaps=[{...offset(1570,390,76),r:39},{...offset(1860,400,-76),r:39},{...offset(2130,390,76),r:39}];
 const cotton=[{...offset(3200,930,-65),r:48},{...offset(3270,1170,65),r:50},{...offset(3150,1430,-71),r:48}];
 const towel=offset(860,1690,0), toothbrush=offset(2323,1182,0);
 const deckStart=toothbrush.p-325/length,deckEnd=toothbrush.p+225/length;
 const deckPoints=Array.from({length:41},(_,i)=>point(deckStart+(deckEnd-deckStart)*i/40));
 // The normal lap passes over this bridge. The later shortcut crosses its footprint below.
 function upperDeck(c){if(c.onBridge||c.deskBridge)return false;const p=c.routeStableP??c.p??K.nearestTrack(c,points).p;return p>=deckStart-148/length&&p<=deckEnd+148/length&&K.distance(c,point(p))<=laneHalf+12;}
 const sections=[['Sink Start',0],['Splash Zone',water.p],['Soap Slalom',soaps[0].p],['Toothbrush Bridge',toothbrush.p],['Cotton Chaos',cotton[0].p],['Basin Dive',basinEntry.p],['Drain Ring',phaseAt(1850,1990)],['Towel Launch',towel.p],['Mirror Run',phaseAt(330,860)]];
 function inEllipse(c,z){const dx=c.x-z.x,dy=c.y-z.y,co=Math.cos(z.a),si=Math.sin(z.a);return ((dx*co+dy*si)/z.rx)**2+((-dx*si+dy*co)/z.ry)**2<=1;}
 function wet(c){return inEllipse(c,water)||inEllipse(c,landingWater);}
 const inCotton=c=>cotton.some(o=>K.distance(c,o)<o.r+20);
 window.TTRBathTrack=Object.freeze({id:'bagno-sprint',world:{w:W,h:H},laneHalf,length,anchors,points,point,tangent,pickupPhases,props,entry,exit,basinEntry,drain,shortcutPoint,shortcutSamples,shortcutLength,shortcutTangent,shortcutNearest,map,water,landingWater,soaps,cotton,towel,toothbrush,sections,deckStart,deckEnd,deckPoints,upperDeck,wet,inCotton});
})();
