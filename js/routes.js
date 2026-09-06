/* ============================================================
   routes.js — the one place that knows what a page's URL is.

   The prototype was a single document with a hash router
   (#/players). Every page is now its own file, so links are
   real URLs and the browser does the routing. Nothing else in
   the codebase writes a page URL by hand: everything goes
   through Studs.url(), so changing the scheme is a change to
   this file plus the filenames on disk.

   Moving to clean URLs later means editing PAGES to, say:
       home: "/",  players: "/players/",  pastgames: "/games/past/"
   and nothing else.

   Load order: after auth.js, before core.js.
   ============================================================ */

window.Studs = window.Studs || {};

(function(S){
  "use strict";

  /* page key -> URL. The keys are also what each document
     declares in <body data-page="...">, which is how a page
     tells the scripts which page it is. Relative, not
     root-relative, so the site still opens from the filesystem. */
  S.PAGES = {
    home:      "index.html",
    news:      "news.html",
    archive:   "archive.html",
    players:   "players.html",
    about:     "about.html",
    training:  "training.html",
    history:   "history.html",
    games:     "games.html",
    pastgames: "past-games.html",
    hockey:    "hockey.html",
    pictures:  "pictures.html",
    contact:   "contact.html",
    join:      "join.html",
    signin:    "sign-in.html",
    admin:     "admin.html"
  };

  /* Pages a visitor may not simply open. app.js checks this on
     boot and sends anyone who fails to the sign-in page.

     This is convenience, not security — the check runs in the
     browser. On the real site the server refuses the request
     and this map becomes the list of routes it guards. */
  S.GATED = {
    admin: function(){ return S.isAdmin(); }
  };

  /* url("hockey","gear") -> "hockey.html#gear"
     The anchor is a section id in the page's markup. */
  S.url = function(page, anchor){
    var base = S.PAGES[page] || S.PAGES.home;
    return anchor ? base + "#" + anchor : base;
  };

  /* The gallery keeps its section filter and the open album in
     the query string, so both are linkable and both survive a
     reload. These are the only two query parameters the site
     uses; the back end should keep them. */
  S.picturesUrl = function(cat, album){
    var q = [];
    if(cat && cat !== "all") q.push("cat=" + encodeURIComponent(cat));
    if(album) q.push("album=" + encodeURIComponent(album));
    return S.PAGES.pictures + (q.length ? "?" + q.join("&") : "");
  };

  /* Which page is being viewed. */
  S.page = function(){ return document.body.dataset.page || "home"; };

  S.query = function(name){
    try{ return new URLSearchParams(location.search).get(name) || ""; }
    catch(e){ return ""; }
  };

  /* Change the address bar without reloading. Used when a filter
     or an open album changes what is on screen but not which
     document you are on. */
  S.replaceUrl = function(href){
    try{ history.replaceState(null, "", href); }catch(e){}
  };

})(window.Studs);
