/* ============================================================
   avatar.js — illustrated player avatars, drawn as inline SVG.

   Real photographs of players cannot go on the site, so every
   card gets a character instead. Two sources, one look:

     1. GUEST / DEFAULT. A player who has not set anything gets a
        character generated from their id: same id, same face,
        every load. That is what the roster ships with today.
     2. MEMBER. A signed-in member sets their own avatar in the
        constructor (planned - see the project's avatar research
        note) and the chosen traits are stored on the player
        record as p.avatar = {skin,hair,hairColor,eyes,mouth,
        beard,glasses}. Any key present overrides the generated
        one, so a half-finished config still renders.

   A member who uploads a real picture into the card's photo slot
   (the existing .ph / data-slot mechanism) covers the drawing
   entirely - views.js's applyPhotos() adds .has-photo and the
   CSS hides the SVG under it.

   The jersey is not a trait: it comes from the player's squad
   and number, so the constructor can only ever change the head.
   Every colour is a token from tokens.css or a skin/hair swatch
   listed once below.
   ============================================================ */

(function(S){
  "use strict";

  var SKIN  = ["#F3CFAE","#E4B48A","#C98F5C","#9C6A3E","#6B4526"];
  var HAIRC = ["#1D1A18","#3A2A1E","#6B4A2E","#B8874A","#D9B36A","#A6432A","#8B8B8B"];
  var HAIR  = ["short","buzz","side","long","bun","curly","cap"];
  var EYES  = ["dots","wide","happy"];
  var MOUTH = ["smile","grin","flat"];
  var BEARD = ["none","none","stubble","beard"];   // none twice: most faces are clean

  /* squad → jersey. The club dresses in three colours and one
     stripe, and the four squads are exactly those four marks:
       Studs 1    solid gold
       Studs 2    the same gold under ink stripes
       Stallions  black — on this site's dark ground it needs the
                  bone edge below, or the silhouette disappears
       Cadets     white
     body / trim (the hem band and the collar V) / num = the
     number. stripe draws the body through a <pattern> instead of
     a flat fill and puts a gold outline on the number so it reads
     over both stripe colours; edge strokes the jersey's outline.
     The same four marks are the .sq-* dots in css/components.css
     and the roster legend — change both together. */
  var JERSEY = {
    "Studs 1":  {body:"#F7C325", trim:"#111417", num:"#111417"},
    "Studs 2":  {body:"#F7C325", trim:"#111417", num:"#111417", stripe:"#111417"},
    "Stallions":{body:"#111417", trim:"#EDEAE1", num:"#EDEAE1", edge:"#EDEAE1"},
    "Cadets":   {body:"#EDEAE1", trim:"#111417", num:"#111417"},
    "_staff":   {body:"#3C4247", trim:"#EDEAE1", num:"#EDEAE1"}   /* staff: a jacket, not a jersey */
  };

  /* a small deterministic hash so the same id always draws the
     same character, and neighbouring ids do not look alike */
  function hash(str){
    var h = 2166136261;
    for(var i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function pick(list, n){ return list[n % list.length]; }

  S.avatarConfig = function(p){
    var h = hash(String(p.id||p.name||"x"));
    var base = {
      skin:      pick(SKIN,  h),
      hair:      pick(HAIR,  h >>> 3),
      hairColor: pick(HAIRC, h >>> 6),
      eyes:      pick(EYES,  h >>> 9),
      mouth:     pick(MOUTH, h >>> 12),
      beard:     pick(BEARD, h >>> 15),
      glasses:   ((h >>> 18) % 5) === 0
    };
    var own = p.avatar || {};
    for(var k in own) if(own[k] !== undefined && own[k] !== "") base[k] = own[k];
    return base;
  };

  /* ---- the drawing ---------------------------------------- */
  function hairSVG(style, c){
    switch(style){
      case "buzz":  return '<path d="M62 78c4-22 22-34 38-34s34 12 38 34c-10-8-24-11-38-11s-28 3-38 11z" fill="'+c+'" opacity=".55"/>';
      case "short": return '<path d="M60 82c2-26 20-40 40-40s38 14 40 40c-8-10-22-14-40-14s-32 4-40 14z" fill="'+c+'"/>';
      case "side":  return '<path d="M60 84c0-28 18-42 40-42 24 0 42 12 42 40-8-10-18-12-30-10-18 3-30 0-38-8-6 6-12 12-14 20z" fill="'+c+'"/>';
      case "long":  return '<path d="M60 86c2-28 20-42 40-42s38 14 40 42c-8-10-22-16-40-16s-32 6-40 16z" fill="'+c+'"/>';
      case "bun":   return '<circle cx="100" cy="40" r="13" fill="'+c+'"/><path d="M60 84c2-28 20-40 40-40s38 12 40 40c-10-10-24-14-40-14s-30 4-40 14z" fill="'+c+'"/>';
      case "curly": return '<path d="M56 86c-4-10 2-18 10-20-2-10 6-18 16-16 2-10 14-14 22-8 8-6 20-2 22 8 10-2 18 6 16 16 8 2 14 10 10 20-10-8-24-12-48-12s-38 4-48 12z" fill="'+c+'"/>';
      case "cap":   return '<path d="M58 84c2-26 20-40 42-40s40 14 42 40H58z" fill="#181B1F"/><path d="M52 84h96c4 0 6 2 6 5s-2 5-6 5H52c-4 0-6-2-6-5s2-5 6-5z" fill="#111417"/><rect x="92" y="54" width="16" height="6" rx="3" fill="#F7C325"/>';
    }
    return "";
  }
  function eyesSVG(style){
    switch(style){
      case "wide":  return '<circle cx="84" cy="98" r="5" fill="#111417"/><circle cx="116" cy="98" r="5" fill="#111417"/><circle cx="86" cy="96" r="1.6" fill="#fff"/><circle cx="118" cy="96" r="1.6" fill="#fff"/>';
      case "happy": return '<path d="M78 100c3-6 9-6 12 0M110 100c3-6 9-6 12 0" fill="none" stroke="#111417" stroke-width="3" stroke-linecap="round"/>';
    }
    return '<circle cx="84" cy="98" r="3.6" fill="#111417"/><circle cx="116" cy="98" r="3.6" fill="#111417"/>';
  }
  function mouthSVG(style){
    switch(style){
      case "grin": return '<path d="M86 118c6 8 22 8 28 0z" fill="#111417"/><path d="M90 119h20" stroke="#fff" stroke-width="2"/>';
      case "flat": return '<path d="M90 120h20" stroke="#111417" stroke-width="3" stroke-linecap="round"/>';
    }
    return '<path d="M88 117c5 6 19 6 24 0" fill="none" stroke="#111417" stroke-width="3" stroke-linecap="round"/>';
  }
  function beardSVG(style, c){
    switch(style){
      case "stubble": return '<path d="M66 108c4 22 16 32 34 32s30-10 34-32c-6 18-18 24-34 24s-28-6-34-24z" fill="'+c+'" opacity=".35"/>';
      case "beard":   return '<path d="M64 104c2 26 16 40 36 40s34-14 36-40c-4 12-12 18-20 20-6-2-12-2-16-2s-10 0-16 2c-8-2-16-8-20-20z" fill="'+c+'"/>';
    }
    return "";
  }
  function glassesSVG(){
    return '<g fill="none" stroke="#111417" stroke-width="2.5"><rect x="72" y="90" width="22" height="16" rx="5"/><rect x="106" y="90" width="22" height="16" rx="5"/><path d="M94 97h12M72 96l-8-3M128 96l8-3"/></g>';
  }
  /* the back of long hair, drawn before the head so the face
     stays clear and only the ends show past the jaw */
  function hairBackSVG(c){
    return '<path d="M56 90c0-32 20-48 44-48s44 16 44 48v52c0 6-4 10-10 10H66c-6 0-10-4-10-10z" fill="'+c+'"/>';
  }
  /* goaltender: a helmet in place of hair, the face behind a cage */
  function goalieSVG(skin, trim){
    return '<path d="M60 92c0-30 18-46 40-46s40 16 40 46v20c0 8-4 12-10 12H70c-6 0-10-4-10-12z" fill="#DFDBCF"/>'+
      '<path d="M60 92c0-30 18-46 40-46s40 16 40 46v6H60z" fill="'+trim+'" opacity=".9"/>'+
      '<ellipse cx="100" cy="106" rx="26" ry="24" fill="'+skin+'"/>';
  }

  /* p: a player or staff record. opts.staff: no number, staff jersey */
  S.avatarSVG = function(p, opts){
    opts = opts || {};
    var c = S.avatarConfig(p);
    var j = JERSEY[opts.staff ? "_staff" : p.team] || JERSEY._staff;
    var goalie = !opts.staff && p.pos === "Goaltender";
    var no = opts.staff ? "" : String(p.no||"");
    if(no === "0") no = "";

    var svg = '<svg class="av" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">';
    /* A striped squad paints its body through a pattern. The id
       has to be unique on the page, because a roster draws sixty
       of these into one document. */
    var pid = "", fill = j.body;
    if(j.stripe){
      pid = "js-"+hash(String(p.id||p.name||"x")).toString(36);
      fill = "url(#"+pid+")";
      svg += '<defs><pattern id="'+pid+'" width="22" height="22" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">'+
        '<rect width="22" height="22" fill="'+j.body+'"/><rect width="9" height="22" fill="'+j.stripe+'"/></pattern></defs>';
    }
    /* jersey: shoulders rising from the bottom edge */
    svg += '<path d="M28 200v-30c0-18 12-30 30-36l18-6h48l18 6c18 6 30 18 30 36v30z" fill="'+fill+'"'+
      (j.edge ? ' stroke="'+j.edge+'" stroke-width="3"' : "")+'/>';
    if(!opts.staff) svg += '<path d="M28 178h144v7H28z" fill="'+j.trim+'" opacity=".9"/>';   // the hem band; staff wear a plain jacket
    svg += '<path d="M76 128l24 14 24-14" fill="none" stroke="'+j.trim+'" stroke-width="4" stroke-linejoin="round"/>';
    if(no) svg += '<text x="100" y="172" text-anchor="middle" font-family="Archivo,Arial Narrow,sans-serif" font-weight="800" font-size="30" fill="'+j.num+'"'+
      (j.stripe ? ' stroke="'+j.body+'" stroke-width="5" paint-order="stroke"' : "")+'>'+no+'</text>';
    /* neck + head (long hair hangs behind the head) */
    if(!goalie && c.hair === "long") svg += hairBackSVG(c.hairColor);
    svg += '<rect x="88" y="120" width="24" height="20" fill="'+c.skin+'"/>';
    svg += '<path d="M64 92c0-26 16-42 36-42s36 16 36 42v22c0 22-16 36-36 36s-36-14-36-36z" fill="'+c.skin+'"/>';
    /* ears */
    svg += '<circle cx="63" cy="104" r="6" fill="'+c.skin+'"/><circle cx="137" cy="104" r="6" fill="'+c.skin+'"/>';
    if(goalie){
      svg += goalieSVG(c.skin, j.trim);
      svg += eyesSVG(c.eyes);
      svg += mouthSVG(c.mouth);
      svg += '<g fill="none" stroke="#111417" stroke-width="2.2" opacity=".8">'+
        '<path d="M74 96h52M74 106h52M74 116h52M88 84v44M100 84v46M112 84v44"/></g>';
    }else{
      svg += beardSVG(c.beard, c.hairColor);
      svg += eyesSVG(c.eyes);
      svg += mouthSVG(c.mouth);
      if(c.glasses) svg += glassesSVG();
      svg += hairSVG(c.hair, c.hairColor);
    }
    svg += '</svg>';
    return svg;
  };

  S.avatarOptions = {skin:SKIN, hairColor:HAIRC, hair:HAIR, eyes:EYES, mouth:MOUTH, beard:["none","stubble","beard"]};
})(window.Studs);
