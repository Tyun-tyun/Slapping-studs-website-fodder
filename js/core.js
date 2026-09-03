/* ============================================================
   core.js — shared state, storage, permission checks, helpers
   and the record schema used by the admin console.

   Load order matters: data.js and auth.js must come first,
   then this file, then views.js, admin.js, app.js.
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
    session:  null,   // {role,name,sub,email} or null
    defaults: {},     // original text of every [data-ed] block
    editing:  false,  // inline edit mode on/off
    plFilter: "All",  // roster team filter
    adTab:    "news", // admin console collection
    lastDeleted: null // for the undo toast
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
      return raw ? JSON.parse(raw) : S.clone(S.seed);
    }catch(e){ return S.clone(S.seed); }
  };
  S.save = function(){
    try{ localStorage.setItem(S.KEY_CONTENT, JSON.stringify(S.state.content)); }catch(e){}
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

  S.signIn = function(roleName){
    var acc = S.accounts.filter(function(a){ return a.role === roleName; })[0];
    if(!acc) return;
    S.state.session = {role:acc.role, name:acc.name, sub:acc.sub, email:acc.email};
    S.saveSession();
    S.setEditing(false);
    S.renderAll();
    S.toast("Signed in as " + acc.name + " · " + acc.role);
    location.hash = acc.role === "admin" ? "#/admin" : "#/home";
    S.route();
  };
  S.signOut = function(){
    S.state.session = null;
    S.saveSession();
    S.setEditing(false);
    S.renderAll();
    location.hash = "#/home";
    S.route();
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
               ["status","Status","select:published,draft"]]},

    events:  {label:"Events", cols:["title","dd","mm","kind"], fields:[
               ["dd","Day","text"],["mm","Month","text"],["title","Title","text"],
               ["meta","Time & place","text"],["kind","Home / away","select:,home,away"]]},

    stats:   {label:"Achievements", cols:["v","k","n"], fields:[
               ["k","Label above","text"],["v","Big value","text"],["n","Label below","text"]]},

    players: {label:"Players", cols:["no","name","pos","team"], fields:[
               ["no","Number","text"],["name","Name","text"],
               ["pos","Position","select:Forward,Defence,Goaltender"],
               ["team","Team","select:Stallions,Studs 1,Studs 2,Rookies"],
               ["gp","Games played","text"],["g","Goals","text"],
               ["a","Assists","text"],["pim","Penalty minutes","text"]]},

    games:   {label:"Games", cols:["date","team","fixture","result"], fields:[
               ["date","Date","text"],["team","Team","select:Stallions,Studs 1,Studs 2"],
               ["fixture","Fixture","text"],["venue","Venue","text"],
               ["result","Result","text"],["outcome","Outcome","select:,w,l"]]},

    comps:   {label:"Competitions", cols:["title","body"], fields:[
               ["title","Title","text"],["body","Description","textarea"]]},

    albums:  {label:"Photo albums", cols:["title","meta","vis"], fields:[
               ["title","Album title","text"],["meta","Meta line","text"],
               ["vis","Visible to","select:public,member,coach"]]},

    board:   {label:"Board members", cols:["name","role","email"], fields:[
               ["name","Name","text"],["role","Role","text"],["email","E-mail","text"]]},

    timeline:{label:"History timeline", cols:["yr","lb","body"], fields:[
               ["yr","Year","text"],["lb","Marker label","text"],["body","Description","textarea"]]},

    gear:    {label:"Gear", cols:["when","title"], fields:[
               ["when","Priority label","text"],["title","Item","text"],["body","Description","textarea"]]},

    rules:   {label:"Rules", cols:["n","title"], fields:[
               ["n","Number","text"],["title","Rule","text"],["body","Explanation","textarea"]]},

    steps:   {label:"Training steps", cols:["n","title"], fields:[
               ["n","Step label","text"],["title","Title","text"],["body","Description","textarea"]]},

    archive: {label:"Archive seasons", cols:["season","posts","highlight"], fields:[
               ["season","Season","text"],["posts","Post count","text"],
               ["highlight","Highlight","text"],["tags","Tags","text"]]}
  };

})(window.Studs);
