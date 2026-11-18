/* ============================================================
   zamboni.js - the ice machine on the Hockey 101 page.
   A small 3D model built in code from the four-view drawing
   (side, front, top, rear) and turned by the scroll.

   Needs js/three.min.js loaded before it (a plain script, not a
   module, so the page still opens straight from disk).

   How it behaves:
     wide screen   the block pins under the rail; each step of the
                   scroll turns the machine to the next view and
                   shows the fact that belongs to it
     phone, or reduced motion
                   nothing pins; the facts are a plain list, the
                   machine turns a little as it passes and can be
                   dragged round by hand
     no WebGL      the drawing is left out, the facts stay

   Colours are read from css/tokens.css, never written here.
   Units: 1 = one metre, x points forward, y up, z to the right.
   ============================================================ */
(function(){
"use strict";
var root = document.getElementById('zam');
if (!root || !window.THREE) return;
var T = window.THREE;
var view  = root.querySelector('.hk-zam-view');
var stage = root.querySelector('.hk-zam-stage');
var facts = Array.prototype.slice.call(root.querySelectorAll('.hk-zam-fact'));

var renderer;
try { renderer = new T.WebGLRenderer({antialias:true, alpha:true}); }
catch (e) { return; }
root.classList.add('has-3d');
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
view.appendChild(renderer.domElement);

// ---- colours, from the tokens ----
var css = getComputedStyle(document.documentElement);
function tok(name){ return new T.Color(css.getPropertyValue(name).trim()); }
function mat(name){
  return new T.MeshLambertMaterial({color:tok(name), polygonOffset:true, polygonOffsetFactor:1, polygonOffsetUnits:1});
}
var M = {
  body:  mat('--bone'),
  lower: mat('--bone4'),
  dark:  mat('--ink3'),
  tyre:  mat('--ink'),
  gold:  mat('--gold'),
  steel: mat('--ice')
};
var ink = new T.LineBasicMaterial({color:tok('--ink')});

// ---- building blocks: every solid gets its edges drawn in ink ----
var model = new T.Group();
function add(geo, material){
  var mesh = new T.Mesh(geo, material);
  mesh.add(new T.LineSegments(new T.EdgesGeometry(geo, 24), ink));
  model.add(mesh);
  return mesh;
}
// a side profile [[x,y],...] pushed out to a width, centred on z
function extrude(shape, width, material){
  var geo = new T.ExtrudeGeometry(shape, {depth:width, bevelEnabled:false, curveSegments:14});
  geo.translate(0, 0, -width / 2);
  return add(geo, material);
}
function profile(points, width, material){
  var s = new T.Shape();
  points.forEach(function(p, i){ if (i) s.lineTo(p[0], p[1]); else s.moveTo(p[0], p[1]); });
  return extrude(s, width, material);
}
function box(x0, x1, y0, y1, width, material, z){
  var mesh = add(new T.BoxGeometry(Math.abs(x1 - x0), y1 - y0, width), material);
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, z || 0);
  return mesh;
}
// a cylinder lying across the machine (along z)
function across(radius, length, material, x, y, z){
  var geo = new T.CylinderGeometry(radius, radius, length, 28);
  geo.rotateX(Math.PI / 2);
  var mesh = add(geo, material);
  mesh.position.set(x, y, z || 0);
  return mesh;
}

// ---- the machine ----
var WHEEL_R = .33, FRONT_AXLE = 1.05, REAR_AXLE = -1.3;

// lower body, with the two wheel arches cut out of its bottom edge
(function(){
  var s = new T.Shape(), floor = .36, arch = .42;
  s.moveTo(1.68, 1.18);
  s.lineTo(-1.75, 1.18);
  s.lineTo(-1.75, floor);
  s.lineTo(REAR_AXLE - arch, floor);
  s.absarc(REAR_AXLE, floor, arch, Math.PI, 0, true);
  s.lineTo(FRONT_AXLE - arch, floor);
  s.absarc(FRONT_AXLE, floor, arch, Math.PI, 0, true);
  s.lineTo(1.68, floor);
  extrude(s, 1.7, M.lower);
})();

// snow tank: the big sloped box that makes up most of the machine
profile([[1.65,1.18],[1.5,1.95],[-1.45,2.25],[-1.75,2.2],[-1.75,1.18]], 1.7, M.body);
// the club stripe along both sides of the tank
profile([[.95,1.3],[-1.45,1.9],[-1.45,1.66],[.25,1.3]], 1.73, M.gold);
// tank lid, front bumper, headlights, beacon
profile([[1.2,2.0],[1.2,2.04],[-.6,2.22],[-.6,2.18]], 1.3, M.lower);
box(1.62, 1.8, .42, .62, 1.76, M.dark);
box(1.64, 1.7, .8, .96, .3, M.gold, .52);
box(1.64, 1.7, .8, .96, .3, M.gold, -.52);
(function(){
  var b = add(new T.CylinderGeometry(.07, .07, .14, 20), M.gold);
  b.position.set(-1.58, 2.3, 0);
})();

// wheels: tyre and hub, four times
[FRONT_AXLE, REAR_AXLE].forEach(function(x){
  [-.75, .75].forEach(function(z){
    across(WHEEL_R, .3, M.tyre, x, WHEEL_R, z);
    across(.17, .33, M.body, x, WHEEL_R, z);
  });
});

// driver's deck behind the tank; the driver sits on the left
box(-2.4, -1.75, .8, 1.12, 1.5, M.dark);
box(-2.36, -2.2, 1.12, 1.4, .2, M.dark, -.35);     // seat post
box(-2.52, -2.05, 1.4, 1.5, .5, M.tyre, -.35);     // cushion
box(-2.54, -2.42, 1.5, 2.02, .5, M.tyre, -.35);    // backrest
(function(){
  var col = add(new T.CylinderGeometry(.025, .025, .34, 10), M.steel);
  col.position.set(-1.87, 1.7, -.35);
  col.rotation.z = -.9;
  var wheel = add(new T.TorusGeometry(.15, .022, 8, 28), M.tyre);
  wheel.position.set(-2.0, 1.81, -.35);
  wheel.rotation.set(0, Math.PI / 2, 0);
  wheel.rotateX(-.65);
})();

// conditioner: the sled at the back that holds the blade and lays
// the water, its two end plates, the arms that lift it, the auger
profile([[-1.95,.42],[-2.65,.45],[-2.85,.3],[-2.85,.05],[-1.95,.05]], 2.1, M.dark);
box(-2.9, -1.9, .03, .5, .04, M.tyre, 1.07);
box(-2.9, -1.9, .03, .5, .04, M.tyre, -1.07);
[-.6, .6].forEach(function(z){
  var arm = add(new T.BoxGeometry(.78, .07, .07), M.steel);
  arm.position.set(-2.03, .7, z);
  arm.rotation.z = Math.atan2(.5, .56);
});
across(.08, 1.9, M.steel, -2.28, .52, 0);

// centre the machine on the turntable
model.position.set(.55, -1.08, 0);

var scene = new T.Scene();
var tilt = new T.Group(), turn = new T.Group();   // tilt = camera height, turn = which side faces us
turn.add(model); tilt.add(turn); scene.add(tilt);
scene.add(new T.AmbientLight(0xffffff, 2.25));
var sun = new T.DirectionalLight(0xffffff, .95);
sun.position.set(-1.2, 2.4, 1.8);
scene.add(sun);

var FOV = 20;
var camera = new T.PerspectiveCamera(FOV, 1, 1, 100);

// ---- the five views, one per fact: [turn, tilt] in radians ----
var PI = Math.PI;
var VIEWS = [
  [PI,        .09],   // side, nose to the left
  [PI * 1.5,  .12],   // front
  [PI * 2,   1.52],   // from above
  [PI * 2.5,  .16],   // rear: the conditioner
  [PI * 3.22, .36]    // three-quarter
];
function clamp01(v){ return Math.max(0, Math.min(1, v)); }
function smooth(t){ return t * t * (3 - 2 * t); }

var pinned = false, dragTurn = 0, activeFact = -1;

function showFact(i){
  if (i === activeFact) return;
  activeFact = i;
  facts.forEach(function(f, k){ f.classList.toggle('active', k === i); });
}

function draw(){
  var r = root.getBoundingClientRect(), a, b;
  if (pinned) {
    // 0..1 over the pinned stretch, then spread across the views;
    // each view holds still for a while before the turn to the next
    var top = parseFloat(getComputedStyle(stage).top) || 0;
    var span = r.height - stage.offsetHeight;
    var p = (span > 0 ? clamp01((top - r.top) / span) : 0) * (VIEWS.length - 1);
    var i = Math.min(VIEWS.length - 2, Math.floor(p)), t = p - i;
    var e = smooth(clamp01((t - .22) / .56));
    a = VIEWS[i][0] + (VIEWS[i + 1][0] - VIEWS[i][0]) * e;
    b = VIEWS[i][1] + (VIEWS[i + 1][1] - VIEWS[i][1]) * e;
    showFact(t < .5 ? i : i + 1);
  } else {
    var v = view.getBoundingClientRect(), vh = window.innerHeight;
    var pass = still ? .5 : clamp01(1 - (v.top + v.height / 2) / vh);
    a = PI * 3.22 + (pass - .5) * 1.6 + dragTurn;
    b = .34;
  }
  turn.rotation.y = a;
  tilt.rotation.x = b;
  renderer.render(scene, camera);
}

function fit(){
  var w = view.clientWidth, h = view.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  var half = Math.tan(FOV * PI / 360);
  camera.position.set(0, 0, Math.max(3.15 / (half * camera.aspect), 2.05 / half));
  camera.updateProjectionMatrix();
  draw();
}

// ---- pinned or loose ----
var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var wide = window.matchMedia('(min-width:901px) and (min-height:600px)');
function setMode(){
  pinned = wide.matches && !still;
  root.classList.toggle('is-pinned', pinned);
  activeFact = -1;
  if (!pinned) facts.forEach(function(f){ f.classList.remove('active'); });
  fit();
}
if (wide.addEventListener) wide.addEventListener('change', setMode);
else wide.addListener(setMode);

window.addEventListener('scroll', draw, {passive:true});
window.addEventListener('resize', fit);
if (window.ResizeObserver) new ResizeObserver(fit).observe(view);

// loose mode: drag the machine round by hand
var canvas = renderer.domElement, dragX = null;
canvas.addEventListener('pointerdown', function(e){
  if (pinned) return;
  dragX = e.clientX;
  canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', function(e){
  if (dragX === null) return;
  dragTurn += (e.clientX - dragX) * .01;
  dragX = e.clientX;
  draw();
});
['pointerup', 'pointercancel'].forEach(function(n){
  canvas.addEventListener(n, function(){ dragX = null; });
});

setMode();
})();
