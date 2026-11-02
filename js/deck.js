/* ============================================================
   deck.js - the little that the page skeleton needs from script.

   This file used to run a snap-scrolling slideshow: it built a
   dot rail from the panels, watched which one filled the window,
   kept that panel in the address bar and measured whether any of
   them had to scroll inside itself.

   None of that exists any more. Only the cover fills the screen;
   every section below it is an ordinary block of the page, the
   browser scrolls the document the way it always did, and section
   anchors are plain fragments the browser resolves on its own
   (css/deck.css gives .panel[id] a scroll-margin-top so they stop
   below the fixed header).

   What is genuinely left is one thing CSS cannot do: measure the
   admin bar. It is fixed to the bottom of the window, it appears
   only for a signed-in admin, and its height is not a constant -
   its buttons wrap onto a second line on a narrow window. The
   cover subtracts it so the bar does not cover the strip, and the
   body pads for it so the bar does not cover the footer.

   Load order: after core.js (needs S.$), before app.js.
   ============================================================ */

(function(S){
  "use strict";
  var $ = S.$;

  function syncFurniture(){
    var bar = $("#adminbar");
    /* NOT offsetParent: that is null for every position:fixed
       element whether it is visible or not, which would report the
       bar as hidden and leave the cover a bar-height too tall. The
       measured box is the honest answer - 0 when the bar is
       display:none, its real height when it is shown. */
    var h = bar ? Math.round(bar.getBoundingClientRect().height) : 0;
    document.documentElement.style.setProperty("--adminbar-h", h + "px");
  }

  S.initDeck = function(){
    syncFurniture();

    var bar = $("#adminbar");
    if(!bar) return;

    /* the bar's own height changes when its buttons wrap */
    if(typeof ResizeObserver === "function"){
      new ResizeObserver(syncFurniture).observe(bar);
    }
    /* turning godmode on and off toggles a class on <body> rather
       than resizing anything, so watch that too */
    if(typeof MutationObserver === "function"){
      new MutationObserver(syncFurniture)
        .observe(document.body, {attributes:true, attributeFilter:["class"]});
    }
    window.addEventListener("resize", syncFurniture);
  };

  /* Kept because other code may still ask for a section by id.
     The browser does the scrolling; scroll-margin-top in
     css/deck.css keeps the target clear of the fixed header. */
  S.goToPanel = function(id){
    var el = document.getElementById(id);
    if(el) el.scrollIntoView({block:"start", behavior:"smooth"});
  };

})(window.Studs);
