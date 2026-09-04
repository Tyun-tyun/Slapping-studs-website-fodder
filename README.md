# The Slapping Studs — website

Design proposal and working prototype for a new slappingstuds.nl.
Plain HTML, CSS and JavaScript. No framework, no build step, no dependencies.

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
index.html            all page markup, one file
css/
  tokens.css          colour, type and layout variables — start here
  base.css            reset, type scale, buttons, forms, photo slots
  layout.css          grid, header, bands, hero, footer, breakpoints
  components.css      news, events, timeline, tables, roster, albums, board
  admin.css           the editing layer ("godmode")
js/
  data.js             ALL SITE CONTENT — safe for a board member to edit
  auth.js             roles, permissions, demo accounts
  core.js             state, storage, permission checks, record schema
  views.js            every render function
  admin.js            inline editing, admin console, drawer, undo
  app.js              router, header behaviour, click handling, boot
assets/photos/        drop real photographs here
```

Load order is deliberate. `tokens.css` must come first; `js/app.js` must come
last. `index.html` documents both.

## Where to change things

| You want to change | Open |
|---|---|
| A colour anywhere on the site | `css/tokens.css` |
| Headline sizes, the type scale | `css/base.css` |
| News, events, players, games, board, gear, rules | `js/data.js` |
| Who is allowed to do what | `js/auth.js` |
| How the header hides and reappears | `js/app.js`, `bindHeader()` |
| A new content collection | `js/core.js` schema, then a renderer in `js/views.js` |
| Which sub-menu item goes where | `renderNav()` in `js/views.js` |

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

## Before this can go live

- [ ] Replace the placeholder logo in `index.html` with the real club badge as `assets/logo.svg`
- [ ] Real photographs (see `assets/photos/README.md`)
- [ ] Real history: the 1990s / 2010 / 2018 timeline markers are invented
- [ ] Resolve the championship date — U-Today reports a first title in 42 years (≈2024), the club's own news dates the 5th division title to March 2026
- [ ] Per-player statistics: the roster is real, the scoring figures are generated
- [ ] Past results: `pastgames` in `js/data.js` is placeholder structure only
- [ ] A mobile menu — `nav` is currently hidden below 980 px (`css/layout.css`)
- [ ] A back end for accounts, the gallery, and the contact form
- [ ] Remove every `.note` block; they are notes to the client, not site content

## Content sources

The roster (names, numbers, positions, squads), the board and the rink address
are the club's own published data. Club facts are taken from
[slappingstuds.nl](https://slappingstuds.nl) and
[U-Today](https://www.utoday.nl/united/74076/the-slapping-studs-on-and-off-the-ice-a-close-knit-group).
Anything not from those two is marked as placeholder, on the page and in
`js/data.js`.
