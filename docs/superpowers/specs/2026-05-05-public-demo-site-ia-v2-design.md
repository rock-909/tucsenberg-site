# Public Demo Site IA V2 Design

## Decision

The public demo starter site will be redesigned as a **reusable starter product explanation**, not as a fictional client website, a blank template, or a developer-only project page.

The core audience is someone whose project still has no real website and needs a clear path from zero to a public, deployable showcase site foundation.

## Goals

- Make the website understandable to a non-technical visitor within the first few seconds.
- Keep the public navigation small: Home, Products, Blog, About.
- Treat Contact as a quick action, not a main navigation page.
- Rework every public page around a clear job instead of keeping legacy placeholder page copy.
- Keep the starter honest: it is reusable and launch-oriented, but it is not a finished client website.
- Separate the footer theme-switcher bug from the page/content redesign so it can be fixed and verified independently.

## Non-goals

- Do not turn the demo into a service-agency landing page.
- Do not turn the demo into a developer-only starter documentation site.
- Do not pretend the starter is a real client site with real company facts.
- Do not remove the existing `/contact` route.
- Do not hide launch boundaries such as content replacement, real assets, legal details, form routing, and deployment configuration.

## Confirmed information architecture

### Main navigation

The public main navigation contains exactly four items:

1. Home
2. Products
3. Blog
4. About

The following existing or legacy routes must not appear in the primary navigation:

- Capabilities
- How it works
- Custom project support
- Contact

These routes can be retained, redirected, demoted, or reused later, but they are no longer part of the public top-level story.

### Contact entry

Contact is a header action that sits beside the language switcher.

Confirmed behavior:

- The contact action links to the standalone `/contact` page.
- `/contact` remains a real route.
- `/contact` is not shown as a main navigation item.
- The contact entry should read like a quick action, not a fifth primary page.

## Global content posture

The site should say, in plain language:

> This starter helps a project that does not yet have a website start from a reusable, deployable showcase-site foundation.

The tone should be practical and clear:

- It can mention technical credibility where useful.
- It should not lead with framework jargon.
- It should not oversell the starter as a finished business website.
- It should clearly explain what must be replaced before a real launch.

## Page responsibilities

### Home

Home explains the visitor journey from "we do not have a website yet" to "we can start from a public showcase-site foundation."

Recommended structure:

1. Hero: "No website yet? Start with a deployable showcase-site foundation."
2. Problem: no structure, no content plan, no deployment path, no inquiry flow, no multilingual baseline.
3. Answer: the starter provides page structure, replacement surfaces, inquiry paths, and a Cloudflare-ready foundation.
4. Capability preview: page structure, inquiry flow, multilingual content, deployment and traffic visibility.
5. Start path: replace brand, replace content, connect forms, deploy.
6. Final action: view product capabilities or contact.

Home should not become a long technical component showcase. It should explain the path.

### Products

Products explains what the starter includes and why the foundation is credible.

Confirmed direction: **result capabilities plus a technical proof section**.

Recommended structure:

1. Page title: a showcase-site starter covering site structure, content replacement, inquiry flow, and launch foundation.
2. Result capabilities:
   - Showcase-site foundation: Home, Products, Blog, About, Contact, legal pages, navigation, responsive layout.
   - Content replacement surface: brand, pages, product or service entries, SEO, multilingual copy.
   - Inquiry entry: contact page, form flow, basic anti-abuse and lead handling path.
   - Launch path: Cloudflare-recommended deployment, optional compatibility path, traffic visibility foundation.
3. Technical proof:
   - Next.js app foundation.
   - Cloudflare/OpenNext deployment path.
   - Multilingual routing and copy structure.
   - Quality gates and project checks.
   - Security basics for forms and public routes.
   - Owner-facing traffic information surface.
4. Boundary:
   - This is a starter, not a finished client website.
   - Real launch still requires real content, images, contact details, legal copy, secrets, and deployment proof.
5. CTA: learn how to start or contact.

Products can include technical names, but the primary story is what the user gets.

### Blog

Blog is a launch education hub, not a generic news section and not a changelog.

Recommended first version:

- A listing page for 3-4 starter articles.
- Articles should help a non-technical owner understand what must happen before a site can go public.

Initial article topics:

1. What to prepare before launching your first showcase website.
2. A showcase site is more than a homepage: what pages are needed.
3. Why Cloudflare is the recommended deployment path for this starter.
4. How to replace starter brand, content, images, and contact details.

Blog posts can be example content, but they should be useful and aligned with the starter's purpose.

### About

About explains the starter's identity and boundary. It should not read like a fictional company profile.

Recommended structure:

1. Title: a showcase website starter designed for real public launch preparation.
2. Why it exists: many projects do not just lack pages; they lack a complete launch foundation.
3. Who it fits:
   - Projects with no current website.
   - Teams needing a public showcase foundation quickly.
   - Sites needing multilingual content, inquiry flow, and Cloudflare deployment basics.
4. Who it does not fit:
   - Projects with a complete custom brand system already finished.
   - Sites needing complex commerce, accounts, or backend workflows in the first version.
   - Teams looking for a blank visual-only template.
5. Honest boundary:
   - Not an empty shell.
   - Not a finished client website.
   - Real launch needs replacement of business facts, images, legal copy, form routing, secrets, and deployment settings.
6. CTA: view product capabilities or contact.

## Existing content that must be corrected

Current content still contains legacy or placeholder patterns that conflict with the confirmed direction:

- The About page still presents "Example Showcase Company" as if it were the page subject.
- The navigation still includes too many top-level items.
- Contact is still treated like a main page in navigation.
- Blog is present in translations but not yet a real public page.
- Some homepage language still focuses on generic starter proof instead of the "no website yet" journey.
- Product language can be clearer about result capabilities and technical proof.

## Theme switcher bug boundary

The footer theme switcher is a separate bug and should be fixed independently from the IA/content redesign.

Expected behavior:

- The footer theme switcher should be visible and usable without waiting for a long idle delay.
- Selecting light, dark, or system should update the effective theme.
- The fix should have focused regression coverage.

This bug should not be buried inside the broader page rewrite.

## Acceptance criteria

The implementation is successful when:

- The header main navigation shows only Home, Products, Blog, and About.
- Contact is displayed as a header action beside the language switcher and links to `/contact`.
- `/contact` remains reachable as a standalone route.
- Home, Products, Blog, and About each have the page responsibilities described above.
- Blog has a real public route and useful starter-aligned content.
- About no longer reads like a fictional company profile.
- Products includes both result-oriented capabilities and a technical proof section.
- The design remains multilingual: English and Chinese user-facing copy are updated together.
- The footer theme-switcher bug is handled as a separate fix with its own verification.

## Implementation sequencing

Recommended implementation order:

1. Fix the footer theme-switcher bug separately.
2. Update navigation and contact action behavior.
3. Add or wire the Blog route and starter article content.
4. Rewrite Home around the confirmed journey.
5. Rewrite Products around result capabilities plus technical proof.
6. Rewrite About around starter identity and boundaries.
7. Update footer/navigation supporting copy.
8. Run focused tests, then full website checks.

## Open implementation choices

These are implementation details, not design blockers:

- Whether legacy routes are retained, redirected, or demoted in footer/resource areas.
- Whether blog articles are MDX files, config-backed content, or a minimal route-local content model.
- Whether Products reuses existing product catalog components or gets a new starter-capability presentation layer.
- Whether Contact action styling matches the current button component or introduces a new header action variant.

These choices should be resolved in the implementation plan after reading the relevant code and rules.
