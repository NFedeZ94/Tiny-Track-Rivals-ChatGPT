/* Desk Drift: fixed concept art and live route, independent of other tracks. */
(()=>{'use strict';const D=window.TTRDeskTrack;
 const load=url=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=url;});
 let art=null,deck=null;const ready=Promise.all([load('assets/images/desk-drift-world.webp?v=128'),load('assets/images/desk-drift-ruler.webp?v=128')]).then(([a,b])=>{art=a;deck=b;return !!art&&!!deck;});
 function path(c,pts,close=false){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));if(close)c.closePath();}
 function landing(c){const pts=D.shortcutSamples.slice(46);const widths=[148,132,112];const colors=['#4a3628','#99816b','#d9c4a8'];c.save();c.lineCap='round';c.lineJoin='round';for(let i=0;i<widths.length;i++){path(c,pts);c.strokeStyle=colors[i];c.lineWidth=widths[i];c.stroke();}for(let i=49;i<79;i+=4){const q=D.shortcutSamples[i],a=D.shortcutTangent(i/80),nx=-Math.sin(a),ny=Math.cos(a);c.beginPath();c.moveTo(q.x+nx*49,q.y+ny*49);c.lineTo(q.x-nx*49,q.y-ny*49);c.lineWidth=3;c.strokeStyle='#69594788';c.stroke();}c.restore();}
 function render(c,b){const {w,h}=D.world;c.clearRect(0,0,w,h);b?.clearRect(0,0,w,h);if(art)c.drawImage(art,0,0,w,h);else{c.fillStyle='#a8784c';c.fillRect(0,0,w,h);c.lineJoin='round';path(c,D.points,true);c.lineWidth=D.laneHalf*2+16;c.strokeStyle='#d94d3e';c.stroke();c.lineWidth=D.laneHalf*2;c.strokeStyle='#494650';c.stroke();}
  // The ruler is above the main route. Only vehicles on the alternate deck draw above it.
  if(b){landing(b);if(deck)b.drawImage(deck,0,0,w,h);}

 }
 window.TTRDeskVisuals=Object.freeze({ready,render});})();
