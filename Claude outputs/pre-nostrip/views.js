/* ============================================================
   views.js — every render function. Each one owns one or more
   containers and rebuilds them from Studs.state.content.

   Convention: a renderer writes innerHTML and nothing else. It
   never attaches listeners — all clicks go through the single
   delegated handler in app.js.

   The site is one document per page, so a renderer only finds
   its container on the page it belongs to. Each one therefore
   opens by checking for that container and returning if it is
   not in this document. That is what lets renderAll() stay a
   single list which every page can call.
   ============================================================ */

(function(S){
  "use strict";
  var $ = S.$, $$ = S.$$, esc = S.esc;
  function C(){ return S.state.content; }

  /* Edit / delete buttons attached to one record. Hidden by CSS
     unless the admin has inline editing on. */
  function tools(col,id){
    return '<span class="itools">'+
      '<button data-edit="'+col+':'+id+'" title="Edit">&#9998;</button>'+
      '<button data-del="'+col+':'+id+'" title="Delete">&#10005;</button></span>';
  }

  /* A photo slot that can be filled from the website itself.
     slot = the key its image is stored under. */
  function ph(slot, cls, caption){
    return '<div class="ph'+(cls?" "+cls:"")+'" data-slot="'+esc(slot)+
           '" data-ph="'+esc(caption||"Photo")+'"></div>';
  }

  /* One gold-strip tile (.stat) - k label, v value, n note. wide =
     the value is words rather than a number, one size step down.
     The value leads; what it is (k) and the note (n) follow as one
     plain line under it - no small label sitting above the figure. */
  function statLine(k, n){
    return [k, n].filter(function(x){ return x !== "" && x != null; })
      .map(function(x){ return esc(x); }).join(" · ");
  }
  function statTile(k, v, n, wide){
    var line = statLine(k, n);
    return '<div class="stat">'+
      '<div class="v'+(wide?' vw':'')+'">'+esc(v)+'</div>'+
      (line ? '<div class="n">'+line+'</div>' : '')+'</div>';
  }

  /* ---------------- home: achievements ---------------------- */
  S.renderStats = function(){
    if(!$("#statwrap")) return;
    $("#statwrap").innerHTML = C().stats.map(function(s){
      return '<div class="stat" data-item>'+
        '<div class="v">'+esc(s.v)+'</div>'+
        '<div class="n">'+statLine(s.k, s.n)+'</div>'+tools("stats",s.id)+'</div>';
    }).join("");
  };

  /* ---------------- home: news ticker ------------------------
     Replaces the achievements grid on the hero floor. One <a>
     wraps the whole strip in index.html — there is no per-headline
     link, so this only ever has to fill #tickertrack with text.
     The same joined line is written out twice back to back; the
     keyframe in components.css slides the track exactly one
     copy's width to the left, which is what makes the loop seamless
     instead of snapping at the end. Drafts stay out unless an
     admin is signed in, same rule postHTML uses below. */
  S.renderTicker = function(){
    var host = $("#tickertrack");
    if(!host) return;
    var items = C().news.filter(function(n){
      return n.status !== "draft" || S.can("console.use");
    });
    if(!items.length) return;
    var sep = '<span class="strip-dot" aria-hidden="true">&#9679;</span>';
    var line = items.map(function(n){
      return '<span class="strip-item">'+esc(n.title)+'</span>';
    }).join(sep);
    host.innerHTML =
      '<span class="strip-segment">'+line+sep+'</span>'+
      '<span class="strip-segment">'+line+sep+'</span>';
  };

  /* ---------------- news ------------------------------------ */
  function postHTML(n,i){
    var draft = n.status === "draft";
    if(draft && !S.can("console.use")) return "";       // drafts are admin-only
    return '<div class="post" data-item>'+
      ph("news:"+n.id, i===1?"gold":"", "Photo")+'<div>'+
      '<h3 class="pheadline">'+esc(n.title)+'</h3>'+
      '<div class="pmeta">'+esc(n.date)+' · <b>'+esc(n.tag)+'</b> · '+esc(n.author)+
      (draft?'<span class="draftpill">Draft</span>':'')+'</div>'+
      '<p class="pex">'+esc(n.excerpt)+'</p></div>'+tools("news",n.id)+'</div>';
  }
  /* The home page shows its posts as PICTURES: the photograph is
     the tile, a gradient lifts off its bottom edge so the title
     stays readable over any image, and the whole tile is a link to
     that post's own page.

     The .ph caption is suppressed in css/deck.css for these tiles.
     Normally an empty slot is captioned with what belongs there,
     but here the post title is already sitting on the picture and
     saying it twice reads as a mistake. */
  function tileHTML(n){
    var draft = n.status === "draft";
    if(draft && !S.can("console.use")) return "";       // drafts are admin-only
    return '<a class="ptile" data-item href="'+esc(S.postUrl(n.id))+'">'+
      '<div class="ph" data-slot="news:'+esc(n.id)+'" data-ph="'+esc(n.title)+'"></div>'+
      '<div class="ptileveil"></div>'+
      '<div class="ptiletext">'+
        '<div class="ptilemeta">'+esc(n.date)+' &middot; '+esc(n.tag)+
          (draft?'<span class="draftpill">Draft</span>':'')+'</div>'+
        '<h3 class="ptiletitle">'+esc(n.title)+'</h3>'+
      '</div>'+
      tools("news",n.id)+'</a>';
  }

  /* The home page shows the four most recent posts as tiles, the
     news page shows all of them as rows. Neither container is on
     both, so one function can own the pair. */
  S.renderNews = function(){
    if($("#homefeed")) $("#homefeed").innerHTML = C().news.slice(0,4).map(tileHTML).join("");
    if($("#newsfeed")) $("#newsfeed").innerHTML = C().news.map(postHTML).join("");
  };

  /* ---------------- one news post ---------------------------
     post.html renders whichever record the query string names -
     post.html?id=n1. One document serves every post, so a post
     written in the admin console is readable straight away
     without anyone adding a file. */
  S.renderPost = function(){
    var host = $("#postarea");
    if(!host) return;                          // not the post page

    var id = S.query("id");
    var all = C().news;
    var n = all.filter(function(r){ return r.id === id; })[0];

    /* A draft is admin-only wherever it appears, and that has to
       include somebody pasting the link. Treated as missing
       rather than refused: the existence of an unpublished post
       is not something to leak. */
    if(n && n.status === "draft" && !S.can("console.use")) n = null;

    if(!n){
      host.innerHTML =
        '<h1 class="disp d2" style="margin:0">That post<br>is not here</h1>'+
        '<p class="body" style="margin-top:20px">It may have been taken down, or the link may be wrong.</p>'+
        '<div class="herocta" style="margin-top:26px">'+
          '<a class="btn btn-gold" href="'+S.url("news")+'">All news</a>'+
          '<a class="btn" href="'+S.url("home")+'">Home</a>'+
        '</div>';
      return;
    }

    /* The tab should say which post this is, not just "Post". */
    document.title = n.title + " \u2014 The Slapping Studs";

    /* Same convention as the history chapters: a blank line starts
       a new paragraph, a single newline is a line break. */
    var paras = String(n.body||"").split(/\n\s*\n/)
      .map(function(t){ return t.trim(); })
      .filter(Boolean)
      .map(function(t){ return '<p>'+esc(t).replace(/\n/g,"<br>")+'</p>'; })
      .join("");

    /* Neighbours in the feed, drafts skipped for everyone who
       cannot see them. */
    var list = all.filter(function(r){ return r.status !== "draft" || S.can("console.use"); });
    var at = list.map(function(r){ return r.id; }).indexOf(n.id);
    var prev = at > 0 ? list[at-1] : null;
    var next = at > -1 && at < list.length-1 ? list[at+1] : null;

    host.innerHTML =
      '<article class="postfull" data-item>'+
        '<h1 class="disp d2" style="margin:0">'+esc(n.title)+'</h1>'+
        /* date, tag and author as a plain line under the title */
        '<p class="body postmeta" style="margin:14px 0 0">'+esc(n.date)+' &middot; <b>'+esc(n.tag)+'</b> &middot; '+esc(n.author)+
          (n.status==="draft"?'<span class="draftpill">Draft</span>':'')+'</p>'+
        '<div class="ph postcover" data-slot="news:'+esc(n.id)+'" data-ph="Photo for this post"></div>'+
        '<p class="postlead">'+esc(n.excerpt)+'</p>'+
        '<div class="postbody">'+
          (paras || '<p style="color:var(--edit)">'+
                    'No full text yet. An admin can write it in the console under News posts.</p>')+
        '</div>'+
        tools("news",n.id)+
      '</article>'+
      '<nav class="postnav">'+
        (prev ? '<a class="tlink" href="'+esc(S.postUrl(prev.id))+'">&larr; '+esc(prev.title)+'</a>'
              : '<span></span>')+
        (next ? '<a class="tlink" href="'+esc(S.postUrl(next.id))+'">'+esc(next.title)+' &rarr;</a>'
              : '<span></span>')+
      '</nav>';
  };

  /* ---------------- events rail ----------------------------- */
  S.renderEvents = function(){
    if(!$("#homeevents")) return;
    $("#homeevents").innerHTML = C().events.map(function(e){
      var badge = e.kind ? ' · <span class="tag '+e.kind+'">'+(e.kind==="home"?"Home":"Away")+'</span>' : "";
      return '<div class="ev" data-item>'+
        '<div class="evd"><div class="dd">'+esc(e.dd)+'</div><div class="mm">'+esc(e.mm)+'</div></div>'+
        '<div><div class="evt">'+esc(e.title)+'</div>'+
        '<div class="evs">'+esc(e.meta)+badge+'</div></div>'+tools("events",e.id)+'</div>';
    }).join("");
  };

  /* ---------------- home calendar ----------------------------
     Replaces the old news-tiles + upcoming-rail layout on the
     home page. Reads the same "events" collection the rail used
     to (dd/mm/title/meta/kind - no new fields), grouped by month
     name so the grid doesn't need a real Date per record. Every
     event carries a year implicitly: the whole site's seeded
     events sit inside 2026, so CAL_YEAR is fixed rather than
     stored per record - a real season spanning New Year's would
     need that field added, but nothing here does yet.
     Two or more events on the same day still only colour the
     cell once - the first one in the list wins - since a split
     cell has nowhere to put a second colour without crowding a
     box this small. */
  var CAL_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var CAL_MONTHNAMES = ["January","February","March","April","May","June","July",
    "August","September","October","November","December"];
  var CAL_YEAR = 2026;

  S.renderHomeCalendar = function(){
    var grid = $("#calgrid");
    if(!grid) return;
    var mi = S.state.calMonth;
    var mname = CAL_MONTHS[mi];

    if($("#calmonth")) $("#calmonth").textContent = CAL_MONTHNAMES[mi]+" "+CAL_YEAR;

    var byDay = {};
    C().events.forEach(function(e){
      if(e.mm !== mname) return;
      var d = parseInt(e.dd,10);
      (byDay[d] = byDay[d] || []).push(e);
    });

    var daysInMonth     = new Date(CAL_YEAR, mi+1, 0).getDate();
    var daysInPrevMonth = new Date(CAL_YEAR, mi,   0).getDate();
    var lead = (new Date(CAL_YEAR, mi, 1).getDay() + 6) % 7;   // Monday-first

    /* A pad cell still shows the real date it sits on — the tail
       of last month, the head of next — dimmed rather than blank,
       the way an actual calendar app never leaves a square empty. */
    function pad(n){ return '<div class="calcell calcell--pad"><span class="caldate">'+n+'</span></div>'; }

    var cells = "";
    for(var i=0;i<lead;i++) cells += pad(daysInPrevMonth - lead + 1 + i);

    for(var day=1; day<=daysInMonth; day++){
      var items = byDay[day] || [];
      var kind = items.length ? items[0].kind : "";
      /* Kick-off time rides in the top corner beside the date: the
         first piece of the event's meta line ("21:15 · IJsbaan
         Twente"), or the first clock time of a range. Whatever
         isn't a time ("All day") is shown as written. */
      var time = "";
      if(items.length){
        var m = String(items[0].meta||"").split(" \u00b7 ")[0];
        var hm = m.match(/^\d{1,2}:\d{2}/);
        time = hm ? hm[0] : m;
      }
      cells +=
        '<div class="calcell'+(kind?" calcell--"+kind:"")+'">'+
          '<div class="caltop"><span class="caldate">'+day+'</span>'+
            (time ? '<span class="caltime">'+esc(time)+'</span>' : '')+
          '</div>'+
          items.map(function(e){
            return '<div class="calev" data-item>'+
              '<span class="calevt">'+esc(e.title)+'</span>'+
              tools("events",e.id)+
            '</div>';
          }).join("")+
        '</div>';
    }

    var trail = (7 - ((lead + daysInMonth) % 7)) % 7;
    for(var t=1;t<=trail;t++) cells += pad(t);

    grid.innerHTML = cells;
  };

  /* ---------------- announcements ----------------------------
     Sits beside the home calendar - housekeeping that never earns
     a news post (gear, votes, carpools). Reads the "announcements"
     collection as-is, newest first in the seed data; nothing here
     re-sorts it. */
  S.renderAnnouncements = function(){
    var list = $("#annlist");
    if(!list) return;
    var items = C().announcements;
    list.innerHTML = items.length ? items.map(function(a){
      return '<div class="ann" data-item>'+
        '<div class="annhead"><span class="tag note">'+esc(a.tag)+'</span>'+
        '<span class="annwhen">'+esc(a.when)+'</span></div>'+
        '<p class="anntext">'+esc(a.text)+'</p>'+
        tools("announcements",a.id)+
      '</div>';
    }).join("") : '<p class="gatemsg" style="margin:0;padding:20px 0">Nothing posted right now.</p>';
  };

  /* ---------------- roster ----------------------------------
     Grouped by position the way a team sheet is written:
     goaltenders, defence, forwards — then the staff. The team
     filter narrows all three groups at once. */
  var POSGROUPS = [
    {key:"Goaltender", label:"Goaltenders"},
    {key:"Defence",    label:"Defence"},
    {key:"Forward",    label:"Forwards"}
  ];

  /* The picture on a card. A photo slot like everywhere else on
     the site - so a member's own picture, once uploaded, lands
     here through applyPhotos() and covers the drawing - but with
     the illustrated avatar from js/avatar.js drawn inside it
     instead of the hatched "Portrait" placeholder. Guests and
     members who set nothing get the character generated from
     their id; a member's chosen traits (p.avatar) override it. */
  function avatarSlot(slot, rec, opts){
    return '<div class="ph ph--avatar'+(rec.avatar?" ph--own":"")+'" data-slot="'+esc(slot)+'" data-ph="">'+
      S.avatarSVG(rec, opts)+'</div>';
  }
  var POSK = {Goaltender:"G", Defence:"D", Forward:"F"};
  function playerCard(p){
    return '<div class="pl pl--av" data-item>'+
      avatarSlot("player:"+p.id, p)+
      /* the jersey number leads the name line (NY Rangers face, see
         paper.css) rather than floating over the picture */
      '<div class="plb"><div class="pn"><span class="no">'+(String(p.no)==="0" ? "" : "#"+esc(p.no))+'</span> '+esc(p.name)+'</div>'+
      '<div class="pp"><span class="sq sq-'+esc(String(p.team).replace(/\s+/g,"").toLowerCase())+'"></span>'+
        esc(p.team)+' <i>&middot;</i> '+(POSK[p.pos]||esc(p.pos))+'</div></div>'+
      tools("players",p.id)+'</div>';
  }

  /* gold strip under the players.html head: one tile per squad,
     head-count from the players collection, skaters / goalies as
     the note. Nothing typed - it follows the roster. */
  function renderPlayersStrip(){
    var el = $("#plstrip"); if(!el) return;
    el.innerHTML = ["Studs 1","Studs 2","Stallions","Cadets"].map(function(t){
      var l = C().players.filter(function(p){ return p.team===t; });
      var g = l.filter(function(p){ return p.pos==="Goaltender"; }).length;
      return statTile(l.length+" players", t, (l.length-g)+" skaters \u00b7 "+g+" goalie"+(g===1?"":"s"), true);
    }).join("");
  }

  S.renderPlayers = function(){
    if(!$("#roster")) return;
    renderPlayersStrip();
    var f = S.state.plFilter;
    var teams = ["All","Studs 1","Studs 2","Stallions","Cadets"];

    $("#plfilters").innerHTML = teams.map(function(t){
      return '<button class="filt'+(t===f?" on":"")+'" data-filt="'+esc(t)+'">'+esc(t)+
        '<i>'+(t==="All"? C().players.length
                        : C().players.filter(function(p){return p.team===t;}).length)+'</i></button>';
    }).join("");

    var list = C().players.filter(function(p){ return f==="All" || p.team===f; });

    $("#roster").innerHTML = POSGROUPS.map(function(g){
      var group = list.filter(function(p){ return p.pos === g.key; });
      if(!group.length) return "";
      return '<section class="posgroup">'+
        '<div class="poshead"><h3>'+esc(g.label)+'</h3>'+
        '<span class="poscount">'+group.length+(f==="All"?"":" · "+esc(f))+'</span></div>'+
        '<div class="roster">'+group.map(function(p){ return playerCard(p); }).join("")+'</div></section>';
    }).join("") ||
      '<div class="gatemsg"><p>No players in this squad yet.</p></div>';

    /* staff sit under the roster, never inside a position group */
    $("#staffgrid").innerHTML = C().staff.map(function(m){
      return '<div class="pl pl--av staff" data-item>'+
        avatarSlot("staff:"+m.id, m, {staff:true})+
        '<div class="plb"><div class="pn">'+esc(m.name)+'</div>'+
        '<div class="pp">'+esc(m.role)+'</div></div>'+tools("staff",m.id)+'</div>';
    }).join("");

    $("#coachpanel").innerHTML = S.can("roster.edit") ?
      '<div class="gatemsg" style="margin-top:34px;border-color:rgba(143,209,176,.4)"><div>'+
      '<p style="margin:0 0 8px;font-size:17px;font-weight:700;color:var(--bone)">Coach tools</p>'+
      '<p>You can edit rosters and lineups for Stallions and Studs 1 and publish game sheets. Board members can do this for every squad.</p></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
      '<button class="btn btn-sm" data-add="players">Add player</button></div></div>' : "";
  };

  /* ---------------- scoring (stats.html) -------------------
     Its own page under Team now. Scoring is illustrative: the
     club does not publish per-player statistics, so the table
     shows the SHAPE with numbers generated from each player id
     (stable between renders) and says so underneath.

     Filterable by squad — the same team filter players.html
     uses, its own state key so the two pages never fight over
     which squad is selected. "All" pools every skater (everyone
     but goaltenders, who don't score) across all four squads. */
  S.renderScoring = function(){
    if(!$("#scoring")) return;                 // only on stats.html
    var f = S.state.statFilter;
    var sortKey = S.state.statSort || "pts";
    var showAll = !!S.state.statAll;
    var TOP = 15;                              // rows shown before "show all"
    var teams = ["All","Studs 1","Studs 2","Stallions","Cadets"];

    if($("#statfilters")) $("#statfilters").innerHTML = teams.map(function(t){
      return '<button class="filt'+(t===f?" on":"")+'" data-sfilt="'+esc(t)+'">'+esc(t)+
        '<i>'+(t==="All"? C().players.length
                        : C().players.filter(function(p){return p.team===t;}).length)+'</i></button>';
    }).join("");

    var scorers = C().players.filter(function(p){
      return p.pos !== "Goaltender" && (f === "All" || p.team === f);
    }).map(function(p){
      var seed = 0; for(var i=0;i<p.id.length;i++) seed += p.id.charCodeAt(i);
      var gp = 12 + (seed % 4);
      var g  = p.pos === "Forward" ? (seed % 15) + 2 : (seed % 5);
      var a  = (seed % 11) + 1;
      return {p:p, gp:gp, g:g, a:a, pts:g+a, pim:(seed % 9)*2};
    });

    /* Points is the default order and the tie-breaker for every
       other column: sort by the chosen stat, then by points, then
       by goals, so two equal rows never swap between renders. */
    function by(k){
      return function(x,y){
        return (y[k]-x[k]) || (y.pts-x.pts) || (y.g-x.g) || x.p.name.localeCompare(y.p.name);
      };
    }
    var ranked = scorers.slice().sort(by("pts"));   // rank = points order, always
    var rankOf = {}; ranked.forEach(function(r,i){ rankOf[r.p.id] = i+1; });
    var rows = scorers.slice().sort(by(sortKey));
    var max = ranked.length ? Math.max(1, ranked[0].pts) : 1;

    /* --- leaders: the three numbers a scoring page exists for --- */
    function leaderCard(label, k){
      var top = scorers.slice().sort(by(k)).slice(0,3);
      if(!top.length) return "";
      var l = top[0];
      /* the figure leads, and the line beside it says what it counts:
         "27 / Name / most points · Studs 1 · #12" - no label above */
      return '<div class="leader">'+
        '<div class="leader__top">'+
          '<span class="leader__n">'+l[k]+'</span>'+
          '<span class="leader__who"><b>'+esc(l.p.name)+'</b>'+
            '<span>Most '+esc(label.toLowerCase())+' &middot; '+esc(l.p.team)+' &middot; #'+(String(l.p.no)==="0"?"&mdash;":esc(l.p.no))+'</span></span>'+
        '</div>'+
        '<ol class="leader__next">'+top.slice(1).map(function(r,i){
          return '<li><span class="ln">'+(i+2)+'</span><span class="lnm">'+esc(r.p.name)+'</span><span class="lv">'+r[k]+'</span></li>';
        }).join("")+'</ol>'+
      '</div>';
    }
    if($("#leaders")) $("#leaders").innerHTML =
      leaderCard("Points","pts")+leaderCard("Goals","g")+leaderCard("Assists","a");

    /* --- the table head: click a stat to sort by it --- */
    var head = [
      {k:"rk",  t:"Rk",     cls:"prk"},
      {k:"no",  t:"#",      cls:"pno"},
      {k:"name",t:"Player", cls:""},
      {k:"pos", t:"Pos",    cls:"ppos"},
      {k:"gp",  t:"GP",     cls:"pnum", sort:1},
      {k:"g",   t:"G",      cls:"pnum", sort:1},
      {k:"a",   t:"A",      cls:"pnum", sort:1},
      {k:"pts", t:"Pts",    cls:"ppts", sort:1},
      {k:"pim", t:"PIM",    cls:"pnum", sort:1}
    ];
    if($("#scorehead")) $("#scorehead").innerHTML = '<tr>'+head.map(function(h){
      var on = h.sort && h.k === sortKey;
      return '<th class="'+h.cls+(h.sort?' sortable':'')+(on?' on':'')+'"'+
        (h.sort?' data-ssort="'+h.k+'" title="Sort by '+esc(h.t)+'"':'')+'>'+
        esc(h.t)+(h.sort?'<i aria-hidden="true"></i>':'')+'</th>';
    }).join("")+'</tr>';

    var shown = showAll ? rows : rows.slice(0, TOP);
    $("#scoring").innerHTML = shown.map(function(r){
      var rk = rankOf[r.p.id];
      var posK = r.p.pos.charAt(0);
      return '<tr'+(rk<=3?' class="top3"':'')+'>'+
        '<td class="prk">'+rk+'</td>'+
        '<td class="pno">'+(String(r.p.no)==="0"?"&mdash;":esc(r.p.no))+'</td>'+
        '<td class="pname">'+esc(r.p.name)+
          (f==="All"?'<span class="psq">'+esc(r.p.team)+'</span>':'')+'</td>'+
        '<td class="ppos"><span class="pospill pos-'+posK+'">'+posK+'</span></td>'+
        '<td class="pnum">'+r.gp+'</td>'+
        '<td class="pnum'+(sortKey==="g"?' sorted':'')+'">'+r.g+'</td>'+
        '<td class="pnum'+(sortKey==="a"?' sorted':'')+'">'+r.a+'</td>'+
        '<td class="ppts"><span class="ptsbar" style="--w:'+Math.round(r.pts/max*100)+'%"></span>'+r.pts+'</td>'+
        '<td class="pnum'+(sortKey==="pim"?' sorted':'')+'">'+r.pim+'</td></tr>';
    }).join("") || '<tr><td colspan="9" class="pname" style="padding:22px 0;color:var(--ink-m)">No skaters in this squad yet.</td></tr>';

    if($("#scoremore")) $("#scoremore").innerHTML = rows.length > TOP ?
      '<button class="sshow" data-sshow="1">'+
        (showAll ? 'Show top '+TOP : 'Show all '+rows.length+' skaters')+
      '</button>' : '';

    if($("#scoremeta")) $("#scoremeta").innerHTML =
      '<span>'+scorers.length+' skaters</span>'+
      '<span>'+scorers.reduce(function(n,r){return n+r.g;},0)+' goals</span>'+
      '<span>'+scorers.reduce(function(n,r){return n+r.a;},0)+' assists</span>';
  };

  /* ---------------- standings -------------------------------
     One table per division, in the order the divisions first
     appear in the collection, so the board controls the order by
     ordering the records rather than by editing this file.

     The club's own squads get a gold dot rather than a
     highlighted row: the row still has to read as one of many,
     it just has to be findable without being read. */
  S.renderStandings = function(){
    var host = $("#standingstables");
    if(!host) return;                       // not the games page

    var rows = C().standings || [];
    var divs = [];
    rows.forEach(function(r){ if(divs.indexOf(r.div) < 0) divs.push(r.div); });

    var head = ["#","Team","GP","W","OTW","L","GD","PTS"];

    host.innerHTML = divs.map(function(div){
      var table = rows.filter(function(r){ return r.div === div; });
      var squads = table.filter(function(r){ return r.us; })
        .map(function(r){ return r.team; }).join(" \u00b7 ");

      return '<div class="pcard">'+
        '<div class="phead-p">'+
          '<span style="display:flex;align-items:baseline;gap:12px;flex-wrap:wrap">'+
            '<h3 class="pheadline">'+esc(div)+'</h3>'+
            '<span class="plabel">'+esc(squads)+'</span>'+
          '</span>'+
          '<span class="plabel">'+table.length+' teams</span>'+
        '</div>'+
        '<div class="ptable-wrap"><table class="ptable"><thead><tr>'+
          head.map(function(h,i){
            var cls = i === 0 || i === 1 ? "" : (i === head.length-1 ? "ppts" : "pnum");
            return '<th'+(cls?' class="'+cls+'"':'')+'>'+esc(h)+'</th>';
          }).join("")+
        '</tr></thead><tbody>'+
        table.map(function(r){
          return '<tr data-item>'+
            '<td>'+esc(r.pos)+'</td>'+
            '<td class="pname">'+(r.us?'<span class="pus"></span>':'')+esc(r.team)+'</td>'+
            '<td class="pnum">'+esc(r.gp)+'</td>'+
            '<td class="pnum">'+esc(r.w)+'</td>'+
            '<td class="pnum">'+esc(r.otw)+'</td>'+
            '<td class="pnum">'+esc(r.l)+'</td>'+
            '<td class="pnum">'+esc(r.gd)+'</td>'+
            '<td class="ppts">'+esc(r.pts)+tools("standings",r.id)+'</td>'+
            '</tr>';
        }).join("")+
        '</tbody></table></div>'+
        '</div>';
    }).join("");
  };

  /* ---------------- training: the week and the kit ----------
     Both live on training.html and neither is on any other page,
     so one function owns the pair. */
  S.renderTraining = function(){
    var sess = C().sessions || [];
    var dash = function(t){ return String(t||"").replace(/\s+-\s+/g," \u2013 "); };

    /* gold strip: the time for each training day and nothing else.
       The window runs from the earliest start to the latest end of
       the day's slots; the note says how many groups and how long. */
    if($("#trainstrip")){
      $("#trainstrip").innerHTML = sess.map(function(t){
        var st = [], en = [];
        [t.t1, t.t2].forEach(function(x){
          var m = /(\d{1,2}:\d{2})\s*[-\u2013]\s*(\d{1,2}:\d{2})/.exec(String(x||""));
          if(m){ st.push(m[1]); en.push(m[2]); }
        });
        var win = st.length ? st.sort()[0]+" \u2013 "+en.sort()[en.length-1] : dash(t.t1);
        var note = [(t.g1 && t.g2) ? "Two groups" : "", t.len].filter(Boolean).join(" \u00b7 ");
        return statTile(t.day, win, note, false);
      }).join("");
    }

    /* the next dates a day runs on, from a rule like "1,3,5" (the
       1st, 3rd and 5th such weekday of the month) */
    var WD = {sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6};
    function nextDates(day, rule, n){
      var wd = WD[String(day||"").toLowerCase()], ok = String(rule||"").split(",")
        .map(function(x){ return parseInt(x,10); }).filter(Boolean), out = [];
      if(wd === undefined || !ok.length) return out;
      var d = new Date(); d.setHours(0,0,0,0);
      for(var i=0; i<400 && out.length<n; i++, d.setDate(d.getDate()+1)){
        if(d.getDay() === wd && ok.indexOf(Math.ceil(d.getDate()/7)) > -1)
          out.push(d.toLocaleDateString("en-GB",{day:"numeric",month:"short"}));
      }
      return out;
    }

    /* the four steps: numbered cards on the hairline grid. The
       number is the visual, the title is the sentence, and the
       first card carries the one link a newcomer needs. */
    if($("#steps")) $("#steps").innerHTML =
      (C().steps || []).map(function(st,i){
        var n = String(i+1); if(n.length<2) n = "0"+n;
        return '<div class="stepcard" data-item>'+
          '<span class="stepcard__n">'+n+'</span>'+
          '<span class="stepcard__k">'+esc(st.n)+'</span>'+
          '<h3 class="stepcard__t">'+esc(st.title)+'</h3>'+
          '<p class="stepcard__b">'+esc(st.body)+'</p>'+
          (i===0?'<a class="tlink stepcard__go" href="'+S.url("join")+'">Sign up for a practice &rarr;</a>':'')+
          tools("steps",st.id)+'</div>';
      }).join("");

    /* the week: one ticket per training day. Each ticket is a small
       evening timeline - the slots are blocks placed on a shared
       hour axis, so who skates when (and that Friday is short) can be
       read at a glance. The axis runs from the earliest start to the
       latest end over all the days, rounded to whole hours. */
    var TIME = /(\d{1,2}):(\d{2})\s*[-\u2013]\s*(\d{1,2}):(\d{2})/;
    var mins = function(h,m){ return parseInt(h,10)*60 + parseInt(m,10); };
    var lo = 24*60, hi = 0;
    sess.forEach(function(t){ [t.t1,t.t2].forEach(function(x){
      var m = TIME.exec(String(x||"")); if(!m) return;
      lo = Math.min(lo, mins(m[1],m[2])); hi = Math.max(hi, mins(m[3],m[4]));
    }); });
    if(hi <= lo){ lo = 19*60; hi = 23*60; }
    var ax0 = Math.floor(lo/60)*60, ax1 = Math.ceil(hi/60)*60, span = ax1-ax0;
    var ticks = []; for(var hh=ax0; hh<=ax1; hh+=60) ticks.push(hh);
    var hhmm = function(x){ var h = Math.floor(x/60); return (h<10?"0":"")+h+":00"; };
    if($("#sessionlist")) $("#sessionlist").innerHTML = sess.map(function(t){
      var blk = function(g,tm){
        var m = TIME.exec(String(tm||"")); if(!m) return "";
        var a = mins(m[1],m[2]), b = mins(m[3],m[4]);
        var c = /1\s*[-\u2013]\s*3/.test(g) ? "a" : /4\s*[-\u2013]\s*6/.test(g) ? "b" : "c";
        return '<div class="tkt__blk tkt__blk--'+c+'" style="left:'+((a-ax0)/span*100)+'%;width:'+((b-a)/span*100)+'%">'+
          '<span class="tkt__g">'+esc(g)+'</span>'+
          '<span class="tkt__t"><span class="tkt__tp">'+esc(m[1]+":"+m[2])+'</span> <span class="tkt__tp">\u2013 '+esc(m[3]+":"+m[4])+'</span></span></div>';
      };
      var dates = nextDates(t.day, t.rule, 4);
      return '<div class="tkt" data-item>'+
        '<div class="tkt__head"><b>'+esc(t.day)+'</b><span>'+esc(t.len)+'</span></div>'+
        '<div class="tkt__axis" aria-hidden="true">'+ticks.map(function(x,i){
          return '<span style="left:'+((x-ax0)/span*100)+'%" class="'+(i===0?"is-first":i===ticks.length-1?"is-last":"")+'">'+hhmm(x)+'</span>';
        }).join("")+'</div>'+
        '<div class="tkt__bar">'+blk(t.g1,t.t1)+blk(t.g2,t.t2)+'</div>'+
        (dates.length ? '<div class="tkt__dates" aria-label="Next dates">'+
          dates.map(function(x){ return '<span>'+esc(x)+'</span>'; }).join("")+'</div>' : "")+
        tools("sessions",t.id)+'</div>';
    }).join("");

    /* the checklist: an empty box for what you bring, a ticked one
       for what the club lends - one row style for both */
    var row = function(k,lends){
      var note = String(k.loan||"");
      if(lends){
        note = note.replace(/^yes\b\s*[-\u2013\u2014:]?\s*/i,"");
        note = note.charAt(0).toUpperCase()+note.slice(1);
      }
      return '<div class="kp__row'+(lends?" kp__row--yes":"")+'" data-item>'+
        '<i class="kp__box" aria-hidden="true"></i><b>'+esc(k.item)+'</b>'+
        '<span>'+esc(note)+'</span>'+tools("kit",k.id)+'</div>';
    };
    var kit = C().kit || [], isLend = function(k){ return /^yes/i.test(String(k.loan||"")); };
    if($("#kitbring")) $("#kitbring").innerHTML =
      kit.filter(function(k){ return !isLend(k); }).map(function(k){ return row(k,false); }).join("");
    if($("#kitlend")) $("#kitlend").innerHTML =
      kit.filter(isLend).map(function(k){ return row(k,true); }).join("");
  };

  /* ---------------- one game sheet --------------------------
     game.html renders the sheet of whichever fixture the query
     string names - game.html?id=g6. The fixture row lives in
     games[] or pastgames[]; the sheet is the gamesheets record
     whose .game points at it, and its goals, penalties and lineup
     are rows in sheetgoals / sheetpens / sheetlineup with the
     same .game. One document serves every sheet, so a sheet the
     board types into the admin console is readable at once. */
  S.renderGameSheet = function(){
    var hero = $("#gshero"), sheet = $("#gssheet");
    if(!hero || !sheet) return;                // not the game page

    var id = S.query("id");
    var byGame = function(col){
      return (C()[col] || []).filter(function(r){ return r.game === id; });
    };
    var gs = byGame("gamesheets")[0];
    var fx = (C().games || []).concat(C().pastgames || [])
               .filter(function(g){ return g.id === id; })[0];

    if(!gs){
      hero.innerHTML =
        '<h1 class="disp d2" style="margin:0">'+
          (fx ? esc(fx.fixture) : 'That game<br>is not here')+'</h1>'+
        '<p class="body" style="margin-top:20px">'+
          (fx ? 'No sheet yet: the game sheet for this fixture has not been published. '+
                (fx.result ? 'Result: '+esc(fx.result)+'.' : '')
              : 'The link may be wrong, or the game may have been taken down.')+'</p>'+
        '<div class="herocta" style="margin-top:26px">'+
          '<a class="btn btn-gold" href="'+S.url("games")+'">This season</a>'+
          '<a class="btn" href="'+S.url("pastgames")+'">Past seasons</a>'+
        '</div>';
      sheet.innerHTML = "";
      if($("#gsmeta")) $("#gsmeta").innerHTML = "";
      return;
    }

    document.title = gs.home+" "+gs.hs+"–"+gs.as+" "+gs.away+" — The Slapping Studs";

    /* ---- the score, on ink ----------------------------------
       Home left, away right, the final between them; the period
       split under the box so the story of the game is readable
       before the tables are. A Studs side is gold, like the dot
       in the standings; when both are ours, both are. */
    var isUs = function(name){ return /studs|stallions|cadets/i.test(String(name||"")); };
    var hp = String(gs.hp||"").split(/[-–\s]+/).filter(Boolean),
        ap = String(gs.ap||"").split(/[-–\s]+/).filter(Boolean);
    var nper = Math.max(hp.length, ap.length);
    var perHead = [], perHome = [], perAway = [];
    for(var i=0;i<nper;i++){
      perHead.push('<th>'+(i<3 ? (i+1) : (i===3 ? 'OT' : 'SO'))+'</th>');
      perHome.push('<td>'+esc(hp[i]||"0")+'</td>');
      perAway.push('<td>'+esc(ap[i]||"0")+'</td>');
    }
    var periods = nper ?
      '<table class="gs-periods"><thead><tr><th></th>'+perHead.join("")+'<th>T</th></tr></thead><tbody>'+
        '<tr><th>'+esc(gs.home)+'</th>'+perHome.join("")+'<td class="t">'+esc(gs.hs)+'</td></tr>'+
        '<tr><th>'+esc(gs.away)+'</th>'+perAway.join("")+'<td class="t">'+esc(gs.as)+'</td></tr>'+
      '</tbody></table>' : '';

    hero.innerHTML =
      '<p class="eyebrow gs-comp">Game sheet'+(gs.comp ? ' &middot; <b>'+esc(gs.comp)+'</b>' : '')+'</p>'+
      '<div class="gs-final">'+
        '<div class="gs-side gs-side--home">'+
          '<p class="gs-team'+(isUs(gs.home)?' us':'')+'">'+esc(gs.home)+'</p>'+
          '<p class="gs-rec">Home'+(gs.homeRec ? ' &middot; '+esc(gs.homeRec) : '')+'</p>'+
        '</div>'+
        '<div class="gs-score"><b>'+esc(gs.hs)+'</b><span>'+esc(gs.status||"FT")+'</span><b>'+esc(gs.as)+'</b></div>'+
        '<div class="gs-side gs-side--away">'+
          '<p class="gs-team'+(isUs(gs.away)?' us':'')+'">'+esc(gs.away)+'</p>'+
          '<p class="gs-rec">Away'+(gs.awayRec ? ' &middot; '+esc(gs.awayRec) : '')+'</p>'+
        '</div>'+
      '</div>'+
      periods+
      tools("gamesheets",gs.id);

    /* ---- the sheet, on paper -------------------------------- */
    /* date / face-off / venue / referees ride on the gold strip
       under the score (#gsmeta), the stats.html pattern */
    var meta = "";
    if($("#gsmeta")) $("#gsmeta").innerHTML =
      [["Date",gs.date],["Face-off",gs.faceoff],["Venue",gs.venue],["Referees",gs.refs]]
      .filter(function(m){ return m[1]; })
      .map(function(m){ return statTile(m[0], m[1], "", m[0]!=="Face-off"); })
      .join("");

    /* lineup: home side first, then away; grouped by position in
       the order a team sheet is written */
    var posOrder = ["Goalies","Defense","Forwards"];
    var lineup = byGame("sheetlineup");
    var goals = byGame("sheetgoals"), pens = byGame("sheetpens");

    /* A skater's G / A / PIM is derived from the goal and penalty
       rows when the lineup row leaves stat empty (or "—"), so the
       board types each event once. A goalie's stat (saves) has no
       source here and stays whatever was typed. */
    function pim(min){
      return String(min||"").split("+").reduce(function(t,x){ return t + (parseInt(x,10)||0); }, 0);
    }
    function derived(r){
      if(r.pos === "Goalies") return r.stat || "\u2014";
      var g=0,a=0,p=0;
      goals.forEach(function(x){
        if(x.scorer === r.name) g++;
        String(x.assists||"").split(",").forEach(function(n){ if(n.trim() === r.name) a++; });
      });
      pens.forEach(function(x){ if(String(x.player||"").indexOf(r.name) > -1) p += pim(x.min); });
      return g+"/"+a+"/"+p;
    }
    function side(which, team){
      var rows = lineup.filter(function(r){ return (r.side||"home") === which; });
      if(!rows.length) return "";
      return '<div class="gs-lineup__team"><p class="gs-lineup__name">'+esc(team)+'</p>'+
        posOrder.map(function(p){
          var ps = rows.filter(function(r){ return r.pos === p; });
          if(!ps.length) return "";
          return '<div class="gs-pos"><p class="gs-pos__h">'+p+'</p>'+
            ps.map(function(r){
              return '<div class="gs-row" data-item><span class="gs-no">'+esc(r.no)+'</span>'+
                '<span class="gs-name">'+esc(r.name)+'</span><span class="gs-stat">'+
                esc(r.stat && r.stat !== "\u2014" ? r.stat : derived(r))+'</span>'+
                tools("sheetlineup",r.id)+'</div>';
            }).join("")+'</div>';
        }).join("")+'</div>';
    }
    var lineupHTML = lineup.length ?
      '<div class="gs-lineup__head"><span class="gs-h">Lineups</span><span class="gs-legend">G / A / PIM</span></div>'+
      side("home",gs.home)+side("away",gs.away) : '';

    /* scoring summary: the mono/display split the mockup drew -
       times and codes in mono, the scorer in display weight */
    var scoring = goals.length ?
      '<div class="tblwrap gs-tblwrap"><table class="gs-goals">'+
        '<thead><tr><th>Per</th><th>Time</th><th>Team</th><th>Goal</th><th>Assists</th><th>Sit</th><th class="r">Score</th></tr></thead><tbody>'+
        goals.map(function(g){
          return '<tr data-item><td class="num">'+esc(g.per)+'</td><td class="num tm">'+esc(g.time)+'</td>'+
            '<td class="code">'+esc(g.team)+'</td><td class="name">'+esc(g.scorer)+'</td>'+
            '<td class="asst">'+esc(g.assists)+'</td><td class="num">'+esc(g.sit)+'</td>'+
            '<td class="sc">'+esc(g.score)+tools("sheetgoals",g.id)+'</td></tr>';
        }).join("")+'</tbody></table></div>' :
      '<p class="gs-empty">No goals recorded.</p>';

    var penalties = pens.length ?
      pens.map(function(p){
        return '<div class="gs-pen" data-item>'+
          '<span class="gs-pen__t">'+esc(p.time)+(p.per ? '<i>('+esc(p.per)+')</i>' : '')+'</span>'+
          '<span class="gs-pen__who"><b>'+esc(p.player)+'</b><span>'+esc(p.inf)+'</span></span>'+
          '<span class="gs-pen__min">'+esc(p.min)+'</span>'+tools("sheetpens",p.id)+'</div>';
      }).join("") :
      '<p class="gs-empty">A clean game &mdash; no penalties.</p>';

    var stars = [[gs.star1,gs.star1line],[gs.star2,gs.star2line],[gs.star3,gs.star3line]]
      .filter(function(s){ return s[0]; })
      .map(function(s,i){
        return '<div class="gs-star"><span class="gs-star__n">'+(i+1)+'</span>'+
          '<span class="gs-star__who"><b>'+esc(s[0])+'</b>'+(s[1] ? '<span>'+esc(s[1])+'</span>' : '')+'</span></div>';
      }).join("");

    sheet.innerHTML =
      (meta ? '<div class="gs-meta">'+meta+'</div>' : '')+
      '<div class="gs-grid">'+
        '<aside class="gs-lineup">'+lineupHTML+'</aside>'+
        '<div class="gs-main">'+
          '<section class="gs-block"><p class="gs-h">Scoring</p>'+scoring+'</section>'+
          '<section class="gs-block gs-block--raised"><p class="gs-h">Penalties</p><div class="gs-pens">'+penalties+'</div></section>'+
          (stars ? '<section class="gs-block"><p class="gs-h">Three stars</p><div class="gs-stars">'+stars+'</div></section>' : '')+
        '</div>'+
      '</div>';
  };

  /* ---------------- games + competitions -------------------- */
  /* A fixture has a sheet when a gamesheets record points at it.
     The link goes to game.html?id=<fixture id>; the row itself is
     also clickable (tr[data-sheet], handled in app.js) so the
     whole line reads as the way in, not only the last word. */
  function hasSheet(id){
    return (C().gamesheets || []).some(function(r){ return r.game === id; });
  }
  function sheetCell(g){
    return hasSheet(g.id) ? '<a class="tlink" href="'+esc(S.gameUrl(g.id))+'">Sheet</a>' : '&mdash;';
  }
  function trOpen(g){
    return hasSheet(g.id) ? '<tr data-sheet="'+esc(S.gameUrl(g.id))+'">' : '<tr>';
  }

  function gameRow(g, col){
    return trOpen(g)+'<td class="num">'+esc(g.date)+'</td><td class="num">'+esc(g.team)+'</td>'+
      '<td class="name">'+esc(g.fixture)+'</td><td class="num">'+esc(g.venue)+'</td>'+
      '<td class="res '+esc(g.outcome)+'">'+esc(g.result)+'</td>'+
      '<td class="num">'+sheetCell(g)+
      (S.can("console.use")?' <span class="rowacts" style="display:inline-flex;margin-left:8px">'+
        '<button data-edit="'+col+':'+g.id+'">Edit</button></span>':'')+'</td></tr>';
  }

  /* Two containers on two different pages: the fixture list is on
     games.html, the competitions are on competitions.html. Each
     half checks for its own container. */
  S.renderGames = function(){
    if($("#gamesbody")){
      var all = C().games, sel = S.state.gTeam;
      var teams = [];
      all.forEach(function(g){ if(teams.indexOf(g.team)<0) teams.push(g.team); });
      /* Club order, not order of appearance - same as the squad
         legend on players.html. Anything unknown goes last. */
      var order = ["Studs 1","Studs 2","Stallions","Cadets"];
      teams.sort(function(a,b){
        var ia = order.indexOf(a), ib = order.indexOf(b);
        return (ia<0?99:ia) - (ib<0?99:ib);
      });
      if(sel!=="all" && teams.indexOf(sel)<0) sel = S.state.gTeam = "all";
      var rows = all.filter(function(g){ return sel==="all" || g.team===sel; });

      /* Same shape as past-games.html: filter chips with a count,
         then won / lost / upcoming tallies for what is on screen. */
      if($("#gfilters")) $("#gfilters").innerHTML =
        '<button class="filt'+(sel==="all"?" on":"")+'" data-gteam="all">All squads'+
        '<i>'+all.length+'</i></button>'+
        teams.map(function(t){
          return '<button class="filt'+(sel===t?" on":"")+'" data-gteam="'+esc(t)+'">'+esc(t)+
            '<i>'+all.filter(function(g){return g.team===t;}).length+'</i></button>';
        }).join("");

      $("#gamesbody").innerHTML = rows.length
        ? rows.map(function(g){ return gameRow(g,"games"); }).join("")
        : '<tr><td colspan="6" class="name">No games for this squad yet.</td></tr>';

      if($("#gsummary")){
        var w = rows.filter(function(g){return g.outcome==="w";}).length;
        var l = rows.filter(function(g){return g.outcome==="l";}).length;
        var ups = rows.filter(function(g){return !g.outcome;});
        var played = rows.length - ups.length;
        /* the list runs newest first, so the next game is the last
           upcoming row */
        var nx = ups[ups.length-1];
        $("#gsummary").innerHTML =
          statTile("Won", w, "of "+played+" played")+
          statTile("Lost", l, "of "+played+" played")+
          statTile("Upcoming", ups.length, nx ? "Next \u00b7 "+nx.date+" \u00b7 "+nx.team : "Season played out")+
          statTile("Games", rows.length, sel==="all" ? "All squads" : sel);
      }
    }

    if($("#comps"))
      $("#comps").innerHTML = C().comps.map(function(c){
        return '<div class="pcell" data-item><h3>'+esc(c.title)+'</h3>'+
          '<p class="body">'+esc(c.body)+'</p>'+tools("comps",c.id)+'</div>';
      }).join("");

    /* competitions.html gold strip: where each of our squads stands,
       read off the standings rows flagged us=yes - nothing typed twice */
    if($("#compstrip")){
      var ord = function(n){ n = parseInt(n,10)||0;
        var s = ["th","st","nd","rd"], v = n%100;
        return n+(s[(v-20)%10]||s[v]||s[0]); };
      var ours = (C().standings||[]).filter(function(r){ return r.us; });
      var size = function(div){ return (C().standings||[]).filter(function(r){ return r.div===div; }).length; };
      $("#compstrip").innerHTML = ours.map(function(r){
        return statTile(r.div, ord(r.pos)+" place", r.team+" \u00b7 "+r.pts+" pts \u00b7 of "+size(r.div));
      }).join("");
    }
  };

  /* ---------------- past games archive ---------------------- */
  S.renderPastGames = function(){
    if(!$("#pastgamesbody")) return;
    var seasons = [];
    C().pastgames.forEach(function(g){ if(seasons.indexOf(g.season)<0) seasons.push(g.season); });
    var sel = S.state.pgSeason;

    $("#pgfilters").innerHTML =
      '<button class="filt'+(sel==="all"?" on":"")+'" data-pgseason="all">All seasons'+
      '<i>'+C().pastgames.length+'</i></button>'+
      seasons.map(function(s){
        return '<button class="filt'+(sel===s?" on":"")+'" data-pgseason="'+esc(s)+'">'+esc(s)+
          '<i>'+C().pastgames.filter(function(g){return g.season===s;}).length+'</i></button>';
      }).join("");

    var rows = C().pastgames.filter(function(g){ return sel==="all" || g.season===sel; });
    $("#pastgamesbody").innerHTML = rows.length ? rows.map(function(g){
      return trOpen(g)+'<td class="num">'+esc(g.season)+'</td><td class="num">'+esc(g.date)+'</td>'+
        '<td class="num">'+esc(g.team)+'</td><td class="name">'+esc(g.fixture)+'</td>'+
        '<td class="num">'+esc(g.venue)+'</td>'+
        '<td class="res '+esc(g.outcome)+'">'+esc(g.result)+'</td>'+
        '<td class="num">'+sheetCell(g)+
        (S.can("console.use")?' <span class="rowacts" style="display:inline-flex;margin-left:8px"><button data-edit="pastgames:'+g.id+'">Edit</button></span>':'')+'</td>'+
        '</tr>';
    }).join("") : '<tr><td colspan="7" class="name">No games recorded for this season yet.</td></tr>';

    /* Won / lost / drawn for whatever is on screen */
    var w = rows.filter(function(g){return g.outcome==="w";}).length;
    var l = rows.filter(function(g){return g.outcome==="l";}).length;
    var seasonLabel = sel==="all" ? (seasons.length ? seasons[seasons.length-1]+" \u2013 "+seasons[0] : "All seasons") : "Season "+sel;
    $("#pgsummary").innerHTML =
      statTile("Won", w, "of "+rows.length+" games")+
      statTile("Lost", l, "of "+rows.length+" games")+
      statTile("Drawn / other", rows.length-w-l, "draws, tournament places")+
      statTile("Games", rows.length, seasonLabel);
  };

  /* ---------------- news archive ---------------------------- */
  /* The table is on the archive page, the rail beside the news
     feed. Same data, two pages. */
  S.renderArchive = function(){
    if($("#archivebody")) $("#archivebody").innerHTML = C().archive.map(function(a){
      return '<tr><td class="num">'+esc(a.season)+'</td><td class="num">'+esc(a.posts)+'</td>'+
        '<td class="name">'+esc(a.highlight)+'</td><td class="num">'+esc(a.tags)+
        (S.can("console.use")?' <span class="rowacts" style="display:inline-flex;margin-left:8px"><button data-edit="archive:'+a.id+'">Edit</button></span>':'')+
        '</td></tr>';
    }).join("");

    if($("#arsummary")){
      var A = C().archive.slice(), total = 0, best = null;
      A.forEach(function(a){ var n = parseInt(a.posts,10)||0; total += n; if(!best || n > best.n) best = {n:n, a:a}; });
      var last = A.length ? A[0] : null, first = A.length ? A[A.length-1] : null;
      $("#arsummary").innerHTML =
        statTile("Seasons", A.length, first && last ? first.season+" \u2013 "+last.season : "no seasons yet")+
        statTile("Posts", total, "in the archive")+
        statTile("Busiest season", best ? best.a.season : "\u2014", best ? best.n+" posts" : "")+
        statTile("Latest", last ? last.season : "\u2014", last ? last.highlight : "");
    }

    if($("#archiverail")) $("#archiverail").innerHTML = C().archive.map(function(a){
      return '<a class="ev" href="'+S.url("archive")+'">'+
        '<div class="evd"><div class="dd">'+esc(String(a.season).slice(5))+'</div>'+
        '<div class="mm">\''+esc(String(a.season).slice(2,4))+'</div></div>'+
        '<div><div class="evt">Season '+esc(a.season)+'</div>'+
        '<div class="evs">'+esc(a.posts)+' posts</div></div></a>';
    }).join("");
  };

  /* ---------------- history timeline ------------------------
     An actual timeline: a vertical spine with one node per
     moment, the year set large at the head of each entry and
     the copy (and an optional photo) hung to the right of the
     line. The tone rules live in css/light.css under .tline;
     history.html is a paper page.

     This replaced a pinned horizontal strip that panned on
     page scroll. layoutTimeline / updateTimelineScroll are kept
     as harmless no-ops (they guard on #tltrack, which this
     markup no longer has) so app.js needs no change.           */
  S.renderTimeline = function(){
    var wrap = $("#tlitems");
    if(!wrap) return;
    var rows = C().timeline || [];

    wrap.innerHTML = '<ol class="tline">'+ rows.map(function(t){
      return '<li class="tlrow" data-item>'+
        '<span class="tlnode" aria-hidden="true"></span>'+
        '<span class="tlyr">'+esc(t.yr||"")+'</span>'+
        '<div class="tllb">'+esc(t.lb||"")+'</div>'+
        (t.body ? '<p class="tlbody">'+esc(t.body)+'</p>' : '')+
        (t.cap  ? '<div class="tlcap">'+esc(t.cap)+'</div>' : '')+
        '<div class="tlshot">'+
          ph("timeline:"+t.id, "", (t.lb||"Archive")+" — photo")+
        '</div>'+
        tools("timeline",t.id)+
      '</li>';
    }).join("") +'</ol>';
  };

  /* Stacked = the fallback (≤980px or reduced motion): the pin is
     dropped and the moments stack in a column. Keep the width in
     step with the media query in css/components.css. */
  S.tlStacked = function(){
    return window.innerWidth <= 980 ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  /* Give #tltrack exactly enough height for the pan: one viewport
     (while .tlpin is stuck) plus the horizontal overflow of #tl.
     Then updateTimelineScroll maps scroll progress to translateX. */
  S.layoutTimeline = function(){
    var track = $("#tltrack");
    if(!track) return;
    var pin = $(".tlpin", track), tl = $("#tl");
    if(!pin || !tl) return;

    if(S.tlStacked()){
      track.style.height = "";
      tl.style.transform = "";
      S._tlOverflow = 0;
      S.updateTimelineScroll();
      return;
    }

    var overflow = Math.max(0, tl.scrollWidth - pin.clientWidth);
    S._tlOverflow = overflow;
    track.style.height = (window.innerHeight + overflow) + "px";
    S.updateTimelineScroll();
  };

  /* Turn the page's vertical scroll through the pinned region into
     a horizontal translate of #tl. #tltrack's rect.top runs from 0
     (pin engages) to -overflow (pin releases); that ratio is the
     progress. The ghost layer trails it for parallax, and each
     photo drifts a little inside its frame toward centre screen. */
  S.updateTimelineScroll = function(){
    var track = $("#tltrack"), tl = $("#tl");
    if(!track || !tl) return;
    var ghost = $("#tlghost"), fill = $("#tlprogfill");

    if(S.tlStacked() || !S._tlOverflow){
      tl.style.transform = "";
      if(ghost) ghost.style.transform = "";
      if(fill) fill.style.width = "0%";
      return;
    }

    var overflow = S._tlOverflow;
    var p = -track.getBoundingClientRect().top / overflow;
    p = p < 0 ? 0 : p > 1 ? 1 : p;

    tl.style.transform = "translate3d("+(-(p*overflow)).toFixed(1)+"px,0,0)";
    if(ghost) ghost.style.transform = "translate3d("+(-(p*overflow*0.4)).toFixed(1)+"px,0,0)";
    if(fill)  fill.style.width = (p*100).toFixed(1)+"%";

    var cx = window.innerWidth/2;
    $$(".tlshot .ph", track).forEach(function(el){
      var r = el.getBoundingClientRect();
      var d = ((r.left + r.width/2) - cx) / window.innerWidth;   // -0.5 … 0.5
      el.style.backgroundPositionX = (50 + d*16).toFixed(1)+"%";
    });
  };

  /* ---------------- history chapters -----------------------
     Paper, book-style: a sticky numbered nav and the story.
     `media` = row | side | wide picks the photo layout,
     `shots` (0–3) is how many slots.                           */
  function brk(s){ return esc(s||"").replace(/\n/g,"<br>"); }

  S.renderChapters = function(){
    var body = $("#chapbody");
    if(!body) return;                       // not the history page
    var nav = $("#chapnav");
    var rows = C().chapters || [];

    if(nav){
      nav.innerHTML = rows.map(function(c,i){
        return '<a data-chapnav="'+esc(c.id)+'"'+(i===0?' class="cur"':'')+'>'+
          '<span class="ci">'+esc(c.yr || ("0"+(i+1)))+'</span>'+
          '<span>'+esc(c.nav || ("Chapter "+(i+1)))+'</span></a>';
      }).join("");
    }

    body.innerHTML = rows.map(function(c){
      var n = Math.max(0, Math.min(3, parseInt(c.shots,10) || 0));
      var place = (c.media === "side" || c.media === "wide") ? c.media : "row";

      var media = "";
      if(n){
        var slots = "";
        for(var i=0;i<n;i++){
          slots += ph("chapter:"+c.id+":"+i, "", "Archive — " + (c.nav || "chapter"));
        }
        media = '<div class="chapmedia '+place+'">'+slots+'</div>'+
                (c.cap ? '<p class="chapcap">'+esc(c.cap)+'</p>' : '');
      }

      var mark  = '<div class="chapmark">'+esc(c.kicker || ("Chapter "+(c.yr||"")))+'</div>';
      var h     = '<h3 class="chh">'+brk(c.h)+'</h3>';
      var lead  = c.lead ? '<p class="chlead">'+esc(c.lead)+'</p>' : '';
      var paras = esc(c.body||"").split(/\n{2,}/).filter(Boolean).map(function(p){
        return '<p class="body">'+p.replace(/\n/g,"<br>")+'</p>';
      }).join("");
      var quote = c.quote ? '<p class="chquote">'+esc(c.quote)+'</p>' : "";
      var text  = lead + paras + quote;

      var inner = (place === "side" && media)
        ? mark + h + '<div class="chapsplit"><div>'+text+'</div><div>'+media+'</div></div>'
        : mark + h + text + media;

      return '<section class="chapter" id="chap-'+esc(c.id)+'" '+
             'data-item data-chap="'+esc(c.id)+'">'+inner+tools("chapters",c.id)+'</section>';
    }).join("");

    S.updateChapterSpy();
  };

  /* Which chapter is level with the top of the reading area gets
     .cur in the nav. Runs on scroll (bound in js/app.js, history
     page only) and once at the end of every render. */
  S.updateChapterSpy = function(){
    if(!$("#chapnav")) return;
    var chs = $$("#chapbody .chapter");
    if(!chs.length) return;
    var line = 150, cur = chs[0].dataset.chap;
    chs.forEach(function(ch){
      if(ch.getBoundingClientRect().top - line <= 0) cur = ch.dataset.chap;
    });
    $$("#chapnav a").forEach(function(a){
      a.classList.toggle("cur", a.dataset.chapnav === cur);
    });
  };

  /* ---------------- hockey: gear, rules, training ----------- */
  /* Gear and rules live on the hockey page, the training steps
     and the members-only panel on the training page. */
  S.renderHockey = function(){
    /* A numbered list, one piece per row, with an empty photo slot
       waiting for a real photograph of the kit. Slots are filled
       from the site itself: sign in as admin, turn on "Edit on
       page" and use the button on the slot. */
    if($("#gearlist")) $("#gearlist").innerHTML = C().gear.map(function(g,i){
      /* "when" is written "01 / buy first" — the number leads the
         row, the priority sits under the name. */
      var half = String(g.when||"").split("/");
      var num  = (half[0] || String(i+1)).trim();
      var tier = (half[1] || "").trim();
      return '<article class="gear" data-item>'+
        '<div class="gnum">'+esc(num)+'</div>'+
        '<div class="gbody">'+
          '<h3 class="g2">'+esc(g.title)+'</h3>'+
          (tier ? '<div class="g1">'+esc(tier)+'</div>' : '')+
          '<p>'+esc(g.body)+'</p>'+
        '</div>'+
        '<div class="ph" data-slot="gear:'+esc(g.id)+'" data-ph="'+esc(g.title)+'"></div>'+
        tools("gear",g.id)+'</article>';
    }).join("");

    function ruleRow(col){
      return function(r){
        return '<div class="rule-i" data-item><div class="rn">'+esc(r.n)+'</div>'+
          '<div><h4>'+esc(r.title)+'</h4><p>'+esc(r.body)+'</p></div>'+tools(col,r.id)+'</div>';
      };
    }
    if($("#ruleslist")) $("#ruleslist").innerHTML = C().rules.map(ruleRow("rules")).join("");
    /* training.html steps are cards now, rendered by renderTraining()
       below; #steps is no longer a .rule-i list. */

    if(!$("#trainmember")) return;
    $("#trainmember").innerHTML = S.can("view.calendar") ?
      '<div class="gatemsg" style="margin-top:34px"><div>'+
      '<p style="margin:0 0 8px;font-size:17px;font-weight:700;color:var(--bone)">Your next sessions</p>'+
      '<p><strong style="color:var(--bone)">Tue 21:15</strong> — Group B, IJsbaan Twente, Colosseum 90. '+
      '<strong style="color:var(--bone)">Thu 22:00</strong> — full squad, tactics.</p></div>'+
      '<a class="btn btn-sm" href="'+S.url("pictures")+'">Add to calendar</a></div>' :
      '<div class="gatemsg" style="margin-top:34px">'+
      '<p>Exact training times, rink addresses are visible to signed-in members.</p>'+
      '<a class="btn btn-sm" href="'+S.url("signin")+'">Sign in</a></div>';
  };

  /* ---------------- board ----------------------------------- */
  S.renderBoard = function(){
    if(!$("#boardgrid")) return;
    $("#boardgrid").innerHTML = C().board.map(function(b){
      return '<div class="bm" data-item>'+ph("board:"+b.id,"","Portrait")+
        '<div class="bmb"><div class="bn">'+esc(b.name)+'</div>'+
        '<div class="br">'+esc(b.role)+'</div>'+
        '<a class="be" href="mailto:'+esc(b.email)+'">'+esc(b.email)+'</a></div>'+tools("board",b.id)+'</div>';
    }).join("");
  };

  /* ---------------- gallery ---------------------------------
     Three states: locked (signed out), the album list filtered
     by the Pictures dropdown, and one open album. */
  var CATS = [
    {k:"all",         l:"All albums"},
    {k:"games",       l:"Games"},
    {k:"tournaments", l:"Tournaments"},
    {k:"promo",       l:"Promo & off-ice"},
    {k:"coach",       l:"Coach film"}
  ];

  function albumVisible(a){
    if(a.vis === "public") return true;
    if(a.vis === "member") return S.can("view.gallery");
    return S.can("view.coachalbums");
  }

  S.renderAlbums = function(){
    if(!$("#albumsarea")) return;
    var open = S.can("view.gallery");
    var catLabel = function(k){
      var c = CATS.filter(function(c){ return c.k===k; })[0];
      return c ? c.l : "Albums";
    };

    $("#picgate").innerHTML = open ? "" :
      '<div class="lockbox" style="margin-top:34px"><div>'+
      '<h3 class="disp d4">Sign in to view albums</h3>'+
      '<p class="body" style="margin-top:14px">Photo albums from games, tournaments and promo events are visible to active members only. Coaches and board members see additional albums and upload rights.</p></div>'+
      '<div><a class="btn btn-gold" href="'+S.url("signin")+'">Sign in</a></div></div>';

    /* --- one album opened --- */
    var opened = S.state.openAlbum &&
      C().albums.filter(function(a){ return a.id === S.state.openAlbum; })[0];

    /* "+ Add album" belongs to the list, not to an opened album */
    var addBtn = $('[data-add="albums"]');
    if(addBtn){
      addBtn.dataset.hidden = (opened && open && albumVisible(opened)) ? "1" : "";
      addBtn.style.display  = (S.state.editing && !addBtn.dataset.hidden) ? "block" : "none";
    }

    if(opened && open && albumVisible(opened)){
      var photos = opened.photos || [];
      var vis = opened.vis==="coach"?"Coach only":opened.vis==="member"?"Members":"Public";

      $("#picbrow").textContent = "Pictures / "+catLabel(opened.cat);
      $("#pich1").innerHTML     = esc(opened.title);
      $("#piclead").innerHTML   = esc(opened.meta)+' &middot; <span style="color:var(--gold)">'+vis+'</span>';
      $("#picaction").innerHTML = '<button class="tlink" data-album="">&larr; All albums</button>';
      $("#picfilters").innerHTML = "";

      $("#picsub").textContent = photos.length ? photos.length+(photos.length===1?" photo":" photos") : "Nothing uploaded yet";
      $("#pich2").textContent  = "The photos";

      $("#albumsarea").innerHTML =
        (S.can("album.upload") ?
          '<div class="uploadbar">'+
          '<button class="btn btn-sm btn-gold" data-upload="'+esc(opened.id)+'">Add photos</button>'+
          '<span class="mono uploadnote">Pick one or more images. They are resized and stored in your browser.</span>'+
          '</div>' : '')+
        (photos.length ?
          '<div class="photogrid">'+photos.map(function(src,i){
            return '<figure class="shot"><img src="'+src+'" alt="'+esc(opened.title)+' photo '+(i+1)+'" loading="lazy">'+
              (S.can("album.upload") ?
                '<button class="shotdel" data-delphoto="'+esc(opened.id)+':'+i+'" title="Remove">&#10005;</button>' : '')+
              '</figure>';
          }).join("")+'</div>'
          :
          '<div class="emptyalbum">'+
          '<p class="body">No photos in this album yet.</p>'+
          (S.can("album.upload")
            ? '<button class="btn btn-sm" data-upload="'+esc(opened.id)+'">Upload the first ones</button>'
            : '<p class="mono uploadnote">A coach or board member can add them.</p>')+
          '</div>');
      return;
    }

    /* --- album list --- */
    var cat = S.state.picFilter;
    var visible = C().albums.filter(albumVisible);
    var shown = open ? visible.filter(function(a){ return cat==="all" || a.cat===cat; })
                     : C().albums;

    $("#picbrow").textContent = open ? "Season 25/26" : "Members only";
    $("#pich1").innerHTML     = open ? "Albums from the season" : "The gallery is behind the door";
    $("#piclead").innerHTML   = open
      ? "Games, tournaments, promo nights and coach film, sorted by album. Open one to browse or, as a coach or board member, to add photos."
      : "Photos of members stay with members. Sign in to open the albums; below is the shape of what is inside.";
    $("#picaction").innerHTML = "";

    $("#picfilters").innerHTML = open ? CATS.map(function(c){
        var n = c.k==="all" ? visible.length : visible.filter(function(a){return a.cat===c.k;}).length;
        return '<button class="filt'+(cat===c.k?" on":"")+'" data-piccat="'+c.k+'">'+esc(c.l)+'<i>'+n+'</i></button>';
      }).join("") : "";

    $("#picsub").textContent = open ? shown.length+(shown.length===1?" album":" albums") : "Locked preview";
    $("#pich2").textContent  = open ? catLabel(cat) : "What members see";

    $("#albumsarea").innerHTML =
      '<div class="albums">'+shown.map(function(a){
        var locked = !open || !albumVisible(a);
        var badge  = a.vis==="coach" ? "Coach" : a.vis==="member" ? "Members" : "Public";
        var count  = (a.photos||[]).length;
        return '<div class="album'+(locked?" locked":"")+'" data-item'+
          (locked?'':' data-album="'+esc(a.id)+'"')+'>'+
          '<div class="ph'+(a.cat==="coach"?"":" gold")+'" data-slot="album:'+esc(a.id)+
            '" data-ph="'+(locked?" ":"Album cover")+'">'+
          '<span class="padlock">'+badge+'</span>'+
          (count?'<span class="shotcount">'+count+' uploaded</span>':'')+'</div>'+
          '<div class="an">'+esc(a.title)+'</div>'+
          '<div class="am">'+esc(a.meta)+'</div>'+tools("albums",a.id)+'</div>';
      }).join("")+'</div>'+
      (shown.length ? "" : '<div class="gatemsg" style="margin-top:20px"><p>No albums in this section yet.</p></div>')+
      (S.can("album.upload") ?
        '<div class="gatemsg" style="margin-top:24px">'+
        '<p>Open an album to add photos. Anything you upload is resized and kept in this browser — the live site would store it on the club server.</p>'+
        (S.can("console.use")?'<button class="btn btn-sm" data-add="albums">New album</button>':'')+'</div>' : "");
  };

  /* ---------------- sign-up page ---------------------------- */
  S.renderJoin = function(){
    if(!$("#joinform")) return;
    var sent = S.state.joinSent;
    $("#joinform").style.display = sent ? "none" : "";
    $("#joindone").innerHTML = sent ?
      '<div class="donebox">'+
      '<h2 class="disp d3" style="margin:0 0 18px">Thanks, '+esc(String(sent.name).split(" ")[0])+' &mdash; received</h2>'+
      '<p class="body">Your request is with the board. Someone will mail <strong style="color:var(--bone)">'+esc(sent.email)+
      '</strong> within a few days with the date, what to bring, and where to meet at the rink.</p>'+
      '<dl class="summary">'+
        '<div><dt>Session</dt><dd>'+esc(sent.session)+'</dd></div>'+
        '<div><dt>Experience</dt><dd>'+esc(sent.experience)+'</dd></div>'+
        '<div><dt>Status</dt><dd>'+esc(sent.study)+'</dd></div>'+
      '</dl>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:26px">'+
      '<a class="btn btn-sm" href="'+S.url("hockey")+'">Read up on the game first</a>'+
      '<button class="btn btn-sm" data-act="joinagain">Send another</button></div>'+
      '</div>' : "";
  };

  /* ---------------- home sidebar rails ----------------------
     Signed out this slot is the conversion, not a login box:
     someone reading the news feed is a potential member, and
     "sign in" means nothing to them. */
  S.renderMemberRail = function(){
    if(!$("#memberrail")) return;
    var s = S.state.session;
    $("#memberrail").innerHTML = s ?
      '<div class="rail dark">'+
      '<div class="railhead"><span class="mono">Your team</span>'+
      '<span class="mono" style="color:var(--ice)">'+esc(s.sub)+'</span></div>'+
      '<div class="ev"><div class="evd"><div class="dd">18</div><div class="mm">Apr</div></div>'+
      '<div><div class="evt">You are on the sheet</div>'+
      '<div class="evs">Studs 2 vs. Enschede Lions · <span class="tag home">Home</span></div></div></div>'+
      '<div class="ev"><div class="evd"><div class="dd">2</div><div class="mm">unread</div></div>'+
      '<div><div class="evt">Board messages</div>'+
      '<div class="evs">Campus Card renewal · BBQ headcount</div></div></div></div>'
      :
      '<div class="rail joinrail">'+
      '<div class="railhead"><span class="mono">Want to join?</span>'+
      '<span class="mono">Free</span></div>'+
      '<div class="joinbody">'+
      '<p class="joinlead">Two free introduction practices a year. Skates, stick and full gear are waiting at the rink.</p>'+
      '<ul class="joinlist">'+
      '<li>No experience needed</li><li>Nothing to bring but sports clothes</li>'+
      '<li>Open to UT, Saxion and non-students</li></ul>'+
      '<a class="btn btn-gold btn-sm" href="'+S.url("join")+'">Sign up for a practice</a>'+
      '<a class="tlink joinmore" href="'+S.url("training")+'">How it works</a>'+
      '</div></div>';
  };

  /* ---------------- header nav ------------------------------
     Rendered rather than written into each document, because the
     Drafts, Attendance and Admin items depend on who is signed in.

     Sub-menu items go to real destinations: another page, or a
     section anchor on the page they belong to. A dropdown that
     does not move you is worse than no dropdown.

     Every URL here comes from Studs.url() — see js/routes.js. */
  S.renderNav = function(){
    if(!$("#nav")) return;
    var admin = S.can("console.use"), coach = S.can("roster.edit"), gallery = S.can("view.gallery");
    var live = C().news.filter(function(n){ return n.status !== "draft"; }).length;
    var u = S.url, pic = S.picturesUrl, h = "";

    h += '<div class="navitem" data-nav="home"><a href="'+u("home")+'">Home</a></div>';

    /* About us holds everything about the club itself, the news
       pages included — they are the club telling its own story,
       and they would be unreachable from the header otherwise. */
    h += '<div class="navitem hasmenu" data-nav="about"><a href="'+u("about")+'">About us</a><div class="menu">'+
         '<a href="'+u("about")+'">The association</a>'+
         '<a href="'+u("history")+'">History <i>1982&ndash;</i></a>'+
         '<a href="'+u("news")+'">News <i>'+live+'</i></a>'+
         '<a href="'+u("archive")+'">Archive <i>2010&ndash;26</i></a>'+
         (admin?'<a href="'+u("admin")+'">Drafts <span class="gate a">Admin</span></a>':'')+'</div></div>';

    h += '<div class="navitem hasmenu" data-nav="team"><a href="'+u("players")+'">Team</a><div class="menu">'+
         '<a href="'+u("players")+'">Players &amp; rosters <i>'+C().players.length+'</i></a>'+
         '<a href="'+u("training")+'">Training</a>'+
         '<a href="'+u("stats")+'">Stats</a>'+
         (coach?'<a href="'+u("players","staff")+'">Attendance <span class="gate c">Coach</span></a>':'')+'</div></div>';

    h += '<div class="navitem hasmenu" data-nav="games"><a href="'+u("games")+'">Games</a><div class="menu">'+
         '<a href="'+u("games")+'">This season <i>'+C().games.length+'</i></a>'+
         '<a href="'+u("pastgames")+'">Past seasons <i>'+C().pastgames.length+'</i></a>'+
         '<a href="'+u("competitions")+'">Competitions <i>'+C().comps.length+'</i></a></div></div>';

    h += '<div class="navitem hasmenu" data-nav="hockey"><a href="'+u("hockey")+'">Hockey</a><div class="menu">'+
         '<a href="'+u("hockey","what")+'">What is ice hockey</a>'+
         '<a href="'+u("hockey","gear")+'">Gear <i>'+C().gear.length+'</i></a>'+
         '<a href="'+u("hockey","rules")+'">Rules to start <i>'+C().rules.length+'</i></a></div></div>';

    h += '<div class="navitem hasmenu" data-nav="pictures"><a href="'+u("pictures")+'">Pictures</a><div class="menu">'+
         '<a href="'+pic("games")+'">Games <span class="gate m">'+(gallery?"Open":"Members")+'</span></a>'+
         '<a href="'+pic("tournaments")+'">Tournaments <span class="gate m">'+(gallery?"Open":"Members")+'</span></a>'+
         '<a href="'+pic("promo")+'">Promo &amp; off-ice <span class="gate m">'+(gallery?"Open":"Members")+'</span></a>'+
         '<a href="'+pic("coach")+'">Coach film <span class="gate c">Coach</span></a></div></div>';

    h += '<div class="navitem hasmenu" data-nav="contact"><a href="'+u("contact")+'">Contact</a><div class="menu">'+
         '<a href="'+u("contact","board")+'">The board</a>'+
         '<a href="'+u("contact","message")+'">Send a message</a>'+
         '<a href="'+u("contact","find")+'">Where to find us</a>'+
         '<a href="'+u("join")+'">Join the Studs</a></div></div>';

    if(admin) h += '<div class="navitem admin" data-nav="admin"><a href="'+u("admin")+'">Admin</a></div>';

    $("#nav").innerHTML = h;
  };

  /* ---------------- account chip + its menu ----------------- */
  function initials(name){
    return name.split(" ").map(function(w){ return w.charAt(0); }).join("").slice(0,2).toUpperCase();
  }
  S.renderAccount = function(){
    var s = S.state.session;

    $("#hactions").innerHTML = s ?
      '<button class="acct" id="acctbtn"><span class="av">'+esc(initials(s.name))+'</span>'+
      '<span class="an2">'+esc(s.name.split(" ")[0])+
      '<span class="ar"><span class="dot '+(s.role==="admin"?"a":s.role==="coach"||s.role==="moderator"?"c":"m")+
      '" style="display:inline-block;margin-right:5px"></span>'+esc(s.role)+'</span></span></button>'
      : '<a class="chip chip-join" href="'+S.url("join")+'">Want to join?</a>'+
        '<a class="chip" href="'+S.url("signin")+'"><span class="dot"></span>Sign in</a>';

    if(!s){ $("#acctmenu").innerHTML = ""; return; }

    var acc = S.accounts.filter(function(a){ return a.role === s.role; })[0] || {can:[]};
    var rc = s.role==="admin" ? "a" : s.role==="coach" ? "c" : "m";

    $("#acctmenu").innerHTML =
      '<div class="amh"><span class="av">'+esc(initials(s.name))+'</span><div>'+
      '<div class="amn">'+esc(s.name)+'</div>'+
      '<div class="amr"><span class="dot '+rc+'"></span>'+esc(s.role)+' · '+esc(s.sub)+'</div></div></div>'+
      '<div class="amlist">'+
      '<a href="'+S.accountUrl()+'">My account</a>'+
      (S.can("console.use") ?
        '<a href="'+S.url("admin")+'">Admin console <i class="gate a">'+(S.isAdmin()?"Godmode":"Moderator")+'</i></a>'+
        '<button data-act="toggleedit">'+(S.state.editing?"Stop editing the page":"Edit this page inline")+'</button>' : '')+
      '<a href="'+S.url("pictures")+'">Photo albums</a>'+
      '<a href="'+S.url("signin")+'">Switch account</a>'+
      '<button data-act="signout">Sign out</button></div>'+
      '<div class="amperm">You can:<br>'+
      acc.can.map(function(c){ return '<span>+</span> '+esc(c); }).join("<br>")+'</div>';
  };

  /* ---------------- editable page copy ---------------------- */
  S.captureDefaults = function(){
    $$("[data-ed]").forEach(function(el){
      if(!(el.dataset.ed in S.state.defaults)) S.state.defaults[el.dataset.ed] = el.innerHTML;
    });
  };
  S.renderCopy = function(){
    $$("[data-ed]").forEach(function(el){
      var k = el.dataset.ed;
      el.innerHTML = (k in C().copy) ? C().copy[k] : S.state.defaults[k];
    });
  };

  /* ---------------- photos ---------------------------------
     Two sources, in order: an image uploaded through the site
     (content.images[slot]) or a file shipped with the project
     (data-img). In edit mode every slot grows a camera button. */
  S.applyPhotos = function(){
    $$(".ph").forEach(function(el){
      var slot = el.dataset.slot;
      var src  = slot ? S.getImage(slot) : "";
      if(!src && el.dataset.img) src = el.dataset.img;

      if(src){
        el.style.backgroundImage = 'url("'+src+'")';
        el.classList.add("has-photo");
      }else{
        el.style.backgroundImage = "";
        el.classList.remove("has-photo");
      }

      var old = el.querySelector(".phedit");
      if(old) old.remove();
      if(slot && S.state.editing){
        var b = document.createElement("button");
        b.className = "phedit";
        b.dataset.photoslot = slot;
        b.title = src ? "Replace or remove this photo" : "Add a photo";
        b.textContent = src ? "Replace" : "Add photo";
        el.appendChild(b);
      }
    });
  };

  /* ---------------- one entry point ------------------------- */
  S.renderAll = function(){
    S.renderNav();
    S.renderAccount();
    S.renderStats();
    S.renderTicker();
    S.renderNews();
    S.renderPost();
    S.renderGameSheet();
    S.renderEvents();
    S.renderHomeCalendar();
    S.renderAnnouncements();
    S.renderPlayers();
    S.renderScoring();
    S.renderGames();
    S.renderStandings();
    S.renderTraining();
    S.renderPastGames();
    S.renderArchive();
    S.renderTimeline();
    S.renderChapters();
    S.renderHockey();
    S.renderBoard();
    S.renderAlbums();
    S.renderSignin();
    S.renderMemberRail();
    S.renderJoin();
    S.renderAdminNav();
    S.renderAdminBody();
    if(S.renderLK) S.renderLK();
    S.renderCopy();
    S.applyPhotos();
    if(S.state.editing){
      $$("[data-ed]").forEach(function(el){ el.setAttribute("contenteditable","true"); });
    }
    S.renderAdminBar();
    $$(".addtile").forEach(function(b){ b.style.display = (S.state.editing && !b.dataset.hidden) ? "block" : "none"; });
    S.markNav();
  };

  /* ---------------- sign-in page ---------------------------- */
  S.renderSignin = function(){
    if(!$("#signincards")) return;
    $("#signincards").innerHTML = S.accounts.map(function(a){
      var rc = a.role==="admin" ? "a" : a.role==="coach" ? "c" : "m";
      return '<button class="acard" data-login="'+esc(a.role)+'">'+
        '<div class="arole"><span class="dot '+rc+'"></span>'+esc(a.role)+'</div>'+
        '<div class="aname">'+esc(a.name)+'</div>'+
        '<div class="acred">'+esc(a.email)+'<br>password: '+esc(a.pw)+'</div>'+
        '<ul>'+a.can.map(function(c){ return "<li>"+esc(c)+"</li>"; }).join("")+'</ul>'+
        '<div class="go">Sign in as '+esc(a.role)+' &rarr;</div></button>';
    }).join("");
  };

})(window.Studs);
