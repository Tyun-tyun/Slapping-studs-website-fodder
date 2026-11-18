/* hero-puck.js - fits the fixed 1440x900 hero scene to the hero box,
   writes the current year on the puck, and scrubs the animation with
   scroll: the hero is pinned in #hpTrack, progress = how far through
   the track you are. Scroll back up and it plays in reverse. */
(function(){
"use strict";
var hp=document.getElementById('hp'); if(!hp) return;
var hero=hp.parentNode, track=document.getElementById('hpTrack');
var yr=document.getElementById('hpYear'); if(yr) yr.textContent=String(new Date().getFullYear());
var land=document.getElementById('hiLand'), title=hp.parentNode.querySelector('.hi-title');

/* Geometry, measured from the window rather than guessed per breakpoint.
   The scene is a fixed 1440x900 box scaled by --hp-s and centred in the
   hero, so a point at scene y sits at heroH/2 + (y - 450) * s.
   The puck is a circle of 158 scene px at scale 1; the fall swells it to
   about 1.574x (PEAK) and it comes to rest at 0.7x (REST). Everything is
   then multiplied by --hp-f, the one overall size, and lifted by --hp-gl.
   Both are chosen here so that at EVERY point of the scene the whole
   circle is inside the viewport and below the fixed header. */
var HDR=74,            /* the fixed site header */
    GAP=16,            /* air kept above and below the puck at its widest */
    PEAK=248.7,        /* radius in scene px at the widest point of the fall */
    REST=110.6;        /* radius in scene px once landed (158 x 0.7) */
function fit(){
  var w=hero.clientWidth,h=hero.clientHeight;
  var s=Math.max(w/1440,h/900);
  /* the puck comes to rest clear of the h1, however many lines it takes */
  var TOP=(title?title.offsetTop+title.offsetHeight:HDR+20)+34;
  /* small enough that the widest frame of the fall still clears the header */
  var f=Math.max(.2,Math.min(.75,(h/2-HDR-GAP)/(PEAK*s)));
  var rest=REST*f;                               /* resting radius, scene px */
  var gl=Math.max(0,(h/2-TOP)/s-rest);           /* glide, scene px */
  var bot=h/2-gl*s+rest*s;                       /* resting bottom edge, viewport px */
  var r=document.documentElement.style;
  hp.style.setProperty('--hp-s',s.toFixed(4));
  r.setProperty('--hp-s',s.toFixed(4));
  r.setProperty('--hp-f',f.toFixed(4));
  r.setProperty('--hp-gl',gl.toFixed(2));
  /* the flat ground starts just under the resting puck */
  r.setProperty('--hp-lf',(450-gl+rest+10).toFixed(1));
  /* the founding line sits under it, and the chapters are pulled up to
     just under that line so no empty screen is left between them */
  r.setProperty('--hp-land',(bot+44).toFixed(1)+'px');
  /* where the landed puck's lower edge sits, so the page can tell which chapter is under it */
  r.setProperty('--hp-bot',bot.toFixed(1)+'px');
  var lh=land?land.offsetHeight:150;
  r.setProperty('--hi-pull',Math.max(0,h-(bot+44+lh+56)).toFixed(0));
}
fit();
addEventListener('load',fit);
if(window.ResizeObserver) new ResizeObserver(fit).observe(hero); else window.addEventListener('resize',fit);

/* the centre line carries over into the chapter stage: attached to the
   page (scrolls up with it) and fading out downwards via a CSS mask */
var spine=document.getElementById('hiSpine'), hitrack=document.getElementById('hitrack');
/* the chapter-1 line is pure CSS now (.hi-stage.lead .hi-spine in history.html) */

var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
if(reduce||!track||!hp.getAnimations) return;
/* the founding line (#hiLand) arrives under the puck once it has glided
   up; the page's h1 is a quiet line under the header and simply stays */
var ANIM_END=7900;            /* ms of the timeline: 6.4 s animation + puck glide up (6.6 s delay + 1.3 s) */
var anims=[];
function grab(){ anims=hp.getAnimations({subtree:true}); anims.forEach(function(a){a.pause();}); }
grab();
var target=0,cur=0,raf=0;
/* the track is the whole page now (the puck stays pinned through the
   chapters), so the scrub runs over the runway element, not the track */
var run=document.getElementById('hpRun');
function progress(){
  var r=track.getBoundingClientRect(), span=run?run.offsetHeight:track.offsetHeight-hero.offsetHeight;
  if(span<=0) return 1;
  return Math.min(1,Math.max(0,-r.top/span));
}
/* scroll -> timeline time, in four beats: flip and land (0-6400 ms), a short
   rest in the centre, the glide up (6600-7900 ms), then a short hold while
   the founding line is read. The track is 250svh (css/hero-puck.css), so
   the whole scene is scrubbed over 1.5 screens. */
var B1=.56,B2=.62,B3=.80,L0=.70,L1=.84;
function timeAt(p){
  if(p<=B1) return p/B1*6400;
  if(p<=B2) return 6400+(p-B1)/(B2-B1)*200;
  if(p<=B3) return 6600+(p-B2)/(B3-B2)*1300;
  return ANIM_END;
}
/* backface-visibility hides the face turned away from the camera, but it
   still sits in the page: hide it for real, so the year on the far side
   is never "under" the near one */
var puck=hp.querySelector('.hp-puck'), front=hp.querySelector('.hp-front'), back=hp.querySelector('.hp-back');
/* hp.dataset.flip: "" = as scrubbed, "1" = the chapters have turned the puck
   over (back face up), "2" = turning right now, both faces may show */
function faces(){
  if(!puck||!front||!back) return;
  var m=getComputedStyle(puck).transform, c=1;
  if(m&&m.indexOf('matrix3d(')===0) c=parseFloat(m.slice(9).split(',')[10]);
  var f=hp.dataset.flip||'';
  if(f==='2'){ front.style.visibility=''; back.style.visibility=''; return; }
  var hideFront=(c<0)!==(f==='1');
  front.style.visibility=hideFront?'hidden':'';
  back.style.visibility=hideFront?'':'hidden';
}
window.hpFaces=faces;   /* the page script calls it after it turns the puck over */
function paint(){
  var t=timeAt(cur);
  for(var i=0;i<anims.length;i++) anims[i].currentTime=t;
  faces();
  /* once the puck has landed and glided up, the rink dissolves and the puck is
     left alone on the page ground, pinned there while the chapters pass under it */
  hp.style.setProperty('--hp-rink',(1-Math.min(1,Math.max(0,(cur-.78)/.08))).toFixed(3));
  /* on a phone the pinned puck is then drawn smaller (history.html, .hp-pz) */
  hp.style.setProperty('--hp-shrink',(1-.34*Math.min(1,Math.max(0,(cur-.80)/.06))).toFixed(3));
  if(land){ var l=Math.min(1,Math.max(0,(cur-L0)/(L1-L0))); land.style.opacity=l; land.style.transform='translateY('+((1-l)*16).toFixed(1)+'px)'; land.style.visibility=l?'':'hidden'; }
}
function tick(){
  cur+=(target-cur)*.14;
  if(Math.abs(target-cur)<.0004) cur=target;
  paint();
  raf=(cur!==target)?requestAnimationFrame(tick):0;
}
function onScroll(){ target=progress(); if(!raf) raf=requestAnimationFrame(tick); }
window.addEventListener('scroll',onScroll,{passive:true});
window.addEventListener('resize',onScroll);
target=cur=progress(); paint();
})();
