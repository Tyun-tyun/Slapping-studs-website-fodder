/* ============================================================
   admin.js — "godmode": the editing layer.

   Two surfaces on purpose:
     1. inline  — edit the real page in place (setEditing)
     2. console — a back office over every collection (admin.html)
   Both write to the same store through the same drawer, so
   there is one create/update/delete path, not two.
   ============================================================ */

(function(S){
  "use strict";
  var $ = S.$, $$ = S.$$, esc = S.esc;
  function C(){ return S.state.content; }

  /* ---------------- inline edit mode ------------------------
     The flag is kept in the session, not just in memory, so an
     admin who turns editing on still has it on after following
     a link to another page. app.js reapplies it on boot. */
  S.setEditing = function(on){
    S.state.editing = !!on && S.isAdmin();
    if(S.state.session){
      S.state.session.editing = S.state.editing;
      S.saveSession();
    }
    document.body.classList.toggle("editing", S.state.editing);
    $$("[data-ed]").forEach(function(el){
      if(S.state.editing) el.setAttribute("contenteditable","true");
      else el.removeAttribute("contenteditable");
    });
    $$(".addtile").forEach(function(b){ b.style.display = (S.state.editing && !b.dataset.hidden) ? "block" : "none"; });
    /* photo slots grow (or lose) their upload button here */
    S.applyPhotos();
    S.renderAdminBar();
    S.renderAccount();
  };

  /* Saving happens on blur, so there is no save button to miss.
     Text identical to the authored default deletes the override
     rather than storing a duplicate. */
  S.bindInlineEditing = function(){
    document.addEventListener("blur", function(e){
      var el = e.target;
      if(!el.dataset || !el.dataset.ed || !S.state.editing) return;
      var key = el.dataset.ed, val = el.innerHTML.trim();
      if(val === S.state.defaults[key]) delete C().copy[key];
      else C().copy[key] = val;
      S.save();
      S.toast('Saved "'+key+'"');
    }, true);
  };

  /* ---------------- bottom admin bar ------------------------ */
  S.renderAdminBar = function(){
    var bar = $("#adminbar");
    document.body.classList.toggle("isadmin", S.isAdmin());
    document.body.classList.toggle("god", S.isAdmin());
    document.body.classList.toggle("editing", S.state.editing && S.isAdmin());
    if(!S.isAdmin()){ bar.innerHTML = ""; return; }

    bar.innerHTML =
      '<span class="abbrand"><span class="pulse"></span>Godmode</span>'+
      '<button class="abtn'+(S.state.editing?" on":"")+'" data-act="toggleedit">'+
        (S.state.editing?"Editing on":"Edit on page")+'</button>'+
      '<button class="abtn" data-act="console">Admin console</button>'+
      '<span class="abrule"></span>'+
      '<button class="abtn" data-add="news">New news post</button>'+
      '<button class="abtn" data-add="events">New event</button>'+
      '<button class="abtn" data-add="announcements">New announcement</button>'+
      '<button class="abtn" data-add="games">New game</button>'+
      '<button class="abtn" data-add="players">New player</button>'+
      '<span class="abspacer"></span>'+
      '<span class="abmeta">'+esc(S.state.session.name)+' · changes saved in this browser</span>'+
      '<button class="abtn" data-act="signout">Exit</button>';
  };

  /* ============================================================
     The console
     ============================================================ */

  /* Where each collection lives in the sidebar. A collection that
     is added to the schema and forgotten here still shows up — it
     falls through into "Everything else" rather than vanishing. */
  var AREAS = [
    ["News and announcements", ["news","announcements","archive"]],
    ["Team and people",        ["players","staff","board","signups"]],
    ["Games and results",      ["events","games","pastgames","standings",
                                "gamesheets","sheetgoals","sheetpens","sheetlineup"]],
    ["Training and kit",       ["sessions","kit","steps","gear","rules","comps"]],
    ["Members",                ["points","pointsrule","travel"]],
    ["Site content",           ["stats","timeline","chapters","albums"]]
  ];

  /* One plain line saying what the collection is for, shown under
     the view title. Left out where the label already says it. */
  var NOTES = {
    news:"Shown on the home page and on news.html.",
    announcements:"The short notices in the ticker and on the home page.",
    archive:"The season summaries listed under the news.",
    players:"The roster on players.html, grouped by position.",
    staff:"Listed after the roster.",
    board:"Shown on about.html and used by the contact form.",
    signups:"Practice applications sent from join.html.",
    events:"The calendar on the home page and on games.html.",
    games:"This season's fixtures and results.",
    pastgames:"Fixtures from earlier seasons.",
    standings:"The division tables.",
    gamesheets:"One record per published game sheet.",
    sheetgoals:"Goal rows, keyed by fixture id.",
    sheetpens:"Penalty rows, keyed by fixture id.",
    sheetlineup:"Lineup rows, keyed by fixture id.",
    sessions:"The weekly ice times on training.html.",
    kit:"What a newcomer brings and what the club lends.",
    steps:"The how-to-start steps on training.html.",
    gear:"The gear guide on hockey.html.",
    rules:"The rules explained on hockey.html.",
    comps:"The competitions the club plays in.",
    points:"Each member's points, shown on their overview.",
    pointsrule:"How many points are needed, and the top of the scale.",
    travel:"Who is going to away games, and how.",
    stats:"The four figures at the top of the home page.",
    timeline:"The dated entries on history.html.",
    chapters:"The long-form sections on history.html.",
    albums:"Photo albums on pictures.html."
  };

  /* "New …" wording where stripping a trailing s is not enough. */
  var NEWLABEL = {
    gamesheets:"game sheet", sheetgoals:"goal", sheetpens:"penalty",
    sheetlineup:"lineup row", stats:"achievement", kit:"kit item",
    standings:"standings row", archive:"season", travel:"signup",
    points:"member", pointsrule:"rule", staff:"staff member", comps:"competition",
    steps:"step", chapters:"chapter", timeline:"timeline entry"
  };

  function newLabel(col){
    return NEWLABEL[col] || S.schema[col].label.replace(/s$/,"").toLowerCase();
  }

  /* Which collections keep a picture, and under which slot name.
     The slot convention is views.js's: "<prefix>:<record id>", so
     a photo set here needs no change anywhere else. */
  var PHOTO = {
    news:"news:", players:"player:", board:"board:",
    gear:"gear:", albums:"album:", timeline:"timeline:"
  };
  function slotFor(col,id){ return (PHOTO[col] && id) ? PHOTO[col]+id : ""; }

  /* The column a human reads the row by. */
  var IDCOLS = ["title","name","item","fixture","scorer","player","text","driver",
                "team","day","who","season","game","div","v","k","lb","n","rule"];
  function idCol(cols){
    for(var i=0;i<IDCOLS.length;i++) if(cols.indexOf(IDCOLS[i])>-1) return IDCOLS[i];
    return cols[0];
  }

  /* A column is set right, in tabular figures, only when every
     value in it really is a number. Dates and scores stay left. */
  function isNumeric(col, rows){
    var seen = 0;
    for(var i=0;i<rows.length;i++){
      var v = rows[i][col]; if(v==null) continue;
      v = String(v).trim(); if(!v) continue;
      seen++;
      if(!/^[-+]?[0-9]+([.,:][0-9]+)*\s*%?$/.test(v)) return false;
    }
    return seen > 0;
  }

  /* ---------------- console: the sidebar -------------------- */
  S.renderAdminNav = function(){
    var nav = $("#adnav");
    if(!nav) return;

    var placed = {}, html = "";
    AREAS.forEach(function(a){
      var keys = a[1].filter(function(k){ return !!S.schema[k]; });
      if(!keys.length) return;
      keys.forEach(function(k){ placed[k] = true; });
      html += group(a[0], keys.map(item));
    });
    var rest = Object.keys(S.schema).filter(function(k){ return !placed[k]; });
    if(rest.length) html += group("Everything else", rest.map(item));

    html += group("Site text and settings", [
      btn("__copy","Page text", Object.keys(C().copy).length, ""),
      btn("__danger","Danger zone", null, " adnav__b--danger")
    ]);
    nav.innerHTML = html;

    function item(k){ return btn(k, S.schema[k].label, C()[k].length, ""); }
    function btn(key,label,count,extra){
      return '<button type="button" class="adnav__b'+extra+
        (key===S.state.adTab?" is-on":"")+'" data-tab="'+esc(key)+'"'+
        (key===S.state.adTab?' aria-current="true"':'')+'>'+
        '<span class="adnav__l">'+esc(label)+'</span>'+
        (count==null?"":'<span class="adnav__n">'+count+'</span>')+'</button>';
    }
    function group(label, buttons){
      return '<div class="adnav__g"><p class="adnav__gt">'+esc(label)+'</p>'+
        buttons.join("")+'</div>';
    }
  };

  /* ---------------- console: the view ----------------------- */
  function viewHead(area, title, countLine, note, action){
    return '<div class="adview__h">'+
      '<div class="adview__ht">'+
        '<p class="adview__area">'+esc(area)+'</p>'+
        '<h2 class="adview__t">'+esc(title)+'</h2>'+
        '<p class="adview__meta"><span class="adview__n">'+esc(countLine)+'</span>'+
          (note?'<span class="adview__note">'+esc(note)+'</span>':'')+'</p>'+
      '</div>'+
      (action||"")+'</div>';
  }

  function areaOf(col){
    for(var i=0;i<AREAS.length;i++) if(AREAS[i][1].indexOf(col)>-1) return AREAS[i][0];
    return "Collection";
  }

  S.renderAdminBody = function(){
    var body = $("#adbody");
    if(!body) return;
    var tab = S.state.adTab;

    if(tab === "__copy"){
      var keys = Object.keys(C().copy);
      body.innerHTML =
        viewHead("Site text and settings","Page text",
          keys.length + (keys.length===1?" block edited":" blocks edited"),
          "Headlines and paragraphs rewritten in place on the site.","")+
        '<div class="adtwrap"><table class="adtable"><thead><tr>'+
        '<th>Key</th><th>Current text</th><th class="adth-a">Actions</th></tr></thead><tbody>'+
        (keys.length ? keys.map(function(k){
          var plain = C().copy[k].replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim();
          return '<tr><td class="adid">'+esc(k)+'</td>'+
            '<td class="adcell">'+esc(plain.length>80?plain.slice(0,80)+"…":plain)+'</td>'+
            '<td class="adacts"><button type="button" data-revert="'+esc(k)+'">Revert</button></td></tr>';
        }).join("") : emptyRow(3,"Nothing has been overwritten yet."))+
        '</tbody></table></div>';
      return;
    }

    if(tab === "__danger"){
      var photos = Object.keys(C().images||{}).length +
        C().albums.reduce(function(n,a){ return n + (a.photos||[]).length; }, 0);
      body.innerHTML =
        viewHead("Site text and settings","Danger zone","Reset and export",
          "Every change lives in this browser only. Nothing is sent anywhere.","")+
        '<div class="adcards">'+
          '<div class="adcard"><p class="adcard__k">Stored right now</p>'+
            '<p class="adcard__v">'+esc(S.storageUsed())+'</p>'+
            '<p class="adcard__n">of roughly 5 MB</p></div>'+
          '<div class="adcard"><p class="adcard__k">Uploaded photos</p>'+
            '<p class="adcard__v">'+photos+'</p>'+
            '<p class="adcard__n">across every slot and album</p></div>'+
        '</div>'+
        '<div class="adblock">'+
          '<h3 class="adblock__t">Export</h3>'+
          '<p class="adblock__b">Copy the whole content store as JSON. Paste it back into <code>js/data.js</code> to make these edits the default for everyone, or hand it to whoever builds the back end as the seed for the real database.</p>'+
          '<button type="button" class="abtn2" data-act="export">Copy content as JSON</button>'+
        '</div>'+
        '<div class="adblock adblock--danger">'+
          '<h3 class="adblock__t">Reset</h3>'+
          '<p class="adblock__b">Put all content back to the version shipped in <code>js/data.js</code>. Uploaded photos and every edit made in this browser are lost.</p>'+
          '<button type="button" class="abtn2 is-danger" data-act="reset">Reset all content</button>'+
        '</div>';
      return;
    }

    var sc = S.schema[tab];
    if(!sc){ S.state.adTab = "news"; return S.renderAdminBody(); }
    var rows = C()[tab], id = idCol(sc.cols), hasPhoto = !!PHOTO[tab];
    var nums = {};
    sc.cols.forEach(function(c){ nums[c] = (c !== id) && isNumeric(c, rows); });

    var span = sc.cols.length + 1 + (hasPhoto?1:0);

    body.innerHTML =
      viewHead(areaOf(tab), sc.label,
        rows.length + (rows.length===1?" record":" records"),
        NOTES[tab]||"",
        '<button type="button" class="abtn2 is-primary" data-add="'+esc(tab)+'">New '+
          esc(newLabel(tab))+'</button>')+
      '<div class="adtwrap"><table class="adtable"><thead><tr>'+
      (hasPhoto?'<th class="adth-p">Photo</th>':'')+
      sc.cols.map(function(c){
        return '<th'+(nums[c]?' class="adth-n"':'')+'>'+esc(colLabel(sc,c))+'</th>';
      }).join("")+
      '<th class="adth-a">Actions</th></tr></thead><tbody>'+
      (rows.length ? rows.map(function(r){
        return '<tr>'+
          (hasPhoto?'<td class="adthumb">'+thumb(slotFor(tab,r.id))+'</td>':'')+
          sc.cols.map(function(c){
            var v = r[c]==null ? "" : String(r[c]);
            if(c === "status" || c === "outcome")
              return '<td>'+pill(c,v)+'</td>';
            if(nums[c]) return '<td class="adnum">'+esc(v)+'</td>';
            return '<td class="'+(c===id?"adid":"adcell")+'">'+
              esc(v.length>58 ? v.slice(0,58)+"…" : v)+'</td>';
          }).join("")+
          '<td class="adacts">'+
            '<button type="button" data-edit="'+esc(tab)+':'+esc(r.id)+'">Edit</button>'+
            '<button type="button" data-dup="'+esc(tab)+':'+esc(r.id)+'">Duplicate</button>'+
            '<button type="button" class="is-danger" data-del="'+esc(tab)+':'+esc(r.id)+'">Delete</button>'+
          '</td></tr>';
      }).join("") : emptyRow(span,"No "+S.schema[tab].label.toLowerCase()+" yet."))+
      '</tbody></table></div>';
  };

  function emptyRow(span,msg){
    return '<tr class="adempty"><td colspan="'+span+'">'+esc(msg)+'</td></tr>';
  }

  /* The schema already names every field; reuse that for the table
     head rather than printing the raw key. Long labels carry a
     parenthesis or a dash — cut at the first of those. */
  function colLabel(sc,key){
    var f = sc.fields.filter(function(x){ return x[0] === key; })[0];
    var l = f ? f[1] : key;
    l = l.split(" (")[0].split(" — ")[0].split(" - ")[0];
    return l;
  }

  function pill(col,v){
    if(!v) return '<span class="adpill adpill--none">—</span>';
    var tone = "neutral";
    if(col === "status") tone = /^(published|joined|FT)$/i.test(v) ? "good" :
                                 /^(draft|new)$/i.test(v) ? "warn" :
                                 /^declined$/i.test(v) ? "bad" : "neutral";
    if(col === "outcome") tone = v === "w" ? "good" : "bad";
    return '<span class="adpill adpill--'+tone+'">'+esc(v)+'</span>';
  }

  function thumb(slot){
    var src = slot ? S.getImage(slot) : "";
    return src
      ? '<span class="adthumb__i" style="background-image:url(\''+src+'\')"></span>'
      : '<span class="adthumb__i is-empty" title="No photo"></span>';
  }

  /* ---------------- record drawer ---------------------------
     Built from the schema, so a new collection needs no new UI.
     Fields are grouped where a collection has more than a
     screenful; anything the map forgets lands in "More". */
  var DGROUPS = {
    news:       [["The post",["title","date","tag","author","status"]],
                 ["Text",["excerpt","body"]]],
    gamesheets: [["The game",["game","comp","date","faceoff","venue","refs"]],
                 ["Score",["home","away","homeRec","awayRec","hs","as","status","hp","ap"]],
                 ["Stars of the game",["star1","star1line","star2","star2line","star3","star3line"]],
                 ["Report",["report"]]],
    games:      [["Fixture",["date","team","fixture","venue"]],["Result",["result","outcome"]]],
    pastgames:  [["Fixture",["season","date","team","fixture","venue"]],["Result",["result","outcome"]]],
    standings:  [["Team",["div","pos","team","us"]],["Record",["gp","w","otw","l","gd","pts"]]],
    signups:    [["Applicant",["name","email","study","experience"]],
                 ["Request",["session","note","date","status"]]],
    chapters:   [["Chapter",["yr","kicker","nav","h"]],
                 ["Text",["lead","body","quote"]],
                 ["Photo",["cap","img","credit","creditUrl","shots","media"]]],
    travel:     [["Game",["ev"]],["Person",["name","who"]],["Trip",["going","how","drive"]]],
    sessions:   [["The day",["day","len","rule"]],["Slots",["g1","t1","g2","t2"]]]
  };

  function groupsFor(col, fields){
    var map = DGROUPS[col], out = [], used = {};
    if(map){
      map.forEach(function(g){
        var fs = g[1].map(function(k){
          return fields.filter(function(f){ return f[0] === k; })[0];
        }).filter(Boolean);
        fs.forEach(function(f){ used[f[0]] = true; });
        if(fs.length) out.push([g[0], fs]);
      });
      var rest = fields.filter(function(f){ return !used[f[0]]; });
      if(rest.length) out.push(["More", rest]);
      return out;
    }
    if(fields.length > 7) return [["Essentials", fields.slice(0,5)], ["More details", fields.slice(5)]];
    return [["", fields]];
  }

  var ctx = null;

  S.openDrawer = function(col,id){
    var sc = S.schema[col];
    if(!sc) return;
    var rec = id ? C()[col].filter(function(r){ return r.id === id; })[0] : null;
    /* A brand-new record gets its id here rather than at save time,
       so its photo slot exists while the drawer is open. Cancel
       throws the picture away again — see closeDrawer. */
    ctx = {col:col, id:id, newId: rec ? null : S.uid(), photoSet:false};
    var slot = slotFor(col, rec ? rec.id : ctx.newId);

    $("#drawer").innerHTML =
      '<div class="dwh">'+
        '<div><p class="dwh__k">'+esc(sc.label)+'</p>'+
        '<h3 class="dwh__t">'+(rec?"Edit":"New")+' '+esc(newLabel(col))+'</h3>'+
        '<p class="dwh__s">'+(rec?"Record "+esc(rec.id):"Not saved yet")+'</p></div>'+
        '<button type="button" class="dwx" data-act="drawerclose" aria-label="Close">&#10005;</button>'+
      '</div>'+
      '<div class="dwb"><form id="dwform" autocomplete="off">'+
        (slot ? '<section class="dwg" data-photofield data-slot="'+esc(slot)+'">'+
                '<h4 class="dwg__t">Photo</h4>'+photoField(slot, col, !rec)+'</section>' : '')+
        groupsFor(col, sc.fields).map(function(g){
          return '<section class="dwg">'+
            (g[0]?'<h4 class="dwg__t">'+esc(g[0])+'</h4>':'')+
            g[1].map(function(f){ return field(f, rec); }).join("")+
          '</section>';
        }).join("")+
      '</form></div>'+
      '<div class="dwf">'+
        (rec ? '<button type="button" class="abtn2 is-danger" data-act="drawerdel">Delete</button>' : '')+
        '<span class="abspacer"></span>'+
        '<button type="button" class="abtn2" data-act="drawerclose">Cancel</button>'+
        '<button type="button" class="abtn2 is-primary" data-act="drawersave">'+
          (rec?"Save changes":"Create")+'</button>'+
      '</div>';

    $("#drawer").classList.add("on");
    $("#drawer").setAttribute("aria-hidden","false");
    $("#scrim").classList.add("on");
    var first = $("#drawer").querySelector("input,select,textarea");
    if(first) first.focus();

    function field(f, rec){
      var key=f[0], label=f[1], type=f[2];
      var val = rec ? (rec[key]==null?"":rec[key]) : "";
      var hint = label.indexOf(" (")>-1 ? label.slice(label.indexOf(" (")+2).replace(/\)$/,"") : "";
      var head = '<label class="dwl" for="f-'+esc(key)+'">'+esc(label.split(" (")[0])+'</label>'+
                 (hint?'<p class="dwhint">'+esc(hint)+'</p>':'');
      if(type.indexOf("select:") === 0){
        return '<div class="dwfield">'+head+'<select id="f-'+esc(key)+'" name="'+esc(key)+'">'+
          type.slice(7).split(",").map(function(o){
            return '<option value="'+esc(o)+'"'+(String(val)===o?" selected":"")+'>'+(o?esc(o):"—")+'</option>';
          }).join("")+'</select></div>';
      }
      if(type === "textarea")
        return '<div class="dwfield">'+head+'<textarea id="f-'+esc(key)+'" name="'+esc(key)+'" rows="5">'+esc(val)+'</textarea></div>';
      return '<div class="dwfield">'+head+'<input id="f-'+esc(key)+'" name="'+esc(key)+'" type="text" value="'+esc(val)+'"></div>';
    }
  };

  /* ---------------- the photo control -----------------------
     One picture per record, stored in the slot the public pages
     already read ("news:<id>"), so nothing in views.js changes. */
  function photoField(slot, col, isNew){
    var src = S.getImage(slot);
    var where = col === "news" ? "It shows on the home page and on the post."
              : "It shows wherever this record appears on the site.";
    return '<div class="dwphoto">'+
      '<span class="dwphoto__i'+(src?"":" is-empty")+'"'+
        (src?' style="background-image:url(\''+src+'\')"':'')+'>'+
        (src?"":'<span class="dwphoto__e">No photo</span>')+'</span>'+
      '<div class="dwphoto__b">'+
        '<p class="dwphoto__m">'+(src ? where
          : "No picture yet. "+where+(isNew?" It is kept with the record when you create it.":""))+'</p>'+
        '<div class="dwphoto__a">'+
          '<button type="button" class="abtn2" data-adpick="'+esc(slot)+'">'+
            (src?"Replace photo":"Add a photo")+'</button>'+
          (src?'<button type="button" class="abtn2 is-danger" data-adclear="'+esc(slot)+'">Remove photo</button>':'')+
        '</div>'+
      '</div></div>';
  }

  function refreshPhotoField(){
    var sec = $("#drawer") && $("#drawer").querySelector("[data-photofield]");
    if(!sec || !ctx) return;
    sec.innerHTML = '<h4 class="dwg__t">Photo</h4>'+
      photoField(sec.dataset.slot, ctx.col, !ctx.id);
  }

  function pickPhoto(slot){
    S.pickImage({maxW:1600, onPick:function(urls){
      if(!urls || !urls.length) return;
      /* setImage writes straight through to localStorage and hands
         back false when the quota is hit — core.js has already said
         so in a toast. Roll the picture back out of memory so what
         is on screen is what is actually stored. */
      if(!S.setImage(slot, urls[0])){ S.clearImage(slot); refreshPhotoField(); return; }
      if(ctx) ctx.photoSet = true;
      refreshPhotoField();
      S.renderAdminBody();
      S.applyPhotos();
      S.toast("Photo saved");
    }});
  }

  function clearPhoto(slot){
    var gone = S.getImage(slot);
    if(!gone) return;
    S.clearImage(slot);
    if(ctx) ctx.photoSet = false;
    refreshPhotoField();
    S.renderAdminBody();
    S.applyPhotos();
    S.toast("Photo removed","Undo",function(){
      if(!S.setImage(slot, gone)) return;
      if(ctx) ctx.photoSet = true;
      refreshPhotoField();
      S.renderAdminBody();
      S.applyPhotos();
      S.toast("Photo restored");
    });
  }

  /* The console's own controls. app.js owns the site-wide click
     map; these two attributes are the drawer's and are handled
     here so admin.js stays self-contained. */
  if(!S._adBound){
    S._adBound = true;
    document.addEventListener("click", function(e){
      var p = e.target.closest ? e.target.closest("[data-adpick]") : null;
      if(p){ e.preventDefault(); e.stopPropagation(); pickPhoto(p.getAttribute("data-adpick")); return; }
      var c = e.target.closest ? e.target.closest("[data-adclear]") : null;
      if(c){ e.preventDefault(); e.stopPropagation(); clearPhoto(c.getAttribute("data-adclear")); }
    });
  }

  S.closeDrawer = function(){
    /* A picture attached to a record that was never created would
       be an orphan in storage. Throw it away with the draft. */
    if(ctx && !ctx.id && ctx.photoSet){
      var slot = slotFor(ctx.col, ctx.newId);
      if(slot) S.clearImage(slot);
    }
    $("#drawer").classList.remove("on");
    $("#drawer").setAttribute("aria-hidden","true");
    $("#scrim").classList.remove("on");
    ctx = null;
  };

  S.saveDrawer = function(){
    if(!ctx) return;
    var col = ctx.col, sc = S.schema[col], data = {};
    sc.fields.forEach(function(f){
      var el = $("#f-"+f[0]);
      if(el) data[f[0]] = el.value;
    });
    if(ctx.id){
      C()[col] = C()[col].map(function(r){
        return r.id === ctx.id ? Object.assign({}, r, data) : r;
      });
      S.save();
      S.toast("Saved");
    }else{
      /* the id the photo slot was already built on */
      data.id = ctx.newId;
      C()[col].unshift(data);
      ctx.photoSet = false;          // the picture belongs to a real record now
      S.save();
      S.toast("Created");
    }
    S.closeDrawer();
    S.renderAll();
  };

  /* Delete offers an undo instead of asking for confirmation.
     A confirm() dialog blocks the page; an undo does not, and
     it is far less annoying to use. The record's picture goes
     and comes back with it. */
  S.delRecord = function(col,id){
    var idx = -1;
    C()[col].forEach(function(r,i){ if(r.id === id) idx = i; });
    if(idx < 0) return;

    var slot = slotFor(col,id), img = slot ? S.getImage(slot) : "";
    S.state.lastDeleted = {col:col, idx:idx, rec:C()[col][idx], slot:slot, img:img};
    C()[col].splice(idx,1);
    if(img) S.clearImage(slot);
    S.save();
    S.closeDrawer();
    S.renderAll();

    S.toast("Deleted","Undo",function(){
      var d = S.state.lastDeleted;
      if(!d) return;
      C()[d.col].splice(d.idx, 0, d.rec);
      if(d.img) S.setImage(d.slot, d.img);
      S.state.lastDeleted = null;
      S.save();
      S.renderAll();
      S.toast("Restored");
    });
  };

  S.dupRecord = function(col,id){
    var rec = C()[col].filter(function(r){ return r.id === id; })[0];
    if(!rec) return;
    var copy = Object.assign({}, rec, {id:S.uid()});
    if(copy.title) copy.title += " (copy)";
    if(copy.name)  copy.name  += " (copy)";
    if(copy.status) copy.status = "draft";   // never duplicate straight to live
    C()[col].splice(C()[col].indexOf(rec)+1, 0, copy);
    /* the duplicate keeps the picture too */
    var from = slotFor(col,id), to = slotFor(col,copy.id);
    if(from && to && S.getImage(from)) S.setImage(to, S.getImage(from));
    S.save();
    S.renderAll();
    S.toast("Duplicated as draft");
  };

  S.exportJSON = function(){
    try{
      navigator.clipboard.writeText(JSON.stringify(C(), null, 2));
      S.toast("Content JSON copied to clipboard");
    }catch(e){
      S.toast("Clipboard blocked in this view");
    }
  };

  S.drawerContext = function(){ return ctx; };

  /* ---------------- photo slot menu -------------------------
     Used by the inline editor on the public pages: a slot that
     already holds a photo offers replace or remove instead of
     silently overwriting what is there. */
  S.closePhotoMenu = function(){
    var m = document.querySelector(".photomenu");
    if(m) m.remove();
  };

  S.openPhotoMenu = function(anchor, slot){
    S.closePhotoMenu();
    var m = document.createElement("div");
    m.className = "photomenu";
    m.innerHTML =
      '<button data-photoreplace="'+esc(slot)+'">Replace photo</button>'+
      '<button data-photoremove="'+esc(slot)+'">Remove photo</button>';
    document.body.appendChild(m);
    var r = anchor.getBoundingClientRect();
    m.style.top  = (r.bottom + window.pageYOffset + 6) + "px";
    m.style.left = Math.min(r.left + window.pageXOffset,
                            window.innerWidth - m.offsetWidth - 12) + "px";
  };

})(window.Studs);
