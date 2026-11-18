# Figma quick guide — Slapping Studs pitch deck

Goal: a moodboard + clickable demo in Figma to show the board, plus a workflow for turning that into sharper prompts for Claude Code. You already have a real design system in the codebase (colors, type, component logic) — the whole point of doing this in Figma first is to lock visual decisions *before* asking Claude Code to build them, so you stop re-litigating color and spacing inside code review.

## 1. File structure

One Figma file, four pages, in this order (Figma renders pages top to bottom in the sidebar, and your manager will scroll through them in order):

1. **Moodboard** — references, not your design.
2. **Foundations** — your actual tokens as reusable Figma styles.
3. **Screens** — the hi-fi mockups.
4. **Prototype** — the same screens wired into a clickable flow.

Keep the moodboard and foundations pages in the file even after the pitch — they're what future-you edits instead of re-deriving colors from screenshots six months from now.

## 2. Moodboard — do this before touching your own colors

The failure mode here is stock-photo athletes on a gradient, which reads as generic sports branding, not this club. Pull references from real places instead:

- Actual SIJHV photos and Twente ice hockey footage (screenshot rink shots, jersey close-ups, bench moments — texture and grain, not polish).
- Editorial sports sites with strong type systems for reference, not colors: The Athletic, ESPN's long-form pages, Bundesliga's club pages. Look at how they use mono/tabular type for stats — that's the same move you already made with IBM Plex Mono.
- Minor/university league sites (KHL youth systems, NCAA hockey programs) for how amateur clubs signal legitimacy without a pro-league budget.

Drop 15–20 images onto the Moodboard page, group by theme (texture/photography, type-in-use, layout precedent), not in a single undifferentiated grid — a grouped board reads as intentional, a flat grid reads as a Pinterest dump.

## 3. Foundations — import your real tokens, don't reinvent them

This is the step that actually pays off later. In Figma:

- **Local variables** (Figma → Local variables, or the swatch icon in the right panel): create a collection called `studs` and add every hex you already shipped — ink `#0C0D0E`, panel `#131518` / `#1B1E22`, bone `#EDEAE1`, gold `#F7C325`, cold steel `#93A9B8`, and cyan `#62C9DE` labeled clearly as "admin-only, never mix with gold." Naming them as variables (not just styles) means you can swap a value once and every frame updates — same idea as your CSS custom properties.
- **Text styles**: Archivo at font-stretch 66%/weight 800 for display, Archivo 100% for body, IBM Plex Mono for every label/year/score/stat. If Figma's font picker doesn't expose variable-font axes directly (it depends on the installed font file), install the specific static instances you're using in code so the weights match exactly — don't eyeball a "close enough" 700 or 900.
- **Grid**: set up an 8px base grid and a 12-column layout grid on your frames now. It's what makes the card-divider technique you already figured out (borders on cards, not a container fill) look intentional instead of accidental.

Fifteen minutes here saves you from a moodboard/demo mismatch that a board member will absolutely notice.

## 4. Screens — build 3 to 5, not the whole site

Pick the screens that carry the pitch: homepage hero + header (both states — expanded and the collapsed circular-mark state, side by side, since that's a real interaction decision worth showing statically before it's animated), the roster page (position-grouped, per your own feedback rule), and one signup/join flow screen.

Practical Figma habits that keep this fast:

- **Auto layout** on every card, row, and nav item — resizing one card resizes the grid instead of you manually nudging things.
- **Components + variants** for anything that repeats (player card, stat row, nav item) so a change propagates instead of requiring you to hunt down six copies.
- Use real content, not lorem ipsum or filler stats — real player names, the real board names you already verified, real scores. Fake placeholder text is the single fastest way to make a deck feel like a template rather than a real product decision.

## 5. Prototype — just enough interactivity to demo the two decisions that need approval

You don't need a fully wired prototype. You need:

- Header scroll behavior: link the expanded-header frame to the collapsed-header frame with a "while scrolling" or simple click trigger and Smart Animate, so the transition reads as motion, not two static screenshots.
- One click-through: homepage → roster → a player page. That's enough to prove the site *works* as a system, not just as pictures.

Present mode (top-right ▶ in Figma) turns this into a full-screen walkthrough — that's what you drive during the pitch itself, not the editor canvas.

## 6. Structuring the actual pitch

Order matters more than polish here: problem/context (what's wrong with the current site) → moodboard (this is the *feeling* we're going for, and why) → foundations (these are now locked decisions, not open questions) → screens → live prototype click-through → what's still placeholder (you already have this list — reuse it verbatim, it shows you're tracking scope honestly rather than hiding gaps).

## 7. Using this to tune Claude Code

This is the actual payoff. Once a screen exists in Figma, your Claude Code prompts stop being "make the header nicer" and become citable:

- Turn on **Dev Mode** (top-right toggle) on any frame. It gives you exact spacing, hex, and font values without you eyeballing a screenshot — copy those straight into a prompt or into a CSS-values note.
- When a Claude Code output diverges from Figma, screenshot both at the same width and say what's different in pixels/values, not adjectives — "the gap between cards is 24px in Figma, looks like 12px here" beats "the spacing feels off."
- Treat the Figma file as the single source of truth for anything visual. If you and Claude Code disagree on a color or spacing value mid-implementation, the answer is "check the variable in Figma," not a fresh judgment call each time — that's what stops the back-and-forth you've hit before on scrim contrast and header behavior.
- For anything Figma can't show (the header's scroll-triggered behavior, the localStorage-per-viewer demo auth logic), keep describing that in prose to Claude Code as you have been — Figma is for the visual contract, not the interaction logic.

## Time budget, if you're doing this in one sitting

Moodboard: 30–40 min. Foundations: 20 min once you're copying values you already have. Screens: 1.5–2 hrs for four screens using components. Prototype wiring: 15 min. That's a half-day, not a multi-day design project — the reason it's fast is that you're not making new decisions, you're formalizing ones you already made in code.
