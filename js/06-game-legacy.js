

/* Tiny Track Rivals — indipendent playable 2.5D HTML Canvas vertical slice. MIT-like original project code. */
(()=>{'use strict';
const K=window.TTRCore,{clamp,mod,angleDiff,distance,trackPoint,tangent,nearestTrack,nearestTrackWindow,junctionPhaseHop,phaseGap,circleRotatedRect,clawTarget,jamHit,profiles,pickupCount,rampEntryVisual,rampLaunch,resolveCarContacts,resolveCarObstacle,resolveBorderContact,stepDriveSpeed,pickupSegments,pickupType,offTrackDynamics,wideCornerRecovery,spoonContactZone,insideTrackLoop,shortcutViolation,illegalRouteGain,mugBendGate,finishGateCrossing,finishLinePlane,edgeOfTable,stuckRecoveryStep,oilHit,clawPullStep,bridgeLaneViolation,WORLD_W,WORLD_H,TRACK_LENGTH,LANE_HALF,shortcutFrom,shortcutTo,shortcutPoint,shortcutSamples,shortcutNearest,nearestCourse,sectionNames,sectionRanges,ttrCalibratedProfile}=K;
const {drawKnife,drawRamp}=window.TTRGameParts;
const {drawClawCable,renderOil,renderEffect}=window.TTRGameEffectsVisuals;
const $=id=>document.getElementById(id);
const canvas=$('game'),g=canvas.getContext('2d',{alpha:false}),mini=$('mini'),mg=mini.getContext('2d');
let sw=0,sh=0,dpr=0,scale=1,camX=WORLD_W/2,camY=WORLD_H/2,world=null;
let elimCameraId=null,elimCameraProgress=0,elimFocusWeight=0,elimCandidateId=null,elimCandidateSince=0,renderDelta=1/60;
let elimGridCamera={x:WORLD_W/2,y:WORLD_H/2};
let race=null,lastRaceSettings=null,frameTime=performance.now(),clock=0,lastHint=0,hint='',resultsMusicTimer=null;
const SND=window.TTRSound;
const points=Array.from({length:520},(_,i)=>trackPoint(i/520));
const controls={left:false,right:false,gas:false,brake:false};

// TTR Online Phase 1: real WebSocket lobby + relay, simulation on the host device.
// Not authoritative physics/anti-cheat. Server never receives private chat or location.
let onlineSocket=null,onlineSession=null,onlineRemoteInputs={},onlineLatest=null,onlineLastSend=0,onlineLastSnapshot=0,onlineFinishDeadline=0;
// v0.13.6.37: client-side VISUAL prediction and timestamped snapshot interpolation.
// Authoritative results, collision, pickups, lap count and respawn remain host-owned.
// No changes required to the existing v0.13.6.35 WebSocket server/protocol.
const TTR_NET={inputIntervalMs:40,snapshotIntervalMs:50,bufferDelayMs:105,maxExtrapolateMs:55};
let onlineLastInputSignature='',onlineNetStats={snapshots:0,lastArrival:0,arrivalGapMs:null,jitterMs:null,maxCorrection:0};
function onlineResetSmooth(){onlineLastInputSignature='';onlineNetStats={snapshots:0,lastArrival:0,arrivalGapMs:null,jitterMs:null,maxCorrection:0};}
// Independent application RTT over WebSocket, measured client->Render->client.
// Not an estimate of host simulation latency. Missing replies remain unknown, never 0 ms.
let onlineRttMs=null,onlinePingSeq=0,onlinePingPending=null,onlineNextPing=0,onlinePingSupported=false;
function onlineRttDisplay(){
 const label=$('onlineLatency');if(!label)return;
 label.textContent=onlineRttMs==null?'RTT — ms':`RTT ${Math.round(onlineRttMs)} ms`;
 label.dataset.quality=onlineRttMs==null?'waiting':onlineRttMs<90?'good':onlineRttMs<180?'high':'poor';
}
function onlinePingTick(now){
 if(!onlinePingSupported||!onlineSocket||onlineSocket.readyState!==WebSocket.OPEN)return;
 if(onlinePingPending&&now-onlinePingPending.sent>6000){onlinePingPending=null;onlineRttMs=null;onlineRttDisplay();}
 if(now<onlineNextPing||onlinePingPending)return;
 const seq=++onlinePingSeq;onlinePingPending={seq,sent:now};onlineNextPing=now+3000;
 onlineSend({type:'ping',seq});
}
const onlineCarNames=['Scatto GT','Tuono V8','Polvere X','Lampo ZX','Aero R'];
function onlineStatus(text){const el=$('onlineStatus');if(el)el.textContent=String(text);}
function onlineSend(obj){if(onlineSocket?.readyState===WebSocket.OPEN)onlineSocket.send(JSON.stringify(obj));}
function onlineCloseConnection(){
 const sock=onlineSocket;onlineSocket=null;onlineSession=null;onlineLatest=null;onlineRemoteInputs={};
 onlinePingPending=null;onlineRttMs=null;onlineNextPing=0;onlinePingSupported=false;onlineRttDisplay();onlineResetSmooth();
 if(sock){if(sock.readyState===WebSocket.OPEN)try{sock.send(JSON.stringify({type:'leave'}))}catch(e){};sock.onclose=null;sock.onmessage=null;sock.close();}
 $('onlineGameTag').style.display='none';
}
function onlineOpenPanel(){
 $('onlineModal').hidden=false;
 $('onlineServer').value=localStorage.getItem('ttr_online_server')||'';
 $('onlineName').value=localStorage.getItem('ttr_online_name')||'';
 $('onlineCar').value=String(selectedCar);
 onlineRefreshRoom();
}
function onlineRefreshRoom(){
 const r=onlineSession,body=$('onlineMembers');body.replaceChildren();
 $('onlineRoomCode').textContent=r?.code?`SALA ${r.code}`:'';
 $('onlineCopy').hidden=!r?.code;
 $('onlineReady').disabled=!r||r.started;
 $('onlineStart').disabled=!r||!r.host||r.started||r.members.filter(Boolean).length<2||!r.members.filter(Boolean).every(m=>m.ready);
 $('onlineLeave').disabled=!r;
 if(!r)return;
 for(const m of r.members.filter(Boolean)){
  const chip=document.createElement('span');chip.className='online-member'+(m.ready?' ready':'');
  chip.textContent=`${m.slot+1}. ${m.name}${m.host?' ★':''} · ${onlineCarNames[m.car]} ${m.ready?'✓':''}`;
  body.appendChild(chip);
 }
 const me=r.members[r.slot];$('onlineReady').textContent=me?.ready?'✓ Pronto — annulla':'✓ Sono pronto';
 onlineStatus(`${r.members.filter(Boolean).length}/${r.capacity} giocatori reali · ${r.public?'pubblica':'privata'}. CPU riempiranno i posti liberi.`);
}
function onlineConnect(kind){
 if(onlineSocket&&onlineSocket.readyState<2){onlineStatus('Esci prima dalla sala corrente.');return;}
 let url=$('onlineServer').value.trim();
 if(url.startsWith('https://'))url='wss://'+url.slice(8);
 if(url.startsWith('http://'))url='ws://'+url.slice(7);
 if(!/^wss?:\/\/[^/\s]+(?:\/.*)?$/i.test(url)){onlineStatus('Inserisci un indirizzo WebSocket valido: wss://.../ws');return;}
 if(location.protocol==='https:'&&!url.startsWith('wss://')){onlineStatus('Su GitHub Pages serve un server WSS (connessione cifrata).');return;}
 let name=$('onlineName').value.trim().slice(0,18)||'Pilota';
 try{localStorage.setItem('ttr_online_server',url);localStorage.setItem('ttr_online_name',name);}catch(e){}
 const request={type:kind,name,car:Number($('onlineCar').value),capacity:Number($('onlineCapacity').value)};
 if(kind==='join')request.code=$('onlineCode').value.trim().toUpperCase();
 if(kind==='join'&&!/^[A-Z0-9]{6}$/.test(request.code)){onlineStatus('Inserisci il codice della sala (6 caratteri).');return;}
 onlineCloseConnection();onlineStatus('Connessione al server...');
 onlineRttMs=null;onlinePingPending=null;onlineNextPing=0;onlinePingSupported=false;onlineRttDisplay();
 let sock;
 try{sock=new WebSocket(url);}catch(e){onlineStatus('Indirizzo WebSocket non valido.');return;}
 onlineSocket=sock;
 sock.onopen=()=>{onlineStatus('Server collegato. Accesso alla sala...');onlineSend(request);onlineNextPing=performance.now()+450;};
 sock.onmessage=e=>{let d;try{d=JSON.parse(e.data)}catch(_){return;}onlineOnMessage(d)};
 sock.onerror=()=>onlineStatus('Server non raggiungibile. Controlla l’URL e che sia pubblicato con WSS.');
 sock.onclose=()=>{if(onlineSocket!==sock)return;const inGame=race?.mode==='online';onlineSocket=null;onlineSession=null;onlinePingPending=null;onlineRttMs=null;onlinePingSupported=false;onlineRttDisplay();onlineRefreshRoom();if(inGame){race=null;mainMenu();onlineStatus('Connessione interrotta durante la gara.');}else onlineStatus('Connessione chiusa.');};
}
function onlineOnMessage(d){
 if(d.type==='hello'){onlinePingSupported=Array.isArray(d.features)&&d.features.includes('rtt_ping');return;}
 if(d.type==='pong'){
  if(onlinePingPending && d.seq===onlinePingPending.seq){
   const elapsed=performance.now()-onlinePingPending.sent;
   if(elapsed>=0&&elapsed<6000){onlineRttMs=onlineRttMs==null?elapsed:onlineRttMs*.6+elapsed*.4;onlineRttDisplay();}
   onlinePingPending=null;
  }
  return;
 }
 if(d.type==='error'){onlineStatus(d.message||'Errore di rete');return;}
 if(d.type==='joined'){onlineSession={slot:d.slot,code:d.code,host:!!d.host,public:false,capacity:4,members:[],started:false};onlineRefreshRoom();return;}
 if(d.type==='room_state'&&onlineSession){
  Object.assign(onlineSession,{code:d.code,public:d.public,capacity:d.capacity,started:d.started});
  const arr=Array(d.capacity).fill(null);
  for(const m of d.members)arr[m.slot]=m;
  onlineSession.members=arr;
  onlineRefreshRoom();return;
 }
 if(d.type==='player_left'&&onlineSession){
  if(onlineSession.members[d.slot])onlineSession.members[d.slot]=null;
  delete onlineRemoteInputs[d.slot];
  onlineStatus('Un giocatore si è disconnesso: la CPU prende il suo posto.');return;
 }
 if(d.type==='race_start'&&onlineSession){
  onlineSession.started=true;onlineSession.members=Array(d.capacity).fill(null);
  for(const m of d.members)onlineSession.members[m.slot]=m;
  onlineSession.capacity=d.capacity;
  onlineLatest=null;onlineLastSnapshot=0;onlineLastSend=0;onlineResetSmooth();
  $('onlineModal').hidden=true;
  $('onlineGameLabel').textContent=`ONLINE · ${onlineSession.code}`;
  $('onlineGameRole').textContent=onlineSession.host?'HOST':'P'+(onlineSession.slot+1);
  onlineRttDisplay();$('onlineGameTag').style.display='flex';
  SND.unlock();openCircuitLoading('online');return;
 }
 if(d.type==='remote_input'&&onlineSession?.host&&race?.mode==='online'){
  onlineRemoteInputs[d.slot]={steer:d.steer,gas:d.gas,brake:d.brake,at:performance.now()};return;
 }
 if(d.type==='remote_action'&&onlineSession?.host&&race?.mode==='online'){
  if(d.action==='item'&&onlineSession.members[d.slot])useItem(race.cars[d.slot]);return;
 }
 if(d.type==='snapshot'&&onlineSession&&!onlineSession.host){
  onlineApplySnapshot(d.state);return;
 }
 if(d.type==='finish'&&onlineSession&&!onlineSession.host&&race?.mode==='online'&&!race.finished){
  race.time=Math.max(0,Number(d.time)||race.time);
  for(const res of d.results||[]){const c=race.cars[res.id];if(c){c.done=!!res.done;c.finishTime=res.finishTime??null;}}
  race.finished=true;showResults();return;
 }
 if(d.type==='room_closed'){
  onlineCloseConnection();if(race?.mode==='online'){race=null;mainMenu();}else {$('onlineModal').hidden=false;onlineRefreshRoom();}onlineStatus(d.reason||'Sala chiusa');
 }
}
function onlineLocalInput(){
 const steer=(controls.right||keys.ArrowRight||keys.KeyD?1:0)-(controls.left||keys.ArrowLeft||keys.KeyA?1:0);
 return {steer,gas:race.auto||controls.gas||keys.ArrowUp||keys.KeyW,brake:!!(controls.brake||keys.ArrowDown||keys.KeyS)};
}
function onlineHostInput(c){
 if(!onlineSession?.members[c.id])return null; // vacant slot => CPU
 const v=onlineRemoteInputs[c.id];
 return v&&performance.now()-v.at<500?{steer:v.steer,gas:v.gas,brake:v.brake}:{steer:0,gas:false,brake:true};
}
// Send steering changes at the INPUT EVENT rather than waiting for a future frame.
// Periodic refresh at 25Hz also recovers when a touch or packet is lost.
function onlineGuestSendInput(change=false){
 if(!race||race.mode!=='online'||!onlineSession||onlineSession.host||race.finished||!onlineSocket||onlineSocket.readyState!==WebSocket.OPEN)return;
 const now=performance.now(),input=onlineLocalInput();
 const sig=`${input.steer}|${+input.gas}|${+input.brake}`;
 if(change){if(sig===onlineLastInputSignature||now-onlineLastSend<29)return;}
 else if(now-onlineLastSend<TTR_NET.inputIntervalMs)return;
 onlineLastSend=now;onlineLastInputSignature=sig;onlineSend({type:'input',...input});
}
function onlineApplySnapshot(state){
 if(!race||race.mode!=='online'||!state||!Array.isArray(state.cars))return;
 const now=performance.now();
 if(onlineNetStats.lastArrival){
  const gap=now-onlineNetStats.lastArrival;
  onlineNetStats.arrivalGapMs=gap;
  const delta=Math.abs(gap-TTR_NET.snapshotIntervalMs);
  onlineNetStats.jitterMs=onlineNetStats.jitterMs==null?delta:(onlineNetStats.jitterMs*.83+delta*.17);
 }
 onlineNetStats.lastArrival=now;onlineNetStats.snapshots++;
 onlineLatest=state;race.time=Number(state.time)||0;
 const prevCount=race.countdown;race.countdown=Number(state.countdown)||0;
 if(prevCount>0&&race.countdown<=0)SND.music('race');
 for(const r of state.cars){const c=race.cars[r.i];if(!c)continue;
  // Invalid or malformed packets must not corrupt the canvas transform.
  if(!Number.isFinite(r.x)||!Number.isFinite(r.y)||!Number.isFinite(r.a)||!Number.isFinite(r.s))continue;
  const sample={x:r.x,y:r.y,a:r.a,s:r.s,at:now,steer:r.st||0};
  const frames=c.netFrames||(c.netFrames=[]),prior=frames.length?frames[frames.length-1]:null;
  const jumpDistance=prior?Math.hypot(sample.x-prior.x,sample.y-prior.y):0;
  const elapsed=prior?(now-prior.at)/1000:0;
  const cutRespawn=(r.sr||0)>(c.shortcutRespawns||0);
  // A real respawn/teleport must snap immediately, never interpolate across the table.
  const teleport=cutRespawn||(prior&&jumpDistance>180&&jumpDistance>(Math.max(Math.abs(sample.s),Math.abs(prior.s))*elapsed*1.8+65));
  if(teleport){frames.length=0;c.netPrediction=null;c.x=sample.x;c.y=sample.y;c.a=sample.a;}
  if(c.netX===undefined){c.x=sample.x;c.y=sample.y;c.a=sample.a;}
  frames.push(sample);if(frames.length>12)frames.shift();
  c.netX=sample.x;c.netY=sample.y;c.netA=sample.a;c.netAt=now;c.netSteer=sample.steer;
  c.speed=r.s;c.p=r.p;c.lastP=r.p;c.lapsCompleted=r.l;c.jump=r.j;c.jumpTotal=r.jt;c.boost=r.bo;
  c.item=r.it;c.done=r.d;c.finishTime=r.ft??null;c.tableFalling=r.tf;c.tableSpin=r.ts;c.tableFallImpact=r.tfi;
  c.oilSpin=r.os;c.oilSpinDir=r.od;c.wheelPhase=r.wp;c.hitYaw=r.hy;c.steer=r.st;c.skidVX=r.svx;c.skidVY=r.svy;
  // A network-authoritative recovery is also silent: never show penalty text.
  c.shortcutRespawns=r.sr??c.shortcutRespawns??0;c.lastPenaltyReason=r.pe||'';
 }
 if(Array.isArray(state.pickups))race.pickups.forEach((p,i)=>{p.cool=state.pickups[i]??p.cool});
 if(Array.isArray(state.oils))race.oils=state.oils;
 hud();syncAudio();
}
function onlineRemotePose(c,now){
 const frames=c.netFrames;
 if(!frames||!frames.length)return null;
 const target=now-TTR_NET.bufferDelayMs;
 // A delay buffer turns irregular network arrivals into evenly paced animation.
 while(frames.length>2&&frames[1].at<=target)frames.shift();
 let left=frames[0],right=frames.length>1?frames[1]:null;
 if(!right||target<=left.at)return left;
 if(target<=right.at){
  const u=clamp((target-left.at)/(right.at-left.at||1),0,1);
  return {x:left.x+(right.x-left.x)*u,y:left.y+(right.y-left.y)*u,a:left.a+angleDiff(right.a,left.a)*u};
 }
 // Never extrapolate indefinitely when packets are lost or Safari is throttled.
 const last=frames[frames.length-1];
 const seconds=Math.min(TTR_NET.maxExtrapolateMs,Math.max(0,target-last.at))/1000;
 return {x:last.x+Math.cos(last.a)*last.s*seconds,y:last.y+Math.sin(last.a)*last.s*seconds,a:last.a};
}
function onlinePredictLocal(c,dt,now){
 // Prediction is a client-side RENDERING AID only. The host sends the true result.
 const latestAge=now-(c.netAt||now);
 const ctrl=onlineLocalInput();
 const pred=c.netPrediction||(c.netPrediction={x:c.netX,y:c.netY,a:c.netA,speed:c.speed});
 const moving=latestAge<350&&!c.done&&race.countdown<=0&&!(c.tableFalling>0);
 if(moving){
  const surface=offTrackDynamics(nearestCourse(pred,points).distance);
  pred.speed=stepDriveSpeed(pred.speed,ctrl,dt,{max:c.profile.max,acc:c.profile.acc},c.boost>0);
  if(surface.outside)pred.speed*=Math.max(.93,1-(1-surface.speedFactor)*dt*1.9);
  const turn=c.profile.turn*(.24+clamp(Math.abs(pred.speed)/160,0,1)*.76)*surface.grip;
  pred.a+=ctrl.steer*turn*(pred.speed>=0?1:-.7)*dt;
  pred.x+=Math.cos(pred.a)*pred.speed*dt;
  pred.y+=Math.sin(pred.a)*pred.speed*dt;
 }else if(latestAge>=350){pred.speed*=Math.exp(-dt*8);}
 // The newest server position is old by network transit time. Reconcile towards
 // a short extrapolation, not the raw (already outdated) last packet.
 const lead=Math.min(.16,Math.max(.035,(onlineRttMs??95)/2000+.018)+Math.min(.095,Math.max(0,latestAge)/1000));
 const serverTurn=c.netSteer*c.profile.turn*(.24+clamp(Math.abs(c.speed)/160,0,1)*.76);
 const expectedAngle=c.netA+serverTurn*lead;
 const expectedX=c.netX+Math.cos(c.netA+serverTurn*lead*.5)*c.speed*lead;
 const expectedY=c.netY+Math.sin(c.netA+serverTurn*lead*.5)*c.speed*lead;
 const error=Math.hypot(expectedX-pred.x,expectedY-pred.y);
 onlineNetStats.maxCorrection=Math.max(onlineNetStats.maxCorrection,error);
 if(error>195||!Number.isFinite(error)){
  pred.x=expectedX;pred.y=expectedY;pred.a=expectedAngle;pred.speed=c.speed;
 }else{
  const gain=1-Math.exp(-dt*3.3);
  pred.x+=(expectedX-pred.x)*gain;pred.y+=(expectedY-pred.y)*gain;
  // Resist overriding immediate user steering with stale, remotely observed headings.
  pred.a+=angleDiff(expectedAngle,pred.a)*(1-Math.exp(-dt*1.4));
  pred.speed+=(c.speed-pred.speed)*(1-Math.exp(-dt*2.0));
 }
 c.x=pred.x;c.y=pred.y;c.a=pred.a;
}
function onlineGuestStep(dt){
 if(!race||race.mode!=='online')return;
 if(!race.finished){
  const now=performance.now();
  for(const c of race.cars){
   if(c.netX===undefined)continue;
   if(c===race.player){onlinePredictLocal(c,dt,now);continue;}
   const pose=onlineRemotePose(c,now);if(!pose)continue;
   c.x=pose.x;c.y=pose.y;c.a=pose.a;
  }
  onlineGuestSendInput(false);
 }
 syncAudio();
}
function onlineBroadcast(dt){
 if(!onlineSession?.host||!race||race.mode!=='online')return;
 if(performance.now()-onlineLastSnapshot<TTR_NET.snapshotIntervalMs)return;
 onlineLastSnapshot=performance.now();
 const cars=race.cars.map(c=>({i:c.id,x:+c.x.toFixed(1),y:+c.y.toFixed(1),a:+c.a.toFixed(4),s:+c.speed.toFixed(1),p:c.p,
  l:c.lapsCompleted,j:c.jump,jt:c.jumpTotal,bo:c.boost,it:c.item,d:c.done,ft:c.finishTime,tf:c.tableFalling||0,ts:c.tableSpin||0,tfi:!!c.tableFallImpact,
  os:c.oilSpin||0,od:c.oilSpinDir||0,wp:c.wheelPhase||0,hy:c.hitYaw||0,st:c.steer||0,svx:c.skidVX||0,svy:c.skidVY||0,sr:c.shortcutRespawns||0,pe:c.lastPenaltyReason||''}));
 onlineSend({type:'snapshot',state:{time:race.time,countdown:race.countdown,cars,pickups:race.pickups.map(p=>p.cool),oils:race.oils.map(o=>({x:o.x,y:o.y,t:o.t,r:o.r,owner:o.owner,phase:o.phase}))}});
}
function onlineFinish(){
 if(!onlineSession?.host||!race||race.mode!=='online')return;
 onlineSend({type:'finish',time:race.time,results:race.cars.map(c=>({id:c.id,done:c.done,finishTime:c.finishTime}))});
}
function onlineQuit(){
 onlineCloseConnection();$('onlineModal').hidden=true;
 if($('pauseBtn')){$('pauseBtn').textContent='Ⅱ';$('pauseBtn').setAttribute('aria-label','Pausa');}
}
function onlineWire(){
 $('onlineClose').onclick=()=>{if(!onlineSession){$('onlineModal').hidden=true;}else{onlineQuit();}};
 $('onlineCreate').onclick=()=>onlineConnect('create');
 $('onlineJoin').onclick=()=>onlineConnect('join');
 $('onlinePublic').onclick=()=>onlineConnect('find_public');
 $('onlineReady').onclick=()=>{const p=onlineSession?.members[onlineSession.slot];if(p)onlineSend({type:'ready',ready:!p.ready});};
 $('onlineStart').onclick=()=>onlineSend({type:'start'});
 $('onlineLeave').onclick=()=>{onlineQuit();onlineRefreshRoom();onlineStatus('Hai lasciato la sala.')};
 $('onlineCar').onchange=()=>{if(onlineSession)onlineSend({type:'car',car:Number($('onlineCar').value)});};
 $('onlineCopy').onclick=()=>{const code=onlineSession?.code;if(!code)return;const fld=$('onlineCode');fld.value=code;fld.focus();fld.select();try{navigator.clipboard?.writeText(code)}catch(e){}};
}

const keys={};
const vehiclePalette=['#ef3d3d','#2987ee','#f4b942','#31ce98','#9447b4','#ef8f35','#f2f0e8','#2ca6bb'];
const typeNames={turbo:'TURBO',oil:'OLIO',claw:'PINZA'};
const track=(()=>{const c=document.createElement('canvas');c.width=WORLD_W;c.height=WORLD_H;return c;})();
const trackCtx=track.getContext('2d');
// Cached transparent deck: draw above road cars and below shortcut cars to express elevation.
const bridgeLayer=document.createElement('canvas');bridgeLayer.width=WORLD_W;bridgeLayer.height=WORLD_H;
const bridgeCtx=bridgeLayer.getContext('2d');
const props=[];
const milkCerealSpills=[]; // Static environmental hazards. Owner -1 means all cars can slip.
const knifePhase=.747;
const stickyAt=trackPoint(.758),stickyAngle=tangent(.758);
const jamNormal={x:-Math.sin(stickyAngle),y:Math.cos(stickyAngle)};
const jamPatch={x:stickyAt.x+jamNormal.x*32,y:stickyAt.y+jamNormal.y*32,rx:59,ry:96,r:110,angle:stickyAngle,coverage:192,laneWidth:256}; // covers -64..+128 from road center, leaving 64 for a longer outer line
function drawPoly(ctx,coords,fill,stroke=null,width=1){ctx.beginPath();ctx.moveTo(coords[0][0],coords[0][1]);for(let i=1;i<coords.length;i++)ctx.lineTo(coords[i][0],coords[i][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function capsule(ctx,x,y,w,h,r=6){ctx.beginPath();if(ctx.roundRect){ctx.roundRect(x,y,w,h,r);}else ctx.rect(x,y,w,h);}
function rounded(ctx,x,y,w,h,r,fill,stroke=null){capsule(ctx,x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function colorMix(hex,n){let h=hex.replace('#','');let r=parseInt(h.slice(0,2),16),gr=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);let m=n>=0?255:0,p=Math.abs(n);return `rgb(${Math.round(r+(m-r)*p)},${Math.round(gr+(m-gr)*p)},${Math.round(b+(m-b)*p)})`;}
function shadow(ctx,blur=15,color='#1a140f88',x=7,y=10){ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.shadowOffsetX=x;ctx.shadowOffsetY=y;}
function route(ctx){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();}
function addProp(p,t,side,r,solid=true){const at=trackPoint(p),a=tangent(p),nx=-Math.sin(a),ny=Math.cos(a);props.push({x:at.x+nx*side,y:at.y+ny*side,r,type:t,solid});}
function drawCrumb(ctx,x,y,r,seed){ctx.save();ctx.translate(x,y);ctx.rotate((seed*1.731)%Math.PI);ctx.fillStyle='#472816bd';ctx.beginPath();ctx.ellipse(2,4,r*1.12,r*.69,0,0,Math.PI*2);ctx.fill();drawPoly(ctx,[[-r*.97,-r*.3],[-r*.43,-r*.92],[r*.55,-r*.70],[r,.08],[r*.32,r*.78],[-r*.82,r*.66]],seed%3===0?'#d49448':seed%3===1?'#f2c276':'#b66d2c','#784321',1.15);ctx.strokeStyle='#fff3b8ba';ctx.lineWidth=1.05;ctx.beginPath();ctx.moveTo(-r*.5,-r*.28);ctx.lineTo(r*.28,-r*.54);ctx.stroke();ctx.restore();}
function worldInit(){
  props.length=0;milkCerealSpills.length=0;
  // Interactive props are deliberately few: props not marked solid never obstruct racing.
  addProp(.231,'mug',-188,58,true);        // Mug Bend
  // Removed confusing spiral/cereal decoration at the end of the second bend.
  addProp(.512,'orange',163,49,true);    // Orange Jump background
  const op=trackPoint(.502),oa=tangent(.502);props.push({type:'orange_bump',x:op.x+Math.sin(oa)*32,y:op.y-Math.cos(oa)*32,r:29,solid:true,jump:false,interactive:true});
  // v0.13.6.68: upright physical bowl; TWO irregular, rounded-edge milk stains.
  // Left stain is small; right stain is elongated and extends further from the bowl.
  // Neither milk puddle is an occluding sprite or a solid obstacle.
  props.push({type:'milk_cereal_cup',x:570,y:927,r:73,solid:true,scenery:false,interactive:true,tall:true});
  const cerealPatches=[
    {x:490,y:1016,rx:53,ry:28,angle:-.10,spillShape:'left'},
    {x:690,y:1028,rx:117,ry:37,angle:.07,spillShape:'right'}
  ];
  for(const p of cerealPatches){
    const spot={...p,r:Math.max(p.rx,p.ry),type:'milk_cereal_spill',owner:-1,
      solid:false,scenery:true,interactive:false};
    milkCerealSpills.push(spot);props.push(spot);
  }
  // Tipped jar attached to the jam spill, not a standing jar floating elsewhere.
  const jnx=-Math.sin(stickyAngle),jny=Math.cos(stickyAngle);
  props.push({type:'jam_spill_jar',x:jamPatch.x+jnx*198,y:jamPatch.y+jny*198,r:64,solid:true,scenery:false,interactive:true,tall:true});
  addProp(.913,'cookie',168,44,false);    // Placemat Return
  // A low breakfast knife lies transversally across the lane just before the jam.
  const sp=knifePhase,at=trackPoint(sp),a=tangent(sp),nx=-Math.sin(a),ny=Math.cos(a);
  const knifeLength=168,knifeBladeInLane=102.4; // 2/5 of 256-unit lane; stainless handle outside
  props.push({type:'knife',x:at.x+nx*126,y:at.y+ny*126,r:11,angle:Math.atan2(-ny,-nx),solid:true,interactive:true,segment:sp,length:knifeLength,bladeInLane:knifeBladeInLane,jumpBladeStart:-10,jumpBladeEnd:108,jumpTriggerHalfAcross:30});
  // v80: locate the entrance ramp at the BEGINNING of the optional shortcut,
  // not eight percent down the toast where a car has already entered it.
  const launch=shortcutPoint(.018),next=shortcutPoint(.055),ang=Math.atan2(next.y-launch.y,next.x-launch.x);
  props.push({type:'ramp',x:launch.x,y:launch.y,r:44,a:ang,solid:false,jump:true,shortcut:true,segment:shortcutFrom});
  // World building: oversize breakfast props, not random obstacles in the lane.
  const scenery=[
    ['cookie',725,860,34],['cookie_alt',1100,890,36],
    ['mug',1750,1040,51],['toast',1530,950,49],['cereal',1770,440,57],
    ['orange',1250,165,48],
    ['glass',2050,1130,42],['cookie',585,160,39],
    ['plate_croissant',1190,65,62],['toast',2000,280,55],['mug',200,1150,53]
  ];
  for(const [type,x,y,r] of scenery){
    // Move decorative pieces if they would overlap a lane: clearance uses real route/shortcut.
    const near=nearestCourse({x,y},points);
    if(near.distance<r*.70+97)continue;
    props.push({type,x,y,r,solid:false,scenery:true,interactive:false});
  }
  props.filter(o=>o.type==='cookie').forEach((o,i)=>{o.cookieKind=i%2?'cookie_alt':'cookie';});
  paintWorld();paintBridgeDeck();
}

function drawMug(ctx,x,y,r,fill='#f3efe7'){
 if(window.TTRAssets?.draw(ctx,'mug',x-r*1.23,y-r*1.10,r*2.45,r*2.45))return;
 ctx.save();ctx.translate(x,y);ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(0,0,r,r*.76,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawCookie(ctx,x,y,r,rot=0,variant='cookie'){
 ctx.save();ctx.translate(x,y);ctx.rotate(rot);
 // Soft, tightly grounded shadow, never the old doubled black oval.
 ctx.save();ctx.translate(2.2,3.7);ctx.scale(1,.73);
 const shade=ctx.createRadialGradient(0,0,r*.19,0,0,r*.87);
 shade.addColorStop(0,'rgba(58,32,20,.20)');shade.addColorStop(1,'rgba(58,32,20,0)');
 ctx.fillStyle=shade;ctx.beginPath();ctx.arc(0,0,r*.87,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.save();ctx.beginPath();ctx.ellipse(0,-r*.028,r*.83,r*.79,0,0,Math.PI*2);ctx.clip();
 if(!window.TTRAssets?.draw(ctx,variant,-r*1.18,-r*.95,r*2.36,r*1.9)){
  ctx.fillStyle='#c38d4d';ctx.beginPath();ctx.ellipse(0,0,r*.81,r*.75,0,0,Math.PI*2);ctx.fill();
 }ctx.restore();ctx.restore();
}
function drawToast(ctx,x,y,w=56,angle=0){ctx.save();ctx.translate(x,y);ctx.rotate(angle);
 if(!window.TTRAssets?.draw(ctx,'toast',-w*.5,-w*.48,w,w*.96)){ctx.fillStyle='#c8894c';ctx.fillRect(-w/2,-w*.38,w,w*.76);}ctx.restore();}
// v0.13.6.82: restore world/bridge/milk drawing helpers accidentally removed in v81.
function paintBridgeDeck(){return window.TTRCircuitVisuals.paintBridgeDeck({bridgeCtx,WORLD_W,WORLD_H,shortcutSamples});}
 // Entire burgundy puddle: tangent is X, jarward track normal is +Y.
 // Single silhouette extends from the drivable lane to the tipped jar mouth.
 function jamSpillPath(ctx){
   ctx.beginPath();ctx.moveTo(-5,-98);
   ctx.bezierCurveTo(-39,-103,-64,-74,-63,-31);
   ctx.bezierCurveTo(-69,5,-59,48,-45,84);
   ctx.bezierCurveTo(-53,108,-43,139,-27,165);
   ctx.bezierCurveTo(-12,158,9,153,27,165);
   ctx.bezierCurveTo(44,136,42,108,49,83);
   ctx.bezierCurveTo(65,39,69,-10,57,-48);
   ctx.bezierCurveTo(51,-87,20,-102,-5,-98);
   ctx.closePath();
 }
 function paintWorld(){return window.TTRCircuitVisuals.paintWorld({trackCtx,WORLD_W,WORLD_H,K,points,drawCrumb,jamPatch,jamSpillPath,trackPoint,tangent,drawPoly});}

// The milk is drawn from smoothly joined asymmetric lobes, not circles.
// Rotation and deterministic waviness make the scattered splashes look poured.

function drawMilkCerealSpill(ctx,o){return window.TTRObstacleVisuals.drawMilkCerealSpill(ctx,o);}
function drawMilkOverflow(ctx,o){return window.TTRObstacleVisuals.drawMilkOverflow(ctx,o);}
function drawMilkCerealCup(ctx,o){return window.TTRObstacleVisuals.drawMilkCerealCup(ctx,o,clock);}

function drawCoffeeAnimation(ctx,o){return window.TTRObstacleVisuals.drawCoffeeAnimation(ctx,o,clock);}
function drawJamPour(ctx){return window.TTRObstacleVisuals.drawJamPour(ctx,jamPatch,jamSpillPath,clock);}
function drawObstacle(ctx,o){
 if(o.type!=='crumb'&&o.type!=='ramp'&&o.type!=='cookie'&&o.type!=='jam_spill_jar'&&o.type!=='milk_cereal_spill'&&o.type!=='milk_cereal_cup'){
  // Ground contact shadow and subtle tabletop bounce light anchor object volume.
  ctx.save();ctx.translate(o.x+Math.max(2,o.r*.10),o.y+Math.max(4,o.r*.24));
  ctx.scale(1,.53);const rad=Math.max(12,o.r*1.25);
  const grad=ctx.createRadialGradient(0,0,1,0,0,rad);
  grad.addColorStop(0,'rgba(30,17,9,.44)');grad.addColorStop(.58,'rgba(42,23,14,.19)');grad.addColorStop(1,'rgba(55,31,17,0)');
  ctx.fillStyle=grad;ctx.beginPath();ctx.arc(0,0,rad,0,Math.PI*2);ctx.fill();ctx.restore();
 }
 if(o.type==='milk_cereal_spill'){drawMilkCerealSpill(ctx,o);}
 else if(o.type==='milk_cereal_cup'){drawMilkCerealCup(ctx,o);}
 else if(o.type==='jam_spill_jar'){
  ctx.save();ctx.translate(o.x,o.y);ctx.rotate(stickyAngle+Math.PI/2+Math.sin(clock*.6)*.006);
  window.TTRAssets?.draw(ctx,'jam_tipped',-76,-62,152,124);
  // Same dark, pulpy marmalade as on the ground, inside the open jar mouth.
  ctx.save();ctx.beginPath();ctx.ellipse(-45.1,-.6,8.45,18.4,-.04,0,Math.PI*2);ctx.clip();
  const jelly=ctx.createLinearGradient(-54,-17,-37,20);
  jelly.addColorStop(0,'#84183b');jelly.addColorStop(.50,'#b02b52');jelly.addColorStop(1,'#8b1943');
  ctx.fillStyle=jelly;ctx.fillRect(-56,-23,24,46);
  for(let k=0;k<23;k++){
   const y=-17+k*1.6+Math.sin(k*4.71+clock*.57)*.65;
   const x=-45+Math.sin(k*2.91)*5.7;
   const rx=1.3+(k*7%5)*.44,ry=1+(k*3%4)*.55;
   ctx.fillStyle=k%3===0?'#df6576ab':k%2?'#721735bd':'#c33d5da9';
   ctx.beginPath();ctx.ellipse(x,y,rx,ry,Math.sin(k)*.3,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();ctx.restore();
 }
 else if(o.type==='crumb')drawCrumb(ctx,o.x,o.y,o.r,o.x|0);else if(o.type==='cookie')drawCookie(ctx,o.x,o.y,o.r,(o.x+o.y)*.004,o.cookieKind||'cookie');else if(o.type==='mug'){drawMug(ctx,o.x,o.y,o.r,'#f1ddd6');drawCoffeeAnimation(ctx,o);}else if(o.type==='toast')drawToast(ctx,o.x,o.y,o.r*1.7,.35);else if(o.type==='orange_bump'){window.TTRAssets?.draw(ctx,'orange',o.x-33,o.y-30,66,60);}else if(['plate_croissant','cereal','orange','jam','glass'].includes(o.type)){const width=o.r*2.8;if(o.type==='jam'){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(.93);window.TTRAssets?.draw(ctx,o.type,-width/2,-width*.52,width,width*.92);ctx.restore();}else window.TTRAssets?.draw(ctx,o.type,o.x-width/2,o.y-width*.52,width,width*.92);}else if(o.type==='knife'){ctx.save();ctx.translate(o.x,o.y);ctx.rotate(o.angle??0);if(o.interactive)drawKnife(ctx,0,0,o.length||120,28);else drawKnife(ctx,0,0,157,38);ctx.restore();}else if(o.type==='ramp')drawRamp(ctx,o);
}

// A knife near the jam is a low, visible obstacle. A fast, centred crossing
// triggers a short hop over the sticky patch; only the knife and ramp launch cars.
function contactWithProp(c,o,previous=null){
  // Both the high bowl and the tipped glass jar must be solid, even to a jumping car.
  if((o.type==='milk_cereal_cup'||o.type==='jam_spill_jar')&&o.solid&&c.jump>0){
    if(K.segmentCircle(previous||c,c,o,(o.r||70)+(c.width||36)*.42)){
      c.jump=0;c.jumpTotal=0;c.jumpCd=Math.max(c.jumpCd,.4);
    }else return false;
  }
 // Orange rind remains physical even on an airborne contact: prevent phasing through.
 if((o.type==='orange_bump'||(o.type==='orange'&&o.solid))&&c.jump>0){
   const from=previous||c;
   if(K.segmentCircle(from,c,o,(o.r||29)+(c.width||36)*.38)){
     c.jump=0;c.jumpTotal=0;c.jumpCd=Math.max(c.jumpCd,.45);
   }else return false;
 }
 if(!o.solid||c.jump>0)return false;
 if(o.type!=='knife')return resolveCarObstacle(c,o);
 if(o.interactive!==true)return false;
 const ca=Math.cos(o.angle),sa=Math.sin(o.angle),dx=c.x-o.x,dy=c.y-o.y;
 const along=dx*ca+dy*sa,across=-dx*sa+dy*ca;
 const oldX=previous?.x??c.x, oldY=previous?.y??c.y;
 const odx=oldX-o.x,ody=oldY-o.y;
 const beforeAlong=odx*ca+ody*sa,beforeAcross=-odx*sa+ody*ca;
 const halfWidth=(c.width||36)*.50,halfLength=(c.length||61)*.5;
 const handleStart=-66,handleEnd=0,bladeEnd=o.bladeInLane??102.4,triggerHalf=o.jumpTriggerHalfAcross??18,jumpBladeStart=o.jumpBladeStart??0,jumpBladeEnd=o.jumpBladeEnd??bladeEnd;
 // Steel handle is a *solid low obstacle*, never transparent or a jump trigger.
 // One physical handle collider centred on the visible 66px grip.
 const handle={x:o.x-ca*33,y:o.y-sa*33,r:18,solid:true};
 const inHandle=along>=handleStart-halfWidth&&along<=handleEnd+halfWidth&&Math.abs(across)<13+halfLength;
 const sweptHandle=K.segmentPointDistance(oldX,oldY,c.x,c.y,handle.x,handle.y)<handle.r+halfWidth;
 if(inHandle||sweptHandle){
   // A solid bar, not a cosmetic circle: stop at the front surface of the steel grip.
   const fx=-sa,fy=ca,travelDir=Math.cos(c.a)*fx+Math.sin(c.a)*fy;
   const contactMargin=13+halfLength+2;
   if(travelDir>.3&&beforeAcross<0&&across>-contactMargin){
     const correction=-contactMargin-across;
     c.x+=fx*correction;c.y+=fy*correction;
     c.speed=Math.min(c.speed,35);c.hitVX*=.18;c.hitVY*=.18;
     return true;
   }
   if(travelDir<-.3&&beforeAcross>0&&across<contactMargin){
     const correction=contactMargin-across;
     c.x+=fx*correction;c.y+=fy*correction;
     c.speed=Math.max(c.speed,-35);c.hitVX*=.18;c.hitVY*=.18;
     return true;
   }
   return resolveCarObstacle(c,handle);
 }
 const bladeTouched=along>=jumpBladeStart-halfWidth&&along<=jumpBladeEnd+halfWidth&&Math.abs(across)<=triggerHalf+halfLength;
 const sweptBlade=K.segmentPointDistance(oldX,oldY,c.x,c.y,o.x+ca*((jumpBladeStart+jumpBladeEnd)*.5),o.y+sa*((jumpBladeStart+jumpBladeEnd)*.5))<Math.max(16,(jumpBladeEnd-jumpBladeStart)*.58)+halfWidth;
 if(!bladeTouched&&!sweptBlade)return false;
 // The short hop is earned by hitting the blade from the correct direction.
 const knifeForward={x:-sa,y:ca};
 const heading=Math.cos(c.a)*knifeForward.x+Math.sin(c.a)*knifeForward.y;
 const impactLine=-(halfLength+triggerHalf);
 const crossed=beforeAcross<impactLine+18&&across>=impactLine-18&&across>beforeAcross-2;
 const bladeRange=along>=jumpBladeStart-halfWidth*.55&&along<=jumpBladeEnd+halfWidth*.55;
 if(c.speed>72&&heading>.24&&crossed&&bladeRange&&c.jumpCd<=0&&(c.knifeCd||0)<=0){
   c.jump=1.13;c.jumpTotal=1.13;c.jumpCd=1.54;c.knifeCd=1.2;
   c.speed=Math.max(c.speed,113);
   if(race&&c===race.player)SND.sfx('spoon');
   return true;
 }
 // Non-qualifying contacts slow/deflect rather than awarding a free jump.
 const bladeCollider={x:o.x+ca*Math.max(8,Math.min(bladeEnd-8,along)),y:o.y+sa*Math.max(8,Math.min(bladeEnd-8,along)),r:13,solid:true};
 return resolveCarObstacle(c,bladeCollider);
}

function gameObstacles(ctx){
 props.filter(o=>o.type==='milk_cereal_cup').forEach(o=>drawMilkOverflow(ctx,o));
  props.filter(o=>o.type==='milk_cereal_spill').forEach(o=>drawObstacle(ctx,o));
  drawJamPour(ctx);
  ctx.drawImage(bridgeLayer,0,0);
 props.filter(o=>o.type!=='milk_cereal_spill').forEach(o=>drawObstacle(ctx,o));
}
function drawBox(ctx,p){if(p.cool>0)return;
 const assets=window.TTRAssets;
 const phase=clock*2.5+p.phase;
 const hover=11+Math.sin(clock*3.3+p.phase)*2.5;
 ctx.save();ctx.translate(p.x,p.y);
 // Separate grounded shadow: the pickup is visibly in the air, not glued to the tablecloth.
 ctx.fillStyle='rgba(41,32,37,.38)';ctx.beginPath();ctx.ellipse(0,9,12,5,0,0,Math.PI*2);ctx.fill();
 if(assets?.has('pickup_sheet')){
   const tile=160, exact=(((phase%(Math.PI*2)+Math.PI*2)%(Math.PI*2))/(Math.PI*2)*16),frame=Math.floor(exact)%16,next=(frame+1)%16,blend=exact-frame;
   // Smooth interpolation between adjacent cube views: no more hard 16-frame jumps.
   ctx.globalAlpha=1-blend;ctx.drawImage(assets.images.pickup_sheet,(frame%4)*tile,Math.floor(frame/4)*tile,tile,tile,-20,-hover-20,40,40);
   ctx.globalAlpha=blend;ctx.drawImage(assets.images.pickup_sheet,(next%4)*tile,Math.floor(next/4)*tile,tile,tile,-20,-hover-20,40,40);ctx.globalAlpha=1;
 }else{ctx.fillStyle='#29b4d4';ctx.fillRect(-10,-hover-10,20,20);}
 ctx.restore();
}
function hexToRgb(hex){const h=hex.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
// Four genuinely independent silhouettes; Canvas 2D paints light and side depth consistently.
function carWheels(ctx,positions,tireW=12,tireH=21,steer=0,offroad=false){
 for(const side of [-1,1])for(const y of positions){ctx.save();ctx.translate(side*(offroad?26:24),y);if(y<0)ctx.rotate(steer*.34);
  shadow(ctx,3,'#0009',2,3);rounded(ctx,-tireW/2,-tireH/2,tireW,tireH,3,'#11131a','#454953');ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
  if(offroad){ctx.strokeStyle='#656166';ctx.lineWidth=1.8;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-tireW/2,i*5);ctx.lineTo(tireW/2,i*5+2);ctx.stroke();}}
  ctx.fillStyle='#a4adbb';ctx.beginPath();ctx.ellipse(0,0,tireW*.24,tireH*.32,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#37435a';ctx.lineWidth=1.1;for(let a=0;a<5;a++){let p=a*Math.PI*2/5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(p)*tireW*.22,Math.sin(p)*tireH*.28);ctx.stroke();}ctx.restore();
 }
}
function bodyLayer(ctx,shape,color,stroke='#501d28'){shadow(ctx,8,'#0007',3,5);drawPoly(ctx,shape,color,stroke,1.5);ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;}
function glass(ctx,shape){drawPoly(ctx,shape,'#15314a','#a1d6e055',1);}
function carDetailRect(ctx,x,y,w,h,fill,r=1){rounded(ctx,x,y,w,h,r,fill);}
function headlight(ctx,x,y,w,h,color='#ffe2a6'){shadow(ctx,4,'#ffe7a66b',0,0);rounded(ctx,x,y,w,h,1.1,color,'#745d4f');ctx.shadowColor='transparent';ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;ctx.fillStyle='#ffffdd55';ctx.fillRect(x+1,y+.5,w-2,2);}
function carSprite(ctx,car){return window.TTRVehicleVisuals.carSprite(ctx,car,clock);}
function effectText(x,y,s,color='#fff'){if(!race)return;race.effects.push({x,y,t:0.65,ttl:.65,text:s,color});}

// ELIMINAZIONE PROTOTIPO v0.1 — not canonical rules.
// The master design bible (2026-11-17) confirms points, jingle, side flip and a longer final victory,
// but explicitly says exact scoring/win conditions must be recovered before declaring them canonical.
const ELIM_RULES_TEST={defaultGoal:5,minimumRoundSeconds:6,trailGap:320,physicalSeparation:175,sustainedTrailSeconds:.55,respawnProtectionSeconds:2.0,edgeMargin:16,leaderSwitchGrace:.75,recoveryLoopSeconds:16,recoveryLoopCount:3,recoveryLoopProgress:220};
const elimBoard=document.createElement('div');elimBoard.id='elimBoard';elimBoard.setAttribute('aria-label','Punteggi Eliminazione');document.body.appendChild(elimBoard);
const elimBanner=document.createElement('div');elimBanner.id='elimBanner';elimBanner.innerHTML='<div class="elim-message"><strong id="elimBannerTitle">PUNTO!</strong><span id="elimBannerSub"></span></div>';document.body.appendChild(elimBanner);
function hideEliminationUI(){elimBoard.style.display='none';elimBanner.style.display='none';$('hud')?.classList.remove('hud-elimination');}
function elimDisplayName(c){return c.id===race?.player?.id?'TU':'';}
function elimColor(c){return c.variantAccent||c.profile.color||'#82bfe9';}
function refreshEliminationBoard(){
 if(!race||race.mode!=='elimination'){hideEliminationUI();return;}
 const e=race.elim;elimBoard.style.display='flex';
 elimBoard.innerHTML=race.cars.map(c=>`<span class="e-score ${c.eliminated?'is-out':''} ${c===race.player?'is-me':''}" title="${c.profile.name} · ${e.points[c.id]} punti" aria-label="${c===race.player?'Tu':c.profile.name}: ${e.points[c.id]} punti" style="--car-color:${elimColor(c)}"><i class="e-color"></i>${c===race.player?'<b>TU</b>':''}<strong>${e.points[c.id]}</strong></span>`).join('');
}
// v84 - Small, non-overlapping two-column launch grid, anchored to the scoring location.
// A fresh elimination match launches fully BEHIND the finish plane; later rounds
// restart on a nearby safe road segment rather than teleporting to the finish.
const ELIM_ROW_SPACING=84,ELIM_START_OFFSET=65;
// Never line up a new heat ON the takeoff, knife jump or their short approach.
// Phase is arc length around the *main* track; the ramp is an optional branch.
const ELIM_JUMP_RUNUP=360,ELIM_JUMP_EXIT=190;
function eliminationSignedArc(from,to){return (((mod(from-to,1)+.5)%1)-.5)*TRACK_LENGTH;}
function eliminationJumpHazards(){
 return [{name:'toast-ramp',phase:shortcutFrom},{name:'jam-knife',phase:knifePhase}];
}
function eliminationJumpSafeGrid(grid){
 return grid.every(pt=>eliminationJumpHazards().every(h=>{
   const ahead=eliminationSignedArc(pt.p,h.phase);
   // Avoid both the approach (negative) and landing area (positive).
   // For a grid after the jump, EVERY rear row must have cleared the hazard.
   return ahead<-ELIM_JUMP_RUNUP || ahead>ELIM_JUMP_EXIT;
 }));
}
function eliminationSafeRestartAnchor(p){
 // If a score happens in/around a jump, rewind the grid rather than placing
 // cars just ahead of the takeoff. All four/eight cars retain a full approach.
 for(const hazard of eliminationJumpHazards()){
   const delta=eliminationSignedArc(p,hazard.phase);
   if(delta>=-ELIM_JUMP_RUNUP && delta<=ELIM_JUMP_EXIT+75){
     return {phase:mod(hazard.phase-(ELIM_JUMP_RUNUP+90)/TRACK_LENGTH,1),jump:hazard.name};
   }
 }
 return {phase:mod(p,1),jump:null};
}
function eliminationGridPosition(p,index,offset=0){
 const row=Math.floor(index/2),phase=mod(p-(offset+row*ELIM_ROW_SPACING)/TRACK_LENGTH,1);
 const spot=trackPoint(phase),angle=tangent(phase),side=index%2===0?-32:32;
 return {x:spot.x-Math.sin(angle)*side,y:spot.y+Math.cos(angle)*side,p:phase,a:angle};
}
function eliminationGridValid(anchor,count,offset){
 const proposed=Array.from({length:count},(_,i)=>eliminationGridPosition(anchor,i,offset));
 return eliminationJumpSafeGrid(proposed)&&proposed.every((pt,i)=>{
   if(pt.x<48||pt.x>WORLD_W-48||pt.y<48||pt.y>WORLD_H-48)return false;
   const nearest=nearestTrackWindow(pt,points,pt.p,.022);
   if(nearest.distance>LANE_HALF-41)return false;
   const clearance=33+(race?.cars[i]?.length||68)*.42;
   return !props.some(o=>(o.solid||o.type==='ramp')&&
      Math.hypot(pt.x-o.x,pt.y-o.y)<(o.r||25)+clearance);
 })&&proposed.every((a,i)=>proposed.slice(i+1).every(b=>Math.hypot(a.x-b.x,a.y-b.y)>57));
}
function eliminationChooseGrid(p,count,first=false){
 if(first)return {phase:0,offset:ELIM_START_OFFSET,grid:Array.from({length:count},(_,i)=>eliminationGridPosition(0,i,ELIM_START_OFFSET))};
 const safe=eliminationSafeRestartAnchor(p);
 // Prefer the score location for ordinary heats, but only use a jump-safe
 // position before a nearby ramp/knife. Search backward first if blocked.
 const offsets=safe.jump?[0,50,80,105,125,145,-35,-70,-110,-160,-230,-310,-420,-550,-700,220,320,470]:
     [0,-25,25,-50,50,-80,80,-115,115,-155,155,-210,210,-275,275,-350,350];
 for(const metres of offsets){const at=mod(safe.phase+metres/TRACK_LENGTH,1);
   if(eliminationGridValid(at,count,0))return {phase:at,offset:0,grid:Array.from({length:count},(_,i)=>eliminationGridPosition(at,i)),jumpAdjusted:safe.jump};
 }
 // Exhaustive safe fallback. No unsafe return near either jump.
 for(let j=0;j<Math.ceil(TRACK_LENGTH/30);j++){
   const at=mod(safe.phase-j*30/TRACK_LENGTH,1);
   if(eliminationGridValid(at,count,0))return {phase:at,offset:0,grid:Array.from({length:count},(_,i)=>eliminationGridPosition(at,i)),jumpAdjusted:safe.jump};
 }
 const at=0,offset=ELIM_START_OFFSET;
 return {phase:at,offset,grid:Array.from({length:count},(_,i)=>eliminationGridPosition(at,i,offset)),jumpAdjusted:'fallback'};
}
function eliminationApplyGrid(fresh,point,index){
 Object.assign(fresh,{x:point.x,y:point.y,a:point.a,p:point.p,lastP:point.p,
  auditP:point.p,routeStableP:point.p,lastCheckpoint:point.p});
 fresh.elimDistance=-Math.floor(index/2)*ELIM_ROW_SPACING;
 fresh.elimPrevP=point.p;fresh.elimPrevX=point.x;fresh.elimPrevY=point.y;
 fresh.elimTravelSinceCredit=0;fresh.elimLag=0;fresh.elimProtection=0;
 fresh.elimLastMeaningfulProgress=fresh.elimDistance;fresh.elimRecoveryCount=0;
 fresh.elimRecoveryWindowStart=-999;fresh.elimRecoveryStartDistance=fresh.elimDistance;
 fresh.elimStallSeconds=0;fresh.elimLastRecoveryAt=-999;
 return fresh;
}
function eliminationGridCameraPosition(grid){
 const mx=grid.reduce((sum,p)=>sum+p.x,0)/grid.length;
 const my=grid.reduce((sum,p)=>sum+p.y,0)/grid.length;
 return {x:mx,y:my};
}
function eliminationActive(){return race.cars.filter(c=>!c.eliminated&&!c.done);}
function knockOutElimination(c,reason='distacco'){
 if(!race||race.mode!=='elimination'||race.elim.state!=='race'||c.eliminated||c.done)return false;
 c.eliminated=true;c.done=true;c.speed=0;c.jump=0;c.boost=0;c.item=null;c.claw=0;c.clawTarget=null;
 race.effects.push({kind:'elimMark',text:'✕',color:'#ff7878',x:c.x,y:c.y,t:.84,ttl:.84,reason});
 if(c===race.player)SND.sfx('elimOut');
 refreshEliminationBoard();return true;
}
function awardEliminationPoint(winner){
 const e=race.elim;if(e.state!=='race')return false;
 const physicalNearest=nearestTrack(winner,points);
 const near=physicalNearest.distance<=LANE_HALF+130?physicalNearest:nearestTrackWindow(winner,points,winner.p,.07);
 e.restartPhase=Number.isFinite(near.p)?near.p:winner.p;
 e.restartWorld={x:winner.x,y:winner.y};
 e.state='celebration';e.winner=winner.id;e.points[winner.id]++;e.timer=2.2;e.roundsCompleted++;
 winner.elimCelebration=1.56;race.oils=[];SND.stopMusic();SND.sfx(e.points[winner.id]>=e.goal?'victoryJingle':'elimPoint');
 const lang=I18N.lang||'it';
 $('elimBannerTitle').textContent=e.points[winner.id]>=e.goal?'VITTORIA!':'PUNTO! +1';
 $('elimBannerSub').textContent=`${winner.profile.name} · ${elimDisplayName(winner)} · ${e.points[winner.id]} / ${e.goal}`;
 elimBanner.style.display='flex';refreshEliminationBoard();
 return true;
}
function eliminationNewRound(){
 const e=race.elim;e.state='race';e.timer=0;e.winner=null;e.round++;e.roundTime=0;
 race.oils=[];race.effects=[];race.countdown=2.15;race.pickups.forEach(p=>p.cool=0);
 const placement=eliminationChooseGrid(e.restartPhase??0,race.cars.length);
 race.cars.forEach((c,i)=>{
  const profileIndex=profiles.findIndex(pr=>pr.id===c.profile.id);
  const fresh=eliminationApplyGrid(createCar(i,profileIndex,placement.grid[i].p),placement.grid[i],i);
  const keep={variantAccent:c.variantAccent,variantLabel:c.variantLabel,variantSprite:c.variantSprite};
  Object.assign(c,fresh,keep);c.eliminated=false;c.elimCelebration=0;
 });
 elimGridCamera=eliminationGridCameraPosition(placement.grid);
 camX=elimGridCamera.x;camY=elimGridCamera.y;
 elimCameraId=null;elimCameraProgress=0;elimFocusWeight=0;elimCandidateId=null;elimCandidateSince=0;elimBanner.style.display='none';refreshEliminationBoard();
 // The round number is already visible in the upper HUD; do not cover the race with a duplicate announcement.
 hud();
}
function eliminationProgressUpdate(c,pr,dt){
 // Rank racers by *credible forward course progress*, including a shallow legal
 // inside-corner cut. Leaving the crumb lane is NOT itself a camera disqualification:
 // only the existing recovery/route guards decide whether that drive was illegal.
 if(c.eliminated||c.done||c.tableFalling>0)return;
 const prev=c.elimPrevP??pr;
 const deltaX=c.x-(c.elimPrevX??c.x),deltaY=c.y-(c.elimPrevY??c.y);
 const moved=Math.hypot(deltaX,deltaY);
 const forward=K.forwardProgress(prev,pr),reverse=K.forwardProgress(pr,prev);
 const gain=forward*TRACK_LENGTH;
 const near=nearestCourse(c,points);
 const recovering=(c.respawnGrace>0)||c.bridgeMissActive||c.bridgeLandingActive||!!c.routePinch;
 const legal=c.speed>9&&!recovering&&near.distance<=228&&
   (!(c.offtrack)||((c.offtrackSeconds||0)<2.2||(c.offtrackReturnGrace||0)>0));
 // Two independent, bounded measures of forward motion: phase progression
 // PLUS physical displacement along the track tangent. The latter handles
 // shallow inside-corner overtakes when projection is stationary or regresses.
 if(!legal){c.elimTravelSinceCredit=0;}
 else {
   const frameLimit=Math.max(9,Math.abs(c.speed)*dt*1.9+5);
   const continuous=moved<=frameLimit*1.45;
   c.elimTravelSinceCredit=Math.min(420,(c.elimTravelSinceCredit||0)+Math.min(moved,frameLimit));
   const plausible=Math.max(28,c.elimTravelSinceCredit*1.65+22);
   const projected=(reverse>.5&&forward<.09&&gain<=plausible&&continuous)?gain:0;
   const tx=Math.cos(tangent(prev)),ty=Math.sin(tangent(prev));
   const tangentTravel=deltaX*tx+deltaY*ty;
   // Strictly local, forward-only, no teleports, and never award shortcut
   // progression twice. A lateral collision cannot manufacture a camera lead.
   const physical=(!near.shortcut&&continuous&&tangentTravel>0&&
     tangentTravel>=moved*.22)?Math.min(tangentTravel*.91,frameLimit):0;
   const credit=Math.max(projected,physical);
   if(credit>.01){c.elimDistance=(c.elimDistance||0)+credit;c.elimTravelSinceCredit=0;}
 }
 c.elimPrevP=pr;c.elimPrevX=c.x;c.elimPrevY=c.y;
}
// A point is awarded only after every rival has genuinely left the leader's visible camera
// for a sustained interval. Progress alone and recoveries never knock a car out.
function eliminationViewBounds(){
 // Use the ACTUAL camera and zoom used by the renderer, not a second prediction.
 const zoom=scale||.65;
 return {x:camX,y:camY,halfW:(sw||innerWidth)/(2*zoom),halfH:(sh||innerHeight)/(2*zoom)};
}
// A shallow, legal corner cut may put a car physically ahead while nearest-track
// phase stalls or momentarily regresses. Resolve *close* overtakes from geometry,
// independently of accumulated progress, only when the two cars share a bend.
// Read the main track near a car's last known legal phase. A small inside bend cut
// can be 150–225 units off the centreline and nearestCourse may temporarily latch
// onto a different segment, so geometry beats that unstable projection.
function eliminationLegalMainPosition(c){
 const anchor=Number.isFinite(c.p)?c.p:nearestTrack(c,points).p;
 const local=nearestTrackWindow(c,points,anchor,.092);
 const global=nearestTrack(c,points);
 return local.distance<=245?local:global;
}
function eliminationPhysicalOvertake(challenger,incumbent){
 if(!challenger||!incumbent||challenger===incumbent)return false;
 const bad=c=>c.done||c.eliminated||c.onBridge||c.bridgeMissActive||c.bridgeLandingActive||
   c.routePinch||c.tableFalling>0||c.respawnGrace>0||
   ((c.offtrackSeconds||0)>2.2&&!(c.offtrackReturnGrace>0));
 if(bad(challenger)||bad(incumbent))return false;
 const dx=challenger.x-incumbent.x,dy=challenger.y-incumbent.y;
 if(Math.hypot(dx,dy)>335)return false; // only compare drivers sharing the same local bend
 const a=eliminationLegalMainPosition(challenger),b=eliminationLegalMainPosition(incumbent);
 if(a.distance>228||b.distance>228||phaseGap(a.p,b.p)>.065)return false;
 const t0=tangent(b.p),t1=tangent(a.p);
 // Opposing turns or unrelated hairpin branches are NOT overtakes.
 if(Math.cos(angleDiff(t0,t1))<.60)return false;
 const courseAdvance=eliminationSignedArc(a.p,b.p);
 if(courseAdvance < -140 || courseAdvance > 360)return false;
 if((challenger.elimDistance||0)+115<(incumbent.elimDistance||0))return false;
 const fx0=Math.cos(t0)+Math.cos(t1),fy0=Math.sin(t0)+Math.sin(t1);
 const norm=Math.hypot(fx0,fy0)||1,fx=fx0/norm,fy=fy0/norm;
 const forward=dx*fx+dy*fy,across=-dx*fy+dy*fx;
 if(forward<=29||Math.abs(across)>195)return false;
 const heading=Math.atan2(fy,fx);
 return challenger.speed>9&&Math.cos(angleDiff(challenger.a,heading))>.14&&
        Math.cos(angleDiff(incumbent.a,heading))>-.08;
}
function eliminationProjectedAhead(challenger,incumbent){
 if(!challenger||!incumbent||challenger===incumbent)return false;
 const unsafe=c=>c.eliminated||c.done||c.tableFalling>0||c.routePinch||c.respawnGrace>0||
  c.bridgeMissActive||c.bridgeLandingActive||((c.offtrackSeconds||0)>2.2&&!(c.offtrackReturnGrace>0));
 if(unsafe(challenger)||unsafe(incumbent))return false;
 const a=nearestTrackWindow(challenger,points,challenger.p,.055);
 const b=nearestTrackWindow(incumbent,points,incumbent.p,.055);
 if(a.distance>188||b.distance>188)return false;
 if(Math.cos(angleDiff(tangent(a.p),tangent(b.p)))<.60)return false;
 const ahead=mod(a.p-b.p,1);
 if(ahead<=.012||ahead>=.085)return false;
 if((incumbent.elimDistance||0)-(challenger.elimDistance||0)>65)return false;
 if(Math.cos(angleDiff(challenger.a,tangent(a.p)))<.38)return false;
 return true;
}
function eliminationCameraLeader(){
 const active=eliminationActive();if(!active.length)return race.player;
 const previous=active.find(c=>c.id===elimCameraId);
 // Race distance is authoritative, not on-screen Y. Keep the current leader
 // through minor 1-frame phase/projection jitter on sharp bends.
 const baseline=previous||active[0];
 let leader=active.reduce((best,c)=>
   (c.elimDistance||0)>(best.elimDistance||0)+(previous?19:.35)?c:best,baseline);
 if(previous){
   for(const challenger of active){
     if(challenger===previous)continue;
     const legalPass=eliminationPhysicalOvertake(challenger,previous)||
       (!eliminationPhysicalOvertake(previous,challenger)&&eliminationProjectedAhead(challenger,previous));
     if(!legalPass)continue;
     if((challenger.elimDistance||0)+48<(leader.elimDistance||0))continue;
     if(leader===previous||(challenger.elimDistance||0)>(leader.elimDistance||0)+19)leader=challenger;
   }
   if(leader!==previous){
     const clearGap=(leader.elimDistance||0)-(previous.elimDistance||0);
     if(elimCandidateId!==leader.id){elimCandidateId=leader.id;elimCandidateSince=race.time;}
     // Genuine big gaps change immediately; close overtakes must remain
     // ahead for ~0.16 s before any camera motion or KO evaluation changes.
     if(clearGap<90 && race.time-elimCandidateSince<.16)leader=previous;
   }else {elimCandidateId=null;elimCandidateSince=0;}
 }
 if(elimCameraId!==leader.id){
   // Once a legal overtaking move is confirmed, give it only the small missing
   // route credit needed to keep the camera from bouncing back next frame.
   if(previous&&eliminationPhysicalOvertake(leader,previous))
     leader.elimDistance=Math.max(leader.elimDistance||0,(previous.elimDistance||0)+7);
   if(race?.elim)race.elim.lastLeaderSwitchTime=race.time;
   // An existing out-of-frame debt belongs to the car; changing camera
   // leaders cannot erase it and force a second trip outside the screen.
   elimFocusWeight=0;elimCandidateId=null;elimCandidateSince=0;
 }
 elimCameraId=leader.id;elimCameraProgress=leader.elimDistance||0;
 return leader;
}
// The leader is always the anchor; a tightly packed group can share the image
// without pulling the lens all the way back towards a cluster of slower cars.
function eliminationCameraTarget(){
 const active=eliminationActive();if(!active.length)return {x:camX,y:camY};
 const leader=eliminationCameraLeader();
 const near=active.filter(c=>c!==leader&&Math.hypot(c.x-leader.x,c.y-leader.y)<165&&
   Math.abs((leader.elimDistance||0)-(c.elimDistance||0))<195);
 const closest=active.filter(c=>c!==leader).reduce((best,c)=>
   Math.min(best,Math.max(0,(leader.elimDistance||0)-(c.elimDistance||0))),Infinity);
 const requested=clamp((closest-110)/135,0,1);
 const smoothing=1-Math.exp(-Math.min(.05,renderDelta)*6.5);
 elimFocusWeight+=(requested-elimFocusWeight)*smoothing;
 let x=leader.x*2.8,y=leader.y*2.8,weight=2.8;
 for(const c of near){
   const dist=Math.hypot(c.x-leader.x,c.y-leader.y);
   const w=Math.max(.10,(1-dist/175)*.54);
   x+=c.x*w;y+=c.y*w;weight+=w;
 }
 x/=weight;y/=weight;
 const blend=1-elimFocusWeight;
 // Even an eight-car pileup cannot push the actual leader off the centre area.
 return {x:leader.x+clamp((x-leader.x)*blend,-48,48),
         y:leader.y+clamp((y-leader.y)*blend,-48,48)};
}
// A single atomic pass can eliminate ALL cars outside the actual camera on the
// same frame. Individual timers are independent: never early-return after 1 KO.
function eliminationEvaluate(dt){
 const e=race.elim;if(e.state!=='race'||race.countdown>0)return;
 e.roundTime+=dt;
 let active=eliminationActive();
 if(active.length===1){awardEliminationPoint(active[0]);return;}
 if(active.length===0){eliminationNewRound();return;}
 const leader=eliminationCameraLeader();
 const view=eliminationViewBounds(),margin=ELIM_RULES_TEST.edgeMargin;
 const lensSettled=Math.abs(leader.x-view.x)<view.halfW*.43&&
                   Math.abs(leader.y-view.y)<view.halfH*.43;
 const cameraSettled=race.time-(e.lastLeaderSwitchTime??-999)>=ELIM_RULES_TEST.leaderSwitchGrace;
 const queued=[];
 for(const c of active){
   c.elimProtection=Math.max(0,(c.elimProtection||0)-dt);
   const progress=c.elimDistance||0;
   if(!Number.isFinite(c.elimLastMeaningfulProgress))c.elimLastMeaningfulProgress=progress;
   if(progress-c.elimLastMeaningfulProgress>=20){
     c.elimLastMeaningfulProgress=progress;c.elimStallSeconds=0;
   }else c.elimStallSeconds=Math.min(40,(c.elimStallSeconds||0)+dt);
   if(e.roundTime<ELIM_RULES_TEST.minimumRoundSeconds)continue;
   const recoveryCount=c.elimRecoveryCount||0;
   const recoveringRepeatedly=recoveryCount>=ELIM_RULES_TEST.recoveryLoopCount&&
      race.time-(c.elimRecoveryWindowStart??-999)<=ELIM_RULES_TEST.recoveryLoopSeconds&&
      progress-(c.elimRecoveryStartDistance||0)<ELIM_RULES_TEST.recoveryLoopProgress;
   // Three rescues in one short span with negligible forward progress represent
   // the same stuck loop, even when each rescue refreshes respawn protection.
   if(recoveringRepeatedly&&
      ((c.elimStallSeconds||0)>1.0||recoveryCount>=4)){
       queued.push([c,'respawn ripetuti']);continue;
   }
   if(c!==leader&&recoveryCount>=1&&(c.elimStallSeconds||0)>9){
       queued.push([c,'bloccata']);continue;
   }
   if(c===leader){c.elimLag=0;continue;}
   const physical=Math.hypot(leader.x-c.x,leader.y-c.y);
   const beyondX=Math.abs(c.x-view.x)-view.halfW-margin;
   const beyondY=Math.abs(c.y-view.y)-view.halfH-margin;
   const outside=beyondX>0||beyondY>0;
   const behind=(leader.elimDistance||0)-(c.elimDistance||0);
   const isActuallyInFront=eliminationPhysicalOvertake(c,leader)||
                           eliminationProjectedAhead(c,leader);
   // A competitor far behind and continuously outside the real viewport must
   // not wait for a second exit because of camera settling or a recovery loop.
   const farBehind=behind>220&&Math.max(beyondX,beyondY)>30;
   const protectedRecovery=(c.respawnGrace>0)||(c.elimProtection>0)||
       (c.impactGrace>0)||(c.bridgeMissGrace>0)||(c.bridgeMissActive);
   const safeToCheck=outside&&!isActuallyInFront&&behind>35&&
       physical>ELIM_RULES_TEST.physicalSeparation&&!(c.tableFalling>0)&&
       (farBehind||(cameraSettled&&lensSettled));
   // Accumulate independently for each racer; brief camera shifts do not
   // zero the timer. Deeply trailing cars cannot renew immunity indefinitely.
   c.elimLag=safeToCheck?(c.elimLag||0)+dt:Math.max(0,(c.elimLag||0)-dt*.7);
   const enoughOutside=c.elimLag>=ELIM_RULES_TEST.sustainedTrailSeconds;
   if(safeToCheck&&enoughOutside&&(!protectedRecovery||farBehind))
     queued.push([c,'fuori schermo']);
 }
 // Commit the entire batch before checking whether only one competitor remains.
 for(const [car,reason] of queued)knockOutElimination(car,reason);
 active=eliminationActive();
 if(active.length===1)awardEliminationPoint(active[0]);
 else if(active.length===0)eliminationNewRound();
}
function eliminationEndPoint(dt){
 const e=race.elim;if(e.state!=='celebration')return false;
 e.timer=Math.max(0,e.timer-dt);
 for(const c of race.cars)c.elimCelebration=Math.max(0,(c.elimCelebration||0)-dt);
 if(e.timer<=0){
  if(e.points[e.winner]>=e.goal){race.finished=true;hideEliminationUI();showResults();}
  else eliminationNewRound();
 }
 return true;
}
// Results hotfix: preserve each model's approved garage angle and distinguish
// same-model racers by the actual race paint, not artificial name suffixes.
function ttrResultCarCell(car,isPlayer=false){
 const accent=car.variantAccent||car.profile.color;
 return `<span class="result-car-identity"><canvas class="result-car-thumb" data-racer-id="${car.id}" width="192" height="108" aria-hidden="true"></canvas><span class="result-car-label"><span class="variantDot" style="background:${accent}" aria-hidden="true"></span><span class="result-car-name">${car.profile.name}${isPlayer?' ('+t('you')+')':''}</span></span></span>`;
}
function ttrRenderResultThumbnails(panel,completedRace){
 const paint=()=>{
  if(race!==completedRace||!panel.isConnected)return;
  panel.querySelectorAll('.result-car-thumb').forEach(canvas=>{
   const car=completedRace.cars.find(c=>c.id===Number(canvas.dataset.racerId));
   if(car)window.TTRResultVisuals.drawResultThumbnail(canvas,car,TTRShowroomStarts);
  });
 };
 paint();window.TTRAssets?.ready?.then(paint);
}
function showEliminationResults(){
 if(!race||race.mode!=='elimination')return;
 const e=race.elim;const sorted=race.cars.slice().sort((a,b)=>(e.points[b.id]-e.points[a.id])||(a.id-b.id));
 const champion=sorted[0];const won=champion===race.player;
 SND.stopMusic();SND.sfx(won?'victoryJingle':'defeatJingle');
 if(resultsMusicTimer!==null)clearTimeout(resultsMusicTimer);
 const completedRace=race;resultsMusicTimer=setTimeout(()=>{resultsMusicTimer=null;if(race===completedRace&&race.finished)SND.music('menu');},4900);
 const panel=document.createElement('div');panel.className='panel resultsPanel compact elimResults';
 panel.innerHTML=`<div class="flag-tape"></div><p class="eyebrow">ELIMINAZIONE · BETA · COLAZIONE TURBO</p><h2>${won?'VITTORIA!':'FINE SFIDA'}</h2><p class="sub">${champion.profile.name} · ${e.points[champion.id]} punti · ${e.roundsCompleted} manche</p>
 <table class="results compact"><tbody>${sorted.map((c,i)=>`<tr class="${c===race.player?'me':''}"><td>${i+1}°</td><td class="result-car-td">${ttrResultCarCell(c,c===race.player)}</td><td><b>${e.points[c.id]} / ${e.goal} pt.</b></td></tr>`).join('')}</tbody></table>
 <div class="menu-row"><button class="btn" id="again">${t('again')}</button><button class="btn secondary" id="toMenu">${t('menu')}</button></div>
 <p class="note">Regole di punteggio provvisorie · non ancora canoniche</p>`;
 $('screen').innerHTML='';$('screen').appendChild(panel);$('screen').hidden=false;$('screen').style.display='flex';
 $('controls').style.display='none';$('hud').style.display='none';hideEliminationUI();
 ttrRenderResultThumbnails(panel,completedRace);
 $('again').onclick=()=>openCircuitLoading('elimination');$('toMenu').onclick=mainMenu;
}

function createCar(index,p,t=0){const base=profiles[((p%profiles.length)+profiles.length)%profiles.length],pr=ttrCalibratedProfile(base),pos=trackPoint(t),a=tangent(t);const n={x:-Math.sin(a),y:Math.cos(a)};let lane=index%2===0?-29:29;
 return {id:index,profile:pr,color:index===0?pr.color:pr.color,x:pos.x+n.x*lane,y:pos.y+n.y*lane,a,speed:0,steer:0,width:pr.shape==='muscle'?39:pr.shape==='buggy'?41:pr.shape==='sport'?37:36,length:pr.shape==='muscle'?69:pr.shape==='buggy'?63:pr.shape==='sport'?67:61,boost:0,slip:0,jump:0,jumpTotal:.72,jumpCd:0,rampEntryVisual:false,claw:0,clawTarget:null,item:null,lapsCompleted:0,lastP:t,p:t,flags:[false,false,false],done:false,finishTime:null,lastCheckpoint:0,stuckTime:0,hitVX:0,hitVY:0,reverseRecovery:0,knifeCd:0,offtrack:false,offtrackSeconds:0,mode:'race',mugApexPassed:false,wheelPhase:0,hitYaw:0,impactGrace:0,variantAccent:null,variantLabel:'',variantSprite:null,auditP:mod(t,1),auditTravel:0,auditCleanTime:0,auditBridge:false,auditOutsideTime:0,oilSpin:0,oilSpinDir:1,routeStableP:mod(t,1),routePinch:null,routeResolvedNear:null};
}
const duplicateColourSchemes={
 scatto:['#9544eb','#3cb8ad','#dfad5a'],
 tuono:['#ad62e3','#e89b50','#4bbb91'],
 polvere:['#b759d9','#3bbba9','#de597f'],
 lampo:['#e29a46','#9068df','#e65b88'],
 aero:['#33a7ce','#f5d760','#bd7adb'],
 enduro:['#9951d6','#3cbdad','#e5a14e']
};
const duplicateColourOffsets={scatto:0,tuono:1,polvere:1,lampo:2};
function assignDuplicateAccents(){
 if(!race||!race.cars)return;
 const groups={};race.cars.forEach(c=>((groups[c.profile.id]??=[]).push(c)));
 Object.values(groups).forEach(group=>group.forEach((c,i)=>{
  const model=c.profile.id;
  // Keep the first car canonical. For duplicate models, change the actual body colour.
  const variant=i===0?0:((i-1+(duplicateColourOffsets[model]||0))%3+1);
  c.variantSprite=variant?`${model}_color${variant}`:null;
  c.variantAccent=variant?(duplicateColourSchemes[model]?.[variant-1]||c.profile.color):null;
  c.variantLabel=variant?String.fromCharCode(65+i):'';
 }));
}
let loadingToken=0;
function openCircuitLoading(mode){
 if(resultsMusicTimer!==null){clearTimeout(resultsMusicTimer);resultsMusicTimer=null;}
  const token=++loadingToken,wrap=$('loadingTrack');
  if(!wrap){initRace(mode);return;}
  const startButton=$('ttrLaunchRace');
  startButton.hidden=true;startButton.disabled=true;
  $('loadingStateLabel').textContent=t('loading');
  const tipByLanguage={
   it:'La rampa sul toast è una scorciatoia: affrontala con la giusta traiettoria per guadagnare secondi. Un atterraggio sbagliato ti farà perdere velocità!',
   en:'The toast ramp is a shortcut: line it up carefully to save time. A bad landing will cost you speed!',
   es:'La rampa de la tostada es un atajo: alinéate bien para ahorrar segundos. ¡Un mal aterrizaje te hará perder velocidad!'
  };
  $('ttrRampTip').textContent=tipByLanguage[I18N.getLang()]||tipByLanguage.it;
  const startLabel=I18N.getLang()==='en'?'START RACE':I18N.getLang()==='es'?'INICIAR CARRERA':'AVVIA GARA';
  startButton.textContent=startLabel;
  startButton.onclick=()=>{if(token!==loadingToken||startButton.disabled)return;startButton.disabled=true;wrap.hidden=true;initRace(mode);};
 race=null;syncAudio();wrap.hidden=false;$('screen').hidden=true;$('screen').style.display='none';$('garageScreen').hidden=true;if($('careerScreen'))$('careerScreen').hidden=true;if($('careerMissionsScreen'))$('careerMissionsScreen').hidden=true;
 $('loadingMode').textContent=mode==='online'?'GARA ONLINE · ALPHA':t(mode==='trial'?'timeTrial':mode==='elimination'?'elimination':'quickRace');
 const clawIcon='<svg aria-hidden="true" viewBox="0 0 64 64" width="28" height="28" style="vertical-align:middle"><path fill="#a9c7dd" stroke="#203b56" stroke-width="4" d="M26 6h12l5 22-5 9H26l-5-9z"/><path fill="#e1edf4" stroke="#203b56" stroke-width="4" stroke-linejoin="round" d="M23 30C11 28 5 37 7 48c2 9 13 12 21 4l-5-9c-5 5-10 3-10-3 1-5 5-7 10-6zM41 30c12-2 18 7 16 18-2 9-13 12-21 4l5-9c5 5 10 3 10-3 1-5 5-7 10-6z"/><circle cx="32" cy="24" r="7" fill="#efb94b" stroke="#203b56" stroke-width="3"/></svg>';
 const roster=[['⚡','TURBO'],['🛢','OLIO'],[clawIcon,'PINZA']];
 $('loadingPowerups').innerHTML=roster.map(([icon,name],i)=>'<span class="power-chip'+(mode==='trial'&&i>0?' unavailable':'')+'"><span class="up-icon">'+icon+'</span><span>'+name+'</span></span>').join('');
 $('loadingTrackName').textContent=t('trackName');
 const c=$('loadingCircuitMap'),m=c.getContext('2d');m.clearRect(0,0,c.width,c.height);
 m.fillStyle='#111d40';m.fillRect(0,0,c.width,c.height);
 m.save();
 const bx0=Math.min(...points.map(p=>p.x)),by0=Math.min(...points.map(p=>p.y));
 const bx1=Math.max(...points.map(p=>p.x)),by1=Math.max(...points.map(p=>p.y));
 const k=Math.min((c.width-54)/Math.max(1,bx1-bx0),(c.height-34)/Math.max(1,by1-by0));
 m.translate(c.width*.5,c.height*.5);m.scale(k,k);m.translate(-(bx0+bx1)*.5,-(by0+by1)*.5);
 m.beginPath();points.forEach((p,i)=>i?m.lineTo(p.x,p.y):m.moveTo(p.x,p.y));m.closePath();m.strokeStyle='#122344';m.lineWidth=72;m.stroke();m.strokeStyle='#ffe498';m.lineWidth=21;m.stroke();
 for(const q of pickupSegments.slice(0,2)){const pos=trackPoint(q);const r=29;m.fillStyle='#26d8f1';m.strokeStyle='#073f61';m.lineWidth=6;m.beginPath();m.moveTo(pos.x,pos.y-r);m.lineTo(pos.x+r,pos.y);m.lineTo(pos.x,pos.y+r);m.lineTo(pos.x-r,pos.y);m.closePath();m.fill();m.stroke();}
 // Full elevated shortcut, with a contrasting line from take-off to landing.
  m.save();m.beginPath();shortcutSamples.forEach((q,i)=>i?m.lineTo(q.x,q.y):m.moveTo(q.x,q.y));
  m.lineCap='round';m.lineJoin='round';m.strokeStyle='#073f61';m.lineWidth=36;m.stroke();
  m.strokeStyle='#46f5e2';m.lineWidth=20;m.stroke();
  m.restore();
  for(const t of [.085,.965]){const q=shortcutPoint(t);m.fillStyle='#fff5c3';m.beginPath();m.arc(q.x,q.y,21,0,Math.PI*2);m.fill();}
  const ramp=shortcutPoint(.135);m.fillStyle='#f6bd62';m.beginPath();m.arc(ramp.x,ramp.y,17,0,Math.PI*2);m.fill();
 const start=trackPoint(0);m.fillStyle='#fff';m.beginPath();m.arc(start.x,start.y,33,0,Math.PI*2);m.fill();m.restore();
 const bar=$('loadingRaceFill');bar.style.width='12%';
 SND.music('garage');requestAnimationFrame(()=>{if(token===loadingToken)bar.style.width='84%';});
  Promise.all([window.TTRAssets?.ready||Promise.resolve(),new Promise(done=>setTimeout(done,780))]).then(()=>{
   if(token!==loadingToken)return;
   bar.style.width='100%';
   $('loadingStateLabel').textContent=I18N.getLang()==='en'?'TRACK READY':I18N.getLang()==='es'?'CIRCUITO LISTO':'CIRCUITO PRONTO';
   startButton.hidden=false;startButton.disabled=false;
  });
}
function initRace(mode){
 releaseAllControls();
 const cfg=TTRModeConfigs[mode]||null;const num=mode==='online'&&onlineSession?onlineSession.capacity:mode==='trial'?1:mode==='career'?4:Number(cfg?.racers||4),pr=selectedCar,aiFactor=mode==='career'?TTRCareerDifficulty():mode==='race'||mode==='elimination'?Number(cfg?.difficulty||1):1,auto=mode==='race'||mode==='elimination'?cfg?.auto!=='0':true;
 lastRaceSettings={num,pr,aiFactor,auto};
 onlineFinishDeadline=0;race={mode,cars:[],player:null,pickups:[],oils:[],effects:[],time:0,countdown:3.2,paused:false,auto,aiFactor,finished:false,pauseOverlay:false,collisionCount:0,lastImpactSound:-10,careerStats:{pickups:0,turbos:0,oils:0,claws:0},careerRecorded:false};
 if(mode==='elimination')race.elim={goal:Math.max(3,Math.min(7,Number(TTRModeConfigs.elimination.elimGoal||ELIM_RULES_TEST.defaultGoal))),points:Array(num).fill(0),round:1,roundTime:0,state:'race',timer:0,winner:null,roundsCompleted:0};
 for(let i=0;i<num;i++){const own=mode==='online'&&onlineSession?.members[i];race.cars.push(createCar(i,own?own.car:i===0?pr:i%profiles.length,mod(.005-Math.floor(i/2)*.019,1)));}
 assignDuplicateAccents();
 race.player=race.cars[mode==='online'&&onlineSession?onlineSession.slot:0];
 if(mode==='elimination'){
   const placement=eliminationChooseGrid(0,num,true);
   race.cars.forEach((c,i)=>{eliminationApplyGrid(c,placement.grid[i],i);c.eliminated=false;c.elimCelebration=0;});
 }
 const refLap=TRACK_LENGTH/155;const count=pickupCount(refLap);for(let i=0;i<count;i++){const p=pickupSegments[i],pt=trackPoint(p);race.pickups.push({x:pt.x,y:pt.y,size:22,r:16.5,cool:0,phase:i*1.7,segment:p});}
 for(const k of Object.keys(controls))controls[k]=false;
 $('loadingTrack').hidden=true;$('pauseOverlay').hidden=true;$('screen').hidden=true;$('screen').style.display='none';$('hud').style.display='block';$('controls').style.display='flex';$('gas').style.display=auto?'none':'flex';$('hint').classList.remove('show');
 if(mode==='elimination'){elimBanner.style.display='none';refreshEliminationBoard();}else hideEliminationUI();
 if(mode==='online'){$('pauseBtn').textContent='ESCI';$('pauseBtn').setAttribute('aria-label','Esci dalla gara online');}else{$('pauseBtn').textContent='Ⅱ';$('pauseBtn').setAttribute('aria-label','Pausa');}
 $('position').parentElement.querySelector('small').textContent=mode==='elimination'?'IN PISTA':t('position');
 $('lap').parentElement.querySelector('small').textContent=mode==='elimination'?'MANCHE':t('lap');
 $('hud').classList.toggle('hud-elimination',mode==='elimination');
 SND.unlock().then(ok=>{if(ok)SND.sfx('start');});SND.stopMusic();frameTime=performance.now();camX=race.player.x;camY=race.player.y;
 elimGridCamera=mode==='elimination'?eliminationGridCameraPosition(race.cars):{x:camX,y:camY};
 if(mode==='elimination'){camX=elimGridCamera.x;camY=elimGridCamera.y;}
 elimCameraId=null;elimFocusWeight=0;elimCandidateId=null;elimCandidateSince=0;hud();
}
// One recovery path for excessive shortcut, tabletop edge and blocked obstacles.
// All recoveries are silent on the HUD; the audio cue is subtle and never prints text.
function recoverCar(c,reason='edge'){
 const safe=c.lastValidPosition||c.offtrackEntry||{...trackPoint(c.lastCheckpoint||0),p:c.lastCheckpoint||0,a:tangent(c.lastCheckpoint||0),speed:42,laps:c.lapsCompleted,flags:c.flags.slice()};
 const p=mod(safe.p||0,1),place=trackPoint(p);
 c.x=place.x;c.y=place.y;c.a=tangent(p);c.p=p;c.lastP=p;
 c.lapsCompleted=safe.laps??c.lapsCompleted;c.flags=(safe.flags||c.flags).slice();
 c.speed=46;c.jump=0;c.jumpCd=.45;c.boost=0;c.claw=0;c.clawTarget=null;
 c.hitVX=0;c.hitVY=0;c.hitYaw=0;c.impactGrace=0;c.slip=0;c.skidVX=0;c.skidVY=0;c.oilCooldown=0;c.oilSpin=0;
 c.offtrack=false;c.offtrackSeconds=0;c.offtrackEntry=null;c.maxInteriorCut=0;c.offtrackReturnGrace=0;c.offtrackLastDistance=0;c.onBridge=false;c.rampEntryVisual=false;c.bridgeOffSeconds=0;c.bridgeExitVisual=0;
 c.lapGateBlocked=true;c.respawnGrace=.75;c.stuckAnchor=null;c.obstacleStuckSeconds=0;
 c.stuckTime=0;c.reverseRecovery=0;c.lastObstacleContact=-100;
 if(race?.mode==='elimination'){
   const now=race.time,progress=c.elimDistance||0;
   const recent=Number.isFinite(c.elimRecoveryWindowStart)&&
     now-c.elimRecoveryWindowStart<ELIM_RULES_TEST.recoveryLoopSeconds&&
     progress-(c.elimRecoveryStartDistance||0)<ELIM_RULES_TEST.recoveryLoopProgress;
   if(!recent){c.elimRecoveryWindowStart=now;c.elimRecoveryStartDistance=progress;c.elimRecoveryCount=1;}
   else c.elimRecoveryCount=(c.elimRecoveryCount||0)+1;
   c.elimLastRecoveryAt=now;
   c.elimLag=0;c.elimProtection=ELIM_RULES_TEST.respawnProtectionSeconds;
   c.elimPrevP=p;c.elimPrevX=c.x;c.elimPrevY=c.y;c.elimTravelSinceCredit=0;
 }
 c.shortcutRespawns=(c.shortcutRespawns||0)+1;c.lastPenaltyReason=reason;c.routeStableP=p;c.routePinch=null;c.routeResolvedNear=null;c.tableFalling=0;c.tableSpin=0;c.tableFallDir=0;c.auditP=p;c.auditTravel=0;c.auditCleanTime=0;c.auditBridge=false;c.auditOutsideTime=0;c.oilSpin=0;c.bridgeLandingActive=false;c.mugApexPassed=safe.mugApexPassed===true||(safe.mugApexPassed===undefined&&p>.32&&p<.93);
 
 if(c===race.player){SND.sfx('respawn');lastHint=0;const h=$('hint');if(h){h.textContent='';h.classList.remove('show');}/* Recovery stays silent: no PENALITÀ banner in any mode. */}
}
// Guard a real geometric crossing between two non-adjacent curves.
// An abrupt phase jump is only suspicious at the known adjacent hairpin pair.
// Legitimate inside lines are allowed until the car physically commits to the other arm.
function junctionContinuity(c,near,oldX,oldY,dt){
  const step=Math.hypot(c.x-oldX,c.y-oldY);
  if(c.onBridge||c.bridgeLandingActive||c.bridgeMissActive||c.tableFalling>0||c.respawnGrace>0||c.impactGrace>0){
    c.routePinch=null;c.routeStableP=near.p;return {near,penalty:false};
  }
  const anchor=c.routeStableP??c.lastP??near.p;
  if(!c.routePinch && !near.shortcut && junctionPhaseHop(anchor,near.p,step)){
    c.routePinch={phase:anchor,elapsed:0,travel:0};
  }
  if(c.routePinch){
    const pending=c.routePinch;
    const legal=nearestTrackWindow(c,points,pending.phase,.07);
    pending.elapsed+=dt;pending.travel+=Math.min(step,40);
    if(phaseGap(near.p,pending.phase)<.066 && near.distance<118){
      c.routePinch=null;c.routeStableP=near.p;return {near,penalty:false};
    }
    // Strong evidence from geometry + sustained actual travel, not a noisy nearest-phase projection.
    // Require sustained, substantial travel away from the *previous* arm:
    // tiny inside-corner cuts must not trigger an instant teleport.
    const illegal=(pending.travel>66&&pending.elapsed>.38&&legal.distance>185&&near.distance<105) ||
      (pending.travel>88&&pending.elapsed>.65&&legal.distance>159&&near.distance<42);
    if(illegal)return {near:legal,penalty:true};
    c.routeStableP=legal.p;
    return {near:{...legal,shortcut:false},penalty:false,pending:true};
  }
  c.routeStableP=near.p;return {near,penalty:false};
}
function hud(){if(!race)return;const c=race.player;const rank=race.cars.slice().sort((a,b)=>K.racePosition(b)-K.racePosition(a)).indexOf(c)+1;
 if(race.mode==='elimination'){$('position').textContent=`${eliminationActive().length} / ${race.cars.length}`;$('lap').textContent=`${race.elim.round}ª`;}
 else {$('position').textContent=`${rank} / ${race.cars.length}`;$('lap').textContent=`${Math.min(3,c.lapsCompleted+1)} / 3`;}
 $('time').textContent=fmtTime(race.time);$('item').textContent=c.item?typeNames[c.item]:'—';
 const power=$('use');if(power){const clawGraphic='<svg aria-hidden="true" viewBox="0 0 64 64" width="32" height="32"><path fill="#90aabe" stroke="#13283a" stroke-width="4" d="M26 6h12l5 22-5 9H26l-5-9z"/><path fill="#dce5e8" stroke="#173043" stroke-width="4" stroke-linejoin="round" d="M23 30C11 28 5 37 7 48c2 9 13 12 21 4l-5-9c-5 5-10 3-10-3 1-5 5-7 10-6zM41 30c12-2 18 7 16 18-2 9-13 12-21 4l5-9c5 5 10 3 10-3-1-5-5-7-10-6z"/><circle cx="32" cy="24" r="7" fill="#e8b84d" stroke="#173043" stroke-width="3"/></svg>';
 const icons={turbo:'⚡',oil:'🛢',claw:clawGraphic};const key=c.item||'empty';if(power.dataset.power!==key){power.dataset.power=key;power.innerHTML='<span class="power-token '+key+'">'+(icons[key]||'?')+'</span>';power.setAttribute('aria-label',c.item?'Attiva '+typeNames[c.item]:'Nessun power-up');}}

}
function fmtTime(s){const m=Math.floor(s/60).toString().padStart(2,'0'),ss=Math.floor(s%60).toString().padStart(2,'0'),ms=Math.floor(s*10%10);return `${m}:${ss}.${ms}`;}
function showHint(s,t=1.1){hint=s;lastHint=clock+t;$('hint').textContent=s;$('hint').classList.add('show');}
function initAudio(){return SND.unlock();}
function syncAudio(){SND.syncEngine(race?.player,!!(race&&!race.paused&&!race.finished&&race.countdown<=0&&innerWidth>=innerHeight&&!(race.elim&&race.elim.state!=='race')&&!race.player?.eliminated));}
function ping(freq=660,dur=.09,vol=.1){SND.sfx(freq>800?'pickup':freq<300?'impact':'select');}
function refreshAudioUI(){const st=SND.status(),el=$('audioStatus');if(el)el.textContent=st.supported?(st.context==='running'?t('audioReady'):t('audioBlocked')):t('audioUnavailable');
 const mute=$('menuMute');if(mute){mute.textContent=t(st.muted?'audioOff':'audioOn');mute.setAttribute('aria-pressed',String(!st.muted));}const pMute=$('pauseMute');if(pMute){pMute.textContent=t(st.muted?'audioOff':'audioOn');pMute.setAttribute('aria-pressed',String(!st.muted));}}
function enableSound(){return SND.unlock().then(ok=>{refreshAudioUI();return ok;});}
function useItem(c){if(!c||!c.item||c.done)return;
 if(race?.mode==='online'&&onlineSession&&!onlineSession.host&&c===race.player){onlineSend({type:'action',action:'item'});return;}const type=c.item;c.item=null;
 if(c===race.player&&race.mode==='career'&&race.careerStats&&Object.prototype.hasOwnProperty.call(race.careerStats,{turbo:'turbos',oil:'oils',claw:'claws'}[type]))race.careerStats[{turbo:'turbos',oil:'oils',claw:'claws'}[type]]++;
 if(type==='turbo'){c.boost=1.05;if(c===race.player)SND.sfx('turbo');}
 if(type==='oil'){let x=c.x-Math.cos(c.a)*56,y=c.y-Math.sin(c.a)*56;race.oils.push({x,y,t:9,r:34,owner:c.id,phase:Math.random()*6.28});if(c===race.player)SND.sfx('oil');}
 if(type==='claw'){
   const target=clawTarget(c,race.cars,props,162,.30);
   if(target){c.claw=1.28;c.clawTarget=target;c.clawStartDist=distance(c,target);if(c===race.player)SND.sfx('claw');}
   else if(c===race.player){SND.sfx('clawFail');showHint(t('noClaw'),1.25);}
 }
}
function inputFor(c){if(race?.mode==='online'&&onlineSession?.host&&c.id!==0){const net=onlineHostInput(c);if(net)return net;}if(c===race.player){const steer=(controls.right||keys.ArrowRight||keys.KeyD?1:0)-(controls.left||keys.ArrowLeft||keys.KeyA?1:0);return {steer,gas:race.auto||controls.gas||keys.ArrowUp||keys.KeyW,brake:controls.brake||keys.ArrowDown||keys.KeyS};}
 const target=trackPoint(mod(c.p+.027,1)),desired=Math.atan2(target.y-c.y,target.x-c.x),d=angleDiff(desired,c.a);let steer=clamp(d*2.8,-1,1);const near=nearestTrack(c,points),tooFar=near.distance>55;
 if(tooFar){const go=Math.atan2(near.y-c.y,near.x-c.x),turn=angleDiff(go,c.a);steer=clamp(turn*2.8,-1,1);}
 const v=Math.abs(d);
  if(c.reverseRecovery>0)return {steer:-steer||1,gas:false,brake:true};
  return {steer,gas:v<.58||c.speed<92,brake:v>.75&&c.speed>120};
}
function bridgeFall(c){
 if(c.bridgeMissGrace>0)return false;
 c.bridgeTakeoff=false;
 c.onBridge=false;c.rampEntryVisual=false;c.bridgeOffSeconds=0;c.bridgeExitVisual=0;c.bridgeMissGrace=10.0;c.bridgeMissPenalty=1.60;c.bridgeMissActive=true;c.bridgeLandingActive=true;
 c.bridgeFalling=.48;c.jump=0;c.jumpCd=.85;c.boost=0;
 c.speed=Math.min(40,Math.max(12,Math.abs(c.speed)*.22));
 c.hitVX=(c.hitVX||0)*.18;c.hitVY=(c.hitVY||0)*.18;
 c.lapGateBlocked=true;
 if(c===race?.player)SND.sfx('impact');
 return true;
}
function startTableFall(c){
 if((c.tableFalling||0)>0)return false;
 c.tableFalling=1.22;c.tableFallImpact=false;c.tableFallX=c.x;c.tableFallY=c.y;c.tableSpin=(Math.random()<.5?-1:1)*(7.8+Math.random()*1.5);
 c.tableFallDir=(Math.random()<.5?-1:1);
 c.jump=0;c.jumpCd=Math.max(c.jumpCd||0,.92);c.boost=0;c.claw=0;c.clawTarget=null;
 c.speed=Math.min(Math.max(Math.abs(c.speed),42),120);
 c.hitVX=(c.hitVX||0)*.25;c.hitVY=(c.hitVY||0)*.25;c.lapGateBlocked=true;
 if(c===race?.player)SND.sfx('fall');
 return true;
}

 // v0.13.6.71 — A short, controlled crossing just beyond the crumb border is legal.
 // Outside the respawn/safety corridor, the old checkpoint and shortcut rules remain.
 function finishEdgeTolerance(c,near){
   return !!near && !near.shortcut && (near.p>.905 || near.p<.065)
     && near.distance<=186 && (c.offtrackSeconds||0)<=1.6
     && (!c.offtrackEntry || c.offtrackEntry.p>.80)
     && (c.maxInteriorCut||0)<205 && (c.auditOutsideTime||0)<1.65
     && !c.onBridge && !c.bridgeMissActive && !c.bridgeLandingActive
     && !c.routePinch && !(c.respawnGrace>0) && !(c.tableFalling>0);
 }

function update(dt){clock+=dt;if(!race)return;if(race.mode==='online'&&onlineSession&&!onlineSession.host)return;if(race.paused||race.finished||innerHeight>innerWidth){syncAudio();return;}
 if(race.mode==='elimination'&&eliminationEndPoint(dt)){syncAudio();return;}
 if(race.countdown>0){const old=Math.ceil(race.countdown);race.countdown-=dt;if(Math.ceil(Math.max(0,race.countdown))!==old){SND.sfx(old>1?'count':'go');}if(race.countdown<=0){showHint(t('go'),.9);SND.music('race');}syncAudio();return;}
 race.time+=dt;
 race.pickups.forEach(p=>p.cool=Math.max(0,p.cool-dt));race.oils=race.oils.filter(p=>(p.t-=dt)>0);race.effects=race.effects.filter(p=>(p.t-=dt)>0);
 for(const c of race.cars){if(c.done)continue;
  if((c.tableFalling||0)>0){
    c.tableFalling=Math.max(0,c.tableFalling-dt);
    if(c.tableFalling>.56){c.a+=(c.tableSpin||8.2)*dt;c.speed=Math.max(0,c.speed*(1-dt*2.2));}
    // Impact happens after a visible fall, followed by a pronounced smoke cloud.
    if(!c.tableFallImpact&&c.tableFalling<=.63){
      c.tableFallImpact=true;c.speed=0;
      race.effects.push({kind:'fallCloud',x:c.x,y:c.y,t:1.05,ttl:1.05});
      if(c===race.player)SND.sfx('fallImpact');
    }
    if(c.tableFalling<=0){recoverCar(c,'table-fall');}
    continue;
  }const ctl=inputFor(c),mul=race.mode==='online'&&onlineSession?.members[c.id]?1:(c===race.player?1:race.aiFactor);let vmax=c.profile.max*mul,accelerate=c.profile.acc*mul;
 // Sticky jam has a lasting, measurable slowdown and reduced acceleration.
 // It is not another oil patch: grip remains predictable, speed is limited.
 const inJam=c.jump<=0&&jamHit(c,jamPatch);
 c.jamTimer=inJam?.85:Math.max(0,(c.jamTimer||0)-dt);
 if(c.jamTimer>0){accelerate*=.40;}
 const boost=c.boost>0;c.reverseRecovery=Math.max(0,c.reverseRecovery-dt);c.boost=Math.max(0,c.boost-dt);c.slip=Math.max(0,c.slip-dt);const wasAirborne=c.jump>0;c.jump=Math.max(0,c.jump-dt);c.jumpCd=Math.max(0,c.jumpCd-dt);if(wasAirborne&&c.jump===0&&c===race.player&&!c.bridgeTakeoff)SND.sfx('impact');
 // Brake takes absolute priority over automatic throttle, including after impacts.
 c.speed=stepDriveSpeed(c.speed,ctl,dt,{max:vmax,acc:accelerate},boost&&c.jamTimer<=0);
 if(c.jamTimer>0){const target=Math.max(54,vmax*.46);
   c.speed=Math.sign(c.speed)*Math.min(Math.abs(c.speed),Math.max(target,Math.abs(c.speed)-385*dt));
 }
 // A fall from the toast bridge costs time; it is neither a free shortcut nor a respawn.
 if(c.bridgeMissActive){const cap=c.bridgeFalling>0?32:100;c.speed=Math.sign(c.speed)*Math.min(Math.abs(c.speed),cap);}
 c.steer=ctl.steer;
 c.knifeCd=Math.max(0,(c.knifeCd||0)-dt);
 c.bridgeMissGrace=Math.max(0,(c.bridgeMissGrace||0)-dt);
 c.bridgeMissPenalty=Math.max(0,(c.bridgeMissPenalty||0)-dt);
 if(c.bridgeMissActive&&c.bridgeMissPenalty<=0)c.bridgeMissActive=false;
 c.bridgeFalling=Math.max(0,(c.bridgeFalling||0)-dt);
  c.bridgeExitVisual=Math.max(0,(c.bridgeExitVisual||0)-dt);
 c.oilCooldown=Math.max(0,(c.oilCooldown||0)-dt);
 c.respawnGrace=Math.max(0,(c.respawnGrace||0)-dt);
 c.impactGrace=Math.max(0,(c.impactGrace||0)-dt);
 const preSurface=offTrackDynamics(nearestCourse(c,points).distance);
 // Jam slowing is handled before acceleration; no fake tiny per-frame drag.

 if(preSurface.outside)c.speed*=Math.max(.93,1-(1-preSurface.speedFactor)*dt*1.9);

 let turn=c.profile.turn*(.24+clamp(Math.abs(c.speed)/160,0,1)*.76)*(c.slip>0?.38:1)*preSurface.grip*(c.profile.gripFactor||1);
 if((c.oilSpin||0)>0){const step=Math.min(dt,c.oilSpin);c.a+=c.oilSpinDir*2*Math.PI*(step/1.16);c.oilSpin-=step;c.speed=Math.sign(c.speed)*Math.min(Math.abs(c.speed),145);}
 else c.a+=ctl.steer*turn*(c.speed>=0?1:-.7)*dt;
 c.a+=(c.hitYaw||0)*dt;c.hitYaw=(c.hitYaw||0)*Math.exp(-4.0*dt);
 if(c.claw>0){
   c.claw-=dt;const t=c.clawTarget,d=t?distance(c,t):0;
   const front=t?Math.abs(angleDiff(Math.atan2(t.y-c.y,t.x-c.x),c.a)):99;
   const obstructed=t?props.some(o=>o.solid&&K.segmentCircle(c,t,o,(o.r||18)+2)):true;
   if(!t||t.done||d>164||front>.65||obstructed||c.jump>0||t.jump>0){c.claw=0;c.clawTarget=null;}
   else{
     const result=clawPullStep(c,t,dt);
     if(!result.connected){c.claw=0;c.clawTarget=null;}
   }
 }
 const oldX=c.x,oldY=c.y;
 // Grip and stability govern lateral drift recovery, unlike top speed/acceleration.
 const slideDrag=(c.slip>0?.95:5.6)*(c.profile.gripFactor||1)*(c.profile.stabilityFactor||1);
 c.skidVX=(c.skidVX||0)*Math.exp(-slideDrag*dt);
 c.skidVY=(c.skidVY||0)*Math.exp(-slideDrag*dt);
 c.x+=(Math.cos(c.a)*c.speed+(c.hitVX||0)+c.skidVX)*dt;
 c.y+=(Math.sin(c.a)*c.speed+(c.hitVY||0)+c.skidVY)*dt;
 const hitDrag=(c.impactGrace>0?2.65:6.0)*(c.profile.stabilityFactor||1);
 c.hitVX=(c.hitVX||0)*Math.exp(-hitDrag*dt);c.hitVY=(c.hitVY||0)*Math.exp(-hitDrag*dt);
 c.wheelPhase=(c.wheelPhase||0)+Math.abs(c.speed)*dt/11.5;
 // v80: treat a real entrance contact as an immediate jump. Running this
 // before route audits avoids declaring a legitimate pre-lip approach illegal.
 c.rampEntryVisual=false;
 if(!c.onBridge && c.jump<=0){
   for(const o of props){if(o.type!=='ramp')continue;
     const previous={x:oldX,y:oldY};
     const valid=!c.bridgeMissActive&&!(c.bridgeMissGrace>0)&&!(c.respawnGrace>0);
     if(valid&&rampEntryVisual(c,o,previous))c.rampEntryVisual=true;
     if(valid&&rampLaunch(c,o,previous)){
       c.jump=.96;c.jumpTotal=.96;c.jumpCd=1.85;
       c.speed=Math.min(c.profile.max*1.36,Math.max(152,c.speed)*1.17);
       c.boost=Math.max(c.boost,.68);
       c.onBridge=true;c.bridgeTakeoff=true;c.rampEntryVisual=false;c.bridgeOffSeconds=0;
       if(c===race.player)SND.sfx('ramp');
       break;
     }
   }
 }
 // CPU recovery: attempt steering and reversing before checkpoint respawn.
 if(c!==race.player&&!(race.mode==='online'&&onlineSession?.members[c.id])){const progress=distance(c,{x:c.lastMoveX??c.x,y:c.lastMoveY??c.y});
  c.stuckTime=(c.stuckTime||0)+(Math.abs(c.speed)<24&&progress<3?dt:-dt*.65);
  c.stuckTime=Math.max(0,c.stuckTime);
  if(c.stuckTime>2.3&&c.reverseRecovery<=0)c.reverseRecovery=.75;
  if(c.stuckTime>5){recoverCar(c,'cpu-stuck');c.speed=48;}
  c.lastMoveX=c.x;c.lastMoveY=c.y;
 }
 // On-road snapshots are only written after complete frame of verified lane contact.
 // No penalty for a normal outside detour at the finish-line seam (p=1 -> p=0).
 let near=nearestCourse(c,points);
 const routeCheck=junctionContinuity(c,near,oldX,oldY,dt);
 if(routeCheck.penalty){recoverCar(c,'junction-cut');continue;}
 near=routeCheck.near;c.routeResolvedNear=near;
 let surface=offTrackDynamics(near.distance);
 // In the first two bends, the cloth is visually continuous but nearest-track
 // projection can briefly overshoot its nominal 138u centreline distance.
 // A 20u edge cushion avoids false respawns on legitimate inside racing lines.
 const protectedEarlyBend=near.p>.015&&near.p<.335&&near.distance<=165;
 if(protectedEarlyBend&&surface.outside)surface={outside:false,grip:surface.grip,speedFactor:surface.speedFactor};
 if(c.bridgeLandingActive&&!c.onBridge&&nearestTrack(c,points).distance<112){c.bridgeLandingActive=false;c.bridgeMissGrace=Math.max(c.bridgeMissGrace||0,1.2);c.auditP=near.p;c.auditTravel=0;c.auditOutsideTime=0;}
 const nowInside=insideTrackLoop(c,points);
 // The toast bridge is the only approved shortcut and is explicitly exempt.
 // It must be approached through the ramp (c.onBridge), not by jumping the map.
 if(c.onBridge){c.auditBridge=true;}
 else if(c.auditBridge){c.auditBridge=false;c.auditP=near.p;c.auditTravel=0;c.auditCleanTime=0;c.auditOutsideTime=0;}
 else if(!c.bridgeMissActive && !c.bridgeLandingActive && !(c.respawnGrace>0) && !(c.impactGrace>0)){
   const deltaTravel=Math.hypot(c.x-oldX,c.y-oldY);
   c.auditTravel=(c.auditTravel||0)+Math.min(deltaTravel,40);
   // A large phase jump is NOT sufficient evidence of an illegal shortcut:
   // at adjacent hairpins, two legitimate road segments can project to widely
   // separated phases. Require verified time away from the drivable corridor.
   c.auditOutsideTime=near.distance>196&&!near.shortcut?(c.auditOutsideTime||0)+dt:Math.max(0,(c.auditOutsideTime||0)-dt*.6);
   const suspiciousAdvance=illegalRouteGain(c.auditP??c.lastP??near.p,near.p,c.auditTravel,TRACK_LENGTH);
   if(suspiciousAdvance&&c.auditOutsideTime>.47){
     recoverCar(c,'route-cut');continue;
   }
   if(near.distance<75&&!surface.outside&&c.speed>=0&&Math.cos(angleDiff(c.a,tangent(near.p)))>.38){
     c.auditCleanTime=(c.auditCleanTime||0)+dt;
     const gain=K.forwardProgress(c.auditP??near.p,near.p)*TRACK_LENGTH;
     if(c.auditCleanTime>.24&&gain>165&&gain<c.auditTravel*1.13+30){
       c.auditP=near.p;c.auditTravel=0;c.auditCleanTime=0;c.auditOutsideTime=0;
     }
   } else c.auditCleanTime=0;
 }
 // Only a return to the entrance side of the ordinary road clears a missed bridge.
 // This prevents crossing the cloth directly to the bridge exit as a free shortcut.
 if(c.bridgeMissActive){const m=nearestTrack(c,points);
   if(m.distance<85&&m.p>=shortcutFrom-.065&&m.p<=shortcutFrom+.045){
     c.bridgeMissActive=false;c.bridgeMissPenalty=0;c.bridgeMissGrace=0;c.offtrack=false;
     c.offtrackEntry=null;c.offtrackSeconds=0;
   }
 }
 // Early bend gate: a big cut across the table before the cup is not a valid route.
 // Do not interfere with the approved toast bridge, recovery grace or landing state.
 if(!near.shortcut&&!c.onBridge&&!c.bridgeLandingActive&&!c.bridgeMissActive&&!(c.bridgeMissGrace>0)&&!(c.respawnGrace>0)&&!(c.impactGrace>0)&&!(c.tableFalling>0)){
   const gate=mugBendGate(near,c,c.mugApexPassed);
   c.mugApexPassed=gate.passed;
   if(gate.penalty){recoverCar(c,'cup-cut');continue;}
 }
 if(!c.routePinch&&near.distance<64&&!near.shortcut&&!c.offtrack&&!(c.respawnGrace>0)&&!c.stuckAnchor&&
    Math.cos(angleDiff(c.a,tangent(near.p)))>.23&&c.speed>=0&&!c.bridgeMissActive){
   c.lastValidPosition={x:near.x,y:near.y,a:tangent(near.p),p:near.p,speed:Math.abs(c.speed),laps:c.lapsCompleted,flags:c.flags.slice(),mugApexPassed:!!c.mugApexPassed};
   c.lastCheckpoint=near.p;
 }
 if(surface.outside&&!c.offtrack){
   if(!finishEdgeTolerance(c,near))c.lapGateBlocked=true; // short legal finish excursion does not disarm a previously earned gate
   c.offtrackEntry=c.lastValidPosition||{x:near.x,y:near.y,a:tangent(near.p),p:near.p,speed:50,laps:c.lapsCompleted,flags:c.flags.slice(),mugApexPassed:!!c.mugApexPassed};
    c.maxInteriorCut=0;c.offtrackSeconds=0;c.offtrackReturnGrace=0;c.offtrackLastDistance=near.distance;
    if(c===race.player)SND.sfx('offtrack');
 }
 if(surface.outside||c.offtrack){
   c.offtrackSeconds=(c.offtrackSeconds||0)+dt;
   if(nowInside)c.maxInteriorCut=Math.max(c.maxInteriorCut||0,near.distance);
   const penalty=!near.shortcut&&c.offtrackEntry&&shortcutViolation(c.offtrackEntry.p,near.p,nowInside,
      c.offtrackSeconds,c.maxInteriorCut||0);
   const lenientJamCurve=near.p>.77&&near.p<.84&&near.distance<164&&c.offtrackSeconds<.70;
   const lenientFinish=(!near.shortcut)&&(near.p>.965||near.p<.03)&&near.distance<166&&c.offtrackSeconds<.62;
   // A driver visibly returning to the course gets a short continuous correction window.
    const retreat=(c.offtrackLastDistance??near.distance)-near.distance;
    c.offtrackReturnGrace=Math.max(0,(c.offtrackReturnGrace||0)-dt);
    if(retreat>Math.max(1.0,dt*20))c.offtrackReturnGrace=1.0;
    c.offtrackLastDistance=near.distance;
    const recoverWide=!(c.offtrackReturnGrace>0)&&wideCornerRecovery(near.distance,c.offtrackSeconds,near.shortcut);
   // Early breakfast bend: keep legal tight lines safe, but do NOT allow a cloth-cut before the mug.
   const earlyBendAdvance=!near.shortcut&&c.offtrackEntry?K.forwardProgress(c.offtrackEntry.p,near.p):0;
   const lenientEarlyBend=!near.shortcut&&near.p>.095&&near.p<.335&&near.distance<166&&c.offtrackSeconds<.90&&earlyBendAdvance<.088;
   if(!c.onBridge&&!c.bridgeLandingActive&&!c.bridgeMissActive&&!(c.bridgeMissGrace>0)&&!(c.impactGrace>0)&&!(lenientEarlyBend||lenientJamCurve||lenientFinish)&&(penalty||recoverWide)){
     recoverCar(c,penalty?'shortcut':'wide-corner');near=nearestCourse(c,points);
   }else if(!surface.outside){
     // A legal return resumes progress; the finish uses its own bounded tolerance.
     c.offtrack=false;c.offtrackEntry=null;c.offtrackSeconds=0;c.maxInteriorCut=0;c.offtrackReturnGrace=0;c.offtrackLastDistance=0;
   }else c.offtrack=true;
 }
 // Mid-bridge crossing is never a legal shortcut. A misstep drops onto the cloth;
 // it does NOT teleport the car to a checkpoint. The lost momentum is the penalty.
 if(!c.onBridge && !(c.respawnGrace>0) && !c.bridgeMissActive && !(c.bridgeMissGrace>0)){
   const b=shortcutNearest(c),main=nearestTrack(c,points);
   if(b.t>.22&&b.t<.90&&b.distance<26&&main.distance>138){
     bridgeFall(c);near=nearestCourse(c,points);
   }
 }
 // On the narrow toast, the edge is a real fall rather than an instant respawn.
 if(c.onBridge){
   const branch=shortcutNearest(c);
   if(branch.t>.96 && branch.distance<65){c.onBridge=false;c.bridgeOffSeconds=0;c.bridgeExitVisual=.34;}
   else if(c.jump>0){
     // Do not judge airborne steering as a failed landing: measure contact only
     // after the wheels touch the lower tablecloth / toast bridge.
     c.bridgeOffSeconds=0;
   }else if(bridgeLaneViolation(c,47)){
     c.bridgeOffSeconds=(c.bridgeOffSeconds||0)+dt;
     if(c.bridgeOffSeconds>.22){bridgeFall(c);near=nearestCourse(c,points);}
   }else c.bridgeOffSeconds=0;
 }
 // The actual boundary of the tabletop, not the crumb border, is a rescue zone.
 if(edgeOfTable(c)&&!(c.tableFalling>0)){startTableFall(c);continue;}

  // v80: the actual landing determines whether the driver stays on toast.
  // During flight the vehicle is above the deck; a wide landing fails with
  // lost momentum and a real drop to the cloth, never a free teleport.
  if(c.bridgeTakeoff && c.jump<=0){
    c.bridgeTakeoff=false;
    const landing=shortcutNearest(c);
    if(!(landing.t>=.012&&landing.t<=.94&&landing.distance<=45)){
      bridgeFall(c);near=nearestCourse(c,points);
    }else{
      c.onBridge=true;c.bridgeOffSeconds=0;
    }
  }
 // Orange rind in v62 is a solid obstacle: no auto-launch and no jump award.
 // Static object collisions; jump avoids low obstacles.
 let touchedObstacle=false;
 for(const o of props){if(contactWithProp(c,o,{x:oldX,y:oldY})){
   touchedObstacle=true;
   if(c===race.player&&c.jump<=0&&race.time-(c.lastPropHit||-10)>.35){c.lastPropHit=race.time;SND.sfx('impact');}
 }}
 if(stuckRecoveryStep(c,dt,race.time,touchedObstacle))recoverCar(c,'stuck');
 // No invisible lane barrier; low-friction cloth instead of teleporting on contact.
 // Oil reduces grip but never forces a full spin.
 // Reuse oil physics for both deployed power-up oil and the fixed cereal-milk spills.
 for(let si=0,n=race.oils.length+milkCerealSpills.length;si<n;si++){
  const oil=si<race.oils.length?race.oils[si]:milkCerealSpills[si-race.oils.length];
  if(!(c.oilCooldown>0)&&!(c.oilSpin>0)&&oilHit(c,oldX,oldY,oil)){
   c.slip=Math.max(c.slip,1.22);c.oilCooldown=1.55;c.oilSpin=1.16;
   const sign=Math.abs(c.steer)>.16?Math.sign(c.steer):(c.id%2?1:-1);
   c.oilSpinDir=sign;
   c.skidVX=(c.skidVX||0)-Math.sin(c.a)*sign*65;
   c.skidVY=(c.skidVY||0)+Math.cos(c.a)*sign*65;
   c.speed*=.80;
   if(c===race.player)SND.sfx('oilSkid');
 }}
 // Pickup collision: a fixed 1.5× visible-box diameter (22 * 1.5 / 2).
 for(const p of race.pickups){if(p.cool>0||c.item||c.jump>0)continue;if(circleRotatedRect(p,c,p.r)){c.item=pickupType(race.mode,Math.random());p.cool=K.pickupRespawnSeconds(race.cars.length);if(c===race.player){if(race.mode==='career'&&race.careerStats)race.careerStats.pickups++;SND.sfx('pickup');}}}
 // Checkpoint and three-lap progress.
 let closest=c.routeResolvedNear||nearestCourse(c,points),pr=closest.p;c.p=pr;const oldP=c.lastP;
 if(race.mode==='elimination')eliminationProgressUpdate(c,pr,dt);
 // Checkpoints demand valid forward road progress; finish has a generous gate across
 // the full usable width so an imperfect racing line does not forfeit the lap.
 const clearLane=!c.offtrack&&!c.bridgeMissActive&&!(c.respawnGrace>0)&&!(c.tableFalling>0);
 if(clearLane&&closest.distance<=150){
   if(pr>.81)c.lapGateBlocked=false;
   if(pr>.17&&pr<.36)c.flags[0]=true;
   if(pr>.43&&pr<.62)c.flags[1]=true;
   if(pr>.68&&pr<.86)c.flags[2]=true;
 }
 // True finish-line intersection from position, also if the inner racing line
 // makes nearest-track phase fail to wrap at this particular curve.
 // Outside the crumbs (road-edge distance 138), allow up to 48 additional
 // world units only at the finish and only before the respawn/cut threshold.
 // Checkpoints are still earned on road. This never grants a shortcut lap.
 const legalOuterFinish=c.offtrack&&finishEdgeTolerance(c,closest);
 const finishSurfaceOk=clearLane||legalOuterFinish;
 const blockedGate=c.lapGateBlocked||!finishSurfaceOk;
 const gateReady=c.flags.every(Boolean);
 const planeCrossed=finishLinePlane({x:oldX,y:oldY},c,trackPoint(0),tangent(0),186,blockedGate,gateReady,c.speed);
 // Legacy phase-based seam is retained for comparison in tests, NOT used for laps:
 // finishGateCrossing(oldP,pr,closest.distance,blockedGate,gateReady,c.speed)
 const crossed=planeCrossed;
 if(crossed){c.lapsCompleted++;c.flags=[false,false,false];c.mugApexPassed=false;c.lapGateBlocked=true;
   if(c.lapsCompleted>=3&&race.mode!=='elimination'){c.done=true;c.finishTime=race.time;}
   else if(c===race.player){showHint(`${t('lapNotice')} ${c.lapsCompleted+1}!`,1.1);SND.sfx('lap');}
 }
 c.lastP=pr;
 // AI uses boosts tactically, not excessive oil spam.
 if(c!==race.player&&!(race.mode==='online'&&onlineSession?.members[c.id])&&c.item){if(c.item==='turbo'&&c.speed>95&&Math.random()<.005)useItem(c);else if(c.item==='oil'&&Math.random()<.0008)useItem(c);else if(c.item==='claw'&&clawTarget(c,race.cars,props,162,.30)&&Math.random()<.09)useItem(c);}
 }
 // SAT collision response: no overlap and no sticky joints, with temporary lateral knockback.
 const contacts=resolveCarContacts(race.mode==='elimination'?eliminationActive():race.cars);
 // A strong bump can physically carry another car beyond the tabletop boundary;
 // run the fall detector AFTER collision resolution, not only before it.
 for(const c of race.cars)if(!c.done&&!(c.tableFalling>0)&&edgeOfTable(c))startTableFall(c);
 for(const hit of contacts.hits){race.effects.push({kind:'impactBurst',x:hit.x,y:hit.y,t:.32,ttl:.32,nx:hit.nx,ny:hit.ny,intensity:hit.intensity});}
 if(contacts.impacts>0&&contacts.maxImpulse>24&&race.time-race.lastImpactSound>.24){SND.sfx('impact');race.lastImpactSound=race.time;}
 if(race.mode==='elimination'){eliminationEvaluate(dt);syncAudio();}
 else if(race.mode==='online'&&onlineSession?.host){
  const members=onlineSession.members.filter(Boolean);const humans=members.map(m=>race.cars[m.slot]).filter(Boolean);
  if(humans.some(c=>c.done)&&!onlineFinishDeadline)onlineFinishDeadline=race.time+26;
  if(humans.length&&((humans.every(c=>c.done))||(onlineFinishDeadline&&race.time>=onlineFinishDeadline))){
   race.finished=true;syncAudio();onlineFinish();SND.stopMusic();SND.sfx('finish');const completedRace=race;setTimeout(()=>{if(race===completedRace&&race.finished)showResults();},850);
  }else syncAudio();
 }else if(race.player.done){race.finished=true;syncAudio();SND.stopMusic();SND.sfx('finish');const completedRace=race;setTimeout(()=>{if(race===completedRace&&race.finished)showResults();},850);}else syncAudio();
 hud();
}
function showResults(){
 if(!race)return;
 if(race.mode==='elimination')return showEliminationResults();const c=race.player,mode=race.mode,finished=race.cars.slice().sort((a,b)=>a.finishTime==null?1:b.finishTime==null?-1:a.finishTime-b.finishTime);let best='';
 if(mode==='trial'&&c.finishTime!=null){const key=`ttr_tt_colazione_${c.profile.id}`;try{const previous=Number(localStorage.getItem(key))||Infinity;if(c.finishTime<previous){localStorage.setItem(key,String(c.finishTime));best='🏆 '+t('recordNew');}else best=`${t('recordOld')}: ${fmtTime(previous)}`;}catch(e){best=t('saveUnavailable');}}
 const place=finished.indexOf(c)+1,compact=finished.length>=6;
 let careerAward=null;
 if(mode==='career'&&c.done&&!race.careerRecorded){
  race.careerRecorded=true;
  careerAward=window.TTRCareer?.recordResult({mode:'career',finished:true,laps:c.lapsCompleted,place,racerCount:finished.length,
   carId:c.profile.id,respawns:c.shortcutRespawns||0,pickups:race.careerStats?.pickups||0,
   turbos:race.careerStats?.turbos||0,oils:race.careerStats?.oils||0,claws:race.careerStats?.claws||0});
 }

 SND.stopMusic();
 const outcome=mode==='trial'?'podiumJingle':place===1?'victoryJingle':place<=3?'podiumJingle':'defeatJingle';
 SND.sfx(outcome);
 if(resultsMusicTimer!==null)clearTimeout(resultsMusicTimer);
 const completedRace=race;
 resultsMusicTimer=setTimeout(()=>{resultsMusicTimer=null;if(race===completedRace&&race.finished)SND.music('menu');},4600);
 const rows=finished.map((r,i)=>`<tr class="${r===c?'me':''}"><td>${i+1}°</td><td class="result-car-td">${ttrResultCarCell(r,r===c)}</td><td>${r.done?fmtTime(r.finishTime):t('racing')}</td></tr>`).join('');
 const panel=document.createElement('div');panel.className=`panel resultsPanel${compact?' compact':''}`;panel.innerHTML=`<div class="flag-tape"></div><p class="eyebrow">${t('trackName')} · ${t('results')}</p><h2 class="resultTitle">${mode==='trial'?t('trialDone'):`${t('finish')}: ${place}° ${t('place')}`}</h2><div class="resultSummary"><div class="resultCard"><b>${t('place')}</b>${place}° / ${finished.length}</div><div class="resultCard"><b>${t('yourTime')}</b>${fmtTime(race.time)}</div>${best?`<div class="resultCard" style="grid-column:${compact?'1 / -1':'auto'}"><b>${mode==='trial'?'TIME TRIAL':'INFO'}</b>${best}</div>`:''}</div>${mode==='career'?`<div class="career-result">${careerAward?.newUnlocks?.length?'🏆 MISSIONE COMPLETATA · '+careerAward.newUnlocks.map(id=>(window.TTRVehicleRoster||[]).find(v=>v.id===id)?.name||id).join(', '):'🏁 Progressi Carriera aggiornati'}</div>`:''}<table class="results ${compact?'compact':''}"><tbody>${rows}</tbody></table><div class="menu-row"><button class="btn" id="again">${t('again')}</button><button class="btn secondary" id="toMenu">${t('menu')}</button></div>${compact?'':`<p class="note">${t('demoNote')}</p>`}`;
 $('screen').innerHTML='';$('screen').appendChild(panel);$('screen').hidden=false;$('screen').style.display='flex';$('controls').style.display='none';$('hud').style.display='none';
 ttrRenderResultThumbnails(panel,completedRace);
 $('again').onclick=()=>{if(mode==='online'){onlineQuit();mainMenu();onlineOpenPanel();}else openCircuitLoading(mode)};$('toMenu').onclick=mode==='career'?()=>{mainMenu();window.TTRCareer?.open();}:mainMenu;
}
const I18N=window.TTRI18N;
const t=I18N.t;
let selectedCar=0,garagePreview=0,menuTimer=null,menuStep=0,lastShowroomDraw=0,garageRotationOrigin=0;

// v0.13.6.68 — Canonical first-season circuit catalog. Locked tracks have no driving geometry,
// so they may be previewed in text but are NEVER passed into initRace or misrepresented as playable.
const TTRCircuitCatalog=Object.freeze([
 {id:'colazione-turbo',name:'Colazione Turbo',scene:'colazione',ready:true},
 {id:'desk-drift',name:'Desk Drift',scene:null,ready:false},
 {id:'box-di-biliardo',name:'Box di Biliardo',scene:null,ready:false},
 {id:'bagno-sprint',name:'Bagno Sprint',scene:null,ready:false},
 {id:'garage-grid',name:'Garage Grid',scene:null,ready:false},
 {id:'giardino-mini-gp',name:'Giardino Mini GP',scene:null,ready:false},
 {id:'market-rush',name:'Market Rush',scene:null,ready:false},
 {id:'sofa-loop',name:'Sofa Loop',scene:null,ready:false},
 {id:'playroom-panic',name:'Playroom Panic',scene:null,ready:false},
 {id:'laundry-slide',name:'Laundry Slide',scene:null,ready:false},
 {id:'terrazza-veloce',name:'Terrazza Veloce',scene:null,ready:false},
 {id:'lab-finale',name:'Lab Finale',scene:null,ready:false}
].map((v,i)=>Object.freeze({...v,index:i+1})));
window.TTRTrackCatalog=TTRCircuitCatalog;
let activeTrackMode=null, selectedTrackId='colazione-turbo';
const TTRTrackCopy=Object.freeze({
 it:{title:'SCEGLI IL CIRCUITO',ready:'GIOCABILE',locked:'IN SVILUPPO',info:'Minimappa reale · Power-up su tutto il tracciato',back:'← INDIETRO',continue:'CONTINUA',launch:'AVVIA GARA',lockedInfo:'Tracciato in sviluppo · minimappa non ancora disponibile'},
 en:{title:'CHOOSE A TRACK',ready:'PLAYABLE',locked:'IN DEVELOPMENT',info:'Actual course map · Power-ups throughout',back:'← BACK',continue:'CONTINUE',launch:'START RACE',lockedInfo:'Track in development · no course map yet'},
 es:{title:'ELIGE EL CIRCUITO',ready:'JUGABLE',locked:'EN DESARROLLO',info:'Minimapa real · Potenciadores en todo el circuito',back:'← VOLVER',continue:'CONTINUAR',launch:'INICIAR CARRERA',lockedInfo:'Circuito en desarrollo · minimapa pendiente'},
 de:{title:'STRECKE WÄHLEN',ready:'SPIELBAR',locked:'IN ENTWICKLUNG',info:'Echte Streckenkarte · Power-ups auf der Strecke',back:'← ZURÜCK',continue:'WEITER',launch:'RENNEN STARTEN',lockedInfo:'Strecke in Entwicklung · noch keine Streckenkarte'},
 fr:{title:'CHOISIR UN CIRCUIT',ready:'JOUABLE',locked:'EN DÉVELOPPEMENT',info:'Vraie carte · Bonus sur tout le parcours',back:'← RETOUR',continue:'CONTINUER',launch:'LANCER LA COURSE',lockedInfo:'Circuit en développement · carte non disponible'},
 pt:{title:'ESCOLHER PISTA',ready:'JOGÁVEL',locked:'EM DESENVOLVIMENTO',info:'Minimapa real · Itens em toda a pista',back:'← VOLTAR',continue:'CONTINUAR',launch:'INICIAR CORRIDA',lockedInfo:'Pista em desenvolvimento · minimapa indisponível'}
});
function TTRDrawActualMinimap(canvas){
 if(!canvas||!Array.isArray(points)||!points.length)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const W=canvas.width,H=canvas.height;ctx.clearRect(0,0,W,H);
 ctx.fillStyle='#091a39';ctx.fillRect(0,0,W,H);
 const x0=Math.min(...points.map(p=>p.x)),x1=Math.max(...points.map(p=>p.x));
 const y0=Math.min(...points.map(p=>p.y)),y1=Math.max(...points.map(p=>p.y));
 const k=Math.min((W-30)/Math.max(1,x1-x0),(H-24)/Math.max(1,y1-y0));
 ctx.save();ctx.translate(W/2,H/2);ctx.scale(k,k);ctx.translate(-(x0+x1)/2,-(y0+y1)/2);
 ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();
 ctx.strokeStyle='#274f86';ctx.lineWidth=85;ctx.stroke();ctx.strokeStyle='#f2d78e';ctx.lineWidth=23;ctx.stroke();
 const start=trackPoint(0);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(start.x,start.y,38,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#132f53';ctx.beginPath();ctx.arc(start.x,start.y,19,0,Math.PI*2);ctx.fill();ctx.restore();
}
function TTRPaintCareerTracks(){const root=$('careerCircuitCatalog');if(!root)return;root.replaceChildren();TTRCircuitCatalog.forEach(c=>{const label=document.createElement('span');label.className='ttr-career-circuit'+(c.ready?' ready':'');label.textContent=String(c.index).padStart(2,'0')+' · '+c.name+(c.ready?' ✓':'');root.append(label);});}
TTRPaintCareerTracks();
function TTROpenTrackSelect(mode){
 if(!TTRModeConfigs[mode])return;TTRCloseRaceConfig(false);activeTrackMode=mode;
 selectedTrackId='colazione-turbo';const copy=TTRTrackCopy[I18N.getLang()]||TTRTrackCopy.it;
 const panel=$('trackSelect'),grid=$('trackSelectGrid');if(!panel||!grid)return;
 $('trackSelectTitle').textContent=copy.title;
 $('trackSelectSubtitle').textContent=t(mode==='race'?'quickRace':'elimination')+' · 1 / '+TTRCircuitCatalog.length+' '+copy.ready;
 $('trackSelectBack').textContent=copy.back;$('trackSelectNext').textContent=copy.continue;
 grid.replaceChildren();
 TTRCircuitCatalog.forEach((c)=>{
  const btn=document.createElement('button');btn.type='button';btn.className='ttr-track-card'+(c.id===selectedTrackId?' is-selected':'');btn.dataset.track=c.id;
  btn.disabled=!c.ready;btn.setAttribute('aria-label',String(c.index).padStart(2,'0')+' · '+c.name+' · '+(c.ready?copy.ready:copy.locked));
  if(c.ready){const map=document.createElement('canvas');map.width=180;map.height=94;map.setAttribute('aria-hidden','true');btn.append(map);TTRDrawActualMinimap(map);}
  else{const blank=document.createElement('span');blank.className='ttr-track-empty';blank.classList.add('ttr-v69-upcoming');blank.setAttribute('aria-hidden','true');btn.append(blank);}
  const labels=document.createElement('span');labels.className='ttr-track-info';const title=document.createElement('b');title.textContent=String(c.index).padStart(2,'0')+' · '+c.name;
  const status=document.createElement('small');status.textContent=c.ready?copy.ready:copy.locked;labels.append(title,status);btn.append(labels);
  if(c.ready)btn.addEventListener('click',()=>{selectedTrackId=c.id;grid.querySelectorAll('button').forEach(e=>e.classList.toggle('is-selected',e.dataset.track===c.id));TTRUpdateTrackPreview();SND.sfx('select');});grid.append(btn);
 });
 TTRUpdateTrackPreview();panel.hidden=false;grid.querySelector('.is-selected')?.focus();SND.sfx('select');
}
function TTRUpdateTrackPreview(){const c=TTRCircuitCatalog.find(t=>t.id===selectedTrackId);const copy=TTRTrackCopy[I18N.getLang()]||TTRTrackCopy.it;if(!c)return;
 $('trackSelectSelected').textContent=String(c.index).padStart(2,'0')+' · '+c.name.toUpperCase();$('trackSelectInfo').textContent=c.ready?copy.info:copy.lockedInfo;
 if(c.ready)TTRDrawActualMinimap($('trackSelectMap'));
 $('trackSelectNext').disabled=!c.ready;
}
function TTRCloseTrackSelect(){const panel=$('trackSelect');if(panel)panel.hidden=true;activeTrackMode=null;}
function TTRAdvanceTrackSelect(){const c=TTRCircuitCatalog.find(t=>t.id===selectedTrackId);if(!activeTrackMode||!c?.ready||!c.scene)return;
 const mode=activeTrackMode;TTRCloseTrackSelect();TTROpenRaceConfig(mode);
}
// v67: separate persistent race configurations; never mix with global language/audio settings.
const TTRModeDefaults=Object.freeze({race:Object.freeze({racers:'4',difficulty:'1',auto:'1',elimGoal:'5'}),elimination:Object.freeze({racers:'4',difficulty:'1',auto:'1',elimGoal:'5'})});
let TTRModeConfigs={race:{...TTRModeDefaults.race},elimination:{...TTRModeDefaults.elimination}},activeConfigMode=null;
try{const saved=JSON.parse(localStorage.getItem('ttr_mode_config_v67')||'null');if(saved&&typeof saved==='object')for(const m of ['race','elimination'])if(saved[m])for(const k of Object.keys(TTRModeDefaults[m])){const val=String(saved[m][k]);if(({racers:['4','6','8'],difficulty:['0.8','1','1.13'],auto:['0','1'],elimGoal:['3','5','7']})[k].includes(val))TTRModeConfigs[m][k]=val;}}catch(_){}
function TTRCareerDifficulty(){const state=window.TTRCareer?.getState?.()||{};const wins=Math.max(0,Number(state.wins)||0),medals=window.TTRCareerCore?.medalCount?.(state)||0;return Math.min(1.13,.88+Math.min(7,wins)*.028+Math.min(10,medals)*.007);}
function TTRCloseRaceConfig(returnToTracks=false){const mode=activeConfigMode;const panel=$('raceConfig');if(panel)panel.hidden=true;activeConfigMode=null;if(returnToTracks&&mode)TTROpenTrackSelect(mode);}
function TTROpenRaceConfig(mode){if(!TTRModeConfigs[mode])return;const chosen=TTRCircuitCatalog.find(c=>c.id===selectedTrackId);if(!chosen?.ready||!chosen.scene)return;
 activeConfigMode=mode;const panel=$('raceConfig'),cfg=TTRModeConfigs[mode];if(!panel)return;
 for(const name of ['racers','difficulty','auto','elimGoal'])$(name).value=cfg[name];$('eliminationGoalField').hidden=mode!=='elimination';
 const title=$('raceConfigTitle');title.dataset.i18n=mode==='race'?'quickRace':'elimination';I18N.apply();
 $('raceSelectedTrack').textContent=String(chosen.index).padStart(2,'0')+' · '+chosen.name.toUpperCase();
 const copy=TTRTrackCopy[I18N.getLang()]||TTRTrackCopy.it;const start=$('raceConfigStart');start.removeAttribute('data-i18n');start.textContent=copy.launch;
 panel.hidden=false;start.focus();SND.sfx('select');}
function TTRStartConfiguredRace(){const mode=activeConfigMode;const track=TTRCircuitCatalog.find(c=>c.id===selectedTrackId);if(!TTRModeConfigs[mode]||!track?.ready||!track.scene)return;
 const cfg={};for(const name of ['racers','difficulty','auto','elimGoal'])cfg[name]=$(name).value;TTRModeConfigs[mode]=cfg;
 try{localStorage.setItem('ttr_mode_config_v67',JSON.stringify(TTRModeConfigs));}catch(_){}
 TTRCloseRaceConfig(false);SND.unlock();stopMenuMusic();openCircuitLoading(mode);}

try{selectedCar=+localStorage.getItem('ttr_selected_car')||0;}catch(e){}selectedCar=clamp(selectedCar,0,profiles.length-1);
const initialMenu=$('screen').innerHTML;
function mainMenu(){
 if(onlineSession)onlineQuit();
 if(resultsMusicTimer!==null){clearTimeout(resultsMusicTimer);resultsMusicTimer=null;}
 loadingToken++;$('loadingTrack').hidden=true;race=null;releaseAllControls();hideEliminationUI();$('pauseOverlay').hidden=true;syncAudio();$('garageScreen').hidden=true;$('languageScreen').hidden=true;if($('careerScreen'))$('careerScreen').hidden=true;if($('careerMissionsScreen'))$('careerMissionsScreen').hidden=true;
 const oldSettings=$('retroSettings');if(oldSettings)oldSettings.remove();const oldRaceConfig=$('raceConfig');if(oldRaceConfig)oldRaceConfig.remove();const oldTrackSelect=$('trackSelect');if(oldTrackSelect)oldTrackSelect.remove();
 $('screen').innerHTML=initialMenu;$('screen').hidden=false;$('screen').style.display='flex';$('controls').style.display='none';$('hud').style.display='none';
 I18N.apply();wireMenu();startMenuMusic();refreshAudioUI();if($('menuCarName'))$('menuCarName').textContent=profiles[selectedCar].name.toUpperCase();drawShowroom($('menuCar'),selectedCar,'menu');
}
function showLanguage(){stopMenuMusic();$('screen').hidden=true;$('screen').style.display='none';$('garageScreen').hidden=true;$('languageScreen').hidden=false;}
// Fase 6f: wrapper di compatibilità; l'intera pittura delle vetture vive nel modulo 06f.
const {TTRShowroomStarts,TTRShowroom60}=window.TTRVehicleVisuals;
function drawShowroom(canvas,index,view='menu'){return window.TTRVehicleVisuals.drawShowroom(canvas,index,view,clock,garageRotationOrigin,profiles);}
function showGarage(){
 stopMenuMusic();SND.music('garage');$('screen').hidden=true;$('screen').style.display='none';$('garageScreen').hidden=false;
 garagePreview=selectedCar;garageRotationOrigin=clock;refreshGarage();ping(650,.10,.13);
}
window.TTRVehicleDesignStats=Object.freeze({"scatto":[6,7,7,7,5,7],"tuono":[7,8,5,6,8,6],"polvere":[6,7,8,8,6,7],"lampo":[8,7,8,7,4,5],"aero":[9,8,7,8,4,5],"enduro":[8,7,9,9,3,6],"brezza":[7,8,10,8,2,5],"volt":[9,10,6,7,4,5],"roccia":[6,6,5,7,9,9],"martello":[6,7,5,6,10,7],"turbovan":[6,7,6,7,8,7],"titan":[5,6,6,9,9,8],"hotflash":[8,10,5,5,7,5],"metrocab":[6,7,7,7,6,7],"interceptor":[7,8,7,7,8,6],"retrosprint":[7,6,8,8,5,6],"apex":[10,9,10,9,2,3],"tempesta":[8,9,9,7,5,5],"neon":[10,10,4,5,3,3],"behemoth":[5,6,3,5,10,10]});
function refreshGarage(){if(typeof window.TTRUpdateGarageCollectionCount==='function')window.TTRUpdateGarageCollectionCount();const p=profiles[garagePreview];$('garageName').textContent=p.name;
 $('garageDesc').textContent=t(p.id+'Desc');
 // Six historical design indicators recovered from original project conversations; no gameplay physics changed.
 const garageDesignStats=window.TTRVehicleDesignStats;
 const garageDesignSource='Scheda numerica storica recuperata · revisioni successive da verificare';
 const garageLabels=['Velocità','Accelerazione','Sterzo','Grip','Impatto','Stabilità'];
 const stats=garageLabels.map((label,i)=>[label,garageDesignStats[p.id]?.[i]??0]);
 $('garageBars').setAttribute('aria-label',garageDesignSource); $('garageBars').innerHTML=stats.map(([label,raw])=>{const value=Math.max(0,Math.min(10,Number(raw)||0));return `<div class="garage-stats"><span class="garage-stat-label">${label}</span><div class="rail" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="10" aria-valuenow="${value}">${Array.from({length:10},(_,i)=>`<i class="${i<value?'filled':''}"></i>`).join('')}</div><b class="garage-stat-value">${value}/10</b></div>`}).join('');
 $('garageChoices').innerHTML=profiles.map((q,i)=>`<button class="car-choice ${i===garagePreview?'active':''}" data-car="${i}"><img class="car-choice-preview" data-image="${q.id}" alt="" aria-hidden="true"><span class="car-choice-info"><b>${String(i+1).padStart(2,'0')} · ${q.name}</b><small>${q.id===profiles[selectedCar].id?t('selected'):['HOT HATCH','V8','BUGGY','SPORT','SUPERCAR · TEST','ENDURANCE · TEST'][i]}</small></span></button>`).join('');
 document.querySelectorAll('.car-choice-preview').forEach(el=>{const car=el.dataset.image.replace('_showroom','');const pic=window.TTRAssets?.images[car+'_showroom']||window.TTRAssets?.images[car];if(pic?.src)el.src=pic.src;});
 document.querySelectorAll('[data-car]').forEach(el=>el.onclick=()=>{garagePreview=+el.dataset.car;garageRotationOrigin=clock;ping(640,.08,.07);refreshGarage();});
 const artCard=$('garageCanon');if(artCard){
   const pic=profiles[garagePreview].id+'_concept_views';
   const asset=window.TTRAssets?.images[pic];
   if(asset?.src)artCard.src=asset.src;
   artCard.alt='Viste ortogonali del concept ufficiale: '+profiles[garagePreview].name;
   artCard.title='Concept ufficiale: frontale, laterale, retro e dall’alto';
   artCard.hidden=true; // Reference sheet stays in the source archive only; showroom never shows cropped poster.
 }
 drawShowroom($('garageCanvas'),garagePreview,'garage');
}
function wireMenu(){
 // A transformed menu creates a non-viewport containing block for fixed dialogs.
 // Move Options to document.body, so the overlay is genuinely viewport-sized on iPhone.
 const settingsDialog=$('retroSettings');if(settingsDialog&&settingsDialog.parentNode!==document.body)document.body.appendChild(settingsDialog);const configDialog=$('raceConfig');if(configDialog&&configDialog.parentNode!==document.body)document.body.appendChild(configDialog);const trackDialog=$('trackSelect');if(trackDialog&&trackDialog.parentNode!==document.body)document.body.appendChild(trackDialog);
 const r=$('raceBtn'),trial=$('trialBtn'),garage=$('garageBtn'),mute=$('menuMute');
 const careerBtn=$('careerBtn');if(careerBtn)careerBtn.onclick=()=>{SND.unlock();window.TTRCareer?.open();};
  if(r)r.onclick=()=>{SND.unlock();TTROpenTrackSelect('race')};if(trial)trial.onclick=()=>{SND.unlock();stopMenuMusic();openCircuitLoading('trial')};const onlineBtn=$('onlineBtn');if(onlineBtn)onlineBtn.onclick=()=>{SND.unlock();onlineOpenPanel();};const eliminationBtn=$('eliminationBtn');if(eliminationBtn)eliminationBtn.onclick=()=>{SND.unlock();TTROpenTrackSelect('elimination')};
 if(garage)garage.onclick=()=>{SND.unlock().then(ok=>{if(ok)SND.music('garage')});showGarage();};
 if($('raceConfigStart'))$('raceConfigStart').onclick=TTRStartConfiguredRace;for(const id of ['raceConfigCancel','raceConfigClose'])if($(id))$(id).onclick=()=>TTRCloseRaceConfig(true);if(configDialog){configDialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();TTRCloseRaceConfig(true);}});configDialog.addEventListener('click',e=>{if(e.target===configDialog)TTRCloseRaceConfig(true);});}
  if($('trackSelectNext'))$('trackSelectNext').onclick=TTRAdvanceTrackSelect;for(const id of ['trackSelectClose','trackSelectBack'])if($(id))$(id).onclick=()=>{const mode=activeTrackMode;TTRCloseTrackSelect();$('screen').querySelector(mode==='elimination'?'#eliminationBtn':'#raceBtn')?.focus();};if(trackDialog){trackDialog.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();TTRCloseTrackSelect();}});trackDialog.addEventListener('click',e=>{if(e.target===trackDialog)TTRCloseTrackSelect();});}
  const setting=$('settingsBtn');if(setting)setting.onclick=()=>{const panel=$('retroSettings');panel.open=true;const selector=$('settingsLanguage');if(selector)selector.value=I18N.getLang();SND.sfx('select');};
  const settingsLanguage=$('settingsLanguage');if(settingsLanguage){settingsLanguage.value=I18N.getLang();settingsLanguage.onchange=()=>{I18N.setLang(settingsLanguage.value);refreshAudioUI();};}
  if(settingsDialog){settingsDialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();settingsDialog.open=false;setting?.focus();}});settingsDialog.addEventListener('click',event=>{if(event.target===settingsDialog){settingsDialog.open=false;setting?.focus();}});}
 if($('closeSettings'))$('closeSettings').onclick=()=>{$('retroSettings').open=false;setting?.focus();SND.sfx('select');};
 // Vehicle selection is exclusively handled by garageSelect (no global car selector).
 const nav=[...document.querySelectorAll('.retro-option')];nav.forEach((el,i)=>{
   const move=()=>{if(el.classList.contains('selected'))return;nav.forEach(b=>b.classList.remove('selected'));el.classList.add('selected');SND.sfx('select');};
   el.addEventListener('pointerenter',move);el.addEventListener('focus',move);
   el.addEventListener('keydown',e=>{if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const n=(i+(e.key==='ArrowDown'?1:-1)+nav.length)%nav.length;nav[n].focus();}});
 });
 if(mute)mute.onclick=()=>{const off=SND.setMuted(!SND.status().muted);if(!off)enableSound().then(ok=>{if(ok)startMenuMusic();});else stopMenuMusic();refreshAudioUI();};
 const test=$('audioTest');if(test)test.onclick=()=>{SND.setMuted(false);enableSound().then(ok=>{if(ok){SND.sfx('pickup');startMenuMusic();}refreshAudioUI();});};
 for(const [id,key] of [['volMaster','master'],['volMusic','music'],['volEngine','engine'],['volEffects','effects']]){const el=$(id);if(!el)continue;el.value=Math.round(SND.getSettings()[key]*100);el.oninput=()=>SND.setVolume(key,+el.value/100);}
}

// v0.13.6.34 Safari-first engine start: HTMLMediaElement.play() invoked inside the actual user click.
// No autoplay, no dependency on a delayed WebAudio Promise, audio original and embedded for offline Pages.
const TTRStartupEngineSound = new Audio("data:audio/mpeg;base64,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");
TTRStartupEngineSound.preload='auto';TTRStartupEngineSound.playsInline=true;

function startMenuMusic(){SND.music('menu');}
function stopMenuMusic(){SND.stopMusic();}
function boot(){I18N.apply();$('loadbar').style.width='100%';$('enterGame').hidden=false;const copy=$('splashLoadingCopy');if(copy)copy.hidden=true;
 $('enterGame').addEventListener('click',()=>{
   // Safari/iOS only permits a new AudioContext to start after an actual user tap.
   // Keep the original splash visible while the ignition plays; do not overlap menu music.
   $('enterGame').hidden=true;
   let transitioned=false;
   const finishIntro=()=>{
     if(transitioned)return;transitioned=true;
     $('splash').hidden=true;
     if(I18N.hasSaved())mainMenu();else showLanguage();
   };
   // Call resume on the user's click AND start the embedded engine sample immediately.
   // Unlike the previous .then() chain, HTMLAudio.play() remains inside the trusted gesture.
   const soundSettings=SND.getSettings(),soundAllowed=!soundSettings.muted && soundSettings.master>.015 && (soundSettings.engine>.01||soundSettings.effects>.01);
   if(!soundAllowed){SND.unlock();finishIntro();return;}
   let pendingFallback=null;
   const media=TTRStartupEngineSound;
   const introTimeout=setTimeout(finishIntro,3200);
   const complete=()=>{clearTimeout(introTimeout);finishIntro();};
   try{
     media.pause();media.currentTime=0;
     // Preserve user's separate engine/effects level. iOS hardware volume remains device-controlled.
     media.volume=Math.max(.08,Math.min(1,soundSettings.master*(soundSettings.engine*.75+soundSettings.effects*.33)*1.55));
     const playback=media.play();
     // Resume WebAudio for the garage/menu after the media start, while still in the same gesture.
     const unlockPromise=SND.unlock();
     media.addEventListener('ended',complete,{once:true});
     if(playback&&typeof playback.catch==='function')playback.catch(()=>{
       // Audio file was denied or cannot decode: fall back to the original synth cue.
       clearTimeout(introTimeout);
       Promise.resolve(unlockPromise).then(ok=>{if(ok&&SND.introEngines())setTimeout(finishIntro,2050);else finishIntro();}).catch(finishIntro);
     });
   }catch(err){clearTimeout(introTimeout);SND.unlock().then(ok=>{if(ok&&SND.introEngines())setTimeout(finishIntro,2050);else finishIntro();}).catch(finishIntro);}

 },{once:true});
 document.querySelectorAll('.language-btn').forEach(b=>b.onclick=()=>{I18N.setLang(b.dataset.lang);$('languageScreen').hidden=true;mainMenu();SND.sfx('select');});
 $('garageClose').onclick=()=>mainMenu();$('garageSelect').onclick=()=>{selectedCar=garagePreview;try{localStorage.setItem('ttr_selected_car',selectedCar)}catch(e){}SND.sfx('select');mainMenu();};
}
// iOS/Safari multitouch controller: no pointer capture, no button focus, release outside the button.
const ttrTouchOwners=new Map(),ttrPointerOwners=new Map();
function refreshControls(){for(const k of Object.keys(controls)){
 controls[k]=[...ttrTouchOwners.values(),...ttrPointerOwners.values()].includes(k);
 const el=$(k);if(el)el.classList.toggle('active',controls[k]);
 }onlineGuestSendInput(true);
}
function releaseAllControls(){ttrTouchOwners.clear();ttrPointerOwners.clear();refreshControls();}
function bindControl(id,key){const b=$(id);if(!b)return;
 b.setAttribute('draggable','false');b.setAttribute('tabindex','-1');
 b.addEventListener('touchstart',e=>{e.preventDefault();for(const t of e.changedTouches)ttrTouchOwners.set(t.identifier,key);b.blur();refreshControls();},{passive:false});
 b.addEventListener('touchmove',e=>e.preventDefault(),{passive:false});
 b.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;e.preventDefault();ttrPointerOwners.set(e.pointerId,key);b.blur();refreshControls();});
 b.addEventListener('contextmenu',e=>e.preventDefault());
}
for(const [id,key] of [['left','left'],['right','right'],['brake','brake'],['gas','gas']])bindControl(id,key);
const onTouchRelease=e=>{for(const t of e.changedTouches)ttrTouchOwners.delete(t.identifier);refreshControls();};
window.addEventListener('touchend',onTouchRelease,{passive:true,capture:true});
window.addEventListener('touchcancel',onTouchRelease,{passive:true,capture:true});
window.addEventListener('pointerup',e=>{ttrPointerOwners.delete(e.pointerId);refreshControls();},true);
window.addEventListener('pointercancel',e=>{ttrPointerOwners.delete(e.pointerId);refreshControls();},true);
window.addEventListener('blur',releaseAllControls);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseAllControls();});
// One-shot actions still allow a second finger to steer simultaneously.
function bindTap(id,func){const b=$(id);b.setAttribute('draggable','false');b.setAttribute('tabindex','-1');
 b.addEventListener('touchstart',e=>{e.preventDefault();func();b.blur();b.classList.add('active');},{passive:false});
 b.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;e.preventDefault();func();b.blur();b.classList.add('active');});
 const off=()=>b.classList.remove('active');b.addEventListener('touchend',off);b.addEventListener('touchcancel',off);b.addEventListener('pointerup',off);b.addEventListener('pointercancel',off);b.addEventListener('contextmenu',e=>e.preventDefault());
}
bindTap('use',()=>race&&useItem(race.player));
addEventListener('keydown',e=>{keys[e.code]=true;onlineGuestSendInput(true);if(['Space','ArrowLeft','ArrowRight','ArrowDown','ArrowUp'].includes(e.code))e.preventDefault();if(e.repeat)return;if((e.code==='KeyE'||e.code==='Enter')&&race)useItem(race.player);if(e.code==='Escape'&&race?.mode==='online'){onlineQuit();mainMenu();return;}if(e.code==='Escape'&&race)togglePause();});addEventListener('keyup',e=>{keys[e.code]=false;onlineGuestSendInput(true)});addEventListener('blur',()=>{releaseAllControls();for(const k in keys)delete keys[k];});
$('pauseBtn').onclick=()=>{if(race?.mode==='online'){onlineQuit();mainMenu();}else togglePause();};
 const pauseAudio=$('pauseAudio');
 const pauseCard=pauseAudio.closest('.pause-card');
 pauseAudio.addEventListener('toggle',()=>pauseCard.classList.toggle('audio-open',pauseAudio.open));
 for(const [pid,key,mid] of [
   ['pauseVolMaster','master','volMaster'],['pauseVolMusic','music','volMusic'],
   ['pauseVolEngine','engine','volEngine'],['pauseVolEffects','effects','volEffects']
 ]){const input=$(pid);input.oninput=()=>{SND.setVolume(key,Number(input.value)/100);const other=$(mid);if(other)other.value=input.value;};}
 $('pauseMute').onclick=()=>{const muted=SND.setMuted(!SND.status().muted);
   if(!muted)enableSound();refreshAudioUI();};
 $('resumeRace').onclick=()=>{if(race&&race.paused)togglePause();};$('restartRace').onclick=()=>{if(!race)return;const mode=race.mode;$('pauseOverlay').hidden=true;releaseAllControls();openCircuitLoading(mode);};$('exitRace').onclick=()=>{SND.sfx('select');mainMenu();};
function syncPauseAudioControls(){const st=SND.getSettings();
 for(const [pid,key] of [['pauseVolMaster','master'],['pauseVolMusic','music'],['pauseVolEngine','engine'],['pauseVolEffects','effects']]){
  const input=$(pid);if(input)input.value=Math.round(st[key]*100);
 }refreshAudioUI();}
function togglePause(){if(!race||race.finished)return;race.paused=!race.paused;releaseAllControls();$('pauseOverlay').hidden=!race.paused;$('hint').classList.remove('show');lastHint=0;
 if(race.paused){$('pauseAudio').open=false;document.querySelector('.pause-card').classList.remove('audio-open');syncPauseAudioControls();SND.stopMusic();SND.sfx('select');}
 else SND.music('race');syncAudio();}
const miniBase=document.createElement('canvas');miniBase.width=280;miniBase.height=180;
const miniBg=miniBase.getContext('2d');miniBg.save();miniBg.translate(140,90);miniBg.scale(245/WORLD_W,153/WORLD_H);miniBg.translate(-WORLD_W/2,-WORLD_H/2);
miniBg.beginPath();points.forEach((p,i)=>i?miniBg.lineTo(p.x,p.y):miniBg.moveTo(p.x,p.y));miniBg.closePath();
miniBg.strokeStyle='#dce8e9';miniBg.lineWidth=52;miniBg.stroke();miniBg.strokeStyle='#5d778c';miniBg.lineWidth=37;miniBg.stroke();
miniBg.save();miniBg.beginPath();shortcutSamples.forEach((q,i)=>i?miniBg.lineTo(q.x,q.y):miniBg.moveTo(q.x,q.y));
miniBg.lineCap='round';miniBg.lineJoin='round';miniBg.strokeStyle='#083d55';miniBg.lineWidth=33;miniBg.stroke();
miniBg.strokeStyle='#46f5e2';miniBg.lineWidth=20;miniBg.stroke();miniBg.restore();miniBg.restore();
function renderMini(){if(!race)return;mg.clearRect(0,0,280,180);mg.drawImage(miniBase,0,0);mg.save();mg.translate(140,90);mg.scale(245/WORLD_W,153/WORLD_H);mg.translate(-WORLD_W/2,-WORLD_H/2);
for(const c of race.cars){mg.fillStyle=c===race.player?'#ffdc76':'#ff766f';mg.beginPath();mg.arc(c.x,c.y,c===race.player?20:14,0,Math.PI*2);mg.fill();}mg.restore();}
function render(){const ratio=Math.min(race?.mode==='online'&&onlineSession&&!onlineSession.host?1.38:1.65,devicePixelRatio||1);if(sw!==innerWidth||sh!==innerHeight||dpr!==ratio){sw=innerWidth;sh=innerHeight;dpr=ratio;canvas.width=Math.ceil(sw*dpr);canvas.height=Math.ceil(sh*dpr);}g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#6e4a37';g.fillRect(0,0,sw,sh);
 // Real follow camera: the circuit extends beyond the mobile viewport.
 // Keep the player just behind centre, giving sight of the upcoming corner.
 const gridLocked=race?.mode==='elimination'&&race.elim.state==='race'&&race.countdown>0;
 const player=race?.mode==='elimination'?(gridLocked?race.player:race.elim.state==='celebration'?race.cars[race.elim.winner]:eliminationCameraLeader()):race?.player,playerFalling=!!(player&&player.tableFalling>0);
 const look=player&&race.countdown<=0&&!playerFalling?(race?.mode==='elimination'?0:85):0;
 const groupTarget=race?.mode==='elimination'&&race.elim.state==='race'&&!gridLocked?eliminationCameraTarget():null;
 const targetX=gridLocked?elimGridCamera.x:groupTarget?groupTarget.x:player?player.x+Math.cos(player.a)*look:WORLD_W/2;
 const targetY=gridLocked?elimGridCamera.y:groupTarget?groupTarget.y:player?player.y+Math.sin(player.a)*look:WORLD_H/2;
 scale=sw<sh?Math.min(.85,Math.max(.60,sh/620)):
   Math.min(.86,Math.max(.59,Math.min(sw/1140,sh/540)));
 const halfW=sw/(2*scale),halfH=sh/(2*scale);
  // Progressive catch-up replaces the old instantaneous follow=1 branch.
  const gapToTarget=Math.hypot(targetX-camX,targetY-camY);
  const response=race?.mode==='elimination'?Math.min(23,14+gapToTarget/70):6.4;
  const follow=gridLocked?1:playerFalling?.23:1-Math.exp(-Math.min(.05,renderDelta)*response);
 camX+=(targetX-camX)*follow;camY+=(targetY-camY)*follow;
 const outerView=playerFalling?105:0;
 camX=halfW>=WORLD_W/2?WORLD_W/2:clamp(camX,halfW-outerView,WORLD_W-halfW+outerView);
 camY=halfH>=WORLD_H/2?WORLD_H/2:clamp(camY,halfH-outerView,WORLD_H-halfH+outerView);
 g.setTransform(dpr*scale,0,0,dpr*scale,dpr*(sw/2-camX*scale),dpr*(sh/2-camY*scale));
 const viewLeft=Math.max(0,Math.floor(camX-halfW-60)),viewTop=Math.max(0,Math.floor(camY-halfH-60));
 const viewRight=Math.min(WORLD_W,Math.ceil(camX+halfW+60)),viewBottom=Math.min(WORLD_H,Math.ceil(camY+halfH+60));
 if(viewRight>viewLeft&&viewBottom>viewTop)g.drawImage(track,viewLeft,viewTop,viewRight-viewLeft,viewBottom-viewTop,viewLeft,viewTop,viewRight-viewLeft,viewBottom-viewTop);
 if(race){race.oils.forEach(o=>renderOil(g,o,clock));race.pickups.forEach(p=>drawBox(g,p));
   // Genuine ramp-entry cars render ABOVE the ramp even before jump starts.
  const visibleProp=o=>Math.abs(o.x-camX)<halfW+145&&Math.abs(o.y-camY)<halfH+145;
  // Floor spills are decals below all four wheels, irrespective of their y-sort position.
   // Overflow goes UNDER the puddle shapes, preserving exposed cereal pieces.
   props.filter(o=>o.type==='milk_cereal_cup'&&visibleProp(o)).forEach(o=>drawMilkOverflow(g,o));
    props.filter(o=>o.type==='milk_cereal_spill'&&visibleProp(o)).forEach(o=>drawObstacle(g,o));
    // The spreading jam is a low ground decal, always BEHIND car wheels.
    if(Math.abs(jamPatch.x-camX)<halfW+240&&Math.abs(jamPatch.y-camY)<halfH+280)drawJamPour(g);
   // Road cars are drawn first. The opaque raised bread deck then occludes them
   // at crossings, while vehicles actually ON the bridge stay visible on top.
   [...props.filter(o=>o.type!=='ramp'&&o.type!=='milk_cereal_spill'&&visibleProp(o)).map(o=>({y:o.y,prop:o})),
    ...race.cars.filter(c=>!c.eliminated&&c.jump<=0&&!c.onBridge&&!c.rampEntryVisual&&!(c.bridgeExitVisual>0)).map(c=>({y:c.y,car:c}))]
     .sort((a,b)=>a.y-b.y).forEach(e=>e.prop?drawObstacle(g,e.prop):carSprite(g,e.car));
   if(viewRight>viewLeft&&viewBottom>viewTop)g.drawImage(bridgeLayer,viewLeft,viewTop,viewRight-viewLeft,viewBottom-viewTop,viewLeft,viewTop,viewRight-viewLeft,viewBottom-viewTop);
   props.filter(o=>o.type==='ramp'&&visibleProp(o)).forEach(o=>drawObstacle(g,o));
   race.cars.filter(c=>!c.eliminated&&(c.onBridge||c.jump>0||c.rampEntryVisual||c.bridgeExitVisual>0)).forEach(c=>carSprite(g,c));
 for(const c of race.cars){if(!c.eliminated&&c.claw>0&&c.clawTarget)drawClawCable(g,c,c.clawTarget,clock);}
 race.effects.forEach(e=>renderEffect(g,e,clamp));if(race.countdown>0){g.save();g.setTransform(dpr,0,0,dpr,0,0);g.textAlign='center';g.textBaseline='middle';g.lineWidth=7;g.strokeStyle='#142438';g.font=`950 ${Math.min(90,sw/5)}px system-ui`;const v=Math.ceil(race.countdown);g.strokeText(String(v),sw/2,sh/2);g.fillStyle='#ffe67f';g.fillText(String(v),sw/2,sh/2);g.restore();}}else gameObstacles(g);
 if(clock>lastHint&&lastHint!==0){$('hint').classList.remove('show');lastHint=0;}
}
function frame(t){
 const dt=Math.min(.04,Math.max(0,(t-frameTime)/1000));frameTime=t;renderDelta=dt||1/60;
 onlinePingTick(t);
 if(race){if(race.mode==='online'&&onlineSession&&!onlineSession.host){clock+=dt;onlineGuestStep(dt);}else{update(dt);onlineBroadcast(dt);}render();}
 else {clock+=dt;
   // Lightweight canvas-only 60fps turntable: the rest of the game stays paused while in the garage.
   if(t-lastShowroomDraw>8){lastShowroomDraw=t;
     if(!$('screen').hidden && $('menuCar'))drawShowroom($('menuCar'),selectedCar,'menu');
     else if(!$('garageScreen').hidden)drawShowroom($('garageCanvas'),garagePreview,'garage');
   }
 }
 requestAnimationFrame(frame);
}
window.addEventListener('ttr:career-start',e=>{const v=(window.TTRVehicleRoster||[]).find(x=>x.id===e.detail?.carId);if(!v||v.status!=='playable'||v.index-1!==e.detail.vehicleIndex)return;if(v.availability!=='initial'&&!window.TTRCareer?.isUnlocked(v.id))return;selectedCar=v.index-1;try{localStorage.setItem('ttr_selected_car',String(selectedCar))}catch(_){}SND.unlock();stopMenuMusic();openCircuitLoading('career');});
window.addEventListener('ttr:career-close',()=>mainMenu());
onlineWire();worldInit();window.TTRAssets?.ready.then(()=>{worldInit();if(!$('screen').hidden)drawShowroom($('menuCar'),selectedCar,'menu');if(!$('garageScreen').hidden)drawShowroom($('garageCanvas'),garagePreview,'garage');});wireMenu();boot();requestAnimationFrame(frame);
window.TTROnlineDebug={state:()=>onlineSession?{...onlineSession,connected:onlineSocket?.readyState===1,raceMode:race?.mode,rttMs:onlineRttMs,latencySupported:onlinePingSupported,net:{...onlineNetStats},prediction:!!race?.player?.netPrediction,local:race?.player?{x:race.player.x,y:race.player.y,a:race.player.a,netX:race.player.netX,netY:race.player.netY,netA:race.player.netA}:null,controls:race?.mode==='online'&&!onlineSession.host?onlineLocalInput():null,remoteSteer:onlineSession.host?onlineRemoteInputs[1]?.steer??null:null}:null};
window.TTREliminationDebug={startTestRace:()=>initRace('elimination'),
 // Verify no front/rear starting slot lies near a jump takeoff or landing.
 testJumpRestartGrid:()=>[shortcutFrom-.006,shortcutFrom+.01,knifePhase-.008,knifePhase+.008].flatMap(p=>[4,8].map(count=>{
   const placement=eliminationChooseGrid(p,count),front=placement.grid[0];
   return {scorePhase:p,count,restartPhase:placement.phase,zone:placement.jumpAdjusted,
      safe:eliminationJumpSafeGrid(placement.grid)&&eliminationGridValid(placement.phase,count,placement.offset),
      toRamp:Math.round(eliminationSignedArc(front.p,shortcutFrom)),
      toKnife:Math.round(eliminationSignedArc(front.p,knifePhase))};
 })),

 // Regression tools intentionally mutate a running test race, never persistent progress.
 testMultipleOutside:()=>{
   if(race?.mode!=='elimination'||race.cars.length<4)return {pass:false,reason:'Start 4-player elimination'};
   race.countdown=0;race.time=Math.max(race.time,15);race.elim.roundTime=15;
   const c=race.cars;const center={x:WORLD_W/2,y:WORLD_H/2};
   camX=center.x;camY=center.y;elimCameraId=c[0].id;
   race.elim.lastLeaderSwitchTime=-999;
   const offset=Math.max((sw||innerWidth)/(2*(scale||.65)),(sh||innerHeight)/(2*(scale||.65)))+150;
   c.forEach((car,i)=>Object.assign(car,{x:center.x+(i?offset+i*55:0),y:center.y+(i?120:0),
     eliminated:false,done:false,respawnGrace:0,elimProtection:0,impactGrace:0,bridgeMissGrace:0,
     bridgeMissActive:false,tableFalling:0,routePinch:null,offtrack:false,offtrackSeconds:0,
     elimDistance:i?100:900,elimLag:.52,elimRecoveryCount:0,elimStallSeconds:0,elimLastMeaningfulProgress:i?100:900}));
   eliminationEvaluate(.06);
   return {pass:c.slice(1).every(car=>car.eliminated)&&race.elim.state==='celebration',
     eliminated:c.filter(car=>car.eliminated).map(car=>car.id),state:race.elim.state};
 },
 testRespawnLoop:()=>{
   if(race?.mode!=='elimination'||race.cars.length<2)return {pass:false,reason:'Start elimination'};
   race.countdown=0;race.time=Math.max(race.time,25);race.elim.roundTime=15;
   race.cars.forEach((c,i)=>Object.assign(c,{eliminated:false,done:false,elimDistance:i?300:800,
    elimLastMeaningfulProgress:i?300:800,elimStallSeconds:i?2:0,elimLag:0,
    elimRecoveryCount:i?3:0,elimRecoveryWindowStart:i?race.time-5:-999,
    elimRecoveryStartDistance:i?270:0}));
   elimCameraId=race.cars[0].id;race.elim.lastLeaderSwitchTime=-999;
   eliminationEvaluate(.05);
   return {pass:race.cars[1].eliminated,eliminated:race.cars.filter(c=>c.eliminated).map(c=>c.id)};
 },
 state:()=>race?.elim?{mode:race.mode,round:race.elim.round,state:race.elim.state,points:[...race.elim.points],goal:race.elim.goal,active:eliminationActive().map(c=>c.id),recoveries:race.cars.map(c=>c.elimRecoveryCount||0),stalls:race.cars.map(c=>Number((c.elimStallSeconds||0).toFixed(2))),progress:race.cars.map(c=>c.elimDistance||0),cameraLeader:elimCameraId,cameraTarget:eliminationCameraTarget()}:null,knockOut:(id)=>{if(race?.mode!=='elimination')return false;return knockOutElimination(race.cars[id]);},award:(id)=>{if(race?.mode!=='elimination')return false;return awardEliminationPoint(race.cars[id]);},
 // Visual lead must override a stalled nearest-track projection on a legal bend.
 testPhysicalCornerCamera:()=>{
   if(race?.mode!=='elimination'||eliminationActive().length<2)return {pass:false,reason:'Start Eliminazione first'};
   const active=eliminationActive(),[incumbent,challenger]=active;
   const fields=['x','y','a','speed','elimDistance','offtrack','offtrackSeconds','offtrackReturnGrace','routePinch','respawnGrace','impactGrace','onBridge','bridgeMissActive','bridgeLandingActive','tableFalling'];
   const snapshots=active.map(c=>Object.fromEntries(fields.map(k=>[k,c[k]])));
   const camera=[elimCameraId,elimCameraProgress,elimFocusWeight,elimCandidateId,elimCandidateSince];
   let result;
   try{
     active.forEach(c=>c.elimDistance=0);
     const p=.116,pt=trackPoint(p),a=tangent(p),fx=Math.cos(a),fy=Math.sin(a),nx=-fy,ny=fx;
     Object.assign(incumbent,{x:pt.x,y:pt.y,a,speed:170,elimDistance:100,
       offtrack:false,offtrackSeconds:0,offtrackReturnGrace:0,routePinch:null,
       respawnGrace:0,impactGrace:0,onBridge:false,bridgeMissActive:false,bridgeLandingActive:false,tableFalling:0});
     Object.assign(challenger,{x:pt.x+fx*43+nx*155,y:pt.y+fy*43+ny*155,a,speed:175,elimDistance:96,
       offtrack:true,offtrackSeconds:.28,offtrackReturnGrace:.8,routePinch:null,
       respawnGrace:0,impactGrace:0,onBridge:false,bridgeMissActive:false,bridgeLandingActive:false,tableFalling:0});
     elimCameraId=incumbent.id;elimCandidateId=null;
     const physical=eliminationPhysicalOvertake(challenger,incumbent);
     eliminationCameraLeader();const savedTime=race.time;race.time+=.2;
     const lead=eliminationCameraLeader();race.time=savedTime;
     result={pass:physical&&lead.id===challenger.id&&challenger.elimDistance>incumbent.elimDistance,
       physical,leaderId:lead.id,challengerId:challenger.id,projectedDeficit:incumbent.elimDistance-challenger.elimDistance};
   }finally{
     active.forEach((c,i)=>fields.forEach(k=>snapshots[i][k]===undefined?delete c[k]:c[k]=snapshots[i][k]));
     [elimCameraId,elimCameraProgress,elimFocusWeight,elimCandidateId,elimCandidateSince]=camera;
   }
   return result;
 },
 // A repeatable in-browser smoke test. It restores every changed car/camera field.
 testLegalCornerOvertake:()=>{
   if(race?.mode!=='elimination'||eliminationActive().length<2)return {pass:false,reason:'Start Eliminazione with two or more racers'};
   const [challenger,incumbent]=eliminationActive();
   const fields=['x','y','a','speed','elimDistance','elimPrevP','elimPrevX','elimPrevY','elimTravelSinceCredit','offtrack','offtrackSeconds','offtrackReturnGrace','routePinch','respawnGrace','bridgeMissActive','bridgeLandingActive','tableFalling'];
   const snaps=[challenger,incumbent].map(car=>Object.fromEntries(fields.map(k=>[k,car[k]])));
   const oldCamera=elimCameraId,oldProgress=elimCameraProgress,oldFocus=elimFocusWeight;
   let result;
   try{
     const p=.111,pt=trackPoint(p),a=tangent(p),nx=-Math.sin(a),ny=Math.cos(a);
     Object.assign(challenger,{x:pt.x+nx*175,y:pt.y+ny*175,a,speed:170,elimDistance:99,elimPrevP:p-.0015,
       elimPrevX:pt.x+nx*175-Math.cos(a)*9,elimPrevY:pt.y+ny*175-Math.sin(a)*9,
       elimTravelSinceCredit:14,offtrack:true,offtrackSeconds:.4,offtrackReturnGrace:.8,
       routePinch:null,respawnGrace:0,bridgeMissActive:false,bridgeLandingActive:false,tableFalling:0});
     incumbent.elimDistance=100;
     const dist=nearestCourse(challenger,points).distance;
     eliminationProgressUpdate(challenger,p,.04);
     const lead=eliminationCameraLeader();
     result={pass:lead.id===challenger.id&&challenger.elimDistance>100&&dist>151&&dist<=228,
       legalCutDistance:Math.round(dist),cameraLeader:lead.id,challenger:challenger.id,
       creditedProgress:Number(challenger.elimDistance.toFixed(2))};
   }finally{
     [challenger,incumbent].forEach((car,i)=>fields.forEach(k=>{
       if(snaps[i][k]===undefined)delete car[k];else car[k]=snaps[i][k];
     }));
     elimCameraId=oldCamera;elimCameraProgress=oldProgress;elimFocusWeight=oldFocus;
   }
   return result;
 }};
window.TTRDebug={
 getPickupRespawnSeconds:(n)=>K.pickupRespawnSeconds(n),
 getPickupCooldowns:()=>race?.pickups.map(p=>p.cool),
 getPhysicsProfiles:()=>profiles.map(pr=>({id:pr.id,...ttrCalibratedProfile(pr)})),
 getMenuClock:()=>({clock,phase:clock%TTRShowroom60.menuCycleSeconds,menuVisible:!$('screen').hidden,cycle:TTRShowroom60.menuCycleSeconds,hopPixels:TTRShowroom60.hopPixels}),
 testJamJarCollision:()=>{
   const jar=props.find(o=>o.type==='jam_spill_jar');if(!jar)return {pass:false,reason:'Jar not found'};
   const car={x:jar.x-55,y:jar.y,a:0,speed:100,width:36,length:62,jump:.45,jumpTotal:.45,jumpCd:0,hitVX:0,hitVY:0};
   const hit=contactWithProp(car,jar,{x:jar.x-110,y:jar.y});
   return {pass:jar.solid&&hit&&car.jump===0,solid:jar.solid,hit,airborneAfter:car.jump};
 },
 testMilkCupCollision:()=>{
    const bowl=props.find(o=>o.type==='milk_cereal_cup');if(!bowl)return {pass:false,reason:'cup not found'};
    const makeCar=(jump)=>({x:bowl.x-60,y:bowl.y,a:0,speed:105,width:36,length:62,
       jump,jumpTotal:jump,jumpCd:0,hitVX:0,hitVY:0});
    const grounded=makeCar(0),airborne=makeCar(.5);
    const old={x:bowl.x-105,y:bowl.y};
    const groundHit=contactWithProp(grounded,bowl,old);
    const airHit=contactWithProp(airborne,bowl,old);
    return {pass:!!(bowl.solid&&groundHit&&airHit&&airborne.jump===0),
      solid:bowl.solid,groundHit,airHit,airborneJumpAfter:airborne.jump,
      groundSeparation:Math.hypot(grounded.x-bowl.x,grounded.y-bowl.y)};
  },
 testOrangeCollision:()=>props.filter(o=>o.type==='orange'||o.type==='orange_bump').map(o=>{
   const c={x:o.x,y:o.y,a:0,speed:150,width:36,length:64,hitVX:0,hitVY:0,jump:.2,jumpTotal:.2,jumpCd:0};
   const hit=contactWithProp(c,o,{x:o.x-35,y:o.y});
   return {type:o.type,solid:o.solid,hit,jumpAfter:c.jump,displacement:Math.hypot(c.x-o.x,c.y-o.y)};
 }),
 getBreakfastPreview:()=>{
   const ox=155,oy=700,w=1000,h=600;const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
   const ctx=canvas.getContext('2d');ctx.drawImage(track,ox,oy,w,h,0,0,w,h);
   ctx.drawImage(bridgeLayer,ox,oy,w,h,0,0,w,h);
   ctx.save();ctx.translate(-ox,-oy);
   props.filter(o=>o.type==='milk_cereal_cup').forEach(o=>drawMilkOverflow(ctx,o));
   props.filter(o=>o.x>ox-o.r&&o.x<ox+w+o.r&&o.y>oy-o.r&&o.y<oy+h+o.r).sort((a,b)=>a.y-b.y).forEach(o=>drawObstacle(ctx,o));
   ctx.restore();return canvas.toDataURL('image/png');
 },
 testMilkSlip:()=>{
   if(!race||milkCerealSpills.length<2)return false;
   const c=race.player,o=milkCerealSpills[1];c.x=o.x;c.y=o.y;c.speed=105;c.jump=0;c.slip=0;c.oilCooldown=0;c.oilSpin=0;
   c.respawnGrace=2;race.countdown=0;return true;
 },
 testImpactEjection:()=>{
   if(!race||race.cars.length<2)return false;
   race.countdown=0;
   const attacker=race.cars[0],victim=race.cars[1];
   attacker.x=WORLD_W-142;attacker.y=760;attacker.a=0;attacker.speed=270;
   victim.x=WORLD_W-82;victim.y=760;victim.a=0;victim.speed=0;
   for(const c of [attacker,victim]){
     c.hitVX=0;c.hitVY=0;c.hitYaw=0;c.impactGrace=0;
     c.offtrack=false;c.offtrackSeconds=0;c.offtrackEntry=null;
     c.auditP=.25;c.auditTravel=0;c.auditOutsideTime=0;c.respawnGrace=.4;
     c.tableFalling=0;c.tableFallImpact=false;c.jump=0;c.jumpCd=0;c.done=false;
   }
   return true;
 },
 getImpactEjection:()=>race?.cars.slice(0,2).map(c=>({id:c.id,x:c.x,y:c.y,falling:c.tableFalling||0,hitVX:c.hitVX||0,grace:c.impactGrace||0,respawns:c.shortcutRespawns||0})),
 testLegitimateInsideBend:(phase=.1,lateral=-112)=>{
  if(!race)return false;const c=race.player,q=trackPoint(phase),a=tangent(phase),nx=-Math.sin(a),ny=Math.cos(a);
  c.x=q.x+nx*lateral;c.y=q.y+ny*lateral;c.a=a;c.speed=91;c.p=phase;c.lastP=phase;c.jump=0;c.onBridge=false;c.rampEntryVisual=false;
  c.auditP=phase;c.auditTravel=0;c.auditCleanTime=0;c.auditOutsideTime=0;c.auditBridge=false;
  c.offtrack=false;c.offtrackEntry=null;c.offtrackSeconds=0;c.respawnGrace=0;c.bridgeMissActive=false;c.bridgeMissGrace=0;c.bridgeLandingActive=false;
  c.lastValidPosition={x:q.x,y:q.y,p:phase,a,speed:60,laps:c.lapsCompleted,flags:c.flags.slice()};race.countdown=0;return true;
 },
 testImpreciseBridgeLanding:(offset=64)=>{
  if(!race)return false;const c=race.player,q=shortcutPoint(.55),r=shortcutPoint(.57),a=Math.atan2(r.y-q.y,r.x-q.x);
  c.x=q.x-Math.sin(a)*offset;c.y=q.y+Math.cos(a)*offset;c.a=a;c.speed=88;c.jump=0;c.jumpCd=1.2;
  c.onBridge=true;c.bridgeOffSeconds=.19;c.bridgeMissActive=false;c.bridgeMissGrace=0;c.bridgeLandingActive=false;
  c.auditBridge=true;c.offtrack=false;c.offtrackEntry=null;c.respawnGrace=0;race.countdown=0;return true;
 },
 getVariantSprites:()=>race?.cars.map(c=>({id:c.id,model:c.profile.id,sprite:c.variantSprite||c.profile.id,color:c.variantAccent||c.profile.color})),testShowResults:()=>showResults(),testTableFall:()=>{if(!race)return false;race.countdown=0;const c=race.player;c.x=WORLD_W-18;c.y=Math.round(WORLD_H*.48);c.a=0;c.speed=60;return startTableFall(c);},getTableFall:()=>race?{left:race.player.tableFalling||0,impact:!!race.player.tableFallImpact,effects:race.effects.map(e=>e.kind)}:null,testRampContact:(offset=0,angleOffset=0,reverse=false)=>{const o=props.find(q=>q.type==='ramp');if(!o)return false;const ca=Math.cos(o.a),sa=Math.sin(o.a),al=-70;const c={x:o.x+ca*al-sa*offset,y:o.y+sa*al+ca*offset,a:o.a+angleOffset,speed:reverse?-150:150,jump:0,jumpCd:0,length:65};const next={...c,x:c.x+ca*65,y:c.y+sa*65};return K.rampLaunch(next,o,{x:c.x,y:c.y});},getBridgeState:()=>race?{onBridge:!!race.player.onBridge,takeoff:!!race.player.bridgeTakeoff,jump:race.player.jump||0,missGrace:race.player.bridgeMissGrace||0,missActive:!!race.player.bridgeMissActive,landingActive:!!race.player.bridgeLandingActive,falling:race.player.bridgeFalling||0,respawns:race.player.shortcutRespawns||0,speed:race.player.speed}:null,
 testKnifeJump:()=>{if(!race)return false;const c=race.player,o=props.find(q=>q.type==='knife'&&q.interactive);if(!o)return false;const ca=Math.cos(o.angle),sa=Math.sin(o.angle);const along=55,across=-50;c.x=o.x+ca*along-sa*across;c.y=o.y+sa*along+ca*across;c.a=tangent(o.segment);c.speed=132;c.jump=0;c.jumpCd=0;c.knifeCd=0;c.offtrack=false;c.bridgeMissActive=false;c.bridgeMissGrace=0;c.respawnGrace=0;race.countdown=0;return true;},
 testKnifeHandle:()=>{if(!race)return false;const c=race.player,o=props.find(q=>q.type==='knife'&&q.interactive);if(!o)return false;const ca=Math.cos(o.angle),sa=Math.sin(o.angle),along=-33,across=-51;c.x=o.x+ca*along-sa*across;c.y=o.y+sa*along+ca*across;c.a=tangent(o.segment);c.speed=125;c.jump=0;c.jumpCd=0;c.knifeCd=0;c.offtrack=false;c.bridgeMissActive=false;c.bridgeMissGrace=0;c.respawnGrace=0;race.countdown=0;return true;},
 testBridgeFall:()=>{if(!race)return false;const c=race.player,q=shortcutPoint(.55),r=shortcutPoint(.57),a=Math.atan2(r.y-q.y,r.x-q.x);c.x=q.x-Math.sin(a)*43;c.y=q.y+Math.cos(a)*43;c.a=a;c.speed=115;c.jump=0;c.jumpCd=.5;c.onBridge=true;c.bridgeOffSeconds=.16;c.offtrack=false;c.offtrackEntry=null;c.respawnGrace=0;c.bridgeMissGrace=0;race.countdown=0;return true;},
 getTraction:()=>race?{slip:race.player.slip,oilCooldown:race.player.oilCooldown||0,skidVX:race.player.skidVX||0,skidVY:race.player.skidVY||0}:null,
 testOilPlayer:()=>{if(!race||race.cars.length<2)return false;const c=race.player,q=trackPoint(.32);c.x=q.x;c.y=q.y;c.a=tangent(.32);c.speed=120;c.jump=0;c.slip=0;c.skidVX=0;c.skidVY=0;c.oilCooldown=0;c.bridgeMissActive=false;c.bridgeMissPenalty=0;c.bridgeMissGrace=0;c.offtrack=false;c.offtrackEntry=null;c.respawnGrace=0;c.auditP=.32;c.auditTravel=0;c.auditCleanTime=0;c.p=.32;c.lastP=.32;c.shortcutRespawns=0;c.oilSpin=0;
 c.lastValidPosition={x:c.x,y:c.y,p:.32,a:c.a,speed:60,laps:c.lapsCompleted,flags:c.flags.slice()};
 race.countdown=0;race.oils=[{x:c.x,y:c.y,r:34,t:9,owner:1,phase:0}];return true;},
 getCerealSpills:()=>milkCerealSpills.map(p=>({x:p.x,y:p.y,rx:p.rx,ry:p.ry,shape:p.spillShape,roadDistance:nearestCourse(p,points).distance})),
 getEliminationCamera:()=>({leaderId:elimCameraId,focusWeight:elimFocusWeight,camera:{x:camX,y:camY},gridLocked:race?.mode==='elimination'&&race.countdown>0}),
 testEliminationCameraSetup:(gap=55)=>{
  if(!race||race.mode!=='elimination')return false;
  // Deterministic frozen-grid camera diagnostic (available only via TTRDebug).
  const dist=Math.max(0,Number(gap)||0);race.countdown=999;race.elim.state='race';
  race.cars.forEach((c,i)=>{c.x=1080-i*dist;c.y=710+i*10;c.speed=0;c.elimDistance=1800-i*dist;
   c.eliminated=false;c.done=false;c.tableFalling=0;c.respawnGrace=0;});
  camX=950;camY=710;elimCameraId=null;elimFocusWeight=0;return true;
 },
 getOrangeRind:()=>props.filter(p=>p.type==='orange_bump').map(p=>({x:p.x,y:p.y,r:p.r,solid:p.solid,jump:p.jump})),
 getTrackMeta:()=>({jamPatch,courseYShift:K.COURSE_Y_SHIFT,crumbCount:K.crumbMarkers().length,worldW:WORLD_W,worldH:WORLD_H,length:TRACK_LENGTH,sections:sectionNames,sectionRanges,shortcutStart:shortcutFrom,shortcutEnd:shortcutTo,shortcut:shortcutSamples.map(q=>({x:q.x,y:q.y}))}),testEnterShortcut:()=>{if(!race)return false;const c=race.player,pt=shortcutPoint(.15),q=shortcutPoint(.19);c.x=pt.x;c.y=pt.y;c.a=Math.atan2(q.y-pt.y,q.x-pt.x);c.speed=160;c.respawnGrace=0;c.offtrack=false;c.offtrackEntry=null;race.countdown=0;return true;},teleportForCamera:(phase)=>{if(!race)return false;const c=race.player,p=trackPoint(phase);c.x=p.x;c.y=p.y;c.a=tangent(phase);c.speed=0;c.hitVX=c.hitVY=0;c.offtrack=false;return true;},getCamera:()=>({x:camX,y:camY,scale,viewportWidth:sw/scale,viewportHeight:sh/scale}),
 testFinishInnerLine:(offset=110)=>{if(!race)return false;const c=race.player,pt=trackPoint(0),a=tangent(0),nx=-Math.sin(a),ny=Math.cos(a),fx=Math.cos(a),fy=Math.sin(a);c.x=pt.x-fx*17+nx*offset;c.y=pt.y-fy*17+ny*offset;c.a=a;c.speed=160;c.flags=[true,true,true];c.lapGateBlocked=false;c.offtrack=false;c.respawnGrace=0;c.lastP=.966;c.p=.966;c.offtrackEntry=null;race.countdown=0;return true;},
 testCarAtEdge:()=>{if(!race)return false;const c=race.player;c.x=7;c.y=7;return true;},testCarStuck:()=>{if(!race)return false;const c=race.player;c.stuckAnchor={x:c.x,y:c.y};c.lastObstacleContact=race.time;c.obstacleStuckSeconds=2.56;return true;},getControls:()=>({...controls}),getSpoonStatus:()=>props.filter(o=>o.type==='spoon').map(o=>({x:o.x,y:o.y,interactive:!!o.interactive,solid:!!o.solid})),getCookieStyles:()=>props.filter(o=>o.type==='cookie').map(o=>o.cookieKind),getAssetStatus:()=>({...window.TTRAssets?.status}),
 testOilHit:()=>{if(!race||race.cars.length<2)return false;
   race.countdown=0;const oil={x:780,y:500,r:34,t:9,owner:0,phase:0};race.oils=[oil];
   const other=race.cars[1];other.x=oil.x;other.y=oil.y;other.speed=0;other.jump=0;other.slip=0;
   return true;},
 testUseItem:(kind='oil')=>{if(!race)return false;race.countdown=0;race.player.item=kind;useItem(race.player);return true;},
 getOilState:()=>race?{puddles:race.oils.map(o=>({x:o.x,y:o.y,r:o.r,t:o.t})),playerSlip:race.player.slip}:null,
 getPenaltyState:()=>race?{respawns:race.player.shortcutRespawns||0,offtrack:!!race.player.offtrack,lap:race.player.lapsCompleted,lapGateBlocked:!!race.player.lapGateBlocked,p:race.player.p,mugApexPassed:!!race.player.mugApexPassed}:null,
  testMugBendGate:(p,x,y,passed=false)=>{const at={x:x??trackPoint(p).x,y:y??trackPoint(p).y};return mugBendGate(nearestTrack(at,points),at,passed);},
 getTrackProps:()=>props.map(o=>({type:o.type,p:o.segment??null,x:o.x,y:o.y,a:o.a??o.angle,interactive:!!o.interactive,solid:!!o.solid,r:o.r,length:o.length||null,bladeInLane:o.bladeInLane||null})),
 testWideFinish:()=>{if(!race)return false;const c=race.player,p=.987,pt=trackPoint(p),a=tangent(p),nx=-Math.sin(a),ny=Math.cos(a);c.x=pt.x+nx*71;c.y=pt.y+ny*71;c.a=a;c.speed=225;c.lastP=p;c.p=p;c.flags=[true,true,true];c.lapGateBlocked=false;c.respawnGrace=0;c.offtrack=false;c.offtrackEntry=null;c.offtrackSeconds=0;c.stuckAnchor=null;race.countdown=0;return true;},
 testFinishSeam:()=>{if(!race)return false;const c=race.player,pos=trackPoint(.985),a=tangent(.985);c.x=pos.x;c.y=pos.y;c.a=a;c.speed=125;c.offtrack=false;c.offtrackEntry=null;c.offtrackSeconds=0;c.lastP=.985;c.p=.985;c.respawnGrace=0;return true;},
 testSeamOutside:(phase=.99)=>{if(!race)return false;const c=race.player,pt=trackPoint(phase),a=tangent(phase),nx=-Math.sin(a),ny=Math.cos(a);
  c.x=pt.x+nx*102;c.y=pt.y+ny*102;c.a=a;c.speed=0;c.offtrack=true;c.offtrackSeconds=.6;
  c.offtrackEntry={x:trackPoint(.975).x,y:trackPoint(.975).y,a:tangent(.975),p:.975,speed:50,laps:c.lapsCompleted,flags:c.flags.slice()};
  c.lastP=.975;c.p=.975;c.lapGateBlocked=true;c.maxInteriorCut=0;return true;},
 testReenterSeam:()=>{if(!race)return false;const c=race.player,pt=trackPoint(.02);c.x=pt.x;c.y=pt.y;c.a=tangent(.02);c.speed=0;return true;},

 testWideCorner:()=>{if(!race)return false;const c=race.player,pt=trackPoint(.07);
  c.lastValidPosition={x:pt.x,y:pt.y,a:tangent(.07),p:.07,speed:40,laps:c.lapsCompleted,flags:c.flags.slice()};
  c.x=86;c.y=1140;c.speed=0;c.offtrack=true;c.onBridge=false;c.bridgeOffSeconds=0;c.offtrackSeconds=1.01;
  c.offtrackEntry={...c.lastValidPosition};c.respawnGrace=0;c.maxInteriorCut=0;c.lapGateBlocked=true;race.countdown=0;return true;},
 testPickupApproach:()=>{if(!race)return false;const box=race.pickups[0],c=race.player;c.x=box.x;c.y=box.y;c.a=tangent(box.segment);c.speed=0;c.jump=0;c.jumpCd=0;c.item=null;box.cool=0;return true;},
 testRampApproach:()=>{if(!race)return false;const c=race.player,o=props.find(q=>q.type==='ramp');if(!o)return false;
   c.x=o.x-Math.cos(o.a)*70;c.y=o.y-Math.sin(o.a)*70;c.a=o.a;c.speed=148;c.jump=0;c.jumpCd=0;c.bridgeMissActive=false;c.bridgeMissGrace=0;c.offtrack=false;c.respawnGrace=0;race.countdown=0;return true;},
 testJamContact:()=>{if(!race)return false;const c=race.player;c.x=jamPatch.x;c.y=jamPatch.y;c.jump=0;c.jumpCd=0;c.speed=230;c.jamTimer=0;c.offtrack=false;c.respawnGrace=0;race.countdown=0;return true;},
 getJamState:()=>race?{jamTimer:race.player.jamTimer||0,speed:race.player.speed,inside:jamHit(race.player,jamPatch)}:null,
 getWorldData:()=>track.toDataURL('image/png'),forceFinish:(rank=1)=>{if(!race)return false;race.countdown=0;race.time=Math.max(race.time,35);race.cars.slice(1).forEach((v,i)=>{v.done=i<Math.max(0,rank-1);v.finishTime=v.done?race.time-4-i:null;});race.player.done=true;race.player.finishTime=race.time;return true;},teleportOfftrack:()=>{if(!race)return false;const c=race.player,pt=trackPoint(.22),a=tangent(.22);c.x=pt.x-Math.sin(a)*165;c.y=pt.y+Math.cos(a)*165;c.speed=85;return true;},testSpoonApproach:()=>{if(!race)return false;const o=props.find(o=>o.type==='spoon'&&o.solid),c=race.player;if(!o)return false;c.x=o.x-55*Math.cos(o.angle);c.y=o.y-55*Math.sin(o.angle);c.a=o.angle;c.speed=125;c.jump=0;c.jumpCd=0;c.spoonCd=0;return true;},simulate:(seconds=1)=>{for(let i=0;i<Math.round(seconds*60);i++)update(1/60);return race?.cars.map(c=>({id:c.id,progress:c.p,laps:c.lapsCompleted,speed:c.speed,done:c.done}));},testClaw:(withTarget=true)=>{if(!race||race.cars.length<2)return false;const c=race.player;
  const at=trackPoint(.74),aim=tangent(.74);c.x=at.x;c.y=at.y;c.a=aim;c.speed=75;c.jump=0;c.item='claw';c.claw=0;c.clawTarget=null;
  for(let i=1;i<race.cars.length;i++){const t=race.cars[i];const pt={x:c.x+Math.cos(aim)*97,y:c.y+Math.sin(aim)*97};t.x=i===1&&withTarget?pt.x:390+i*65;t.y=i===1&&withTarget?pt.y:245;t.a=i===1&&withTarget?tangent(.756):0;t.speed=i===1&&withTarget?50:0;t.done=false;}
  useItem(c);return {engaged:c.claw>0,remainingItem:c.item,target:c.clawTarget?.id??null,hint:$('hint').textContent};
 },
 testShortcut:(cut=true)=>{if(!race)return false;const c=race.player,pt=trackPoint(.15);
  c.lastValidPosition={x:pt.x,y:pt.y,a:tangent(.15),p:.15,speed:100,laps:c.lapsCompleted,flags:c.flags.slice()};
  c.x=cut?720:pt.x;c.y=cut?460:pt.y;c.a=0;c.speed=0;c.offtrack=false;c.offtrackSeconds=0;c.offtrackEntry=null;c.maxInteriorCut=0;
  return true;
 },
 testEarlyCornerCut:(from=.24,to=.36,travelled=380)=>K.illegalRouteGain(from,to,travelled,TRACK_LENGTH),testEarlyCutIntegration:()=>{if(!race)return null;const c=race.player,from=.24,to=.36;const pos=trackPoint(to),safe=trackPoint(from);
 c.lastValidPosition={x:safe.x,y:safe.y,a:tangent(from),p:from,laps:c.lapsCompleted,flags:c.flags.slice()};
 c.auditP=from;c.auditTravel=350;c.auditCleanTime=0;c.x=pos.x;c.y=pos.y;c.p=from;c.lastP=from;c.a=tangent(to);c.speed=0;c.offtrack=false;c.respawnGrace=0;race.countdown=0;
 const before=c.shortcutRespawns||0;update(1/60);return {before,after:c.shortcutRespawns||0,phase:c.p,expectedPhase:from};
},getRouteAudit:()=>race?{anchor:race.player.auditP,travel:race.player.auditTravel,p:race.player.p,penalties:race.player.shortcutRespawns||0,pinch:race.player.routePinch,stable:race.player.routeStableP}:null,getOilSpin:()=>race?{left:race.player.oilSpin||0,heading:race.player.a,slip:race.player.slip}:null,getGrid:()=>race?.cars.map(c=>({x:c.x,y:c.y,p:c.p,id:c.id})),version:'0.13.6.86',getAudioStatus:()=>SND.status(),getCars:()=>race?.cars.map(c=>({id:c.id,x:c.x,y:c.y,speed:c.speed,slip:c.slip,claw:c.claw,p:c.p,stuckTime:c.stuckTime,hitVX:c.hitVX,hitVY:c.hitVY})),getState:()=>race?{mode:race.mode,oilCount:race.oils.length,playerSlip:race.player.slip,lap:race.player.lapsCompleted,position:race.player.p,x:race.player.x,y:race.player.y,angle:race.player.a,speed:race.player.speed,camX,camY,scale,jump:race.player.jump,car:race.player.profile.id,checkpoint:race.player.flags.slice(),pickupCount:race.pickups.length,pickupSegments:race.pickups.map(p=>p.segment),pickupTypes:race.cars.map(c=>c.item),loading:!$('loadingTrack').hidden,carCount:race.cars.length,offtrack:race.player.offtrack,offtrackSeconds:race.player.offtrackSeconds,spoonCd:race.player.spoonCd,shortcutRespawns:race.player.shortcutRespawns||0,claw:race.player.claw,clawTargetId:race.player.clawTarget?.id??null}:null,start:mode=>initRace(mode||'race')};
})();


