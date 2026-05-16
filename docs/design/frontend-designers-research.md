# Frontend design research notes

> Purpose: 给 Tucsenberg 后续页面设计和 Claude/Codex 接力用。  
> Status: research note, not the design contract. `DESIGN.md` 仍是当前视觉和组件规则的主真相源。  
> Snapshot: 2026-05-16.

## How to use this document

Read this after:

1. `CLAUDE.md`
2. `PROJECT-BRIEF.md`
3. `DEVELOPMENT-LOG.md`
4. `DESIGN.md`

Use this file as an inspiration map, not as permission to copy another site's style.

For Claude/Codex:

- Do not override `DESIGN.md` with anything in this file.
- Translate every inspiration back into Tucsenberg's current tone: precise, restrained, engineering-led, compatibility-first, procurement-friendly.
- Do not add Framer Motion, GSAP, Lottie, or another animation runtime just because a referenced designer uses one.
- Before adding motion, answer: what user task does this help, how often will the user see it, and what is the reduced-motion fallback?
- Prefer small, CSS/Radix/Tailwind-level improvements over large visual rewrites.

## Project fit filter

Tucsenberg is not a generic brand site. It is a part-number problem solver for aftermarket aeration replacement membranes.

Good borrowed ideas should help one of these outcomes:

- Buyer finds a compatible OEM model faster.
- Buyer understands material choice with less doubt.
- Buyer trusts product fit and procurement terms.
- Buyer can submit RFQ without being tested on technical details.
- The UI feels precise and calm under high information density.

Reject borrowed ideas when they create:

- SaaS gloss.
- Consumer-app playfulness.
- Hero theatrics.
- Heavy motion.
- Large pill-shaped surfaces.
- Dark-mode-first drama.
- Visual effects that compete with part numbers, tables, specs, or RFQ steps.

## Main finding from Emil Kowalski

Primary sources:

- [Emil Kowalski homepage](https://emilkowal.ski/)
- [You Don't Need Animations](https://emilkowal.ski/ui/you-dont-need-animations)
- [Good vs Great Animations](https://emilkowal.ski/ui/good-vs-great-animations)
- [Developing Taste](https://emilkowal.ski/ui/developing-taste)
- [Agents with Taste](https://emilkowal.ski/ui/agents-with-taste)
- [Sonner](https://github.com/emilkowalski/sonner)
- [Vaul](https://github.com/emilkowalski/vaul)

Emil is useful because he turns taste into rules. His best lesson for Tucsenberg is not "add animations"; it is "only add motion when it improves the interface".

### What to borrow

| Principle | Meaning for Tucsenberg |
| --- | --- |
| Purpose before animation | Every motion choice needs a job: feedback, continuity, explanation, or orientation. |
| Frequency beats delight | High-frequency actions should feel instant. Search, keyboard navigation, result highlighting, and RFQ field changes should not feel animated. |
| Fast product UI | Dropdowns, sheets, tooltips, and feedback states should be short. The site should feel responsive, not cinematic. |
| Origin-aware motion | Menus and drawers should appear from a believable source: trigger button, side edge, or prior state. |
| Taste can be documented | Design judgment should become rules in `DESIGN.md`, not remain in chat. |

### Immediate project implications

- Keep the global compatibility search fast. Do not add a decorative opening animation to the command palette.
- Product/OEM search result highlighting should be instant, especially for keyboard navigation.
- Dropdown and popover motion should use the trigger location as transform origin where Radix exposes it.
- Mobile sheet/drawer duration should stay close to the project motion rule, not drift into slow 300-500ms transitions.
- RFQ feedback should be inline and procurement-clear. Toasts can be secondary, not the main status channel.
- The best animation for many industrial lookup flows is no animation.

### Useful future `DESIGN.md` addition

Add a motion decision matrix:

| UI surface | Default motion |
| --- | --- |
| Command palette open/close | Minimal or instant; do not delay input focus. |
| Keyboard-selected row | Instant. |
| Search result refresh | Instant; avoid list stagger. |
| Hover/focus/active | Color, shadow, or small press feedback, 100-150ms. |
| Dropdown/popover | Fade + small translate, 150-180ms, origin-aware. |
| Mobile sheet/drawer | 180-220ms open, faster close. |
| RFQ submit status | Inline state change; spinner only while real work is pending. |
| Reduced motion | Remove transform/scale motion; keep color/focus feedback. |

## Designers and sources worth following

### 1. Rauno Freiberg

Source: [rauno.me](https://rauno.me/)

Best for: interaction details.

Borrow:

- Hover, focus, active, and pressed states.
- Command menu feel.
- Popover and drawer transitions.
- Micro-interaction critique.

Apply to:

- Global compatibility search.
- OEM series tabs.
- Header language menu.
- RFQ field state.
- Mobile navigation drawer.

Avoid:

- Copying Vercel/Linear's full SaaS aesthetic.
- Over-polishing until the site feels like a developer tool instead of an industrial procurement site.

### 2. Steve Schoger and Refactoring UI

Sources:

- [Steve Schoger](https://www.steveschoger.com/)
- [Refactoring UI](https://refactoringui.com/)

Best for: visual hierarchy that developers can implement.

Borrow:

- Spacing and grouping.
- Form layout.
- Cards and panels.
- Border, shadow, and gray-scale discipline.
- Making a page look cleaner without inventing a new brand style.

Apply to:

- `/quote`
- `/compatible/`
- product cards
- specification tables
- quality and procurement pages

Avoid:

- SaaS dashboard defaults.
- Too much rounding and shadow.
- Generic "nice card grid" layouts when a table or lookup panel is clearer.

### 3. Josh W. Comeau

Source: [joshwcomeau.com](https://www.joshwcomeau.com/)

Best for: CSS mental models and explaining complex web behavior.

Borrow:

- Clear technical explanation.
- Interactive examples that teach one concept at a time.
- CSS layout thinking.
- Friendly but precise article structure.

Apply to:

- `/materials/tpu-vs-epdm`
- `/guides/identify-your-membrane`
- material decision support
- "unknown model" guidance

Avoid:

- Playful personal-site tone.
- Decorative whimsical motion.
- Making industrial content feel like a frontend tutorial.

### 4. Val Head

Source: [valhead.com](https://valhead.com/)

Best for: motion systems and reduced-motion thinking.

Borrow:

- Motion guidelines.
- Accessibility-aware animation rules.
- Reduced-motion fallback discipline.
- Animation as a system, not per-component improvisation.

Apply to:

- Motion section in `DESIGN.md`.
- Dropdown/sheet/tooltip durations.
- Loading and skeleton boundaries.
- Component governance checks for motion-heavy changes.

Avoid:

- Treating motion as the main visual identity.

### 5. GitHub Primer and Diana Mounter

Sources:

- [Primer](https://primer.style/)
- [Primer design guidelines](https://primer.github.io/design/)

Best for: dense, tool-like interfaces with status and state.

Borrow:

- Status badges.
- Tables.
- Forms.
- Empty states.
- Navigation under high information density.
- Accessibility and implementation discipline.

Apply to:

- Compatibility search result rows.
- OEM model lists.
- Fit confidence and required checks.
- Product specs.
- Part-number-heavy pages.

Avoid:

- Making Tucsenberg look like GitHub.
- Overloading pages with developer-product conventions.

### 6. Brad Frost

Sources:

- [bradfrost.com](https://bradfrost.com/)
- [Atomic Design](https://atomicdesign.bradfrost.com/)

Best for: component and pattern system thinking.

Borrow:

- Build pages first, then extract repeated patterns.
- Name reusable structures clearly.
- Separate one-off page composition from actual reusable components.

Apply to:

- `src/components/ui/*`
- spec tables
- product cards
- compatibility rows
- RFQ form sections
- FAQ blocks

Avoid:

- Premature abstraction.
- Turning every page section into a generic component before Step 5 content stabilizes.

### 7. Dan Mall

Sources:

- [danmall.com](https://danmall.com/)
- [Design System University](https://designsystem.university/about)

Best for: practical design system adoption.

Borrow:

- Design systems should grow from real product work.
- Components are only useful when they help delivery.
- Governance should not become process theater.

Apply to:

- Deciding what Step 5 patterns deserve reusable components.
- Keeping `DESIGN.md` short enough to use.
- Distinguishing page-specific decisions from system rules.

Avoid:

- Creating documentation that is too broad for the current solo-operator workflow.

### 8. Jina Anne

Source: [jina.me](https://www.jina.me/)

Best for: design tokens and system language.

Borrow:

- Token-based color, spacing, and typography thinking.
- Naming that makes design decisions portable.
- Keeping visual decisions out of one-off components.

Apply to:

- `src/app/globals.css`
- `DESIGN.md`
- UI wrappers
- status colors
- part-number typography

Avoid:

- Token proliferation.
- Creating names that are elegant but not used by real components.

### 9. Karri Saarinen and Linear

Sources:

- [karrisaarinen.com](https://karrisaarinen.com/)
- [Linear](https://linear.app/)

Best for: calm, high-quality product UI.

Borrow:

- Clarity.
- Tight information hierarchy.
- Fast task completion.
- Interface restraint.
- Trust through details rather than marketing decoration.

Apply to:

- Header and search rhythm.
- RFQ flow.
- Context ribbons.
- Compatibility page structure.

Avoid:

- Dark-mode-first presentation.
- Startup-tool gloss.
- Making an industrial site look like product management software.

### 10. shadcn

Sources:

- [shadcn.com](https://shadcn.com/)
- [shadcn/ui](https://ui.shadcn.com/)

Best for: own-your-components frontend practice.

Borrow:

- Radix + Tailwind composition.
- Copy-and-own component philosophy.
- Component registry thinking.
- Avoiding opaque UI package dependency.

Apply to:

- `src/components/ui/*`
- wrapper boundaries around Radix primitives
- future reusable blocks

Avoid:

- Default shadcn visual style.
- Letting generic black/white SaaS UI override Tucsenberg's Engineering Navy + Process Teal system.

### 11. Sarah Drasner

Source: [sarah.dev](https://sarah.dev/writing/)

Best for: SVG, animation, and technical visual explanation.

Borrow:

- Technical illustration ideas.
- SVG as explanatory asset.
- Showing a process visually.

Apply to:

- membrane structure diagrams
- material comparison diagrams
- installation or identification guides
- compatibility diagrams

Avoid:

- Colorful personal-site energy.
- Decorative SVG animation that does not help buyer understanding.

### 12. Una Kravets

Sources:

- [una.im](https://una.im/)
- [Una Kravets about](https://una.github.io/about/)

Best for: modern CSS and web platform thinking.

Borrow:

- Layout discipline.
- Browser-native solutions.
- Responsive design with less JavaScript.
- Accessibility-aware styling.

Apply to:

- responsive tables/cards
- container-level layout decisions
- form layout
- CSS-only state and layout improvements

Avoid:

- Using new CSS features where support, maintainability, or team familiarity is weak.

### 13. Maxime Heckel

Sources:

- [maximeheckel.com](https://maximeheckel.com/)
- [blog.maximeheckel.com](https://blog.maximeheckel.com/)

Best for: interactive technical articles.

Borrow:

- Interactive explanation patterns.
- Visual breakdown of technical systems.
- High-quality code-backed demos.

Apply to:

- future material selector explanations
- airflow or slit behavior explanations
- compatibility matching education

Avoid:

- 3D, shaders, heavy animation, or Motion runtime as a default dependency.

### 14. Maggie Appleton

Source: [maggieappleton.com](https://maggieappleton.com/)

Best for: visual essays and conceptual diagrams.

Borrow:

- Diagrams that make abstract ideas understandable.
- Visual framing for long-form content.
- Explaining complex systems without sounding like a manual.

Apply to:

- `/guides/identify-your-membrane`
- `/materials/tpu-vs-epdm`
- `/quality`
- procurement decision education

Avoid:

- Hand-drawn personal knowledge-base style if it weakens engineering credibility.

### 15. Bret Victor and Nicky Case

Sources:

- [Bret Victor](https://worrydream.com/)
- [Explorable Explanations](https://worrydream.com/ExplorableExplanations/)
- [Nicky Case](https://ncase.me/)

Best for: explorable explanations.

Borrow:

- Interfaces that help users reason, not just read.
- Adjustable inputs with immediate feedback.
- Educational interaction for complex decisions.

Apply later to:

- material selector
- fit confidence explanation
- unknown-model guidance
- RFQ helper flows

Avoid for Phase 1:

- Full interactive simulators.
- Anything that delays getting the core static pages shipped.

### 16. Mary Lou and Codrops

Source: [Codrops GitHub](https://github.com/codrops)

Best for: visual experiment inspiration.

Borrow:

- Occasional CSS pattern references.
- Hover and transition ideas after filtering them through Tucsenberg's tone.

Apply sparingly to:

- small UI details
- prototype-only experiments

Avoid:

- Production use of flashy demos.
- Page transitions, creative effects, or interaction patterns that feel like a portfolio site.

## Recommended learning order

### If the goal is to improve current Step 5 pages

1. Steve Schoger / Refactoring UI
2. GitHub Primer
3. Rauno Freiberg
4. Josh W. Comeau

Expected output:

- cleaner RFQ form
- stronger compatibility search result layout
- better product and spec hierarchy
- less generic card-grid feel

### If the goal is to strengthen the design system

1. Brad Frost
2. Dan Mall
3. Jina Anne
4. shadcn

Expected output:

- fewer one-off components
- better token discipline
- clearer reusable patterns
- less drift between pages

### If the goal is to improve educational content

1. Josh W. Comeau
2. Maggie Appleton
3. Bret Victor
4. Nicky Case

Expected output:

- better material comparison page
- better membrane identification guide
- clearer diagrams
- future-ready decision support tools

### If the goal is to formalize motion

1. Emil Kowalski
2. Val Head
3. Rauno Freiberg

Expected output:

- motion decision matrix
- reduced-motion contract
- faster dropdown/sheet behavior
- less accidental animation

## Near-term action plan

### A. Document-only improvement

Update `DESIGN.md` with:

- motion decision matrix
- source-of-motion rule for dropdown/popover/drawer
- high-frequency interactions should stay instant
- no new animation runtime by default
- reduced-motion fallback language

### B. Small implementation improvements

Candidate files:

- `src/components/ui/sheet.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/button.tsx`
- `src/components/search/compatibility-search.tsx`

Candidate changes:

- reduce mobile sheet open/close duration
- make dropdown transform origin aware where Radix exposes the variable
- remove transform scale under reduced motion
- keep command palette input focus immediate
- later add keyboard result navigation without animated highlight delay

### C. Step 5 page guidance

When building the next pages, default to:

- tables over decorative cards when specs or compatibility are the main content
- inline status over toast for RFQ and form state
- underline tabs over pill tabs
- mono for SKUs, OEM part numbers, and measurable specs
- visible procurement confidence near CTA points
- no list stagger, hero text reveal, parallax, mouse-following gradients, or decorative loading animations

## What not to do

- Do not add a motion library for this stage.
- Do not copy another designer's visual skin.
- Do not turn Tucsenberg into a Vercel/Linear-style SaaS landing page.
- Do not use Codrops-style effects in production.
- Do not make command/search interactions wait for animation.
- Do not use delight as justification for high-frequency procurement flows.
- Do not create a design-system document that is broader than the project can actually follow.

## One-line guidance for Claude

If a design idea from this document makes the buyer find the right compatible membrane faster, understand material choice better, or submit an RFQ with more confidence, translate it into Tucsenberg's current system. If it mainly makes the page feel stylish, reject it.
