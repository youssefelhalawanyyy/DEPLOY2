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
    locationEyebrow: 'WE BUILD, YOU LEAD',
    email: 'deployegg@gmail.com',
    tagline:
      'We build, you lead. — Websites, SaaS platforms, internal company systems and custom software.',
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
    eyebrow: 'WE BUILD, YOU LEAD · SOFTWARE STUDIO',
    headlineLine1: 'DEPLOY',
    headlineLine2: '',
    readingLabel: 'BUILDING',
    description: 'We build, you lead. — Websites, SaaS & company systems.',
    primaryCta: 'Start a project',
    secondaryCta: 'How we build',
    definition: {
      term: 'de·ploy',
      phonetic: "/dɪ'plɔɪ/",
      pos: 'verb.',
      entries: [
        'Ship software to live production.',
        'Automate how your company runs.',
        'We build, you lead.',
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
      'Templates break. Spreadsheets stall. Off-the-shelf tools slow you down. DEPLOY engineers fast websites, SaaS, and systems built to be ',
    highlightWord: 'yours',
    statementAfterHighlight: '.',
    stats: [
      {
        value: '99.9%',
        label: 'Production uptime target.',
        source: '',
      },
      {
        value: '3×',
        label: 'Faster team operations.',
        source: '',
      },
    ],
  },
  story: {
    queryText: 'deploy custom system',
    exampleBrand: 'DEPLOY Core',
    beats: [
      {
        num: '01',
        tag: 'FRICTION',
        title: 'Spreadsheets stall.',
        body: 'Manual tools hit a wall.',
      },
      {
        num: '02',
        tag: 'PATCHWORK',
        title: 'Too many tabs.',
        body: 'Disconnected apps slow every step.',
      },
      {
        num: '03',
        tag: 'BOTTLENECK',
        title: 'Lost velocity.',
        body: 'Online, yet held together with duct tape.',
      },
      {
        num: '04',
        tag: 'ENGINEERED',
        title: 'Clean architecture.',
        body: 'Rebuilt around how you work.',
      },
      {
        num: '05',
        tag: 'SPRINTS',
        title: 'Weekly deploys.',
        body: 'Live releases, every week.',
      },
      {
        num: '06',
        tag: 'LIVE',
        title: 'Version one.',
        body: 'Sub-second. Resilient. 100% yours.',
      },
      {
        num: '07',
        tag: 'SCALE',
        title: 'Traffic surges.',
        body: 'Cloud infrastructure that never blinks.',
      },
      {
        num: '08',
        tag: 'UNIFIED',
        title: 'One ecosystem.',
        body: 'Web, SaaS, and ops in sync.',
      },
    ],
    diagnosticsBefore: ['4.8S LOAD', 'SPREADSHEETS', 'SILOED'],
    diagnosticsAfter: ['0.4S LOAD', 'UNIFIED API', 'AUTOMATED'],
    zerothMorph: {
      tag: '09 · DEPLOY',
      title: 'We build, you lead.',
      subtitle: 'Websites · SaaS · Systems',
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
    eyebrow: 'IMPACT',
    badge: 'PRODUCTION SYSTEMS',
    titleLine1: 'In production.',
    titleLine2: '',
    subtitle: '',
    metrics: [
      {
        prefix: '',
        target: 99,
        suffix: '.9%',
        label: 'System uptime',
        sublabel: 'Monitored 24/7',
      },
      {
        target: 4,
        suffix: '×',
        label: 'Faster workflows',
        sublabel: 'Unified ops',
      },
      {
        target: 14,
        suffix: 'd',
        label: 'First live preview',
        sublabel: 'Weekly sprints',
      },
    ],
    cases: [
      {
        client: 'RETAIL ERP',
        city: 'INTERNAL SYSTEM',
        summary: '14 spreadsheets → 1 real-time vault & AI command hub.',
        pill: 'ERP · LIVE',
      },
      {
        client: 'ARMIA BOUTIQUE',
        city: 'E-COMMERCE & PWA',
        summary: 'Bilingual luxury storefront, Shop-the-Look & admin suite.',
        pill: 'PWA · 99/100',
      },
      {
        client: 'HOSPITALITY SUITE',
        city: 'F&B POS SAAS',
        summary: 'Touch POS terminal, kitchen sync & live profit telemetry.',
        pill: 'SAAS · LIVE',
      },
    ],
    footnote: '',
  },
  process: {
    eyebrow: 'PROCESS',
    titleLine1: 'Four steps.',
    titleLine2: 'Zero fluff.',
    subtitle: 'Clear architecture. Weekly live links.',
    dipNote: 'DATA MIGRATED SAFELY',
    steps: [
      {
        num: '01',
        title: 'Scope',
        timeframe: 'WEEK 1',
        body: 'Architecture & milestones mapped.',
        deliverable: 'System Blueprint',
        position: 'below',
      },
      {
        num: '02',
        title: 'Prototype',
        timeframe: 'WEEKS 2–3',
        body: 'Interactive UI & schema validated.',
        deliverable: 'Live Prototype',
        position: 'above',
      },
      {
        num: '03',
        title: 'Build',
        timeframe: 'WEEKS 4–8',
        body: 'Shipped to staging every week.',
        deliverable: 'Weekly Deploys',
        position: 'below',
      },
      {
        num: '04',
        title: 'Launch',
        timeframe: 'ONGOING',
        body: 'Zero-downtime deploy & scale.',
        deliverable: '100% Code Ownership',
        position: 'above',
      },
    ],
  },
  clients: {
    eyebrow: 'CAPABILITIES',
    title: 'Websites · SaaS · Systems',
    names: [
      'Flagship Websites',
      'SAAS PLATFORMS',
      'Enterprise ERPs',
      'CLIENT PORTALS',
      'AI Automations',
      'CLOUD INFRA',
    ],
    queries: [
      { text: 'we build, you lead', badge: 'DEPLOY', accent: 'yellow' },
      { text: 'custom saas', badge: 'SHIPPED', accent: 'black' },
      { text: 'company erp', badge: 'LIVE', accent: 'black' },
      { text: '3d websites', badge: '99/100', accent: 'yellow' },
      { text: 'ai copilot', badge: 'SHIPPED', accent: 'black' },
      { text: 'pos systems', badge: 'LIVE', accent: 'black' },
    ],
    disclaimer: 'WE BUILD, YOU LEAD · WEBSITES · SAAS · SYSTEMS',
  },
  contact: {
    eyebrow: 'WE BUILD, YOU LEAD',
    mutedHeadline: 'Ready to build?',
    boldHeadline: "Let's deploy.",
    body: 'Websites, SaaS, or internal systems — scoped in 30 minutes.',
    primaryCta: 'Start your project',
    emailPrefix: 'or',
    caption: 'We build, you lead. · 100% code ownership.',
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
    note: 'Direct inquiries routed to deployegg@gmail.com.',
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
    officeLines: ['We Build, You Lead.', 'Software Engineering', 'Building worldwide'],
    footnotes: [],
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
      'Direct studio inquiries: deployegg@gmail.com',
    ],
    datenschutzTitle: 'Privacy Policy — DEPLOY',
    datenschutzBody: [
      'This website uses zero third-party tracking cookies. Project inquiries submitted through the configurator are used solely to scope and reply to your build request.',
      'For data or privacy inquiries, contact deployegg@gmail.com.',
    ],
  },
};
