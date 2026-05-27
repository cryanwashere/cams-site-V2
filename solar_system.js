/**
 * solar_system.js
 * Drop-in Three.js solar system viewer for Cameron Ryan's site.
 * 
 * Usage in index.html:
 *   1. Add a viewer panel (see bottom of this file for the HTML snippet).
 *   2. Add <script type="module" src="solar_system.js"></script> after main2.js.
 */

import { OrbitControls } from 'https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js';

// ─── Planet data ────────────────────────────────────────────────────────────
// radius: visual size | distance: orbit radius | speed: radians/frame
// tilt: axial tilt in radians | color: hex | rings: bool
const PLANETS = [
    { name: 'Mercury', radius: 0.38, distance: 8,   speed: 0.0241, color: 0xb5b5b5, tilt: 0.03 },
    { name: 'Venus',   radius: 0.95, distance: 12,  speed: 0.0094, color: 0xe8cda0, tilt: 3.09 },
    { name: 'Earth',   radius: 1.00, distance: 17,  speed: 0.0058, color: 0x4fa3e0, tilt: 0.41,
      moon: { radius: 0.27, distance: 2.2, speed: 0.054, color: 0xaaaaaa } },
    { name: 'Mars',    radius: 0.53, distance: 23,  speed: 0.0031, color: 0xc1440e, tilt: 0.44 },
    { name: 'Jupiter', radius: 2.60, distance: 34,  speed: 0.00098,color: 0xc88b3a, tilt: 0.05 },
    { name: 'Saturn',  radius: 2.20, distance: 46,  speed: 0.00039,color: 0xe4d191, tilt: 0.47, rings: true },
    { name: 'Uranus',  radius: 1.60, distance: 57,  speed: 0.00014,color: 0x7de8e8, tilt: 1.71 },
    { name: 'Neptune', radius: 1.55, distance: 67,  speed: 0.000045,color: 0x3f54ba, tilt: 0.49 },
];

// ─── Star field ─────────────────────────────────────────────────────────────
function makeStarField(scene) {
    const positions = [];
    for (let i = 0; i < 2000; i++) {
        const r = 280 + Math.random() * 120;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions.push(
            r * Math.sin(phi) * Math.cos(theta),
            r * Math.sin(phi) * Math.sin(theta),
            r * Math.cos(phi)
        );
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const starColor = isDarkMode ? 0xffffff : 0x333344;
    const mat = new THREE.PointsMaterial({ color: starColor, size: 0.4, sizeAttenuation: true });
    scene.add(new THREE.Points(geo, mat));
}

// ─── Orbit ring (dashed circle) ──────────────────────────────────────────────
function makeOrbitRing(distance, scene) {
    const points = [];
    const seg = 128;
    for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(a) * distance, 0, Math.sin(a) * distance));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const ringColor = isDark ? 0x444466 : 0x9999bb;
    const mat = new THREE.LineBasicMaterial({ color: ringColor, transparent: true, opacity: 0.35 });
    scene.add(new THREE.LineLoop(geo, mat));
}

// ─── Sphere helper ───────────────────────────────────────────────────────────
function makeSphere(radius, color, emissiveStrength = 0) {
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.8,
        metalness: 0.1,
        emissive: emissiveStrength > 0 ? color : 0x000000,
        emissiveIntensity: emissiveStrength,
    });
    return new THREE.Mesh(geo, mat);
}

// ─── Saturn rings ────────────────────────────────────────────────────────────
function makeRings(parent) {
    const geo = new THREE.RingGeometry(3.0, 5.2, 64);
    // RingGeometry UVs point inward by default; remap so the ring looks natural
    const pos = geo.attributes.position;
    const uv  = geo.attributes.uv;
    const v3  = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
        v3.fromBufferAttribute(pos, i);
        uv.setXY(i, v3.length() < 4.1 ? 0 : 1, 1);
    }
    const mat = new THREE.MeshBasicMaterial({
        color: 0xd4c07a,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
    });
    const ring = new THREE.Mesh(geo, mat);
    ring.rotation.x = Math.PI / 2;
    parent.add(ring);
}

// ─── Atmosphere glow (Earth, Venus) ─────────────────────────────────────────
function makeAtmosphere(radius, color) {
    const geo = new THREE.SphereGeometry(radius * 1.12, 32, 32);
    const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.09,
        side: THREE.BackSide,
    });
    return new THREE.Mesh(geo, mat);
}

// ─── Build scene ─────────────────────────────────────────────────────────────
function buildSolarSystem(scene) {
    // Sun
    const sunGeo = new THREE.SphereGeometry(3.5, 48, 48);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffd700 });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    scene.add(sun);

    // Sun glow halo
    const glowGeo = new THREE.SphereGeometry(4.2, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.12, side: THREE.BackSide });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // Point light from sun
    const sunLight = new THREE.PointLight(0xfff5e0, 2.2, 300);
    scene.add(sunLight);

    // Ambient fill so dark sides aren't totally black
    scene.add(new THREE.AmbientLight(0x111122, 0.6));

    makeStarField(scene);

    // Build planet pivots
    const pivots = [];

    PLANETS.forEach((p) => {
        makeOrbitRing(p.distance, scene);

        // Pivot sits at the origin; planet is offset inside it
        const pivot = new THREE.Object3D();
        scene.add(pivot);

        const planet = makeSphere(p.radius, p.color);
        planet.rotation.z = p.tilt || 0;
        planet.position.x = p.distance;

        if (p.name === 'Earth' || p.name === 'Venus') {
            const atmoColor = p.name === 'Earth' ? 0x6ab4ff : 0xffcc88;
            const atmo = makeAtmosphere(p.radius, atmoColor);
            planet.add(atmo);
        }

        if (p.rings) makeRings(planet);

        pivot.add(planet);

        // Moon
        let moonPivot = null;
        if (p.moon) {
            moonPivot = new THREE.Object3D();
            moonPivot.position.x = p.distance;
            pivot.add(moonPivot);

            const moon = makeSphere(p.moon.radius, p.moon.color);
            moon.position.x = p.moon.distance;
            moonPivot.add(moon);
        }

        pivots.push({ pivot, moonPivot, data: p, angle: Math.random() * Math.PI * 2 });
    });

    return { pivots, sun };
}

// ─── isInViewport (same as main2.js) ─────────────────────────────────────────
function isInViewport(elem) {
    const { left: x, top: y } = elem.getBoundingClientRect();
    const ww = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const hw = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    return (y < hw && y + elem.clientHeight > 0) && (x < ww && x + elem.clientWidth > 0);
}

// ─── Initialize viewer ────────────────────────────────────────────────────────
function initSolarViewer(wrapperId) {
    const wrapper = document.getElementById(wrapperId);
    const canvas  = document.getElementById('bg-shared');
    if (!canvas || !wrapper) return;

    const scene    = new THREE.Scene();

    // Match the site's background color (respects light/dark mode via CSS vars)
    const bgColor = getComputedStyle(document.body).backgroundColor;
    scene.background = new THREE.Color(bgColor);

    const w = wrapper.clientWidth  || 480;
    const h = wrapper.clientHeight || 320;

    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    camera.position.set(0, 55, 90);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);

    const controls        = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate   = true;
    controls.autoRotateSpeed = 0.4;
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minDistance  = 10;
    controls.maxDistance  = 200;

    const { pivots } = buildSolarSystem(scene);

    // Resize observer keeps aspect ratio correct
    const ro = new ResizeObserver(() => {
        const nw = wrapper.clientWidth;
        const nh = wrapper.clientHeight;
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
    });
    ro.observe(wrapper);

    let moonAngle = 0;

    function animate() {
        requestAnimationFrame(animate);

        moonAngle += 0.01;

        pivots.forEach(({ pivot, moonPivot, data, angle: _ }, i) => {
            pivots[i].angle += data.speed;
            pivot.rotation.y = pivots[i].angle;

            if (moonPivot) {
                moonPivot.rotation.y += data.moon.speed;
            }
        });

        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initSolarViewer('bg-viewer-wrap');
});


/*
──────────────────────────────────────────────────────────────────────────────
  HTML SNIPPET  — paste inside .viewer-section in index.html
──────────────────────────────────────────────────────────────────────────────

    <!-- Solar System -->
    <div class="viewer-panel">
        <div class="viewer-canvas-wrap" id="viewer-solar">
            <canvas id="bg-solar"></canvas>
        </div>
        <a href="education/solar_system.html" class="viewer-label viewer-label--link">
            <p class="viewer-index">03 — Astrophysics</p>
            <h2 class="viewer-title">The Solar System</h2>
            <p class="viewer-desc">
                All eight planets in real relative scale, tracing their elliptical
                paths around the Sun. Drag to orbit, scroll to zoom.
            </p>
        </a>
    </div>

  Then add this script tag after the main2.js script tag:

    <script type="module" src="solar_system.js"></script>

──────────────────────────────────────────────────────────────────────────────
*/