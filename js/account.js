/* ============================================================
   account.js — the member area (account.html).

   One document, one view per area, chosen by ?v= in the URL:
     overview   what needs sorting out this week (no parameter)
     schedule   training and club events: I'm in / I'm out
     games      availability for my squad's games, lifts to away games
     kit        club kit on loan, this season's contribution
     profile    avatar, details, privacy
     icecheck   coaches and the board: is there enough ice per practice

   Everything renders from the content collections (js/data.js:
   profiles, rsvps, avail, rides, loans, dues, attendance, plus the
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
  var MIN_SKATERS = 8;                  // below this a group's slot is not worth the ice (sample rule)
  var TREASURER = "penningmeester@slappingstuds.nl";

  var VIEWS = [
    {id:"overview", label:"Overview"},
    {id:"schedule", label:"Training"},
    {id:"games",    label:"Games & lifts"},
    {id:"kit",      label:"Kit & contribution"},
    {id:"profile",  label:"Profile"},
    {id:"icecheck", label:"Ice check", cap:"attendance.mark"}
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
  function sampleGroup(p){ return hash(p.id) % 2 ? "Groups 4–6" : "Groups 1–3"; }

  /* ---------------- training calendar ------------------------
     Every practice slot from `from` for `days` days. A slot is one
     group's time on one date; Friday is one slot for everybody and
     only in the weeks the session's rule names (1st, 3rd, 5th). */
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
        [[s.g1,s.t1],[s.g2,s.t2]].forEach(function(g, k){
          if(!g[0] || !g[1]) return;
          out.push({key:iso(d)+"#"+s.id+"#"+k, date:iso(d), d:d, group:g[0], time:dash(g[1]), session:s});
        });
      });
    }
    return out;
  }
  function mySlot(acc, slot){
    return !acc.group || slot.group === acc.group || /all/i.test(slot.group);
  }
  function rsvpOf(who, date){
    var r = col("rsvps").filter(function(x){ return x.who === who && x.date === date; })[0];
    return r ? r.status : "";
  }
  function setRsvp(who, date, status){
    var list = col("rsvps"), r = list.filter(function(x){ return x.who === who && x.date === date; })[0];
    if(r) r.status = status; else list.push({id:S.uid(), who:who, date:date, status:status});
  }

  /* players in a slot (the coach's squads, the slot's groups) with
     their reply: the generated one, or "in" for the demo accounts */
  function slotPlayers(slot, squads){
    return C().players.filter(function(p){
      if(squads.indexOf(p.team) < 0) return false;
      return /all/i.test(slot.group) || sampleGroup(p) === slot.group;
    }).map(function(p){
      return {p:p, reply:sampleReply(p.id, slot.date)};
    });
  }

  /* ---------------- games and events ------------------------- */
  function upcomingEvents(){
    return C().events.map(function(e){ return {e:e, d:eventDate(e)}; })
      .filter(function(x){ return x.d && daysBetween(S.demoToday, x.d) >= 0; })
      .sort(function(a,b){ return a.d - b.d; });
  }
  function availOf(who, ev){
    var r = col("avail").filter(function(x){ return x.who === who && x.ev === ev; })[0];
    return r ? r.status : "";
  }
  function setAvail(who, ev, status){
    var list = col("avail"), r = list.filter(function(x){ return x.who === who && x.ev === ev; })[0];
    if(r) r.status = status; else list.push({id:S.uid(), who:who, ev:ev, status:status});
  }
  function riders(r){ return String(r.riders||"").split(",").map(function(x){ return x.trim(); }).filter(Boolean); }

  /* a squad's answers for one game: the roster's generated replies
     plus the signed-in member's own, when it is their squad. The
     overview and the Games view both read this, so they agree. */
  function gameTally(acc, e){
    var replies = C().players.filter(function(p){ return p.team === e.team; })
      .map(function(p){ return {p:p, r:sampleReply(p.id, e.id)}; });
    var mineToo = !!acc.team && acc.team === e.team;
    var mine = mineToo ? availOf(acc.id, e.id) : "";
    var yes = replies.filter(function(x){ return x.r === "in"; }).length + (mine === "yes" ? 1 : 0);
    var no  = replies.filter(function(x){ return x.r === "out"; }).length + (mine === "no" ? 1 : 0);
    var total = replies.length + (mineToo ? 1 : 0);
    return {replies:replies, mineToo:mineToo, mine:mine, yes:yes, no:no, total:total, open:total - yes - no,
            goalies:replies.filter(function(x){ return x.r === "in" && x.p.pos === "Goaltender"; }).length};
  }

  /* ---------------- money ------------------------------------ */
  function euros(v){ return "€"+(Number(v)||0).toFixed(2); }
  function myDues(acc){
    return col("dues").filter(function(d){ return d.who === acc.id; })[0] || null;
  }
  function owed(d){ return d ? Math.round((Number(d.amount) - Number(d.paid)) * 100) / 100 : 0; }
  function myLoans(acc){ return col("loans").filter(function(l){ return l.who === acc.id; }); }
  function loansOut(acc){
    return myLoans(acc).filter(function(l){ return !l.back; })
      .sort(function(a,b){ return String(a.due).localeCompare(String(b.due)); });
  }

  /* ---------------- what needs a reply ----------------------- */
  function openReplies(acc, days){
    var list = [];
    slots(S.demoToday, days).forEach(function(s){
      if(acc.group && mySlot(acc, s) && !rsvpOf(acc.id, s.date)) list.push({kind:"practice", d:s.d, slot:s});
    });
    upcomingEvents().forEach(function(x){
      if(daysBetween(S.demoToday, x.d) >= days) return;
      var mine = !isGame(x.e) || x.e.team === acc.team;
      if(mine && !availOf(acc.id, x.e.id)) list.push({kind:isGame(x.e)?"game":"event", d:x.d, e:x.e});
    });
    return list.sort(function(a,b){ return a.d - b.d; });
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function currentView(acc){
    var v = S.query("v") || "overview";
    var def = VIEWS.filter(function(x){ return x.id === v; })[0];
    if(!def || (def.cap && !S.can(def.cap))) v = "overview";
    return v;
  }

  S.renderLK = function(){
    if(!$("#lk")) return;
    var acc = me();
    if(!acc) return;
    var v = currentView(acc);
    renderSide(acc, v);
    var body = {overview:viewOverview, schedule:viewSchedule, games:viewGames,
                kit:viewKit, profile:viewProfile, icecheck:viewIceCheck}[v](acc);
    $("#lkmain").innerHTML = body;
    $("#lkmain").dataset.view = v;
    document.title = (VIEWS.filter(function(x){ return x.id === v; })[0].label) + " — My account — The Slapping Studs";
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
        return '<a href="'+S.accountUrl(x.id)+'" data-lkview="'+x.id+'"'+(x.id === v ? ' aria-current="page"' : "")+'>'+
               esc(x.label)+count+'</a>';
      }).join("")+
      '</nav>'+
      '<div class="lk-sidefoot">'+
        (S.isAdmin() ? '<a href="'+S.url("admin")+'">Admin console</a>' : "")+
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
    var open = openReplies(acc, 7);
    var out = loansOut(acc), due = myDues(acc), left = owed(due);
    var soon = out.filter(function(l){ return daysBetween(S.demoToday, parse(l.due)) <= 7; });

    /* the finding: the most pressing facts, in words */
    var facts = [];
    if(open.length) facts.push(open.length+(open.length === 1 ? " reply" : " replies")+" missing for the next 7 days");
    soon.forEach(function(l){
      var n = daysBetween(S.demoToday, parse(l.due));
      facts.push(l.item.split("·")[0].trim().toLowerCase()+(n < 0 ? " was due back "+fmtLong(parse(l.due)) : " is due back "+fmtLong(parse(l.due))));
    });
    if(left > 0 && due.due) facts.push(euros(left)+" of your contribution is due by "+fmtLong(parse(due.due)));
    if(S.can("attendance.mark")){
      var shortIce = iceRows(acc).filter(function(r){ return r.short && daysBetween(S.demoToday, r.s.d) < 7; });
      if(shortIce.length) facts.push(shortIce.length+(shortIce.length === 1 ? " practice" : " practices")+" this week "+(shortIce.length === 1 ? "is" : "are")+" short of skaters or a goalie");
    }
    var finding = facts.length ? facts.join(", ").replace(/^./, function(c){ return c.toUpperCase(); })+"." : "Nothing waiting on you this week.";

    var h = head("Overview", esc(finding));
    h += '<div class="lk-grid lk-grid--rail">';
    h += '<div class="lk-col">'+iceStrip(acc)+repliesCard(acc, open)+boardCard()+'</div>';
    h += '<div class="lk-col">'+nextGameCard(acc)+moneyCard(acc, out, due)+'</div>';
    h += '</div>';
    return h;
  }

  /* SIGNATURE: the next fourteen days on the ice, one column a day.
     A practice is a bar in my slot: gold when I'm in, an outline
     when I have not replied, a faint bar when I'm out. A game is a
     puck under the day. Today carries a 1px gold line. */
  function iceStrip(acc){
    var days = 14, all = slots(S.demoToday, days), ev = upcomingEvents();
    var cols = "";
    for(var i=0;i<days;i++){
      var d = addDays(S.demoToday, i), id = iso(d), wk = d.getDay() === 0 || d.getDay() === 6;
      var mine = all.filter(function(s){ return s.date === id && mySlot(acc, s); });
      var marks = mine.map(function(s){
        var r = acc.group ? rsvpOf(acc.id, s.date) : "staff";
        var label = s.group+" "+s.time+(r === "in" ? ", you're in" : r === "out" ? ", you're out" : r === "staff" ? "" : ", no reply yet");
        return '<span class="ice-bar '+(r||"open")+'" title="'+esc(label)+'"><span>'+esc(s.time.split("–")[0])+'</span></span>';
      }).join("");
      var games = ev.filter(function(x){ return iso(x.d) === id && isGame(x.e); }).map(function(x){
        var ours = x.e.team === acc.team || (acc.coaches||[]).indexOf(x.e.team) > -1;
        return '<span class="ice-puck'+(ours ? " ours" : "")+'" title="'+esc(x.e.title+" · "+x.e.meta)+'">'+(x.e.kind === "home" ? "H" : "A")+'</span>';
      }).join("");
      cols += '<a class="ice-day'+(i === 0 ? " today" : "")+(wk ? " wk" : "")+'" href="'+S.accountUrl("schedule")+'#d-'+id+'" data-lkview="schedule">'+
        '<span class="ice-dn">'+DAYS[d.getDay()].slice(0,1)+'</span><span class="ice-dd">'+d.getDate()+'</span>'+
        '<span class="ice-marks">'+marks+'</span><span class="ice-games">'+games+'</span></a>';
    }
    var ins = all.filter(function(s){ return mySlot(acc, s) && rsvpOf(acc.id, s.date) === "in"; }).length;
    var mineAll = all.filter(function(s){ return mySlot(acc, s); }).length;
    return '<section class="lk-card lk-card--strip"><div class="lk-cardhead"><h2>Your next two weeks on the ice</h2>'+
      '<span class="lk-meta">'+fmtDay(S.demoToday)+' – '+fmtDay(addDays(S.demoToday, days-1))+'</span></div>'+
      (acc.group ? '<p class="lk-line">'+ins+' of '+mineAll+' practices in '+esc(acc.group)+' answered “I’m in”.</p>'
                 : '<p class="lk-line">Every practice slot, both groups. You coach '+esc((acc.coaches||[]).join(" and "))+'.</p>')+
      '<div class="ice-strip">'+cols+'</div>'+
      '<div class="lk-legend"><span><i class="ice-bar in"></i>I’m in</span><span><i class="ice-bar open"></i>No reply</span>'+
      '<span><i class="ice-bar out"></i>I’m out</span><span><i class="ice-puck ours">H</i>Game, home or away</span></div></section>';
  }

  function replyRow(acc, x){
    if(x.kind === "practice"){
      return '<li class="lk-row"><div class="lk-when"><b>'+fmtDay(x.d)+'</b><span>'+esc(x.slot.time)+'</span></div>'+
        '<div class="lk-what"><b>Practice · '+esc(x.slot.group)+'</b><span>IJsbaan Twente · '+relDay(x.d)+'</span></div>'+
        seg("data-rsvp", x.slot.date, [["in","I’m in"],["out","I’m out"]], "")+'</li>';
    }
    return '<li class="lk-row"><div class="lk-when"><b>'+fmtDay(x.d)+'</b><span>'+esc(eventTime(x.e))+'</span></div>'+
      '<div class="lk-what"><b>'+esc(x.e.title)+'</b><span>'+esc(eventPlace(x.e))+' · '+relDay(x.d)+'</span></div>'+
      seg("data-avail", x.e.id, x.kind === "game" ? [["yes","Can play"],["no","Can’t"]] : [["yes","Going"],["no","Not going"]], "")+'</li>';
  }
  function repliesCard(acc, open){
    if(!acc.group){
      return '<section class="lk-card"><div class="lk-cardhead"><h2>Needs a reply</h2></div>'+
        '<p class="lk-empty">Coaches don’t reply to practices. See who has in <a href="'+S.accountUrl("icecheck")+'" data-lkview="icecheck">Ice check</a>.</p></section>';
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
    var t = gameTally(acc, g.e);
    return '<section class="lk-card"><div class="lk-cardhead"><h2>Next game</h2><span class="lk-meta">'+relDay(g.d)+'</span></div>'+
      '<p class="lk-big">'+esc(g.e.title)+'</p>'+
      '<p class="lk-line">'+fmtLong(g.d)+' · '+esc(g.e.meta)+'</p>'+
      '<p class="lk-figure"><b class="num">'+t.yes+'</b><span> of '+t.total+' '+esc(g.e.team)+' players can play so far</span></p>'+
      (t.mineToo ? seg("data-avail", g.e.id, [["yes","Can play"],["maybe","Maybe"],["no","Can’t"]], t.mine) : "")+
      '<a class="lk-more" href="'+S.accountUrl("games")+'" data-lkview="games">'+(g.e.kind === "away" ? "Lifts and squad" : "Squad")+'</a></section>';
  }
  function moneyCard(acc, out, due){
    var left = owed(due);
    var rows = out.slice(0,3).map(function(l){
      var n = daysBetween(S.demoToday, parse(l.due));
      return '<li><span>'+esc(l.item)+'</span>'+(n <= 7 ? pill(n < 0 ? "neg" : "warn", n < 0 ? "Overdue" : "Back "+fmtDay(parse(l.due))) : '<em>'+fmtDay(parse(l.due))+'</em>')+'</li>';
    }).join("");
    return '<section class="lk-card"><div class="lk-cardhead"><h2>Kit and contribution</h2></div>'+
      (due && Number(due.amount) > 0 ?
        '<p class="lk-figure"><b class="num">'+euros(left)+'</b><span> left of '+euros(due.amount)+', season '+esc(due.season)+'</span></p>' :
        '<p class="lk-line">No contribution for your role this season.</p>')+
      (out.length ? '<ul class="lk-kv">'+rows+'</ul>' : '<p class="lk-line">No club kit with you.</p>')+
      '<a class="lk-more" href="'+S.accountUrl("kit")+'" data-lkview="kit">Kit and contribution</a></section>';
  }

  /* ---------------- training --------------------------------
     Question: which practices am I going to?                   */
  function viewSchedule(acc){
    var all = slots(S.demoToday, 21).filter(function(s){ return mySlot(acc, s); });
    var filter = S.state.lkFilter || "all";
    var counts = {all:all.length, open:0, in:0, out:0};
    all.forEach(function(s){ var r = rsvpOf(acc.id, s.date) || "open"; counts[r]++; });
    var shown = acc.group ? all.filter(function(s){ return filter === "all" || (rsvpOf(acc.id, s.date) || "open") === filter; }) : all;

    var sub = acc.group ? esc(acc.group)+": "+C().sessions.map(function(s){
      var sl = [[s.g1,s.t1],[s.g2,s.t2]].filter(function(g){ return g[0] && (g[0] === acc.group || /all/i.test(g[0])); })[0];
      return sl ? s.day+" "+dash(sl[1]).split("–")[0]+(s.rule ? " (weeks "+s.rule.replace(/,/g, ", ")+")" : "") : "";
    }).filter(Boolean).join(", ")+". IJsbaan Twente." : "Every practice slot for the next three weeks.";

    var h = head("Training", sub);

    if(acc.group){
      h += '<div class="lk-counts" role="group" aria-label="Show">'+[["all","All practices"],["open","No reply"],["in","I’m in"],["out","I’m out"]].map(function(f){
        return '<button type="button" data-filter="'+f[0]+'" aria-pressed="'+(filter === f[0])+'"'+(filter === f[0] ? ' class="on"' : "")+'>'+
          '<span>'+f[1]+'</span><b class="num">'+counts[f[0]]+'</b></button>';
      }).join("")+'</div>';
    }

    /* grouped by week */
    var weeks = {};
    shown.forEach(function(s){ var w = Math.floor(daysBetween(S.demoToday, s.d) / 7); (weeks[w] = weeks[w] || []).push(s); });
    var body = Object.keys(weeks).map(function(w){
      var list = weeks[w], first = addDays(S.demoToday, w*7);
      return '<section class="lk-card"><div class="lk-cardhead"><h2>'+(w === "0" ? "This week" : w === "1" ? "Next week" : "Week of "+fmtDay(first))+'</h2>'+
        '<span class="lk-meta">'+list.length+(list.length === 1 ? " practice" : " practices")+'</span></div><ul class="lk-list">'+
        list.map(function(s){
          var going = C().players.filter(function(p){ return (/all/i.test(s.group) || sampleGroup(p) === s.group) && sampleReply(p.id, s.date) === "in"; }).length;
          var mine = rsvpOf(acc.id, s.date);
          return '<li class="lk-row" id="d-'+s.date+'"><div class="lk-when"><b>'+fmtDay(s.d)+'</b><span>'+esc(s.time)+'</span></div>'+
            '<div class="lk-what"><b>'+esc(s.group)+'</b><span>'+relDay(s.d)+' · '+going+(acc.group && mine === "in" ? " others" : "")+' going so far</span></div>'+
            (acc.group ? seg("data-rsvp", s.date, [["in","I’m in"],["out","I’m out"]], mine) : '<a class="lk-textbtn" href="'+S.accountUrl("icecheck")+'" data-lkview="icecheck">Ice check</a>')+'</li>';
        }).join("")+'</ul></section>';
    }).join("");
    if(!shown.length) body = '<section class="lk-card"><p class="lk-empty">No practices match this filter in the next three weeks.</p></section>';

    /* beside the practices: club events that are not games, and the
       calendar file */
    var evs = upcomingEvents().filter(function(x){ return !isGame(x.e); });
    var rail = '<section class="lk-card"><div class="lk-cardhead"><h2>Club events</h2><span class="lk-meta">'+evs.length+' coming up</span></div>'+
      (evs.length ? '<ul class="lk-list lk-list--stack">'+evs.map(function(x){
        return '<li class="lk-row"><div class="lk-when"><b>'+fmtDay(x.d)+'</b><span>'+esc(eventTime(x.e))+'</span></div>'+
          '<div class="lk-what"><b>'+esc(x.e.title)+'</b><span>'+esc(eventPlace(x.e))+' · '+relDay(x.d)+'</span></div>'+
          seg("data-avail", x.e.id, [["yes","Going"],["maybe","Maybe"],["no","Not going"]], availOf(acc.id, x.e.id))+'</li>';
      }).join("")+'</ul>' : '<p class="lk-empty">No club events planned yet.</p>')+'</section>';
    if(acc.group){
      rail += '<section class="lk-card"><div class="lk-cardhead"><h2>In your own calendar</h2></div>'+
        '<p class="lk-line">Every practice you haven’t said no to for the next six weeks, plus the games and events you’re going to, as one file for Google, Apple or Outlook calendar.</p>'+
        '<button type="button" class="lk-btn" data-ics="1">Download calendar file</button></section>';
    }
    h += '<div class="lk-grid lk-grid--rail"><div class="lk-col">'+body+'</div><div class="lk-col">'+rail+'</div></div>';
    return h;
  }

  /* ---------------- games & lifts ----------------------------
     Question: am I playing, and how do I get there?            */
  function viewGames(acc){
    var games = upcomingEvents().filter(function(x){ return isGame(x.e); });
    var squads = acc.team ? [acc.team] : (acc.coaches||[]);
    var mineCount = games.filter(function(x){ return squads.indexOf(x.e.team) > -1; }).length;
    var h = head("Games & lifts", games.length ?
      mineCount+" of the "+games.length+" games left this season are "+(acc.team ? "for "+esc(acc.team) : "for your squads")+". Away games list the lifts going." :
      "No games left this season.");
    h += games.map(function(x){ return gameCard(acc, x, squads.indexOf(x.e.team) > -1); }).join("");
    if(!games.length) h += '<section class="lk-card"><p class="lk-empty">The season is over. Fixtures for next season appear here when the league publishes them.</p></section>';
    return h;
  }
  function gameCard(acc, x, ours){
    var e = x.e, t = gameTally(acc, e);
    var replies = t.replies, mine = t.mine, yes = t.yes, no = t.no, goalies = t.goalies, total = t.total;

    var h = '<section class="lk-card lk-game"><div class="lk-cardhead"><h2>'+esc(e.title)+'</h2>'+
      '<span class="lk-meta">'+(e.kind === "home" ? "Home" : "Away")+' · '+relDay(x.d)+'</span></div>'+
      '<p class="lk-line">'+fmtLong(x.d)+' · '+esc(e.meta)+(e.team ? ' · '+esc(e.team) : "")+'</p>';

    h += '<div class="lk-split"><div>';
    /* the squad as units: one square per player */
    h += '<h3>'+esc(e.team)+' availability</h3>'+
      '<p class="lk-figure"><b class="num">'+yes+'</b><span> of '+total+' can play · '+no+' can’t · '+(total-yes-no)+' no reply · '+goalies+(goalies === 1 ? " goalie" : " goalies")+'</span></p>'+
      '<div class="lk-units" aria-hidden="true">'+replies.map(function(r){
        return '<i class="u '+(r.r||"open")+(r.p.pos === "Goaltender" ? " g" : "")+'" title="'+esc(r.p.name+(r.r === "in" ? " · can play" : r.r === "out" ? " · can’t" : " · no reply"))+'"></i>';
      }).join("")+(ours && acc.team ? '<i class="u '+(mine === "yes" ? "in" : mine === "no" ? "out" : "open")+' me" title="You"></i>' : "")+'</div>'+
      '<div class="lk-legend"><span><i class="u in"></i>Can play</span><span><i class="u open"></i>No reply</span><span><i class="u out"></i>Can’t</span><span><i class="u in g"></i>Goalie</span></div>';
    if(ours && acc.team){
      h += '<div class="lk-ask"><span>Can you play?</span>'+seg("data-avail", e.id, [["yes","Can play"],["maybe","Maybe"],["no","Can’t"]], mine)+'</div>';
    }else if(!ours){
      h += '<p class="lk-line">Not your squad’s game. Supporters are welcome — take a lift below.</p>';
    }
    h += '</div><div>';

    /* lifts */
    var rides = col("rides").filter(function(r){ return r.ev === e.id; });
    if(e.kind === "away"){
      var vans = rides.filter(function(r){ return r.kind === "van"; });
      var cars = rides.filter(function(r){ return r.kind !== "van"; });
      var free = function(list){ return list.reduce(function(n, r){ return n + Math.max(Number(r.seats||0) - riders(r).length, 0); }, 0); };
      h += '<h3>Getting to '+esc(eventPlace(e) || "the rink")+'</h3>';
      /* the van is the main way to get there: first, and larger */
      if(vans.length){
        h += '<div class="lk-van">'+vans.map(function(r){ return rideRow(acc, r); }).join("")+'</div>';
      }else{
        h += '<p class="lk-empty">No club van booked for this game yet. The coach books it once ten players have said yes.</p>';
      }
      h += '<p class="lk-figure"><b class="num">'+free(cars)+'</b><span> free '+(free(cars) === 1 ? "seat" : "seats")+' in '+cars.length+(cars.length === 1 ? " car" : " cars")+' if the van is full</span></p>';
      h += cars.length ? '<ul class="lk-rides">'+cars.map(function(r){ return rideRow(acc, r); }).join("")+'</ul>' :
        '<p class="lk-line">Nobody has offered their own car yet.</p>';
      h += '<details class="lk-offer"><summary>Offer a seat in your own car</summary>'+
        '<form class="lk-form" data-rideform="'+esc(e.id)+'">'+
        '<label>Leaving from<input name="from" required placeholder="Campus UT, Horst car park"></label>'+
        '<div class="lk-fpair"><label>Leaving at<input name="leave" type="time" required value="07:00"></label>'+
        '<label>Free seats<select name="seats"><option>1</option><option>2</option><option selected>3</option><option>4</option></select></label></div>'+
        '<button class="lk-btn" type="submit">Offer the lift</button></form></details>';
    }else{
      h += '<h3>Getting there</h3><p class="lk-line">Home game at '+esc(eventPlace(e))+'. Colosseum 90, about 15 minutes by bike from campus.</p>'+
        '<a class="lk-textbtn" href="https://www.openstreetmap.org/search?query=Colosseum%2090%2C%207521%20PT%20Enschede" target="_blank" rel="noopener">Directions</a>';
    }
    h += '</div></div></section>';
    return h;
  }
  function rideRow(acc, r){
    var list = riders(r), free = Number(r.seats||0) - list.length, inIt = list.indexOf(acc.name) > -1;
    var mineRide = r.driver === acc.name, van = r.kind === "van";
    return '<'+(van ? "div" : "li")+' class="'+(van ? "lk-vanrow" : "lk-carrow")+'"><div class="lk-ride"><b>'+(van ? "Club van · " : "")+esc(r.driver)+(mineRide ? " (you)" : "")+(van ? " driving" : "")+'</b>'+
      '<span>'+esc(r.from)+' · leaves '+esc(r.leave)+'</span>'+
      '<span class="lk-seats" aria-label="'+list.length+' of '+esc(r.seats)+' seats taken">'+
        list.map(function(n){ return '<i class="s on" title="'+esc(n)+'"></i>'; }).join("")+
        new Array(Math.max(free,0)+1).join('<i class="s"></i>')+
        '<em>'+list.length+' / '+esc(r.seats)+'</em></span></div>'+
      (mineRide ? '<button type="button" class="lk-textbtn" data-ride-cancel="'+esc(r.id)+'">Cancel lift</button>' :
        inIt ? '<button type="button" class="lk-textbtn" data-ride-leave="'+esc(r.id)+'">Leave</button>' :
        free > 0 ? '<button type="button" class="lk-btn lk-btn--sm" data-ride-join="'+esc(r.id)+'">Take a seat</button>' :
        '<span class="lk-meta">Full</span>')+'</'+(van ? "div" : "li")+'>';
  }

  /* ---------------- kit & contribution -----------------------
     Question: what do I owe the club?                          */
  function viewKit(acc){
    var d = myDues(acc), left = owed(d), loans = myLoans(acc), out = loansOut(acc);
    var h = head("Kit & contribution", (d && Number(d.amount) > 0 ?
        (left > 0 ? euros(left)+" of your "+euros(d.amount)+" contribution is open, due "+fmtLong(parse(d.due))+"." : "Your "+esc(d.season)+" contribution is paid in full.") :
        "No contribution for your role this season.")+
      " "+out.length+(out.length === 1 ? " piece" : " pieces")+" of club kit with you.");

    h += '<div class="lk-grid lk-grid--2">';
    /* contribution */
    h += '<section class="lk-card"><div class="lk-cardhead"><h2>Contribution '+esc(d ? d.season : "")+'</h2></div>';
    if(d && Number(d.amount) > 0){
      var ratio = Math.min(1, Number(d.paid) / Number(d.amount));
      h += '<p class="lk-figure"><b class="num">'+euros(d.paid)+'</b><span> paid of '+euros(d.amount)+'</span></p>'+
        '<div class="lk-meter" role="img" aria-label="'+euros(d.paid)+' of '+euros(d.amount)+' paid"><i style="width:'+(ratio*100).toFixed(1)+'%"></i></div>'+
        '<div class="lk-meterends"><span>€0.00</span><span>'+euros(d.amount)+'</span></div>'+
        '<dl class="lk-dl"><div><dt>Still to pay</dt><dd class="num">'+euros(left)+'</dd></div>'+
        '<div><dt>Due</dt><dd>'+(d.due ? fmtLong(parse(d.due))+" · "+relDay(parse(d.due)) : "—")+'</dd></div></dl>'+
        (left > 0 ? '<p class="lk-line">The treasurer sends a payment request by e-mail. Paid already, or need to split it? Write to the treasurer.</p>'+
          '<a class="lk-btn" href="mailto:'+TREASURER+'?subject='+encodeURIComponent("Contribution "+d.season+" — "+acc.name)+'&body='+encodeURIComponent("Hi,\n\nAbout my contribution for "+d.season+": "+euros(left)+" still open.\n\n"+acc.name)+'">E-mail the treasurer</a>' :
          '<p class="lk-line">Nothing to do. Thanks!</p>');
    }else{
      h += '<p class="lk-empty">Coaches and honorary members pay no contribution. Questions go to <a href="mailto:'+TREASURER+'">'+TREASURER+'</a>.</p>';
    }
    h += '</section>';

    /* kit on loan */
    h += '<section class="lk-card"><div class="lk-cardhead"><h2>Club kit with you</h2><span class="lk-meta">'+out.length+' out · '+(loans.length - out.length)+' returned</span></div>';
    if(loans.length){
      h += '<table class="lk-table"><thead><tr><th>Item</th><th class="r">Back by</th><th class="r">Status</th></tr></thead><tbody>'+
        loans.slice().sort(function(a,b){ return (a.back?1:0)-(b.back?1:0) || String(a.due).localeCompare(String(b.due)); }).map(function(l){
          var n = daysBetween(S.demoToday, parse(l.due));
          var st = l.back ? '<span class="lk-meta">Returned '+fmtDay(parse(l.back))+'</span>' :
            n < 0 ? pill("neg","Overdue") : n <= 7 ? pill("warn","Due "+relDay(parse(l.due))) : '<span class="lk-meta">Out</span>';
          return '<tr'+(l.back ? ' class="done"' : "")+'><td><b>'+esc(l.item)+'</b><span>Since '+fmtDay(parse(l.since))+'</span></td>'+
            '<td class="r num">'+fmtDay(parse(l.due))+'</td><td class="r">'+st+
            (!l.back ? '<button type="button" class="lk-textbtn" data-return="'+esc(l.id)+'">I handed it back</button>' : "")+'</td></tr>';
        }).join("")+'</tbody></table>';
    }else{
      h += '<p class="lk-empty">You have no club kit. Need skates or pads? The club lends them at the bench.</p>';
    }
    h += '<p class="lk-line">The kit manager checks returns at the bench. Lost or broken something? Say so at practice.</p></section>';
    h += '</div>';

    /* what the club lends - reference */
    var lend = C().kit.filter(function(k){ return /^yes/i.test(k.loan); });
    h += '<section class="lk-card"><div class="lk-cardhead"><h2>What the club can lend you</h2><span class="lk-meta">'+lend.length+' items</span></div>'+
      '<ul class="lk-kv lk-kv--cols">'+lend.map(function(k){
        return '<li><span>'+esc(k.item)+'</span><em>'+esc(String(k.loan).replace(/^yes\s*-?\s*/i, "") || "Ask at the bench")+'</em></li>';
      }).join("")+'</ul></section>';
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

  /* ---------------- ice check (coach, board) ------------------
     Question: is there enough of the team on the ice for each
     practice, and who still has to answer?                     */
  function coachSquads(acc){ return acc.coaches && acc.coaches.length ? acc.coaches : ["Stallions","Studs 1"]; }
  /* one row per slot in the next two weeks; the overview's finding
     for a coach reads the same rows */
  function iceRows(acc){
    var squads = coachSquads(acc);
    return slots(S.demoToday, 14).map(function(s){
      var ps = slotPlayers(s, squads);
      var skIn = ps.filter(function(x){ return x.reply === "in" && x.p.pos !== "Goaltender"; }).length;
      var gIn  = ps.filter(function(x){ return x.reply === "in" && x.p.pos === "Goaltender"; }).length;
      var out  = ps.filter(function(x){ return x.reply === "out"; }).length;
      var none = ps.filter(function(x){ return !x.reply; });
      return {s:s, ps:ps, skIn:skIn, gIn:gIn, out:out, none:none, short:skIn < MIN_SKATERS || !gIn};
    });
  }
  function viewIceCheck(acc){
    var squads = coachSquads(acc);
    var rows = iceRows(acc);
    var short = rows.filter(function(r){ return r.short; });
    var worst = short[0];
    var h = head("Ice check", worst ?
      fmtLong(worst.s.d)+", "+esc(worst.s.group)+": "+worst.skIn+" skaters in"+(worst.skIn < MIN_SKATERS ? ", "+(MIN_SKATERS - worst.skIn)+" short of the "+MIN_SKATERS+" needed" : "")+(worst.gIn ? "" : ", no goalie")+". "+
      short.length+" of "+rows.length+" practices in the next two weeks are short." :
      "Every practice in the next two weeks has "+MIN_SKATERS+" skaters and a goalie.");

    var scale = Math.max(MIN_SKATERS*1.6, Math.max.apply(null, rows.map(function(r){ return r.skIn + r.out + r.none.length; }).concat([1])));
    h += '<section class="lk-card"><div class="lk-cardhead"><h2>Next two weeks</h2><span class="lk-meta">'+esc(squads.join(" + "))+' · '+MIN_SKATERS+' skaters and a goalie needed</span></div>'+
      '<table class="lk-table lk-ice"><thead><tr><th>Practice</th><th class="lk-barcol">Skaters in, against the '+MIN_SKATERS+' needed</th><th class="r">Goalies</th><th class="r">Out</th><th class="r">No reply</th><th class="r"></th></tr></thead><tbody>'+
      rows.map(function(r){
        var ok = r.skIn >= MIN_SKATERS;
        return '<tr><td><b>'+fmtDay(r.s.d)+' · '+esc(r.s.time.split("–")[0])+'</b><span>'+esc(r.s.group)+'</span></td>'+
          '<td class="lk-barcol"><div class="lk-bullet'+(ok ? "" : " short")+'"><i style="width:'+(r.skIn/scale*100).toFixed(1)+'%"></i>'+
          '<s style="left:'+(MIN_SKATERS/scale*100).toFixed(1)+'%" title="'+MIN_SKATERS+' needed"></s><em class="num">'+r.skIn+'</em></div></td>'+
          '<td class="r num'+(r.gIn ? "" : " neg")+'">'+r.gIn+'</td><td class="r num">'+r.out+'</td><td class="r num">'+r.none.length+'</td>'+
          '<td class="r">'+(r.none.length ? '<button type="button" class="lk-textbtn" data-remind="'+esc(r.s.key)+'">Copy reminder</button>' : '<span class="lk-meta">All replied</span>')+'</td></tr>';
      }).join("")+'</tbody></table></section>';

    /* attendance for the last practice */
    var past = slots(addDays(S.demoToday, -7), 7).filter(function(s){ return daysBetween(s.d, S.demoToday) > 0; }).pop();
    if(past){
      var ps = slotPlayers(past, squads).filter(function(x){ return x.reply === "in"; });
      var marks = col("attendance").filter(function(a){ return a.key === past.key; });
      var here = ps.filter(function(x){ var m = marks.filter(function(a){ return a.pid === x.p.id; })[0]; return !m || m.here === "yes"; }).length;
      h += '<section class="lk-card"><div class="lk-cardhead"><h2>Attendance · '+fmtLong(past.d)+', '+esc(past.group)+' '+esc(past.time)+'</h2>'+
        '<span class="lk-meta"><b class="num">'+here+'</b> of '+ps.length+' who said they were in were there</span></div>'+
        '<p class="lk-line">Everyone who said “I’m in” starts as present. Tap whoever didn’t show.</p>'+
        '<ul class="lk-att">'+ps.map(function(x){
          var m = marks.filter(function(a){ return a.pid === x.p.id; })[0], yes = !m || m.here === "yes";
          return '<li><button type="button" data-here="'+esc(past.key+"|"+x.p.id)+'" aria-pressed="'+yes+'" class="'+(yes ? "on" : "")+'">'+
            '<span class="lk-attav">'+S.avatarSVG(x.p)+'</span><span><b>'+esc(x.p.name)+'</b><em>'+esc(x.p.team)+(x.p.no && x.p.no !== "0" ? " · #"+esc(x.p.no) : "")+'</em></span>'+
            '<span class="lk-attst">'+(yes ? "Here" : "Absent")+'</span></button></li>';
        }).join("")+'</ul></section>';
    }
    return h;
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
        S.state.lkFilter = "all";
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
      if((t = e.target.closest("[data-filter]"))){ S.state.lkFilter = t.dataset.filter; S.renderLK(); return; }
      if((t = e.target.closest("[data-ics]"))){ downloadIcs(acc); return; }
      if((t = e.target.closest("[data-ride-join]"))){
        var r1 = col("rides").filter(function(r){ return r.id === t.dataset.rideJoin; })[0];
        if(!r1) return;
        var l1 = riders(r1); if(l1.length >= Number(r1.seats)) { S.toast("That car is full"); return; }
        l1.push(acc.name); r1.riders = l1.join(", ");
        done("Seat taken in "+r1.driver+"’s car, leaving "+r1.leave);
        return;
      }
      if((t = e.target.closest("[data-ride-leave]"))){
        var r2 = col("rides").filter(function(r){ return r.id === t.dataset.rideLeave; })[0];
        if(!r2) return;
        r2.riders = riders(r2).filter(function(n){ return n !== acc.name; }).join(", ");
        done("You left "+r2.driver+"’s lift");
        return;
      }
      if((t = e.target.closest("[data-ride-cancel]"))){
        var gone = col("rides").filter(function(r){ return r.id === t.dataset.rideCancel; })[0];
        C().rides = col("rides").filter(function(r){ return r !== gone; });
        done("Lift cancelled", function(){ col("rides").push(gone); done("Lift restored"); });
        return;
      }
      if((t = e.target.closest("[data-return]"))){
        var ln = col("loans").filter(function(l){ return l.id === t.dataset["return"]; })[0];
        if(!ln) return;
        ln.back = iso(S.demoToday);
        done(ln.item.split("·")[0].trim()+" marked as handed back", function(){ ln.back = ""; done("Undone"); });
        return;
      }
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
      if((t = e.target.closest("[data-remind]"))){ copyReminder(acc, t.dataset.remind); return; }
      if((t = e.target.closest("[data-here]"))){
        var h2 = t.dataset.here.split("|"), att = col("attendance");
        var m = att.filter(function(a){ return a.key === h2[0] && a.pid === h2[1]; })[0];
        if(m) m.here = m.here === "yes" ? "no" : "yes"; else att.push({id:S.uid(), key:h2[0], pid:h2[1], here:"no"});
        S.save(); S.renderLK();
        return;
      }
    });

    root.addEventListener("change", function(e){
      var t = e.target.closest("[data-prof]"); if(!t) return;
      var acc = me(); if(!acc) return;
      profile(acc)[t.dataset.prof] = t.value.trim();
      S.save(); saved();
    });

    root.addEventListener("submit", function(e){
      var f = e.target.closest("[data-rideform]"); if(!f) return;
      e.preventDefault();
      var acc = me(); if(!acc) return;
      var from = f.from.value.trim();
      if(!from){ S.toast("Say where you leave from"); return; }
      col("rides").push({id:S.uid(), ev:f.dataset.rideform, driver:acc.name, from:from, leave:f.leave.value, seats:f.seats.value, riders:""});
      done("Lift offered. It shows in the list for everyone");
    });

    window.addEventListener("popstate", function(){ S.renderLK(); });
  }

  function saved(){
    var el = $("#lksaved");
    if(el) el.textContent = "Saved";
  }

  /* a reminder the coach pastes into the squad chat */
  function copyReminder(acc, key){
    var squads = coachSquads(acc);
    var s = slots(S.demoToday, 14).filter(function(x){ return x.key === key; })[0];
    if(!s) return;
    var names = slotPlayers(s, squads).filter(function(x){ return !x.reply; }).map(function(x){ return x.p.name.split(" ")[0]; });
    var text = "Practice "+fmtLong(s.d)+", "+s.group+" "+s.time+" at IJsbaan Twente. Still no reply from "+
      names.join(", ")+". In or out? Reply in My account → Training.";
    var ok = function(){ S.toast("Reminder copied for "+names.length+(names.length === 1 ? " player" : " players")); };
    if(navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(ok, function(){ S.toast(text); });
    else S.toast(text);
  }

  /* my practices and games as a calendar file. Floating local times:
     the club's calendar is Enschede time and so is everyone in it. */
  function downloadIcs(acc){
    var lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Slapping Studs//Member area//EN","CALSCALE:GREGORIAN"];
    function stamp(dateIso, hhmm){ return dateIso.replace(/-/g,"")+"T"+hhmm.replace(":","")+"00"; }
    var n = 0;
    slots(S.demoToday, 42).forEach(function(s){
      if(!mySlot(acc, s) || rsvpOf(acc.id, s.date) === "out") return;
      var t = s.time.split("–");
      lines.push("BEGIN:VEVENT","UID:"+s.key.replace(/#/g,"-")+"@slappingstuds.nl","DTSTAMP:"+stamp(iso(S.demoToday),"00:00"),
        "DTSTART:"+stamp(s.date, t[0].trim()),"DTEND:"+stamp(s.date, (t[1]||t[0]).trim()),
        "SUMMARY:Studs practice · "+s.group,"LOCATION:IJsbaan Twente\\, Colosseum 90\\, Enschede","END:VEVENT");
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
