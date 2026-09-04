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

  /* A photo slot that can be filled from the website itself.
     slot = the key its image is stored under. */
  function ph(slot, cls, caption){
    return '<div class="ph'+(cls?" "+cls:"")+'" data-slot="'+esc(slot)+
           '" data-ph="'+esc(caption||"Photo")+'"></div>';
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
      ph("news:"+n.id, i===1?"gold":"", "Photo")+'<div>'+
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

  /* ---------------- roster ----------------------------------
     Grouped by position the way a team sheet is written:
     goaltenders, defence, forwards — then the staff. The team
     filter narrows all three groups at once. */
  var POSGROUPS = [
    {key:"Goaltender", label:"Goaltenders"},
    {key:"Defence",    label:"Defence"},
    {key:"Forward",    label:"Forwards"}
  ];

  S.renderPlayers = function(){
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
        '<div class="roster">'+group.map(function(p){
          return '<div class="pl" data-item>'+
            ph("player:"+p.id, "", "Portrait")+
            '<span class="no">'+(String(p.no)==="0" ? "&mdash;" : "#"+esc(p.no))+'</span>'+
            '<div class="plb"><div class="pn">'+esc(p.name)+'</div>'+
            '<div class="pp">'+esc(p.team)+'</div></div>'+tools("players",p.id)+'</div>';
        }).join("")+'</div></section>';
    }).join("") ||
      '<div class="gatemsg"><p>No players in this squad yet.</p></div>';

    /* staff sit under the roster, never inside a position group */
    $("#staffgrid").innerHTML = C().staff.map(function(m){
      return '<div class="pl staff" data-item>'+
        ph("staff:"+m.id, "", "Portrait")+
        '<div class="plb"><div class="pn">'+esc(m.name)+'</div>'+
        '<div class="pp">'+esc(m.role)+'</div></div>'+tools("staff",m.id)+'</div>';
    }).join("");

    /* Scoring is illustrative: the club does not publish per-player
       statistics, so the table shows the SHAPE with generated
       numbers and says so underneath. Seeded off the player id so
       the figures at least stay stable between renders. */
    var scorers = C().players.filter(function(p){
      return p.team === "Stallions" && p.pos !== "Goaltender";
    }).slice(0,8).map(function(p){
      var seed = 0; for(var i=0;i<p.id.length;i++) seed += p.id.charCodeAt(i);
      var gp = 12 + (seed % 4);
      var g  = p.pos === "Forward" ? (seed % 15) + 2 : (seed % 5);
      var a  = (seed % 11) + 1;
      return {p:p, gp:gp, g:g, a:a, pim:(seed % 9)*2};
    }).sort(function(x,y){ return (y.g+y.a) - (x.g+x.a); });

    $("#scoring").innerHTML = scorers.map(function(r){
      return '<tr><td class="num">'+(String(r.p.no)==="0"?"&mdash;":esc(r.p.no))+'</td>'+
        '<td class="name">'+esc(r.p.name)+'</td>'+
        '<td class="num">'+esc(r.p.pos.charAt(0))+'</td>'+
        '<td class="num">'+r.gp+'</td><td class="num">'+r.g+'</td><td class="num">'+r.a+'</td>'+
        '<td class="num" style="color:var(--gold)">'+(r.g+r.a)+'</td>'+
        '<td class="num">'+r.pim+'</td></tr>';
    }).join("");

    $("#coachpanel").innerHTML = S.can("roster.edit") ?
      '<div class="gatemsg" style="margin-top:34px;border-color:rgba(143,209,176,.4)"><div>'+
      '<p style="color:var(--ok);font-family:var(--mono);font-size:10px;letter-spacing:.16em;text-transform:uppercase;margin:0 0 8px">Coach tools</p>'+
      '<p>You can edit rosters and lineups for Stallions and Studs 1, mark training attendance and publish game sheets. Board members can do this for every squad.</p></div>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap">'+
      '<button class="btn btn-sm" data-add="players">Add player</button>'+
      '<button class="btn btn-sm">Mark attendance</button></div></div>' : "";
  };

  /* ---------------- games + competitions -------------------- */
  function gameRow(g, col){
    return '<tr><td class="num">'+esc(g.date)+'</td><td class="num">'+esc(g.team)+'</td>'+
      '<td class="name">'+esc(g.fixture)+'</td><td class="num">'+esc(g.venue)+'</td>'+
      '<td class="res '+esc(g.outcome)+'">'+esc(g.result)+'</td>'+
      '<td class="num">'+(g.outcome?'<a class="tlink" href="#/games">Sheet</a>':'&mdash;')+
      (S.isAdmin()?' <span class="rowacts" style="display:inline-flex;margin-left:8px">'+
        '<button data-edit="'+col+':'+g.id+'">Edit</button></span>':'')+'</td></tr>';
  }

  S.renderGames = function(){
    $("#gamesbody").innerHTML = C().games.map(function(g){ return gameRow(g,"games"); }).join("");
    $("#comps").innerHTML = C().comps.map(function(c){
      return '<div data-item style="position:relative"><h3 class="disp d4">'+esc(c.title)+'</h3>'+
        '<p class="body" style="margin-top:14px">'+esc(c.body)+'</p>'+tools("comps",c.id)+'</div>';
    }).join("");
  };

  /* ---------------- past games archive ---------------------- */
  S.renderPastGames = function(){
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
      return '<tr><td class="num">'+esc(g.season)+'</td><td class="num">'+esc(g.date)+'</td>'+
        '<td class="num">'+esc(g.team)+'</td><td class="name">'+esc(g.fixture)+'</td>'+
        '<td class="num">'+esc(g.venue)+'</td>'+
        '<td class="res '+esc(g.outcome)+'">'+esc(g.result)+'</td>'+
        (S.isAdmin()?'<td><span class="rowacts"><button data-edit="pastgames:'+g.id+'">Edit</button></span></td>':'<td class="num">&mdash;</td>')+
        '</tr>';
    }).join("") : '<tr><td colspan="7" class="name">No games recorded for this season yet.</td></tr>';

    /* Won / lost / drawn for whatever is on screen */
    var w = rows.filter(function(g){return g.outcome==="w";}).length;
    var l = rows.filter(function(g){return g.outcome==="l";}).length;
    $("#pgsummary").innerHTML =
      '<div class="tallies">'+
      '<div class="tally"><span class="tv" style="color:var(--gold)">'+w+'</span><span class="tk">Won</span></div>'+
      '<div class="tally"><span class="tv">'+l+'</span><span class="tk">Lost</span></div>'+
      '<div class="tally"><span class="tv">'+(rows.length-w-l)+'</span><span class="tk">Drawn / other</span></div>'+
      '<div class="tally"><span class="tv">'+rows.length+'</span><span class="tk">Games</span></div></div>';
  };

  /* ---------------- news archive ---------------------------- */
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

  /* ---------------- history timeline ------------------------ */
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

    $("#trainmember").innerHTML = S.can("view.calendar") ?
      '<div class="gatemsg" style="margin-top:34px"><div>'+
      '<p class="mono" style="color:var(--ice);margin:0 0 8px">Members only · your next sessions</p>'+
      '<p><strong style="color:var(--bone)">Tue 21:15</strong> — Group B, IJsbaan Twente, Colosseum 90. '+
      '<strong style="color:var(--bone)">Thu 22:00</strong> — full squad, tactics.</p></div>'+
      '<a class="btn btn-sm" href="#/pictures">Add to calendar</a></div>' :
      '<div class="gatemsg" style="margin-top:34px">'+
      '<p>Exact training times, rink addresses and the attendance list are visible to signed-in members.</p>'+
      '<a class="btn btn-sm" href="#/signin">Sign in</a></div>';
  };

  /* ---------------- board ----------------------------------- */
  S.renderBoard = function(){
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
    var open = S.can("view.gallery");

    $("#picbrow").textContent = open ? "Pictures / Albums" : "Pictures / Members only";
    $("#pich1").innerHTML     = open ? "Albums from<br>the season" : "The gallery<br>is behind the door";

    $("#picgate").innerHTML = open ? "" :
      '<div class="lockbox" style="margin-top:44px"><div>'+
      '<h3 class="disp d4">Sign in to view albums</h3>'+
      '<p class="body" style="margin-top:14px">Photo albums from games, tournaments and promo events are visible to active members only. Coaches and board members see additional albums and upload rights.</p></div>'+
      '<div><a class="btn btn-gold" href="#/signin">Sign in</a></div></div>';

    /* --- one album opened --- */
    var opened = S.state.openAlbum &&
      C().albums.filter(function(a){ return a.id === S.state.openAlbum; })[0];

    if(opened && open && albumVisible(opened)){
      var photos = opened.photos || [];
      $("#albumsarea").innerHTML =
        '<div class="albumhead">'+
        '<button class="tlink" data-album="">&larr; All albums</button>'+
        '<h2 class="disp d3" style="margin:16px 0 6px">'+esc(opened.title)+'</h2>'+
        '<p class="eyebrow">'+esc(opened.meta)+' · <span style="color:var(--gold)">'+
          (opened.vis==="coach"?"Coach only":opened.vis==="member"?"Members":"Public")+'</span></p>'+
        (S.can("album.upload") ?
          '<div class="uploadbar">'+
          '<button class="btn btn-sm btn-gold" data-upload="'+esc(opened.id)+'">Add photos</button>'+
          '<span class="mono" style="color:var(--ice)">Pick one or more images. They are resized and stored in your browser.</span>'+
          '</div>' : '')+
        '</div>'+
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
            : '<p class="mono" style="color:var(--ice)">A coach or board member can add them.</p>')+
          '</div>');
      return;
    }

    /* --- album list --- */
    var cat = S.state.picFilter;
    var visible = C().albums.filter(albumVisible);
    var shown = open ? visible.filter(function(a){ return cat==="all" || a.cat===cat; })
                     : C().albums;

    $("#albumsarea").innerHTML =
      (open ? '<div class="filters" style="margin-top:48px">'+CATS.map(function(c){
          var n = c.k==="all" ? visible.length : visible.filter(function(a){return a.cat===c.k;}).length;
          return '<button class="filt'+(cat===c.k?" on":"")+'" data-piccat="'+c.k+'">'+esc(c.l)+'<i>'+n+'</i></button>';
        }).join("")+'</div>'
        : '<p class="eyebrow" style="margin-top:56px">Locked preview · what members see</p>')+
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
        (S.isAdmin()?'<button class="btn btn-sm" data-add="albums">New album</button>':'')+'</div>' : "");
  };

  /* ---------------- sign-up page ---------------------------- */
  S.renderJoin = function(){
    var sent = S.state.joinSent;
    $("#joinform").style.display = sent ? "none" : "";
    $("#joindone").innerHTML = sent ?
      '<div class="donebox">'+
      '<p class="eyebrow" style="color:var(--ok)">Received</p>'+
      '<h2 class="disp d3" style="margin:14px 0 18px">Thanks, '+esc(String(sent.name).split(" ")[0])+'</h2>'+
      '<p class="body">Your request is with the board. Someone will mail <strong style="color:var(--bone)">'+esc(sent.email)+
      '</strong> within a few days with the date, what to bring, and where to meet at the rink.</p>'+
      '<dl class="summary">'+
        '<div><dt>Session</dt><dd>'+esc(sent.session)+'</dd></div>'+
        '<div><dt>Experience</dt><dd>'+esc(sent.experience)+'</dd></div>'+
        '<div><dt>Status</dt><dd>'+esc(sent.study)+'</dd></div>'+
      '</dl>'+
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:26px">'+
      '<a class="btn btn-sm" href="#/hockey">Read up on the game first</a>'+
      '<button class="btn btn-sm" data-act="joinagain">Send another</button></div>'+
      '</div>' : "";
  };

  /* ---------------- home sidebar rails ----------------------
     Signed out this slot is the conversion, not a login box:
     someone reading the news feed is a potential member, and
     "sign in" means nothing to them. */
  S.renderMemberRail = function(){
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
      '<span class="mono" style="color:var(--gold)">Free</span></div>'+
      '<div class="joinbody">'+
      '<p class="joinlead">Two free introduction practices a year. Skates, stick and full gear are waiting at the rink.</p>'+
      '<ul class="joinlist">'+
      '<li>No experience needed</li><li>Nothing to bring but sports clothes</li>'+
      '<li>Open to UT, Saxion and non-students</li></ul>'+
      '<a class="btn btn-gold btn-sm" href="#/join">Sign up for a practice</a>'+
      '<a class="tlink" href="#/training" style="display:inline-block;margin-top:16px">How it works</a>'+
      '</div></div>';
  };

  /* ---------------- header nav ------------------------------
     Sub-menu items go to real destinations: either another page
     or a section on the page they belong to (#/page/section).
     A dropdown that does not move you is worse than no dropdown. */
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
         '<a href="#/players">Players &amp; rosters <i>'+C().players.length+'</i></a>'+
         '<a href="#/about">About us</a>'+
         '<a href="#/training">Training</a><a href="#/history">History <i>1982&ndash;</i></a>'+
         (coach?'<a href="#/players">Attendance <span class="gate c">Coach</span></a>':'')+'</div></div>';

    h += '<div class="navitem hasmenu" data-nav="games"><a href="#/games">Games</a><div class="menu">'+
         '<a href="#/games">This season <i>'+C().games.length+'</i></a>'+
         '<a href="#/pastgames">Past seasons <i>'+C().pastgames.length+'</i></a>'+
         '<a href="#/games/comps">Competitions</a></div></div>';

    h += '<div class="navitem hasmenu" data-nav="hockey"><a href="#/hockey">Hockey</a><div class="menu">'+
         '<a href="#/hockey/what">What is ice hockey</a>'+
         '<a href="#/hockey/gear">Gear <i>'+C().gear.length+'</i></a>'+
         '<a href="#/hockey/rules">Rules to start <i>'+C().rules.length+'</i></a></div></div>';

    h += '<div class="navitem hasmenu" data-nav="pictures"><a href="#/pictures">Pictures</a><div class="menu">'+
         '<a href="#/pictures/games">Games <span class="gate m">'+(gallery?"Open":"Members")+'</span></a>'+
         '<a href="#/pictures/tournaments">Tournaments <span class="gate m">'+(gallery?"Open":"Members")+'</span></a>'+
         '<a href="#/pictures/promo">Promo &amp; off-ice <span class="gate m">'+(gallery?"Open":"Members")+'</span></a>'+
         '<a href="#/pictures/coach">Coach film <span class="gate c">Coach</span></a></div></div>';

    h += '<div class="navitem hasmenu" data-nav="contact"><a href="#/contact">Contact</a><div class="menu">'+
         '<a href="#/contact/board">The board</a>'+
         '<a href="#/contact/message">Send a message</a>'+
         '<a href="#/contact/find">Where to find us</a>'+
         '<a href="#/join">Join the Studs</a></div></div>';

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
      : '<a class="chip chip-join" href="#/join">Want to join?</a>'+
        '<a class="chip" href="#/signin"><span class="dot"></span>Sign in</a>';

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
    S.renderNews();
    S.renderEvents();
    S.renderPlayers();
    S.renderGames();
    S.renderPastGames();
    S.renderArchive();
    S.renderTimeline();
    S.renderHockey();
    S.renderBoard();
    S.renderAlbums();
    S.renderSignin();
    S.renderMemberRail();
    S.renderJoin();
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

})(window.Studs);
