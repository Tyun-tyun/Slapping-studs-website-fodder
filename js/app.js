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
  var PAGES = ["home","history","players","games","news","archive","about",
               "training","hockey","pictures","contact","signin","admin"];

  /* which top-level nav item lights up for each page */
  var NAVMAP = {home:"home", news:"news", archive:"news",
                players:"team", about:"team", training:"team", history:"team",
                games:"games", hockey:"hockey", pictures:"pictures",
                contact:"contact", admin:"admin"};

  S.markNav = function(){
    var id = (location.hash || "#/home").replace("#/","");
    $$(".navitem").forEach(function(n){
      n.classList.toggle("active", n.dataset.nav === NAVMAP[id]);
    });
  };

  S.route = function(){
    var id = (location.hash || "#/home").replace("#/","");
    if(PAGES.indexOf(id) === -1) id = "home";
    if(id === "admin" && !S.isAdmin()) id = "signin";   // gate the console
    PAGES.forEach(function(p){
      var el = document.getElementById("p-"+p);
      if(el) el.classList.toggle("on", p === id);
    });
    window.scrollTo(0,0);
    setHeader(0);
    S.markNav();
    S.layoutTimeline();
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
        "[data-tab],[data-filt],[data-revert],#acctbtn,#scrim");

      if(!t){
        var menu = $("#acctmenu");
        if(menu && !e.target.closest("#acctmenu")) menu.classList.remove("on");
        return;
      }
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
      if(d.filt){ S.state.plFilter = d.filt; S.renderPlayers(); return; }
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
