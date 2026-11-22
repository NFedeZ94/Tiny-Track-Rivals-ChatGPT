/* Tiny Track Rivals — Fase 6g: primitive grafiche Canvas.
 * Estratte senza modifiche algoritmiche dal legacy.
 * Nessuna dipendenza da gara, fisica, input o stato globale.
 */
(()=>{'use strict';
function drawPoly(ctx,coords,fill,stroke=null,width=1){ctx.beginPath();ctx.moveTo(coords[0][0],coords[0][1]);for(let i=1;i<coords.length;i++)ctx.lineTo(coords[i][0],coords[i][1]);ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
function capsule(ctx,x,y,w,h,r=6){ctx.beginPath();if(ctx.roundRect){ctx.roundRect(x,y,w,h,r);}else ctx.rect(x,y,w,h);}
function rounded(ctx,x,y,w,h,r,fill,stroke=null){capsule(ctx,x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function colorMix(hex,n){let h=hex.replace('#','');let r=parseInt(h.slice(0,2),16),gr=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);let m=n>=0?255:0,p=Math.abs(n);return `rgb(${Math.round(r+(m-r)*p)},${Math.round(gr+(m-gr)*p)},${Math.round(b+(m-b)*p)})`;}
function shadow(ctx,blur=15,color='#1a140f88',x=7,y=10){ctx.shadowColor=color;ctx.shadowBlur=blur;ctx.shadowOffsetX=x;ctx.shadowOffsetY=y;}
window.TTRCanvasPrimitives=Object.freeze({drawPoly,capsule,rounded,colorMix,shadow});
})();
