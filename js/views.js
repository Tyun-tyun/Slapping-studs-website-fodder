/* ============================================================
   views.js — every render function. Each one owns exactly one
   container in index.html and rebuilds it from Studs.state.content.

   Convention: a renderer writes innerHTML and nothing else. It
   never attaches listeners — all clicks go through the single
   delegated handler in app.js.
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

  /* ---------------- home: achievements ---------------------- */
  S.renderStats = function(){
    $("#statwrap").innerHTML = C().stats.map(function(s){
      return '<div class="stat" data-item>'+
        '<div class="k">'+esc(s.k)+'</div>'+
        '<div class="v">'+esc(s.v)+'</div>'+
        '<div class="n">'+esc(s.n)+'</div>'+tools("stats",s.id)+'</div>';
    }).join("");
  };

  /* ---------------- news ------------------------------------ */
  function postHTML(n,i){
    var draft = n.status === "draft";
    if(draft && !S.isAdmin()) return "";       // drafts are admin-only
    return '<div class="post" data-item>'+
      '<div class="ph'+(i===1?" gold":"")+'" data-ph="Photo"></div><div>'+
      '<div class="pmeta">'+esc(n.date)+' · <b>'+esc(n.tag)+'</b> · '+esc(n.author)+
      (draft?'<span class="draftpill">Draft</span>':'')+'</div>'+
      '<h3 class="ptitle">'+esc(n.title)+'</h3>'+
      '<p class="pex">'+esc(n.excerpt)+'</p></div>'+tools("news",n.id)+'</div>';
  }
  S.renderNews = function(){
    $("#homefeed").innerHTML = C().news.slice(0,4).map(postHTML).join("");
    $("#newsfeed").innerHTML = C().news.map(postHTML).join("");
  };

  /* ---------------- events rail ----------------------------- */
  S.renderEvents = function(){
    $("#homeevents").innerHTML = C().events.map(function(e){
      var badge = e.kind ? ' · <span class="tag '+e.kind+'">'+(e.kind==="home"?"Home":"Away")+'</span>' : "";
      return '<div class="ev" data-item>'+
        '<div class="evd"><div class="dd">'+esc(e.dd)+'</div><div class="mm">'+esc(e.mm)+'</div></div>'+
        '<div><div class="evt">'+esc(e.title)+'</div>'+
        '<div class="evs">'+esc(e.meta)+badge+'</div></div>'+tools("events",e.id)+'</div>';
    }).join("");
  };

  /* ---------------- roster + scoring ------------------------ */
  S.renderPlayers = function(){
    var f = S.state.plFilter;
    var teams = ["All","Stallions","Studs 1","Studs 2","Rookies"];

    $("#plfilters").innerHTML = teams.map(function(t){
      return '<button class="filt'+(t===f?" on":"")+'" data-filt="'+esc(t)+'">'+esc(t)+'</button>';
    }).join("");

    var list = C().players.filter(function(p){ return f==="All" || p.team===f; });
    $("#roster").innerHTML = list.length ? list.map(function(p,i){
      return '<div class="pl" data-item>'+
        '<div class="ph'+(i===1?" gold":"")+'" data-ph="Player portrait"><span class="no">'+esc(p.no)+'</span></div>'+
        '<div class="plb"><div class="pn">'+esc(p.name)+'</div>'+
        '<div class="pp">'+esc(p.pos)+' · '+esc(p.team)+'</div></div>'+tools("players",p.id)+'</div>';
    }).join("") : '<div class="jcard" style="min-height:120px"><p>No players in this team yet.</p></div>';

    /* Points are derived, never stored — one source of truth. */
    $("#scoring").innerHTML = C().players.slice().sort(function(a,b){
      return (Number(b.g)+Number(b.a)) - (Number(a.g)+Number(a.a));
    }).map(function(p){
      return '<tr><td class="num">'+esc(p.no)+'</td><td class="name">'+esc(p.name)+'</td>'+
        '<td class="num">'+esc(String(p.pos).charAt(0))+'</td>'+
        '<td class="num">'+esc(p.gp)+'</td><td class="num">'+esc(p.g)+'</td><td class="num">'+esc(p.a)+'</td>'+
        '<td class="num" style="color:var(--gold)">'+(Number(p.g)+Number(p.a))+'</td>'+
        '<td class="num">'+esc(p.pim)+'</td></tr>';
    }).join("");

    $("#coachpanel").innerHTML = S.can("roster.edit") ?
      '<div class="gatemsg" style="margin-top:34px;border-color:rgba(143,209,176,.4)"><div>'+
      '<p style="color:var(--ok);font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 8px">Coach tools</p>'+
      '<p>You can edit rosters and lineups for Stallions and Studs 1, mark training attendance and publish game sheets. Board members can do this for every team.</p></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
      '<button class="btn btn-sm" data-add="players">Add player</button>'+
      '<button class="btn btn-sm">Mark attendance</button></div></div>' : "";
  };

  /* ---------------- games + competitions -------------------- */
  S.renderGames = function(){
    $("#gamesbody").innerHTML = C().games.map(function(g){
      return '<tr><td class="num">'+esc(g.date)+'</td><td class="num">'+esc(g.team)+'</td>'+
        '<td class="name">'+esc(g.fixture)+'</td><td class="num">'+esc(g.venue)+'</td>'+
        '<td class="res '+esc(g.outcome)+'">'+esc(g.result)+'</td>'+
        '<td class="num">'+(g.outcome?'<a class="tlink" href="#/games">Open</a>':'—')+
        (S.isAdmin()?' <span class="rowacts" style="display:inline-flex;margin-left:8px">'+
          '<button data-edit="games:'+g.id+'">Edit</button></span>':'')+'</td></tr>';
    }).join("");

    $("#comps").innerHTML = C().comps.map(function(c){
      return '<div data-item style="position:relative"><h3 class="disp d4">'+esc(c.title)+'</h3>'+
        '<p class="body" style="margin-top:14px">'+esc(c.body)+'</p>'+tools("comps",c.id)+'</div>';
    }).join("");
  };

  /* ---------------- archive --------------------------------- */
  S.renderArchive = function(){
    $("#archivebody").innerHTML = C().archive.map(function(a){
      return '<tr><td class="num">'+esc(a.season)+'</td><td class="num">'+esc(a.posts)+'</td>'+
        '<td class="name">'+esc(a.highlight)+'</td><td class="num">'+esc(a.tags)+'</td></tr>';
    }).join("");

    $("#archiverail").innerHTML = C().archive.map(function(a){
      return '<a class="ev" href="#/archive">'+
        '<div class="evd"><div class="dd">'+esc(String(a.season).slice(5))+'</div>'+
        '<div class="mm">\''+esc(String(a.season).slice(2,4))+'</div></div>'+
        '<div><div class="evt">Season '+esc(a.season)+'</div>'+
        '<div class="evs">'+esc(a.posts)+' posts</div></div></a>';
    }).join("");
  };

  /* ---------------- history timeline ------------------------
     Two passes: entries first, then the ruler above them, so
     every node lines up with the entry it belongs to. Re-run on
     resize and after webfonts load, because both move things. */
  S.renderTimeline = function(){
    $("#tlitems").innerHTML = C().timeline.map(function(t,i){
      var last = i === C().timeline.length - 1;   // "Today" is dimmed
      return '<div class="tlitem'+(last?" faded":"")+'" data-item>'+
        '<div class="yr">'+esc(t.yr)+'</div><div class="lb">'+esc(t.lb)+'</div>'+
        '<p>'+esc(t.body)+'</p>'+tools("timeline",t.id)+'</div>';
    }).join("");
    S.layoutTimeline();
  };

  S.layoutTimeline = function(){
    var axis = $("#axis");
    if(!axis || !axis.offsetParent) return;      // page not visible
    var w = axis.offsetWidth;
    if(!w) return;
    axis.innerHTML = "";

    for(var i=0;i<=60;i++){
      var tick = document.createElement("span");
      tick.className = "tick";
      tick.style.left = (i/60*100)+"%";
      axis.appendChild(tick);
    }
    var items = $$("#tlitems .tlitem");
    items.forEach(function(it,idx){
      var pct = ((it.offsetLeft+4)/w)*100;
      var flagged = idx === items.length-2;      // the title year
      ["node"+(flagged?" gold":""),"stem"].forEach(function(cls){
        var el = document.createElement("span");
        el.className = cls; el.style.left = pct+"%"; axis.appendChild(el);
      });
      var lab = document.createElement("span");
      lab.className = "ylab"+(flagged?" flag":"");
      lab.style.left = pct+"%";
      lab.textContent = it.querySelector(".yr").textContent;
      axis.appendChild(lab);
    });
  };

  /* ---------------- hockey: gear, rules, training ----------- */
  S.renderHockey = function(){
    $("#gearlist").innerHTML = C().gear.map(function(g){
      return '<div class="gear" data-item><div class="g1">'+esc(g.when)+'</div>'+
        '<div class="g2">'+esc(g.title)+'</div><p>'+esc(g.body)+'</p>'+tools("gear",g.id)+'</div>';
    }).join("");

    function ruleRow(col){
      return function(r){
        return '<div class="rule-i" data-item><div class="rn">'+esc(r.n)+'</div>'+
          '<div><h4>'+esc(r.title)+'</h4><p>'+esc(r.body)+'</p></div>'+tools(col,r.id)+'</div>';
      };
    }
    $("#ruleslist").innerHTML = C().rules.map(ruleRow("rules")).join("");
    $("#steps").innerHTML     = C().steps.map(ruleRow("steps")).join("");

    /* Members see real times and addresses; the public sees why
       they cannot. Never show a dead link instead. */
    $("#trainmember").innerHTML = S.can("view.calendar") ?
      '<div class="gatemsg" style="margin-top:34px"><div>'+
      '<p class="mono" style="color:var(--ice);margin:0 0 8px">Members only · your next sessions</p>'+
      '<p><strong style="color:var(--bone)">Tue 21:15</strong> — Group B, IJsbaan Twente, Colosseum 60. '+
      '<strong style="color:var(--bone)">Thu 22:00</strong> — full squad, tactics.</p></div>'+
      '<a class="btn btn-sm" href="#/pictures">Add to calendar</a></div>' :
      '<div class="gatemsg" style="margin-top:34px">'+
      '<p>Exact training times, rink addresses and the attendance list are visible to signed-in members.</p>'+
      '<a class="btn btn-sm" href="#/signin">Sign in</a></div>';
  };

  /* ---------------- board ----------------------------------- */
  S.renderBoard = function(){
    $("#boardgrid").innerHTML = C().board.map(function(b){
      return '<div class="bm" data-item><div class="ph" data-ph="Portrait"></div>'+
        '<div class="bmb"><div class="bn">'+esc(b.name)+'</div>'+
        '<div class="br">'+esc(b.role)+'</div>'+
        '<a class="be" href="mailto:'+esc(b.email)+'">'+esc(b.email)+'</a></div>'+tools("board",b.id)+'</div>';
    }).join("");
  };

  /* ---------------- gallery --------------------------------- */
  S.renderAlbums = function(){
    var open = S.can("view.gallery");

    $("#picbrow").textContent = open ? "Pictures / Albums" : "Pictures / Members only";
    $("#pich1").innerHTML     = open ? "Albums from<br>the season" : "The gallery<br>is behind the door";

    $("#picgate").innerHTML = open ? "" :
      '<div class="lockbox" style="margin-top:44px"><div>'+
      '<h3 class="disp d4">Sign in to view albums</h3>'+
      '<p class="body" style="margin-top:14px">Photo albums from games, tournaments and promo events are visible to active members only. Coaches and board members see additional albums and upload rights.</p></div>'+
      '<div><a class="btn btn-gold" href="#/signin">Sign in</a></div></div>';

    var visible = C().albums.filter(function(a){
      if(a.vis === "public") return true;
      if(a.vis === "member") return S.can("view.gallery");
      return S.can("view.coachalbums");
    });
    /* Signed out, we still show the covers blurred: people join
       for what they can see they are missing. */
    var shown = open ? visible : C().albums;

    $("#albumsarea").innerHTML =
      '<p class="eyebrow" style="margin-top:56px">'+
      (open ? "Your albums · "+visible.length+" visible to you" : "Locked preview · what members see")+'</p>'+
      '<div class="albums">'+shown.map(function(a){
        var locked = !open || (a.vis==="coach" && !S.can("view.coachalbums"));
        var badge  = a.vis==="coach" ? "Coach" : a.vis==="member" ? "Members" : "Public";
        return '<div class="album'+(locked?" locked":"")+'" data-item>'+
          '<div class="ph'+(a.vis==="coach"?"":" gold")+'" data-ph="'+(locked?" ":"Album cover")+'">'+
          '<span class="padlock">'+badge+'</span></div>'+
          '<div class="an">'+esc(a.title)+'</div>'+
          '<div class="am">'+esc(a.meta)+'</div>'+tools("albums",a.id)+'</div>';
      }).join("")+'</div>'+
      (S.can("album.upload") ?
        '<div class="gatemsg" style="margin-top:24px">'+
        '<p>You can upload to any album your team appears in. Photos are reviewed by the board before an album is made public.</p>'+
        '<button class="btn btn-sm">Upload photos</button></div>' : "");
  };

  /* ---------------- sign-in page ---------------------------- */
  S.renderSignin = function(){
    $("#signincards").innerHTML = S.accounts.map(function(a){
      var rc = a.role==="admin" ? "a" : a.role==="coach" ? "c" : "m";
      return '<button class="acard" data-login="'+esc(a.role)+'">'+
        '<div class="arole"><span class="dot '+rc+'"></span>'+esc(a.role)+'</div>'+
        '<div class="aname">'+esc(a.name)+'</div>'+
        '<div class="acred">'+esc(a.email)+'<br>password: '+esc(a.pw)+'</div>'+
        '<ul>'+a.can.map(function(c){ return "<li>"+esc(c)+"</li>"; }).join("")+'</ul>'+
        '<div class="go">Sign in as '+esc(a.role)+' &rarr;</div></button>';
    }).join("");

    $("#matrixbody").innerHTML = S.matrix.map(function(m){
      function cell(r){
        var list = S.perms[r] || [];
        var ok = list.indexOf("*") > -1 || list.indexOf(m[1]) > -1;
        return '<td class="'+(ok?"yes":"no")+'">'+(ok?"●":"○")+'</td>';
      }
      return '<tr><td class="name">'+esc(m[0])+'</td>'+
        cell("guest")+cell("member")+cell("coach")+cell("admin")+'</tr>';
    }).join("");
  };

  /* ---------------- member rail on the homepage ------------- */
  S.renderMemberRail = function(){
    var s = S.state.session;
    $("#memberrail").innerHTML = s ?
      '<div class="rail dark" style="margin-top:16px;position:static">'+
      '<div class="railhead"><span class="mono">Your team</span>'+
      '<span class="mono" style="color:var(--ice)">'+esc(s.sub)+'</span></div>'+
      '<div class="ev"><div class="evd"><div class="dd">18</div><div class="mm">Apr</div></div>'+
      '<div><div class="evt">You are on the sheet</div>'+
      '<div class="evs">Studs 2 vs. Enschede Lions · <span class="tag home">Home</span></div></div></div>'+
      '<div class="ev"><div class="evd"><div class="dd">2</div><div class="mm">unread</div></div>'+
      '<div><div class="evt">Board messages</div>'+
      '<div class="evs">Campus Card renewal · BBQ headcount</div></div></div></div>'
      :
      '<div class="rail dark" style="margin-top:16px;position:static">'+
      '<div class="railhead"><span class="mono">Members</span></div>'+
      '<div style="padding:18px 16px"><p class="body" style="font-size:13.5px;margin:0 0 14px">'+
      'Signed-in members see their own team schedule, the sheet they are on and board messages here.</p>'+
      '<a class="btn btn-sm" href="#/signin">Sign in</a></div></div>';
  };

  /* ---------------- header nav ------------------------------
     Rebuilt on every render because its contents depend on role. */
  S.renderNav = function(){
    var admin = S.isAdmin(), coach = S.can("roster.edit"), gallery = S.can("view.gallery");
    var live = C().news.filter(function(n){ return n.status !== "draft"; }).length;
    var h = "";

    h += '<div class="navitem" data-nav="home"><a href="#/home">Home</a></div>';

    h += '<div class="navitem hasmenu" data-nav="news"><a href="#/news">News</a><div class="menu">'+
         '<a href="#/news">Latest <i>'+live+'</i></a>'+
         '<a href="#/archive">Archive <i>2010&ndash;26</i></a>'+
         (admin?'<a href="#/admin">Drafts <span class="gate a">Admin</span></a>':'')+'</div></div>';

    h += '<div class="navitem hasmenu" data-nav="team"><a href="#/players">Team</a><div class="menu">'+
         '<a href="#/players">Players &amp; rosters</a><a href="#/about">About us</a>'+
         '<a href="#/training">Training</a><a href="#/history">History <i>1982&ndash;</i></a>'+
         (coach?'<a href="#/players">Attendance <span class="gate c">Coach</span></a>':'')+'</div></div>';

    h += '<div class="navitem hasmenu" data-nav="games"><a href="#/games">Games</a><div class="menu">'+
         '<a href="#/games">Fixtures &amp; results</a><a href="#/games">Game sheets</a>'+
         '<a href="#/games">Competitions</a><a href="#/games">Standings</a></div></div>';

    h += '<div class="navitem hasmenu" data-nav="hockey"><a href="#/hockey">Hockey</a><div class="menu">'+
         '<a href="#/hockey">What is ice hockey</a><a href="#/hockey">Gear</a>'+
         '<a href="#/hockey">Rules to start</a></div></div>';

    h += '<div class="navitem hasmenu" data-nav="pictures"><a href="#/pictures">Pictures</a><div class="menu">'+
         '<a href="#/pictures">Games <span class="gate m">'+(gallery?"Open":"Members")+'</span></a>'+
         '<a href="#/pictures">Tournaments <span class="gate m">'+(gallery?"Open":"Members")+'</span></a>'+
         '<a href="#/pictures">Coach film <span class="gate c">Coach</span></a></div></div>';

    h += '<div class="navitem hasmenu" data-nav="contact"><a href="#/contact">Contact</a><div class="menu">'+
         '<a href="#/contact">The board</a><a href="#/contact">Send a message</a>'+
         '<a href="#/contact">Join the Studs</a></div></div>';

    if(admin) h += '<div class="navitem admin" data-nav="admin"><a href="#/admin">Admin</a></div>';

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
      '<span class="ar"><span class="dot '+(s.role==="admin"?"a":s.role==="coach"?"c":"m")+
      '" style="display:inline-block;margin-right:5px"></span>'+esc(s.role)+'</span></span></button>'
      : '<a class="chip" href="#/signin"><span class="dot"></span>Sign in</a>';

    if(!s){ $("#acctmenu").innerHTML = ""; return; }

    var acc = S.accounts.filter(function(a){ return a.role === s.role; })[0] || {can:[]};
    var rc = s.role==="admin" ? "a" : s.role==="coach" ? "c" : "m";

    $("#acctmenu").innerHTML =
      '<div class="amh"><span class="av">'+esc(initials(s.name))+'</span><div>'+
      '<div class="amn">'+esc(s.name)+'</div>'+
      '<div class="amr"><span class="dot '+rc+'"></span>'+esc(s.role)+' · '+esc(s.sub)+'</div></div></div>'+
      '<div class="amlist">'+
      (S.isAdmin() ?
        '<a href="#/admin">Admin console <i class="gate a">Godmode</i></a>'+
        '<button data-act="toggleedit">'+(S.state.editing?"Stop editing the page":"Edit this page inline")+'</button>' : '')+
      '<a href="#/pictures">Photo albums</a>'+
      '<a href="#/signin">Switch account</a>'+
      '<button data-act="signout">Sign out</button></div>'+
      '<div class="amperm">You can:<br>'+
      acc.can.map(function(c){ return '<span>+</span> '+esc(c); }).join("<br>")+'</div>';
  };

  /* ---------------- editable page copy ----------------------
     [data-ed] blocks live in index.html as the authored default.
     An admin override is stored in content.copy under the same
     key, so reverting simply deletes the key. */
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

  /* ---------------- real photos -----------------------------
     Any .ph with data-img becomes a real image. See
     assets/photos/README.md for the naming convention. */
  S.applyPhotos = function(){
    $$(".ph[data-img]").forEach(function(el){
      el.style.backgroundImage = 'url("'+el.dataset.img+'")';
      el.classList.add("has-photo");
    });
  };

  /* ---------------- one entry point ------------------------- */
  S.renderAll = function(){
    S.renderNav();
    S.renderAccount();
    S.renderStats();
    S.renderNews();
    S.renderEvents();
    S.renderPlayers();
    S.renderGames();
    S.renderArchive();
    S.renderTimeline();
    S.renderHockey();
    S.renderBoard();
    S.renderAlbums();
    S.renderSignin();
    S.renderMemberRail();
    S.renderAdminNav();
    S.renderAdminBody();
    S.renderCopy();
    S.applyPhotos();
    if(S.state.editing){
      $$("[data-ed]").forEach(function(el){ el.setAttribute("contenteditable","true"); });
    }
    S.renderAdminBar();
    $$(".addtile").forEach(function(b){ b.style.display = S.state.editing ? "block" : "none"; });
    S.markNav();
  };

})(window.Studs);
