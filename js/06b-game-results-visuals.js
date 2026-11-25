(()=>{'use strict';
function ttrResultPaintColor(hex){
 const m=/^#([a-f\d]{6})$/i.exec(hex||'');
 if(!m)return null;
 const n=parseInt(m[1],16),r=(n>>16)/255,g=((n>>8)&255)/255,b=(n&255)/255;
 return ttrResultRgbHsl(r,g,b);
}
function ttrResultRgbHsl(r,g,b){
 const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min,l=(max+min)/2;
 let h=0,s=delta===0?0:delta/(1-Math.abs(2*l-1));
 if(delta){if(max===r)h=((g-b)/delta)%6;else if(max===g)h=(b-r)/delta+2;else h=(r-g)/delta+4;h=(h*60+360)%360;}
 return [h,s,l];
}
function ttrResultHslRgb(h,s,l){
 const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs((h/60)%2-1)),m=l-c/2;
 const a=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];
 return [a[0]+m,a[1]+m,a[2]+m];
}
function ttrTintResultBody(source,baseHex,targetHex,model){
 if(!targetHex||targetHex.toLowerCase()===baseHex?.toLowerCase())return;
 const base=ttrResultPaintColor(baseHex),target=ttrResultPaintColor(targetHex);
 if(!base||!target)return;
 const g=source.getContext('2d',{willReadFrequently:true});
 const frame=g.getImageData(0,0,source.width,source.height),rgba=frame.data;
 for(let i=0;i<rgba.length;i+=4){
  if(rgba[i+3]<18)continue;
  const [h,s,l]=ttrResultRgbHsl(rgba[i]/255,rgba[i+1]/255,rgba[i+2]/255);
  const dh=Math.abs(h-base[0]),angle=Math.min(dh,360-dh);
  // Only saturated paint close to the source body hue changes: windows,
  // tyres, glass, white graphics, and shadow pixels retain their materials.
  const hueWeight=Math.min(1,Math.max(0,(98-angle)/62));
  const satWeight=Math.min(1,Math.max(0,(s-.18)/.30));
  const lightWeight=Math.min(1,Math.max(0,(l-.10)/.13));
  const whiteMask=Math.min(1,Math.max(0,(l-.48)/.26))*Math.min(1,Math.max(0,(.27-s)/.16));
  const weight=model==='volt'?whiteMask:hueWeight*satWeight*lightWeight;
  if(weight<.035)continue;
  const delta=((target[0]-h+540)%360)-180;
  const newH=model==='volt'?target[0]:(h+delta*weight+360)%360;
  const newS=Math.max(0,Math.min(1,s+(target[1]-base[1])*.68*weight));
  const newL=Math.max(0,Math.min(1,l+(target[2]-base[2])*.78*weight));
  const rgb=ttrResultHslRgb(newH,newS,newL);
  rgba[i]=Math.round(rgb[0]*255);rgba[i+1]=Math.round(rgb[1]*255);rgba[i+2]=Math.round(rgb[2]*255);
 }
 g.putImageData(frame,0,0);
}
function ttrDrawResultThumbnail(canvas,car,TTRShowroomStarts){
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const w=canvas.width,h=canvas.height;
 ctx.clearRect(0,0,w,h);
 const id=car.profile.id,assets=window.TTRAssets?.images||{};
 const atlas=assets[id+'_turntable'];
 let source=null;
 if(atlas?.complete&&atlas.naturalWidth>=12&&atlas.naturalHeight>=16){
  const columns=id==='aero'?24:12;
  const sw=Math.floor(atlas.naturalWidth/columns),sh=Math.floor(atlas.naturalHeight/16);
  const frame=TTRShowroomStarts[id]??0;
  source=document.createElement('canvas');source.width=sw;source.height=sh;
  source.getContext('2d').drawImage(atlas,(frame%columns)*sw,Math.floor(frame/columns)*sh,sw,sh,0,0,sw,sh);
 }else{
  // The garage and results have the same high-quality atlas; if it is still
  // loading, use the 3/4 showroom still (never replace it with a new model).
  const still=assets[id+'_showroom'];
  if(still?.complete&&still.naturalWidth){
   source=document.createElement('canvas');source.width=still.naturalWidth;source.height=still.naturalHeight;
   source.getContext('2d').drawImage(still,0,0);
  }
 }
 if(!source)return;
 try{
  ttrTintResultBody(source,car.profile.color,car.variantAccent,id);
  const pixels=source.getContext('2d',{willReadFrequently:true}).getImageData(0,0,source.width,source.height).data;
  let minX=source.width,minY=source.height,maxX=-1,maxY=-1;
  for(let y=0;y<source.height;y++)for(let x=0;x<source.width;x++){
   if(pixels[(y*source.width+x)*4+3]<18)continue;
   if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
  }
  if(maxX<minX||maxY<minY)return;
  const pad=Math.max(2,Math.round(Math.min(source.width,source.height)*.02));
  minX=Math.max(0,minX-pad);minY=Math.max(0,minY-pad);
  maxX=Math.min(source.width-1,maxX+pad);maxY=Math.min(source.height-1,maxY+pad);
  const bw=maxX-minX+1,bh=maxY-minY+1;
  const size=(atlas?.complete&&atlas.naturalWidth?window.TTRVehiclePreviewScale?.(id,w,h,'result'):null)??Math.min(w*.86/bw,h*.89/bh);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  ctx.drawImage(source,minX,minY,bw,bh,(w-bw*size)/2,(h-bh*size)/2,bw*size,bh*size);
 }catch(err){
  // A blocked pixel-read must not break the results or the race menu.
  console.warn('Results car preview could not be color-calibrated:',id,err);
  const size=Math.min(w*.82/source.width,h*.86/source.height);
  ctx.drawImage(source,(w-source.width*size)/2,(h-source.height*size)/2,source.width*size,source.height*size);
 }
}

window.TTRResultVisuals=Object.freeze({drawResultThumbnail:ttrDrawResultThumbnail});
})();
