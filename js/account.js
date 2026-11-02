/* ============================================================
   account.js — the member area (account.html).

   One document, one view per area, chosen by ?v= in the URL:
     overview   the next two weeks, replies, member points, events
     schedule   training and club events: I'm in / I'm out
     games      each game: who can play, who travels and how
     game       one game on its own page (?v=game&id=e1)
     profile    avatar, details, privacy

   Everything renders from the content collections (js/data.js:
   profiles, rsvps, avail, travel, points, pointsrule, plus the
   club's own sessions, events, players and announcements) and from
   the signed-in account in js/auth.js. Changes are written back
   with Studs.save(), exactly like the admin console.

   THE DATE. The site's season data ends in April 2026, so the
   member area runs on a fixed demo "today" (S.demoToday). On the
   real site this becomes new Date() and the data comes from the
   server.

   SAMPLE REPLIES. Roster players have no accounts, so their replies
   to practices and games are generated from their id and the date
   (sampleReply) - the same answer on every load. The three demo
   accounts' own replies are real records. Replace both with the
   server's data.

   Loaded on account.html only, after views.js and admin.js, before
   app.js. app.js boots the page and calls renderAll(), which calls
   S.renderLK() at the right moment.
   ============================================================ */

(function(S){
  "use strict";

  var $ = S.$, $$ = S.$$, esc = S.esc;

  S.demoToday = new Date(2026, 3, 7);   // Tuesday 7 April 2026
  var VAN = 9;                          // places in the club van, the driver included

  var VIEWS = [
    {id:"overview", label:"Overview"},
    {id:"schedule", label:"Training"},
    {id:"games",    label:"Games & lifts"},
    {id:"points",   label:"Member points", cap:"points.edit"},
    {id:"profile",  label:"Profile"}
  ];

  function C(){ return S.state.content; }
  function col(name){ return C()[name] || (C()[name] = []); }

  /* ---------------- dates ---------------------------------- */
  var DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var MON  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  function iso(d){
    return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
  }
  function parse(s){
    var p = String(s||"").split("-").map(Number);
    return p.length === 3 && p[0] ? new Date(p[0], p[1]-1, p[2]) : null;
  }
  function addDays(d, n){ var x = new Date(d); x.setDate(x.getDate()+n); return x; }
  function daysBetween(a, b){ return Math.round((b - a) / 86400000); }
  function fmtDay(d){ return DAYS[d.getDay()].slice(0,3)+" "+d.getDate()+" "+MON[d.getMonth()]; }
  function fmtLong(d){ return DAYS[d.getDay()]+" "+d.getDate()+" "+MON[d.getMonth()]; }
  function relDay(d){
    var n = daysBetween(S.demoToday, d);
    if(n === 0) return "today";
    if(n === 1) return "tomorrow";
    if(n === -1) return "yesterday";
    return n > 0 ? "in "+n+" days" : n*-1+" days ago";
  }
  function dash(t){ return String(t||"").replace(/\s*-\s*/g, "–"); }

  /* events carry "12" + "Apr"; the seed is one season, 2026 */
  function eventDate(e){
    var m = MON.indexOf(String(e.mm||"").slice(0,3));
    return m < 0 ? null : new Date(2026, m, Number(e.dd));
  }
  function eventTime(e){ return String(e.meta||"").split("·")[0].trim(); }
  function eventPlace(e){ var p = String(e.meta||"").split("·"); return p.length > 1 ? p.slice(1).join("·").trim() : ""; }
  function isGame(e){ return e.kind === "home" || e.kind === "away"; }

  /* ---------------- who is signed in ------------------------ */
  function me(){
    var s = S.state.session;
    return s ? (S.accounts.filter(function(a){ return a.role === s.role; })[0] || null) : null;
  }
  function profile(acc){
    var p = col("profiles").filter(function(r){ return r.id === acc.id; })[0];
    if(!p){ p = {id:acc.id, shirt:"", emergency:"", photo:"yes", roster:"yes", avatar:{}}; col("profiles").push(p); }
    if(!p.avatar) p.avatar = {};
    return p;
  }
  /* the account drawn as a roster card */
  function asPlayer(acc){
    return {id:acc.id, name:acc.name, team:acc.team, pos:acc.pos, no:acc.no, avatar:profile(acc).avatar};
  }

  /* ---------------- sample replies for roster players -------- */
  function hash(str){
    var h = 2166136261;
    for(var i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  /* about 6 in 10 say they are in, 2 in 10 out, the rest have not replied */
  function sampleReply(pid, key){
    var n = hash(pid+"|"+key) % 100;
    return n < 60 ? "in" : n < 78 ? "out" : "";
  }

  /* ---------------- member points ----------------------------
     One number per member, from 0 to the top of the scale; the
     board and the coaches set it, and the board sets how many are
     needed. Both live in the admin console.                      */
  function pointsRule(){
    var r = col("pointsrule")[0] || {};
    var max = Math.max(Number(r.max) || 10, 1);
    return {need:Math.min(Math.max(Number(r.need) || 4, 0), max), max:max};
  }
  function pointsFor(id){
    var r = col("points").filter(function(x){ return x.who === id; })[0];
    return r ? Math.max(Number(r.value) || 0, 0) : 0;
  }
  function pointsOf(acc){ return pointsFor(acc.id); }
  function setPoints(id, v){
    var rule = pointsRule(), list = col("points"), r = list.filter(function(x){ return x.who === id; })[0];
    v = String(Math.min(Math.max(v, 0), rule.max));
    if(r) r.value = v; else list.push({id:S.uid(), who:id, value:v});
  }

  /* ---------------- training calendar ------------------------
     One practice per session per date: the first group's start to
     the last group's end. Friday only in the weeks the session's
     rule names (1st, 3rd, 5th). Groups are not shown in the member
     area for now.                                                */
  function slots(from, days){
    var out = [];
    for(var i=0;i<days;i++){
      var d = addDays(from, i), dayName = DAYS[d.getDay()];
      C().sessions.forEach(function(s){
        if(s.day !== dayName) return;
        if(s.rule){
          var week = Math.ceil(d.getDate()/7);
          if(String(s.rule).split(",").map(Number).indexOf(week) < 0) return;
        }
        var ts = [s.t1, s.t2].filter(Boolean).map(dash);
        if(!ts.length) return;
        var time = ts[0].split("–")[0].trim()+"–"+ts[ts.length-1].split("–").pop().trim();
        out.push({key:iso(d)+"#"+s.id, date:iso(d), d:d, time:time, session:s});
      });
    }
    return out;
  }
  function rsvpOf(who, date){
    var r = col("rsvps").filter(function(x){ return x.who === who && x.date === date; })[0];
    return r ? r.status : "";
  }
  function setRsvp(who, date, status){
    var list = col("rsvps"), r = list.filter(function(x){ return x.who === who && x.date === date; })[0];
    if(r) r.status = status; else list.push({id:S.uid(), who:who, date:date, status:status});
  }
  /* the roster's generated replies for one practice */
  function goingCount(date){
    return C().players.filter(function(p){ return sampleReply(p.id, date) === "in"; }).length;
  }

  /* ---------------- games and events ------------------------- */
  function upcomingEvents(){
    return C().events.map(function(e){ return {e:e, d:eventDate(e)}; })
      .filter(function(x){ return x.d && daysBetween(S.demoToday, x.d) >= 0; })
      .sort(function(a,b){ return a.d - b.d; });
  }
  function eventById(id){
    var e = C().events.filter(function(x){ return x.id === id; })[0];
    return e ? {e:e, d:eventDate(e)} : null;
  }
  function availOf(who, ev){
    var r = col("avail").filter(function(x){ return x.who === who && x.ev === ev; })[0];
    return r ? r.status : "";
  }
  function setAvail(who, ev, status){
    var list = col("avail"), r = list.filter(function(x){ return x.who === who && x.ev === ev; })[0];
    if(r) r.status = status; else list.push({id:S.uid(), who:who, ev:ev, status:status});
  }

  /* a squad's answers for one game, as names: the roster's generated
     replies plus the signed-in member's own when it is their squad */
  function squadAnswers(acc, e){
    var out = {yes:[], maybe:[], no:[], none:[]};
    C().players.filter(function(p){ return p.team === e.team; }).forEach(function(p){
      var r = sampleReply(p.id, e.id);
      out[r === "in" ? "yes" : r === "out" ? "no" : "none"].push(p);
    });
    if(acc.team && acc.team === e.team){
      var mine = availOf(acc.id, e.id);
      out[mine === "yes" ? "yes" : mine === "maybe" ? "maybe" : mine === "no" ? "no" : "none"].push({name:acc.name, pos:acc.pos, mine:true});
    }
    out.total = out.yes.length + out.maybe.length + out.no.length + out.none.length;
    out.goalies = out.yes.filter(function(p){ return p.pos === "Goaltender"; }).length;
    return out;
  }
  function names(list){ return list.map(function(p){ return p.name+(p.mine ? " (you)" : ""); }).join(", "); }

  /* ---------------- travel to an away game ------------------- */
  function tripRow(acc, ev){
    return col("travel").filter(function(r){ return r.ev === ev && r.who === acc.id; })[0] || null;
  }
  function going(ev){ return col("travel").filter(function(r){ return r.ev === ev && r.going === "yes"; }); }
  function vanPeople(ev){ return going(ev).filter(function(r){ return r.how === "van"; }); }
  function carPeople(ev){ return going(ev).filter(function(r){ return r.how === "car"; }); }
  function setTrip(acc, ev, key, val){
    var r = tripRow(acc, ev);
    if(!r){ r = {id:S.uid(), ev:ev, who:acc.id, name:acc.name, going:"", how:"", drive:""}; col("travel").push(r); }
    if(key === "going"){
      r.going = val;
      if(val === "yes" && !r.how){ r.how = vanPeople(ev).length < VAN ? "van" : "car"; r.drive = r.drive || "no"; }
    }else if(key === "how"){
      if(val === "van" && !(r.going === "yes" && r.how === "van") && vanPeople(ev).length >= VAN){
        S.toast("The van is full"); return false;
      }
      r.how = val;
    }else{
      r.drive = val;
    }
    return true;
  }

  /* ---------------- what needs a reply ----------------------- */
  function openReplies(acc, days){
    var list = [];
    if(acc.team){
      slots(S.demoToday, days).forEach(function(s){
        if(!rsvpOf(acc.id, s.date)) list.push({kind:"practice", d:s.d, slot:s});
      });
    }
    upcomingEvents().forEach(function(x){
      if(daysBetween(S.demoToday, x.d) >= days) return;
      var mine = !isGame(x.e) || x.e.team === acc.team;
      if(mine && acc.team && !availOf(acc.id, x.e.id)) list.push({kind:isGame(x.e)?"game":"event", d:x.d, e:x.e});
    });
    return list.sort(function(a,b){ return a.d - b.d; });
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function currentView(acc){
    var v = S.query("v") || "overview";
    var def = VIEWS.filter(function(x){ return x.id === v; })[0];
    if(def && def.cap && !S.can(def.cap)) return "overview";
    if(v === "game") return eventById(S.query("id")) ? "game" : "games";
    return def ? v : "overview";
  }

  S.renderLK = function(){
    if(!$("#lk")) return;
    var acc = me();
    if(!acc) return;
    var v = currentView(acc);
    renderSide(acc, v);
    var body = {overview:viewOverview, schedule:viewSchedule, games:viewGames, game:viewGame, points:viewPoints, profile:viewProfile}[v](acc);
    $("#lkmain").innerHTML = body;
    $("#lkmain").dataset.view = v;
    var def = VIEWS.filter(function(x){ return x.id === v; })[0];
    document.title = (def ? def.label : "Game") + " — My account — The Slapping Studs";
    bindOnce();
  };

  function renderSide(acc, v){
    var staff = !acc.team;
    var need = openReplies(acc, 7).length;
    var rc = acc.role === "admin" ? "a" : acc.role === "coach" ? "c" : "m";
    $("#lkside").innerHTML =
      '<div class="lk-me">'+
        '<div class="lk-face">'+S.avatarSVG(asPlayer(acc), {staff:staff})+'</div>'+
        '<div><div class="lk-name">'+esc(acc.name)+'</div>'+
        '<div class="lk-scope"><span class="dot '+rc+'"></span>'+esc(acc.sub)+'</div></div>'+
      '</div>'+
      '<nav class="lk-nav" aria-label="Member area">'+
      VIEWS.filter(function(x){ return !x.cap || S.can(x.cap); }).map(function(x){
        var count = x.id === "overview" && need ? '<span class="lk-count" title="Replies needed this week">'+need+'</span>' : "";
        var cur = x.id === v || (v === "game" && x.id === "games");
        return '<a href="'+S.accountUrl(x.id)+'" data-lkview="'+x.id+'"'+(cur ? ' aria-current="page"' : "")+'>'+
               esc(x.label)+count+'</a>';
      }).join("")+
      '</nav>'+
      '<div class="lk-sidefoot">'+
        (S.can("console.use") ? '<a href="'+S.url("admin")+'">Admin console</a>' : "")+
        '<button type="button" data-act="signout">Sign out</button>'+
      '</div>';
  }

  function head(title, sub, actions){
    return '<div class="lk-head"><div><h1 class="lk-title">'+esc(title)+'</h1>'+
      (sub ? '<p class="lk-sub">'+sub+'</p>' : "")+'</div>'+
      (actions ? '<div class="lk-actions">'+actions+'</div>' : "")+'</div>';
  }
  function seg(attr, value, options, current){
    return '<div class="lk-seg" role="group">'+options.map(function(o){
      var on = o[0] === current;
      return '<button type="button" '+attr+'="'+esc(value+"|"+o[0])+'" aria-pressed="'+on+'"'+
        (on ? ' class="on '+o[0]+'"' : "")+'>'+esc(o[1])+'</button>';
    }).join("")+'</div>';
  }
  function pill(kind, text){ return '<span class="lk-pill '+kind+'">'+esc(text)+'</span>'; }

  /* ---------------- overview --------------------------------
     Question: what do I need to sort out this week?           */
  function viewOverview(acc){
    var open = openReplies(acc, 7), rule = pointsRule(), pts = pointsOf(acc);

    var facts = [];
    if(open.length) facts.push(open.length+(open.length === 1 ? " reply" : " replies")+" missing for the next 7 days");
    if(pts < rule.need) facts.push((rule.need - pts)+(rule.need - pts === 1 ? " more member point" : " more member points")+" needed");
    var finding = facts.length ? facts.join(", ").replace(/^./, function(c){ return c.toUpperCase(); })+"." : "Nothing waiting on you this week.";

    var h = head("Overview", esc(finding));
    h += weekCard(acc);
    h += '<div class="lk-grid lk-grid--2">';
    h += '<div class="lk-col">'+repliesCard(acc, open)+nextGameCard(acc)+'</div>';
    h += '<div class="lk-col">'+pointsCard(acc)+eventsCard(acc)+boardCard()+'</div>';
    h += '</div>';
    return h;
  }

  /* The next fourteen days as two rows of seven. Every day names
     itself; a practice says whether I'm in, a game says home or
     away, an event says what it is. Today has a dark frame. */
  function weekCard(acc){
    var days = 14, all = slots(S.demoToday, days), ev = upcomingEvents();
    function cell(i){
      var d = addDays(S.demoToday, i), id = iso(d), items = "", target = "schedule", gameId = "";
      all.filter(function(s){ return s.date === id; }).forEach(function(s){
        var r = acc.team ? rsvpOf(acc.id, s.date) : "staff";
        var word = r === "in" ? "You’re in" : r === "out" ? "You’re out" : r === "staff" ? "" : "No reply yet";
        items += '<span class="wk-item p '+(r || "open")+'"><b>Practice</b><span>'+esc(s.time)+'</span>'+(word ? '<span>'+word+'</span>' : "")+'</span>';
      });
      ev.filter(function(x){ return iso(x.d) === id; }).forEach(function(x){
        if(isGame(x.e)){
          var ours = x.e.team === acc.team || (acc.coaches||[]).indexOf(x.e.team) > -1;
          items += '<span class="wk-item g'+(ours ? " ours" : "")+'"><b>'+(x.e.kind === "home" ? "Home game" : "Away game")+'</b><span>'+esc(eventTime(x.e))+'</span><span>'+esc(x.e.team)+'</span></span>';
          if(!gameId){ gameId = x.e.id; target = "game"; }
        }else{
          items += '<span class="wk-item e"><b>Club event</b><span>'+esc(x.e.title)+'</span><span>'+esc(eventTime(x.e))+'</span></span>';
        }
      });
      var href = target === "game" ? S.accountUrl("game", gameId) : S.accountUrl("schedule")+"#d-"+id;
      return '<a class="wk-day'+(i === 0 ? " today" : "")+(items ? "" : " empty")+'" href="'+href+'" data-lkview="'+target+'">'+
        '<span class="wk-dh"><span class="wk-dn">'+DAYS[d.getDay()].slice(0,3)+'</span><span class="wk-dd">'+d.getDate()+'</span></span>'+items+'</a>';
    }
    function row(from, label){
      var out = "";
      for(var i=from;i<from+7;i++) out += cell(i);
      return '<h3 class="wk-label">'+label+' · '+fmtDay(addDays(S.demoToday, from))+' – '+fmtDay(addDays(S.demoToday, from+6))+'</h3><div class="wk-grid">'+out+'</div>';
    }
    return '<section class="lk-card"><div class="lk-cardhead"><h2>Your next two weeks</h2></div>'+
      row(0, "This week")+row(7, "Next week")+'</section>';
  }

  function replyRow(acc, x){
    if(x.kind === "practice"){
      return '<li class="lk-row"><div class="lk-when"><b>'+fmtDay(x.d)+'</b><span>'+esc(x.slot.time)+'</span></div>'+
        '<div class="lk-what"><b>Practice</b><span>IJsbaan Twente · '+relDay(x.d)+'</span></div>'+
        seg("data-rsvp", x.slot.date, [["in","I’m in"],["out","I’m out"]], "")+'</li>';
    }
    return '<li class="lk-row"><div class="lk-when"><b>'+fmtDay(x.d)+'</b><span>'+esc(eventTime(x.e))+'</span></div>'+
      '<div class="lk-what"><b>'+esc(x.e.title)+'</b><span>'+esc(eventPlace(x.e))+' · '+relDay(x.d)+'</span></div>'+
      seg("data-avail", x.e.id, x.kind === "game" ? [["yes","Can play"],["no","Can’t"]] : [["yes","Going"],["no","Not going"]], "")+'</li>';
  }
  function repliesCard(acc, open){
    if(!acc.team){
      return '<section class="lk-card"><div class="lk-cardhead"><h2>Needs a reply</h2></div>'+
        '<p class="lk-empty">Coaches don’t reply to practices. Who can play is on each game’s page under <a href="'+S.accountUrl("games")+'" data-lkview="games">Games &amp; lifts</a>.</p></section>';
    }
    return '<section class="lk-card"><div class="lk-cardhead"><h2>Needs a reply</h2><span class="lk-meta">'+open.length+' in the next 7 days</span></div>'+
      (open.length ? '<ul class="lk-list">'+open.slice(0,5).map(function(x){ return replyRow(acc, x); }).join("")+'</ul>'+
        (open.length > 5 ? '<a class="lk-more" href="'+S.accountUrl("schedule")+'" data-lkview="schedule">All '+open.length+' in Training</a>' : "")
        : '<p class="lk-empty">You’ve answered everything for the coming week.</p>')+
      '</section>';
  }
  function boardCard(){
    var a = C().announcements.slice(0,3);
    return '<section class="lk-card"><div class="lk-cardhead"><h2>From the board</h2><span class="lk-meta">'+C().announcements.length+' notices</span></div>'+
      (a.length ? '<ul class="lk-notes">'+a.map(function(x){
        return '<li><b>'+esc(x.tag)+'</b><p>'+esc(x.text)+'</p><span>'+esc(x.when)+'</span></li>';
      }).join("")+'</ul>' : '<p class="lk-empty">No notices from the board right now.</p>')+'</section>';
  }
  function nextGameCard(acc){
    var squads = acc.team ? [acc.team] : (acc.coaches||[]);
    var g = upcomingEvents().filter(function(x){ return isGame(x.e) && squads.indexOf(x.e.team) > -1; })[0];
    if(!g) return '<section class="lk-card"><div class="lk-cardhead"><h2>Next game</h2></div><p class="lk-empty">No games for your squad left this season.</p></section>';
    var t = squadAnswers(acc, g.e), mine = acc.team === g.e.team ? availOf(acc.id, g.e.id) : "";
    return '<section class="lk-card"><div class="lk-cardhead"><h2>Next game</h2><span class="lk-meta">'+relDay(g.d)+'</span></div>'+
      '<p class="lk-big">'+esc(g.e.title)+'</p>'+
      '<p class="lk-line">'+fmtLong(g.d)+' · '+esc(g.e.meta)+'</p>'+
      '<p class="lk-figure"><b class="num">'+t.yes.length+'</b><span> of '+t.total+' '+esc(g.e.team)+' players can play so far</span></p>'+
      (acc.team === g.e.team ? seg("data-avail", g.e.id, [["yes","Can play"],["maybe","Maybe"],["no","Can’t"]], mine) : "")+
      '<a class="lk-more" href="'+S.accountUrl("game", g.e.id)+'" data-lkview="game">Open the game page</a></section>';
  }

  /* Member points: one square per point on the scale, the ones I
     have filled in gold, the ones the club asks for outlined dark. */
  function pointsCard(acc){
    var rule = pointsRule(), pts = Math.min(pointsOf(acc), rule.max), sq = "";
    for(var i=1;i<=rule.max;i++){
      sq += '<i class="'+(i <= pts ? "on " : "")+(i <= rule.need ? "req" : "")+'"></i>';
    }
    var gap = rule.need - pts;
    return '<section class="lk-card"><div class="lk-cardhead"><h2>Member points</h2><span class="lk-meta">'+rule.need+' needed</span></div>'+
      '<p class="lk-figure"><b class="num">'+pts+'</b><span> of '+rule.max+'</span></p>'+
      '<div class="pts" role="img" aria-label="'+pts+' of '+rule.max+' member points, '+rule.need+' needed">'+sq+'</div>'+
      '<p class="lk-line pts-note">'+(gap > 0 ? gap+(gap === 1 ? " more point" : " more points")+" to reach the "+rule.need+" the club asks for." : "You have the "+rule.need+" points the club asks for.")+'</p></section>';
  }

  /* club events that are not games, with a reply */
  function eventsCard(acc){
    var evs = upcomingEvents().filter(function(x){ return !isGame(x.e); });
    return '<section class="lk-card"><div class="lk-cardhead"><h2>Club events</h2><span class="lk-meta">'+evs.length+' coming up</span></div>'+
      (evs.length ? '<ul class="lk-list lk-list--stack">'+evs.map(function(x){
        return '<li class="lk-row"><div class="lk-when"><b>'+fmtDay(x.d)+'</b><span>'+esc(eventTime(x.e))+'</span></div>'+
          '<div class="lk-what"><b>'+esc(x.e.title)+'</b><span>'+esc(eventPlace(x.e))+' · '+relDay(x.d)+'</span></div>'+
          (acc.team ? seg("data-avail", x.e.id, [["yes","Going"],["maybe","Maybe"],["no","Not going"]], availOf(acc.id, x.e.id)) : "")+'</li>';
      }).join("")+'</ul>' : '<p class="lk-empty">No club events planned yet.</p>')+'</section>';
  }

  /* ---------------- training --------------------------------
     Question: which practices am I going to? Practices and club
     events sit in one list, by week.                            */
  function viewSchedule(acc){
    var days = 21;
    var items = slots(S.demoToday, days).map(function(s){ return {d:s.d, practice:s}; });
    upcomingEvents().filter(function(x){ return !isGame(x.e) && daysBetween(S.demoToday, x.d) < days; })
      .forEach(function(x){ items.push({d:x.d, event:x.e}); });
    items.sort(function(a,b){ return a.d - b.d; });

    var sub = C().sessions.map(function(s){
      var t = dash(s.t1 || s.t2).split("–")[0].trim();
      return s.day+" "+t+(s.rule ? " (weeks "+s.rule.replace(/,/g, ", ")+")" : "");
    }).join(", ")+". IJsbaan Twente.";

    var h = head("Training", esc(sub));

    var weeks = {};
    items.forEach(function(it){ var w = Math.floor(daysBetween(S.demoToday, it.d) / 7); (weeks[w] = weeks[w] || []).push(it); });
    var body = Object.keys(weeks).map(function(w){
      var list = weeks[w], first = addDays(S.demoToday, w*7);
      var np = list.filter(function(it){ return it.practice; }).length;
      return '<section class="lk-card"><div class="lk-cardhead"><h2>'+(w === "0" ? "This week" : w === "1" ? "Next week" : "Week of "+fmtDay(first))+'</h2>'+
        '<span class="lk-meta">'+np+(np === 1 ? " practice" : " practices")+'</span></div><ul class="lk-list">'+
        list.map(function(it){
          if(it.practice){
            var s = it.practice, mine = rsvpOf(acc.id, s.date);
            return '<li class="lk-row" id="d-'+s.date+'"><div class="lk-when"><b>'+fmtDay(s.d)+'</b><span>'+esc(s.time)+'</span></div>'+
              '<div class="lk-what"><b>Practice</b><span>'+relDay(s.d)+' · '+goingCount(s.date)+' going so far</span></div>'+
              (acc.team ? seg("data-rsvp", s.date, [["in","I’m in"],["out","I’m out"]], mine) : "")+'</li>';
          }
          var e = it.event;
          return '<li class="lk-row lk-row--event" id="d-'+iso(it.d)+'"><div class="lk-when"><b>'+fmtDay(it.d)+'</b><span>'+esc(eventTime(e))+'</span></div>'+
            '<div class="lk-what"><b>'+esc(e.title)+'</b><span>Club event · '+esc(eventPlace(e))+' · '+relDay(it.d)+'</span></div>'+
            (acc.team ? seg("data-avail", e.id, [["yes","Going"],["maybe","Maybe"],["no","Not going"]], availOf(acc.id, e.id)) : "")+'</li>';
        }).join("")+'</ul></section>';
    }).join("");
    if(!items.length) body = '<section class="lk-card"><p class="lk-empty">No practices or events in the next three weeks.</p></section>';

    var rail = acc.team ? '<section class="lk-card"><div class="lk-cardhead"><h2>In your own calendar</h2></div>'+
        '<p class="lk-line">Every practice you haven’t said no to for the next six weeks, plus the games and events you’re going to, as one file for Google, Apple or Outlook calendar.</p>'+
        '<button type="button" class="lk-btn" data-ics="1">Download calendar file</button></section>' : "";
    h += rail ? '<div class="lk-grid lk-grid--rail"><div class="lk-col">'+body+'</div><div class="lk-col">'+rail+'</div></div>'
              : '<div class="lk-col">'+body+'</div>';
    return h;
  }

  /* ---------------- games & lifts ----------------------------
     Question: who is playing, and how do we get there?        */
  function viewGames(acc){
    var games = upcomingEvents().filter(function(x){ return isGame(x.e); });
    var squads = acc.team ? [acc.team] : (acc.coaches||[]);
    var mineCount = games.filter(function(x){ return squads.indexOf(x.e.team) > -1; }).length;
    var h = head("Games & lifts", games.length ?
      mineCount+" of the "+games.length+" games left this season are "+(acc.team ? "for "+esc(acc.team) : "for your squads")+". Open a game to see everyone’s name." :
      "No games left this season.");
    h += '<div class="lk-col">'+games.map(function(x){ return gameCard(acc, x, squads.indexOf(x.e.team) > -1); }).join("")+'</div>';
    if(!games.length) h += '<section class="lk-card"><p class="lk-empty">The season is over. Fixtures for next season appear here when the league publishes them.</p></section>';
    return h;
  }

  function gameHead(x){
    var e = x.e;
    return '<p class="lk-line">'+fmtLong(x.d)+' · '+esc(e.meta)+(e.team ? ' · '+esc(e.team) : "")+'</p>';
  }

  /* who can play, with names. compact: first names on one line. */
  function squadBlock(acc, e, ours){
    var t = squadAnswers(acc, e);
    var h = '<h3>Who can play · '+esc(e.team)+'</h3>'+
      '<p class="lk-figure"><b class="num">'+t.yes.length+'</b><span> of '+t.total+' can play · '+t.maybe.length+' maybe · '+t.no.length+' can’t · '+t.none.length+' no reply · '+t.goalies+(t.goalies === 1 ? " goalie" : " goalies")+'</span></p>'+
      '<dl class="lk-names">'+
      [["yes","Can play"],["maybe","Maybe"],["no","Can’t play"],["none","No reply yet"]].map(function(k){
        return t[k[0]].length ? '<div><dt>'+k[1]+' · '+t[k[0]].length+'</dt><dd>'+esc(names(t[k[0]]))+'</dd></div>' : "";
      }).join("")+'</dl>';
    if(ours && acc.team === e.team){
      h += '<div class="lk-ask"><span>Can you play?</span>'+seg("data-avail", e.id, [["yes","Can play"],["maybe","Maybe"],["no","Can’t"]], availOf(acc.id, e.id))+'</div>';
    }
    return h;
  }

  /* the club van drawn as its nine places: a square for each,
     gold once someone has taken it, D for someone who can drive */
  function vanHTML(ev){
    var ppl = vanPeople(ev), sq = "";
    for(var i=0;i<VAN;i++){
      var p = ppl[i];
      sq += p ? '<i class="v on'+(p.drive === "yes" ? " d" : "")+'" title="'+esc(p.name+(p.drive === "yes" ? " · can drive" : ""))+'">'+(p.drive === "yes" ? "D" : "")+'</i>'
              : '<i class="v" title="Free place"></i>';
    }
    return '<div class="vanbox"><div class="van" role="img" aria-label="'+ppl.length+' of '+VAN+' places in the club van taken">'+sq+'</div>'+
      '<p class="lk-figure"><b class="num">'+ppl.length+'</b><span> of '+VAN+' places taken · '+(VAN - ppl.length)+' free · D = can drive</span></p></div>';
  }

  /* my own signup: going, how, can I drive */
  function tripForm(acc, e){
    var r = tripRow(acc, e.id) || {}, full = vanPeople(e.id).length >= VAN && !(r.going === "yes" && r.how === "van");
    var h = '<div class="lk-ask lk-trip"><span>Are you going to '+esc(eventPlace(e) || "the game")+'?</span>'+
      seg("data-trip", e.id+"|going", [["yes","Yes"],["no","No"]], r.going || "")+'</div>';
    if(r.going === "yes"){
      h += '<div class="lk-ask lk-trip"><span>How do you get there?</span>'+
        seg("data-trip", e.id+"|how", [["van","Club van"+(full ? " (full)" : "")],["car","Own car"]], r.how || "")+'</div>'+
        '<div class="lk-ask lk-trip"><span>Can you drive?</span>'+
        seg("data-trip", e.id+"|drive", [["yes","Yes"],["no","No"]], r.drive || "no")+'</div>';
    }
    return h;
  }

  function travelBlock(acc, e){
    var vp = vanPeople(e.id), cars = carPeople(e.id);
    var drivers = vp.filter(function(r){ return r.drive === "yes"; });
    var h = '<h3>Getting to '+esc(eventPlace(e) || "the rink")+'</h3>'+vanHTML(e.id)+'<dl class="lk-names">'+
      '<div><dt>In the van · '+vp.length+'</dt><dd>'+(vp.length ? esc(vp.map(function(r){ return r.name; }).join(", ")) : "Nobody yet")+'</dd></div>'+
      '<div><dt>Can drive the van</dt><dd>'+(drivers.length ? esc(drivers.map(function(r){ return r.name; }).join(", ")) : "Nobody has offered yet")+'</dd></div>'+
      (cars.length ? '<div><dt>Own car · '+cars.length+'</dt><dd>'+esc(cars.map(function(r){ return r.name+(r.drive === "yes" ? " (driving)" : ""); }).join(", "))+'</dd></div>' : "")+
      '</dl>'+tripForm(acc, e);
    return h;
  }

  function gameCard(acc, x, ours){
    var e = x.e;
    var h = '<section class="lk-card lk-game"><div class="lk-cardhead"><h2>'+esc(e.title)+'</h2>'+
      '<span class="lk-meta">'+(e.kind === "home" ? "Home" : "Away")+' · '+relDay(x.d)+'</span></div>'+gameHead(x);
    h += '<div class="lk-split"><div>'+squadBlock(acc, e, ours)+'</div><div>';
    if(e.kind === "away") h += travelBlock(acc, e);
    else h += '<h3>Getting there</h3><p class="lk-line">Home game at '+esc(eventPlace(e))+'. Colosseum 90, about 15 minutes by bike from campus.</p>'+
      '<a class="lk-textbtn" href="https://www.openstreetmap.org/search?query=Colosseum%2090%2C%207521%20PT%20Enschede" target="_blank" rel="noopener">Directions</a>';
    h += '</div></div><a class="lk-more" href="'+S.accountUrl("game", e.id)+'" data-lkview="game">Open the game page</a></section>';
    return h;
  }

  /* one game on its own page */
  function viewGame(acc){
    var x = eventById(S.query("id")), e = x.e, squads = acc.team ? [acc.team] : (acc.coaches||[]);
    var ours = squads.indexOf(e.team) > -1;
    var h = head(e.title, fmtLong(x.d)+' · '+esc(e.meta)+(e.team ? ' · '+esc(e.team) : "")+' · '+relDay(x.d),
      '<a class="lk-textbtn" href="'+S.accountUrl("games")+'" data-lkview="games">All games</a>');
    h += '<div class="lk-grid lk-grid--2"><section class="lk-card lk-game">'+squadBlock(acc, e, ours)+'</section>'+
      '<section class="lk-card lk-game">'+
      (e.kind === "away" ? travelBlock(acc, e) :
        '<h3>Getting there</h3><p class="lk-line">Home game at '+esc(eventPlace(e))+'. Colosseum 90, about 15 minutes by bike from campus.</p>'+
        '<a class="lk-textbtn" href="https://www.openstreetmap.org/search?query=Colosseum%2090%2C%207521%20PT%20Enschede" target="_blank" rel="noopener">Directions</a>')+
      '</section></div>';
    return h;
  }

  /* ---------------- member points (coach, moderator, admin) ---
     Question: who is short of points? A coach sees the squads they
     look after, the moderator and the board see every squad.      */
  function viewPoints(acc){
    var rule = pointsRule();
    var squads = acc.role === "coach" ? (acc.coaches || []) : null;
    var people = C().players.map(function(p){ return {id:p.id, name:p.name, team:p.team}; })
      .concat(S.accounts.filter(function(a){ return a.team; }).map(function(a){ return {id:a.id, name:a.name, team:a.team}; }))
      .filter(function(p){ return !squads || squads.indexOf(p.team) > -1; });
    var teams = {};
    people.forEach(function(p){ (teams[p.team] = teams[p.team] || []).push(p); });
    var short = people.filter(function(p){ return pointsFor(p.id) < rule.need; }).length;
    var h = head("Member points", people.length+" members · "+short+" below the "+rule.need+" needed"+
      (S.isAdmin() ? ". The number needed is set in the admin console." : "."));
    h += '<div class="lk-col">'+Object.keys(teams).sort().map(function(t){
      return '<section class="lk-card"><div class="lk-cardhead"><h2>'+esc(t)+'</h2><span class="lk-meta">'+teams[t].length+' members</span></div><ul class="lk-list">'+
        teams[t].sort(function(a,b){ return a.name.localeCompare(b.name); }).map(function(p){
          var v = pointsFor(p.id);
          return '<li class="lk-row lk-row--pts"><div class="lk-what"><b>'+esc(p.name)+'</b>'+(v < rule.need ? '<span class="lk-low">'+(rule.need - v)+' short</span>' : '<span>Enough</span>')+'</div>'+
            '<span class="lk-seg lk-step"><button type="button" data-pts="'+esc(p.id+"|-1")+'" aria-label="One point less for '+esc(p.name)+'"'+(v <= 0 ? " disabled" : "")+'>−</button>'+
            '<b class="num">'+v+' / '+rule.max+'</b>'+
            '<button type="button" data-pts="'+esc(p.id+"|1")+'" aria-label="One point more for '+esc(p.name)+'"'+(v >= rule.max ? " disabled" : "")+'>+</button></span></li>';
        }).join("")+'</ul></section>';
    }).join("")+'</div>';
    return h;
  }

  /* ---------------- profile ---------------------------------
     Question: how do I show up in the club?                    */
  var AV_LABELS = {skin:"Skin", hair:"Hair", hairColor:"Hair colour", eyes:"Eyes", mouth:"Mouth", beard:"Beard"};
  function viewProfile(acc){
    var p = profile(acc), cfg = S.avatarConfig(asPlayer(acc)), staff = !acc.team;
    var h = head("Profile", "How you appear on the roster and in club photos. Changes save as you make them.",
      '<span class="lk-saved" id="lksaved" aria-live="polite"></span>');

    /* avatar */
    h += '<section class="lk-set"><div class="lk-setlabel"><h2>Your character</h2>'+
      '<p>The roster shows a drawn character instead of a photo. Your squad and number come from the coach.</p>'+
      '<div class="lk-card lk-preview"><div class="lk-previewav">'+S.avatarSVG(asPlayer(acc), {staff:staff})+'</div>'+
      '<div class="lk-previewname">'+(acc.no ? '<span class="no">#'+esc(acc.no)+'</span>' : "")+esc(acc.name)+'</div>'+
      '<div class="lk-meta">'+esc(acc.team || "Staff")+(acc.pos ? " · "+esc(acc.pos) : "")+'</div></div></div>'+
      '<div class="lk-card lk-setpanel">'+Object.keys(AV_LABELS).map(function(k){
        var opts = S.avatarOptions[k];
        var swatch = k === "skin" || k === "hairColor";
        return '<div class="lk-avrow"><span class="lk-avlabel">'+AV_LABELS[k]+'</span><div class="lk-avopts'+(swatch ? " sw" : "")+'">'+
          opts.map(function(o){
            var on = cfg[k] === o;
            return '<button type="button" data-av="'+k+'|'+esc(o)+'" aria-pressed="'+on+'"'+(on ? ' class="on"' : "")+
              (swatch ? ' style="--sw:'+esc(o)+'" aria-label="'+AV_LABELS[k]+' '+esc(o)+'"><i></i>' : '>'+esc(o.charAt(0).toUpperCase()+o.slice(1)))+'</button>';
          }).join("")+'</div></div>';
      }).join("")+
      '<div class="lk-avrow"><span class="lk-avlabel">Glasses</span><div class="lk-avopts">'+
        [["no","None"],["yes","Glasses"]].map(function(o){
          var on = String(!!cfg.glasses) === String(o[0] === "yes");
          return '<button type="button" data-av="glasses|'+o[0]+'" aria-pressed="'+on+'"'+(on ? ' class="on"' : "")+'>'+o[1]+'</button>';
        }).join("")+'</div></div>'+
      '<div class="lk-avfoot"><button type="button" class="lk-textbtn" data-av-reset="1">Back to the generated face</button></div>'+
      '</div></section>';

    /* details */
    h += '<section class="lk-set"><div class="lk-setlabel"><h2>Details</h2><p>Your e-mail and squad are managed by the board. Shirt size is for the next jersey order.</p></div>'+
      '<div class="lk-card lk-setpanel lk-form">'+
      '<div class="lk-fpair"><label>Name<input value="'+esc(acc.name)+'" disabled></label>'+
      '<label>E-mail<input value="'+esc(acc.email)+'" disabled></label></div>'+
      '<div class="lk-fpair"><label>Squad and number<input value="'+esc(acc.team ? acc.team+(acc.no ? " · #"+acc.no : "") : "Staff")+'" disabled></label>'+
      '<label>Shirt size<select data-prof="shirt">'+["","XS","S","M","L","XL","XXL"].map(function(s){
        return '<option value="'+s+'"'+(p.shirt === s ? " selected" : "")+'>'+(s || "Not set")+'</option>';
      }).join("")+'</select></label></div>'+
      '<label>Emergency contact<input data-prof="emergency" value="'+esc(p.emergency)+'" placeholder="Name and relation, phone number">'+
      '<small>Only the coach and the board see this, for accidents on the ice.</small></label>'+
      '</div></section>';

    /* privacy */
    h += '<section class="lk-set"><div class="lk-setlabel"><h2>Privacy</h2><p>The club asks before it publishes you. You can change your mind at any time.</p></div>'+
      '<div class="lk-card lk-setpanel">'+
      toggleRow("photo", p.photo === "yes", "Photos of me in public albums",
        p.photo === "yes" ? "Team and game photos with you in them can be shown to visitors." : "You’re only in members-only albums. The board blurs or skips you in public ones.")+
      toggleRow("roster", p.roster === "yes", "Show me on the public roster",
        p.roster === "yes" ? "Visitors see your character, name and number on the Players page." : "Only signed-in members see you on the roster.")+
      '</div></section>';

    /* account */
    h += '<section class="lk-set"><div class="lk-setlabel"><h2>Account</h2><p>Signed in as '+esc(acc.role)+'.</p></div>'+
      '<div class="lk-card lk-setpanel"><ul class="lk-kv">'+acc.can.map(function(c){ return '<li><span>'+esc(c)+'</span></li>'; }).join("")+'</ul>'+
      '<div class="lk-avfoot"><a class="lk-textbtn" href="'+S.url("signin")+'">Switch account</a>'+
      '<button type="button" class="lk-textbtn" data-act="signout">Sign out</button></div></div></section>';
    return h;
  }
  function toggleRow(key, on, title, desc){
    return '<div class="lk-switch"><div><b>'+esc(title)+'</b>'+pill(on ? "on" : "off", on ? "On" : "Off")+'<p>'+esc(desc)+'</p></div>'+
      '<button type="button" role="switch" aria-checked="'+on+'" aria-label="'+esc(title)+'" data-toggle="'+key+'" class="lk-toggle'+(on ? " on" : "")+'"><i></i></button></div>';
  }

  /* ============================================================
     ACTIONS — one delegated listener on the member area, bound once
     ============================================================ */
  var bound = false;
  function done(msg, undo){ S.save(); S.renderLK(); if(msg) S.toast(msg, undo ? "Undo" : null, undo); }

  function bindOnce(){
    if(bound) return;
    bound = true;
    var root = $("#lk");

    root.addEventListener("click", function(e){
      var acc = me(); if(!acc) return;
      var t;

      /* moving between views stays on the page */
      if((t = e.target.closest("[data-lkview]"))){
        if(e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        var href = t.getAttribute("href");
        try{ history.pushState(null, "", href); }catch(err){}
        S.renderLK();
        var anchor = href.split("#")[1], el = anchor && document.getElementById(anchor);
        if(el) el.scrollIntoView({block:"center"}); else window.scrollTo(0, 0);
        return;
      }
      if((t = e.target.closest("[data-rsvp]"))){
        var a = t.dataset.rsvp.split("|"), prev = rsvpOf(acc.id, a[0]);
        setRsvp(acc.id, a[0], a[1]);
        done(a[1] === "in" ? "You’re in for "+fmtLong(parse(a[0])) : "You’re out for "+fmtLong(parse(a[0])), function(){
          if(prev) setRsvp(acc.id, a[0], prev);
          else C().rsvps = col("rsvps").filter(function(x){ return !(x.who === acc.id && x.date === a[0]); });
          done("Reply undone");
        });
        return;
      }
      if((t = e.target.closest("[data-avail]"))){
        var b = t.dataset.avail.split("|");
        setAvail(acc.id, b[0], b[1]);
        done({yes:"Marked: you can make it", maybe:"Marked as maybe", no:"Marked: you can’t make it"}[b[1]]);
        return;
      }
      if((t = e.target.closest("[data-trip]"))){
        var q = t.dataset.trip.split("|");
        if(setTrip(acc, q[0], q[1], q[2])) done("Saved. Everyone can see it on the game page");
        return;
      }
      if((t = e.target.closest("[data-pts]"))){
        if(!S.can("points.edit")) return;
        var pp = t.dataset.pts.split("|");
        setPoints(pp[0], pointsFor(pp[0]) + Number(pp[1]));
        S.save(); S.renderLK();
        return;
      }
      if((t = e.target.closest("[data-ics]"))){ downloadIcs(acc); return; }
      if((t = e.target.closest("[data-av]"))){
        var c = t.dataset.av.split("|"), pr = profile(acc);
        pr.avatar[c[0]] = c[0] === "glasses" ? c[1] === "yes" : c[1];
        S.save(); S.renderLK(); saved();
        return;
      }
      if((t = e.target.closest("[data-av-reset]"))){ profile(acc).avatar = {}; S.save(); S.renderLK(); saved(); return; }
      if((t = e.target.closest("[data-toggle]"))){
        var pf = profile(acc), k = t.dataset.toggle;
        pf[k] = pf[k] === "yes" ? "no" : "yes";
        S.save(); S.renderLK(); saved();
        return;
      }
    });

    root.addEventListener("change", function(e){
      var t = e.target.closest("[data-prof]"); if(!t) return;
      var acc = me(); if(!acc) return;
      profile(acc)[t.dataset.prof] = t.value.trim();
      S.save(); saved();
    });

    window.addEventListener("popstate", function(){ S.renderLK(); });
  }

  function saved(){
    var el = $("#lksaved");
    if(el) el.textContent = "Saved";
  }

  /* my practices and games as a calendar file. Floating local times:
     the club's calendar is Enschede time and so is everyone in it. */
  function downloadIcs(acc){
    var lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Slapping Studs//Member area//EN","CALSCALE:GREGORIAN"];
    function stamp(dateIso, hhmm){ return dateIso.replace(/-/g,"")+"T"+hhmm.replace(":","")+"00"; }
    var n = 0;
    slots(S.demoToday, 42).forEach(function(s){
      if(rsvpOf(acc.id, s.date) === "out") return;
      var t = s.time.split("–");
      lines.push("BEGIN:VEVENT","UID:"+s.key.replace(/#/g,"-")+"@slappingstuds.nl","DTSTAMP:"+stamp(iso(S.demoToday),"00:00"),
        "DTSTART:"+stamp(s.date, t[0].trim()),"DTEND:"+stamp(s.date, (t[1]||t[0]).trim()),
        "SUMMARY:Studs practice","LOCATION:IJsbaan Twente\\, Colosseum 90\\, Enschede","END:VEVENT");
      n++;
    });
    upcomingEvents().forEach(function(x){
      if(availOf(acc.id, x.e.id) !== "yes") return;
      var tm = (eventTime(x.e).match(/\d\d:\d\d/) || ["12:00"])[0];
      lines.push("BEGIN:VEVENT","UID:"+x.e.id+"@slappingstuds.nl","DTSTAMP:"+stamp(iso(S.demoToday),"00:00"),
        "DTSTART:"+stamp(iso(x.d), tm),"SUMMARY:"+x.e.title,"LOCATION:"+eventPlace(x.e).replace(/,/g,"\\,"),"END:VEVENT");
      n++;
    });
    lines.push("END:VCALENDAR");
    var blob = new Blob([lines.join("\r\n")], {type:"text/calendar"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "slapping-studs-"+acc.name.split(" ")[0].toLowerCase()+".ics";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 1000);
    S.toast(n+" practices and games in the calendar file");
  }

})(window.Studs);
