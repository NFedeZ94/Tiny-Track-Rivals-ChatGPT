/* TTR .159: tick-based playback and bounded client-side visual correction.
 * No authoritative game state is written here. All times are monotonic ms. */
(()=>{'use strict';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), angle=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
function timeline(){return {offset:null,jitter:0,delay:100,lastTick:null,lastAt:null,play:null,gaps:0,duplicates:0,lateness:[],gapExcess:[],underruns:0,heldFrames:0};}
function observe(t,tick,now){if(!Number.isSafeInteger(tick)||tick<0||!Number.isFinite(now))return false;if(t.lastTick!==null&&tick<=t.lastTick){t.duplicates++;return false;}
 const ms=tick*1000/60,offset=now-ms;
 if(t.lastTick!==null){const actual=now-t.lastAt,expected=(tick-t.lastTick)*1000/60;t.jitter=.85*t.jitter+.15*Math.abs(actual-expected);if(actual>150)t.gaps++;append(t.gapExcess,Math.max(0,actual-50),40);append(t.lateness,Math.max(0,offset-t.offset),40);}
 t.offset=t.offset===null?offset:Math.min(offset,t.offset+(offset-t.offset>180?6:.25));
 // An EWMA alone forgets a burst too quickly. A short rolling window also
 // remembers late arrivals and skipped server deadlines. Never grow without limit.
 const target=clamp(75+Math.max(2.5*t.jitter,quantile(t.lateness,.90)||0,quantile(t.gapExcess,.90)||0),85,220);
 t.delay+=clamp(target-t.delay,-1.5,18);t.lastTick=tick;t.lastAt=now;return true;}
function playback(t,now,dt){if(t.offset===null)return null;const latest=t.lastTick*1000/60,target=now-t.offset-t.delay,limit=latest+75;
 if(t.play===null)t.play=Math.min(target,limit);else{const step=Math.max(0,Math.min(100,dt*1000)),delta=target-t.play,advance=clamp(step*(1+clamp(delta*.004,-.45,.25)),0,step*1.25);const prev=t.play;t.play=Math.max(prev,Math.min(limit,prev+advance));if(step>0&&t.play<=prev+1e-6)t.heldFrames++;}
 if(t.play>latest)t.underruns++;return t.play;}
function localPlayback(t,now,rtt){if(t.lastTick===null)return null;return t.lastTick*1000/60+clamp(now-t.lastAt+Math.min(50,Math.max(0,(rtt??90)/2)),0,75);}
function pose(frames,target){if(!frames?.length||target===null)return null;while(frames.length>2&&frames[1].ms<=target)frames.shift();const a=frames[0],b=frames[1];if(!b||target<=a.ms){if(b||target<=a.ms)return a;}if(b&&target<=b.ms){const u=clamp((target-a.ms)/(b.ms-a.ms||1),0,1);return {x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u,a:a.a+angle(b.a,a.a)*u,s:a.s+(b.s-a.s)*u,visual:blendVisual(a.visual,b.visual,u)};}
 const l=frames[frames.length-1],dt=clamp((target-l.ms)/1000,0,.075);return {x:l.x+(Math.cos(l.a)*l.s+(l.vx||0))*dt,y:l.y+(Math.sin(l.a)*l.s+(l.vy||0))*dt,a:l.a,s:l.s,visual:l.visual};}
function blendVisual(a,b,u){if(!a||!b)return a||b;const out={...(u<.5?a:b)};for(const k of ['jump','wheelPhase','bridgeExitVisual','tableFalling','boxTransit','oilSpin','boost'])if(Number.isFinite(a[k])&&Number.isFinite(b[k]))out[k]=a[k]+(b[k]-a[k])*u;return out;}
function correction(visual,base){return {x:visual.x-base.x,y:visual.y-base.y,a:angle(visual.a,base.a)};}
function decay(c,dt,maxSpeed=280){const elapsed=Math.min(.12,Math.max(0,dt)),alpha=1-Math.exp(-elapsed*11),mag=Math.hypot(c.x,c.y),move=Math.min(alpha*mag,maxSpeed*elapsed);if(mag>1e-7){const k=1-move/mag;c.x*=k;c.y*=k;}else{c.x=0;c.y=0;}c.a-=clamp(c.a*alpha,-3*elapsed,3*elapsed);return c;}
// Rebase at the same playback time when a previously extrapolated pose changes.
// Keep the visual position continuous, then dissipate the error on render frames.
function rebase(frames,sample,target,oldCorrection){if(!frames.length||target===null)return null;const before=pose(frames.slice(),target),after=pose([...frames,sample],target);if(!before||!after)return null;const old=oldCorrection||{x:0,y:0,a:0};return correction({x:before.x+old.x,y:before.y+old.y,a:before.a+old.a},after);}

function quantile(a,p){if(!a.length)return null;const b=a.slice().sort((x,y)=>x-y);return +b[Math.min(b.length-1,Math.max(0,Math.ceil(b.length*p)-1))].toFixed(2);}
function append(a,v,limit=512){if(!Number.isFinite(v))return;a.push(v);if(a.length>limit)a.shift();}
window.TTROnlineNet=Object.freeze({timeline,observe,playback,localPlayback,pose,correction,decay,rebase,quantile,append});
})();
