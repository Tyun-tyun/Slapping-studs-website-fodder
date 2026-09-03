# Photographs

Every image on the site is a `.ph` element. With no photograph it draws a
hatched slot with a caption saying what belongs there, so the design never
pretends to have photography it does not have.

## Adding a photo

Put the file in this folder and add `data-img` to the slot in `index.html`:

```html
<div class="ph" data-img="assets/photos/hero-squad-2026.jpg"></div>
```

`js/views.js` (`applyPhotos`) turns it into a background image and hides the
caption. Nothing else needs changing.

## What each slot needs

| Where | Shape | What it should show |
|---|---|---|
| Homepage hero | wide, ~2400 × 1400 | the full squad on the ice at IJsbaan Twente |
| News post | 4:3, ~800 × 600 | one moment from the story |
| Player card | 3:4, ~600 × 800 | portrait, in gear, plain background |
| Board member | 1:1, ~600 × 600 | head and shoulders |
| History chapter | 4:3, ~1200 × 900 | archive material — old squad photos, jerseys, clippings |
| Album cover | 4:3, ~800 × 600 | the best frame from that album |

## Naming

`section-subject-year.jpg` — lowercase, hyphens, no spaces.

```
hero-squad-2026.jpg
news-stallions-champions-2026.jpg
player-17-forward.jpg
board-chairman.jpg
history-first-squad-1982.jpg
```

## Before uploading

- Resize to roughly twice the display size, no larger. A 6000 px camera file
  makes the page slow for no visible gain.
- Export JPEG at quality 80. Use PNG only for the logo or anything with
  transparency.
- The hero is the one image worth spending real time on. It is the first thing
  anyone sees and it carries the headline over it, so it needs a dark or
  uncluttered left half for the type to sit on.
- Check you have permission to publish photographs of the people in them.
