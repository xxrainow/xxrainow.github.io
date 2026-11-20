(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const about = $('about');
  $('about-open').addEventListener('click', () => about.showModal());
  $('about-close').addEventListener('click', () => about.close());
  about.addEventListener('click', (e) => {
    if (e.target === about) {
      const r = about.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        about.close();
    }
  });

  const canvas = $('art');
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    preserveDrawingBuffer: false,
    powerPreference: 'low-power',
  });
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches,
    grain = true,
    raf = 0,
    last = 0,
    time = 0,
    seed = Math.random() * 70,
    targetSeed = seed;
  const say = (text) => {
    $('status').textContent = text;
  };
  function updateMotion() {
    $('motion').setAttribute('aria-pressed', String(paused));
    $('motion').setAttribute(
      'aria-label',
      paused ? '움직임 재생' : '움직임 일시 정지',
    );
    $('motion').querySelector('span').textContent = paused
      ? 'Play'
      : 'Pause';
    $('motion-icon').setAttribute(
      'd',
      paused ? 'M5 3l8 5-8 5Z' : 'M5 3v10M11 3v10',
    );
  }
  updateMotion();
  if (!gl) {
    $('motion').disabled = $('grain').disabled = true;
    $('remix').addEventListener('click', () => {
      document.querySelector('.field').style.filter =
        `hue-rotate(${Math.random() * 360}deg)`;
      say('새로운 색으로 바뀌었어요.');
    });
    return;
  }
  const vertex = `attribute vec2 aPosition; varying vec2 vUv; void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
  const precision =
    gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT)
      .precision > 0
      ? 'highp'
      : 'mediump';
  const flowSource = `precision ${precision} float;
varying vec2 vUv;
uniform sampler2D uFlow;
uniform vec2 uPointer,uVelocity;
uniform float uAspect,uActive,uDown,uDt;
void main(){
  vec4 old=texture2D(uFlow,vUv);
  vec2 velocity=(old.rg-.5)*2.;
  vec2 back=vUv-velocity*.008*uDt;
  vec4 transported=texture2D(uFlow,clamp(back,.002,.998));
  vec2 field=(transported.rg-.5)*2.*pow(.964,uDt);
  float dye=transported.b*pow(.978,uDt);
  vec2 d=vUv-uPointer; d.x*=uAspect;
  float stamp=exp(-dot(d,d)/(uDown>.5?.014:.006))*uActive;
  vec2 swirl=vec2(-d.y,d.x)*uDown*.55;
  field+=stamp*(uVelocity*.56+swirl)*uDt;
  dye=clamp(dye+stamp*(.12+uDown*.055)*uDt,0.,1.);
  gl_FragColor=vec4(clamp(field*.5+.5,0.,1.),dye,1.);
}`;
  const artSource = `precision ${precision} float;
varying vec2 vUv;
uniform sampler2D uFlow;
uniform vec2 uResolution;
uniform float uTime,uSeed,uGrain;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float n=0.,a=.5;mat2 m=mat2(.8,-.6,.6,.8);for(int i=0;i<4;i++){n+=a*noise(p);p=m*p*2.03+17.1;a*=.5;}return n;}
vec3 pigment(float n){
  vec3 pink=vec3(1.,.22,.61),yellow=vec3(1.,.84,.09),mint=vec3(.26,.91,.73),blue=vec3(.20,.66,.94),lilac=vec3(.76,.57,.95);
  n=fract(n)*5.;
  if(n<1.)return mix(pink,yellow,smoothstep(.08,.94,n));
  if(n<2.)return mix(yellow,mint,smoothstep(.08,.94,n-1.));
  if(n<3.)return mix(mint,blue,smoothstep(.08,.94,n-2.));
  if(n<4.)return mix(blue,lilac,smoothstep(.08,.94,n-3.));
  return mix(lilac,pink,smoothstep(.08,.94,n-4.));
}
void main(){
  float aspect=uResolution.x/uResolution.y;
  vec4 flow=texture2D(uFlow,vUv);
  vec2 velocity=(flow.rg-.5)*2.;
  vec2 p=(vUv-.5)*vec2(aspect,1.)*2.55;
  p+=velocity*1.25;
  float t=uTime*.045;
  vec2 q=vec2(fbm(p+uSeed*.13+vec2(t,-t*.3)),fbm(p+vec2(5.2,1.3)-uSeed*.07-t*.5));
  vec2 r=vec2(fbm(p+2.65*q+vec2(1.7,9.2)+t*.4),fbm(p+2.65*q+vec2(8.3,2.8)-t*.3));
  float n=fbm(p+3.1*r+uSeed*.2);
  float hue=n*1.48+q.x*.26+uSeed*.019+flow.b*.16;
  vec3 color=pigment(hue);
  float pooling=smoothstep(.30,.65,fbm(p*.72+q*2.1+vec2(uSeed*.1,3.)));
  float paper=smoothstep(.15,.70,abs(sin(n*9.1+q.y*2.7+uSeed*.15)));
  float density=mix(.28,.98,pooling)*mix(.30,1.,paper);
  density=clamp(density+flow.b*.15,0.,1.);
  color=mix(vec3(.985,.972,.883),color,density);
  float speck=hash(gl_FragCoord.xy+vec2(floor(uTime*9.)));
  float fine=hash(gl_FragCoord.xy*1.713+61.);
  color+=(speck-.5)*.19*uGrain;
  color-=(step(.86,fine)*.055)*uGrain;
  color+=sin(gl_FragCoord.y*1.5)*.008*uGrain;
  gl_FragColor=vec4(clamp(color,0.,1.),1.);
}`;
  function shader(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const message = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(message);
    }
    return s;
  }
  function program(source, names) {
    const p = gl.createProgram(),
      vs = shader(gl.VERTEX_SHADER, vertex),
      fs = shader(gl.FRAGMENT_SHADER, source);
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.bindAttribLocation(p, 0, 'aPosition');
    gl.linkProgram(p);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS))
      throw new Error(gl.getProgramInfoLog(p));
    return {
      p,
      uniforms: Object.fromEntries(
        names.map((n) => [n, gl.getUniformLocation(p, n)]),
      ),
    };
  }
  let flowProgram, artProgram;
  try {
    flowProgram = program(flowSource, [
      'uFlow',
      'uPointer',
      'uVelocity',
      'uAspect',
      'uActive',
      'uDown',
      'uDt',
    ]);
    artProgram = program(artSource, [
      'uFlow',
      'uResolution',
      'uTime',
      'uSeed',
      'uGrain',
    ]);
  } catch (e) {
    console.error('Colour field unavailable:', e);
    canvas.style.display = 'none';
    $('motion').disabled =
      $('grain').disabled =
      $('remix').disabled =
        true;
    return;
  }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const size = 256;
  function target() {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      size,
      size,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    );
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );
    if (
      gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
      gl.FRAMEBUFFER_COMPLETE
    )
      throw new Error('Flow framebuffer unavailable');
    gl.clearColor(0.5, 0.5, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { texture, fbo };
  }
  let front, back;
  try {
    front = target();
    back = target();
  } catch (e) {
    console.error(e);
    canvas.style.display = 'none';
    $('motion').disabled =
      $('grain').disabled =
      $('remix').disabled =
        true;
    return;
  }
  let width = 0,
    height = 0,
    pointer = [-2, -2],
    velocity = [0, 0],
    active = 0,
    down = 0,
    previous = null,
    pointerAt = 0,
    pointerId = null,
    lost = false;
  let quality = Math.min(
      devicePixelRatio || 1,
      innerWidth < 700 ? 1.5 : 1.6,
    ),
    slowFrames = 0;
  function resize() {
    width = innerWidth;
    height = innerHeight;
    const max = 2400000,
      factor = Math.min(quality, Math.sqrt(max / (width * height)));
    canvas.width = Math.max(1, Math.round(width * factor));
    canvas.height = Math.max(1, Math.round(height * factor));
    if (paused) render(0);
  }
  function render(dt) {
    if (lost) return;
    if (dt > 0) {
      gl.useProgram(flowProgram.p);
      const u = flowProgram.uniforms;
      gl.bindFramebuffer(gl.FRAMEBUFFER, back.fbo);
      gl.viewport(0, 0, size, size);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, front.texture);
      gl.uniform1i(u.uFlow, 0);
      gl.uniform2f(u.uPointer, pointer[0], pointer[1]);
      gl.uniform2f(u.uVelocity, velocity[0], velocity[1]);
      gl.uniform1f(u.uAspect, width / height);
      gl.uniform1f(u.uActive, active);
      gl.uniform1f(u.uDown, down);
      gl.uniform1f(u.uDt, dt);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      [front, back] = [back, front];
    }
    gl.useProgram(artProgram.p);
    const u = artProgram.uniforms;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, front.texture);
    gl.uniform1i(u.uFlow, 0);
    gl.uniform2f(u.uResolution, canvas.width, canvas.height);
    gl.uniform1f(u.uTime, time);
    gl.uniform1f(u.uSeed, seed);
    gl.uniform1f(u.uGrain, grain ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function tick(now) {
    raf = 0;
    if (paused || document.hidden || lost) return;
    const elapsed = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    const dt = Math.min(elapsed, 0.0333);
    time += dt;
    seed += (targetSeed - seed) * (1 - Math.exp(-dt * 2.8));
    const stale = now - pointerAt > 65;
    if (stale) {
      velocity[0] *= 0.84;
      velocity[1] *= 0.84;
    }
    active = down ? 1 : active * Math.pow(0.9, dt * 60);
    render(dt * 60);
    if (elapsed > 0.043) slowFrames++;
    else slowFrames = Math.max(0, slowFrames - 1);
    if (slowFrames > 45 && quality > 0.85) {
      quality *= 0.8;
      slowFrames = 0;
      resize();
    }
    raf = requestAnimationFrame(tick);
  }
  function start() {
    last = 0;
    if (!raf && !paused && !document.hidden && !lost)
      raf = requestAnimationFrame(tick);
  }
  function move(e) {
    const x = e.clientX / width,
      y = 1 - e.clientY / height,
      now = performance.now();
    if (previous && now - pointerAt < 160) {
      const scale = 16.67 / Math.max(8, now - pointerAt);
      velocity = [
        Math.max(-0.9, Math.min(0.9, (x - previous[0]) * scale * 9)),
        Math.max(-0.9, Math.min(0.9, (y - previous[1]) * scale * 9)),
      ];
    } else velocity = [0, 0];
    previous = [x, y];
    pointer = [x, y];
    pointerAt = now;
    active = 1;
  }
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerdown', (e) => {
    if (pointerId !== null) return;
    pointerId = e.pointerId;
    move(e);
    down = 1;
    canvas.setPointerCapture(e.pointerId);
  });
  function release(e) {
    if (pointerId !== null && e.pointerId !== pointerId) return;
    down = 0;
    pointerId = null;
  }
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('lostpointercapture', release);
  canvas.addEventListener('pointerleave', () => {
    if (!down) {
      previous = null;
      active = 0;
    }
  });
  addEventListener('blur', () => {
    down = 0;
    pointerId = null;
    active = 0;
    previous = null;
  });
  $('motion').addEventListener('click', () => {
    paused = !paused;
    updateMotion();
    say(paused ? '움직임을 멈췄어요.' : '움직임을 다시 시작해요.');
    if (paused) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else start();
  });
  $('grain').addEventListener('click', () => {
    grain = !grain;
    $('grain').setAttribute('aria-pressed', String(grain));
    say(grain ? '입자 질감을 켰어요.' : '입자 질감을 껐어요.');
    if (paused) render(0);
  });
  $('remix').addEventListener('click', () => {
    targetSeed += 7 + Math.random() * 13;
    if (paused) {
      seed = targetSeed;
      render(0);
    }
    say('새로운 색 배치를 만들었어요.');
  });
  preference.addEventListener('change', (e) => {
    if (e.matches) {
      paused = true;
      updateMotion();
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
      down = 0;
      active = 0;
      previous = null;
    } else start();
  });
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    raf = 0;
    canvas.style.opacity = '0';
    $('motion').disabled =
      $('grain').disabled =
      $('remix').disabled =
        true;
  });
  canvas.addEventListener('webglcontextrestored', () =>
    location.reload(),
  );
  addEventListener('resize', resize, { passive: true });
  resize();
  render(0);
  start();
})();
