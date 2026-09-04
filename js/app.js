/* ============================================================
   app.js — router, header behaviour, the single delegated
   click handler, and boot. Loads last.
   ============================================================ */

(function(S){
  "use strict";
  var $ = S.$, $$ = S.$$;

  /* ---------------- routing ---------------------------------
     Hash routing keeps the whole site in one file so it can be
     opened by double-clicking index.html, with no server and
     no build step. When this becomes a real site with a back
     end, each id below becomes its own URL.                    */
  var PAGES = ["home","history","players","games","pastgames","news","archive","about",
               "training","hockey","pictures","contact","join","signin","admin"];

  /* which top-level nav item lights up for each page */
  var NAVMAP = {home:"home", news:"news", archive:"news",
                players:"team", about:"team", training:"team", history:"team",
                games:"games", pastgames:"games", hockey:"hockey", pictures:"pictures",
                contact:"contact", join:"contact", admin:"admin"};

  /* A hash is #/page or #/page/section. The second segment is a
     section on that page (Hockey, Contact) or a filter it sets
     (Pictures). Without this the dropdowns are decoration. */
  function parseHash(){
    var raw = (location.hash || "#/home").replace(/^#\//,"");
    var bits = raw.split("/");
    return {page: bits[0] || "home", section: bits[1] || ""};
  }

  /* Scroll a section under the header rather than under the top
     of the window — the fixed bar is 74px tall. */
  function scrollToSection(name){
    var el = document.querySelector('[data-sec="'+name+'"]');
    if(!el) return;
    var y = el.getBoundingClientRect().top + window.pageYOffset - 96;
    window.scrollTo({top: y < 0 ? 0 : y, behavior: "smooth"});
  }

  S.markNav = function(){
    var id = parseHash().page;
    $$(".navitem").forEach(function(n){
      n.classList.toggle("active", n.dataset.nav === NAVMAP[id]);
    });
  };

  S.route = function(){
    var h = parseHash(), id = h.page, section = h.section;
    if(PAGES.indexOf(id) === -1) id = "home";
    if(id === "admin" && !S.isAdmin()) id = "signin";   // gate the console

    /* Pictures uses its second segment as an album filter, and
       leaving the page closes whatever album was open. */
    if(id === "pictures"){
      var cats = ["games","tournaments","promo","coach"];
      S.state.picFilter = cats.indexOf(section) > -1 ? section : "all";
      S.state.openAlbum = null;
      S.renderAlbums();
    }else if(S.state.openAlbum){
      S.state.openAlbum = null;
      S.renderAlbums();
    }

    PAGES.forEach(function(p){
      var el = document.getElementById("p-"+p);
      if(el) el.classList.toggle("on", p === id);
    });

    S.markNav();
    S.layoutTimeline();

    if(section && id !== "pictures"){
      window.scrollTo(0,0);
      setHeader(0);
      /* wait for the section to be laid out before measuring it */
      requestAnimationFrame(function(){ scrollToSection(section); });
    }else{
      window.scrollTo(0,0);
      setHeader(0);
    }
  };

  /* ---------------- header ----------------------------------
     Deliberately does NOT reappear on scroll up. The only ways
     back are scrolling to the top or moving the cursor into the
     top 78px of the window. */
  var hdr, peeking = false;

  function setHeader(y){
    var collapsed = y > 90;
    hdr.classList.toggle("collapsed", collapsed);
    if(!collapsed) hdr.classList.remove("peek");
  }

  function bindHeader(){
    hdr = $("#hdr");
    window.addEventListener("scroll", function(){ setHeader(window.scrollY); }, {passive:true});

    document.addEventListener("mousemove", function(e){
      if(e.clientY < 78){
        if(!peeking){ peeking = true; hdr.classList.add("peek"); }
      }else if(peeking && e.clientY > 190 && !hdr.contains(e.target)){
        peeking = false; hdr.classList.remove("peek");
      }
    });

    hdr.addEventListener("mouseleave", function(){
      if(window.scrollY > 90){ peeking = false; hdr.classList.remove("peek"); }
    });
    /* keyboard users get the bar back when they tab into it */
    hdr.addEventListener("focusin",  function(){ hdr.classList.add("peek"); });
    hdr.addEventListener("focusout", function(){ if(window.scrollY > 90) hdr.classList.remove("peek"); });
  }

  /* ---------------- one click handler -----------------------
     Everything interactive is declared with a data- attribute
     and handled here. Renderers never bind their own listeners,
     so re-rendering can never leak or duplicate a handler.     */
  function bindClicks(){
    document.addEventListener("click", function(e){
      var t = e.target.closest(
        "[data-login],[data-act],[data-add],[data-edit],[data-del],[data-dup],"+
        "[data-tab],[data-filt],[data-revert],[data-pgseason],[data-piccat],"+
        "[data-album],[data-upload],[data-delphoto],[data-photoslot],"+
        "[data-photoreplace],[data-photoremove],#acctbtn,#scrim");

      if(!t){
        var menu = $("#acctmenu");
        if(menu && !e.target.closest("#acctmenu")) menu.classList.remove("on");
        if(!e.target.closest(".photomenu")) S.closePhotoMenu();
        return;
      }
      /* the photo button sits inside a .ph that may itself be an
         album tile — do not let the click open the album too */
      if(t.dataset && (t.dataset.photoslot || t.dataset.delphoto || t.dataset.upload)) e.stopPropagation();
      var d = t.dataset || {};

      if(t.id === "acctbtn"){ $("#acctmenu").classList.toggle("on"); return; }
      if(t.id === "scrim"){ S.closeDrawer(); return; }

      switch(d.act){
        case "drawerclose": S.closeDrawer(); return;
        case "drawersave":  e.preventDefault(); S.saveDrawer(); return;
        case "drawerdel":
          if(S.drawerContext()) S.delRecord(S.drawerContext().col, S.drawerContext().id);
          return;
        case "signout": S.signOut(); return;
        case "console":  location.hash = "#/admin"; S.route(); return;
        case "reset":    S.reset(); S.renderAll(); S.toast("Demo content reset"); return;
        case "export":   S.exportJSON(); return;
        case "joinagain":
          S.state.joinSent = null; S.renderJoin();
          window.scrollTo(0,0);
          return;
        case "newrecord":
          S.openDrawer(S.schema[S.state.adTab] ? S.state.adTab : "news", null);
          return;
        case "inlineedit":
          S.setEditing(true);
          location.hash = "#/home"; S.route();
          S.toast("Inline editing on — click any headline or paragraph");
          return;
        case "toggleedit":
          S.setEditing(!S.state.editing);
          $("#acctmenu").classList.remove("on");
          S.toast(S.state.editing ? "Inline editing on" : "Inline editing off");
          return;
      }

      if(d.login){ S.signIn(d.login); $("#acctmenu").classList.remove("on"); return; }

      /* Coaches may add players; everything else is admin-only.
         This mirrors the PERMS map in auth.js. */
      if(d.add){
        if(!S.isAdmin() && !(d.add === "players" && S.can("roster.edit"))){
          S.toast("Admins only"); return;
        }
        S.openDrawer(d.add, null); return;
      }
      if(d.edit){ if(!S.isAdmin()) return; var a = d.edit.split(":"); S.openDrawer(a[0], a[1]); return; }
      if(d.del) { if(!S.isAdmin()) return; var b = d.del.split(":");  S.delRecord(b[0], b[1]); return; }
      if(d.dup) { if(!S.isAdmin()) return; var c = d.dup.split(":");  S.dupRecord(c[0], c[1]); return; }

      if(d.tab){ S.state.adTab = d.tab; S.renderAdminNav(); S.renderAdminBody(); return; }
      if(d.filt){ S.state.plFilter = d.filt; S.renderPlayers(); S.applyPhotos(); return; }
      if(d.pgseason){ S.state.pgSeason = d.pgseason; S.renderPastGames(); return; }
      if(d.piccat){ location.hash = "#/pictures/" + (d.piccat === "all" ? "" : d.piccat); return; }

      /* open / close an album */
      if("album" in d){
        S.state.openAlbum = d.album || null;
        S.renderAlbums(); S.applyPhotos();
        window.scrollTo(0,0);
        return;
      }

      /* add photos to an album (members, coaches and the board) */
      if(d.upload){
        if(!S.can("album.upload")){ S.toast("Members only"); return; }
        var albumId = d.upload;
        S.pickImage({multiple:true, maxW:1400, onPick:function(urls){
          var album = S.state.content.albums.filter(function(a){ return a.id === albumId; })[0];
          if(!album) return;
          album.photos = (album.photos || []).concat(urls);
          if(!S.getImage("album:"+album.id)) S.setImage("album:"+album.id, urls[0]);
          if(S.save()){
            S.renderAlbums(); S.applyPhotos();
            S.toast(urls.length + (urls.length===1?" photo added":" photos added"));
          }
        }});
        return;
      }

      /* remove one photo from an album */
      if(d.delphoto){
        if(!S.can("album.upload")) return;
        var parts = d.delphoto.split(":"), al = parts[0], idx = Number(parts[1]);
        var alb = S.state.content.albums.filter(function(a){ return a.id === al; })[0];
        if(!alb || !alb.photos) return;
        var removed = alb.photos.splice(idx,1)[0];
        S.save(); S.renderAlbums(); S.applyPhotos();
        S.toast("Photo removed","Undo",function(){
          alb.photos.splice(idx,0,removed);
          S.save(); S.renderAlbums(); S.applyPhotos(); S.toast("Restored");
        });
        return;
      }

      /* set or clear the photo in any slot on the page */
      if(d.photoslot){
        if(!S.isAdmin()){ S.toast("Admins only"); return; }
        var slot = d.photoslot;
        if(S.getImage(slot)){
          S.openPhotoMenu(t, slot);
        }else{
          S.pickImage({maxW:1600, onPick:function(urls){
            if(S.setImage(slot, urls[0])){ S.applyPhotos(); S.toast("Photo set"); }
          }});
        }
        return;
      }
      if(d.photoreplace){
        S.pickImage({maxW:1600, onPick:function(urls){
          if(S.setImage(d.photoreplace, urls[0])){ S.applyPhotos(); S.toast("Photo replaced"); }
        }});
        S.closePhotoMenu();
        return;
      }
      if(d.photoremove){
        var gone = S.getImage(d.photoremove), gslot = d.photoremove;
        S.clearImage(gslot); S.applyPhotos(); S.closePhotoMenu();
        S.toast("Photo removed","Undo",function(){
          S.setImage(gslot,gone); S.applyPhotos(); S.toast("Restored");
        });
        return;
      }
      if(d.revert){
        delete S.state.content.copy[d.revert];
        S.save(); S.renderAll(); S.toast("Reverted to the original text");
        return;
      }
    }, true);
  }

  /* ---------------- page-level forms ------------------------ */
  function bindForms(){
    var signin = $("#signinform");
    if(signin) signin.addEventListener("submit", function(e){
      e.preventDefault();
      var email = $("#si-em").value.trim().toLowerCase();
      var pw = $("#si-pw").value;
      var acc = S.accounts.filter(function(a){ return a.email === email && a.pw === pw; })[0];
      if(acc){ $("#si-msg").textContent = ""; S.signIn(acc.role); }
      else $("#si-msg").textContent = "No account matches that e-mail and password.";
    });

    /* Membership application. In the demo it is filed straight
       into the sign-ups collection, which is what the board sees
       in the admin console. On a real site this would POST. */
    var join = $("#joinformel");
    if(join) join.addEventListener("submit", function(e){
      e.preventDefault();
      var rec = {
        id: S.uid(),
        name:       $("#j-name").value.trim(),
        email:      $("#j-email").value.trim(),
        study:      $("#j-study").value,
        experience: $("#j-exp").value,
        session:    $("#j-session").value,
        note:       $("#j-note").value.trim(),
        date: new Date().toLocaleDateString("en-GB",{day:"2-digit",month:"long",year:"numeric"}),
        status: "new"
      };
      if(!rec.name || !rec.email){ S.toast("Name and e-mail are required"); return; }
      S.state.content.signups.unshift(rec);
      S.save();
      S.state.joinSent = rec;
      S.renderJoin();
      S.renderAdminNav();
      join.reset();
      window.scrollTo(0,0);
      S.toast("Sent to the board");
    });

    /* The contact form shows which board member will receive it
       before you send. Order matches the <option> list. */
    var subject = $("#sub");
    if(subject) subject.addEventListener("change", function(){
      var inbox = ["voorzitter","penningmeester","wedstrijdsecretaris",
                   "voorzitter","webcom","secretaris"][this.selectedIndex] || "bestuur";
      $("#routeline").textContent = "Routed to: " + inbox + "@slappingstuds.nl";
    });
  }

  /* ---------------- boot ------------------------------------ */
  function boot(){
    S.state.content = S.load();
    S.state.session = S.loadSession();

    /* Forward-compatibility: a browser holding an older store
       still gets any collection added to data.js since. */
    if(!S.state.content.copy) S.state.content.copy = {};
    Object.keys(S.seed).forEach(function(k){
      if(!S.state.content[k]) S.state.content[k] = S.clone(S.seed[k]);
    });

    S.captureDefaults();
    S.bindInlineEditing();
    bindHeader();
    bindClicks();
    bindForms();

    S.renderAll();
    S.route();

    window.addEventListener("hashchange", S.route);
    window.addEventListener("resize", S.layoutTimeline);
    /* Webfonts change text width, which moves the timeline nodes */
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(S.layoutTimeline);
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

})(window.Studs);
