/* Tiny Track Rivals — Fase 7: logica di gara estratta senza alterare gli algoritmi.
 * Script classico: dipendenze iniettate dalla closure del legacy, nessuno stato globale di gara duplicato. */
(()=>{'use strict';
// Full-roster rotation for offline grids; online indices remain unchanged.
function offlineOpponents(count,player,slots,cursor=0){
 if(count<1||slots<=0)return [];
 const pool=Array.from({length:count},(_,i)=>(count-1+cursor+i)%count).filter(i=>i!==player);
 if(!pool.length)return Array(slots).fill(player);
 return Array.from({length:slots},(_,i)=>pool[i%pool.length]);
}
window.TTRRaceGrid=Object.freeze({offlineOpponents,create(deps){
  const {profiles,ttrCalibratedProfile,trackPoint,tangent,mod,getRace}=deps;

const duplicateColourSchemes={
 scatto:['#9544eb','#3cb8ad','#dfad5a'],
 tuono:['#ad62e3','#e89b50','#4bbb91'],
 polvere:['#b759d9','#3bbba9','#de597f'],
 lampo:['#e29a46','#9068df','#e65b88'],
 aero:['#33a7ce','#f5d760','#bd7adb'],
 enduro:['#9951d6','#3cbdad','#e5a14e'],
 brezza:['#eb9254','#9d6be0','#70bf63'],
 volt:['#e8433e','#e5bb35','#4b6cd1'],
 neon:['#36b5ce','#ce9436','#36ce7d'],
 roccia:['#254770','#7b3c2a','#cdcfd1'],martello:['#264e87','#d38b1f','#3f4a43'],turbovan:['#2972b3','#c32e36','#dbddd5'],titan:['#775f37','#304d6f','#b7b9b3'],
 hotflash:["#2b62c0", "#e7b11e", "#292d31"],metrocab:["#dead2c", "#e5e8ea", "#37679a"],interceptor:["#29427a", "#4a565c", "#1f5238"],retrosprint:["#c5272c", "#e0b93e", "#d2d7db"],apex:["#1e5bd6", "#f0b51f", "#2c2c33"],tempesta:["#c6242b", "#28965e", "#682aac"],behemoth:["#db3a23", "#247fd2", "#eca91f"]
};

const duplicateColourOffsets={scatto:0,tuono:1,polvere:1,lampo:2};

function createCar(index,p,t=0){const base=profiles[((p%profiles.length)+profiles.length)%profiles.length],pr=ttrCalibratedProfile(base),pos=trackPoint(t),a=tangent(t);const n={x:-Math.sin(a),y:Math.cos(a)};let lane=index%2===0?-29:29;
 return {id:index,profile:pr,color:index===0?pr.color:pr.color,x:pos.x+n.x*lane,y:pos.y+n.y*lane,a,speed:0,steer:0,width:pr.shape==='muscle'?39:pr.shape==='buggy'?41:pr.shape==='sport'?37:36,length:pr.shape==='muscle'?69:pr.shape==='buggy'?63:pr.shape==='sport'?67:61,boost:0,slip:0,jump:0,jumpTotal:.72,jumpCd:0,rampEntryVisual:false,claw:0,clawTarget:null,item:null,lapsCompleted:0,lastP:t,p:t,flags:[false,false,false],done:false,finishTime:null,lastCheckpoint:0,stuckTime:0,hitVX:0,hitVY:0,reverseRecovery:0,knifeCd:0,offtrack:false,offtrackSeconds:0,mode:'race',mugApexPassed:false,wheelPhase:0,hitYaw:0,impactGrace:0,variantAccent:null,variantLabel:'',variantSprite:null,auditP:mod(t,1),auditTravel:0,auditCleanTime:0,auditBridge:false,auditOutsideTime:0,oilSpin:0,oilSpinDir:1,routeStableP:mod(t,1),routePinch:null,routeResolvedNear:null};
}

function assignDuplicateAccents(){
 const race=getRace();

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
 return Object.freeze({createCar,assignDuplicateAccents});
}});
})();
