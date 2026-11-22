

/* Tiny Track Rivals / v0.4 — original, resolution-independent, top-down 2.5D model artwork.
   Game drawing is fully separable from car physics. Front of each vehicle is local -Y. */
(function(root){'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const palettes={
  hatch:{body:'#eb3941',dark:'#93242e',glass:'#1d394d',trim:'#1b252d'},
  muscle:{body:'#256bd9',dark:'#173b83',glass:'#132e48',trim:'#1a2431'},
  buggy:{body:'#e4ad35',dark:'#9c6724',glass:'#263743',trim:'#252d30'},
  sport:{body:'#21c99b',dark:'#126653',glass:'#123d55',trim:'#102c35'}
 };
 function poly(c,p,fill,stroke=null,lw=1){c.beginPath();c.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)c.lineTo(p[i][0],p[i][1]);c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
 function rr(c,x,y,w,h,r,fill,stroke=null,lw=1){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
 function ellipse(c,x,y,rx,ry,fill,stroke=null,lw=1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke();}}
 function gradient(c,a,b,colors){const g=c.createLinearGradient(a[0],a[1],b[0],b[1]);for(const [x,v] of colors)g.addColorStop(x,v);return g;}
 function glass(c,p,dark='#1b3d54'){poly(c,p,gradient(c,[-20,-12],[24,24],[[0,'#4f819a'],[.22,'#294a61'],[.55,dark],[1,'#091b2e']]),'#7d9fae',1.1);}
 function reflection(c,p){poly(c,p,'#c5f1ff72');}
 function wheel(c,x,y,big=false,steer=0){c.save();c.translate(x,y);if(y<0)c.rotate(clamp(steer,-1,1)*.24);const w=big?13:10, h=big?24:20;
  rr(c,-w/2,-h/2,w,h,3,'#171921','#42454c',1.2);
  c.strokeStyle='#6a6860';c.lineWidth=.9;for(let k=-1;k<=1;k++){c.beginPath();c.moveTo(-w/2,k*h*.24);c.lineTo(w/2,k*h*.24);c.stroke();}
  ellipse(c,0,0,w*.25,h*.23,'#aeb9c4','#435362',1);
  c.strokeStyle='#e7ecf0';c.lineWidth=1.1;for(let k=0;k<5;k++){const a=(k/5)*Math.PI*2;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*w*.25,Math.sin(a)*h*.20);c.stroke();}c.restore();}
 function lamp(c,x,y,w=11,h=6,tint='#fff1c5'){rr(c,x,y,w,h,1.2,gradient(c,[x,y],[x+w,y+h],[[0,'#ffffff'],[.5,tint],[1,'#e3b371']]),'#736047',.8);rr(c,x+1,y+1,w-2,1.6,.3,'#ffffffa8');}
 function backlight(c,x,y,w=11){rr(c,x,y,w,4.8,1,'#f56457','#8b2d32',1);rr(c,x+1,y+.9,w-2,1.3,.4,'#ffd1a2a0');}
 function shine(c){poly(c,[[-16,-24],[-10,-26],[-13,-15],[-18,-12]],'#ffffff30');}
 function base(c,pts,pal){
   // A single unified diecast shell with softly faceted depth, not attached geometric bits.
   c.save();c.translate(2.3,3.7);poly(c,pts,pal.dark,'#111b2b',1.8);c.restore();
   poly(c,pts,gradient(c,[-26,-36],[24,32],[[0,'#ffffff42'],[.18,pal.body],[.72,pal.body],[1,pal.dark]]),'#202c39',2.2);
 }
 function hatch(c,pal){
   for(const sx of [-1,1])for(const y of [-25,23])wheel(c,sx*24,y,false,0);
   const hull=[[-17,-37],[17,-37],[20,-31],[22,-23],[22,22],[18,34],[-18,34],[-22,22],[-22,-23],[-20,-31]];
   base(c,hull,pal);
   // Hood raised edges, short wheelbase and flat roof: 1990s European hot hatch.
   poly(c,[[-16,-35],[16,-35],[17,-18],[-17,-18]],gradient(c,[0,-36],[0,-18],[[0,'#f75258'],[1,pal.body]]),'#bc2d35',.7);
   poly(c,[[-17,-15],[17,-15],[17,18],[-17,18]],pal.dark,'#591c2a',1);
   poly(c,[[-15,-14],[15,-14],[14,-5],[-14,-5]],'#162c3e');glass(c,[[-15,-14],[15,-14],[13,-5],[-13,-5]]);reflection(c,[[-14,-13],[-8,-13],[-12,-5],[-15,-5]]);
   poly(c,[[-15,-3],[15,-3],[15,12],[-15,12]],gradient(c,[-15,-3],[15,12],[[0,'#ff7b7d'],[1,pal.body]]),'#b72f38',.7);
   glass(c,[[-15,14],[15,14],[17,22],[-17,22]]);
   glass(c,[[-19,-1],[-15,0],[-15,12],[-19,13]],'#193447');glass(c,[[19,-1],[15,0],[15,12],[19,13]],'#193447');
   for(const x of [-17,10])lamp(c,x,-36,8,6);rr(c,-18,-29,36,3,0,'#1b2028');rr(c,-19,-33,2,4,0,'#10141d');rr(c,17,-33,2,4,0,'#10141d');
   backlight(c,-17,29,11);backlight(c,6,29,11);rr(c,-18,32,36,3,0,'#24252a');
   // Only a subtle factory spoiler lip from original character sheet.
   poly(c,[[-18,33],[18,33],[15,36],[-15,36]],'#20242b');
   shine(c);
 }
 function muscle(c,pal){
   for(const sx of [-1,1])for(const y of [-27,27])wheel(c,sx*28,y,true,0);
   const hull=[[-21,-44],[21,-44],[25,-37],[26,-24],[25,29],[21,42],[-21,42],[-25,29],[-26,-24],[-25,-37]];
   base(c,hull,pal);
   // Muscle car: long bonnet, broad shoulder, shortened rear-set cabin.
   poly(c,[[-17,-40],[17,-40],[19,-10],[-19,-10]],gradient(c,[0,-40],[0,-10],[[0,'#70b1ff'],[.22,pal.body],[1,pal.dark]]),'#134691',1.1);
   poly(c,[[-7,-35],[7,-35],[10,-19],[-10,-19]],'#14375c','#66b0f8',.7);
   poly(c,[[-19,-9],[19,-9],[21,28],[-21,28]],pal.dark,'#152e5d',1);
   glass(c,[[-17,-6],[17,-6],[15,5],[-15,5]],'#18374d');reflection(c,[[-16,-5],[-10,-5],[-13,4],[-16,4]]);
   poly(c,[[-17,7],[17,7],[18,18],[-18,18]],gradient(c,[0,7],[0,18],[[0,'#3b8df0'],[1,pal.body]]));
   glass(c,[[-18,21],[18,21],[19,29],[-19,29]],'#1a364c');
   glass(c,[[-23,5],[-19,6],[-19,20],[-23,19]],'#153b50');glass(c,[[23,5],[19,6],[19,20],[23,19]],'#153b50');
   for(const x of [-20,11])lamp(c,x,-43,9,6,'#f7e9cb');rr(c,-12,-44,24,4,0,'#162231');
   backlight(c,-20,36,12);backlight(c,8,36,12);rr(c,-20,40,40,3,0,'#252a35');
   shine(c);
 }
 function buggy(c,pal){
   for(const sx of [-1,1])for(const y of [-27,25])wheel(c,sx*30,y,true,0);
   const hull=[[-15,-38],[15,-38],[20,-28],[18,27],[13,35],[-13,35],[-18,27],[-20,-28]];
   base(c,hull,pal);
   poly(c,[[-12,-34],[12,-34],[14,-14],[-14,-14]],gradient(c,[-15,-36],[10,-12],[[0,'#fff0a3'],[1,pal.body]]),'#9c6724',1);
   // Exposed roll cage, low profile open cockpit; no glass-panel fake roof.
   poly(c,[[-15,-12],[15,-12],[17,19],[-17,19]],'#202d32','#a67731',1);
   glass(c,[[-14,-14],[14,-14],[12,-6],[-12,-6]],'#35586e');
   poly(c,[[-13,-3],[13,-3],[13,13],[-13,13]],'#4b5660');
   c.strokeStyle='#e9cb80';c.lineWidth=2.8;c.beginPath();c.moveTo(-17,-11);c.lineTo(-16,20);c.lineTo(16,20);c.lineTo(17,-11);c.closePath();c.stroke();
   c.beginPath();c.moveTo(-15,-9);c.lineTo(15,15);c.moveTo(15,-9);c.lineTo(-15,15);c.stroke();
   for(const x of [-16,8])lamp(c,x,-37,8,7);
   // Off-road bumper and mounted spare tire integrated into back bar.
   rr(c,-18,31,36,4,0,'#27313a');ellipse(c,0,29,10,11,'#151b20','#697079',1.5);ellipse(c,0,29,4.8,5.3,'#8f9da9','#344048',1.2);
   shine(c);
 }
 function sport(c,pal){
   for(const sx of [-1,1])for(const y of [-23,25])wheel(c,sx*24,y,false,0);
   const hull=[[-11,-44],[11,-44],[18,-36],[22,-14],[22,22],[16,38],[-16,38],[-22,22],[-22,-14],[-18,-36]];
   base(c,hull,pal);
   // Low wedge, swept nose and tightly enclosed teardrop cabin.
   poly(c,[[-10,-42],[10,-42],[18,-19],[-18,-19]],gradient(c,[0,-42],[0,-19],[[0,'#aaffdd'],[.35,pal.body],[1,pal.dark]]),'#18866f',.8);
   poly(c,[[-15,-17],[15,-17],[18,17],[-18,17]],pal.dark,'#1a7a67',1);
   glass(c,[[-13,-16],[13,-16],[16,2],[-16,2]],'#10405c');reflection(c,[[-12,-15],[-7,-15],[-13,0],[-16,0]]);
   poly(c,[[-14,4],[14,4],[15,17],[-15,17]],'#23c49e');
   glass(c,[[-15,19],[15,19],[17,27],[-17,27]],'#123346');
   for(const x of [-15,5])lamp(c,x,-38,10,4,'#d4fff7');
   poly(c,[[-18,32],[18,32],[14,36],[-14,36]],'#1a343b');backlight(c,-14,31,9);backlight(c,5,31,9);
   // twin air intakes, aligned with the chassis.
   poly(c,[[-22,16],[-16,15],[-15,23],[-21,23]],'#184b51');poly(c,[[22,16],[16,15],[15,23],[21,23]],'#184b51');
   shine(c);
 }
 const models={hatch,muscle,buggy,sport};
 function draw(ctx,car,clock=0){if(!car||!car.profile)return;
   const p=palettes[car.profile.shape]||palettes.hatch;
   ctx.save();ctx.translate(car.x||0,car.y||0);ctx.rotate((car.a||0)+Math.PI/2);
   const mini=Boolean(car.mini);ctx.scale(mini?.58:.80,mini?.58:.80);
   const jump=car.jump>0?Math.sin(Math.PI*(1-(car.jump/.4)))*16:0;
   ctx.save();ctx.globalAlpha=.28-jump*.004;ellipse(ctx,4,9,26,38,'#07111b');ctx.restore();
   ctx.translate(0,-jump);
   (models[car.profile.shape]||hatch)(ctx,p);
   if(car.boost>0&&!mini){
      const flicker=Math.sin(clock*18)*4;poly(ctx,[[-7,40],[-11,52+flicker],[-2,46]],'#8ef4ff');poly(ctx,[[7,40],[11,52+flicker],[2,46]],'#63d7ff');
   }
   ctx.restore();
 }
 root.TTRVehicleArt={draw,models:Object.keys(models)};
})(typeof window==='undefined'?globalThis:window);


