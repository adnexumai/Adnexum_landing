import * as THREE from "three";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function setupParticles() {
  const canvas = document.getElementById("particles");

  if (!canvas || prefersReducedMotion) {
    return;
  }

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return;
  }

  let width = 0;
  let height = 0;
  let particles = [];

  const resize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };

  const createParticles = () => {
    const count = Math.max(18, Math.floor((width * height) / 14000));
    particles = [];

    for (let index = 0; index < count; index += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.5 + 0.3,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.45 + 0.08
      });
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    for (const particle of particles) {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 140, 255, ${particle.alpha})`;
      ctx.fill();

      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;
    }

    window.requestAnimationFrame(draw);
  };

  window.addEventListener("resize", () => {
    resize();
    createParticles();
  });

  resize();
  createParticles();
  draw();
}

function setupTurbulentBackground() {
  const mount = document.getElementById("turbulent-bg");

  if (!mount || prefersReducedMotion || window.innerWidth < 860) {
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform float u_time;
    uniform vec2 u_resolution;
    uniform float u_noise_scale;
    uniform float u_distortion;
    uniform float u_turbulence;
    varying vec2 vUv;

    vec3 mod289(vec3 x){ return x - floor(x*(1.0/289.0))*289.0; }
    vec4 mod289(vec4 x){ return x - floor(x*(1.0/289.0))*289.0; }
    vec4 permute(vec4 x){ return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r){ return 1.79284291400159 - 0.85373472095314*r; }

    float snoise(vec3 v){
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
                 i.z + vec4(0.0, i1.z, i2.z, 1.0))
               + i.y + vec4(0.0, i1.y, i2.y, 1.0))
               + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0) * 2.0 + 1.0;
      vec4 s1 = floor(b1) * 2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x;
      p1 *= norm.y;
      p2 *= norm.z;
      p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    float fbm(vec3 p){
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 0.6;
      for(int i = 0; i < 6; i++){
        value += amplitude * snoise(p * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return value;
    }

    float turbulence(vec3 p){
      float total = 0.0;
      float amplitude = 1.0;
      float frequency = 0.4;
      for(int i = 0; i < 4; i++){
        total += abs(snoise(p * frequency)) * amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
      }
      return total;
    }

    vec2 curl(vec2 p, float time){
      float eps = 0.01;
      float n1 = snoise(vec3(p.x, p.y + eps, time));
      float n2 = snoise(vec3(p.x, p.y - eps, time));
      float n3 = snoise(vec3(p.x + eps, p.y, time));
      float n4 = snoise(vec3(p.x - eps, p.y, time));
      return vec2(n1 - n2, n4 - n3) / (2.0 * eps);
    }

    void main(){
      vec2 uv = vUv;
      float time = u_time * 0.45;
      vec3 pos = vec3(uv * u_noise_scale * 1.5, time * 0.1);

      float turb1 = turbulence(pos) * u_turbulence;
      float turb2 = turbulence(pos * 1.7 + vec3(100.0, 50.0, time * 0.3)) * u_turbulence * 0.3;
      float turb3 = fbm(pos * 0.8 + vec3(200.0, 100.0, time * 0.15)) * u_turbulence * 0.5;

      vec2 distortedUV = uv + vec2(turb1 + turb2, turb2 + turb3) * u_distortion + curl(uv * 2.0, time * 0.5) * 0.2;

      vec2 c1 = vec2(0.5 + sin(time * 0.4) * 0.3 + turb1 * 0.2, 0.75 + cos(time * 0.3) * 0.2 + turb2 * 0.3);
      vec2 c2 = vec2(0.75 + sin(time * 0.35) * 0.25 + turb2 * 0.8, 0.65 + cos(time * 0.45) * 0.3 + turb3 * 0.6);
      vec2 c3 = vec2(0.6 + sin(time * 0.5) * 0.2 + turb3 * 0.12, 0.25 + cos(time * 0.4) * 0.28 + turb1 * 0.09);
      vec2 c4 = vec2(0.15 + sin(time * 0.25) * 0.35 + turb1 * 0.11, 0.8 + cos(time * 0.55) * 0.22 + turb2 * 0.08);

      float g1 = 1.0 - smoothstep(0.0, 0.6 - turb1 * 0.2, length(distortedUV - c1));
      float g2 = 1.0 - smoothstep(0.0, 0.5 - turb2 * 0.15, length(distortedUV - c2));
      float g3 = 1.0 - smoothstep(0.0, 0.55 - turb3 * 0.18, length(distortedUV - c3));
      float g4 = 1.0 - smoothstep(0.0, 0.45 - turb1 * 0.12, length(distortedUV - c4));

      vec3 col1 = vec3(0.38, 0.05, 0.85);
      vec3 col2 = vec3(0.55, 0.10, 1.00);
      vec3 col3 = vec3(0.15, 0.00, 0.55);
      vec3 col4 = vec3(0.70, 0.20, 1.00);
      vec3 col5 = vec3(0.25, 0.05, 0.70);

      vec3 color = vec3(0.01, 0.00, 0.03);
      color += col1 * g1 * (0.9 + turb1 * 0.3);
      color += col2 * g2 * (0.8 + turb2 * 0.4);
      color += col3 * g3 * (0.7 + turb3 * 0.3);
      color += col4 * g4 * (0.6 + turb1 * 0.2);
      color += col5 * g1 * g2 * 0.6;
      color += mix(col1, col2, 0.5) * g2 * g3 * 0.8;
      color += mix(col3, col4, 0.6) * g3 * g4 * 0.35;

      float nd = fbm(vec3(uv * 14.0, time * 0.08)) * 0.5;
      float mt = turbulence(vec3(uv * 22.0, time * 0.04)) * 0.6;
      color += mt * nd * 0.35;
      color = pow(color, vec3(0.88)) * 1.3;

      float vignette = 1.0 - length(uv - 0.5) * 1.6;
      vignette = smoothstep(0.1, 1.0, vignette);
      color *= vignette;

      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const uniforms = {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    u_noise_scale: { value: 4.0 },
    u_distortion: { value: 0.15 },
    u_turbulence: { value: 0.8 }
  };

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms
  });

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  scene.add(mesh);
  mount.appendChild(renderer.domElement);
  let isActive = true;

  const resize = () => {
    const width = mount.clientWidth || window.innerWidth;
    const height = mount.clientHeight || window.innerHeight;
    renderer.setSize(width, height, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    uniforms.u_resolution.value.set(width, height);
  };

  resize();

  if (window.gsap) {
    const timeline = window.gsap.timeline({ repeat: -1 });
    timeline
      .to(uniforms.u_turbulence, { value: 1.2, duration: 6, ease: "sine.inOut" })
      .to(uniforms.u_noise_scale, { value: 6.0, duration: 8, ease: "power2.inOut" }, 0)
      .to(uniforms.u_distortion, { value: 0.25, duration: 7, ease: "power1.inOut" }, 1)
      .to(uniforms.u_turbulence, { value: 0.45, duration: 9, ease: "sine.inOut" })
      .to(uniforms.u_noise_scale, { value: 2.6, duration: 10, ease: "power2.inOut" }, "-=4")
      .to(uniforms.u_distortion, { value: 0.08, duration: 8, ease: "power1.inOut" }, "-=6");
  }

  window.addEventListener(
    "mousemove",
    (event) => {
      const mx = (event.clientX / window.innerWidth) * 2 - 1;
      const my = (event.clientY / window.innerHeight) * 2 - 1;
      uniforms.u_turbulence.value += Math.sqrt(mx * mx + my * my) * 0.015;
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    if (window.innerWidth < 860) {
      isActive = false;
      renderer.domElement.remove();
      renderer.dispose();
      return;
    }

    resize();
  });

  let time = 0;

  const render = () => {
    if (!isActive) {
      return;
    }

    time += 0.007;
    uniforms.u_time.value = time;
    renderer.render(scene, camera);
    window.requestAnimationFrame(render);
  };

  render();
}

setupParticles();
setupTurbulentBackground();
