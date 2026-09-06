/* ============================================================
   admin.js — "godmode": the editing layer.

   Two surfaces on purpose:
     1. inline  — edit the real page in place (setEditing)
     2. console — a table view of every collection (admin.html)
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
    $$(".addtile").forEach(function(b){ b.style.display = S.state.editing ? "block" : "none"; });
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
      '<button class="abtn" data-add="news">+ News</button>'+
      '<button class="abtn" data-add="events">+ Event</button>'+
      '<button class="abtn" data-add="games">+ Game</button>'+
      '<button class="abtn" data-add="players">+ Player</button>'+
      '<span class="abspacer"></span>'+
      '<span class="abmeta">'+esc(S.state.session.name)+' · changes saved in this browser</span>'+
      '<button class="abtn" data-act="signout">Exit</button>';
  };

  /* ---------------- console: collection list ---------------- */
  S.renderAdminNav = function(){
    var nav = $("#adnav");
    if(!nav) return;
    nav.innerHTML = Object.keys(S.schema).map(function(k){
      return '<button data-tab="'+k+'"'+(k===S.state.adTab?' class="on"':'')+'>'+
        esc(S.schema[k].label)+'<i>'+C()[k].length+'</i></button>';
    }).join("")+
    '<button data-tab="__copy"'+(S.state.adTab==="__copy"?' class="on"':'')+'>Page text<i>'+
      Object.keys(C().copy).length+'</i></button>'+
    '<button data-tab="__danger"'+(S.state.adTab==="__danger"?' class="on"':'')+
      ' style="color:var(--danger)">Danger zone<i></i></button>';
  };

  /* ---------------- console: table -------------------------- */
  S.renderAdminBody = function(){
    var body = $("#adbody");
    if(!body) return;
    var tab = S.state.adTab;

    if(tab === "__copy"){
      var keys = Object.keys(C().copy);
      body.innerHTML =
        '<p class="eyebrow">Overridden text blocks</p>'+
        '<h2 class="disp d3" style="margin:14px 0 20px">'+keys.length+' edited</h2>'+
        '<p class="body">Turn on inline editing and click any headline or paragraph on the site to change it. Everything you overwrite is listed here so you can put it back.</p>'+
        (keys.length ?
          '<div class="tblwrap" style="margin-top:26px"><table><thead><tr>'+
          '<th>Key</th><th>Current text</th><th></th></tr></thead><tbody>'+
          keys.map(function(k){
            var plain = C().copy[k].replace(/<[^>]+>/g," ");
            return '<tr><td class="num">'+esc(k)+'</td>'+
              '<td class="name">'+esc(plain.slice(0,70))+'</td>'+
              '<td><span class="rowacts"><button data-revert="'+esc(k)+'">Revert</button></span></td></tr>';
          }).join("")+'</tbody></table></div>' : '');
      return;
    }

    if(tab === "__danger"){
      body.innerHTML =
        '<p class="eyebrow" style="color:var(--danger)">Danger zone</p>'+
        '<h2 class="disp d3" style="margin:14px 0 20px">Reset the demo</h2>'+
        '<p class="body">Every change you make lives in this browser only — nothing is sent anywhere and no other visitor sees it. Reset puts all content back to the version in js/data.js.</p>'+
        '<dl class="summary" style="margin-top:24px"><div><dt>Stored right now</dt><dd>'+esc(S.storageUsed())+
          ' of roughly 5 MB</dd></div><div><dt>Uploaded photos</dt><dd>'+
          (Object.keys(C().images||{}).length + C().albums.reduce(function(n,a){return n+(a.photos||[]).length;},0))+
          '</dd></div></dl>'+
        '<div style="display:flex;gap:8px;margin-top:26px;flex-wrap:wrap">'+
        '<button class="btn btn-sm btn-del" data-act="reset">Reset all content</button>'+
        '<button class="btn btn-sm" data-act="export">Copy content as JSON</button></div>'+
        '<p class="body" style="margin-top:20px;font-size:14px">Exporting gives you the whole content store as JSON. Paste it back into <code>js/data.js</code> to make your edits the default for everyone — or hand it to whoever is building the back end as the seed for the real database.</p>';
      return;
    }

    var sc = S.schema[tab], rows = C()[tab];
    body.innerHTML =
      '<p class="eyebrow">Collection</p>'+
      '<h2 class="disp d3" style="margin:14px 0 20px">'+esc(sc.label)+'</h2>'+
      '<div class="tblwrap"><table><thead><tr>'+
      sc.cols.map(function(c){ return '<th>'+esc(c)+'</th>'; }).join("")+
      '<th style="width:1%">Actions</th></tr></thead><tbody>'+
      (rows.length ? rows.map(function(r){
        return '<tr>'+sc.cols.map(function(c,i){
          var v = r[c]==null ? "" : String(r[c]);
          if(c === "status")
            return '<td><span class="pill '+(v==="draft"?"draft":"pub")+'">'+esc(v)+'</span></td>';
          return '<td class="'+(i===0 && sc.cols.length>1 ? "num" : "name")+'">'+
            esc(v.length>58 ? v.slice(0,58)+"…" : v)+'</td>';
        }).join("")+
        '<td><span class="rowacts">'+
        '<button data-edit="'+tab+':'+r.id+'">Edit</button>'+
        '<button data-dup="'+tab+':'+r.id+'">Duplicate</button>'+
        '<button class="del" data-del="'+tab+':'+r.id+'">Delete</button></span></td></tr>';
      }).join("") : '<tr><td colspan="'+(sc.cols.length+1)+'" class="name">Nothing here yet.</td></tr>')+
      '</tbody></table></div>'+
      '<button class="btn btn-sm btn-edit" style="margin-top:20px" data-add="'+tab+'">+ New '+
        esc(sc.label.replace(/s$/,"").toLowerCase())+'</button>';
  };

  /* ---------------- record drawer ---------------------------
     Built from the schema, so a new collection needs no new UI. */
  var ctx = null;

  S.openDrawer = function(col,id){
    var sc = S.schema[col];
    if(!sc) return;
    var rec = id ? C()[col].filter(function(r){ return r.id === id; })[0] : null;
    ctx = {col:col, id:id};

    $("#drawer").innerHTML =
      '<div class="dwh"><div><h3>'+(rec?"Edit":"New")+' '+esc(sc.label.replace(/s$/,"").toLowerCase())+'</h3>'+
      '<div class="sub">'+esc(sc.label)+(rec?" · "+esc(rec.id):" · unsaved")+'</div></div>'+
      '<button class="dwx" data-act="drawerclose">&#10005;</button></div>'+
      '<div class="dwb"><form id="dwform">'+sc.fields.map(function(f){
        var key=f[0], label=f[1], type=f[2];
        var val = rec ? (rec[key]==null?"":rec[key]) : "";
        if(type.indexOf("select:") === 0){
          return '<div><label for="f-'+key+'">'+esc(label)+'</label>'+
            '<select id="f-'+key+'" name="'+key+'">'+type.slice(7).split(",").map(function(o){
              return '<option value="'+esc(o)+'"'+(String(val)===o?" selected":"")+'>'+(o?esc(o):"—")+'</option>';
            }).join("")+'</select></div>';
        }
        if(type === "textarea")
          return '<div><label for="f-'+key+'">'+esc(label)+'</label>'+
            '<textarea id="f-'+key+'" name="'+key+'">'+esc(val)+'</textarea></div>';
        return '<div><label for="f-'+key+'">'+esc(label)+'</label>'+
          '<input id="f-'+key+'" name="'+key+'" type="text" value="'+esc(val)+'"></div>';
      }).join("")+'</form></div>'+
      '<div class="dwf">'+
      (rec ? '<button class="btn btn-sm btn-del" data-act="drawerdel">Delete</button>' : '')+
      '<span class="abspacer"></span>'+
      '<button class="btn btn-sm" data-act="drawerclose">Cancel</button>'+
      '<button class="btn btn-sm btn-edit" data-act="drawersave">'+(rec?"Save changes":"Create")+'</button></div>';

    $("#drawer").classList.add("on");
    $("#drawer").setAttribute("aria-hidden","false");
    $("#scrim").classList.add("on");
    var first = $("#drawer").querySelector("input,select,textarea");
    if(first) first.focus();
  };

  S.closeDrawer = function(){
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
      S.toast("Saved");
    }else{
      data.id = S.uid();
      C()[col].unshift(data);
      S.toast("Created");
    }
    S.save();
    S.closeDrawer();
    S.renderAll();
  };

  /* Delete offers an undo instead of asking for confirmation.
     A confirm() dialog blocks the page; an undo does not, and
     it is far less annoying to use. */
  S.delRecord = function(col,id){
    var idx = -1;
    C()[col].forEach(function(r,i){ if(r.id === id) idx = i; });
    if(idx < 0) return;

    S.state.lastDeleted = {col:col, idx:idx, rec:C()[col][idx]};
    C()[col].splice(idx,1);
    S.save();
    S.closeDrawer();
    S.renderAll();

    S.toast("Deleted","Undo",function(){
      var d = S.state.lastDeleted;
      if(!d) return;
      C()[d.col].splice(d.idx, 0, d.rec);
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
     A slot that already holds a photo offers replace or remove
     instead of silently overwriting what is there. */
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
