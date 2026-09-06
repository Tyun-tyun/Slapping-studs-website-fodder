# The Slapping Studs — website

Design proposal and working prototype for a new slappingstuds.nl.
Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies.

Every page is its own document. There is no client-side router and no hash
URLs: `players.html` is a real page that a server can render, cache and index,
and that a template engine can take over one file at a time.

## Page status

Where each page stands as of September 2026. The shared header, footer,
CSS and JS are stable everywhere; this table is about the `<main>` of
each file.

| Page | Status | Notes |
|---|---|---|
| `index.html` | **Production-ready** | Real copy, real hero photo, working sign-up band. This is the reference for the rest. |
| `history.html` | **Near-ready** | Two parts: a dark, full-bleed timeline that pins to the viewport and pans horizontally as you scroll (photo + punched year per moment, parallax ghost layer, progress bar), then a paper "book" section with a sticky numbered chapter nav that tracks the scroll. Both are `data.js` collections (`timeline`, `chapters`) editable from the admin drawer; chapter photos have three placement layouts. Still needs the invented 1990s/2000s/2018 moments and chapters 02/03/05 replaced with real club history, and real archive photos in the slots. |
| everything else | **Raw — needs rework** | `news` `archive` `players` `about` `training` `games` `past-games` `hockey` `pictures` `contact` `join` `sign-in` `admin` `404`. Structure and shared chrome are in place; content, layout polish and (where flagged) real data are not. Placeholder sections carry a visible `.note` block saying so. |

## Running it

Double-click `index.html`. That is the whole procedure.

For a local server (needed only if you later add `fetch`-based features):

```
python3 -m http.server 8000
```

then open <http://localhost:8000>.

The only external request the site makes is to Google Fonts. Offline, the
display type falls back to Arial Narrow and everything still works — it just
looks wider than it should.

## Structure

```
index.html            home
news.html             latest posts
archive.html          news archive by season
players.html          rosters and coaching staff
about.html            about the association
training.html         training times and how it works
history.html          1982 → today
games.html            this season's fixtures + competitions
past-games.html       results archive
hockey.html           what the game is, gear, rules
pictures.html         photo albums (gated)
contact.html          board, contact form, where to find us
join.html             sign-up for an introduction practice
sign-in.html          accounts and the permission matrix
admin.html            the admin console (gated)
404.html              not found

css/
  tokens.css          colour, type and layout variables — start here
  base.css            reset, type scale, buttons, forms, photo slots
  layout.css          grid, header, bands, hero, footer, breakpoints
  components.css      news, events, timeline, history chapters, tables, roster, albums, board
  admin.css           the editing layer ("godmode")
js/
  data.js             ALL SITE CONTENT — safe for a board member to edit
  auth.js             roles, permissions, demo accounts
  routes.js           page key -> URL, and which pages are gated
  core.js             state, storage, permission checks, record schema
  views.js            every render function
  admin.js            inline editing, admin console, drawer, undo
  app.js              page setup, header behaviour, click handling, boot
assets/photos/        drop real photographs here
```

Load order is deliberate. `tokens.css` must come first; `js/app.js` must come
last. Every page documents both in its `<head>` and before `</body>`.

### What is shared between pages

Three blocks are byte-identical in all sixteen files, each fenced by a comment:

```
<!-- ===== SHARED HEAD ===== -->      … everything but title, description,
                                        robots and the two body attributes
<!-- ===== SHARED HEADER ===== -->    … gridlines, hotzone, header, peek hint
<!-- ===== SHARED FOOTER ===== -->    … footer, admin layer, script tags
```

They are duplicated rather than assembled, because the whole point of this
prototype is that it has no build step. They are the natural seams for a
layout template: lift the three blocks into one, and each page file becomes
just the contents of its `<main>` plus four variables.

The header's navigation is *not* in that markup — it is rendered by
`renderNav()` in `js/views.js`, because the Drafts, Attendance and Admin items
depend on who is signed in.

### How a page identifies itself

```html
<body data-page="players" data-nav="team">
```

`data-page` is the key in `Studs.PAGES` (`js/routes.js`) and tells the scripts
which document they are on. `data-nav` is which top-level nav item lights up.

## URLs

`js/routes.js` is the only file that knows what a page's address is. Nothing
else writes a page URL by hand — links in markup are plain relative hrefs, and
links built in JavaScript go through `Studs.url()`.

```js
Studs.url("players")            // "players.html"
Studs.url("hockey", "gear")     // "hockey.html#gear"
Studs.picturesUrl("tournaments")// "pictures.html?cat=tournaments"
```

Relative, not root-relative, so the site still opens by double-click. To move
to clean URLs, change the values in `PAGES` and rename the files:

```js
home: "/",  players: "/players/",  pastgames: "/games/past/"
```

Two kinds of second segment survive from the old hash routes:

- **Section anchors** are plain fragments — `hockey.html#gear`,
  `contact.html#find`, `games.html#competitions`. The target is the `id` on a
  `.band`, and `css/layout.css` gives those a `scroll-margin-top` so the fixed
  header does not cover the heading.
- **Gallery state** is in the query string — `pictures.html?cat=promo` and
  `pictures.html?album=al1`. Both are read on load and rewritten with
  `history.replaceState` when you filter or open an album, so an album can be
  linked to and survives a reload. These are the only two query parameters the
  site uses.

## Gated pages

`GATED` in `js/routes.js` lists pages a visitor may not simply open; `admin` is
the only one today. `js/app.js` checks it before rendering and sends anyone who
fails to `sign-in.html`.

**This check runs in the browser, so it is convenience, not security.** On the
real site the server refuses the request, and `GATED` becomes the list of
routes it guards.

## Where to change things

| You want to change | Open |
|---|---|
| A colour anywhere on the site | `css/tokens.css` |
| Headline sizes, the type scale | `css/base.css` |
| News, events, players, games, board, gear, rules, history timeline & chapters | `js/data.js` |
| Who is allowed to do what | `js/auth.js` |
| A page's URL, or the URL scheme | `js/routes.js` |
| Which pages require a sign-in | `GATED` in `js/routes.js` |
| How the header hides and reappears | `js/app.js`, `bindHeader()` |
| A new content collection | `js/core.js` schema, then a renderer in `js/views.js` |
| Which sub-menu item goes where | `renderNav()` in `js/views.js` |
| Adding a page | a new file, a key in `PAGES`, a renderer if it has content |

## Design rules worth keeping

**Gold is the club, cyan is the tooling.** `--gold` is the only warm colour on
the site and belongs to the Slapping Studs. `--edit` (cyan) belongs to the
admin layer and appears nowhere else. Mixing them makes the CMS look like part
of the site.

**Mono carries the data.** Every date, score, jersey number, label and
statistic is IBM Plex Mono. The display face is for headlines only. This is why
the tables read as records rather than decoration.

**The header hides on scroll and does not come back on scroll up.** It returns
only at the top of the page or when the cursor enters the top 78 px. This was a
deliberate request, and it is why the admin bar is pinned to the *bottom* of the
window — editing tools cannot live in a bar that disappears.

**Photos are never faked.** Anything without a real photograph renders as a
hatched slot with a caption saying what belongs there. See
`assets/photos/README.md` for how to fill them from the filesystem, and
"Editing pictures" below for doing it from the site.

**Every dropdown item goes somewhere.** Sub-menu links either open another page
or scroll to a section (`#/hockey/gear`, `#/contact/find`) or set a filter
(`#/pictures/tournaments`). A menu that does not move you is worse than no menu,
so if you add an item, give it a real destination and a `data-sec` anchor.

## Renderers and pages

`renderAll()` in `js/views.js` calls every renderer on every page. Each one
opens by looking for the container it writes into and returns if that container
is not in the current document, so the list does not have to be filtered per
page and adding a page cannot forget to call something.

## How content is stored

Content lives in `js/data.js` and is copied into the browser's `localStorage`
on first visit. After that, edits made through the admin interface change only
that person's copy. Nothing is sent anywhere and no visitor sees another
visitor's changes.

This is deliberate for a prototype whose passwords are printed on the sign-in
page: anyone can log in as admin, delete everything, and hit reset. To make an
edit permanent for everyone, use **Admin console → Danger zone → Copy content
as JSON** and paste the result back into `js/data.js`.

## Editing pictures from the site

No code needed. Sign in as admin, turn on **Edit on page**, and hover any photo
slot — hero, news post, player portrait, board portrait, history chapter. A
button appears; pick a file and it is resized and saved. A slot that already has
a photo offers replace or remove instead of overwriting silently.

Album photos work differently, because members need them too: open any album in
**Pictures** and use **Add photos** (multiple files at once). Members, coaches
and the board can all upload; the first photo added becomes the album cover.

Uploads are downscaled on a canvas before they are stored — 1600px for page
slots, 1400px for album photos, JPEG quality 0.78. Full-size camera files would
exhaust the browser's ~5 MB storage in three uploads. Current usage is shown in
**Admin console → Danger zone**, and a failed write says so rather than
pretending it worked.

For photos that should ship with the project rather than live in one browser,
put the file in `assets/photos/` and add `data-img` to the slot instead.

## Accounts

Demo sign-ins, listed on the `#/signin` page:

| Role | E-mail | Password |
|---|---|---|
| Member | `member@slappingstuds.nl` | `rookie` |
| Coach | `coach@slappingstuds.nl` | `bench` |
| Admin | `admin@slappingstuds.nl` | `godmode` |

**This is not security.** Every check runs in the browser and the passwords are
in `js/auth.js`. It exists so the board can agree on the permission model before
anyone builds a back end. When the real site is built, `js/auth.js` becomes the
specification and the checks move server-side.

## Notes for the back end

- **Forms.** The sign-up form (`#joinformel`) appears twice — on `join.html`
  and in the "Getting in" band on `index.html` — with the same ids and the same
  fields, so it wants one endpoint serving both. `contact.html` has a second
  form, `#contactform`. All of them carry `name` attributes on every field and
  a `method="post"` with a placeholder `action`. `js/app.js` intercepts them
  today: a sign-up is filed into the `signups` collection, the contact form
  only previews which inbox it would be routed to. Point the actions at real
  endpoints and drop the handlers.
- **Content.** `js/data.js` is the shape of every collection, and
  `S.schema` in `js/core.js` is the field list the CMS drives itself from.
  **Admin console → Danger zone → Copy content as JSON** exports the live store
  in that shape, which is a usable database seed.
- **Accounts.** `js/auth.js` is the permission specification. Every check goes
  through `Studs.can("capability")`, so moving to a server means keeping the
  capability names and answering them from a session instead.
- **Storage.** Everything currently persists to `localStorage` under
  `studs.content.v2` / `studs.session.v2` (`js/core.js`), including uploaded
  photos as data URLs. That is the layer to replace with a real API.
- **`404.html`** assumes the site is served flat from the web root, which is
  where these files live.

## Before this can go live

- [ ] Replace the placeholder logo in the shared header with the real club badge as `assets/logo.svg`
- [ ] Real photographs (see `assets/photos/README.md`)
- [ ] Real history: the 1990s / 2010 / 2018 timeline markers and history chapters 02, 03 and 05 are invented structure
- [ ] Resolve the championship date — U-Today reports a first title in 42 years (≈2024), the club's own news dates the 5th division title to March 2026
- [ ] Per-player statistics: the roster is real, the scoring figures are generated
- [ ] Past results: `pastgames` in `js/data.js` is placeholder structure only
- [ ] A mobile menu — `nav` is currently hidden below 980 px (`css/layout.css`)
- [ ] A back end for accounts, the gallery, and the contact form
- [ ] Remove every `.note` block; they are notes to the client, not site content
- [ ] A canonical domain: then add `<link rel="canonical">`, Open Graph tags and a `sitemap.xml`

## Content sources

The roster (names, numbers, positions, squads), the board and the rink address
are the club's own published data. Club facts are taken from
[slappingstuds.nl](https://slappingstuds.nl) and
[U-Today](https://www.utoday.nl/united/74076/the-slapping-studs-on-and-off-the-ice-a-close-knit-group).
Anything not from those two is marked as placeholder, on the page and in
`js/data.js`.
