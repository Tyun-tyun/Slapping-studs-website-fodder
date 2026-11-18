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

var PI = Math.PI;

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
across(.045, 1.9, M.steel, -2.28, .56, 0);

// ---- the small things, from the detailed drawing ----
// Plain parts (no ink edges): tubes, and the many-of-a-kind pieces
// that are drawn as one instanced mesh each.
function plain(geo, material){ var m = new T.Mesh(geo, material); model.add(m); return m; }
function tube(points, radius, material){
  var curve = new T.CatmullRomCurve3(points.map(function(p){ return new T.Vector3(p[0], p[1], p[2]); }));
  return plain(new T.TubeGeometry(curve, points.length * 6, radius, 8, false), material);
}
var SIDE = .85;                                   // half the body width
function tankTop(x){ return 1.95 + (1.5 - x) * .1017; }
function lidTop(x){ return 2.04 + (1.2 - x) * .1; }
// a thin plate lying on a sloped surface, between x0 and x1
function plate(x0, x1, top, thick, width, material, z){
  var m = profile([[x0, top(x0)], [x0, top(x0) + thick], [x1, top(x1) + thick], [x1, top(x1)]], width, material);
  m.position.z = z || 0;
  return m;
}

// rivets: collected here, drawn together at the end
var rivets = [];
function rivetRow(from, to, n){
  for (var i = 0; i < n; i++) {
    var t = n > 1 ? i / (n - 1) : 0;
    rivets.push([from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, from[2] + (to[2] - from[2]) * t]);
  }
}
[-1, 1].forEach(function(k){
  var z = k * (SIDE + .004);
  rivetRow([-1.68, 1.11, z], [1.6, 1.11, z], 20);       // belt line, lower body
  rivetRow([-1.68, 1.25, z], [1.56, 1.25, z], 20);      // belt line, tank
  rivetRow([-1.7, 1.32, z], [-1.7, 2.12, z], 6);        // tank, rear edge
  rivetRow([1.58, 1.32, z], [1.47, 1.88, z], 5);        // tank, front edge
  rivetRow([-.1, 1.32, z], [-.1, 2.05, z], 6);          // tank, mid seam
  rivetRow([.3, .44, z], [.3, 1.04, z], 5);             // lower body seams
  rivetRow([-.55, .44, z], [-.55, 1.04, z], 5);
  rivetRow([-1.72, .44, z], [-1.72, 1.04, z], 5);
  rivetRow([1.62, .44, z], [1.62, 1.04, z], 5);
  // panel seams, as ink lines on the skin
  var pts = [[.3,.36],[.3,1.18], [-.55,.36],[-.55,1.18], [-.1,1.18],[-.1,tankTop(-.1)]]
    .map(function(p){ return new T.Vector3(p[0], p[1], z); });
  model.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(pts), ink));

  // service hatch with a handle, vent slats, a small door on the tank
  box(-.42, .12, .55, 1.0, .02, M.lower, k * (SIDE + .01));
  box(-.02, .06, .72, .84, .03, M.dark, k * (SIDE + .025));
  rivetRow([-.37, .6, k * (SIDE + .022)], [-.37, .95, k * (SIDE + .022)], 4);
  for (var i = 0; i < 4; i++) box(1.3, 1.56, .74 + i * .07, .775 + i * .07, .02, M.dark, k * (SIDE + .01));
  box(.95, 1.3, 1.36, 1.6, .02, M.body, k * (SIDE + .01));
  box(1.2, 1.25, 1.45, 1.51, .03, M.dark, k * (SIDE + .025));

  // mirror on a short arm
  box(1.38, 1.42, 1.86, 1.9, .16, M.dark, k * (SIDE + .08));
  box(1.36, 1.44, 1.7, 2.0, .05, M.dark, k * (SIDE + .17));

  // tow hook on the bumper
  var hook = add(new T.TorusGeometry(.05, .015, 6, 16), M.steel);
  hook.position.set(1.83, .52, k * .4);
  hook.rotation.x = Math.PI / 2;
});
// tank top: rivets along both edges, two hatches on the lid, filler caps
[-1, 1].forEach(function(k){
  rivetRow([1.42, tankTop(1.42) + .004, k * .79], [-1.4, tankTop(-1.4) + .004, k * .79], 16);
  plate(.25, .7, lidTop, .03, .34, M.body, k * .36);
  plate(.42, .53, function(x){ return lidTop(x) + .03; }, .025, .05, M.dark, k * .36);
});
plate(-.52, 1.12, lidTop, .012, .03, M.dark, 0);          // lid centre seam
(function(){
  var cap = add(new T.CylinderGeometry(.08, .08, .06, 20), M.dark);
  cap.position.set(-1.05, tankTop(-1.05) + .03, .5);
  var cap2 = add(new T.CylinderGeometry(.06, .06, .05, 20), M.steel);
  cap2.position.set(-1.05, tankTop(-1.05) + .025, -.45);
})();

// front: the inset panel on the tank face with its two wipers, the
// grille between the headlights, rivets on the bumper
profile([[1.665,1.3],[1.555,1.86],[1.535,1.856],[1.645,1.296]], 1.3, M.lower);
[-.3, .3].forEach(function(z){
  var w = add(new T.BoxGeometry(.012, .34, .025), M.tyre);
  w.position.set(1.628, 1.5, z);
  w.rotation.set(.5, 0, .194);
});
box(1.68, 1.705, .8, .96, .56, M.dark);
for (var g = 0; g < 4; g++) box(1.705, 1.715, .82 + g * .035, .835 + g * .035, .5, M.steel);
rivetRow([1.805, .52, -.8], [1.805, .52, .8], 12);
rivetRow([1.69, 1.08, -.78], [1.69, 1.08, .78], 12);

// rear wall of the tank: radiator grille, the console in front of
// the driver, a gear lever, and two hoses down to the conditioner
box(-1.79, -1.75, 1.45, 1.95, .5, M.dark, .42);
for (var r = 0; r < 5; r++) box(-1.8, -1.79, 1.5 + r * .085, 1.535 + r * .085, .42, M.steel, .42);
box(-1.93, -1.75, 1.2, 1.62, .5, M.dark, -.35);
(function(){
  var lever = add(new T.CylinderGeometry(.015, .015, .38, 8), M.steel);
  lever.position.set(-2.08, 1.3, .02);
  lever.rotation.z = .25;
  var knob = add(new T.SphereGeometry(.04, 10, 8), M.tyre);
  knob.position.set(-2.127, 1.49, .02);
})();
tube([[-1.76, 1.35, .3], [-1.95, 1.3, .32], [-2.1, .9, .4], [-2.2, .5, .42]], .03, M.tyre);
tube([[-1.76, 1.35, .6], [-1.98, 1.25, .62], [-2.15, .85, .7], [-2.3, .5, .72]], .03, M.tyre);
rivetRow([-1.755, 1.25, -.78], [-1.755, 1.25, .78], 12);
rivetRow([-1.755, 2.12, -.78], [-1.755, 2.12, .78], 12);

// conditioner: the screw of the auger, the water pipe and the cloth
// that trails behind it, rivets along its top, a spring on each arm
(function(){
  var pts = [], turns = 9, len = 1.8;
  for (var i = 0; i <= turns * 12; i++) {
    var a = i / 12 * PI * 2;
    pts.push(new T.Vector3(-2.28 + Math.cos(a) * .1, .56 + Math.sin(a) * .1, -len / 2 + len * i / (turns * 12)));
  }
  plain(new T.TubeGeometry(new T.CatmullRomCurve3(pts), turns * 24, .018, 6, false), M.steel);
})();
across(.03, 2.0, M.steel, -2.9, .24, 0);
box(-2.93, -2.9, .02, .2, 2.0, M.body);
rivetRow([-2.62, .456, -1.0], [-2.62, .456, 1.0], 14);
rivetRow([-2.0, .428, -1.0], [-2.0, .428, 1.0], 14);
[-.6, .6].forEach(function(z){
  var sp = add(new T.CylinderGeometry(.06, .06, .3, 12), M.dark);
  sp.position.set(-2.03, .7, z);
  sp.rotation.z = Math.atan2(.5, .56) + PI / 2;
});

// wheels: tread blocks round each tyre, bolts on each hub
var tread = [];
[FRONT_AXLE, REAR_AXLE].forEach(function(x){
  [-.75, .75].forEach(function(z){
    for (var i = 0; i < 20; i++) tread.push([x, z, i / 20 * PI * 2]);
    for (var b = 0; b < 6; b++) {
      var a = b / 6 * PI * 2;
      rivets.push([x + Math.cos(a) * .11, WHEEL_R + Math.sin(a) * .11, z + (z > 0 ? .168 : -.168)]);
    }
  });
});
(function(){
  var dummy = new T.Object3D();
  var blocks = new T.InstancedMesh(new T.BoxGeometry(.06, .055, .32), M.tyre, tread.length);
  tread.forEach(function(t, i){
    dummy.position.set(t[0] + Math.cos(t[2]) * WHEEL_R, WHEEL_R + Math.sin(t[2]) * WHEEL_R, t[1]);
    dummy.rotation.set(0, 0, t[2] + PI / 2);
    dummy.updateMatrix();
    blocks.setMatrixAt(i, dummy.matrix);
  });
  model.add(blocks);
  var dots = new T.InstancedMesh(new T.SphereGeometry(.016, 8, 6), M.dark, rivets.length);
  dummy.rotation.set(0, 0, 0);
  rivets.forEach(function(p, i){
    dummy.position.set(p[0], p[1], p[2]);
    dummy.updateMatrix();
    dots.setMatrixAt(i, dummy.matrix);
  });
  model.add(dots);
})();

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
