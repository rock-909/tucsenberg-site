# UI Component Index

This file is the maintained mirror of `src/components/component-governance.registry.json` for agent-readable component selection. Keep `docs/ref/ui-components.md` as the short playbook and this file as the inventory index.

Do not treat this file as generated output. Until a later approved replacement exists, this index and the Registry together are the durable component discovery source for agents.

| Component | Radix layer | Surface | Client boundary | Theme boundary | Use when | Avoid when |
| --- | --- | --- | --- | --- | --- | --- |
| `badge` | `themes` | `feedback` | `server-safe` | `self-contained` | Use for small status chips or labels with semantic variants. | Do not use for long narrative text or raw Radix palette names. |
| `breadcrumb` | `primitive` | `navigation` | `server-safe` | `none` | Use for page hierarchy navigation. | Do not use for tag lists, filters, or marketing metadata. |
| `button` | `primitive` | `control` | `server-safe` | `none` | Use for CTAs and clickable actions, including hero CTAs. | Do not handwrite button styling in pages or sections. |
| `card` | `local` | `narrative` | `server-safe` | `none` | Use for marketing, resource, product story, and proof cards. | Do not use for structured specs or data/control surfaces. |
| `checkbox` | `primitive` | `form` | `client` | `none` | Use for optional boolean choices or governed checkbox UI after form semantics are proven for the target flow. | Do not use for contact privacy consent, cookie consent, or no-JS critical flows until migration proof exists. |
| `contact-form-control` | `themes` | `form-internal` | `server-safe` | `parent-scoped` | Use only inside the contact form field composition scoped by ContactFormShell. | Do not use as a general-purpose input or textarea wrapper. |
| `contact-form-shell` | `themes` | `form` | `server-safe` | `self-contained` | Use as the conversion/contact form panel shell. | Do not use for ordinary marketing cards or page layout containers. |
| `data-card` | `themes` | `data` | `server-safe` | `self-contained` | Use for specs, parameters, trade terms, form fallback, and structured facts. | Do not use for persuasive marketing, resources, or product story cards. |
| `dropdown-menu` | `primitive` | `navigation` | `client` | `none` | Use for keyboard-accessible menus such as language or action menus. | Do not handwrite hover-only menus. |
| `dialog` | `primitive` | `control` | `client` | `none` | Use for modal decisions, confirmations, and focused blocking interactions. | Do not use for drawer-style navigation, non-modal panels, or ordinary page layout. |
| `input` | `themes` | `form` | `server-safe` | `self-contained` | Use for text, email, search, number, tel, and URL fields. | Do not use for file or hidden inputs that must stay native. |
| `label` | `primitive` | `form` | `client` | `none` | Use for accessible field labels. | Do not handwrite label behavior in form components. |
| `lazy-island-error-boundary` | `local` | `utility` | `client` | `none` | Use to isolate lazy client island failures. | Do not use for ordinary route-level error handling. |
| `lazy-theme-switcher` | `local` | `theme` | `client` | `none` | Use when the theme switcher should load as a lazy client island. | Do not add a second theme switcher path. |
| `popover` | `primitive` | `control` | `client` | `none` | Use for small non-modal panels opened from a trigger for extra context or compact actions. | Do not use for modal decisions, drawer navigation, hover-only menus, or large layout panels. |
| `radio-group` | `primitive` | `form` | `client` | `none` | Use for mutually exclusive visible choices where all options should be scanned before selection. | Do not use for dropdown selection, multi-select, checkbox consent, or primary navigation. |
| `radix-theme` | `themes` | `theme` | `server-safe` | `self-contained` | Use only inside approved UI wrappers to scope Radix Themes. | Do not import from pages, sections, forms, product, contact, or layout code. |
| `section-head` | `local` | `layout` | `server-safe` | `none` | Use for reusable section title, subtitle, and optional action layout. | Do not use as a data card or form control. |
| `select` | `primitive` | `form` | `client` | `none` | Use for single-choice form selection where native select styling or keyboard behavior needs a governed wrapper. | Do not use for multi-select, checkbox groups, radio choices, or primary navigation. |
| `separator` | `local` | `layout` | `client` | `none` | Use for visual separation that needs a shared wrapper. | Do not use as a substitute for page grid or spacing design. |
| `sheet` | `primitive` | `control` | `client` | `none` | Use for drawer-style interactions such as mobile navigation. | Do not use for ordinary layout panels or Dialog semantics. |
| `social-icons` | `local` | `navigation` | `server-safe` | `none` | Use for social icon rendering and linked social destinations. | Do not duplicate icon/link mapping in pages. |
| `status-callout` | `themes` | `feedback` | `server-safe` | `self-contained` | Use for info, success, warning, error, unavailable, or form status messages. | Do not build ad hoc alert panels in business components. |
| `tabs` | `primitive` | `navigation` | `client` | `none` | Use for keyboard-accessible content panels with a small set of related sections. | Do not use for primary navigation, FAQ disclosure, or mobile drawer menus. |
| `textarea` | `themes` | `form` | `server-safe` | `self-contained` | Use for multiline text entry. | Do not handwrite textarea styles in business components. |
| `theme-switcher` | `local` | `theme` | `client` | `none` | Use as the single shared theme switching control. | Do not create a second theme switching implementation. |
| `theme-switcher-highlight` | `local` | `theme` | `client` | `none` | Use only inside the theme switcher visual track. | Do not use as a general highlight or badge. |
| `tooltip` | `primitive` | `feedback` | `client` | `none` | Use for brief supplemental hints on interactive controls or compact labels. | Do not use for required content, validation errors, or long explanations. |
