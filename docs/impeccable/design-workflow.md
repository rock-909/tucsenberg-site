# Showcase Website Design Workflow

> Scope: reusable DWF / Impeccable workflow for this starter.  
> This is a method document, not a finished design brief for one client project.

## 1. Purpose

This workflow helps AI agents and humans improve pages without drifting into random visual changes.

Before changing UI, answer:

> What does this page or component need to help the visitor understand, trust, or do?

If the answer is unclear, do not start with colors, animation, or layout tweaks. First clarify content, page job, and proof.

## 2. Design North Star

The starter design goal is:

> Clear, credible, reusable showcase pages that can be adapted to a real business.

Design is successful when:

- the page purpose is obvious;
- content hierarchy is easy to scan;
- the next action is clear;
- claims are supported by nearby evidence;
- components are reused instead of duplicated;
- the result still works for a different brand after replacing content and tokens.

## 3. Page Job First

Every page should have one primary job.

Common page jobs:

| Page type | Main job |
| --- | --- |
| Home | Establish relevance and route visitors to the right next step |
| Product / service listing | Help visitors compare categories and choose a path |
| Product / service detail | Explain fit, details, proof, and next action |
| About | Build credibility and explain the organization |
| Contact | Make inquiry or contact easy and low-friction |
| Legal / utility | Communicate clearly without visual noise |

If a page cannot explain its job, pause and rewrite the brief.

## 4. Diagnose Before Decorating

Do not assume weak UI is a visual-style problem.

| Symptom | First question |
| --- | --- |
| Page feels generic | Is the content too vague or missing real proof? |
| Page feels noisy | Are there too many competing sections or CTAs? |
| Page feels weak | Is the claim unsupported or the hierarchy flat? |
| Component feels inconsistent | Is it bypassing existing primitives or tokens? |
| Conversion path feels unclear | Is the CTA specific and close to the relevant decision point? |

Only after this diagnosis should agents decide whether to change layout, component composition, tokens, copy, imagery, or motion.

## 5. Default DWF Steps

Use this lightweight sequence for page or component design work:

1. **Goal**: Define the user-visible outcome.
2. **Audience**: Identify who needs the page or component.
3. **Evidence**: List what proof or content must appear.
4. **Structure**: Decide section order and information hierarchy.
5. **Reuse**: Check existing components and Storybook stories.
6. **Token boundary**: Decide whether existing tokens are enough.
7. **Interaction states**: Cover hover, focus, disabled, loading, empty, error, and success where relevant.
8. **Responsive behavior**: Confirm mobile and desktop layout.
9. **Implementation**: Build with existing primitives first.
10. **Verification**: Run targeted tests, Storybook/build checks, and visual review.

## 6. Component Reuse Rule

Before creating a component, check:

1. `src/components/ui/`
2. relevant domain folders under `src/components/`
3. `src/components/sections/`
4. Storybook stories
5. `docs/impeccable/system/COMPONENT-GOVERNANCE.md`

Create a new component only when:

- the concept is genuinely new;
- existing variants do not fit;
- the layer is clear;
- visual and behavioral states are documented;
- story/test needs are considered.

## 7. Storybook Workflow

Storybook is the review surface for component quality.

Use it when:

- a primitive has multiple variants;
- a component is reused across pages;
- visual states matter;
- the owner needs to preview a component without navigating the full site;
- AI may otherwise duplicate or drift the component.

Stories should import real production components. Storybook is not a second implementation.

## 8. Token Workflow

If the design problem is mostly color, spacing, radius, or shadow:

1. Check `src/app/globals.css`.
2. Check `docs/impeccable/system/COLOR-SYSTEM.md`.
3. Prefer changing tokens or variants over patching one component.
4. Do not write raw brand hex values in production UI.
5. If token roles change, update docs and contract tests together.

## 9. Motion Workflow

Motion should clarify state or hierarchy.

Use motion for:

- button and link feedback;
- dialog/sheet/dropdown transitions;
- form success/error feedback;
- subtle section reveal when it improves scanning.

Avoid motion for:

- hiding weak content;
- visual spectacle;
- heavy scroll effects without a real reason;
- repeated effects that compete with reading.

See `docs/impeccable/system/MOTION-PRINCIPLES.md`.

## 10. Output Format for Design Work

When an agent finishes a design task, summarize:

- what changed;
- which components were reused;
- which components were created or extended;
- whether Storybook stories were added or updated;
- whether tokens changed;
- what was verified;
- what remains visually uncertain.

This is especially important because the owner may judge the result visually without reading code.

## 11. Stop Lines

Stop and clarify before implementing when:

- the page goal is unclear;
- the requested style conflicts with existing token/component rules;
- the change would create a new component that may duplicate an existing one;
- the design depends on missing real business proof;
- the change would require new dependencies or a new design system layer.

## 12. Starter Boundary

This starter may include example pages and example content, but the workflow must stay business-neutral.

Do not bake one industry's assumptions into shared rules. If a real project needs industry-specific proof, imagery, claims, or conversion steps, add those in the derived project context, not in starter-wide governance.
