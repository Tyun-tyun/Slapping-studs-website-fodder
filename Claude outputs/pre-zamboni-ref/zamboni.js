/* ============================================================
   zamboni.js - the ice machine on the Hockey 101 page.
   A 3D model built in code and turned by the scroll: rounded
   panels, soft light and a shadow on the ice, in the colours of
   the page (bone tank, gold body, ink running gear).

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
function tok(name){ return new T.Color(css.getPropertyValue(name).trim()); }
function mat(name, rough){
  return new T.MeshStandardMaterial({color:tok(name), roughness:rough, metalness:0});
}
// painted panels carry a clear coat, bare metal mirrors the room
// (see the lighting further down), rubber stays dull
function paint(name, rough, coat){
  return new T.MeshPhysicalMaterial({color:tok(name), roughness:rough, metalness:0, clearcoat:coat, clearcoatRoughness:.28});
}
function metal(name, rough){
  return new T.MeshStandardMaterial({color:tok(name), roughness:rough, metalness:1});
}
function lamp(name, glow){
  return new T.MeshStandardMaterial({color:tok(name), emissive:tok(name), emissiveIntensity:glow, roughness:.25});
}
var M = {
  tank:  paint('--bone', .5, .4),
  body:  paint('--gold', .4, .75),
  dark:  mat('--ink3', .6),
  tyre:  mat('--ink', .93),
  steel: metal('--bone2', .3),
  iron:  metal('--ice', .5),
  lens:  lamp('--bone', .55),
  amber: lamp('--gold', .7)
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
  var r = opt.r === undefined ? .06 : opt.r;
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
  if (r === undefined) r = Math.min(.04, (x1 - x0) * .4, (y1 - y0) * .4);
  return solid([[x0, y0], [x0, y1], [x1, y1], [x1, y0]], width, material, {r:r, z:z});
}
function cyl(radius, length, material, x, y, z, axis){
  var geo = new T.CylinderGeometry(radius, radius, length, 32);
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

// ---- the machine ----
var WHEEL_R = .36, FRONT_AXLE = 1.05, REAR_AXLE = -1.2, TRACK = .74;

// body: low at the nose, rising in one diagonal to the tall column
// behind the tank; the two wheel arches are cut out of its floor
(function(){
  var floor = .4, pts = [[1.72, floor], [1.72, 1.0, .12], [.95, 1.04, .2], [-.98, 1.72, .02], [-.98, 2.06, .1], [-1.78, 2.06, .12], [-1.78, floor]];
  [REAR_AXLE, FRONT_AXLE].forEach(function(cx){
    for (var i = 0; i <= 14; i++) {
      var a = PI - i / 14 * PI;
      pts.push([cx + Math.cos(a) * .46, floor + Math.sin(a) * .46, (i === 0 || i === 14) ? .03 : 0]);
    }
  });
  solid(pts, 1.74, M.body, {r:.08, bevel:.07});
})();

// snow tank: sits on the diagonal, a little narrower than the body
solid([[1.69, .96], [1.61, 1.82, .16], [1.4, 1.97, .16], [-.96, 2.1, .1], [-.96, 1.66, .02], [.95, .96, .05]], 1.66, M.tank, {r:.1, bevel:.1});
function tankTop(x){ return 1.97 + (1.4 - x) * .055; }
// the raised lid on top of it, with two grab handles
solid([[1.2, tankTop(1.2) - .03], [1.2, tankTop(1.2) + .06], [-.72, tankTop(-.72) + .06], [-.72, tankTop(-.72) - .03]], 1.2, M.tank, {r:.04, bevel:.04});
[-.3, .3].forEach(function(z){
  tube([[.35, tankTop(.35) + .05, z - .1], [.35, tankTop(.35) + .11, z - .08], [.35, tankTop(.35) + .11, z + .08], [.35, tankTop(.35) + .05, z + .1]], .014, M.dark, .2);
});
// pressed panels on both flanks, each with a handle
[-1, 1].forEach(function(k){
  rbox(-.62, .5, .52, .96, .03, M.body, k * .872, .06);
  rbox(-.08, .06, .7, .76, .03, M.dark, k * .89, .02);
  solid([[1.5, 1.14], [1.42, 1.74, .1], [.3, 1.82, .08], [.3, 1.36, .04], [.9, 1.14, .04]], .03, M.tank, {r:.06, bevel:.012, z:k * .832});
});

// the column behind the tank: the tower of the vertical auger that
// throws the snow forward, its chute into the tank, a beacon on top
cyl(.2, .4, M.body, -1.38, 2.24, .14);
cyl(.215, .05, M.steel, -1.38, 2.45, .14);
rbox(-1.3, -.8, 2.13, 2.3, .3, M.body, .14, .05);
cyl(.02, .2, M.steel, -1.68, 2.16, -.72);
cyl(.06, .1, M.amber, -1.68, 2.3, -.72);

// nose: bumper, two headlights in steel rims, the board brush
rbox(1.68, 1.85, .42, .64, 1.72, M.dark, 0, .06);
[-.55, .55].forEach(function(z){
  rbox(1.7, 1.76, .72, .92, .32, M.steel, z, .05);
  rbox(1.74, 1.78, .75, .89, .26, M.lens, z, .04);
});
cyl(.17, .09, M.tyre, 1.5, .1, -1.02);
tube([[1.5, .52, -.86], [1.5, .46, -1.0], [1.5, .16, -1.02]], .022, M.steel, .3);

// wheels: a tyre with rounded shoulders, tread blocks, a steel rim
(function(){
  var prof = [[.2,-.15],[.31,-.15],[.345,-.135],[.36,-.1],[.36,.1],[.345,.135],[.31,.15],[.2,.15]]
    .map(function(p){ return new T.Vector2(p[0], p[1]); });
  var tyre = new T.LatheGeometry(prof, 40); tyre.rotateX(PI / 2);
  var spots = [];
  [FRONT_AXLE, REAR_AXLE].forEach(function(x){
    [-TRACK, TRACK].forEach(function(z){
      var out = z > 0 ? 1 : -1;
      add(tyre, M.tyre).position.set(x, WHEEL_R, z);
      cyl(.21, .22, M.steel, x, WHEEL_R, z, 'z');
      cyl(.2, .02, M.dark, x, WHEEL_R, z + out * .105, 'z');
      cyl(.085, .3, M.steel, x, WHEEL_R, z, 'z');
      for (var b = 0; b < 6; b++) {
        var a = b / 6 * PI * 2;
        cyl(.016, .02, M.steel, x + Math.cos(a) * .14, WHEEL_R + Math.sin(a) * .14, z + out * .12, 'z');
      }
      for (var i = 0; i < 44; i++) spots.push([x, z + (i % 2 ? .07 : -.07), i / 44 * PI * 2]);
    });
  });
  var dummy = new T.Object3D();
  var blocks = new T.InstancedMesh(new T.BoxGeometry(.06, .04, .12), M.tyre, spots.length);
  spots.forEach(function(t, i){
    dummy.position.set(t[0] + Math.cos(t[2]) * WHEEL_R, WHEEL_R + Math.sin(t[2]) * WHEEL_R, t[1]);
    dummy.rotation.set(0, 0, t[2] + PI / 2);
    dummy.updateMatrix();
    blocks.setMatrixAt(i, dummy.matrix);
  });
  blocks.castShadow = true;
  model.add(blocks);
})();

// driver's side (left): the platform, the seat on its post, the
// console on the back of the column, steering wheel, a guard rail
rbox(-2.5, -1.74, .78, 1.02, .98, M.body, -.38, .06);
cyl(.05, .3, M.dark, -2.22, 1.16, -.42);
rbox(-2.46, -2.0, 1.3, 1.43, .46, M.tyre, -.42, .05);
(function(){
  var back = rbox(-.06, .06, 0, .56, .46, M.tyre, -.42, .05);
  back.position.set(-2.42, 1.42, -.42);
  back.rotation.z = .16;
})();
rbox(-1.9, -1.74, 1.42, 2.0, .62, M.dark, -.42, .05);
tube([[-1.86, 1.6, -.42], [-2.04, 1.76, -.42]], .028, M.dark);
(function(){
  var wheel = add(new T.TorusGeometry(.19, .024, 12, 40), M.tyre);
  wheel.position.set(-2.06, 1.78, -.42);
  wheel.rotation.set(0, PI / 2, 0);
  wheel.rotateX(-.75);
  var hub = cyl(.045, .04, M.tyre, -2.06, 1.78, -.42, 'x');
  hub.rotation.z = -.82;
  [0, 2.1, 4.2].forEach(function(a){
    var sp = add(new T.CylinderGeometry(.012, .012, .19, 6).translate(0, .095, 0), M.tyre);
    sp.position.copy(wheel.position);
    sp.rotation.copy(wheel.rotation);
    sp.rotateZ(a);
  });
})();
tube([[-2.47, 1.02, -.84], [-2.47, 1.5, -.84], [-1.84, 1.5, -.84], [-1.84, 1.02, -.84]], .022, M.steel, .12);

// the other side: the hydraulics cover with its filler cap and
// three levers within reach of the seat
rbox(-2.38, -1.74, .78, 1.38, .76, M.body, .49, .08);
cyl(.07, .05, M.steel, -2.1, 1.4, .6);
[.0, .1, .2].forEach(function(z, i){
  tube([[-1.98, 1.36, z + .16], [-2.02 - i * .02, 1.66, z + .16]], .013, M.steel);
  var knob = add(new T.SphereGeometry(.032, 14, 10), M.tyre);
  knob.position.set(-2.02 - i * .02, 1.68, z + .16);
});

// conditioner: the wide sled at the back that carries the blade.
// Two steel covers on top, the water pipe, the cloth trailing
// behind, a runner at each end, the arms and hoses that hold it.
solid([[-1.9, .5], [-2.72, .5, .12], [-2.98, .34, .08], [-2.98, .1], [-1.9, .1]], 2.2, M.body, {r:.05, bevel:.05});
[-.52, .52].forEach(function(z){ rbox(-2.62, -2.04, .49, .53, .84, M.steel, z, .015); });
rbox(-3.03, -2.97, .05, .3, 2.1, M.tank, 0, .02);
[-1.12, 1.12].forEach(function(z){ rbox(-3.02, -1.86, .03, .16, .07, M.dark, z, .03); });
cyl(.028, 2.0, M.steel, -2.84, .58, 0, 'z');
[-.9, .9].forEach(function(z){ cyl(.02, .12, M.steel, -2.84, .52, z); });
[-.72, .72].forEach(function(z){ tube([[-1.76, .98, z], [-2.22, .5, z]], .035, M.steel); });
tube([[-1.76, 1.2, .3], [-1.96, 1.1, .32], [-2.1, .8, .34], [-2.2, .52, .34]], .028, M.tyre);
tube([[-1.76, 1.2, .16], [-2.0, 1.05, .14], [-2.2, .8, .1], [-2.34, .52, .08]], .028, M.tyre);

// ---- second pass: the small things that make it a machine ----
var bolts = [];
function boltRow(a, b, n){
  for (var i = 0; i < n; i++) {
    var t = n > 1 ? i / (n - 1) : 0;
    bolts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]);
  }
}

// frame and axles under the body, so it is not hollow from below
rbox(-1.7, 1.6, .22, .44, 1.1, M.dark, 0, .04);
[FRONT_AXLE, REAR_AXLE].forEach(function(x){ cyl(.055, 1.5, M.iron, x, WHEEL_R, 0, 'z'); });

// both flanks
[-1, 1].forEach(function(k){
  var z = k * .871;
  // panel gaps, vent slats over the rear wheel, a marker lamp
  rbox(.62, .634, .46, 1.0, .012, M.tyre, z, 0);
  rbox(-.86, -.846, .46, 1.6, .012, M.tyre, z, 0);
  for (var i = 0; i < 5; i++) rbox(-1.62, -1.12, 1.16 + i * .075, 1.2 + i * .075, .024, M.dark, k * .874, .012);
  rbox(1.48, 1.6, .82, .89, .024, M.amber, k * .874, .025);
  // bolts round the pressed panel and along the sill
  boltRow([-.56, .565, k * .889], [.44, .565, k * .889], 7);
  boltRow([-.56, .915, k * .889], [.44, .915, k * .889], 7);
  boltRow([-.78, .47, k * .873], [.56, .47, k * .873], 9);
  boltRow([-.9, 1.9, k * .873], [-1.7, 1.9, k * .873], 6);
  // mud flaps, a side mirror on a stalk
  [FRONT_AXLE, REAR_AXLE].forEach(function(x){ rbox(x - .53, x - .5, .1, .46, .3, M.tyre, k * TRACK, .01); });
  tube([[-1.2, 1.9, k * .85], [-1.2, 2.0, k * 1.0], [-1.2, 2.14, k * 1.05]], .014, M.steel, .2);
  rbox(-1.235, -1.165, 2.1, 2.34, .15, M.dark, k * 1.06, .03);
  rbox(-1.166, -1.158, 2.12, 2.32, .12, M.steel, k * 1.06, .003);
  // a raised ring on each tyre wall
  [FRONT_AXLE, REAR_AXLE].forEach(function(x){
    var ring = add(new T.TorusGeometry(.285, .011, 8, 44), M.tyre);
    ring.position.set(x, WHEEL_R, k * (TRACK + .148));
  });
});

// the club's name on both sides of the tank
(function(){
  var cv = document.createElement('canvas');
  cv.width = 1024; cv.height = 200;
  var tex = new T.CanvasTexture(cv);
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  function write(){
    var c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    c.fillStyle = css.getPropertyValue('--ink').trim();
    c.font = '800 150px ' + css.getPropertyValue('--disp').trim();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.save(); c.translate(cv.width / 2, cv.height / 2 + 6); c.scale(.7, 1);
    c.fillText('SLAPPING STUDS', 0, 0);
    c.restore();
    tex.needsUpdate = true;
  }
  write();
  if (document.fonts && document.fonts.load) {
    document.fonts.load('800 150px Archivo').then(function(){ write(); draw(); });
  }
  var label = new T.MeshStandardMaterial({map:tex, transparent:true, roughness:.5, depthWrite:false,
    polygonOffset:true, polygonOffsetFactor:-2, polygonOffsetUnits:-2});
  [-1, 1].forEach(function(k){
    var m = new T.Mesh(new T.PlaneGeometry(.86, .168), label);
    m.position.set(.86, 1.56, k * .849);
    m.rotation.set(0, k < 0 ? PI : 0, k * -.07);
    model.add(m);
  });
})();

// nose: grille between the lamps, tow hooks, the tank's front latch
rbox(1.715, 1.74, .72, .92, .6, M.dark, 0, .03);
for (var g = 0; g < 4; g++) rbox(1.738, 1.75, .745 + g * .042, .765 + g * .042, .52, M.steel, 0, .006);
[-.38, .38].forEach(function(z){
  var hook = add(new T.TorusGeometry(.05, .016, 8, 20), M.iron);
  hook.position.set(1.87, .53, z);
  hook.rotation.x = PI / 2;
});
boltRow([1.853, .59, -.76], [1.853, .59, .76], 10);
rbox(1.66, 1.71, .98, 1.12, .14, M.steel, 0, .02);

// top: the lid's three hinges, the exhaust stack on the column
[-.42, 0, .42].forEach(function(z){ cyl(.026, .16, M.steel, -.735, tankTop(-.72) + .045, z, 'z'); });
cyl(.05, .52, M.steel, -1.62, 2.3, .62);
cyl(.062, .06, M.dark, -1.62, 2.1, .62);
boltRow([-1.05, 2.065, -.78], [-1.05, 2.065, .78], 9);
boltRow([-1.72, 2.065, -.5], [-1.72, 2.065, .5], 6);

// driver's place: a rubber mat, two pedals, three dials on the
// console, armrests, and a step hung under the platform
rbox(-2.46, -1.8, 1.018, 1.034, .9, M.tyre, -.38, .005);
[-.3, -.52].forEach(function(z){
  var pedal = rbox(-.06, .06, 0, .02, .1, M.iron, z, .005);
  pedal.position.set(-1.98, 1.07, z);
  pedal.rotation.z = -.5;
});
[-.62, -.5, -.24].forEach(function(z){
  cyl(.04, .014, M.steel, -1.904, 1.9, z, 'x');
  cyl(.031, .018, M.tyre, -1.904, 1.9, z, 'x');
});
[-.66, -.18].forEach(function(z){ rbox(-2.42, -2.12, 1.54, 1.58, .05, M.tyre, z, .015); });
rbox(-2.32, -1.9, .5, .54, .26, M.dark, -1.0, .015);
[-2.28, -1.94].forEach(function(x){ tube([[x, .8, -.88], [x, .6, -.98], [x, .53, -1.0]], .016, M.iron, .2); });

// conditioner: a ram on each lift arm, the two handwheels that
// set the blade, nozzles under the water pipe, bolts on its lid
[-.72, .72].forEach(function(z){ tube([[-1.84, .9, z], [-2.03, .7, z]], .058, M.dark); });
[-.86, .86].forEach(function(z){
  cyl(.018, .32, M.steel, -2.32, .66, z);
  var hand = add(new T.TorusGeometry(.085, .014, 8, 28), M.dark);
  hand.position.set(-2.32, .83, z);
  hand.rotation.x = PI / 2;
  cyl(.03, .03, M.dark, -2.32, .83, z);
});
for (var nz = -4; nz <= 4; nz++) cyl(.014, .07, M.iron, -2.84, .54, nz * .22);
boltRow([-1.96, .507, -1.02], [-1.96, .507, 1.02], 15);
boltRow([-2.68, .507, -1.02], [-2.68, .507, 1.02], 15);
boltRow([-1.785, 1.3, .2], [-1.785, 1.3, .8], 5);

(function(){
  var dummy = new T.Object3D();
  var heads = new T.InstancedMesh(new T.SphereGeometry(.015, 10, 8), M.steel, bolts.length);
  bolts.forEach(function(p, i){
    dummy.position.set(p[0], p[1], p[2]);
    dummy.updateMatrix();
    heads.setMatrixAt(i, dummy.matrix);
  });
  model.add(heads);
})();

// the ice under it: nothing but the shadow the machine throws
(function(){
  var ice = new T.Mesh(new T.PlaneGeometry(16, 16).rotateX(-PI / 2), new T.ShadowMaterial({opacity:.2}));
  ice.receiveShadow = true;
  model.add(ice);
})();

// centre the machine on the turntable
model.position.set(.6, -1.2, 0);

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
  camera.position.set(0, 0, Math.max(3.3 / (half * camera.aspect), 2.15 / half));
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
