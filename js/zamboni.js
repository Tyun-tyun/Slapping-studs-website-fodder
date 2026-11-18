/* ============================================================
   zamboni.js - the ice machine on the Hockey 101 page.
   A 3D model built in code and turned by the scroll: rounded
   painted panels, bare metal, soft light and a shadow on the
   ice, in the colours of the page (bone tank, gold body, ink
   running gear).

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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.toneMapping = T.NoToneMapping;
view.appendChild(renderer.domElement);

var PI = Math.PI;

// ---- colours, from the tokens ----
var css = getComputedStyle(document.documentElement);
function val(name){ return css.getPropertyValue(name).trim(); }
function tok(name){ return new T.Color(val(name)); }
function mat(name, rough){
  return new T.MeshStandardMaterial({color:tok(name), roughness:rough, metalness:0});
}
// painted panels carry a clear coat, bare metal mirrors the room
// (see the lighting further down), rubber stays dull
function paint(name, rough, coat){
  return new T.MeshPhysicalMaterial({color:tok(name), roughness:rough, metalness:0, clearcoat:coat, clearcoatRoughness:.28});
}
function metal(name, rough){
  return new T.MeshStandardMaterial({color:tok(name), roughness:rough, metalness:1, side:T.DoubleSide});
}
function lamp(name, glow){
  return new T.MeshStandardMaterial({color:tok(name), emissive:tok(name), emissiveIntensity:glow, roughness:.25});
}
var M = {
  tank:  paint('--bone', .5, .4),
  body:  paint('--gold', .4, .75),
  dark:  mat('--ink3', .6),
  tyre:  mat('--ink', .93),
  steel: metal('--bone2', .28),
  iron:  metal('--ice', .5),
  lens:  lamp('--bone', .55),
  red:   lamp('--danger', .5)
};

// ---- building blocks ----
var model = new T.Group();
function add(geo, material){
  var mesh = new T.Mesh(geo, material);
  mesh.castShadow = mesh.receiveShadow = true;
  model.add(mesh);
  return mesh;
}
// Shade a solid smoothly across its rounded edges and keep its
// real corners crisp: every vertex takes the average of the faces
// that meet there within the crease angle.
function soften(geo, crease){
  if (geo.index) geo = geo.toNonIndexed();
  geo.computeVertexNormals();
  var pos = geo.attributes.position, nor = geo.attributes.normal;
  var cos = Math.cos((crease || 42) * PI / 180), at = {}, i, k;
  for (i = 0; i < pos.count; i++) {
    k = Math.round(pos.getX(i) * 2e3) + ',' + Math.round(pos.getY(i) * 2e3) + ',' + Math.round(pos.getZ(i) * 2e3);
    (at[k] || (at[k] = [])).push(i);
  }
  var out = new Float32Array(pos.count * 3);
  var n = new T.Vector3(), m = new T.Vector3(), sum = new T.Vector3();
  Object.keys(at).forEach(function(key){
    var list = at[key];
    list.forEach(function(a){
      n.fromBufferAttribute(nor, a);
      sum.set(0, 0, 0);
      list.forEach(function(b){
        m.fromBufferAttribute(nor, b);
        if (n.dot(m) > cos) sum.add(m);
      });
      if (sum.lengthSq() === 0) sum.copy(n);
      sum.normalize();
      out[a * 3] = sum.x; out[a * 3 + 1] = sum.y; out[a * 3 + 2] = sum.z;
    });
  });
  geo.setAttribute('normal', new T.BufferAttribute(out, 3));
  return geo;
}
// A side profile [[x, y, cornerRadius?], ...] with its corners
// rounded, pushed out to a width and its long edges rounded too.
function solid(points, width, material, opt){
  opt = opt || {};
  var r = opt.r === undefined ? .05 : opt.r;
  var bevel = Math.min(opt.bevel === undefined ? r : opt.bevel, width * .45);
  var s = new T.Shape(), n = points.length;
  points.forEach(function(p, i){
    var a = points[(i + n - 1) % n], b = points[(i + 1) % n];
    var la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    var rr = Math.min(p[2] === undefined ? r : p[2], la * .45, lb * .45);
    var ax = p[0] + (a[0] - p[0]) / la * rr, ay = p[1] + (a[1] - p[1]) / la * rr;
    var bx = p[0] + (b[0] - p[0]) / lb * rr, by = p[1] + (b[1] - p[1]) / lb * rr;
    if (i) s.lineTo(ax, ay); else s.moveTo(ax, ay);
    if (rr > 0) s.quadraticCurveTo(p[0], p[1], bx, by);
  });
  s.closePath();
  var geo = new T.ExtrudeGeometry(s, {
    depth: width - bevel * 2, curveSegments: 6,
    bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelOffset: -bevel, bevelSegments: 4
  });
  geo.translate(0, 0, -(width - bevel * 2) / 2);
  var mesh = add(soften(geo), material);
  mesh.position.z = opt.z || 0;
  return mesh;
}
function rbox(x0, x1, y0, y1, width, material, z, r){
  if (r === undefined) r = Math.min(.03, (x1 - x0) * .4, (y1 - y0) * .4);
  return solid([[x0, y0], [x0, y1], [x1, y1], [x1, y0]], width, material, {r:r, z:z});
}
// axis: 'y' (upright, the default), 'z' (across) or 'x' (fore-aft);
// top, if given, is the radius of the upper end (a cone)
function cyl(radius, length, material, x, y, z, axis, top){
  var geo = new T.CylinderGeometry(top === undefined ? radius : top, radius, length, 32);
  if (axis === 'z') geo.rotateX(PI / 2);
  if (axis === 'x') geo.rotateZ(PI / 2);
  var mesh = add(geo, material);
  mesh.position.set(x, y, z || 0);
  return mesh;
}
function tube(points, radius, material, tension){
  var curve = new T.CatmullRomCurve3(points.map(function(p){ return new T.Vector3(p[0], p[1], p[2]); }),
    false, 'catmullrom', tension === undefined ? .5 : tension);
  return add(new T.TubeGeometry(curve, points.length * 10, radius, 10, false), material);
}
function ring(radius, thick, material, x, y, z, flat){
  var m = add(new T.TorusGeometry(radius, thick, 8, 36), material);
  m.position.set(x, y, z);
  if (flat) m.rotation.x = PI / 2;
  return m;
}
// the many-of-a-kind pieces are collected and drawn as one mesh each
var bolts = [], studs = [];
function row(list, a, b, n){
  for (var i = 0; i < n; i++) {
    var t = n > 1 ? i / (n - 1) : 0;
    list.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
  }
}
// a painted-on sign: text drawn on a canvas and laid on a panel
function sign(text, w, h, ink, ground, frame){
  var cv = document.createElement('canvas');
  cv.width = 1024; cv.height = Math.round(1024 * h / w);
  var tex = new T.CanvasTexture(cv);
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  function write(){
    var c = cv.getContext('2d'), H = cv.height;
    c.clearRect(0, 0, cv.width, H);
    if (ground) { c.fillStyle = val(ground); c.fillRect(0, 0, cv.width, H); }
    if (frame) { c.strokeStyle = val(ink); c.lineWidth = H * .07; c.strokeRect(H * .1, H * .1, cv.width - H * .2, H * .8); }
    c.fillStyle = val(ink);
    c.font = '800 ' + Math.round(H * .62) + 'px ' + val('--disp');
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.save(); c.translate(cv.width / 2, H * .54); c.scale(.72, 1);
    c.fillText(text, 0, 0);
    c.restore();
    tex.needsUpdate = true;
  }
  write();
  if (document.fonts && document.fonts.load) {
    document.fonts.load('800 100px Archivo').then(function(){ write(); draw(); });
  }
  var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({map:tex, transparent:!ground, roughness:.45,
    depthWrite:!!ground, polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2}));
  model.add(m);
  return m;
}
// a warning sticker on a flank: white with a red head
function sticker(x, y, k, zface){
  rbox(x - .05, x + .05, y - .07, y + .07, .008, M.tank, k * zface, .008);
  rbox(x - .05, x + .05, y + .025, y + .07, .01, M.red, k * zface, .008);
}

// ---- the machine ----
// Proportions follow the real thing: a tall body, low at the back
// and high at the nose, the white snow tank lying on that slope,
// a full-height column behind the tank, the driver on a deck at
// the left rear, and the wide conditioner trailing on the ice.
var WHEEL_R = .4, FRONT_AXLE = 1.0, REAR_AXLE = -.95, TRACK = .73, SIDE = .9;
function bodyTop(x){ return 1.45 - (1.75 - x) * .1273; }

// body and column in one piece, wheel arches cut out of the floor
(function(){
  var floor = .45, pts = [[1.75, floor], [1.75, 1.45, .05], [-1.0, 1.1, .02], [-1.0, 2.2, .05], [-1.75, 2.2, .07], [-1.75, floor]];
  [REAR_AXLE, FRONT_AXLE].forEach(function(cx){
    for (var i = 0; i <= 16; i++) {
      var a = PI - i / 16 * PI;
      pts.push([cx + Math.cos(a) * .5, floor + Math.sin(a) * .5, (i === 0 || i === 16) ? .03 : 0]);
    }
  });
  solid(pts, SIDE * 2, M.body, {r:.05, bevel:.05});
})();
// a rolled lip round each arch
[FRONT_AXLE, REAR_AXLE].forEach(function(x){
  [-1, 1].forEach(function(k){
    var lip = add(new T.TorusGeometry(.51, .035, 8, 28, PI), M.body);
    lip.position.set(x, .45, k * (SIDE - .015));
  });
});

// snow tank: the inset lower wedge, then the upper shell that
// overhangs it with a lip, then three long ribs down its roof
solid([[1.76, 1.4], [1.78, 1.85, .1], [1.55, 2.1, .12], [-1.02, 2.13, .04], [-1.02, 1.06, .02]], 1.7, M.tank, {r:.06, bevel:.06});
solid([[1.82, bodyTop(1.82) + .02], [1.82, 1.86, .1], [1.57, 2.13, .12], [-1.03, 2.16, .04], [-1.03, 1.6, .03], [.85, 1.6, .05], [1.1, bodyTop(1.1) + .02, .04]],
  1.84, M.tank, {r:.05, bevel:.06});
[-.62, 0, .62].forEach(function(z){
  solid([[1.52, 2.08], [1.4, 2.27, .07], [-.96, 2.29, .04], [-.96, 2.1]], .46, M.tank, {r:.04, bevel:.05, z:z});
});
// two slots in the front slope, a black hatch and a white lid on the roof
[-.62, .62].forEach(function(z){
  var slot = rbox(-.11, .11, -.012, .012, .2, M.dark, z, .01);
  slot.position.set(1.7, 1.995, z);
  slot.rotation.z = -Math.atan2(.27, .25);
});
rbox(-.92, -.42, 2.28, 2.315, .4, M.dark, -.62, .012);
tube([[-.74, 2.31, -.72], [-.74, 2.37, -.7], [-.74, 2.37, -.54], [-.74, 2.31, -.52]], .013, M.dark, .2);
[-.76, -.48].forEach(function(z){ rbox(-.98, -.9, 2.285, 2.325, .07, M.dark, z, .01); });
rbox(-.92, -.5, 2.28, 2.315, .4, M.tank, .62, .012);
[.5, .74].forEach(function(z){ cyl(.02, .09, M.steel, -.93, 2.32, z, 'z'); });

// flanks: panel gaps, latches, the white corner post, a filler cap,
// stickers, and the club's name on the tank
[-1, 1].forEach(function(k){
  var z = k * (SIDE + .001);
  rbox(.3, .312, .47, bodyTop(.3) - .03, .012, M.tyre, z, 0);
  rbox(-.36, -.348, .47, bodyTop(-.36) - .03, .012, M.tyre, z, 0);
  rbox(.2, .26, .82, .88, .03, M.dark, k * (SIDE + .012), .012);
  rbox(-.46, -.4, .82, .88, .03, M.dark, k * (SIDE + .012), .012);
  rbox(1.54, 1.67, .78, 1.38, .014, M.tank, k * (SIDE + .003), .02);
  row(bolts, [.38, .5, k * (SIDE + .004)], [-.3, .5, k * (SIDE + .004)], 5);
  row(bolts, [1.7, .5, k * (SIDE + .004)], [1.7, 1.3, k * (SIDE + .004)], 5);
  row(bolts, [-1.08, .55, k * (SIDE + .004)], [-1.08, 2.1, k * (SIDE + .004)], 9);
  row(bolts, [-1.68, .55, k * (SIDE + .004)], [-1.68, 2.1, k * (SIDE + .004)], 9);
  sticker(-1.38, 1.95, k, SIDE + .004);
  sticker(1.3, 1.22, k, SIDE + .004);
  var name = sign('SLAPPING STUDS', .9, .15, '--ink');
  name.position.set(-.1, 1.88, k * (.92 + .003));
  name.rotation.y = k < 0 ? PI : 0;
  // a grab handle on the column
  tube([[-1.5, 1.95, k * SIDE], [-1.5, 1.93, k * (SIDE + .06)], [-1.5, 1.67, k * (SIDE + .06)], [-1.5, 1.65, k * SIDE]], .014, M.tyre, .15);
});
cyl(.06, .03, M.steel, 1.42, 1.05, SIDE + .012, 'z');
cyl(.035, .04, M.iron, 1.42, 1.05, SIDE + .02, 'z');

// nose: a body-coloured bumper with white ends, a white band, the
// black band with both headlights and the name plate
rbox(1.72, 1.92, .5, .72, 1.7, M.body, 0, .04);
[-1, 1].forEach(function(k){ rbox(1.72, 1.92, .5, .72, .16, M.tank, k * .9, .04); });
row(bolts, [1.925, .61, -.3], [1.925, .61, .3], 2);
row(bolts, [1.925, .56, -.3], [1.925, .56, .3], 2);
rbox(1.74, 1.775, .74, .93, 1.78, M.tank, 0, .015);
rbox(1.74, 1.78, .94, 1.2, 1.78, M.tyre, 0, .015);
[-.63, .63].forEach(function(z){
  rbox(1.77, 1.795, .975, 1.165, .3, M.steel, z, .02);
  rbox(1.785, 1.805, .99, 1.15, .26, M.lens, z, .015);
});
(function(){
  var plate = sign('SLAPPING STUDS', .82, .17, '--bone', '--ink', true);
  plate.position.set(1.783, 1.07, 0);
  plate.rotation.y = PI / 2;
})();

// wheels: a deep steel rim with a ring of holes, a chunky tyre
(function(){
  var tyreProf = [[.25,-.17],[.34,-.17],[.385,-.15],[.4,-.11],[.4,.11],[.385,.15],[.34,.17],[.25,.17]]
    .map(function(p){ return new T.Vector2(p[0], p[1]); });
  var rimProf = [[0,.07],[.075,.07],[.085,.03],[.2,.0],[.235,.11],[.25,.165],[.262,.165],[.262,-.165],[0,-.165]]
    .map(function(p){ return new T.Vector2(p[0], p[1]); });
  var tyre = new T.LatheGeometry(tyreProf, 48); tyre.rotateX(PI / 2);
  var blocks = [];
  [FRONT_AXLE, REAR_AXLE].forEach(function(x){
    [-TRACK, TRACK].forEach(function(z){
      var out = z > 0 ? 1 : -1;
      add(tyre, M.tyre).position.set(x, WHEEL_R, z);
      var rim = new T.LatheGeometry(rimProf, 40); rim.rotateX(out * PI / 2);
      add(rim, M.steel).position.set(x, WHEEL_R, z);
      for (var h = 0; h < 8; h++) {
        var a = h / 8 * PI * 2;
        cyl(.03, .012, M.tyre, x + Math.cos(a) * .15, WHEEL_R + Math.sin(a) * .15, z + out * .012, 'z');
      }
      for (var b = 0; b < 6; b++) {
        var c = b / 6 * PI * 2;
        cyl(.012, .02, M.iron, x + Math.cos(c) * .05, WHEEL_R + Math.sin(c) * .05, z + out * .075, 'z');
      }
      // two outer rows of blocks, staggered, and a centre row
      for (var i = 0; i < 40; i++) blocks.push([x, z + (i % 2 ? .085 : -.085), i / 40 * PI * 2]);
      for (var s = 0; s < 20; s++) blocks.push([x, z, (s + .5) / 20 * PI * 2]);
    });
  });
  var dummy = new T.Object3D();
  var tread = new T.InstancedMesh(new T.BoxGeometry(.075, .05, .13), M.tyre, blocks.length);
  blocks.forEach(function(t, i){
    dummy.position.set(t[0] + Math.cos(t[2]) * WHEEL_R, WHEEL_R + Math.sin(t[2]) * WHEEL_R, t[1]);
    dummy.rotation.set(0, 0, t[2] + PI / 2);
    dummy.updateMatrix();
    tread.setMatrixAt(i, dummy.matrix);
  });
  tread.castShadow = true;
  model.add(tread);
})();
// frame and axles under the body
rbox(-1.7, 1.6, .26, .47, 1.0, M.dark, 0, .04);
[FRONT_AXLE, REAR_AXLE].forEach(function(x){ cyl(.06, 1.4, M.iron, x, WHEEL_R, 0, 'z'); });

// the board brush on its arm, between the wheels on the left
tube([[.1, .4, -.7], [.1, .3, -.95], [.1, .22, -1.06]], .025, M.body, .3);
cyl(.2, .16, M.body, .1, .09, -1.06, 'y', .07);
cyl(.075, .04, M.steel, .1, .19, -1.06);

// ---- the rear: everything behind the column ----
// vertical auger: the tower that lifts the snow and throws it
// into the tank, its drive motor on top, hoses down its side
cyl(.2, .95, M.body, -1.98, 1.72, .08);
cyl(.27, .12, M.body, -1.98, 1.5, .08, 'y', .2);
cyl(.215, .04, M.body, -1.98, 2.21, .08);
cyl(.12, .3, M.body, -1.98, 2.38, .08);
[2.3, 2.37, 2.44].forEach(function(y){ ring(.125, .012, M.body, -1.98, y, .08, true); });
cyl(.1, .05, M.dark, -1.98, 2.55, .08);
tube([[-1.9, 2.5, .16], [-1.82, 2.52, .34], [-1.79, 2.3, .4], [-1.79, 1.6, .4]], .022, M.tyre);
tube([[-2.06, 2.5, .16], [-2.1, 2.52, .32], [-2.02, 2.2, .36], [-1.95, 1.6, .34]], .022, M.tyre);
// exhaust pipe at the top of the column
tube([[-1.6, 2.15, .74], [-1.6, 2.36, .74], [-1.66, 2.46, .8], [-1.78, 2.5, .9]], .035, M.steel, .3);

// driver's deck (left): chequer plate floor, the step below it
rbox(-2.5, -1.74, .9, 1.2, .9, M.body, -.45, .04);
rbox(-2.42, -1.86, .56, .62, .26, M.body, -1.01, .02);
[-2.38, -1.9].forEach(function(x){ tube([[x, .92, -.88], [x, .7, -.96], [x, .6, -1.0]], .018, M.body, .2); });
(function(){
  var i, j;
  for (i = 0; i < 9; i++) for (j = 0; j < 7; j++) studs.push([-2.44 + i * .075 + (j % 2) * .037, 1.203, -.84 + j * .075]);
  for (i = 0; i < 7; i++) for (j = 0; j < 3; j++) studs.push([-2.38 + i * .075 + (j % 2) * .037, .623, -1.09 + j * .075]);
})();
// seat on its box, with armrest hoops and a guard rail
rbox(-2.56, -2.06, 1.2, 1.46, .56, M.body, -.46, .04);
solid([[-2.5, 1.46], [-2.5, 1.6, .06], [-2.04, 1.6, .06], [-2.0, 1.46, .03]], .5, M.tyre, {r:.04, bevel:.05, z:-.46});
(function(){
  var back = solid([[-.07, 0], [-.07, .74, .07], [.06, .74, .07], [.07, 0]], .48, M.tyre, {r:.04, bevel:.05});
  back.position.set(-2.5, 1.56, -.46);
  back.rotation.z = .2;
  [-.72, -.2].forEach(function(z){
    tube([[-2.44, 1.6, z], [-2.42, 1.8, z], [-2.12, 1.8, z], [-2.1, 1.6, z]], .016, M.tyre, .15);
  });
})();
tube([[-2.52, 1.2, -.86], [-2.52, 1.72, -.86], [-2.3, 1.76, -.86], [-1.84, 1.76, -.86], [-1.84, 1.2, -.86]], .02, M.tyre, .12);
// tail lamp on the seat box, a black flap hanging at the back
cyl(.07, .02, M.dark, -2.56, 1.05, -.62, 'x');
cyl(.055, .03, M.red, -2.565, 1.05, -.62, 'x');
rbox(-2.56, -2.52, .52, 1.0, .62, M.tyre, .05, .015);

// console on the back of the column: dials, steering wheel
rbox(-1.9, -1.74, 1.5, 2.1, .7, M.body, -.5, .04);
rbox(-1.915, -1.9, 1.78, 2.04, .56, M.tyre, -.5, .006);
[-.68, -.56, -.36, -.28].forEach(function(z, i){
  var r = i < 2 ? .045 : .028;
  cyl(r, .014, M.steel, -1.92, 1.93, z, 'x');
  cyl(r * .8, .018, M.tank, -1.92, 1.93, z, 'x');
});
[-.66, -.58, -.5].forEach(function(z){ cyl(.016, .02, M.red, -1.92, 1.83, z, 'x'); });
tube([[-1.9, 1.66, -.5], [-2.1, 1.82, -.5]], .03, M.dark);
(function(){
  var wheel = add(new T.TorusGeometry(.23, .026, 12, 44), M.tyre);
  wheel.position.set(-2.12, 1.84, -.5);
  wheel.rotation.set(0, PI / 2, 0);
  wheel.rotateX(-.75);
  var hub = add(new T.CylinderGeometry(.06, .06, .04, 20), M.tyre);
  hub.position.copy(wheel.position);
  hub.rotation.z = -.82;
  [0, 2.1, 4.2].forEach(function(a){
    var sp = add(new T.BoxGeometry(.035, .23, .012).translate(0, .115, 0), M.tyre);
    sp.position.copy(wheel.position);
    sp.rotation.copy(wheel.rotation);
    sp.rotateZ(a);
  });
})();
// two pedals on the deck
[-.34, -.56].forEach(function(z){
  var pedal = rbox(-.06, .06, 0, .02, .1, M.tyre, z, .005);
  pedal.position.set(-1.98, 1.24, z);
  pedal.rotation.z = -.5;
});

// right-hand side: the hydraulics box with the control levers on
// its lid, a tall lever at the corner, a filler cap
rbox(-2.4, -1.74, .9, 1.52, .62, M.body, .58, .05);
cyl(.06, .04, M.steel, -2.22, 1.54, .76);
[.36, .46, .56, .66].forEach(function(z, i){
  tube([[-1.96, 1.5, z], [-2.0 - (i % 2) * .04, 1.78, z]], .013, M.steel);
  var knob = add(new T.SphereGeometry(.034, 14, 10), M.tyre);
  knob.position.set(-2.0 - (i % 2) * .04, 1.8, z);
  rbox(-2.0, -1.92, 1.52, 1.535, .06, M.tyre, z, .004);
});
tube([[-2.34, 1.5, .84], [-2.36, 2.02, .84]], .015, M.steel);
tube([[-2.36, 2.03, .76], [-2.36, 2.03, .92]], .02, M.tyre);
row(bolts, [-2.405, 1.0, .32], [-2.405, 1.0, .84], 4);
row(bolts, [-2.405, 1.42, .32], [-2.405, 1.42, .84], 4);
row(bolts, [-1.755, 2.1, -.1], [-1.755, 2.1, .8], 6);

// conditioner: the wide sled that carries the blade. Slanted end
// plates, two inset covers on top, the white board and the rubber
// strip across the back, the mat it drags, and what holds it up.
solid([[-1.96, .12], [-2.06, .5, .04], [-2.8, .5, .1], [-3.06, .38, .06], [-3.06, .06], [-2.0, .06]], 2.24, M.body, {r:.04, bevel:.04});
[-1.15, 1.15].forEach(function(z){
  solid([[-1.9, .04], [-1.99, .57, .04], [-2.86, .57, .1], [-3.12, .4, .05], [-3.12, .04]], .07, M.body, {r:.03, bevel:.02, z:z});
});
[-.56, .56].forEach(function(z){
  rbox(-2.74, -2.12, .495, .515, .78, M.tank, z, .008);
  row(bolts, [-2.7, .52, z - .34], [-2.16, .52, z - .34], 2);
  row(bolts, [-2.7, .52, z + .34], [-2.16, .52, z + .34], 2);
});
rbox(-3.1, -3.05, .2, .42, 2.2, M.tank, 0, .015);
rbox(-3.11, -3.06, .02, .2, 2.2, M.tyre, 0, .01);
row(bolts, [-3.113, .12, -1.04], [-3.113, .12, 1.04], 14);
rbox(-3.36, -3.08, .0, .014, 2.16, M.dark, 0, .004);
// water: two steel pipes with elbows down to the spreader bar
[-.12, .2].forEach(function(z){
  tube([[-2.5, .78, z], [-2.66, .78, z], [-2.76, .7, z], [-2.78, .52, z]], .034, M.steel, .25);
});
cyl(.026, 2.0, M.steel, -2.9, .56, 0, 'z');
for (var nz = -4; nz <= 4; nz++) cyl(.013, .06, M.iron, -2.9, .53, nz * .22);
// lift arms with their rams, hoses, the two blade handwheels
[-.74, .74].forEach(function(z){
  tube([[-1.76, 1.0, z], [-2.26, .52, z]], .035, M.iron);
  tube([[-1.84, .92, z], [-2.03, .74, z]], .055, M.dark);
});
tube([[-1.76, 1.15, .34], [-1.96, 1.05, .36], [-2.12, .8, .38], [-2.22, .52, .38]], .028, M.tyre);
tube([[-1.76, 1.15, .2], [-2.0, 1.0, .5], [-2.2, .8, .62], [-2.34, .52, .64]], .028, M.tyre);
[-.92, .92].forEach(function(z){
  cyl(.018, .3, M.steel, -2.36, .66, z);
  ring(.085, .014, M.tyre, -2.36, .82, z, true);
  cyl(.03, .03, M.tyre, -2.36, .82, z);
});
sticker(-2.5, .3, 1, 1.19);
sticker(-2.5, .3, -1, 1.19);

// bolt heads and the chequer-plate studs, each as one mesh
(function(){
  var dummy = new T.Object3D();
  var heads = new T.InstancedMesh(new T.SphereGeometry(.015, 10, 8), M.steel, bolts.length);
  bolts.forEach(function(p, i){
    dummy.position.set(p[0], p[1], p[2]);
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
  });
  model.add(heads);
  var bumps = new T.InstancedMesh(new T.BoxGeometry(.05, .012, .018), M.body, studs.length);
  studs.forEach(function(p, i){
    dummy.position.set(p[0], p[1], p[2]);
    dummy.rotation.set(0, (i % 2 ? 1 : -1) * PI / 4, 0);
    dummy.updateMatrix();
    bumps.setMatrixAt(i, dummy.matrix);
  });
  model.add(bumps);
})();

// the ice under it: nothing but the shadow the machine throws
(function(){
  var ice = new T.Mesh(new T.PlaneGeometry(16, 16).rotateX(-PI / 2), new T.ShadowMaterial({opacity:.2}));
  ice.receiveShadow = true;
  model.add(ice);
})();

// centre the machine on the turntable; BOX is half its size
var BOX = [2.68, 1.32, 1.22];
model.position.set(.72, -1.28, 0);

var scene = new T.Scene();
var tilt = new T.Group(), turn = new T.Group();   // tilt = camera height, turn = which side faces us
turn.add(model); tilt.add(turn); scene.add(tilt);
// The room the machine stands in: a dim shell with a few bright
// panels, like the lamps over a rink. It is never drawn; it only
// lights the model and shows up as reflections in the paint and
// the metal, and because it stays put while the machine turns,
// those reflections slide across the panels.
(function(){
  var room = new T.Scene();
  function glow(v){ return new T.MeshBasicMaterial({color:new T.Color(v, v, v * .97), side:T.DoubleSide, toneMapped:false}); }
  room.add(new T.Mesh(new T.SphereGeometry(30, 32, 16), glow(.3)));
  var floor = new T.Mesh(new T.PlaneGeometry(60, 60), glow(.42));
  floor.rotation.x = -PI / 2; floor.position.y = -2.5;
  room.add(floor);
  [[16, 7, 0, 13, 2, 3.2], [9, 7, -13, 6, 7, 2.4], [7, 6, 13, 4, 5, 1], [12, 4, 0, 4, -13, .8], [3, 9, -6, 5, 13, 1.8], [3, 9, 6, 5, 13, 1.8]]
    .forEach(function(l){
      var panel = new T.Mesh(new T.PlaneGeometry(l[0], l[1]), glow(l[5]));
      panel.position.set(l[2], l[3], l[4]);
      panel.lookAt(0, 0, 0);
      room.add(panel);
    });
  var pm = new T.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(room, .035).texture;
  pm.dispose();
})();
var sun = new T.DirectionalLight(0xffffff, 2.1);
sun.position.set(-3, 6, 4.5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = sun.shadow.camera.bottom = -4.5;
sun.shadow.camera.right = sun.shadow.camera.top = 4.5;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 20;
sun.shadow.bias = -.0004; sun.shadow.normalBias = .02; sun.shadow.radius = 5;
scene.add(sun);

var FOV = 20, HALF = Math.tan(FOV * PI / 360);
var camera = new T.PerspectiveCamera(FOV, 1, 1, 100);

// ---- the five views, one per fact: [turn, tilt] in radians ----
var VIEWS = [
  [PI,        .09],   // side, nose to the left
  [PI * 1.5,  .12],   // front
  [PI * 2,   1.52],   // from above
  [PI * 2.5,  .2],    // rear: the conditioner
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
  if (!camera) return;
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
  // Stand as close as the frame allows: the size of the machine as
  // it is turned right now decides the distance, so it fills the
  // sheet in every view. The floor on the width keeps the end-on
  // views from growing out of scale with the side views.
  var ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a)), cb = Math.abs(Math.cos(b)), sb = Math.abs(Math.sin(b));
  var across = Math.max(BOX[0] * ca + BOX[2] * sa, 2.1), deep = BOX[0] * sa + BOX[2] * ca;
  // (seen from a low angle the tall parts stand well inside the
  // footprint, so only part of its depth counts towards the height)
  across *= 1 - .1 * Math.abs(Math.sin(2 * a));
  var high = BOX[1] * cb + deep * sb * (.55 + .45 * Math.pow(sb, 4)), near = BOX[1] * sb + deep * cb;
  camera.position.set(0, 0, Math.max(across * 1.03 / (HALF * camera.aspect), high * 1.08 / HALF) + near * .5);
  renderer.render(scene, camera);
}

function fit(){
  var w = view.clientWidth, h = view.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
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
