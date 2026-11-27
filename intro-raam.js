/* Intro: a fogged car windscreen. Wipe it clear with mouse or finger;
   the sun comes up, the szinn logo beats softly, and the site opens. */
(function(){
  const el=document.getElementById('intro'); const html=document.documentElement;
  if(!el) return;
  if(html.classList.contains('intro-seen')){ el.remove(); return; }
  scrollTo(0,0);

  const cB=el.querySelector('.raam-buiten'), cD=el.querySelector('.raam-damp'), cA=el.querySelector('.raam-auto');
  const bx=cB.getContext('2d'), dx=cD.getContext('2d'), ax=cA.getContext('2d');
  const midden=el.querySelector('.raam-midden'), hint=el.querySelector('.raam-hint');
  const logo=el.querySelector('.raam-logo'), knop=el.querySelector('.raam-enter');
  const ZON={x:.628,y:.517};           // where the sun sits in the photo (0..1)
  const foto=new Image(); foto.src=el.dataset.foto;

  let W,H,DPR,glas,klaar=false,done=false,zon=0,beeld={s:1,x:0,y:0};
  const GRID=26; let geldig,vakjes,totaal=0,schoon=0;

  /* ---------- windscreen shape ---------- */
  function maakGlas(){
    const staand=H>W;
    const T=H*(staand?.11:.08), B=H*(staand?.74:.72);
    const tl=W*(staand?.12:.17), tr=W-tl, bl=W*(staand?-.02:.02), br=W-bl;
    const p=new Path2D(), rT=Math.min(W,H)*.05, rB=Math.min(W,H)*.03;
    p.moveTo(tl+rT,T+H*.012);
    p.quadraticCurveTo(W/2,T-H*.02,tr-rT,T+H*.012);
    p.quadraticCurveTo(tr,T+H*.015,tr+(br-tr)*.06,T+rT);
    p.lineTo(br-rB*.4,B-rB);
    p.quadraticCurveTo(br,B,br-rB*2,B+2);
    p.quadraticCurveTo(W/2,B-H*.035,bl+rB*2,B+2);
    p.quadraticCurveTo(bl,B,bl+rB*.4,B-rB);
    p.lineTo(tl-(tl-bl)*.06,T+rT);
    p.quadraticCurveTo(tl,T+H*.015,tl+rT,T+H*.012);
    p.closePath();
    glas={p,T,B,tl,tr,bl,br,staand};
  }

  /* ---------- the view: her photo, with a sun that brightens ---------- */
  function tekenUitzicht(c,op){
    c.fillStyle='#9fb8cc'; c.fillRect(0,0,W,H);
    if(foto.complete&&foto.naturalWidth){
      // fill the glass area, sun kept near the middle of the view
      const vh=glas.B-glas.T+H*.06, s=Math.max(W/foto.naturalWidth,vh/foto.naturalHeight)*1.02;
      const fw=foto.naturalWidth*s, fh=foto.naturalHeight*s;
      let x=W/2-fw*ZON.x+fw*.08; x=Math.min(0,Math.max(W-fw,x));
      const y=glas.T-H*.02;
      beeld={s,x,y,fw,fh}; c.drawImage(foto,x,y,fw,fh);
      if(fh+y<H){ c.save(); c.translate(0,(y+fh)*2); c.scale(1,-1); c.drawImage(foto,x,y,fw,fh); c.restore(); }
    }
    if(op>0){
      const zx=beeld.x+beeld.fw*ZON.x, zy=beeld.y+beeld.fh*ZON.y-op*H*.05, r=Math.max(W,H)*(.25+.35*op);
      const g=c.createRadialGradient(zx,zy,0,zx,zy,r);
      g.addColorStop(0,`rgba(255,246,222,${.85*op})`); g.addColorStop(.18,`rgba(255,226,170,${.45*op})`); g.addColorStop(1,'rgba(255,214,150,0)');
      c.save(); c.globalCompositeOperation='screen'; c.fillStyle=g; c.fillRect(0,0,W,H); c.restore();
    }
  }

  /* ---------- the car around the glass ---------- */
  function tekenAuto(){
    const c=ax; c.setTransform(DPR,0,0,DPR,0,0); c.clearRect(0,0,W,H);
    const rond=new Path2D(); rond.rect(0,0,W,H); rond.addPath(glas.p);
    // headliner and pillars
    let g=c.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#2a2f31'); g.addColorStop(glas.T/H,'#1a1f21'); g.addColorStop(glas.B/H,'#121618'); g.addColorStop(1,'#07090a');
    c.fillStyle=g; c.fill(rond,'evenodd');
    // fabric grain on the headliner
    c.save(); c.clip(rond,'evenodd');
    for(let i=0;i<W*glas.T/40;i++){c.fillStyle=`rgba(255,255,255,${Math.random()*.03})`;c.fillRect(Math.random()*W,Math.random()*glas.T,1.2,1.2);}
    // A-pillars: rounded, catching some light
    [[glas.tl,glas.bl,-1],[glas.tr,glas.br,1]].forEach(([t,b,k])=>{
      const w=Math.min(W,H)*.09;
      g=c.createLinearGradient(b,0,b+k*w,0);
      g.addColorStop(0,'#15191a'); g.addColorStop(.4,'#23292b'); g.addColorStop(1,'#0b0e0f');
      c.fillStyle=g; c.beginPath(); c.moveTo(t,glas.T); c.lineTo(t+k*w*.7,glas.T-H*.02); c.lineTo(b+k*w*1.3,glas.B+H*.05); c.lineTo(b,glas.B); c.closePath(); c.fill();
    });
    // dashboard
    const dt=glas.B-H*.005;
    g=c.createLinearGradient(0,dt,0,H);
    g.addColorStop(0,'#3a3f40'); g.addColorStop(.04,'#202526'); g.addColorStop(.4,'#141819'); g.addColorStop(1,'#060708');
    c.fillStyle=g; c.beginPath(); c.moveTo(-10,dt+H*.03);
    c.quadraticCurveTo(W/2,dt-H*.03,W+10,dt+H*.03); c.lineTo(W+10,H+10); c.lineTo(-10,H+10); c.closePath(); c.fill();
    // stitched edge and defrost vent
    c.strokeStyle='rgba(200,173,122,.22)'; c.setLineDash([5,6]); c.lineWidth=1.2;
    c.beginPath(); c.moveTo(0,dt+H*.05); c.quadraticCurveTo(W/2,dt-H*.01,W,dt+H*.05); c.stroke(); c.setLineDash([]);
    c.fillStyle='rgba(0,0,0,.55)';
    for(let i=0;i<14;i++){const x=W*.3+i*W*.4/14; c.fillRect(x,dt+H*.018-Math.sin(i/13*Math.PI)*H*.004,W*.4/14*.7,3);}
    c.restore();
    // black ceramic band along the glass edge (the dotted frit of a real windscreen)
    c.save(); c.clip(glas.p);
    c.lineJoin='round'; c.strokeStyle='#050607'; c.lineWidth=24; c.stroke(glas.p);
    c.save(); c.filter='blur(6px)'; c.strokeStyle='rgba(5,6,7,.55)'; c.lineWidth=40; c.stroke(glas.p); c.restore();
    // dashboard reflecting in the bottom of the glass
    g=c.createLinearGradient(0,glas.B-H*.12,0,glas.B);
    g.addColorStop(0,'rgba(30,34,36,0)'); g.addColorStop(1,'rgba(30,34,36,.45)');
    c.fillStyle=g; c.fillRect(0,glas.B-H*.12,W,H*.12);
    // soft sky reflection streak
    g=c.createLinearGradient(0,glas.T,W,glas.B);
    g.addColorStop(0,'rgba(255,255,255,.07)'); g.addColorStop(.3,'rgba(255,255,255,0)'); g.addColorStop(.62,'rgba(255,255,255,0)'); g.addColorStop(.7,'rgba(255,255,255,.05)'); g.addColorStop(.8,'rgba(255,255,255,0)');
    c.fillStyle=g; c.fillRect(0,0,W,H);
    // wipers resting at the bottom
    c.lineCap='round';
    [[.12,.47,-.05],[.53,.9,-.07]].forEach(([a,b,t])=>{
      const y0=glas.B-H*.018, x0=W*a, x1=W*b, y1=y0+(x1-x0)*t;
      c.strokeStyle='#0b0d0e'; c.lineWidth=Math.max(5,H*.008); c.beginPath(); c.moveTo(x0,y0); c.lineTo(x1,y1); c.stroke();
      c.strokeStyle='rgba(255,255,255,.12)'; c.lineWidth=1; c.beginPath(); c.moveTo(x0,y0-2); c.lineTo(x1,y1-2); c.stroke();
    });
    c.restore();
    // rear-view mirror
    const mw=Math.min(W*.2,260), mh=mw*.28, mx=W/2-mw/2+W*.04, my=glas.T+H*.035;
    c.fillStyle='#161a1b'; c.fillRect(W/2+W*.04-5,glas.T-H*.03,10,H*.05);
    c.save(); c.shadowColor='rgba(0,0,0,.6)'; c.shadowBlur=18; c.shadowOffsetY=6;
    c.fillStyle='#151819'; c.beginPath(); c.roundRect(mx,my,mw,mh,mh*.45); c.fill(); c.restore();
    g=c.createLinearGradient(0,my,0,my+mh);
    g.addColorStop(0,'#5b6466'); g.addColorStop(.5,'#2f3739'); g.addColorStop(1,'#1d2325');
    c.fillStyle=g; c.beginPath(); c.roundRect(mx+5,my+5,mw-10,mh-10,mh*.36); c.fill();
    c.fillStyle='rgba(255,255,255,.12)'; c.beginPath(); c.roundRect(mx+10,my+7,mw*.5,3,2); c.fill();
    // cabin vignette
    g=c.createRadialGradient(W/2,H*.42,Math.min(W,H)*.35,W/2,H*.42,Math.max(W,H)*.85);
    g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,.5)');
    c.fillStyle=g; c.fillRect(0,0,W,H);
  }

  /* a droplet is a tiny lens: the view shows in it, small and upside down */
  function lensDruppel(c,x,y,r){
    c.save(); c.beginPath(); c.ellipse(x,y,r,r*1.08,0,0,7); c.clip();
    const z=r*5; c.translate(x,y); c.scale(1,-1);
    c.drawImage(cB,(x-z)*DPR,(y-z)*DPR,z*2*DPR,z*2*DPR,-r,-r*1.08,r*2,r*2.16);
    c.restore();
    let g=c.createRadialGradient(x,y,r*.55,x,y,r*1.1);
    g.addColorStop(0,'rgba(20,30,34,0)'); g.addColorStop(1,'rgba(20,30,34,.5)');
    c.fillStyle=g; c.beginPath(); c.ellipse(x,y,r,r*1.08,0,0,7); c.fill();
    c.fillStyle='rgba(255,255,255,.85)'; c.beginPath(); c.ellipse(x-r*.35,y-r*.4,r*.22,r*.15,-.6,0,7); c.fill();
  }

  /* ---------- thick, uneven fog ---------- */
  let dampBron, dampPatroon;
  function maakDamp(){
    dampBron=document.createElement('canvas'); dampBron.width=cD.width; dampBron.height=cD.height;
    const c=dampBron.getContext('2d'); c.scale(DPR,DPR);
    c.filter='blur(38px)'; tekenUitzicht(c,0); c.filter='none';
    c.fillStyle='rgba(214,222,226,.76)'; c.fillRect(0,0,W,H);
    for(let i=0;i<26;i++){const x=Math.random()*W,y=Math.random()*H,r=Math.min(W,H)*(.15+Math.random()*.35);
      const g=c.createRadialGradient(x,y,0,x,y,r),a=Math.random()*.18,k=Math.random()<.5?'240,244,246':'168,180,188';
      g.addColorStop(0,`rgba(${k},${a})`);g.addColorStop(1,`rgba(${k},0)`);c.fillStyle=g;c.fillRect(0,0,W,H);}
    let g=c.createLinearGradient(0,0,0,H); g.addColorStop(0,'rgba(255,255,255,.04)'); g.addColorStop(.6,'rgba(225,232,236,.12)'); g.addColorStop(1,'rgba(240,244,246,.38)');
    c.fillStyle=g; c.fillRect(0,0,W,H);
    for(let i=0;i<W*H/28;i++){const x=Math.random()*W,y=Math.random()*H,r=Math.random()*1.1+.25;
      c.fillStyle=Math.random()<.5?`rgba(255,255,255,${Math.random()*.35})`:`rgba(110,125,135,${Math.random()*.12})`;
      c.beginPath();c.arc(x,y,r,0,7);c.fill();}
    for(let i=0;i<W*H/2600;i++){const groot=Math.random()<.12;
      lensDruppel(c,Math.random()*W,Math.random()*H,groot?3.5+Math.random()*4:1.2+Math.random()*2.4);}
    for(let i=0;i<Math.max(4,W/170);i++){
      let x=Math.random()*W,y=glas.T+Math.random()*H*.4; const l=H*(.08+Math.random()*.25), r=1.6+Math.random()*1.5;
      c.save(); c.globalCompositeOperation='destination-out'; c.fillStyle='rgba(0,0,0,.55)';
      for(let t=0;t<l;t+=1.5){x+=Math.sin(t/19+i)*.22;c.beginPath();c.arc(x,y+t,r*(1-t/l*.5),0,7);c.fill();}
      c.restore(); lensDruppel(c,x,y+l,r*1.7);
    }
    dampPatroon=dx.createPattern(dampBron,'no-repeat');
    if(dampPatroon&&dampPatroon.setTransform&&window.DOMMatrix) dampPatroon.setTransform(new DOMMatrix().scale(1/DPR));
    dx.setTransform(1,0,0,1,0,0); dx.clearRect(0,0,cD.width,cD.height); dx.drawImage(dampBron,0,0); dx.setTransform(DPR,0,0,DPR,0,0);
  }

  function opbouw(){
    DPR=Math.min(window.devicePixelRatio||1,2); W=innerWidth; H=innerHeight;
    [cB,cD,cA].forEach(c=>{c.width=Math.round(W*DPR);c.height=Math.round(H*DPR);});
    maakGlas();
    bx.setTransform(DPR,0,0,DPR,0,0); tekenUitzicht(bx,zon);
    maakDamp(); tekenAuto();
    midden.style.top=(glas.T+(glas.B-glas.T)*.52)+'px';
    hint.style.top=(glas.B-H*.11)+'px';
    geldig=new Uint8Array(GRID*GRID); vakjes=new Uint8Array(GRID*GRID); totaal=0; schoon=0;
    for(let gx=0;gx<GRID;gx++)for(let gy=0;gy<GRID;gy++)
      if(ax.isPointInPath(glas.p,(gx+.5)*W/GRID*DPR,(gy+.5)*H/GRID*DPR)){geldig[gy*GRID+gx]=1;totaal++;}
  }

  /* ---------- wiping ---------- */
  let vorige=null; const druppels=[];
  const kwast=()=>Math.max(34,Math.min(W,H)*.068);
  function veeg(x,y){
    const r=kwast(); dx.globalCompositeOperation='destination-out';
    const st=vorige?Math.ceil(Math.hypot(x-vorige.x,y-vorige.y)/(r*.25)):1;
    for(let i=1;i<=st;i++){
      const px=vorige?vorige.x+(x-vorige.x)*i/st:x, py=vorige?vorige.y+(y-vorige.y)*i/st:y;
      const g=dx.createRadialGradient(px,py,r*.35,px,py,r);
      g.addColorStop(0,'rgba(0,0,0,.93)'); g.addColorStop(1,'rgba(0,0,0,0)');
      dx.fillStyle=g; dx.beginPath(); dx.arc(px,py,r,0,7); dx.fill(); markeer(px,py,r);
    }
    dx.globalCompositeOperation='source-over';
    if(vorige&&dampPatroon){
      const vx=x-vorige.x, vy=y-vorige.y, len=Math.hypot(vx,vy);
      if(len>2){
        const nx=-vy/len, ny=vx/len; dx.strokeStyle=dampPatroon; dx.lineCap='round';
        for(let k=-3;k<=3;k++){
          const o=k*r*.22+Math.sin(k*7.3)*r*.05;
          dx.globalAlpha=.1+((k*k*13)%7)/100; dx.lineWidth=1+((k+3)%3)*.8;
          dx.beginPath(); dx.moveTo(vorige.x+nx*o,vorige.y+ny*o); dx.lineTo(x+nx*o,y+ny*o); dx.stroke();
        }
        dx.globalAlpha=1;
        if(Math.random()<.5){const o=(Math.random()<.5?1:-1)*r*(.75+Math.random()*.2); lensDruppel(dx,x+nx*o,y+ny*o,1+Math.random()*2.6);}
      }
    }
    if(Math.random()<.07) druppels.push({x:x+(Math.random()-.5)*r*1.6,y:y+r*.8,v:.6+Math.random()*1.2,r:1.5+Math.random()*2.2,l:H*(.1+Math.random()*.25)});
    vorige={x,y};
  }
  function markeer(x,y,r){
    const cw=W/GRID,ch=H/GRID;
    for(let gx=Math.max(0,Math.floor((x-r*.6)/cw));gx<=Math.min(GRID-1,Math.floor((x+r*.6)/cw));gx++)
      for(let gy=Math.max(0,Math.floor((y-r*.6)/ch));gy<=Math.min(GRID-1,Math.floor((y+r*.6)/ch));gy++){
        const k=gy*GRID+gx; if(geldig[k]&&!vakjes[k]){vakjes[k]=1;schoon++;}
      }
    if(!klaar&&totaal&&schoon/totaal>.5) helder();
  }

  /* ---------- running drops, and the glass slowly fogging up again ---------- */
  let tijd=0;
  function loop(){
    if(done) return; tijd++;
    dx.globalCompositeOperation='destination-out';
    for(let i=druppels.length-1;i>=0;i--){const d=druppels[i];
      d.y+=d.v; d.x+=Math.sin((d.y+i*37)/23)*.25; d.l-=d.v;
      dx.fillStyle='rgba(0,0,0,.5)'; dx.beginPath(); dx.arc(d.x,d.y,d.r,0,7); dx.fill();
      if(d.l<=0||d.y>H){ dx.globalCompositeOperation='source-over'; lensDruppel(dx,d.x,d.y+d.r*.6,d.r*1.6); dx.globalCompositeOperation='destination-out'; druppels.splice(i,1); }
    }
    dx.globalCompositeOperation='source-over';
    if(!klaar&&dampBron&&tijd%4===0){dx.globalAlpha=.004;dx.setTransform(1,0,0,1,0,0);dx.drawImage(dampBron,0,0);dx.setTransform(DPR,0,0,DPR,0,0);dx.globalAlpha=1;}
    requestAnimationFrame(loop);
  }

  /* ---------- clear: fog lifts, sun rises, tagline, then the site ---------- */
  function helder(){
    if(klaar) return; klaar=true;
    el.classList.add('bezig','helder');
    const t0=performance.now();
    (function stap(t){ if(done) return; zon=Math.min(1,(t-t0)/3000); const e=1-Math.pow(1-zon,3);
      bx.setTransform(DPR,0,0,DPR,0,0); tekenUitzicht(bx,e); if(zon<1) requestAnimationFrame(stap); })(t0);
    setTimeout(enter,4600);
  }
  function enter(){
    if(done) return; done=true;
    try{sessionStorage.setItem('ek-intro','1')}catch(e){}
    el.classList.add('leaving'); html.classList.remove('intro-open');
    if(window.lenis) window.lenis.start();
    setTimeout(()=>{el.remove();html.classList.add('intro-seen')},1500);
  }

  const punt=e=>{const t=e.touches?e.touches[0]:e;return{x:t.clientX,y:t.clientY};};
  let drukt=false;
  function start(e){ if(klaar||e.target.closest('.raam-enter,.raam-logo')) return; drukt=true; vorige=null; el.classList.add('bezig'); const p=punt(e); veeg(p.x,p.y); if(e.cancelable) e.preventDefault(); }
  function beweeg(e){ if(klaar) return; if(!drukt&&e.type!=='mousemove') return; const p=punt(e); veeg(p.x,p.y); if(e.cancelable) e.preventDefault(); }
  function stop(){ drukt=false; vorige=null; }
  el.addEventListener('mousedown',start); el.addEventListener('mousemove',beweeg);
  el.addEventListener('mouseleave',stop); addEventListener('mouseup',stop);
  el.addEventListener('touchstart',start,{passive:false}); el.addEventListener('touchmove',beweeg,{passive:false});
  el.addEventListener('touchend',stop);
  logo.addEventListener('click',helder);
  knop.addEventListener('click',enter);
  addEventListener('keydown',e=>{if(!done&&(e.key==='Enter'||e.key==='Escape')){e.preventDefault();enter()}});
  let rt; addEventListener('resize',()=>{clearTimeout(rt);rt=setTimeout(()=>{if(!klaar&&!done)opbouw();},200);});

  setTimeout(()=>{try{knop.focus({preventScroll:true})}catch(e){}},1300);
  let gestart=false, zonderFoto=false;
  const go=()=>{ if(gestart) return; gestart=true; zonderFoto=!(foto.complete&&foto.naturalWidth); opbouw(); loop(); };
  if(foto.complete&&foto.naturalWidth) go();
  else { foto.onerror=go; setTimeout(go,2500);
    // if the photo arrives after the fallback start, redraw once with it
    foto.onload=()=>{ if(!gestart) go(); else if(zonderFoto&&!klaar&&!done) opbouw(); }; }
})();
