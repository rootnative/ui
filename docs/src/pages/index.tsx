import Link from '@docusaurus/Link'
import useBaseUrl from '@docusaurus/useBaseUrl'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import { useRef, useState, type ReactNode } from 'react'
import styles from './index.module.css'

const HIDE_SCROLLBAR_CSS = `
  ::-webkit-scrollbar { width: 0 !important; height: 0 !important; display: none !important; }
  * { scrollbar-width: none !important; -ms-overflow-style: none !important; }
`

function injectStylesIntoIframe(iframe: HTMLIFrameElement) {
  try {
    const doc = iframe.contentDocument
    if (!doc || doc.getElementById('docs-embed-style')) return
    const style = doc.createElement('style')
    style.id = 'docs-embed-style'
    style.textContent = HIDE_SCROLLBAR_CSS
    doc.head.appendChild(style)
  } catch {
    /* cross-origin — ignore */
  }
}

/* ---------------------------------- icons --------------------------------- */

type IconProps = { className?: string }

function stroke(children: ReactNode) {
  return function Icon({ className }: IconProps) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    )
  }
}

const IconTheme = stroke(
  <>
    <circle cx="13.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="10.5" r="2.5" />
    <circle cx="8.5" cy="7.5" r="2.5" />
    <circle cx="6.5" cy="12.5" r="2.5" />
    <path d="M12 22a10 10 0 1 1 0-20c4.5 0 8 2.5 8 6 0 3-2 4-4 4h-2a2 2 0 0 0-1 3.7A2 2 0 0 1 12 22Z" />
  </>,
)

const IconPackage = stroke(
  <>
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="M3.3 7 12 12l8.7-5" />
    <path d="M12 22V12" />
  </>,
)

const IconAccessible = stroke(
  <>
    <circle cx="12" cy="4.5" r="1.8" />
    <path d="M4.5 8.5c2.5 1 5 1.5 7.5 1.5s5-.5 7.5-1.5" />
    <path d="M12 10v5" />
    <path d="m9 21 3-6 3 6" />
  </>,
)

const IconTypeScript = stroke(
  <>
    <path d="m8 8-4 4 4 4" />
    <path d="m16 8 4 4-4 4" />
    <path d="m13.5 6-3 12" />
  </>,
)

const IconCustomize = stroke(
  <>
    <path d="M4 6h10" />
    <path d="M18 6h2" />
    <circle cx="16" cy="6" r="2" />
    <path d="M4 12h4" />
    <path d="M12 12h8" />
    <circle cx="10" cy="12" r="2" />
    <path d="M4 18h10" />
    <path d="M18 18h2" />
    <circle cx="16" cy="18" r="2" />
  </>,
)

const IconTerminal = stroke(
  <>
    <path d="m5 8 4 4-4 4" />
    <path d="M12 16h7" />
    <rect x="2.5" y="3.5" width="19" height="17" rx="2.5" />
  </>,
)

const IconCopy = stroke(
  <>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2" />
  </>,
)

const IconCheck = stroke(<path d="m4 12 5 5L20 6" />)

/* ------------------------------ copy command ------------------------------ */

function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false)

  const onCopy = () => {
    navigator.clipboard?.writeText(command).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <button
      type="button"
      className={styles.copyCommand}
      onClick={onCopy}
      aria-label="Copy install command"
    >
      <span className={styles.copyPrompt}>$</span>
      <code className={styles.copyText}>{command}</code>
      <span className={styles.copyIcon}>
        {copied ? (
          <IconCheck className={styles.copyGlyph} />
        ) : (
          <IconCopy className={styles.copyGlyph} />
        )}
      </span>
    </button>
  )
}

/* ---------------------------------- hero ---------------------------------- */

function Hero() {
  const demoUrl = useBaseUrl('/demo/')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  return (
    <header className={styles.hero}>
      <div className={styles.heroGrid} aria-hidden="true" />
      <div className={styles.heroInner}>
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>
            Material Design 3 · React Native
          </span>
          <h1 className={styles.heroTitle}>
            Beautiful React Native apps, out of the box.
          </h1>
          <p className={styles.heroTagline}>
            A design-system agnostic component library. Ships with Material
            Design 3, works with Expo and bare React Native, and stays out of
            your way when you want to customize.
          </p>
          <div className={styles.heroCtas}>
            <Link className={styles.ctaPrimary} to="/introduction">
              Get Started
            </Link>
            <Link className={styles.ctaSecondary} to="/components/button">
              Browse Components
            </Link>
          </div>
          <CopyCommand command="npx rootnative create my-app" />
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.phoneFrame} aria-label="Live demo preview">
            <div className={styles.phoneNotch} />
            <iframe
              ref={iframeRef}
              src={demoUrl}
              title="RootNative UI live demo"
              className={styles.phoneScreen}
              loading="lazy"
              onLoad={() => {
                if (iframeRef.current) injectStylesIntoIframe(iframeRef.current)
              }}
            />
          </div>
          <Link
            className={styles.demoOpenLink}
            href={demoUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open live demo ↗
          </Link>
        </div>
      </div>
    </header>
  )
}

/* --------------------------------- stats ---------------------------------- */

const stats = [
  { value: '16', label: 'Components' },
  { value: '100%', label: 'TypeScript' },
  { value: '0', label: 'Config theming' },
  { value: 'MIT', label: 'Licensed' },
]

function Stats() {
  return (
    <section className={styles.stats}>
      <div className={styles.statsInner}>
        {stats.map((s) => (
          <div key={s.label} className={styles.statItem}>
            <span className={styles.statValue}>{s.value}</span>
            <span className={styles.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* -------------------------------- features -------------------------------- */

const features = [
  {
    title: 'Design-system agnostic',
    description:
      'Use Material Design 3 out of the box, build your own theme system, or mix both. The theme engine adapts to your design language.',
    Icon: IconTheme,
  },
  {
    title: 'Tree-shakeable',
    description:
      'Every component has its own subpath export. Import only what you use — your bundle stays lean.',
    Icon: IconPackage,
  },
  {
    title: 'Accessible by default',
    description:
      'Proper roles, labels, and accessibility states baked into every component. No extra configuration needed.',
    Icon: IconAccessible,
  },
  {
    title: 'TypeScript first',
    description:
      'Strict types, full IntelliSense, and autocomplete for every prop, theme token, and style override.',
    Icon: IconTypeScript,
  },
  {
    title: 'Customizable at every level',
    description:
      'Override colors, styles, and variants across theme defaults, component props, or direct style overrides.',
    Icon: IconCustomize,
  },
  {
    title: 'CLI scaffolding',
    description:
      'Copy components directly into your project with the rootnative CLI. Own your code, customize freely.',
    Icon: IconTerminal,
  },
]

function Features() {
  return (
    <section className={styles.features}>
      <div className={styles.sectionInner}>
        <span className={styles.sectionEyebrow}>Why RootNative</span>
        <h2 className={styles.sectionTitle}>
          Everything you need to ship, nothing you don&apos;t.
        </h2>
        <div className={styles.featuresGrid}>
          {features.map(({ title, description, Icon }) => (
            <div key={title} className={styles.featureCard}>
              <div className={styles.featureIcon}>
                <Icon className={styles.featureGlyph} />
              </div>
              <h3 className={styles.featureTitle}>{title}</h3>
              <p className={styles.featureDescription}>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ how it works ------------------------------ */

const steps = [
  {
    number: '01',
    title: 'Create',
    description: 'Scaffold a new Expo project with everything pre-configured.',
    command: 'npx rootnative create my-app',
  },
  {
    number: '02',
    title: 'Add',
    description:
      'Pick the components you need. They get copied into your project.',
    command: 'npx rootnative add button card',
  },
  {
    number: '03',
    title: 'Build',
    description: 'Own the code. Customize freely. Ship with confidence.',
    command: 'npx expo start',
  },
]

function HowItWorks() {
  return (
    <section className={styles.howItWorks}>
      <div className={styles.sectionInner}>
        <span className={styles.sectionEyebrow}>Get started</span>
        <h2 className={styles.sectionTitle}>Up and running in three steps.</h2>
        <div className={styles.stepsGrid}>
          {steps.map((step) => (
            <div key={step.number} className={styles.stepCard}>
              <span className={styles.stepNumber}>{step.number}</span>
              <h3 className={styles.stepTitle}>{step.title}</h3>
              <p className={styles.stepDescription}>{step.description}</p>
              <code className={styles.stepCommand}>{step.command}</code>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------ code preview ------------------------------ */

function CodePreview() {
  return (
    <section className={styles.codePreview}>
      <div className={styles.codePreviewInner}>
        <div className={styles.codePreviewText}>
          <span className={styles.sectionEyebrow}>Developer experience</span>
          <h2 className={styles.sectionTitle}>Simple API, powerful results.</h2>
          <p className={styles.sectionLead}>
            Theme-aware components with a clean, intuitive API. Wrap your app
            once and start building — every prop is typed and autocompletes.
          </p>
          <Link className={styles.ctaPrimary} to="/introduction">
            Read the Docs
          </Link>
        </div>
        <div className={styles.codePreviewCode}>
          <div className={styles.codeHeader}>
            <span className={styles.codeDot} data-color="red" />
            <span className={styles.codeDot} data-color="yellow" />
            <span className={styles.codeDot} data-color="green" />
            <span className={styles.codeFilename}>App.tsx</span>
          </div>
          <pre className={styles.codePre}>
            <code>
              <span className={styles.codeKeyword}>import</span>
              {' { ThemeProvider } '}
              <span className={styles.codeKeyword}>from</span>
              {" '@rootnative/core'\n"}
              <span className={styles.codeKeyword}>import</span>
              {' { Button } '}
              <span className={styles.codeKeyword}>from</span>
              {" '@rootnative/components/button'\n\n"}
              <span className={styles.codeKeyword}>export default</span>{' '}
              <span className={styles.codeFunction}>function</span>
              {' App() {\n'}
              {'  '}
              <span className={styles.codeKeyword}>return</span>
              {' (\n'}
              {'    <'}
              <span className={styles.codeTag}>ThemeProvider</span>
              {'>\n'}
              {'      <'}
              <span className={styles.codeTag}>Button</span>
              {'\n'}
              {'        '}
              <span className={styles.codeProp}>variant</span>
              {'='}
              <span className={styles.codeString}>&quot;filled&quot;</span>
              {'\n'}
              {'        '}
              <span className={styles.codeProp}>onPress</span>
              {'={() => console.log('}
              <span className={styles.codeString}>&apos;Hello!&apos;</span>
              {')}\n'}
              {'      >\n'}
              {'        Get Started\n'}
              {'      </'}
              <span className={styles.codeTag}>Button</span>
              {'>\n'}
              {'    </'}
              <span className={styles.codeTag}>ThemeProvider</span>
              {'>\n'}
              {'  )\n'}
              {'}'}
            </code>
          </pre>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------- bottom cta ------------------------------- */

function BottomCta() {
  return (
    <section className={styles.bottomCta}>
      <div className={styles.bottomCtaInner}>
        <h2 className={styles.bottomCtaTitle}>Ready to build?</h2>
        <p className={styles.bottomCtaText}>
          Get up and running in minutes with the CLI, or install the packages
          directly into an existing app.
        </p>
        <div className={styles.heroCtas}>
          <Link className={styles.ctaPrimary} to="/quick-start">
            Quick Start
          </Link>
          <Link className={styles.ctaSecondary} to="/installation">
            Installation Guide
          </Link>
        </div>
      </div>
    </section>
  )
}

export default function Home(): React.ReactNode {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <Hero />
      <main>
        <Stats />
        <Features />
        <HowItWorks />
        <CodePreview />
        <BottomCta />
      </main>
    </Layout>
  )
}
