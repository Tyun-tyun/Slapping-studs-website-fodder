/* ============================================================
   core.js — shared state, storage, permission checks, helpers
   and the record schema used by the admin console.

   Load order matters: data.js, auth.js and routes.js must come
   first, then this file, then views.js, admin.js, app.js.
   ============================================================ */

window.Studs = window.Studs || {};

(function(S){
  "use strict";

  /* ---------- storage keys ---------------------------------
     Bump the version suffix if the shape of the data changes,
     so returning visitors are not left with a stale structure. */
  S.KEY_CONTENT = "studs.content.v2";
  S.KEY_SESSION = "studs.session.v2";

  /* ---------- runtime state -------------------------------- */
  S.state = {
    content:  null,   // the live copy of Studs.seed
    session:  null,   // {role,name,sub,email,editing} or null
    defaults: {},     // original text of every [data-ed] block
    editing:  false,  // inline edit mode on/off (kept in the session,
                      //   so it survives moving between pages)
    plFilter: "All",  // roster team filter
    statFilter:"All",  // stats squad filter
    statSort: "pts",   // stats table column: pts | g | a | gp | pim
    statAll:  false,   // stats table: false = top 15, true = every skater
    picFilter:"all",  // gallery section filter (games/tournaments/promo/coach)
    openAlbum:null,   // album id when an album is opened
    pgSeason: "all",  // past-games season filter
    gTeam:    "all",  // this-season team filter (games.html)
    adTab:    "news", // admin console collection
    lastDeleted: null,// for the undo toast
    joinSent: null,   // the sign-up just submitted, for the thank-you state
    calMonth: 3        // home calendar - 0-based month, starts on April
                        //   (2026: where the seeded events collection begins)
  };

  /* ---------- tiny helpers --------------------------------- */
  S.$  = function(sel,root){ return (root||document).querySelector(sel); };
  S.$$ = function(sel,root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); };
  S.clone = function(o){ return JSON.parse(JSON.stringify(o)); };
  S.uid = function(){ return "x"+Math.random().toString(36).slice(2,8); };

  /* Always escape anything that came from the CMS before it
     goes into innerHTML. The one exception is copy overrides,
     which are authored by an admin and may contain markup. */
  S.esc = function(v){
    return String(v==null?"":v).replace(/[&<>"]/g,function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c];
    });
  };

  /* ---------- persistence ----------------------------------
     localStorage can throw (private windows, blocked storage),
     so every read and write is wrapped. A failure degrades to
     the seeded content rather than breaking the page. */
  S.load = function(){
    try{
      var raw = localStorage.getItem(S.KEY_CONTENT);
      if(!raw) return S.clone(S.seed);
      var c = JSON.parse(raw);
      /* content saved before a collection existed gets that
         collection's seed rows, so a new screen is never empty */
      Object.keys(S.seed).forEach(function(k){ if(c[k] === undefined) c[k] = S.clone(S.seed[k]); });
      /* "comps" once held the history chapters (rows with a "nav" and
         no "title"). A browser that saved content back then still has
         one of them where a competition belongs, and it shows up as a
         card without a name. Such a row is swapped for the seed row
         with the same id; every other saved row is left as it is. */
      /* The same goes for the competition texts that used to be one
         short paragraph: a saved row whose body is still a single
         paragraph, where the seed row now has several, takes the
         longer seed text. A row an editor has since written to more
         than one paragraph is never touched. */
      if(Array.isArray(c.comps)) c.comps = c.comps.map(function(r){
        var s = r && (S.seed.comps || []).filter(function(x){ return x.id === r.id; })[0];
        if(!s) return r;
        var paras = function(t){ return String(t || "").split(/\n{2,}/).filter(Boolean).length; };
        if(!r.title || (paras(r.body) <= 1 && paras(s.body) > 1)) return S.clone(s);
        return r;
      });
      return c;
    }catch(e){ return S.clone(S.seed); }
  };
  S.save = function(){
    try{
      localStorage.setItem(S.KEY_CONTENT, JSON.stringify(S.state.content));
      return true;
    }catch(e){
      /* Almost always the 5 MB quota, hit by uploaded photos.
         Fail loudly — silently dropping someone's upload is worse. */
      S.toast("Storage full — delete some photos before adding more");
      return false;
    }
  };

  /* ---------- uploaded images ------------------------------
     Photos live as data URLs in content.images, keyed by slot
     ("hero", "news:n1", "player:pl01", "album:al1"). Album
     photo arrays hold their data URLs directly. */
  S.getImage = function(slot){ return (S.state.content.images||{})[slot] || ""; };
  S.setImage = function(slot,dataUrl){
    if(!S.state.content.images) S.state.content.images = {};
    S.state.content.images[slot] = dataUrl;
    return S.save();
  };
  S.clearImage = function(slot){
    if(S.state.content.images) delete S.state.content.images[slot];
    S.save();
  };

  /* Rough size of what we are storing, for the Danger zone. */
  S.storageUsed = function(){
    try{
      var bytes = new Blob([JSON.stringify(S.state.content)]).size;
      return (bytes/1048576).toFixed(2) + " MB";
    }catch(e){ return "unknown"; }
  };

  /* Read a File, downscale it on a canvas and hand back a data
     URL. Full-size camera files would blow the storage quota in
     three uploads, so everything is resized on the way in. */
  S.readImageFile = function(file, maxW, cb){
    if(!file || !/^image\//.test(file.type)){ S.toast("That is not an image file"); return; }
    var reader = new FileReader();
    reader.onload = function(ev){
      var img = new Image();
      img.onload = function(){
        var scale = Math.min(1, maxW / img.width);
        var w = Math.round(img.width*scale), h = Math.round(img.height*scale);
        var c = document.createElement("canvas");
        c.width = w; c.height = h;
        c.getContext("2d").drawImage(img,0,0,w,h);
        cb(c.toDataURL("image/jpeg",0.78));
      };
      img.onerror = function(){ S.toast("Could not read that image"); };
      img.src = ev.target.result;
    };
    reader.onerror = function(){ S.toast("Could not read that file"); };
    reader.readAsDataURL(file);
  };

  /* One reusable hidden file input for every uploader on the page. */
  S.pickImage = function(opts){
    var input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if(opts.multiple) input.multiple = true;
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", function(){
      var files = Array.prototype.slice.call(input.files || []);
      var done = 0, results = [];
      if(!files.length){ input.remove(); return; }
      files.forEach(function(f,i){
        S.readImageFile(f, opts.maxW || 1200, function(url){
          results[i] = url; done++;
          if(done === files.length){ opts.onPick(results.filter(Boolean)); input.remove(); }
        });
      });
    });
    input.click();
  };
  S.loadSession = function(){
    try{ var raw = localStorage.getItem(S.KEY_SESSION); return raw ? JSON.parse(raw) : null; }
    catch(e){ return null; }
  };
  S.saveSession = function(){
    try{
      if(S.state.session) localStorage.setItem(S.KEY_SESSION, JSON.stringify(S.state.session));
      else localStorage.removeItem(S.KEY_SESSION);
    }catch(e){}
  };
  S.reset = function(){ S.state.content = S.clone(S.seed); S.save(); };

  /* ---------- permissions ----------------------------------
     One check for the whole site. Anything gated calls this. */
  S.role = function(){ return S.state.session ? S.state.session.role : "guest"; };
  S.can = function(cap){
    var list = S.perms[S.role()] || [];
    return list.indexOf("*") > -1 || list.indexOf(cap) > -1;
  };
  S.isAdmin = function(){ return S.role() === "admin"; };

  /* Signing in from the sign-in page means "take me in", so it
     navigates. From anywhere else — the account menu on a normal
     page — it only changes what this page shows. */
  S.signIn = function(roleName){
    var acc = S.accounts.filter(function(a){ return a.role === roleName; })[0];
    if(!acc) return;
    S.state.session = {role:acc.role, name:acc.name, sub:acc.sub, email:acc.email, editing:false};
    S.saveSession();
    S.setEditing(false);
    if(S.page() === "signin"){
      /* members and coaches land in their own area; the board in
         the console it signs in to run */
      location.href = acc.role === "admin" || acc.role === "moderator" ? S.url("admin") : S.accountUrl();
      return;
    }
    S.renderAll();
    S.toast("Signed in as " + acc.name + " · " + acc.role);
  };

  /* Signing out of a gated page has to leave it; signing out of
     a public one just re-renders it signed out. */
  S.signOut = function(){
    var leaving = !!S.GATED[S.page()];
    S.setEditing(false);
    S.state.session = null;
    S.saveSession();
    if(leaving){ location.href = S.url("home"); return; }
    S.renderAll();
    S.toast("Signed out");
  };

  /* ---------- toast ----------------------------------------
     Also used for the undo after a delete. */
  var toastTimer = null;
  S.toast = function(msg, actionLabel, fn){
    var t = S.$("#toast");
    if(!t) return;
    t.innerHTML = '<span>'+S.esc(msg)+'</span>' +
      (actionLabel ? '<button id="toastact">'+S.esc(actionLabel)+'</button>' : '');
    t.classList.add("on");
    if(fn){ S.$("#toastact").onclick = function(){ t.classList.remove("on"); fn(); }; }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ t.classList.remove("on"); }, 4200);
  };

  /* ---------- record schema --------------------------------
     Drives both the admin console tables and the edit drawer.
     field = [key, label, type]
     type  = "text" | "textarea" | "select:a,b,c"
     cols  = which keys show as columns in the console table   */
  S.schema = {
    news:    {label:"News posts", cols:["title","date","tag","status"], fields:[
               ["title","Headline","text"],["date","Date","text"],["tag","Tag","text"],
               ["author","Author","text"],["excerpt","Excerpt","textarea"],
               ["body","Full text - a blank line starts a new paragraph","textarea"],
               ["status","Status","select:published,draft"]]},

    events:  {label:"Events", cols:["title","dd","mm","kind"], fields:[
               ["dd","Day","text"],["mm","Month","text"],["title","Title","text"],
               ["meta","Time & place","text"],["kind","Home / away","select:,home,away"],
               ["team","Squad that plays it (games only)","select:,Studs 1,Studs 2,Stallions,Cadets"]]},

    announcements:{label:"Announcements", cols:["tag","text","when"], fields:[
               ["tag","Tag","text"],["text","Announcement","textarea"],
               ["when","Posted","text"]]},

    stats:   {label:"Achievements", cols:["v","k","n"], fields:[
               ["k","Label above","text"],["v","Big value","text"],["n","Label below","text"]]},

    players: {label:"Players", cols:["no","name","pos","team"], fields:[
               ["no","Number","text"],["name","Name","text"],
               ["pos","Position","select:Goaltender,Defence,Forward"],
               ["team","Team","select:Studs 1,Studs 2,Stallions,Cadets"]]},

    staff:   {label:"Coaching staff", cols:["name","role"], fields:[
               ["name","Name","text"],["role","Role","text"]]},

    games:   {label:"Games", cols:["date","team","fixture","result"], fields:[
               ["date","Date","text"],["team","Team","select:Stallions,Studs 1,Studs 2,Cadets"],
               ["fixture","Fixture","text"],["venue","Venue","text"],
               ["result","Result","text"],["outcome","Outcome","select:,w,l"]]},

    pastgames:{label:"Past games", cols:["season","date","team","fixture","result"], fields:[
               ["season","Season","text"],["date","Date","text"],
               ["team","Team","select:Stallions,Studs 1,Studs 2,Cadets"],
               ["fixture","Fixture","text"],["venue","Venue","text"],
               ["result","Result","text"],["outcome","Outcome","select:,w,l"]]},

    /* One game sheet = one gamesheets record plus its rows in
       sheetgoals / sheetpens / sheetlineup, all keyed by "game"
       = the id of the fixture in games[] or pastgames[]. Flat
       records on purpose: the drawer edits one row at a time and
       the schema type set is text / textarea / select only. */
    gamesheets:{label:"Game sheets", cols:["game","home","away","hs","as"], fields:[
               ["game","Fixture id (games / past games)","text"],
               ["comp","Competition line (e.g. 6th Division North \u00b7 Game 5)","text"],
               ["home","Home team","text"],["away","Away team","text"],
               ["homeRec","Home record before the game (W\u2013L\u2013OTW)","text"],
               ["awayRec","Away record before the game","text"],
               ["hs","Home goals","text"],["as","Away goals","text"],
               ["status","Final status","select:FT,OT,SO"],
               ["hp","Home goals by period (e.g. 1-2-2)","text"],
               ["ap","Away goals by period (e.g. 2-1-0)","text"],
               ["date","Date","text"],["faceoff","Face-off","text"],
               ["venue","Venue","text"],["refs","Referees","text"],
               ["star1","First star","text"],["star1line","First star \u2014 line","text"],
               ["star2","Second star","text"],["star2line","Second star \u2014 line","text"],
               ["star3","Third star","text"],["star3line","Third star \u2014 line","text"],
               ["report","Game report \u2014 a blank line starts a new paragraph","textarea"]]},

    sheetgoals:{label:"Sheet \u00b7 goals", cols:["game","per","time","team","scorer"], fields:[
               ["game","Fixture id","text"],["per","Period","select:1,2,3,OT,SO"],
               ["time","Time","text"],["team","Team code","text"],
               ["scorer","Scorer","text"],["assists","Assists","text"],
               ["sit","Situation","select:EV,PP,SH,EN,PS"],["score","Score after","text"]]},

    sheetpens:{label:"Sheet \u00b7 penalties", cols:["game","per","time","player","inf"], fields:[
               ["game","Fixture id","text"],["per","Period","select:1,2,3,OT"],
               ["time","Time","text"],["player","Team \u00b7 number \u00b7 player","text"],
               ["inf","Infraction","text"],["min","Minutes","text"]]},

    sheetlineup:{label:"Sheet \u00b7 lineup", cols:["game","side","pos","no","name"], fields:[
               ["game","Fixture id","text"],["side","Side","select:home,away"],
               ["pos","Position","select:Goalies,Defense,Forwards"],
               ["no","Number","text"],["name","Name","text"],
               ["stat","Stat (G/A/PIM, or saves for a goalie)","text"]]},

    standings:{label:"Standings", cols:["div","pos","team","pts"], fields:[
               ["div","Division","select:6th Division North,5th Division North"],
               ["pos","Position","text"],["team","Team","text"],
               ["gp","Games played","text"],["w","Won","text"],
               ["otw","Won in OT or shootout","text"],["l","Lost","text"],
               ["gd","Goal difference","text"],["pts","Points","text"],
               ["us","A Studs squad","select:,yes"]]},

    sessions:{label:"Training sessions", cols:["day","t1","t2"], fields:[
               ["day","Day","text"],["len","Line under the day","text"],
               ["g1","First slot - who","text"],["t1","First slot - time","text"],
               ["g2","Second slot - who","text"],["t2","Second slot - time","text"],
               ["rule","Weeks of the month, e.g. 1,3,5 (empty = every week)","text"]]},

    kit:     {label:"Bring / loan kit", cols:["item","loan"], fields:[
               ["item","Item","text"],["loan","Starts with Yes = the club lends it; otherwise you bring it","text"]]},

    comps:   {label:"Competitions", cols:["title","body"], fields:[
               ["title","Title","text"],["body","Description","textarea"]]},

    albums:  {label:"Photo albums", cols:["title","meta","cat","vis"], fields:[
               ["title","Album title","text"],["meta","Meta line","text"],
               ["cat","Section","select:games,tournaments,promo,coach"],
               ["vis","Visible to","select:public,member,coach"]]},

    signups: {label:"Sign-ups", cols:["name","email","experience","status"], fields:[
               ["name","Name","text"],["email","E-mail","text"],
               ["study","Student status","text"],["experience","Experience","text"],
               ["session","Session wanted","text"],["note","Note","textarea"],
               ["date","Received","text"],
               ["status","Status","select:new,contacted,joined,declined"]]},

    board:   {label:"Board members", cols:["name","role","email"], fields:[
               ["name","Name","text"],["role","Role","text"],["email","E-mail","text"]]},

    timeline:{label:"History timeline", cols:["yr","lb","body"], fields:[
               ["yr","Year / label (set large)","text"],
               ["lb","Headline","text"],
               ["body","One or two sentences","textarea"],
               ["cap","Caption line (place · date)","text"]]},

    chapters:{label:"History chapters", cols:["yr","nav","kicker"], fields:[
               ["yr","Year or period, set large and used in the rail (e.g. 1982, 1990s)","text"],
               ["kicker","Date note (admin list only, not shown on the page)","text"],
               ["nav","Nav label","text"],
               ["h","Heading — use \\n for a line break","text"],
               ["lead","Lead line (optional, larger)","textarea"],
               ["body","Body — blank line starts a new paragraph","textarea"],
               ["quote","Pull quote (optional)","textarea"],
               ["cap","Photo caption (optional)","text"],
               ["img","Photo file (assets/…)","text"],
               ["credit","Photo credit (photographer, licence)","text"],
               ["creditUrl","Credit link","text"],
               ["shots","Photo slots","select:0,1"],
               ["media","Photo placement","select:side,wide"]]},

    gear:    {label:"Gear", cols:["when","title"], fields:[
               ["when","Priority label","text"],["title","Item","text"],["body","Description","textarea"]]},

    rules:   {label:"Rules", cols:["n","title"], fields:[
               ["n","Number","text"],["title","Rule","text"],["body","Explanation","textarea"]]},

    steps:   {label:"Training steps", cols:["n","title"], fields:[
               ["n","Step label","text"],["title","Title","text"],["body","Description","textarea"]]},

    /* Member area (account.html). who = an account id from auth.js. */
    travel:  {label:"Travel to away games", cols:["ev","name","how","drive"], fields:[
               ["ev","Event id (e1…)","text"],["name","Name","text"],["who","Account id (empty if none)","text"],
               ["going","Going","select:yes,no"],["how","How","select:van,car"],["drive","Can drive","select:yes,no"]]},

    points:  {label:"Member points", cols:["who","value"], fields:[
               ["who","Account id (u1, u2, u3)","text"],["value","Points (0–10)","text"]]},

    pointsrule: {label:"Member points rule", cols:["need","max"], fields:[
               ["need","Points needed","text"],["max","Top of the scale","text"]]},

    archive: {label:"Archive seasons", cols:["season","posts","highlight"], fields:[
               ["season","Season","text"],["posts","Post count","text"],
               ["highlight","Highlight","text"],["tags","Tags","text"]]}
  };

})(window.Studs);
