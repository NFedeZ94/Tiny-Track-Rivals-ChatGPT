(()=>{'use strict';
// Fase 6.4: solo pittura del circuito, algoritmo originale.
function paintBridgeDeck(deps){const {bridgeCtx,WORLD_W,WORLD_H,shortcutSamples}=deps;const ctx=bridgeCtx;
 ctx.clearRect(0,0,WORLD_W,WORLD_H);
 // Keep the identical toasted-bread bridge shape, but with raised deck lighting.
  // The shortcut is visibly separate: a narrower raised wooden-toast bridge between
  // two points of the course. It has a ramp at entry but is NEVER mandatory.
  const bridge=()=>{ctx.beginPath();shortcutSamples.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));};
  ctx.save();bridge();ctx.lineCap='round';ctx.lineJoin='round';ctx.shadowColor='#442c228a';ctx.shadowBlur=18;ctx.shadowOffsetY=13;ctx.strokeStyle='#905f3f';ctx.lineWidth=82;ctx.stroke();ctx.restore();
  ctx.save();bridge();ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#e29f56';ctx.lineWidth=74;ctx.stroke();
  bridge();ctx.strokeStyle='#c77736';ctx.lineWidth=66;ctx.stroke();bridge();ctx.strokeStyle='#f7d39a';ctx.lineWidth=58;ctx.stroke();ctx.restore();
  for(let i=5;i<shortcutSamples.length-5;i+=3){const p=shortcutSamples[i],q=shortcutSamples[i+1],a=Math.atan2(q.y-p.y,q.x-p.x),nx=-Math.sin(a),ny=Math.cos(a);
    ctx.strokeStyle=i%2===0?'#b67b4b7a':'#eac080ad';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(p.x-nx*26,p.y-ny*26);ctx.lineTo(p.x+nx*26,p.y+ny*26);ctx.stroke();
  }
 // A slight dark underside along the edges helps distinguish the underpass.
}
function paintClothPattern(ctx,left,top,right,bottom){
  // Original 74-unit tiles, anchored to the real tablecloth coordinates.
  const x0=70+Math.floor((left-70)/74)*74,y0=65+Math.floor((top-65)/74)*74;
  for(let y=y0;y<bottom;y+=74)for(let x=x0;x<right;x+=74){
    const xx=Math.floor((x-70)/74),yy=Math.floor((y-65)/74);
    ctx.fillStyle=(xx+yy)%2?'#f0c8bc':'#fbf0e5';ctx.fillRect(x,y,74,74);
    ctx.fillStyle='#a8554a1b';ctx.fillRect(x,y,74,2);ctx.fillRect(x,y,2,74);
  }
}
function paintWorld(deps){const {trackCtx,WORLD_W,WORLD_H,K,points,drawCrumb,jamPatch,jamSpillPath,trackPoint,tangent,drawPoly}=deps;const ctx=trackCtx,W=WORLD_W,H=WORLD_H;
  // Original cartoon breakfast-table world; no external sprites or copyrighted materials.
  const wood=ctx.createLinearGradient(0,0,W,H);wood.addColorStop(0,'#a86a48');wood.addColorStop(.47,'#d19a65');wood.addColorStop(1,'#875638');
  ctx.fillStyle=wood;ctx.fillRect(0,0,W,H);
  for(let y=0;y<H;y+=91){ctx.fillStyle=y%182===0?'#fff3d00c':'#54382712';ctx.fillRect(0,y,W,90);ctx.strokeStyle='#65412531';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  // A vast red gingham tablecloth and stitched hem, with warm, soft colours.
  ctx.save();ctx.shadowColor='#412f30a1';ctx.shadowBlur=22;ctx.shadowOffsetY=18;
  ctx.fillStyle='#f7e6d7';ctx.fillRect(70,65,W-140,H-120);ctx.restore();
  paintClothPattern(ctx,70,65,W-70,H-55);
  ctx.strokeStyle='#e9dad0';ctx.lineWidth=8;ctx.setLineDash([7,9]);ctx.strokeRect(89,82,W-178,H-154);ctx.setLineDash([]);
  // The course IS the uninterrupted gingham cloth. No tinted pavement or translucent curbs.
  // The crumb edges alone define the winding route and reveal its driving direction.
  // Pixel-toon racing boundary: hand-placed bread and biscuit crumbs, never plastic curbs.
  // The lane remains the same softly compressed gingham fabric beneath them.
  ctx.lineCap='round';ctx.lineJoin='round';
  // Render ONLY individually validated marker positions (including tiny chips):
  // no unchecked decorative scatter can invade the cloth driving corridor.
  for(const marker of K.crumbMarkers(points,8)){
    drawCrumb(ctx,marker.x,marker.y,marker.r,marker.seed);
  }
  // A single wide, irregular puddle runs from the jar lip to the race lane.
  // Its central part still matches the existing sticky physics footprint.
  ctx.save();ctx.translate(jamPatch.x,jamPatch.y);ctx.rotate(jamPatch.angle);
  jamSpillPath(ctx);
  const jamBase=ctx.createLinearGradient(-42,-75,48,158);
  jamBase.addColorStop(0,'#79183b');jamBase.addColorStop(.45,'#a51f53');
  jamBase.addColorStop(.82,'#bd2b60');jamBase.addColorStop(1,'#8a1a45');
  ctx.fillStyle=jamBase;ctx.strokeStyle='#61152fcf';ctx.lineWidth=3.5;ctx.fill();ctx.stroke();
  jamSpillPath(ctx);ctx.clip();
  // Semi-opaque cooked fruit pulp: many irregular translucent lobes suspended
  // inside darker syrup. Deterministic positions prevent shimmer or flicker.
  for(let i=0;i<78;i++){
    const h=n=>{const x=Math.sin(i*83.29+n*19.17)*43758.5453;return x-Math.floor(x);};
    const x=(h(1)-.5)*112,y=-94+h(2)*254,rx=2.5+h(3)*7.6,ry=2+h(4)*6.3;
    ctx.save();ctx.translate(x,y);ctx.rotate((h(5)-.5)*1.3);
    ctx.fillStyle=i%5===0?'#e66677a8':i%3===0?'#781b35c4':'#c63b58a5';
    ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#e67b8892';ctx.beginPath();ctx.ellipse(-rx*.18,-ry*.18,rx*.35,ry*.29,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  // Tiny fruit flecks and embedded seeds, not reflective paint spots.
  for(let i=0;i<54;i++){
    const hash=n=>{const x=Math.sin(i*127.12+n*9.67)*17643.312;return x-Math.floor(x);};
    const x=(hash(1)-.5)*109,y=-90+hash(2)*245;
    ctx.fillStyle=i%4===0?'#e78e91c4':'#61213cd0';ctx.beginPath();
    ctx.ellipse(x,y,.8+hash(3)*1.15,1.4+hash(4)*1.25,hash(5)*3,0,Math.PI*2);ctx.fill();
  }
  ctx.restore();
  // Elevated toast bridge lives in an independent overpass layer; ground cars
  // going across the original track can pass visually UNDER its deck.
  // Start/finish spans the actual full lane, including both sides of the line.
  const f=trackPoint(0),ang=tangent(0),nx=-Math.sin(ang),ny=Math.cos(ang),fx=Math.cos(ang),fy=Math.sin(ang);
  for(let row=0;row<3;row++)for(let col=-12;col<12;col++){
    const cx=f.x+nx*(col*10+5)+fx*(row*10-10),cy=f.y+ny*(col*10+5)+fy*(row*10-10);
    drawPoly(ctx,[[cx-nx*5-fx*5,cy-ny*5-fy*5],[cx+nx*5-fx*5,cy+ny*5-fy*5],[cx+nx*5+fx*5,cy+ny*5+fy*5],[cx-nx*5+fx*5,cy-ny*5+fy*5]],(row+col)%2?'#f9f5e9':'#292d3b');
  }
}
window.TTRCircuitVisuals=Object.freeze({paintBridgeDeck,paintWorld,paintClothPattern});
})();
