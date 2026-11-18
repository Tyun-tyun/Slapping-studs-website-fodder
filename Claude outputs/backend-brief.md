---
marp: true
title: Slapping Studs — Backend Brief
paginate: true
---

# The Slapping Studs — Backend Brief

**Repo:** `slapping-studs` · plain HTML/CSS/JS, no build step, no dependencies
**Status:** complete front end, 17 pages, zero server
**Your job:** give it a real one

Everything in this deck is grounded in code that already exists.
File and line references are to the current `master`.

Read in order. One page = one task boundary.

---

## 1 · What exists today

| Layer | Files | State |
|---|---|---|
| Pages | 17 `.html` documents | Built, real markup |
| Styling | `css/` — 7 files | Done, do not touch |
| Content | `js/data.js` (29 KB) | 20 collections, seeded |
| Engine | `js/core.js` `views.js` `app.js` `admin.js` `routes.js` `deck.js` | Done |
| Auth | `js/auth.js` | **Demo only — plaintext passwords in the file** |
| Storage | `localStorage` | Per-browser, 5 MB cap, dies on clear-cookies |

The front end is finished. Nothing you build should require rewriting a
renderer in `js/views.js`.

---

## 2 · The job in one sentence

> Replace `localStorage` with a database, replace the browser-side
> permission checks with server-side ones, and make the two forms
> actually send something.

Three concrete swaps:

1. `Studs.load()` / `Studs.save()` → HTTP (`js/core.js:55-71`)
2. `Studs.perms` + `S.GATED` → server-enforced (`js/auth.js:36`, `js/routes.js:53`)
3. `bindForms()` `preventDefault()` handlers → real POSTs (`js/app.js`, bottom)

Everything else in this deck is detail on those three.

---

## 3 · Non-negotiable constraints

- **No build step.** The site is opened from disk as often as it is served.
  Do not introduce a bundler, a framework, or JSX. Vanilla ES5-ish JS only —
  match the existing style.
- **Relative URLs.** `js/routes.js` deliberately uses `index.html`, not `/`.
  If you move to clean URLs, change `S.PAGES` **only** (`routes.js:27`).
- **Record `id` is the contract.** Every record has a unique string `id`
  (`n1`, `pl01`, `sd07`). Renderers, image slots and query strings all key
  off it. Preserve existing ids on migration.
- **`js/data.js` stays** as the seed / fallback. If the API is unreachable
  the site must still render seeded content rather than a blank page.
- **Escape on output.** `Studs.esc()` exists; the only unescaped path is
  `content.copy` (admin-authored HTML). Keep that the only one.

---

## 4 · Stack recommendation

Small club site, ~60 members, low traffic, one board member as the admin.

- **Runtime:** Node 20 + Fastify/Express, or PHP 8 if the host is shared.
- **DB:** PostgreSQL. SQLite is defensible at this size; say so up front if
  you pick it.
- **Files:** local disk + nginx, or S3-compatible object storage.
  **Not** the database.
- **Sessions:** server-side, `HttpOnly` `Secure` `SameSite=Lax` cookie.
  No JWT in `localStorage`.
- **Host:** anything with TLS, a cron slot for backups, and SMTP.

Deliverable is one deployable service plus a static file root.

---

## 5 · Data model — the 20 collections

`js/core.js:209` (`S.schema`) is the authoritative field list. It already
carries labels, types and enum values for every field of every collection.
**Generate your migrations from it. Do not invent fields.**

| Collection | Rows seeded | Notes |
|---|---|---|
| `news` | 5 | `status: published \| draft` |
| `events` | 5 | `kind: home \| away \| ""` |
| `players` | 59 | Real roster — `no:"0"` means unassigned |
| `staff` | 2 | |
| `games` / `pastgames` | 6 / 6 | `outcome: w \| l \| ""` |
| `standings` | 15 | `div` groups; `us:"yes"` marks a Studs squad |
| `stats` | 4 | Hero strip — **exactly four, it is a grid** |

---

## 6 · Data model — the rest

| Collection | Rows | Notes |
|---|---|---|
| `sessions` / `kit` | 3 / 7 | Training page |
| `comps` | 4 | Competitions |
| `albums` | 6 | `vis: public \| member \| coach`, `cat`, `photos[]` |
| `board` | 4 | Real board members + real e-mail addresses |
| `timeline` / `chapters` | 6 / 5 | History page |
| `gear` / `rules` / `steps` | 6 / 6 / 4 | Static explainer content |
| `archive` | 4 | Season index |
| `signups` | 1 | **Written by the public. PII.** |
| `copy` | object | Inline-edit overrides, keyed by `data-ed` |
| `images` | object | Slot → image, keyed `hero`, `news:n1`, `player:pl01` |

`sessions`, `kit`, `pastgames` and most of `standings` are flagged
placeholder in `js/data.js`. The board fills them, not you.

---

## 7 · Ordering matters

Several renderers depend on **array order**, not on a sort column:

- `renderStandings()` writes one card per division **in the order the
  divisions first appear** in the array (`js/views.js:258`). The board
  reorders tables by reordering rows.
- `stats` renders left-to-right as stored.
- `news` and `events` render as stored.
- `saveDrawer()` does `unshift()` — a new record goes to the **top**
  (`js/admin.js`).

**Give every table a `sort_order INTEGER` column** and return rows ordered
by it. Do not return database-default order.

---

## 8 · Media — the biggest single change

Today: images are **base64 data URLs inside the content JSON**, downscaled
in-browser on a canvas to max 1200–1600 px at JPEG 0.78
(`Studs.readImageFile`, `js/core.js:99`). That is why there is a 5 MB
storage ceiling and a "Storage full" toast.

Required:

- `POST /api/images` — multipart, accepts the **original** file.
- Server-side: validate real MIME (magic bytes, not the header), cap at
  ~15 MB, strip EXIF, generate ≥2 sizes (thumb ~600 px, full ~1600 px),
  re-encode to WebP with JPEG fallback.
- Store the **URL**, never the bytes, in the content record.
- Slot keys stay exactly as they are: `hero`, `news:<id>`, `player:<id>`,
  `album:<id>`, `timeline:<id>`, `chapter:<id>:<n>`, `gear:<id>`.

---

## 9 · Auth — the roles

`js/auth.js` is the **specification**, not an implementation. Its own header
says so. Four roles:

| Role | Capabilities |
|---|---|
| `guest` | `view.public` |
| `member` | `+ view.gallery view.calendar view.contacts event.rsvp album.upload` |
| `coach` | `+ view.coachalbums roster.edit stats.publish attendance.mark` |
| `admin` | `*` |

Four capabilities are **declared but have no UI yet**: `event.rsvp`,
`view.contacts`, `stats.publish`, `attendance.mark`. Implement the
permission plumbing for them; the screens come later.

---

## 10 · Auth — what to build

- Real user table: `id`, `email`, `password_hash` (argon2id or bcrypt cost
  ≥12), `role`, `name`, `sub` (e.g. `"Studs 2 · #14"`), `created_at`,
  `last_login`.
- **Delete the three demo accounts and their printed passwords**
  (`js/auth.js:21`) and the credential cards on `sign-in.html`
  (`renderSignin`, `js/views.js:951`) before anything goes public.
- Sign-in: rate-limited (say 5 attempts / 15 min / IP+email), generic
  failure message, session cookie on success.
- No public self-registration. The board creates accounts; `signups` is an
  application queue, not a sign-up.
- Password reset by e-mailed single-use token, 1 hour expiry.

---

## 11 · API — reading content

```
GET /api/content            → the whole store, one object
GET /api/content/:collection
```

`GET /api/content` should return the same shape `js/data.js` exports, so
`Studs.load()` becomes a `fetch` and nothing downstream changes.

**The response must already be filtered for the caller's role.** Do not send
drafts or coach albums to a guest and hide them in CSS.

- Cache-Control on the public read; bust on write.
- ETag / `304` is worth it — this payload is the whole site.
- Unauthenticated callers get the public subset. No 401 on a public read.

---

## 12 · API — writing content

```
POST   /api/content/:collection        → create (server assigns id)
PATCH  /api/content/:collection/:id    → update
DELETE /api/content/:collection/:id    → soft delete
POST   /api/content/:collection/reorder
```

- Validate against `S.schema` — reject unknown fields, enforce every
  `select:a,b,c` as an enum.
- **Soft delete.** `js/admin.js` `delRecord()` offers an Undo toast with no
  confirmation dialog. Keep 30 days, then purge.
- Last-write-wins is acceptable at this scale, but return the updated record
  so the client re-renders from the server's truth.
- Audit log: `who`, `what`, `when`, `before`, `after`. One board member per
  year inherits this console; they will need it.

---

## 13 · API — inline text overrides

`content.copy` is a flat map: `{ "<data-ed key>": "<html string>" }`.
Written on `blur` from a `contenteditable` element (`js/admin.js`,
`bindInlineEditing`). Deleting the override restores the authored default
that lives in the HTML.

```
PUT    /api/copy/:key     body: { html }
DELETE /api/copy/:key     → revert
```

**This is the one field that stores HTML.** Sanitise server-side with an
allow-list (`b i em strong a br p ul ol li`, `href` on `a` restricted to
`http/https/mailto`). Admin-only, but an admin account can be stolen.

---

## 14 · API — the two public forms

**Join** (`join.html`, `#joinformel`) — currently filed straight into
`content.signups` in the browser (`js/app.js`, `bindForms`).

```
POST /api/signups
{ name, email, study, experience, session, note }
→ creates a signups record, status "new"
```

**Contact** (`contact.html`, `#contactform`) — currently does nothing but
show a toast saying so.

```
POST /api/contact
{ name, email, subject, message }
```

Both: honeypot field + timing check + server-side rate limit. No CAPTCHA
unless spam actually arrives.

---

## 15 · Contact routing

`contact.html` shows the reader which board member will receive the message
before they send. The mapping is in `js/app.js` and is **positional** —
it indexes the `<option>` list:

| Subject | Inbox |
|---|---|
| Joining the club | `voorzitter@` |
| Membership and payment | `penningmeester@` |
| A game or a fixture | `wedstrijdsecretaris@` |
| Sponsorship | `voorzitter@` |
| The website | `webcom@` |
| Something else | `secretaris@` |

Move this map server-side and key it by **value, not index** — the current
version silently misroutes if anyone reorders the options.

---

## 16 · E-mail

Transactional only. SPF + DKIM + DMARC on `slappingstuds.nl` or it lands in
spam.

| Trigger | To | Contains |
|---|---|---|
| Contact form | routed board inbox | message, `Reply-To:` sender |
| Join form | `bestuur@` | application + link to the console |
| Join form | applicant | "we got it", what happens next |
| Password reset | user | single-use token link |

`board` records already carry real addresses (`js/data.js`, `board`).
Read them from the DB — do not hardcode. The board changes every year.

---

## 17 · Server-side gating

The browser checks are convenience. Reproduce every one of them on the
server:

| Rule | Front-end reference |
|---|---|
| Drafts are admin-only — **404, not 403** | `js/views.js:50,69,106,133` |
| `admin.html` requires role `admin` | `js/routes.js:53`, `guard()` in `app.js:34` |
| Album `vis:member` → `view.gallery` | `js/views.js:640` |
| Album `vis:coach` → `view.coachalbums` | `js/views.js:642` |
| Album upload → `album.upload` | `js/app.js`, `d.upload` |
| Add player → `roster.edit` or admin | `js/app.js`, `d.add` |
| `signups` readable by admin only | — |

The draft rule is deliberate: an unpublished post must read as *missing*, not
as *refused*. See README, "News".

---

## 18 · Routing and 404

`js/routes.js` currently answers bad URLs **in the browser** because there
is no server: `S.BUILT` lists the documents on disk, `isDeadLink()` tests
against it, one listener in `app.js` redirects to `404.html`.

Once a server exists:

- Serve a real HTTP 404 with `404.html` as the body.
- Keep `isDeadLink` — the site is still opened from disk during development.
- Preserve two query parameters exactly: `post.html?id=n1` and
  `pictures.html?cat=games&album=al1` (`S.postUrl`, `S.picturesUrl`).
- One document renders every news post, on purpose: the board can create a
  post in the console and it becomes readable with no file added to the
  server. Do not "fix" this into a file per post.

---

## 19 · Security checklist

- [ ] No password, key or token in any file under `js/`
- [ ] Passwords hashed argon2id / bcrypt ≥12
- [ ] Session cookie `HttpOnly` `Secure` `SameSite=Lax`, rotated on login
- [ ] CSRF token on every state-changing request
- [ ] CSP header; the only external origin today is Google Fonts
- [ ] Uploads: magic-byte MIME check, size cap, re-encode, served from a
      path that cannot execute
- [ ] `copy` HTML sanitised with an allow-list
- [ ] Rate limits on login, contact, join, upload
- [ ] `signups` is PII: encrypt at rest, define a retention period, let the
      board delete an application permanently (GDPR — the club is in the NL)
- [ ] HTTPS enforced, HSTS

---

## 20 · Front-end integration points

Exactly what you change in the existing JS. Nothing else.

| Function | File | Becomes |
|---|---|---|
| `S.load()` | `core.js:55` | `GET /api/content`, seed as fallback |
| `S.save()` | `core.js:61` | remove — writes go through the API |
| `S.getImage/setImage/clearImage` | `core.js:77-86` | URL lookup / upload / delete |
| `S.readImageFile` | `core.js:99` | keep as a preview only; send the original |
| `S.signIn/signOut` | `core.js:164,180` | `POST /api/session`, `DELETE /api/session` |
| `S.accounts` | `auth.js:21` | delete |
| `S.saveDrawer/delRecord/dupRecord` | `admin.js` | API calls, re-render on response |
| `bindForms()` | `app.js` | real POSTs, keep the thank-you state |
| `S.reset()` | `core.js:150` | delete, or admin-only re-seed |

---

## 21 · Migration

1. Sign in as admin, open the console, **Danger zone → Copy content as
   JSON**. That is `exportJSON()` in `js/admin.js` and it hands you the whole
   store as your seed.
2. Import it preserving every `id` and array position (→ `sort_order`).
3. Extract every data URL in `content.images` and in `albums[].photos` to
   real files; replace with URLs.
4. Re-point `js/data.js` at the same content so the offline fallback matches
   what the API serves.
5. The board's placeholder content (`sessions`, `kit`, `pastgames`, most
   `standings`, `timeline` 1990s–2018, `chapters` 02/03/05) is **theirs to
   fill in the console** — do not invent it and do not block on it.

---

## 22 · Definition of done

- Two browsers on two machines see the same content; an edit in one appears
  in the other after a reload.
- A signed-out visitor cannot retrieve a draft post, a member album or the
  `signups` list by any request, including a direct API call.
- The contact form sends mail to the right board inbox; the join form
  creates a reviewable application and acknowledges the applicant.
- A 4 MB phone photo uploads and renders — no "Storage full".
- No credentials in the repo; `sign-in.html` shows no printed passwords.
- Nightly DB + uploads backup, and a **restore that has been tested once**.
- The site still opens from `file://` with seeded content and no console
  errors.

---

## 23 · Suggested order

| Phase | Scope |
|---|---|
| **1** | DB + schema from `S.schema` · `GET /api/content` · migrate the seed |
| **2** | Auth: users, sessions, real sign-in · delete demo accounts |
| **3** | Write API + server-side gating · console talks to the server |
| **4** | Uploads: files off the JSON, thumbnails, quota gone |
| **5** | Forms + e-mail · rate limits · honeypots |
| **6** | 404, caching, backups, audit log, GDPR retention |

Phases 1–3 are the product. 4–6 are what makes it survive a board handover.

**Open questions for the board, not for you:** who issues member accounts,
how long `signups` are kept, and whether members ever self-register.
