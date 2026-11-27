export interface AssetSlotConfig {
  id: string;
  label: string;
  kind: 'svg' | 'webgl-procedural' | 'data-set' | 'interactive-diagram';
  /** Optional custom GLB/asset URL when replacing a procedural 3D slot */
  glbUrl?: string | null;
  fallbackMode: string;
}

export interface SiteConfig {
  brand: {
    name: string;
    wordmark: string;
    locationEyebrow: string;
    email: string;
    tagline: string;
    legalNotice: string;
    isReferenceStudy: boolean;
  };
  palette: {
    black: string;
    surfaceDark: string;
    offWhite: string;
    surfaceLight: string;
    yellow: string;
    yellowDim: string;
    inkDark: string;
    inkLight: string;
    mutedDark: string;
    mutedLight: string;
  };
  motion: {
    enableWebGL: boolean;
    respectReducedMotion: boolean;
    sphereFollowStrength: number;
    marqueeSpeedSeconds: number;
  };
  assets: {
    zerothLogo: AssetSlotConfig;
    heroGlassSphere: AssetSlotConfig;
    searchQuerySet: AssetSlotConfig;
    resultCardSet: AssetSlotConfig;
    processDiagram: AssetSlotConfig;
    legalMark: AssetSlotConfig;
  };
  nav: {
    links: Array<{ label: string; href: string }>;
    filmCta: string;
    auditCta: string;
  };
  hero: {
    eyebrow: string;
    headlineLine1: string;
    headlineLine2: string;
    readingLabel: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    definition: {
      term: string;
      phonetic: string;
      pos: string;
      entries: string[];
    };
    queries: string[];
  };
  whyNow: {
    eyebrow: string;
    statementBeforeHighlight: string;
    highlightWord: string;
    statementAfterHighlight: string;
    stats: Array<{
      value: string;
      label: string;
      source: string;
    }>;
  };
  story: {
    queryText: string;
    exampleBrand: string;
    beats: Array<{
      num: string;
      tag: string;
      title: string;
      body: string;
      source?: string;
    }>;
    diagnosticsBefore: string[];
    diagnosticsAfter: string[];
    zerothMorph: {
      tag: string;
      title: string;
      subtitle: string;
    };
  };
  services: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    items: Array<{
      id: string;
      code: string;
      indexLabel: string;
      title: string;
      body: string;
      bullets: string[];
      diagramKind: 'technical' | 'content' | 'local' | 'ai' | 'pr' | 'analytics';
    }>;
  };
  results: {
    eyebrow: string;
    badge: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    metrics: Array<{
      prefix?: string;
      target: number;
      suffix: string;
      label: string;
      sublabel: string;
    }>;
    cases: Array<{
      client: string;
      city: string;
      summary: string;
      pill: string;
    }>;
    footnote: string;
  };
  process: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    subtitle: string;
    dipNote: string;
    steps: Array<{
      num: string;
      title: string;
      timeframe: string;
      body: string;
      deliverable: string;
      position: 'below' | 'above';
    }>;
  };
  clients: {
    eyebrow: string;
    title: string;
    names: string[];
    queries: Array<{
      text: string;
      badge: string;
      accent: 'yellow' | 'black';
    }>;
    disclaimer: string;
  };
  contact: {
    eyebrow: string;
    mutedHeadline: string;
    boldHeadline: string;
    body: string;
    primaryCta: string;
    emailPrefix: string;
    caption: string;
    mapEyebrow: string;
    mapHint: string;
    cities: Array<{
      id: string;
      name: string;
      lat: string;
      lon: string;
      x: number;
      y: number;
      avgPos: string;
    }>;
  };
  auditForm: {
    title: string;
    subtitle: string;
    submitLabel: string;
    successTitle: string;
    successBody: string;
    note: string;
  };
  filmModal: {
    title: string;
    subtitle: string;
    chapters: Array<{ time: string; label: string; summary: string }>;
  };
  footer: {
    servicesLinks: string[];
    studioLinks: Array<{ label: string; href: string }>;
    officeLines: string[];
    footnotes: string[];
    copyright: string;
    legalLinks: Array<{ id: 'impressum' | 'datenschutz'; label: string }>;
    replayLabel: string;
  };
  legal: {
    impressumTitle: string;
    impressumBody: string[];
    datenschutzTitle: string;
    datenschutzBody: string[];
  };
}

export const SITE_CONFIG: SiteConfig = {
  brand: {
    name: 'DEPLOY',
    wordmark: 'deploy',
    locationEyebrow: 'SOFTWARE ENGINEERING STUDIO',
    email: 'hello@deploy.example',
    tagline:
      'Websites, SaaS platforms, internal company systems and custom software — engineered to ship.',
    legalNotice: '© 2026 DEPLOY Software Engineering. All rights reserved.',
    isReferenceStudy: false,
  },
  palette: {
    black: '#000000',
    surfaceDark: '#0b0b0c',
    offWhite: '#f5f4ef',
    surfaceLight: '#ffffff',
    yellow: '#22c1ec',
    yellowDim: '#1b7fc2',
    inkDark: '#0c0c0d',
    inkLight: '#f2f2ef',
    mutedDark: '#8b8b87',
    mutedLight: '#666660',
  },
  motion: {
    enableWebGL: true,
    respectReducedMotion: true,
    sphereFollowStrength: 0.14,
    marqueeSpeedSeconds: 34,
  },
  assets: {
    zerothLogo: {
      id: 'zeroth-logo',
      label: 'DEPLOY segmented 3D GLB logo',
      kind: 'webgl-procedural',
      glbUrl: './blue letter d 3d model.glb',
      fallbackMode: 'inline-svg',
    },
    heroGlassSphere: {
      id: 'hero-glass-sphere',
      label: 'Hero dark refractive glass sphere',
      kind: 'webgl-procedural',
      glbUrl: null,
      fallbackMode: 'css-depth-lens',
    },
    searchQuerySet: {
      id: 'search-query-set',
      label: 'Engineering capability stream',
      kind: 'data-set',
      fallbackMode: 'canvas-and-dom',
    },
    resultCardSet: {
      id: 'result-card-set',
      label: 'Tilted sprint ticket & system card stack',
      kind: 'interactive-diagram',
      fallbackMode: 'css-3d-cards',
    },
    processDiagram: {
      id: 'process-diagram',
      label: 'Four-step engineering delivery curve',
      kind: 'interactive-diagram',
      fallbackMode: 'svg-stroke-progress',
    },
    legalMark: {
      id: 'legal-mark',
      label: 'Footer legal mark and disclaimers',
      kind: 'svg',
      fallbackMode: 'inline-svg',
    },
  },
  nav: {
    links: [
      { label: 'Portfolio', href: '#services' },
      { label: 'Impact', href: '#results' },
      { label: 'Process', href: '#process' },
      { label: 'Contact', href: '#contact' },
    ],
    filmCta: 'See how we build',
    auditCta: 'Start a project',
  },
  hero: {
    eyebrow: 'SOFTWARE ENGINEERING STUDIO',
    headlineLine1: 'DEPLOY',
    headlineLine2: '',
    readingLabel: 'BUILDING',
    description:
      'Websites, SaaS platforms, internal company systems and custom software — engineered to ship.',
    primaryCta: 'Start a project',
    secondaryCta: 'See how we build',
    definition: {
      term: 'de·ploy',
      phonetic: "/dɪ'plɔɪ/",
      pos: 'verb.',
      entries: [
        'To bring software cleanly into live production.',
        'To turn complex business operations into fast, reliable systems.',
        'Where your next website, SaaS, or internal platform ships.',
      ],
    },
    queries: [
      'custom saas billing platform',
      'internal erp & inventory system',
      'high-converting flagship website',
      'multi-tenant customer portal',
      'real-time analytics dashboard',
      'legacy system modernization',
      'automated warehouse workflow',
      'role-based admin & ops panel',
      'stripe & crm api integrations',
      'mobile-first web application',
      'zero-downtime cloud migration',
      'ai workflow automation tool',
      'client onboarding portal',
      'booking & scheduling engine',
      'design system & ui library',
      'scalable postgres backend',
      'custom invoicing & reporting',
      'end-to-end product engineering',
    ],
  },
  whyNow: {
    eyebrow: 'WHY DEPLOY',
    statementBeforeHighlight:
      "Most companies outgrow spreadsheets and stitched-together tools long before they realize it. Off-the-shelf templates break under real workflows, generic agencies disappear after handoff, and slow systems cost you momentum every single day. Software should fit your business — not the other way around. DEPLOY engineers websites, SaaS products, and company systems built to be ",
    highlightWord: 'yours',
    statementAfterHighlight: '.',
    stats: [
      {
        value: '99.9%',
        label: 'Production reliability target across mission-critical SaaS and internal company systems.',
        source: 'Illustrative engineering uptime benchmark for managed cloud deployments.',
      },
      {
        value: '3×',
        label:
          'Faster internal operations when manual spreadsheets and disconnected tools move to one custom system.',
        source: 'Illustrative workflow benchmark across custom ERP, CRM, and portal builds.',
      },
    ],
  },
  story: {
    queryText: 'build our custom company system',
    exampleBrand: 'DEPLOY Production Stack',
    beats: [
      {
        num: '01',
        tag: 'THE BOTTLENECK',
        title: 'It starts with a problem.',
        body: 'Every growing company hits the point where spreadsheets, plugins, and templates stop scaling.',
      },
      {
        num: '02',
        tag: 'THE BACKLOG',
        title: 'Then comes the patchwork.',
        body: 'Dozens of disconnected tools. Your core workflow buried under manual steps.',
      },
      {
        num: '03',
        tag: 'TICKET #47',
        title: 'Where good teams lose velocity.',
        body: 'Technically running. Practically held together with workarounds.',
      },
      {
        num: '04',
        tag: 'THE ARCHITECTURE',
        title: "We engineer what off-the-shelf can't.",
        body: 'Frontend, backend, databases, APIs – architected cleanly around how your team actually works.',
      },
      {
        num: '05',
        tag: 'THE SPRINT',
        title: 'Then you ship.',
        body: 'Not in endless slide decks. Weekly working releases, sprint after sprint.',
      },
      {
        num: '06',
        tag: 'PRODUCTION',
        title: 'Version one, live.',
        body: 'Fast websites, resilient SaaS platforms, and internal systems your team actually wants to use.',
        source: 'Full source-code ownership, clean TypeScript/cloud architecture, and zero vendor lock-in.',
      },
      {
        num: '07',
        tag: 'SCALE',
        title: 'Then your business grows faster.',
        body: 'More users, new markets, and AI automations demand infrastructure that never stalls.',
        source: 'Modular APIs, automated CI/CD, and observability built in from day one.',
      },
      {
        num: '08',
        tag: 'UNIFIED',
        title: 'And your stack scales with it.',
        body: 'Website, SaaS product, internal ERP, and automations — all connected in one reliable ecosystem.',
        source: 'Engineered for zero-downtime deploys and long-term maintainability.',
      },
    ],
    diagnosticsBefore: ['4.8 S PAGE LOAD', 'MANUAL SPREADSHEETS', 'SILOED TOOLS', 'ILLUSTRATIVE'],
    diagnosticsAfter: ['0.4 S LOAD TIME', 'UNIFIED API & DB', 'AUTOMATED OPS', 'ILLUSTRATIVE'],
    zerothMorph: {
      tag: '09 · DEPLOY',
      title: 'Software built\nto ship.',
      subtitle: 'Websites, SaaS, company systems — whatever your business needs next.',
    },
  },
  services: {
    eyebrow: 'CAPABILITIES',
    titleLine1: 'Everything it takes',
    titleLine2: 'to ship great software.',
    subtitle:
      'Six engineering disciplines, one senior team, and a single goal: software that works in production.',
    items: [
      {
        id: 'websites',
        code: '§ 01 — WEBSITES & WEB APPS',
        indexLabel: '01 / 06',
        title: 'Fast websites engineered to convert.',
        body: 'From flagship brand sites and interactive 3D experiences to high-speed web apps — built with modern frameworks, clean code, and sub-second performance.',
        bullets: [
          'CUSTOM MARKETING & BRAND SITES',
          'INTERACTIVE 3D & MOTION EXPERIENCES',
          'CORE WEB VITALS & ACCESSIBILITY',
          'HEADLESS CMS & CONTENT WORKFLOWS',
        ],
        diagramKind: 'technical',
      },
      {
        id: 'saas-platforms',
        code: '§ 02 — SAAS PLATFORMS',
        indexLabel: '02 / 06',
        title: 'Multi-tenant products built to scale.',
        body: 'We take SaaS products from architecture to production — authentication, billing, permissions, real-time dashboards, and rock-solid APIs.',
        bullets: [
          'MULTI-TENANT ARCHITECTURE',
          'SUBSCRIPTIONS & STRIPE BILLING',
          'ROLE-BASED ACCESS CONTROL',
          'REAL-TIME CUSTOMER DASHBOARDS',
        ],
        diagramKind: 'content',
      },
      {
        id: 'company-systems',
        code: '§ 03 — COMPANY SYSTEMS',
        indexLabel: '03 / 06',
        title: 'Internal tools built around your team.',
        body: 'Replace messy spreadsheets and rigid legacy software with custom ERPs, CRMs, inventory portals, and operational dashboards tailored to your exact workflows.',
        bullets: [
          'CUSTOM ERP & CRM PLATFORMS',
          'INVENTORY & DISPATCH PORTALS',
          'APPROVAL & INVOICING WORKFLOWS',
          'LEGACY DATA MIGRATIONS',
        ],
        diagramKind: 'local',
      },
      {
        id: 'ai-automation',
        code: '§ 04 — AI & AUTOMATION',
        indexLabel: '04 / 06',
        title: 'Practical AI wired into your workflows.',
        body: 'We integrate LLMs, document extraction, internal copilots, and background automations directly into your product or company systems — safely and reliably.',
        bullets: [
          'INTERNAL AI ASSISTANTS',
          'DOCUMENT & DATA EXTRACTION',
          'WORKFLOW & QUEUE AUTOMATION',
          'EVALS & GUARDRAILS',
        ],
        diagramKind: 'ai',
      },
      {
        id: 'integrations-apis',
        code: '§ 05 — INTEGRATIONS & APIS',
        indexLabel: '05 / 06',
        title: 'Every tool in your stack, connected.',
        body: 'We design clean REST/GraphQL APIs, webhook pipelines, and two-way syncs between your website, accounting, CRM, warehouse, and payment providers.',
        bullets: [
          'CUSTOM REST & GRAPHQL APIS',
          'PAYMENT & ACCOUNTING SYNCS',
          'RELIABLE WEBHOOK PIPELINES',
          'THIRD-PARTY SDK INTEGRATIONS',
        ],
        diagramKind: 'pr',
      },
      {
        id: 'cloud-devops',
        code: '§ 06 — CLOUD & DEVOPS',
        indexLabel: '06 / 06',
        title: 'Zero-downtime releases you can trust.',
        body: 'Automated CI/CD, cloud infrastructure, monitoring, and long-term engineering support so your systems stay fast, secure, and effortless to update.',
        bullets: [
          'CI/CD & AUTOMATED TESTING',
          'AWS / GCP / CLOUDFLARE INFRA',
          'MONITORING & ERROR TRACKING',
          'ONGOING ENGINEERING PARTNER',
        ],
        diagramKind: 'analytics',
      },
    ],
  },
  results: {
    eyebrow: 'WORK & IMPACT',
    badge: 'ILLUSTRATIVE EXAMPLES · CUSTOM SOFTWARE',
    titleLine1: 'Built to perform,',
    titleLine2: 'in production.',
    subtitle:
      'What happens when your website, SaaS product, and internal company systems are engineered properly.',
    metrics: [
      {
        prefix: '',
        target: 99,
        suffix: '.9%',
        label: 'Production uptime across deployed systems¹',
        sublabel: 'Monitored, tested, and built for real traffic.',
      },
      {
        target: 4,
        suffix: '×',
        label: 'Faster internal workflows after custom tooling¹',
        sublabel: 'Manual spreadsheets replaced by one unified app.',
      },
      {
        target: 14,
        suffix: 'd',
        label: 'Average sprint-to-first-live-preview turnaround¹',
        sublabel: 'Working software in your browser, not static decks.',
      },
    ],
    cases: [
      {
        client: 'NORTHSTAR LOGISTICS',
        city: 'INTERNAL SYSTEM',
        summary: 'Replaced 14 disconnected spreadsheets with a real-time dispatch, billing, and warehouse portal.¹',
        pill: 'ERP · LIVE',
      },
      {
        client: 'KINETIC HEALTH',
        city: 'SAAS PLATFORM',
        summary: 'Multi-tenant clinic scheduling and Stripe subscription SaaS engineered from zero to launch.¹',
        pill: 'SAAS · V1',
      },
      {
        client: 'VERDANT STUDIO',
        city: 'FLAGSHIP WEBSITE',
        summary: 'Interactive 3D product website with sub-second loads and a custom headless CMS.¹',
        pill: 'WEB · 99/100',
      },
    ],
    footnote:
      '¹ Illustrative project examples demonstrating DEPLOY capabilities. Replace with your live client case studies in src/config/siteConfig.ts.',
  },
  process: {
    eyebrow: 'PROCESS',
    titleLine1: 'Four steps.',
    titleLine2: 'Zero black box.',
    subtitle:
      "No bloated specs or disappearing handoffs. Just clear architecture, weekly live previews, and clean code you own.",
    dipNote: 'INTEGRATION PHASE — legacy data migrated safely.',
    steps: [
      {
        num: '01',
        title: 'Scope',
        timeframe: 'WEEK 1',
        body: 'Every workflow mapped, system architecture defined, and milestones scoped with clear priorities.',
        deliverable: 'Technical spec and sprint roadmap.',
        position: 'below',
      },
      {
        num: '02',
        title: 'Prototype',
        timeframe: 'WEEKS 2–3',
        body: 'Interactive UI screens and core database schemas validated with your team before full build.',
        deliverable: 'Interactive prototype and data model.',
        position: 'above',
      },
      {
        num: '03',
        title: 'Build',
        timeframe: 'WEEKS 4–8',
        body: 'Frontend, backend, APIs, and integrations shipped to a live staging link every single week.',
        deliverable: 'Weekly staging deployments.',
        position: 'below',
      },
      {
        num: '04',
        title: 'Launch & Scale',
        timeframe: 'ONGOING',
        body: 'Zero-downtime production launch, observability, and continuous iterations as your business grows.',
        deliverable: 'Production release and full repo handover.',
        position: 'above',
      },
    ],
  },
  clients: {
    eyebrow: 'WHAT WE SHIP',
    title: 'Websites, SaaS, company systems — anything your team needs.',
    names: [
      'Flagship Websites',
      'SAAS PLATFORMS',
      'Internal ERP Systems',
      'CLIENT PORTALS',
      'API & Automations',
      'CLOUD INFRASTRUCTURE',
    ],
    queries: [
      { text: 'custom saas platform', badge: 'SHIPPED', accent: 'yellow' },
      { text: 'internal company erp', badge: 'LIVE', accent: 'black' },
      { text: 'interactive 3d website', badge: '99/100', accent: 'black' },
      { text: 'ai workflow automation', badge: 'SHIPPED', accent: 'yellow' },
      { text: 'multi-tenant billing api', badge: 'LIVE', accent: 'black' },
    ],
    disclaimer: 'CUSTOM SOFTWARE ENGINEERING · WEBSITES · SAAS · COMPANY SYSTEMS',
  },
  contact: {
    eyebrow: 'START A BUILD',
    mutedHeadline: 'Have a website, SaaS, or system in mind?',
    boldHeadline: "Let's deploy it.",
    body: "Thirty minutes, your workflow, your goals. We'll map the fastest technical path to production — whether it's a flagship site, a SaaS product, or a custom company system.",
    primaryCta: 'Start your project',
    emailPrefix: 'or write to',
    caption: 'Clear scope. Senior engineers. You own 100% of the code.',
    mapEyebrow: 'SELECT A DEPLOYMENT REGION',
    mapHint: 'CLICK ANYWHERE ON THE MAP · DRAG TO TILT',
    cities: [
      { id: 'koeln', name: 'Frankfurt', lat: '50.11° N', lon: '8.68° E', x: 0.34, y: 0.48, avgPos: '14ms' },
      { id: 'hamburg', name: 'Hamburg', lat: '53.55° N', lon: '9.99° E', x: 0.44, y: 0.16, avgPos: '16ms' },
      { id: 'muenchen', name: 'Munich', lat: '48.14° N', lon: '11.58° E', x: 0.56, y: 0.72, avgPos: '12ms' },
      { id: 'wien', name: 'Vienna', lat: '48.21° N', lon: '16.37° E', x: 0.85, y: 0.70, avgPos: '15ms' },
      { id: 'zuerich', name: 'Zurich', lat: '47.37° N', lon: '8.54° E', x: 0.34, y: 0.84, avgPos: '11ms' },
    ],
  },
  auditForm: {
    title: 'Start your project',
    subtitle:
      'Tell us what you are building — a website, SaaS product, internal company system, or custom integration — and we will reply with a clear technical plan.',
    submitLabel: 'Send project brief',
    successTitle: 'Project brief received',
    successBody:
      'Thanks for reaching out to DEPLOY. Our engineering team will review your requirements and follow up with next steps.',
    note: 'Demo form — no external data is transmitted.',
  },
  filmModal: {
    title: 'DEPLOY — How We Engineer Software',
    subtitle: 'Jump to any chapter of our engineering story below.',
    chapters: [
      { time: '01', label: 'The Glass Lens', summary: 'Hover over DEPLOY to inspect the websites, SaaS, and systems we engineer.' },
      { time: '02', label: 'The Bottleneck & Ticket #47', summary: 'Why growing companies outgrow spreadsheets and patchwork tools.' },
      { time: '03', label: 'The Architecture & Sprint', summary: 'Clean frontend, backend, and APIs shipped weekly.' },
      { time: '04', label: 'Production & Scale', summary: 'Unified cloud systems that scale effortlessly with your business.' },
      { time: '05', label: 'DEPLOY', summary: 'Websites, SaaS platforms, and internal company systems built to ship.' },
    ],
  },
  footer: {
    servicesLinks: [
      'Websites & Web Apps',
      'SaaS Platforms',
      'Company Systems',
      'AI & Automation',
      'Integrations & APIs',
      'Cloud & DevOps',
    ],
    studioLinks: [
      { label: 'Process', href: '#process' },
      { label: 'Work', href: '#results' },
      { label: 'Contact', href: '#contact' },
    ],
    officeLines: ['Software Engineering', 'Building worldwide'],
    footnotes: [
      '¹ Illustrative engineering metrics and project examples for demonstration. Customize in src/config/siteConfig.ts.',
      '² DEPLOY builds custom websites, SaaS platforms, internal company systems, APIs, and AI workflow tools.',
    ],
    copyright: '© 2026 DEPLOY Software Engineering. All rights reserved.',
    legalLinks: [
      { id: 'impressum', label: 'Legal Notice' },
      { id: 'datenschutz', label: 'Privacy Policy' },
    ],
    replayLabel: 'Back to top',
  },
  legal: {
    impressumTitle: 'Legal Notice — DEPLOY',
    impressumBody: [
      'DEPLOY Software Engineering — Custom Websites, SaaS Platforms, Internal Company Systems & Cloud Engineering.',
      'All company details, registration numbers, and contact emails can be configured in src/config/siteConfig.ts before going live.',
    ],
    datenschutzTitle: 'Privacy Policy — DEPLOY',
    datenschutzBody: [
      'This website currently runs client-side with zero third-party tracking cookies. Form submissions are validated locally in your browser.',
      'Connect your preferred backend endpoint or CRM webhook and update this policy prior to production launch.',
    ],
  },
};
