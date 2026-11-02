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
    stats:     "stats.html",
    about:     "about.html",
    training:  "training.html",
    history:   "history.html",
    games:     "games.html",
    competitions: "competitions.html",
    pastgames: "past-games.html",
    hockey:    "hockey.html",
    pictures:  "pictures.html",
    contact:   "contact.html",
    join:      "join.html",
    signin:    "sign-in.html",
    post:      "post.html",
    game:      "game.html",
    admin:     "admin.html",
    account:   "account.html"
  };

  /* Pages a visitor may not simply open. app.js checks this on
     boot and sends anyone who fails to the sign-in page.

     This is convenience, not security — the check runs in the
     browser. On the real site the server refuses the request
     and this map becomes the list of routes it guards. */
  S.GATED = {
    admin: function(){ return S.can("console.use"); },
    /* the member area: anyone signed in */
    account: function(){ return S.can("account.view"); }
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
  /* One document, one view per area of the member area -
     account.html?v=games. Overview has no parameter. */
  S.accountUrl = function(view, id){
    return S.PAGES.account + (view && view !== "overview" ? "?v=" + encodeURIComponent(view) + (id ? "&id=" + encodeURIComponent(id) : "") : "");
  };

  S.picturesUrl = function(cat, album){
    var q = [];
    if(cat && cat !== "all") q.push("cat=" + encodeURIComponent(cat));
    if(album) q.push("album=" + encodeURIComponent(album));
    return S.PAGES.pictures + (q.length ? "?" + q.join("&") : "");
  };

  /* ---------- the not-found guard ---------------------------
     The site is opened straight from disk as often as it is
     served, so there is no server to answer a bad URL with a 404
     page. This does it in the browser instead: every internal
     link is checked against the pages that actually exist, and
     anything else is sent to 404.html.

     BUILT is the list of documents on disk. It is deliberately
     NOT derived from S.PAGES: PAGES says where a page WOULD live,
     and a link to a page that is only planned should land on the
     404, not on a broken file. Add a filename here when you build
     that page — that is the one place to remember. */
  S.NOTFOUND = "404.html";

  S.BUILT = [
    "index.html","about.html","history.html","players.html","stats.html","training.html",
    "games.html","competitions.html","past-games.html","news.html",
    "archive.html","hockey.html",
    "pictures.html","contact.html","join.html","sign-in.html","admin.html",
    "post.html","game.html","account.html",
    "404.html"
  ];

  /* True when a raw href is an internal link to a document that
     does not exist. Anything this returns false for is left
     completely alone — the browser handles it as normal. */
  S.isDeadLink = function(href){
    if(!href) return false;
    /* leave schemes (http, mailto, tel), protocol-relative URLs
       and pure in-page fragments alone */
    if(/^[a-z][a-z0-9+.-]*:/i.test(href)) return false;
    if(href.indexOf("//") === 0) return false;
    if(href.charAt(0) === "#") return false;

    /* strip the query and the fragment: pictures.html?cat=games#x
       is a link to pictures.html */
    var path = href.split("#")[0].split("?")[0];
    if(!path) return false;                    // "?cat=x" — this page
    path = path.replace(/^\.\//, "");          // "./about.html"
    if(!path || path === ".") return false;

    return S.BUILT.indexOf(path) === -1;
  };

  /* One document renders every news post, picked by id in the
     query string - post.html?id=n1. The alternative was a file
     per post, which would mean the site could not show a post the
     board wrote in the browser: the admin console can add a news
     record, and it has to become readable without anyone touching
     the filesystem. Same reasoning as picturesUrl above. */
  S.postUrl = function(id){
    return S.PAGES.post + (id ? "?id=" + encodeURIComponent(id) : "");
  };

  /* Same pattern for a game sheet - game.html?id=g6. The id is
     the GAME's id (games[] or pastgames[]); the sheet itself is
     the gamesheets record whose .game points at it, plus its
     goals, penalties and lineup rows in their own collections.
     One document, every sheet the board ever publishes. */
  S.gameUrl = function(id){
    return S.PAGES.game + (id ? "?id=" + encodeURIComponent(id) : "");
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
