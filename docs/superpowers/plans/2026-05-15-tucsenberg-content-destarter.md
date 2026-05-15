# Tucsenberg Content De-Starter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove buyer-visible starter/demo identity from the current Tucsenberg content shell while keeping product data, compatibility pages, quote behavior, and final legal terms out of scope.

**Architecture:** Treat MDX page prose, message bundles, and canonical site config as three separate content surfaces. Rewrite only approved public/interim content, keep JSON key shapes stable, and verify that protected product placeholders remain unchanged.

**Tech Stack:** Next.js App Router content pipeline, MDX frontmatter, next-intl JSON messages, TypeScript config, pnpm scripts, Vitest/quality guards where exposed.

---

## File structure and responsibilities

**MDX interim pages**
- Modify: `content/pages/en/about.mdx`: Tucsenberg interim brand/about page.
- Modify: `content/pages/zh/about.mdx`: Chinese internal-preview mirror of the about page.
- Modify: `content/pages/en/capabilities.mdx`: Tucsenberg current website capability scope, not starter capabilities.
- Modify: `content/pages/zh/capabilities.mdx`: Chinese internal-preview mirror of capabilities.
- Modify: `content/pages/en/how-it-works.mdx`: buyer RFQ preparation flow.
- Modify: `content/pages/zh/how-it-works.mdx`: Chinese internal-preview mirror of buyer flow.
- Modify: `content/pages/en/contact.mdx`: replacement membrane inquiry/RFQ entry copy.
- Modify: `content/pages/zh/contact.mdx`: Chinese internal-preview mirror of contact copy.
- Modify: `content/pages/en/privacy.mdx`: interim Tucsenberg legal placeholder warning; no final legal claims.
- Modify: `content/pages/zh/privacy.mdx`: Chinese internal-preview mirror of privacy placeholder.
- Modify: `content/pages/en/terms.mdx`: interim Tucsenberg terms placeholder; no payment/delivery/warranty promises.
- Modify: `content/pages/zh/terms.mdx`: Chinese internal-preview mirror of terms placeholder.

**Messages**
- Modify: `messages/en/critical.json`: buyer-visible starter/demo labels and descriptions.
- Modify: `messages/zh/critical.json`: Chinese mirrors of changed buyer-visible strings.
- Modify: `messages/es/critical.json`: keep key shape and `[ES-TODO] ` prefix while mirroring changed English meaning.

**Canonical site config**
- Modify: `src/config/single-site.ts`: remove Silicone SEO keyword and preserve PTFE keyword.

**Protected files**
- Do not modify: `src/constants/product-standards.ts`
- Do not modify: `src/config/single-site-product-catalog.ts`
- Do not modify: `src/constants/product-specs/**/*.ts`
- Do not modify: deep `starterCapabilities` blocks unless a later step explicitly identifies a buyer-visible shallow label outside the protected product-placeholder scope.

---

## Task 1: Baseline and protected-scope proof

**Files:**
- Read only: `content/pages/en/*.mdx`
- Read only: `content/pages/zh/*.mdx`
- Read only: `messages/en/critical.json`
- Read only: `messages/zh/critical.json`
- Read only: `messages/es/critical.json`
- Read only: `src/config/single-site.ts`
- Read only: protected product placeholder files listed above

- [ ] **Step 1: Confirm worktree and unrelated dirty files**

Run:

```bash
git status --short --branch
```

Expected:

- Current branch is shown.
- Any unrelated dirty file, such as `.claude/rules/cloudflare.md`, is noted and left untouched.

- [ ] **Step 2: Capture current starter/demo hits in approved scope**

Run:

```bash
rg -n "Showcase Website Starter|showcase website starter|Starter Capabilities|starter|demo|Product Showcase|Service Showcase|Component Showcase|innovative solutions|transform your business|silicone aeration membrane|PTFE aeration membrane" \
  content/pages/en/about.mdx \
  content/pages/zh/about.mdx \
  content/pages/en/capabilities.mdx \
  content/pages/zh/capabilities.mdx \
  content/pages/en/how-it-works.mdx \
  content/pages/zh/how-it-works.mdx \
  content/pages/en/contact.mdx \
  content/pages/zh/contact.mdx \
  content/pages/en/privacy.mdx \
  content/pages/zh/privacy.mdx \
  content/pages/en/terms.mdx \
  content/pages/zh/terms.mdx \
  messages/en/critical.json \
  messages/zh/critical.json \
  messages/es/critical.json \
  src/config/single-site.ts
```

Expected:

- Hits show only the approved cleanup targets.
- Product-placeholder hits under protected namespaces are not edited in this task.

- [ ] **Step 3: Capture protected files before editing**

Run:

```bash
git diff -- \
  src/constants/product-standards.ts \
  src/config/single-site-product-catalog.ts \
  'src/constants/product-specs/**/*.ts'
```

Expected:

- No diff from this task.
- If there is pre-existing diff, record it and do not modify those files.

---

## Task 2: Rewrite non-legal MDX pages

**Files:**
- Modify: `content/pages/en/about.mdx`
- Modify: `content/pages/zh/about.mdx`
- Modify: `content/pages/en/capabilities.mdx`
- Modify: `content/pages/zh/capabilities.mdx`
- Modify: `content/pages/en/how-it-works.mdx`
- Modify: `content/pages/zh/how-it-works.mdx`
- Modify: `content/pages/en/contact.mdx`
- Modify: `content/pages/zh/contact.mdx`

- [ ] **Step 1: Replace English about page**

Use `apply_patch` to replace `content/pages/en/about.mdx` with:

```mdx
---
locale: 'en'
title: 'About Tucsenberg'
description: 'Learn how Tucsenberg is preparing a part-number-led replacement membrane website for OEM-family matching, material review, and RFQ intake.'
slug: 'about'
publishedAt: '2024-01-10'
updatedAt: '2026-05-15'
author: 'Tucsenberg Team'
layout: 'default'
showToc: true
lastReviewed: '2026-05-15'
draft: false
heroTitle: 'A replacement membrane site built around installed aeration systems'
heroSubtitle: 'Part-number evidence before broad catalog claims'
heroDescription: 'Tucsenberg is preparing an aftermarket aeration replacement membrane website for buyers who need OEM-family matching, material fit review, and RFQ-ready inputs.'
seo:
  title: 'About Tucsenberg'
  description: 'Tucsenberg is an aftermarket aeration replacement membrane brand preparing OEM-family, part-number, material-fit, and RFQ review paths.'
  keywords: ['Tucsenberg', 'aftermarket aeration membranes', 'replacement membrane RFQ']
  ogImage: '/images/about-og.jpg'
aboutSections:
  valuesTitle: 'What this website is being built to support'
  values:
    quality:
      title: 'Installed-system focus'
      description: 'The site starts from OEM family, old part number, diffuser body, dimensions, and field evidence.'
    innovation:
      title: 'Material-fit review'
      description: 'EPDM, TPU/PU, and later PTFE-coated EPDM are presented by wastewater condition fit, not vague quality claims.'
    service:
      title: 'RFQ preparation'
      description: 'Inquiry paths ask for the evidence needed to review a replacement membrane request responsibly.'
    integrity:
      title: 'Controlled launch claims'
      description: 'Product data, compatibility records, legal text, and quote routing stay limited until owner-confirmed.'
  statLabels:
    yearsExperience: 'Launch phase'
    countriesServed: 'Public locales'
    happyClients: 'RFQ inputs'
    productsDelivered: 'Membrane paths'
  cta:
    title: 'Prepare a membrane inquiry'
    description: 'Share OEM family, part number, dimensions, photos, material conditions, and quantity range when available.'
    button: 'Prepare RFQ'
faq:
  - id: tucsenberg-role
    question: "What is Tucsenberg?"
    answer: "Tucsenberg is an aftermarket aeration replacement membrane brand being built around OEM-family matching, material review, and RFQ preparation."
  - id: launch-state
    question: "Is the full compatibility database live?"
    answer: "No. The site shell is in launch-prep state until product data, compatibility records, and RFQ routing are owner-confirmed."
  - id: buyer-inputs
    question: "What information helps a replacement membrane inquiry?"
    answer: "Useful inputs include OEM family, old part number, disc or tube format, dimensions, photos, wastewater conditions, quantity range, and shutdown timing."
---

## Why Tucsenberg starts with part numbers

Replacement membrane buyers rarely arrive with a clean catalog SKU. They may have an old part number, an installed OEM family, a worn membrane, a diffuser body photo, or only a shutdown deadline.

Tucsenberg is being shaped around that buying situation. The site is meant to help a maintenance or procurement team collect enough evidence for a responsible replacement membrane review.

## Current launch boundary

The public shell already reflects the intended Tucsenberg direction: aftermarket aeration replacement membranes, OEM-family matching, material-fit guidance, and RFQ intake.

It is not yet a finished product database. Product pages, compatibility mappings, quote routing, legal terms, and response ownership still need confirmed inputs before they become launch claims.

## What the site will support

- Buyers comparing replacement paths for installed disc or tube diffuser systems.
- RFQ preparation based on OEM family, part number, dimensions, photos, and wastewater conditions.
- Material questions across EPDM, TPU/PU, and later PTFE-coated EPDM.
- English and Spanish public launch paths, with Chinese kept for internal preview.

## What remains unconfirmed

- Final product specifications and compatibility mappings.
- Legal entity, legal terms, privacy details, and contact ownership.
- Quote routing, response workflow, and any service-level commitments.
- Product photos, datasheets, and customer-facing proof assets.
```

- [ ] **Step 2: Replace Chinese about page**

Use `apply_patch` to replace `content/pages/zh/about.mdx` with the Chinese mirror:

```mdx
---
locale: 'zh'
title: '关于 Tucsenberg'
description: '了解 Tucsenberg 如何围绕 part number、OEM family 匹配、材质 review 和 RFQ intake 搭建替换膜片网站。'
slug: 'about'
publishedAt: '2024-01-10'
updatedAt: '2026-05-15'
author: 'Tucsenberg Team'
layout: 'default'
showToc: true
lastReviewed: '2026-05-15'
draft: false
heroTitle: '围绕现有曝气系统搭建的替换膜片网站'
heroSubtitle: '先看 part number 证据，再谈完整目录'
heroDescription: 'Tucsenberg 正在准备一个 aftermarket aeration replacement membrane 网站，服务需要 OEM-family 匹配、材质适配 review 和 RFQ 输入的买家。'
seo:
  title: '关于 Tucsenberg'
  description: 'Tucsenberg 是一个 aftermarket aeration replacement membrane 品牌，正在准备 OEM-family、part number、材质适配和 RFQ review 路径。'
  keywords: ['Tucsenberg', '曝气替换膜片', '替换膜片 RFQ']
  ogImage: '/images/about-og.jpg'
aboutSections:
  valuesTitle: '这个网站要支持什么'
  values:
    quality:
      title: '围绕现有系统'
      description: '网站从 OEM family、旧 part number、diffuser body、尺寸和现场证据开始。'
    innovation:
      title: '材质适配 review'
      description: 'EPDM、TPU/PU 和后续 PTFE-coated EPDM 按废水工况说明，不靠空泛质量词。'
    service:
      title: 'RFQ 输入准备'
      description: '询价路径会收集负责 review 替换膜片请求所需的信息。'
    integrity:
      title: '控制上线承诺'
      description: '产品数据、兼容记录、法律文本和报价路由都等 owner 确认后再变成上线承诺。'
  statLabels:
    yearsExperience: '上线阶段'
    countriesServed: '公开语种'
    happyClients: 'RFQ 输入'
    productsDelivered: '膜片路径'
  cta:
    title: '准备膜片询价'
    description: '如有 OEM family、part number、尺寸、照片、材质工况和数量区间，请一起提交。'
    button: '准备 RFQ'
faq:
  - id: tucsenberg-role
    question: "Tucsenberg 是什么？"
    answer: "Tucsenberg 是一个 aftermarket aeration replacement membrane 品牌，网站会围绕 OEM-family 匹配、材质 review 和 RFQ 准备来建设。"
  - id: launch-state
    question: "完整兼容数据库已经上线了吗？"
    answer: "还没有。当前网站壳层处于 launch-prep 状态，产品数据、兼容记录和 RFQ 路由确认后才会变成上线内容。"
  - id: buyer-inputs
    question: "替换膜片询价最好提供什么？"
    answer: "有用信息包括 OEM family、旧 part number、disc 或 tube 形式、尺寸、照片、废水工况、数量区间和停机时间。"
---

## Tucsenberg 为什么从 part number 开始

替换膜片买家通常不是带着干净 SKU 来的。他们可能只有旧 part number、现有 OEM family、磨损膜片、diffuser body 照片，或者一个停机日期。

Tucsenberg 会围绕这个采购场景来建设。网站目标是帮助维护或采购团队整理足够证据，再进入负责的替换膜片 review。

## 当前上线边界

当前公开壳层已经体现 Tucsenberg 的方向：曝气系统替换膜片、OEM-family 匹配、材质适配说明和 RFQ intake。

它还不是最终产品数据库。产品页、兼容映射、报价路由、法律条款和响应归属，都需要确认后才能成为上线承诺。

## 网站会支持什么

- 为现有 disc 或 tube diffuser 系统寻找替换路径的买家。
- 基于 OEM family、part number、尺寸、照片和废水工况准备 RFQ。
- 围绕 EPDM、TPU/PU 和后续 PTFE-coated EPDM 的材质问题。
- 英文和西语公开上线路径，中文只做内部预览。

## 还没确认什么

- 最终产品规格和兼容映射。
- 法律主体、法律条款、隐私细节和联系归属。
- 报价路由、响应流程和任何服务级别承诺。
- 产品照片、datasheet 和买家可见的证明资产。
```

- [ ] **Step 3: Replace capabilities pages**

Use `apply_patch` to replace `content/pages/en/capabilities.mdx` with:

```mdx
---
locale: 'en'
title: 'Tucsenberg Capabilities'
description: 'Current Tucsenberg website capabilities for membrane replacement paths, OEM-family inputs, material-fit review, and RFQ preparation.'
slug: 'capabilities'
publishedAt: '2026-04-26'
updatedAt: '2026-05-15'
lastReviewed: '2026-05-15'
draft: false
seo:
  title: 'Tucsenberg Capabilities | Membrane Replacement RFQ Path'
  description: 'See how Tucsenberg is preparing replacement membrane paths around OEM-family evidence, material fit, and RFQ input quality.'
  keywords:
    ['Tucsenberg capabilities', 'replacement membrane RFQ', 'OEM family membrane matching']
  ogImage: '/images/og-image.jpg'
---

## Membrane replacement paths in preparation

Tucsenberg is being built around replacement membrane inquiries where the buyer may not have a clean SKU. The site structure supports OEM-family evidence, part numbers, photos, dimensions, material conditions, and quantity ranges.

## OEM-family evidence

Future compatibility pages will organize replacement paths by installed OEM family and selected model groups. Until those records are confirmed, the site keeps this as a launch-prep capability rather than a complete database claim.

## Material-fit review

EPDM and TPU/PU are Phase 1 material paths. PTFE-coated EPDM remains a later material path. The wording must stay condition-based, especially for industrial wastewater, oils, solvents, fouling, and chemical exposure.

## RFQ preparation

The inquiry path should help buyers send useful evidence: OEM family, old part number, disc or tube format, dimensions, photos, wastewater conditions, quantity range, and shutdown timing.

## Technical launch foundation

The site keeps the existing Cloudflare/OpenNext direction while Tucsenberg content, compatibility records, and lead routing are confirmed.

## Guardrails

Unconfirmed product data, legal terms, delivery promises, warranty language, and quote behavior must not be presented as launch-ready facts.
```

Replace `content/pages/zh/capabilities.mdx` with:

```mdx
---
locale: 'zh'
title: 'Tucsenberg 能力范围'
description: '当前 Tucsenberg 网站围绕替换膜片路径、OEM-family 输入、材质适配 review 和 RFQ 准备所承载的能力。'
slug: 'capabilities'
publishedAt: '2026-04-26'
updatedAt: '2026-05-15'
lastReviewed: '2026-05-15'
draft: false
seo:
  title: 'Tucsenberg 能力范围 | 替换膜片 RFQ 路径'
  description: '了解 Tucsenberg 如何围绕 OEM-family 证据、材质适配和 RFQ 输入质量准备替换膜片路径。'
  keywords:
    ['Tucsenberg 能力', '替换膜片 RFQ', 'OEM family 膜片匹配']
  ogImage: '/images/og-image.jpg'
---

## 正在准备的替换膜片路径

Tucsenberg 面向的询价场景是：买家不一定有干净 SKU。网站结构会支持 OEM-family 证据、part number、照片、尺寸、材质工况和数量区间。

## OEM-family 证据

后续兼容页会按现有 OEM family 和精选型号组组织替换路径。在这些记录确认前，网站只把它作为 launch-prep 能力，不写成完整数据库承诺。

## 材质适配 review

EPDM 和 TPU/PU 是 Phase 1 材质路径。PTFE-coated EPDM 是后续材质路径。相关表述要按工况写，尤其是工业废水、油脂、溶剂、fouling 和化学暴露。

## RFQ 准备

询价路径应帮助买家提交有用证据：OEM family、旧 part number、disc 或 tube 形式、尺寸、照片、废水工况、数量区间和停机时间。

## 技术上线基础

网站继续沿用 Cloudflare/OpenNext 方向，同时确认 Tucsenberg 内容、兼容记录和 lead routing。

## 防线

未确认的产品数据、法律条款、交付承诺、保修语言和报价行为，都不能写成已可上线的事实。
```

- [ ] **Step 4: Replace how-it-works pages**

Use `apply_patch` to replace `content/pages/en/how-it-works.mdx` with:

```mdx
---
locale: 'en'
title: 'How It Works'
description: 'Prepare a replacement membrane inquiry with OEM-family evidence, part numbers, dimensions, material conditions, and quantity range.'
slug: 'how-it-works'
publishedAt: '2026-04-26'
updatedAt: '2026-05-15'
lastReviewed: '2026-05-15'
draft: false
seo:
  title: 'How It Works | Replacement Membrane RFQ Preparation'
  description: 'Learn what information helps Tucsenberg review an aftermarket aeration replacement membrane inquiry.'
  keywords:
    ['replacement membrane RFQ', 'aeration membrane part number', 'OEM diffuser membrane replacement']
  ogImage: '/images/og-image.jpg'
---

## Prepare the evidence before asking for a replacement membrane

A responsible membrane review starts with the installed system, not with a broad catalog claim.

1. Identify the OEM family, installed model, diffuser body, or old part number if available.
2. Share the membrane format, dimensions, photos, drawings, or part list.
3. Describe the wastewater conditions that may affect material fit.
4. Provide the quantity range and shutdown timing.
5. Let the review connect the evidence to a replacement path.

## If the model is unknown

Send photos of the diffuser body, membrane, connector, and any markings on the old part. Dimensions are useful even when the brand or model name is missing.

## If the material is uncertain

State the wastewater type, chemical exposure, oil or solvent presence, temperature range if known, and whether fouling has been a problem. EPDM, TPU/PU, and later PTFE-coated EPDM should be reviewed by condition fit.

## If the project is urgent

Include shutdown timing and quantity range. This helps separate emergency replacement needs from planned annual procurement.
```

Replace `content/pages/zh/how-it-works.mdx` with:

```mdx
---
locale: 'zh'
title: '如何准备询价'
description: '用 OEM-family 证据、part number、尺寸、材质工况和数量区间准备替换膜片询价。'
slug: 'how-it-works'
publishedAt: '2026-04-26'
updatedAt: '2026-05-15'
lastReviewed: '2026-05-15'
draft: false
seo:
  title: '如何准备询价 | 替换膜片 RFQ 输入'
  description: '了解哪些信息有助于 Tucsenberg review aftermarket aeration replacement membrane 询价。'
  keywords:
    ['替换膜片 RFQ', '曝气膜片 part number', 'OEM diffuser membrane replacement']
  ogImage: '/images/og-image.jpg'
---

## 先准备证据，再询替换膜片

负责任的膜片 review 从现有系统开始，而不是从泛目录承诺开始。

1. 尽量确认 OEM family、现有型号、diffuser body 或旧 part number。
2. 提供膜片形式、尺寸、照片、图纸或 part list。
3. 描述可能影响材质适配的废水工况。
4. 提供数量区间和停机时间。
5. 再根据这些证据连接到替换路径。

## 如果型号不确定

可以发送 diffuser body、膜片、连接处和旧件标记的照片。即使缺少品牌或型号名，尺寸信息也有帮助。

## 如果材质不确定

说明废水类型、化学暴露、是否有油脂或溶剂、已知温度范围，以及 fouling 是否是问题。EPDM、TPU/PU 和后续 PTFE-coated EPDM 都应按工况适配来 review。

## 如果项目很急

请提供停机时间和数量区间。这样可以区分紧急替换和年度计划采购。
```

- [ ] **Step 5: Replace contact pages**

Use `apply_patch` to replace `content/pages/en/contact.mdx` with:

```mdx
---
locale: 'en'
title: 'Contact Tucsenberg'
description: 'Send replacement membrane RFQ inputs, OEM-family evidence, part numbers, dimensions, photos, material conditions, and quantity range.'
slug: 'contact'
publishedAt: '2024-01-01'
updatedAt: '2026-05-15'
lastReviewed: '2026-05-15'
draft: false
seo:
  title: 'Contact Tucsenberg | Replacement Membrane RFQ'
  description: 'Contact Tucsenberg with OEM family, part number, membrane dimensions, photos, material conditions, and quantity range for replacement membrane review.'
faq:
  - id: response-time
    question: "Is a response time guaranteed?"
    answer: "Not yet. The public response workflow must be confirmed before a response window is promised."
  - id: inquiry-details
    question: "What should I include?"
    answer: "Include OEM family, installed model or old part number, disc or tube format, dimensions, photos, wastewater conditions, quantity range, and shutdown timing if available."
  - id: unknown-model
    question: "What if I do not know the model?"
    answer: "Send photos of the diffuser body, membrane, connector, and any markings on the old part. Dimensions and a part list can also help."
  - id: form-routing
    question: "Where does the form send inquiries?"
    answer: "The final receiver must be configured before public launch. Current copy describes the intended inquiry content only."
---

## Send a replacement membrane inquiry

Use this page to prepare the information Tucsenberg will need for aftermarket aeration replacement membrane review.

The best inquiry includes OEM family, old part number if available, disc or tube format, membrane dimensions, photos, wastewater conditions, quantity range, and shutdown timing.

## Useful RFQ inputs

- OEM family or installed model.
- Old part number, drawing, or part list.
- Disc or tube format and key dimensions.
- Material preference or wastewater conditions.
- Quantity range and shutdown timing.
- Photos of the diffuser body, membrane, connector, and markings.

## Current launch boundary

Final form routing, receiver ownership, and response expectations still need to be confirmed before public launch.
```

Replace `content/pages/zh/contact.mdx` with:

```mdx
---
locale: 'zh'
title: '联系 Tucsenberg'
description: '提交替换膜片 RFQ 输入、OEM-family 证据、part number、尺寸、照片、材质工况和数量区间。'
slug: 'contact'
publishedAt: '2024-01-01'
updatedAt: '2026-05-15'
lastReviewed: '2026-05-15'
draft: false
seo:
  title: '联系 Tucsenberg | 替换膜片 RFQ'
  description: '向 Tucsenberg 提交 OEM family、part number、膜片尺寸、照片、材质工况和数量区间，用于替换膜片 review。'
faq:
  - id: response-time
    question: "现在承诺响应时间吗？"
    answer: "暂不承诺。公开响应流程确认后，才能写具体响应窗口。"
  - id: inquiry-details
    question: "应该提供什么信息？"
    answer: "如有 OEM family、现有型号或旧 part number、disc 或 tube 形式、尺寸、照片、废水工况、数量区间和停机时间，请一起提供。"
  - id: unknown-model
    question: "不知道型号怎么办？"
    answer: "可以发送 diffuser body、膜片、连接处和旧件标记的照片。尺寸和 part list 也有帮助。"
  - id: form-routing
    question: "表单会发到哪里？"
    answer: "最终接收方必须在公开上线前配置。当前文案只说明目标询价内容。"
---

## 提交替换膜片询价

这个页面用于准备 Tucsenberg review aftermarket aeration replacement membrane 所需的信息。

最有用的询价信息包括 OEM family、旧 part number、disc 或 tube 形式、膜片尺寸、照片、废水工况、数量区间和停机时间。

## 有用的 RFQ 输入

- OEM family 或现有型号。
- 旧 part number、图纸或 part list。
- Disc 或 tube 形式，以及关键尺寸。
- 材质偏好或废水工况。
- 数量区间和停机时间。
- Diffuser body、膜片、连接处和标记照片。

## 当前上线边界

最终表单路由、接收方归属和响应预期，还需要在公开上线前确认。
```

- [ ] **Step 6: Run content check after non-legal MDX**

Run:

```bash
pnpm content:check
```

Expected: PASS. If it fails, fix only frontmatter/MDX issues introduced in Task 2.

---

## Task 3: Rewrite legal MDX pages as interim placeholders

**Files:**
- Modify: `content/pages/en/privacy.mdx`
- Modify: `content/pages/zh/privacy.mdx`
- Modify: `content/pages/en/terms.mdx`
- Modify: `content/pages/zh/terms.mdx`

- [ ] **Step 1: Replace privacy pages with interim legal placeholder copy**

Use `apply_patch` to replace only frontmatter descriptions, introduction, and contact identity. Keep existing privacy sections intact unless they contain Showcase/starter identity.

For `content/pages/en/privacy.mdx`:

- Change frontmatter `description` to:

```yaml
description: 'Interim Tucsenberg privacy placeholder for launch preparation. Replace legal entity, providers, retention, and jurisdiction details before public launch.'
```

- Change `seo.description` to:

```yaml
description: 'Interim Tucsenberg privacy placeholder. Final data handling terms must be reviewed and replaced before public launch.'
```

- Replace the introduction paragraph with:

```md
This page is an interim Tucsenberg privacy placeholder for launch preparation. It is not final legal advice. Before public launch, the site owner must replace it with the correct legal entity, contact channel, service providers, data retention rules, international transfer details, and jurisdiction-specific requirements.
```

- Replace contact identity lines with:

```md
**Data Protection Contact**
Tucsenberg
Use the contact form on this site until a real data protection contact is configured.
Address: Replace with the real legal address before launch.
```

For `content/pages/zh/privacy.mdx`, mirror the same changes:

```yaml
description: 'Tucsenberg 上线准备阶段的临时隐私占位页。公开上线前必须替换法律主体、服务商、保留期限和适用司法辖区细节。'
```

```yaml
description: 'Tucsenberg 临时隐私占位页。最终数据处理条款必须在公开上线前审核并替换。'
```

```md
这个页面是 Tucsenberg 上线准备阶段的临时隐私占位页，不是最终法律意见。公开上线前，网站 owner 必须替换真实法律主体、联系方式、服务提供商、数据保留规则、国际传输细节和适用司法辖区要求。
```

```md
**数据保护联系方式**
Tucsenberg
真实数据保护联系人配置前，请使用本站联系表单。
地址：公开上线前替换真实法律地址。
```

- [ ] **Step 2: Replace terms pages with safer interim placeholder copy**

Use `apply_patch` to remove final-sounding payment, delivery, warranty, governing-law, dispute, export, and approval claims from `content/pages/en/terms.mdx` and `content/pages/zh/terms.mdx`.

Replace `content/pages/en/terms.mdx` with:

```mdx
---
locale: 'en'
title: 'Terms of Service'
slug: 'terms'
description: 'Interim Tucsenberg terms placeholder for launch preparation. Replace legal, payment, delivery, warranty, dispute, and contact language before public launch.'
publishedAt: '2024-01-01'
updatedAt: '2026-05-15'
author: 'Legal Team'
layout: 'default'
showToc: true
lastReviewed: '2026-05-15'
draft: false
seo:
  title: 'Terms of Service | Tucsenberg Placeholder Terms'
  description: 'Interim Tucsenberg terms placeholder. Final business and legal terms must be reviewed and replaced before public launch.'
  keywords:
    - 'terms of service'
    - 'terms and conditions'
    - 'Tucsenberg terms'
    - 'placeholder legal page'
    - 'business terms'
---

**Effective Date:** To be confirmed before public launch
**Last Updated:** May 15, 2026

## Introduction \{#introduction\}

This page is an interim Tucsenberg terms placeholder for launch preparation. It is not final legal advice and must not be treated as the final contract for any order, quotation, shipment, warranty, or dispute.

Before public launch, the site owner must replace this page with terms reviewed for the actual legal entity, products, jurisdictions, sales process, payment terms, delivery terms, warranty scope, dispute venue, export controls, and contact channels.

## Website use \{#website-use\}

This website is being prepared to present aftermarket aeration replacement membrane information, material-fit guidance, compatibility review inputs, and RFQ preparation paths.

Current pages may describe intended inquiry flows before final product data, compatibility mappings, legal terms, and quote routing are confirmed.

## Inquiry and quotation boundary \{#inquiry\}

Submitting an inquiry through this website should be treated as a request for review, not as an accepted order or binding quotation.

Buyers should include OEM family, part number if available, disc or tube format, dimensions, photos, wastewater conditions, quantity range, and shutdown timing when available.

Final quotation validity, pricing, payment method, order confirmation, production schedule, shipping terms, and risk transfer must be stated in the final quotation or contract.

## Product information boundary \{#product-info\}

Product, material, and compatibility information on the site must be reviewed against the actual installed system and project conditions.

No page should be read as a guarantee of compatibility, service life, regulatory compliance, or suitability for a specific wastewater condition unless confirmed in a final written agreement.

## Intellectual property and trademarks \{#ip\}

Tucsenberg content, marks, and website materials must be governed by the final legal terms before public launch.

OEM names, model names, and trademarks may appear for compatibility reference. Those marks remain the property of their respective owners. Tucsenberg is not affiliated with or endorsed by those OEM owners unless a final written agreement says otherwise.

## Privacy and data \{#privacy\}

Personal data handling must follow the final privacy policy and configured service providers.

The current privacy page is also an interim placeholder and must be reviewed before public launch.

## Final terms required before launch \{#final-terms\}

Before this page is used for a real business transaction, confirm and replace:

- legal entity and legal address
- payment terms and accepted payment methods
- quotation validity and order confirmation process
- delivery terms, Incoterms, and risk transfer
- warranty scope, exclusions, and claim process
- governing law and dispute venue
- export compliance language
- data handling and contact channels

## Contact information \{#contact\}

For questions about these interim terms:

**Tucsenberg**
Use the contact form on this site until a real legal contact is configured.
Address: Replace with the real legal address before launch.

---

**Document Version:** Interim 0.1
**Status:** Placeholder pending legal review
```

Replace `content/pages/zh/terms.mdx` with:

```mdx
---
locale: 'zh'
title: '服务条款'
slug: 'terms'
description: 'Tucsenberg 上线准备阶段的临时服务条款占位页。公开上线前必须替换法律、付款、交付、保修、争议和联系方式语言。'
publishedAt: '2024-01-01'
updatedAt: '2026-05-15'
author: '法务团队'
layout: 'default'
showToc: true
lastReviewed: '2026-05-15'
draft: false
seo:
  title: '服务条款 | Tucsenberg 占位条款'
  description: 'Tucsenberg 临时服务条款占位页。最终业务和法律条款必须在公开上线前审核并替换。'
  keywords:
    - '服务条款'
    - '业务条款'
    - 'Tucsenberg 条款'
    - '占位法律页面'
    - '业务条款'
---

**生效日期：** 公开上线前确认
**最后更新：** 2026年5月15日

## 引言 \{#introduction\}

这个页面是 Tucsenberg 上线准备阶段的临时服务条款占位页，不是最终法律意见，也不能作为任何订单、报价、发货、保修或争议的最终合同。

公开上线前，网站 owner 必须根据真实法律主体、产品、适用司法辖区、销售流程、付款条款、交付条款、保修范围、争议地点、出口合规和联系方式，替换这份条款。

## 网站使用 \{#website-use\}

这个网站正在准备展示 aftermarket aeration replacement membrane 信息、材质适配说明、兼容性 review 输入和 RFQ 准备路径。

在最终产品数据、兼容映射、法律条款和报价路由确认前，当前页面只描述目标询价流程。

## 询价与报价边界 \{#inquiry\}

通过本站提交询价，应视为 review 请求，不代表订单已接受，也不代表形成有约束力的报价。

如有 OEM family、part number、disc 或 tube 形式、尺寸、照片、废水工况、数量区间和停机时间，买家应尽量一起提交。

最终报价有效期、价格、付款方式、订单确认、生产排期、运输条款和风险转移，必须以最终报价或合同为准。

## 产品信息边界 \{#product-info\}

网站上的产品、材质和兼容性信息，必须结合真实安装系统和项目工况 review。

除非最终书面协议确认，任何页面都不应被理解为对兼容性、使用寿命、法规符合性或特定废水工况适用性的保证。

## 知识产权与商标 \{#ip\}

Tucsenberg 内容、标识和网站材料必须由公开上线前确认的最终法律条款约束。

OEM 名称、型号名称和商标可能为了兼容性参考而出现。这些标识归各自权利人所有。除非最终书面协议另有说明，Tucsenberg 与这些 OEM 权利人没有从属、授权或背书关系。

## 隐私与数据 \{#privacy\}

个人数据处理必须遵守最终隐私政策和已配置的服务提供商安排。

当前隐私页同样是临时占位内容，公开上线前必须 review。

## 上线前必须补齐的最终条款 \{#final-terms\}

这个页面用于真实业务交易前，必须确认并替换：

- 法律主体和法律地址
- 付款条款和接受的付款方式
- 报价有效期和订单确认流程
- 交付条款、Incoterms 和风险转移
- 保修范围、除外项和索赔流程
- 适用法律和争议地点
- 出口合规语言
- 数据处理和联系方式

## 联系方式 \{#contact\}

如对这些临时条款有疑问：

**Tucsenberg**
真实法务联系人配置前，请使用本站联系表单。
地址：公开上线前替换真实法律地址。

---

**文件版本：** Interim 0.1
**状态：** 待法律审核的占位文本
```

- [ ] **Step 3: Verify legal pages no longer contain starter identity or final terms**

Run:

```bash
rg -n "Showcase Website Starter|starter|demo|30-45 days|12 months|CIETAC|30%|70%|Approved By|Legal Department" \
  content/pages/en/privacy.mdx \
  content/pages/zh/privacy.mdx \
  content/pages/en/terms.mdx \
  content/pages/zh/terms.mdx
```

Expected:

- No matches for `Showcase Website Starter`, `starter`, `demo`, `30-45 days`, `12 months`, `CIETAC`, `30%`, `70%`, `Approved By`, or `Legal Department`.
- If `placeholder` or `占位` appears, that is allowed because the legal placeholder warning is intentional.

- [ ] **Step 4: Run content check after legal MDX**

Run:

```bash
pnpm content:check
```

Expected: PASS. If it fails, fix only frontmatter/MDX issues introduced in Task 3.

---

## Task 4: Update buyer-visible critical messages

**Files:**
- Modify: `messages/en/critical.json`
- Modify: `messages/zh/critical.json`
- Modify: `messages/es/critical.json`

- [ ] **Step 1: Locate exact message keys**

Run:

```bash
rg -n "\"Product Showcase\"|\"Service Showcase\"|\"Component Showcase\"|innovative solutions|transform your business|demos|starterBoundary" messages/en/critical.json messages/zh/critical.json messages/es/critical.json
```

Expected:

- Hits under home/page/landing UI are eligible for this task.
- Hits under deep `starterCapabilities` or `Example Standard` are protected and must not be edited.

- [ ] **Step 2: Update English buyer-visible labels**

Use `apply_patch` on `messages/en/critical.json` for shallow buyer-visible strings only:

- Replace visible `Product Showcase` with `Membrane Paths`.
- Replace visible `Service Showcase` with `RFQ Review Path`.
- Replace visible `Component Showcase` with `Interface Preview` only if it is visible in a public page or demo UI.
- Replace `Explore our comprehensive UI component library with live examples and interactive demos.` with `Preview the interface pieces used for membrane paths, RFQ intake, and launch readiness.`
- Replace `Our product showcase is being crafted with care. Discover innovative solutions that will transform your business.` with `Tucsenberg membrane pages are being prepared around OEM-family evidence, material fit, and RFQ-ready inputs.`
- Replace `Learn more about our story, mission, and the team behind our innovative solutions.` with `Learn how Tucsenberg is preparing a part-number-led replacement membrane site.`
- Replace generic `demos` references in contact/help copy with `replacement membrane inquiries` or `RFQ review inputs`.

Do not edit these strings in this task:

- `Example Standard A`
- `Example Standard B`
- `Example Standard C`
- `Example Standard D`
- `Standard and premium tiers`
- deep `starterCapabilities` product sections

- [ ] **Step 3: Update Chinese mirrors**

Use `apply_patch` on `messages/zh/critical.json` to mirror changed English meaning:

- `Product Showcase` equivalent -> `膜片路径`
- `Service Showcase` equivalent -> `RFQ review 路径`
- `Component Showcase` equivalent -> `界面预览`
- UI component library demo sentence -> `预览用于膜片路径、RFQ intake 和上线准备的界面模块。`
- Generic innovative/transform copy -> `Tucsenberg 膜片页面正在围绕 OEM-family 证据、材质适配和 RFQ-ready 输入准备。`
- Generic story/mission/innovative copy -> `了解 Tucsenberg 如何准备以 part number 为核心的替换膜片网站。`

Do not edit `Example Standard` or deep product placeholder strings.

- [ ] **Step 4: Update Spanish placeholder mirrors**

Use `apply_patch` on `messages/es/critical.json` to mirror changed English meaning while preserving `[ES-TODO] `:

- `"[ES-TODO] Product Showcase"` -> `"[ES-TODO] Membrane Paths"`
- `"[ES-TODO] Service Showcase"` -> `"[ES-TODO] RFQ Review Path"`
- `"[ES-TODO] Component Showcase"` -> `"[ES-TODO] Interface Preview"`
- `"[ES-TODO] Explore our comprehensive UI component library with live examples and interactive demos."` -> `"[ES-TODO] Preview the interface pieces used for membrane paths, RFQ intake, and launch readiness."`
- `"[ES-TODO] Our product showcase is being crafted with care. Discover innovative solutions that will transform your business."` -> `"[ES-TODO] Tucsenberg membrane pages are being prepared around OEM-family evidence, material fit, and RFQ-ready inputs."`
- `"[ES-TODO] Learn more about our story, mission, and the team behind our innovative solutions."` -> `"[ES-TODO] Learn how Tucsenberg is preparing a part-number-led replacement membrane site."`

Do not remove `[ES-TODO] ` from any Spanish value.

- [ ] **Step 5: Verify message shape and protected strings**

Run:

```bash
pnpm exec vitest run tests/unit/i18n-message-contract.test.ts
```

Expected: PASS.

Then run:

```bash
rg -n "Product Showcase|Service Showcase|Component Showcase|innovative solutions|transform your business|Inquiries, quotes, demos" messages/en/critical.json messages/zh/critical.json messages/es/critical.json
```

Expected:

- No matches outside protected product placeholder sections.
- If a match remains under a protected deep placeholder namespace, record it and leave it for Step 3/4 product work.

---

## Task 5: Update SEO keyword and run scoped final checks

**Files:**
- Modify: `src/config/single-site.ts`
- Verify only: protected product placeholder files

- [ ] **Step 1: Remove Silicone keyword and preserve PTFE**

Use `apply_patch` on `src/config/single-site.ts`:

```diff
       keywords: [
         "Tucsenberg membranes",
         "aftermarket aeration membranes",
         "aeration replacement membranes",
         "OEM membrane family fit",
         "EPDM aeration membrane",
-        "silicone aeration membrane",
         "PTFE aeration membrane",
         "fine bubble diffuser membrane",
         "wastewater aeration replacement parts",
         "membrane RFQ",
       ],
```

- [ ] **Step 2: Verify keyword result**

Run:

```bash
rg -n "silicone aeration membrane|PTFE aeration membrane" src/config/single-site.ts
```

Expected:

- No `silicone aeration membrane` match.
- One `PTFE aeration membrane` match.

- [ ] **Step 3: Verify approved scope no longer carries starter/demo identity**

Run:

```bash
rg -n "Showcase Website Starter|showcase website starter|Starter Capabilities|starter demo|public demo starter|starter legal surface|starter privacy page|demo requests|innovative solutions|transform your business|silicone aeration membrane" \
  content/pages/en/about.mdx \
  content/pages/zh/about.mdx \
  content/pages/en/capabilities.mdx \
  content/pages/zh/capabilities.mdx \
  content/pages/en/how-it-works.mdx \
  content/pages/zh/how-it-works.mdx \
  content/pages/en/contact.mdx \
  content/pages/zh/contact.mdx \
  content/pages/en/privacy.mdx \
  content/pages/zh/privacy.mdx \
  content/pages/en/terms.mdx \
  content/pages/zh/terms.mdx \
  messages/en/critical.json \
  messages/zh/critical.json \
  messages/es/critical.json \
  src/config/single-site.ts
```

Expected:

- No matches in approved scope.
- Generic lowercase words such as `placeholder` may remain in legal pages if this command is expanded later; they are allowed when used for legal warning.

- [ ] **Step 4: Verify protected product placeholders were not changed**

Run:

```bash
git diff -- \
  src/constants/product-standards.ts \
  src/config/single-site-product-catalog.ts \
  'src/constants/product-specs/**/*.ts'
```

Expected:

- No diff from this pass.

- [ ] **Step 5: Run content and brand checks**

Run:

```bash
pnpm content:check
pnpm brand:check
git diff --check
```

Expected:

- All pass.

- [ ] **Step 6: Run translation/message guard if available**

Run:

```bash
node scripts/starter-checks.js translations
```

Expected:

- PASS if the command exists.
- If the script reports an unknown check name, record that the translation-specific guard is unavailable and rely on `tests/unit/i18n-message-contract.test.ts` plus `pnpm content:check`.

- [ ] **Step 7: Review final diff before commit**

Run:

```bash
git diff --stat
git diff -- \
  content/pages/en/about.mdx \
  content/pages/zh/about.mdx \
  content/pages/en/capabilities.mdx \
  content/pages/zh/capabilities.mdx \
  content/pages/en/how-it-works.mdx \
  content/pages/zh/how-it-works.mdx \
  content/pages/en/contact.mdx \
  content/pages/zh/contact.mdx \
  content/pages/en/privacy.mdx \
  content/pages/zh/privacy.mdx \
  content/pages/en/terms.mdx \
  content/pages/zh/terms.mdx \
  messages/en/critical.json \
  messages/zh/critical.json \
  messages/es/critical.json \
  src/config/single-site.ts
```

Expected:

- Diff only touches approved content/config files plus this plan if not already committed.
- No protected product placeholder files appear.
- Existing unrelated dirty files stay unrelated and unstaged unless the user asks otherwise.

- [ ] **Step 8: Commit the content pass**

If checks pass and final diff is scoped correctly, run:

```bash
git add \
  content/pages/en/about.mdx \
  content/pages/zh/about.mdx \
  content/pages/en/capabilities.mdx \
  content/pages/zh/capabilities.mdx \
  content/pages/en/how-it-works.mdx \
  content/pages/zh/how-it-works.mdx \
  content/pages/en/contact.mdx \
  content/pages/zh/contact.mdx \
  content/pages/en/privacy.mdx \
  content/pages/zh/privacy.mdx \
  content/pages/en/terms.mdx \
  content/pages/zh/terms.mdx \
  messages/en/critical.json \
  messages/zh/critical.json \
  messages/es/critical.json \
  src/config/single-site.ts
git commit -m "content: remove starter identity from tucsenberg pages"
```

Expected:

- Commit succeeds.
- Pre-commit may run broader repo checks. If it fails because of unrelated dirty files, stop and report exact blocker instead of widening scope.

---

## Self-review checklist

- Spec coverage:
  - MDX pages: Task 2 and Task 3.
  - Critical message bundles: Task 4.
  - Silicone keyword removal and PTFE preservation: Task 5.
  - Protected product placeholders: Task 1 and Task 5.
  - Spanish `[ES-TODO] ` preservation: Task 4 and i18n test.
  - Legal placeholder warning without final legal claims: Task 3.
- Placeholder scan:
  - The plan uses intentional legal words `placeholder` and `[ES-TODO]`.
  - It does not contain unresolved `TBD`, `TODO`, or "implement later" instructions.
- Scope check:
  - Product data, compatibility mappings, quote behavior, CSS class names, blog helper names, scripts, and protected product placeholders are excluded.
