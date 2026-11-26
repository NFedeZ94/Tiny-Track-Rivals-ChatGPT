/* Desk Drift R3: entirely procedural geometry. World units match canvas and collisions. */
(()=>{'use strict';const K=window.TTRCore,W=3850,H=2550,laneHalf=126;
 const anchors=[[1850,1950],[1300,1950],[780,1950],[490,1830],[330,1560],[330,1170],[440,830],[700,570],[1010,470],[1350,470],[1530,570],[1510,800],[1340,980],[1320,1170],[1510,1290],[1770,1210],[1930,980],[2000,790],[2180,700],[2350,700],[2470,465],[2640,340],[2850,340],[3030,465],[3140,700],[3300,700],[3470,850],[3500,1110],[3350,1350],[3030,1370],[2820,1520],[2820,1740],[2670,1900],[2330,1950]];
 const samples=[];for(let i=0;i<anchors.length;i++){const [a,b,c,d]=[-1,0,1,2].map(j=>anchors[K.mod(i+j,anchors.length)]);for(let j=0;j<32;j++){const t=j/32,u=t*t,v=u*t;const f=k=>.5*(2*b[k]+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*u+(-a[k]+3*b[k]-3*c[k]+d[k])*v);samples.push({x:f(0),y:f(1)});}}
 const lengths=[0];for(let i=0;i<samples.length;i++)lengths.push(lengths[i]+K.distance(samples[i],samples[(i+1)%samples.length]));const length=lengths.at(-1);
 function point(p){const u=K.mod(p,1)*length;let a=0,b=samples.length;while(b-a>1){const m=(a+b)>>1;if(lengths[m]<=u)a=m;else b=m;}const t=(u-lengths[a])/(lengths[a+1]-lengths[a]),q=samples[a],r=samples[(a+1)%samples.length];return{x:q.x+(r.x-q.x)*t,y:q.y+(r.y-q.y)*t};}
 function tangent(p){const a=point(p-.0006),b=point(p+.0006);return Math.atan2(b.y-a.y,b.x-a.x);}
 const points=Array.from({length:640},(_,i)=>point(i/640));
 const phaseAt=(x,y)=>K.nearestTrack({x,y},points).p;
 const entry=phaseAt(2350,700),exit=phaseAt(3140,700),P=point(entry),Q=point(exit);
 const shortcutPoint=t=>({x:P.x+(Q.x-P.x)*K.clamp(t,0,1),y:P.y+(Q.y-P.y)*K.clamp(t,0,1)});
 const shortcutSamples=Array.from({length:81},(_,i)=>shortcutPoint(i/80));
 const shortcutLength=K.distance(P,Q),shortcutTangent=()=>Math.atan2(Q.y-P.y,Q.x-P.x);
 function shortcutNearest(c){const dx=Q.x-P.x,dy=Q.y-P.y,t=K.clamp(((c.x-P.x)*dx+(c.y-P.y)*dy)/(dx*dx+dy*dy),0,1),q=shortcutPoint(t);return {...q,t,p:entry+(exit-entry)*t,distance:K.distance(c,q),shortcut:true};}
 const props=[];const objects=[];
 // Rounded rectangular or cylindrical stationery; overlapping circles match silhouette.
 function prop(type,x,y,a,len,w){objects.push({type,x,y,a,len,w});const r=w/2,n=Math.max(2,Math.ceil((len-w)/r)+1);for(let i=0;i<n;i++){const u=(i/(n-1)-.5)*(len-w);props.push({type,x:x+Math.cos(a)*u,y:y+Math.sin(a)*u,r,solid:true});}}
 prop('desk-highlighter',1225,690,-.7,270,76);
 prop('desk-eraser',1635,1090,-.40,145,72);
 prop('desk-pencil',2050,1450,-.19,440,36);
 prop('desk-eraser',3290,1210,-.10,140,65);
 // Stationery placed on the edge of the legal driving corridor; the centre stays open.
 function offset(p,side){const q=point(p),a=tangent(p);return {...q,x:q.x-Math.sin(a)*side,y:q.y+Math.cos(a)*side,a,p};}
 for(const [type,p,side,l,w] of [['desk-pencil',.105,93,174,26],['desk-eraser',.345,-97,82,44],['desk-highlighter',.805,94,104,39]]){
  const o=offset(p,side);if(!props.some(v=>K.distance(o,v)<v.r+l/2+15)&&shortcutNearest(o).distance>bridgeHalfValue()+80)prop(type,o.x,o.y,o.a+.16,l,w);
 }
 function bridgeHalfValue(){return 78;}
 const papers=[{...offset(.059,-43),rx:92,ry:43},{...offset(.88,48),rx:74,ry:49}];
 const clips=[],count=Math.floor(length/120);
 for(let i=1;i<count;i++){const p=i/count;if(p<.016||p>.984)continue;
  for(const side of [-1,1]){const o=offset(p,side*(laneHalf+5));
   if(shortcutNearest(o).distance<145||K.nearestTrack(o,points).distance<laneHalf-10||props.some(v=>K.distance(o,v)<v.r+34)||clips.some(v=>K.distance(o,v)<53))continue;
   const clip={...o,type:'desk-clip',r:18,solid:true};clips.push(clip);props.push(clip);
  }
 }
 function paperContact(c){return papers.some(o=>{const dx=c.x-o.x,dy=c.y-o.y;return Math.abs(dx*Math.cos(o.a)+dy*Math.sin(o.a))<=o.rx&&Math.abs(-dx*Math.sin(o.a)+dy*Math.cos(o.a))<=o.ry;});}
 const pickupPhases=[.10,.31,.74,.91];
 window.TTRDeskTrack=Object.freeze({id:'desk-drift',world:{w:W,h:H},laneHalf,length,anchors,points,point,tangent,pickupPhases,props,objects,clips,papers,paperContact,entry,exit,shortcutPoint,shortcutSamples,shortcutLength,shortcutTangent,shortcutNearest,bridgeHalf:78,gate:.07,merge:.98});
})();
