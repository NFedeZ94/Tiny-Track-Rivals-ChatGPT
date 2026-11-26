/* Tiny Track Rivals — original WebAudio soundtrack and arcade effects. */
(function(root){'use strict';
  const AC=root.AudioContext||root.webkitAudioContext;
  const settings={master:.76,music:.52,engine:.54,effects:.70,muted:false};
  try{const saved=JSON.parse(localStorage.getItem('ttr_audio_settings')||'{}');for(const k of Object.keys(settings))if(typeof saved[k]===typeof settings[k])settings[k]=saved[k];}catch(_){}
  let ctx=null,master=null,musicBus=null,engineBus=null,fxBus=null,engine=null,analyser=null,mode='silent',seqTimer=null,seqIndex=0,sequenceToken=0,lastError='',lastSound='',unlocked=false,vehicleId='';
  const frequencies={C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196,A3:220,B3:246.94,C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880,B5:987.77,C6:1046.5,D6:1174.66,E6:1318.51};
  const vehicleTones={
    scatto:{type:'triangle',sub:'sine',harm:'triangle',base:96,range:143,filter:720,cut:460,mix:.165,submix:.065,harmmix:.026,detune:1,flutter:.008,flutterHz:7.0,ratio:1.98},
    tuono:{type:'triangle',sub:'sine',harm:'sine',base:67,range:106,filter:570,cut:410,mix:.153,submix:.115,harmmix:.015,detune:-2,flutter:.024,flutterHz:5.1,ratio:1.5},
    polvere:{type:'triangle',sub:'sine',harm:'triangle',base:84,range:123,filter:640,cut:390,mix:.165,submix:.084,harmmix:.023,detune:1,flutter:.017,flutterHz:8.4,ratio:1.64},
    lampo:{type:'triangle',sub:'sine',harm:'triangle',base:111,range:161,filter:790,cut:480,mix:.167,submix:.046,harmmix:.022,detune:2,flutter:.006,flutterHz:9.0,ratio:2.15},
    aero:{type:'triangle',sub:'sine',harm:'sine',base:101,range:157,filter:720,cut:470,mix:.159,submix:.058,harmmix:.019,detune:0,flutter:.004,flutterHz:6.7,ratio:2.1},
    enduro:{type:'triangle',sub:'sine',harm:'triangle',base:124,range:171,filter:830,cut:550,mix:.155,submix:.042,harmmix:.031,detune:3,flutter:.009,flutterHz:10.6,ratio:2.27},
    volt:{type:'sine',sub:'sine',harm:'triangle',base:158,range:230,filter:1000,cut:630,mix:.105,submix:.032,harmmix:.013,detune:0,flutter:.002,flutterHz:12,ratio:2.6},
    neon:{type:'sine',sub:'triangle',harm:'sine',base:192,range:260,filter:1240,cut:760,mix:.100,submix:.040,harmmix:.023,detune:3,flutter:.007,flutterHz:17,ratio:3.2},
    roccia:{type:'triangle',sub:'sine',harm:'sine',base:76,range:100,filter:530,cut:320,mix:.153,submix:.100,harmmix:.018,detune:-1,flutter:.012,flutterHz:6.2,ratio:1.72},
    martello:{type:'triangle',sub:'sine',harm:'triangle',base:62,range:116,filter:660,cut:360,mix:.157,submix:.112,harmmix:.027,detune:-3,flutter:.032,flutterHz:5.6,ratio:1.85},
    turbovan:{type:'triangle',sub:'sine',harm:'triangle',base:89,range:122,filter:670,cut:380,mix:.150,submix:.076,harmmix:.018,detune:1,flutter:.018,flutterHz:8.7,ratio:2.05},
    titan:{type:'triangle',sub:'sine',harm:'sine',base:70,range:88,filter:500,cut:290,mix:.147,submix:.118,harmmix:.014,detune:-2,flutter:.026,flutterHz:4.7,ratio:1.45},
    hotflash:{type:'triangle',sub:'sine',harm:'triangle',base:62,range:150,filter:740,cut:436,mix:.15,submix:0.11,harmmix:.024,detune:1,flutter:.012,flutterHz:5.5,ratio:2.1},
    metrocab:{type:'triangle',sub:'sine',harm:'triangle',base:92,range:93,filter:550,cut:324,mix:.15,submix:0.07,harmmix:.024,detune:1,flutter:.012,flutterHz:7,ratio:2.1},
    interceptor:{type:'triangle',sub:'sine',harm:'triangle',base:74,range:143,filter:760,cut:448,mix:.15,submix:0.09,harmmix:.024,detune:1,flutter:.012,flutterHz:6.4,ratio:2.1},
    retrosprint:{type:'triangle',sub:'sine',harm:'triangle',base:104,range:120,filter:620,cut:365,mix:.15,submix:0.06,harmmix:.024,detune:1,flutter:.012,flutterHz:8,ratio:2.1},
    apex:{type:'triangle',sub:'sine',harm:'triangle',base:155,range:220,filter:1160,cut:684,mix:.15,submix:0.025,harmmix:.024,detune:1,flutter:.012,flutterHz:14,ratio:2.1},
    tempesta:{type:'triangle',sub:'sine',harm:'triangle',base:119,range:170,filter:910,cut:536,mix:.15,submix:0.06,harmmix:.024,detune:1,flutter:.012,flutterHz:10,ratio:2.1},
    behemoth:{type:'triangle',sub:'sine',harm:'triangle',base:49,range:80,filter:450,cut:265,mix:.15,submix:0.13,harmmix:.024,detune:1,flutter:.012,flutterHz:4,ratio:2.1},
    brezza:{type:'sawtooth',sub:'sine',harm:'triangle',base:108,range:184,filter:690,cut:420,mix:.118,submix:.047,harmmix:.024,detune:1,flutter:.005,flutterHz:8.1,ratio:2.42}
  };
  function persist(){try{localStorage.setItem('ttr_audio_settings',JSON.stringify(settings));}catch(_){}}
  function gainNode(value,destination){const g=ctx.createGain();g.gain.value=value;g.connect(destination);return g;}
  function initialize(){if(ctx||!AC)return !!ctx;
    try{
      ctx=new AC();const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-17;compressor.knee.value=18;compressor.ratio.value=2.5;compressor.attack.value=.018;compressor.release.value=.22;
      master=gainNode(settings.muted?0:settings.master,compressor);analyser=ctx.createAnalyser();analyser.fftSize=512;compressor.connect(analyser);analyser.connect(ctx.destination);
      musicBus=gainNode(settings.music*.48,master);engineBus=gainNode(settings.engine*.68,master);fxBus=gainNode(settings.effects*.55,master);
      const mix=gainNode(.0,engineBus),filter=ctx.createBiquadFilter(),highpass=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=900;filter.Q.value=.55;highpass.type='highpass';highpass.frequency.value=54;filter.connect(highpass);highpass.connect(mix);
      const osc=ctx.createOscillator(),sub=ctx.createOscillator(),harm=ctx.createOscillator();osc.type='sawtooth';sub.type='sine';harm.type='triangle';osc.frequency.value=96;sub.frequency.value=48;harm.frequency.value=192;
      const mainGain=gainNode(.16,filter),subGain=gainNode(.06,filter),harmGain=gainNode(.02,filter);osc.connect(mainGain);sub.connect(subGain);harm.connect(harmGain);osc.start();sub.start();harm.start();
      engine={osc,sub,harm,mix,filter,highpass,mainGain,subGain,harmGain,filteredRpm:0,lastSync:ctx.currentTime};return true;
    }catch(e){lastError=String(e);return false;}
  }
  function setLevels(){if(!ctx)return;const at=ctx.currentTime;master.gain.setTargetAtTime(settings.muted?0:settings.master,at,.025);musicBus.gain.setTargetAtTime(settings.music*.48,at,.04);engineBus.gain.setTargetAtTime(settings.engine*.68,at,.08);fxBus.gain.setTargetAtTime(settings.effects*.55,at,.04);}
  function unlock(){if(!initialize())return Promise.resolve(false);const p=ctx.resume();return Promise.resolve(p).then(()=>{unlocked=ctx.state==='running';if(unlocked)lastError='';else lastError='AudioContext: '+ctx.state;return unlocked;}).catch(e=>{lastError=String(e);return false;});}
  function setMuted(value){settings.muted=!!value;persist();setLevels();if(settings.muted)stopMusic();return settings.muted;}
  function setVolume(bus,value){if(!['master','music','engine','effects'].includes(bus))return;settings[bus]=Math.max(0,Math.min(1,Number(value)||0));persist();setLevels();}
  function tone(freq,duration=.12,vol=.3,type='triangle',destination=fxBus,when=null,endFreq=null){if(!ctx||ctx.state!=='running'||settings.muted||!destination)return;
    const start=when===null?ctx.currentTime:when,o=ctx.createOscillator(),g=ctx.createGain();o.type=type;o.frequency.setValueAtTime(Math.max(20,freq),start);
    if(endFreq)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),start+duration);
    g.gain.setValueAtTime(.0001,start);g.gain.linearRampToValueAtTime(Math.max(.0001,vol),start+.008);g.gain.exponentialRampToValueAtTime(.0001,start+duration);
    o.connect(g);g.connect(destination);o.start(start);o.stop(start+duration+.02);o.onended=()=>{o.disconnect();g.disconnect();};
  }
  function sfx(kind){if(!ctx||ctx.state!=='running'||settings.muted)return;lastSound=kind;const at=ctx.currentTime;
    if(kind==='pickup'){tone(710,.13,.31,'sine',fxBus,at,1050);tone(1110,.19,.19,'triangle',fxBus,at+.06,1500);}
    else if(kind==='turbo'){tone(290,.31,.24,'triangle',fxBus,at,870);tone(660,.24,.16,'triangle',fxBus,at+.05,980);}
    else if(kind==='oil'){tone(180,.20,.25,'triangle',fxBus,at,75);}
    else if(kind==='oilSkid'){tone(290,.28,.25,'sawtooth',fxBus,at,95);tone(430,.25,.10,'triangle',fxBus,at+.07,145);}
    else if(kind==='claw'){tone(410,.15,.24,'square',fxBus,at,280);tone(540,.16,.17,'triangle',fxBus,at+.11,710);}
    else if(kind==='clawFail'){tone(320,.18,.24,'square',fxBus,at,130);tone(220,.20,.18,'triangle',fxBus,at+.09,100);}
    else if(kind==='respawn'){tone(380,.22,.31,'sawtooth',fxBus,at,145);tone(520,.19,.21,'triangle',fxBus,at+.16,310);}
    else if(kind==='elimPoint'){[523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,.18,.24,'triangle',fxBus,at+i*.15));}
    else if(kind==='elimOut'){tone(420,.16,.11,'triangle',fxBus,at,220);tone(250,.22,.13,'sine',fxBus,at+.09,115);}
    else if(kind==='victoryJingle'){[523.25,659.25,783.99,1046.5,783.99,1046.5,1318.5,1567.98].forEach((f,i)=>tone(f,i===7?1.05:.29,.39,'triangle',fxBus,at+i*.28));[130.81,196,261.63].forEach((f,i)=>tone(f,.30,.26,'sawtooth',fxBus,at+i*.37));}
    else if(kind==='podiumJingle'){[[392,493.88,587.33],[440,523.25,659.25],[523.25,659.25,783.99]].forEach((notes,i)=>notes.forEach(f=>tone(f,i===2?.95:.38,.19,'triangle',fxBus,at+i*.48)));}
    else if(kind==='defeatJingle'){[493.88,440,392,329.63,293.66,246.94].forEach((f,i)=>tone(f,i===5?.85:.29,.24,'triangle',fxBus,at+i*.36));[164.81,146.83,130.81].forEach((f,i)=>tone(f,.48,.16,'sine',fxBus,at+i*.64));}
    else if(kind==='jump'){tone(320,.25,.31,'triangle',fxBus,at,810);tone(620,.22,.13,'sine',fxBus,at+.08,1060);}
    else if(kind==='impact'){tone(170,.075,.30,'sawtooth',fxBus,at,63);tone(94,.12,.19,'triangle',fxBus,at,47);}
    else if(kind==='lap'){[440,660,880].forEach((f,i)=>tone(f,.19,.23,'triangle',fxBus,at+i*.10));}
    else if(kind==='spoon'){tone(480,.10,.13,'triangle',fxBus,at,250);tone(1020,.09,.08,'sine',fxBus,at+.04,570);}
    else if(kind==='slowSurface'){tone(170,.19,.15,'triangle',fxBus,at,90);tone(115,.16,.10,'sawtooth',fxBus,at+.08,65);}
    else if(kind==='offtrack'){tone(134,.17,.11,'sawtooth',fxBus,at,95);}
    else if(kind==='fall'){tone(720,.65,.12,'triangle',fxBus,at,95);tone(360,.78,.18,'sawtooth',fxBus,at+.13,66);tone(188,.82,.16,'triangle',fxBus,at+.30,43);tone(84,.46,.10,'sine',fxBus,at+.67,31);}
    else if(kind==='fallImpact'){tone(110,.46,.28,'sawtooth',fxBus,at,38);tone(74,.51,.22,'triangle',fxBus,at+.04,32);tone(320,.17,.09,'triangle',fxBus,at+.03,82);}
    else if(kind==='boxPocket'){tone(580,.22,.18,'sine',fxBus,at,145);tone(185,.29,.16,'triangle',fxBus,at+.035,67);tone(415,.15,.07,'sine',fxBus,at+.09,230);}
    else if(kind==='boxBall'){tone(1460,.045,.15,'sine',fxBus,at,920);tone(780,.08,.12,'triangle',fxBus,at,460);}
    else if(kind==='boxWood'){tone(430,.09,.17,'triangle',fxBus,at,150);tone(245,.07,.10,'sine',fxBus,at+.012,115);}
    else if(kind==='boxRack'){tone(285,.115,.16,'triangle',fxBus,at,92);tone(470,.065,.09,'triangle',fxBus,at+.02,170);}
    else if(kind==='boxChalk'){tone(310,.065,.10,'sawtooth',fxBus,at,120);tone(180,.09,.09,'triangle',fxBus,at+.02,80);}
    else if(kind==='landing'){tone(125,.11,.18,'triangle',fxBus,at,55);tone(220,.055,.07,'sine',fxBus,at,100);}
    else if(kind==='rampDown'){tone(280,.15,.12,'triangle',fxBus,at,115);tone(185,.08,.08,'sine',fxBus,at+.10,84);}
    else if(kind==='jamSurface'){tone(210,.21,.12,'triangle',fxBus,at,85);tone(160,.14,.09,'sine',fxBus,at+.07,60);}
    else if(kind==='rindSurface'){[0,.035,.075].forEach((t,i)=>tone(440-i*75,.035,.09,'triangle',fxBus,at+t,150));}
    else if(kind==='ramp'){tone(365,.19,.24,'triangle',fxBus,at,740);}
    else if(kind==='finish'){[523.25,659.25,783.99,1046.5].forEach((f,i)=>tone(f,.30,.28,'triangle',fxBus,at+i*.14));}
    else if(kind==='count'){tone(550,.11,.22,'sine',fxBus,at,540);}
    else if(kind==='go'){tone(880,.24,.35,'triangle',fxBus,at,1050);}
    else if(kind==='select'){tone(520,.10,.19,'triangle',fxBus,at,780);}
    else if(kind==='start'){[392,523.25,659.25,783.99].forEach((f,i)=>tone(f,.28,.22,'triangle',fxBus,at+i*.105));}
    else tone(660,.12,.22,'triangle',fxBus,at,480);
  }
  function introEngines(){
    if(!ctx||ctx.state!=='running'||settings.muted)return false;
    stopMusic();lastSound='introEngines';const at=ctx.currentTime+.025;
    function rev(type,start,duration,f0,f1,f2,peak,cutoff){
      const o=ctx.createOscillator(),harm=ctx.createOscillator(),f=ctx.createBiquadFilter(),g=ctx.createGain();
      f.type='lowpass';f.frequency.setValueAtTime(cutoff*.73,start);f.frequency.exponentialRampToValueAtTime(cutoff,start+duration*.55);f.frequency.exponentialRampToValueAtTime(cutoff*.62,start+duration);
      o.type=type;harm.type='triangle';o.frequency.setValueAtTime(f0,start);o.frequency.exponentialRampToValueAtTime(f1,start+duration*.56);o.frequency.exponentialRampToValueAtTime(f2,start+duration);
      harm.frequency.setValueAtTime(f0*2.05,start);harm.frequency.exponentialRampToValueAtTime(f1*2,start+duration*.56);harm.frequency.exponentialRampToValueAtTime(f2*2,start+duration);
      g.gain.setValueAtTime(.0001,start);g.gain.linearRampToValueAtTime(peak*.62,start+.075);g.gain.linearRampToValueAtTime(peak,start+duration*.55);g.gain.exponentialRampToValueAtTime(.0001,start+duration);
      o.connect(f);harm.connect(f);f.connect(g);g.connect(engineBus);o.start(start);harm.start(start);o.stop(start+duration+.025);harm.stop(start+duration+.025);o.onended=()=>{o.disconnect();harm.disconnect();f.disconnect();g.disconnect();};
    }
    function starterNoise(start,duration,volume,filterHz){
      const buffer=ctx.createBuffer(1,Math.max(128,Math.ceil(ctx.sampleRate*duration)),ctx.sampleRate),samples=buffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*(.8+.2*Math.sin(i*.12));
      const src=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();src.buffer=buffer;f.type='bandpass';f.frequency.value=filterHz;f.Q.value=.65;
      g.gain.setValueAtTime(.0001,start);g.gain.linearRampToValueAtTime(volume,start+.011);g.gain.exponentialRampToValueAtTime(.0001,start+duration);src.connect(f);f.connect(g);g.connect(fxBus);src.start(start);src.stop(start+duration+.009);src.onended=()=>{src.disconnect();f.disconnect();g.disconnect();};
    }
    for(const [i,p] of [0,1,2].entries()){const t=at+i*.135;tone(88+i*9,.105,.17,'triangle',engineBus,t,66+i*6);starterNoise(t,.060,.11+i*.012,290+i*55);}
    starterNoise(at+.385,.11,.11,470);rev('triangle',at+.36,1.35,76,147,90,.16,740);rev('triangle',at+.74,1.15,131,258,153,.24,1540);tone(580,.06,.046,'triangle',fxBus,at+.40,290);return true;
  }
  function syncEngine(car,playing){
    if(!engine||!ctx)return;const at=ctx.currentTime;const profile=vehicleTones[car?.profile?.id]||vehicleTones.scatto;
    const raw=Math.min(1,Math.abs(car?.speed||0)/(car?.profile?.max||250));const dt=Math.max(.008,Math.min(.12,at-(engine.lastSync||at-.016)));engine.lastSync=at;
    const smooth=1-Math.exp(-dt/.18);engine.filteredRpm+=smooth*(raw-engine.filteredRpm);const rpm=Math.max(0,Math.min(1,engine.filteredRpm));
    if(vehicleId!==(car?.profile?.id||'scatto')){vehicleId=car?.profile?.id||'scatto';engine.osc.type=profile.type;engine.sub.type=profile.sub;engine.harm.type=profile.harm;engine.osc.detune.setTargetAtTime(profile.detune,at,.22);}
    const boost=car?.boost>0,inTunnel=car?.boxTransit>0,freq=inTunnel?88+18*Math.sin(at*2.1):profile.base+profile.range*Math.pow(rpm,.92)+(boost?22:0);
    engine.osc.frequency.setTargetAtTime(freq,at,.24);engine.sub.frequency.setTargetAtTime(freq*.5,at,.23);engine.harm.frequency.setTargetAtTime(freq*(profile.ratio||2),at,.24);engine.filter.frequency.setTargetAtTime(inTunnel?260:profile.filter+profile.cut*rpm,at,.17);
    const pulse=1+(profile.flutter||0)*Math.sin(at*Math.PI*2*(profile.flutterHz||7))*(.4+.6*rpm);engine.mainGain.gain.setTargetAtTime(profile.mix*pulse,at,.14);engine.subGain.gain.setTargetAtTime(profile.submix,at,.19);engine.harmGain.gain.setTargetAtTime(profile.harmmix,at,.18);
    const tunnel=inTunnel?.32:1;engine.mix.gain.setTargetAtTime(playing&&!settings.muted?(.26+rpm*.105+(boost?.018:0))*tunnel:0,at,.12);
  }
  const tunes={
    menu:{bpm:126,lead:['E5','G5','A5','G5','E5','D5','C5','D5','E5','G5','B5','A5','G5','E5','D5','C5'],bass:['C3','C3','G3','G3','A3','A3','G3','G3','F3','F3','G3','G3','C3','C3','G3','G3']},
    garage:{bpm:104,lead:['A4',null,'C5',null,'E5',null,'D5',null,'G4',null,'A4',null,'C5',null,'B4',null],bass:['D3','D3','A3','A3','G3','G3','A3','A3','C3','C3','G3','G3','A3','A3','D3','D3']},
    race:{bpm:142,lead:['C5',null,'D5','E5',null,'G5','E5',null,'A4',null,'C5','D5',null,'E5','G5',null],bass:['C3','C3','C3','G3','A3','A3','G3','G3','F3','F3','F3','G3','G3','G3','C3','C3']},
    podium:{bpm:104,lead:['C5',null,'E5',null,'G5',null,'E5',null,'F5',null,'E5',null,'D5',null,'C5',null],bass:['C3','C3','G3','G3','F3','F3','G3','G3','A3','A3','G3','G3','C3','C3','G3','G3']},
    victory:{bpm:132,lead:['C5','E5','G5','A5','G5','E5','G5','A5','C5','E5','G5','A5','G5','F5','E5','C5'],bass:['C3','C3','G3','G3','A3','A3','F3','F3','G3','G3','C3','C3','F3','F3','G3','G3']}
  };
  const garageVoicings=[['D4','F4','A4','C5'],['G3','B3','D4','F4'],['A3','C4','E4','G4'],['C4','E4','G4','B4']];
  const garageLead=['A4',null,'C5',null,'E5',null,'D5',null,'G4',null,'A4',null,'C5',null,'B4',null,
                    'F4',null,'A4',null,'C5',null,'D5',null,'A4',null,'G4',null,'E4',null,'G4',null,
                    'B4',null,'D5',null,'F5',null,'E5',null,'D5',null,'B4',null,'A4',null,'G4',null,
                    'C5',null,'E5',null,'G5',null,'A5',null,'G5',null,'E5',null,'D5','C5',null,'A4',null];
  const garageBass=[['D3','A3','C4','A3'],['G3','D3','F3','D3'],['A3','E3','G3','E3'],['C3','G3','B3','G3']];
  // Seven original 16-bar, instrumental arcade loops. MIDI notes, not samples.
  // Eight-bar A/B motifs, with a second pass using a distinct arrangement.
  const raceTunes={
    breakfast:{bpm:132,style:'swing',roots:[48,53,50,55,48,57,53,55],chords:[[0,4,7,9],[0,4,7,11],[0,3,7,10],[0,4,7,10],[0,4,7,9],[0,3,7,10],[0,4,7,11],[0,4,7,10]],lead:['76 - 79 81 - 79 74 -','77 81 - 84 81 - 79 -','77 - 81 84 - 81 76 -','74 77 79 - 83 - 81 79','84 - 79 76 - 74 76 -','72 76 - 81 79 - 76 -','77 - 79 81 84 - 81 -','83 81 79 - 77 74 72 -']},
    billiards:{bpm:122,style:'jazz',roots:[50,55,48,57,50,55,52,57],chords:[[0,3,7,10],[0,4,7,10],[0,4,7,11],[0,3,7,10],[0,3,7,10],[0,4,7,10],[0,3,6,10],[0,4,7,10]],lead:['69 - 72 77 - 76 - 72','71 74 - 77 76 - 74 -','67 - 72 76 - 79 - 76','69 72 - 76 79 - 76 72','65 - 69 72 - 76 74 -','71 - 77 74 - 71 69 -','67 70 - 74 76 - 74 -','73 - 76 79 - 76 73 -']},
    desk:{bpm:142,style:'break',roots:[45,48,53,55,45,48,50,52],chords:[[0,3,7,10],[0,4,7,11],[0,4,7,9],[0,4,7,10],[0,3,7,10],[0,4,7,11],[0,3,7,10],[0,4,7,10]],lead:['69 72 - 76 79 - 76 72','67 - 72 76 - 79 84 -','77 81 - 84 81 - 79 77','74 - 79 83 - 81 79 -','81 - 79 76 72 - 76 79','84 79 - 76 72 - 74 -','77 - 81 84 - 81 77 76','76 80 83 - 86 - 83 80']},
    bath:{bpm:128,style:'tropical',roots:[48,55,57,53,48,55,50,55],chords:[[0,4,7,9],[0,4,7,10],[0,3,7,10],[0,4,7,9],[0,4,7,9],[0,4,7,10],[0,3,7,10],[0,4,7,10]],lead:['84 - 79 - 76 79 - 81','83 - 79 74 - 76 79 -','81 84 - 88 - 84 81 -','77 - 81 84 81 - 79 -','76 79 - 84 - 81 79 -','74 79 - 83 81 - 79 -','77 - 81 84 - 81 76 -','79 - 83 86 84 - 79 -']},
    career:{bpm:138,style:'rock',roots:[45,41,48,43,45,41,50,52],chords:[[0,3,7],[0,4,7],[0,4,7],[0,4,7],[0,3,7],[0,4,7],[0,3,7],[0,4,7]],lead:['69 - 76 81 - 79 76 -','77 - 81 84 - 81 77 -','79 84 - 88 84 - 79 -','74 - 79 83 86 - 83 -','81 - 84 88 - 91 88 -','84 - 81 77 81 - 84 -','77 81 - 86 84 - 81 -','80 83 88 - 86 - 83 80']},
    trial:{bpm:150,style:'pulse',roots:[45,45,53,55,45,48,50,52],chords:[[0,3,7],[0,3,7],[0,4,7],[0,4,7],[0,3,7],[0,4,7],[0,3,7],[0,4,7]],lead:['69 - 76 - 72 - 76 -','81 - 76 - 79 - 76 -','77 - 84 - 81 - 84 -','79 - 86 - 83 - 86 -','81 - 88 - 84 - 88 -','84 - 79 - 76 - 79 -','74 - 81 - 77 - 81 -','76 - 83 - 80 - 83 -']},
    elimination:{bpm:160,style:'urgent',roots:[40,43,45,47,40,43,45,47],chords:[[0,3,7],[0,4,7],[0,3,7],[0,3,6],[0,3,7],[0,4,7],[0,3,7],[0,4,7]],lead:['76 79 83 - 81 79 76 -','79 83 - 86 83 - 79 74','81 84 88 - 84 81 79 -','83 - 86 89 - 86 83 -','88 83 79 - 76 79 83 -','86 83 79 - 83 86 91 -','88 84 81 - 84 88 93 -','83 87 90 - 87 83 80 -']}
  };
  for(const tune of Object.values(raceTunes))tune.notes=tune.lead.map(bar=>bar.split(' ').map(n=>n==='-'?null:Number(n)));
  let raceTheme='breakfast';
  function setRaceContext(track,kind){raceTheme=['career','trial','elimination'].includes(kind)?kind:({'colazione-turbo':'breakfast','box-di-biliardo':'billiards','desk-drift':'desk','bagno-sprint':'bath'}[track]||'breakfast');return raceTheme;}
  const midi=n=>440*Math.pow(2,(n-69)/12);
  function raceStep(tune,i,at,interval){
    const bar=Math.floor(i/8)%16,k=bar%8,step=i%8,second=bar>=8,style=tune.style,root=tune.roots[k],chord=tune.chords[k],note=tune.notes[k][step];
    const swing=style==='swing'||style==='jazz',when=at+(swing&&step%2?interval*.16:0);
    if(note!==null)tone(midi(note+(second&&step===6?12:0)),interval*(style==='pulse'?.48:.82),style==='urgent'?.125:.105,style==='tropical'?'sine':'triangle',musicBus,when);
    const bassSteps=style==='pulse'||style==='urgent'?[0,2,3,4,6,7]:style==='tropical'?[0,3,4,7]:[0,2,4,6];
    if(bassSteps.includes(step))tone(midi(root+(step===6?7:step===3||step===7?12:0)),interval*1.2,.125,'triangle',musicBus,when);
    const stabs=style==='tropical'?[1,3,5,7]:swing?[0,3,6]:style==='rock'?[0,4]:[2,6];
    if(stabs.includes(step)&&!(style==='pulse'&&!second))for(const n of chord.slice(0,3))tone(midi(root+12+n),interval*1.1,.032,'triangle',musicBus,when);
    const kick=style==='tropical'?[0,2,4,6]:style==='break'||style==='urgent'?[0,3,4,6]:[0,4];
    if(kick.includes(step))tone(style==='urgent'?96:78,.075,.095,'sine',musicBus,at,42);
    if(step===2||step===6)tone(style==='jazz'?650:920,.045,.032,'triangle',musicBus,when,360);
    if(step%2===1||second&&style==='urgent')tone(style==='tropical'?1300:1100,.024,.018,'triangle',musicBus,when,760);
  }
  function stopMusic(){sequenceToken++;if(seqTimer!==null){clearInterval(seqTimer);seqTimer=null;}mode='silent';}
  function music(next){if(!ctx||ctx.state!=='running'||settings.muted)return;if(next==='race')next=raceTheme;if(mode===next&&seqTimer!==null)return;stopMusic();const tune=tunes[next]||raceTunes[next];if(!tune)return;
    mode=next;seqIndex=0;const token=sequenceToken,interval=60/tune.bpm/2;
    const playStep=()=>{if(token!==sequenceToken||ctx.state!=='running'||settings.muted)return;
      const i=seqIndex++,at=ctx.currentTime+.015;
      if(raceTunes[next]){raceStep(tune,i,at,interval);return;}
      const lead=tune.lead[i%16],bass=tune.bass[i%16];
      if(next==='garage'){
        const bar=Math.floor((i%64)/16),step=i%16;
        if(step===0||step===6||step===10||step===14){for(const note of garageVoicings[bar]){const f=frequencies[note];if(f)tone(f,interval*3.4,.040,'triangle',musicBus,at);}}
        if(step%4===0||step===6||step===10||step===14){const f=frequencies[garageBass[bar][Math.floor(step/4)]||garageBass[bar][0]];if(f)tone(f,interval*2.7,.13,'triangle',musicBus,at);}
        const n=garageLead[i%64];if(n&&frequencies[n])tone(frequencies[n],interval*1.25,.10,'triangle',musicBus,at+.027);
        if(step%4===0)tone(71,.09,.062,'sine',musicBus,at);
        if(step===4||step===12)tone(810,.05,.016,'triangle',musicBus,at+.02);
        if(step%8===6)tone(540,.06,.014,'triangle',musicBus,at);
        return;
      }
      if(lead&&Number.isFinite(frequencies[lead]))tone(frequencies[lead],interval*.83,next==='podium'?.13:next==='victory'?.19:.17,'triangle',musicBus,at);
      if(i%2===0&&Number.isFinite(frequencies[bass]))tone(frequencies[bass],interval*1.65,.17,'sine',musicBus,at);
      if(i%4===0)tone(75,.085,.13,'triangle',musicBus,at,45);
      if(i%2===1)tone(950,.036,.045,'triangle',musicBus,at,680);
    };
    playStep();seqTimer=setInterval(playStep,interval*1000);
  }
  function suspend(){stopMusic();if(engine&&ctx)engine.mix.gain.setTargetAtTime(0,ctx.currentTime,.03);}
  function signalLevel(){if(!analyser)return 0;const values=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(values);let sum=0;for(const v of values)sum+=v*v;return Math.sqrt(sum/values.length);}
  function status(){return {signalRms:Math.round(signalLevel()*10000)/10000,supported:!!AC,context:ctx?.state||'not-created',unlocked,muted:settings.muted,mode,vehicle:vehicleId,lastSound,error:lastError,settings:{...settings}};}
  root.TTRSound={unlock,initialize,music,stopMusic,suspend,sfx,introEngines,syncEngine,setMuted,setVolume,status,setRaceContext,getSettings:()=>({...settings})};
})(window);
