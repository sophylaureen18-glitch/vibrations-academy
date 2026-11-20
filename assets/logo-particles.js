/* Startseite: Vibrations-Logo aus Lichtblitz-Partikeln (nur Laptop / Großbildschirm). */
(function(){
  var MQ = matchMedia('(min-width:1301px) and (pointer:fine)');
  if (!MQ.matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var stage = document.querySelector('.va-stage'); if (!stage) return;
  var cv = document.createElement('canvas'); cv.className = 'va-logo-fx'; cv.setAttribute('aria-hidden','true');
  stage.appendChild(cv);
  var bf = document.createElement('canvas'), bg = bf.getContext('2d'), g = cv.getContext('2d'), DPR = Math.min(devicePixelRatio || 1, 1.5);
  var ELEC = [[255,176,0],[255,120,20],[255,60,30],[255,215,90]];
  var P = [], bolts = [], S = 0, t0 = 0, mouse = {x:-1e4,y:-1e4}, vis = true, img = new Image();

  function place(){
    var box = document.querySelector('.va-safety'), head = document.querySelector('.va-head');
    var sr = stage.getBoundingClientRect(), br = box ? box.getBoundingClientRect() : null, hr = head ? head.getBoundingClientRect() : {bottom:90};
    var top = hr.bottom - sr.top + 20, bottom = br ? br.top - sr.top - 24 : sr.height * .6;
    var size = Math.max(0, Math.min(bottom - top, sr.width * .26, 420));
    var cx = br ? (br.left + br.width/2 - sr.left) : sr.width * .7;
    if (size < 140){ cv.style.display = 'none'; return false; }
    cv.style.display = 'block';
    cv.style.left = (cx - size/2) + 'px'; cv.style.top = (top + (bottom - top - size)/2) + 'px';
    cv.style.width = cv.style.height = size + 'px';
    cv.width = cv.height = bf.width = bf.height = Math.round(size * DPR); g.setTransform(1,0,0,1,0,0); bg.setTransform(DPR,0,0,DPR,0,0);
    if (size !== S){ S = size; build(); }
    return true;
  }
  function build(){
    var n = Math.round(S), o = document.createElement('canvas'); o.width = o.height = n;
    var c = o.getContext('2d'), h = n * img.height / img.width; c.drawImage(img, 0, (n - h)/2, n, h);
    var d = c.getImageData(0,0,n,n).data, step = 2; P = [];
    for (var y = 0; y < n; y += step) for (var x = 0; x < n; x += step){
      var i = (y*n + x)*4; if (d[i+3] < 110) continue;
      var lum = d[i]*.3 + d[i+1]*.59 + d[i+2]*.11; if (lum > 245) continue;
      var br = .9 + Math.random()*.35, col = [Math.min(255,Math.round(d[i]*br+20)), Math.min(255,Math.round(d[i+1]*br+10)), Math.min(255,Math.round(d[i+2]*br))];
      if (Math.random() < .06) col = [255,240,200];
      var a = Math.random()*Math.PI*2, r = S*(.6+Math.random()*.8);
      P.push({hx:x, hy:y, x:S/2+Math.cos(a)*r, y:S/2+Math.sin(a)*r, c:col, ph:Math.random()*6.28, f:1.5+Math.random()*3, s:.9+Math.random()*.7});
    }
    t0 = performance.now();
  }
  function bolt(){
    if (P.length < 2) return;
    var a = P[Math.floor(Math.random()*P.length)], b = null;
    for (var k = 0; k < 25; k++){ var q = P[Math.floor(Math.random()*P.length)], dx = q.x-a.x, dy = q.y-a.y, dd = dx*dx+dy*dy; if (dd > 300 && dd < S*S*.06){ b = q; break; } }
    if (!b) return;
    var pts = [[a.x,a.y]], seg = 6;
    for (var j = 1; j < seg; j++){ var u = j/seg, nx = -(b.y-a.y), ny = b.x-a.x, l = Math.hypot(nx,ny)||1, off = (Math.random()-.5)*S*.05;
      pts.push([a.x+(b.x-a.x)*u + nx/l*off, a.y+(b.y-a.y)*u + ny/l*off]); }
    pts.push([b.x,b.y]);
    bolts.push({p:pts, c:ELEC[Math.floor(Math.random()*ELEC.length)], born:performance.now(), life:140+Math.random()*120});
  }
  var last = 0, nextBolt = 0;
  function frame(now){
    requestAnimationFrame(frame);
    if (!vis || cv.style.display === 'none' || now - last < 25) return; last = now;
    bg.clearRect(0,0,S,S); bg.globalCompositeOperation = 'lighter'; var G = bg;
    var k = Math.min(1, (now - t0)/1800), e = 1 - Math.pow(1-k, 3), t = now/1000;
    for (var i = 0; i < P.length; i++){
      var p = P[i], tx = p.hx + Math.sin(t*p.f+p.ph)*.6, ty = p.hy + Math.cos(t*p.f*.8+p.ph)*.6;
      var mx = tx - mouse.x, my = ty - mouse.y, md = mx*mx+my*my;
      if (md < 2500){ var m = (2500-md)/2500*14/Math.sqrt(md+1); tx += mx*m; ty += my*m; }
      p.x += (tx - p.x) * (k < 1 ? .06 + e*.1 : .18); p.y += (ty - p.y) * (k < 1 ? .06 + e*.1 : .18);
      var al = .75 + .25*Math.pow(.5+.5*Math.sin(t*p.f*2+p.ph), 3);
      G.fillStyle = 'rgba('+p.c[0]+','+p.c[1]+','+p.c[2]+','+al.toFixed(3)+')'; G.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s);
    }
    if (k >= 1 && now > nextBolt){ bolt(); if (Math.random() < .35) bolt(); nextBolt = now + 60 + Math.random()*140; }
    G.lineJoin = 'round';
    bolts = bolts.filter(function(b){
      var a = 1 - (now - b.born)/b.life; if (a <= 0) return false; a *= (Math.random() < .2 ? .4 : 1);
      [[5,.12],[2.2,.35],[1,.95]].forEach(function(w, wi){
        G.strokeStyle = wi === 2 ? 'rgba(255,255,255,'+(a*.9)+')' : 'rgba('+b.c[0]+','+b.c[1]+','+b.c[2]+','+(a*w[1])+')';
        G.lineWidth = w[0]*.6; G.beginPath(); G.moveTo(b.p[0][0], b.p[0][1]); for (var j = 1; j < b.p.length; j++) G.lineTo(b.p[j][0], b.p[j][1]); G.stroke();
      });
      return true;
    });
    bg.globalCompositeOperation = 'source-over';
    g.clearRect(0,0,cv.width,cv.height); g.globalCompositeOperation = 'lighter';
    g.filter = 'blur('+(4*DPR)+'px)'; g.globalAlpha = 1; g.drawImage(bf,0,0); g.filter = 'blur('+(1.5*DPR)+'px)'; g.drawImage(bf,0,0);
    g.filter = 'none'; g.globalAlpha = 1; g.drawImage(bf,0,0); g.globalCompositeOperation = 'source-over';
  }
  addEventListener('pointermove', function(ev){ var r = cv.getBoundingClientRect(); mouse.x = ev.clientX - r.left; mouse.y = ev.clientY - r.top; });
  if (window.IntersectionObserver) new IntersectionObserver(function(en){ vis = en[0].isIntersecting; }).observe(stage);
  img.onload = function(){ var go = function(){ place(); }; (document.fonts ? document.fonts.ready : Promise.resolve()).then(go); setTimeout(go, 600); addEventListener('resize', go); requestAnimationFrame(frame); };
  img.src = 'assets/logo.png';
})();
