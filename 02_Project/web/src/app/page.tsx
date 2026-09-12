import { Inter } from "next/font/google";
import { SmoothScrollProvider } from "@/lib/smooth-scroll";
import { AbstractBackground } from "@/components/marketing/abstract-background";
import { SiteNav } from "@/components/marketing/site-nav";
import { CtaButton } from "@/components/marketing/cta-button";
import { BezelCard } from "@/components/marketing/bezel-card";
import { RevealSection } from "@/components/marketing/reveal-section";
import { HeroHeadline } from "@/components/marketing/hero-headline";
import { ScrambleLine } from "@/components/marketing/scramble-heading";
import { LiveDecisionFeed } from "@/components/marketing/live-decision-feed";
import { StatCounter } from "@/components/marketing/stat-counter";
import { HeroScene } from "@/components/marketing/hero-scene";
import { SystemFlowchart } from "@/components/marketing/system-flowchart";
import { TermsModal } from "@/components/terms-modal";

const inter = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

function Eyebrow({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <span
      data-reveal
      className="inline-flex items-center gap-2 text-[14px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]"
    >
      <span className="text-[var(--mute)]">Signal {n} —</span> {children}
    </span>
  );
}

const MISSED = [
  "A stockout you only hear about when a customer asks where their order is",
  "A supplier's lead time quietly drifting for weeks before it becomes a crisis",
  "Hours spent scanning spreadsheets, hoping to notice a problem before it lands",
  "Reordering decisions made on gut feel, not on evidence you can point to",
];

const GAINED = [
  "Weeks of advance notice before a supplier delay turns into a stockout",
  "One ranked queue of what actually needs attention today — not everything",
  "Time back — no more daily manual checks across suppliers and stock",
  "A recommendation you can defend, with the evidence attached to it",
];

const ROADMAP = [
  { status: "Live", title: "Supplier lead-time drift detection", body: "The core MVP wedge — catching a slowing supplier before it causes a stockout." },
  { status: "Live", title: "Evidence-backed action queue", body: "Every recommendation ships with its inputs, confidence, and the baseline it beat." },
  { status: "In progress", title: "Expanding the signal library", body: "More early-warning signals beyond lead-time drift, built on the same audited approach." },
];

const SEGMENTS = [
  { title: "Small e-commerce", body: "Keep bestsellers in stock without babysitting a spreadsheet daily." },
  { title: "Distributors", body: "Catch a slipping supplier before a customer notices a late shipment." },
  { title: "Manufacturers", body: "See raw-material risk building before it stalls the production line." },
  { title: "Retail chains", body: "One view across locations instead of checking each store by hand." },
  { title: "Import / export", body: "Long lead times make early warning worth the most — see delays coming." },
];

export default function HomePage() {
  return (
    <div className={`${inter.variable} theme-volt font-[family-name:var(--font-display)]`}>
      <SmoothScrollProvider>
        <main className="relative overflow-x-clip">
          <AbstractBackground />
          <SiteNav />

          {/* Hero — text on the left, the approve/restock scene on the
              right next to it (the human-in-the-loop story, shown instead
              of told). The big warehouse/truck/shop scene stays as a
              quiet background layer beneath both. Sized to the first
              viewport so the CTA is always visible on load. */}
          <section className="relative z-10 flex min-h-screen items-center overflow-hidden px-4 py-28 sm:px-10">
            <HeroScene />
            <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 sm:grid-cols-2">
              <div className="max-w-md">
                <ScrambleLine
                  text="DETECT · EXPLAIN · RECOMMEND · TRACK"
                  className="text-[14px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]"
                />
                <HeroHeadline className="mt-5 text-[40px] font-normal leading-[1.05] tracking-[-0.02em] text-balance text-[var(--bone-strong)] sm:text-[60px] sm:leading-[1]">
                  Know what happens{" "}
                  <span style={{ color: "var(--accent)" }}>next.</span>
                </HeroHeadline>
                <p className="page-intro page-intro-delay-1 mt-6 text-balance text-base text-[var(--bone-dim)]">
                  Right now, you probably find out about a stockout the day a
                  customer asks where their order is. By then it&apos;s
                  already cost you a sale. We watch your suppliers and your
                  stock every day, so you find out weeks earlier — while
                  there&apos;s still time to do something about it.
                </p>
                <div className="page-intro page-intro-delay-2 mt-8 flex">
                  <CtaButton href="/login" size="lg">
                    Request access
                  </CtaButton>
                </div>
              </div>

              <div className="page-intro page-intro-delay-2 rounded-2xl border border-[var(--line)] bg-[var(--void-2)] p-6 shadow-[0_40px_100px_-30px_rgba(0,0,0,0.8)]">
                <SystemFlowchart />
              </div>
            </div>
          </section>

          {/* What changes — before/after, and what we're building */}
          <section className="relative z-10 px-4 py-24 sm:py-32">
            <div className="mx-auto max-w-5xl">
              <RevealSection className="mx-auto max-w-xl text-center">
                <div data-reveal><Eyebrow n="00">The change</Eyebrow></div>
                <h2 data-reveal className="mt-4 text-[28px] font-normal tracking-[-0.02em] text-balance text-[var(--bone-strong)] sm:text-[36px]">
                  What you&apos;ve been missing — and what changes now.
                </h2>
                <p data-reveal className="mt-4 text-[var(--bone-dim)]">
                  Foresight is a daily watch on your stock and suppliers,
                  built for teams too busy to watch it themselves. Here&apos;s
                  the difference it makes.
                </p>
              </RevealSection>

              <RevealSection className="mt-14 grid gap-5 sm:grid-cols-2" stagger={0.1}>
                <div data-reveal data-reveal-x={-28}>
                  <BezelCard className="h-full">
                    <div className="h-full p-7">
                      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--bone-dim)]">
                        Without Foresight
                      </p>
                      <ul className="mt-5 space-y-3.5">
                        {MISSED.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-sm">
                            <svg viewBox="0 0 16 16" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--bone-dim)]">
                              <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                            </svg>
                            <span className="text-[var(--bone)]/70">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </BezelCard>
                </div>

                <div data-reveal data-reveal-x={28}>
                  <BezelCard className="h-full" emphasis>
                    <div className="h-full p-7">
                      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--accent)]">
                        With Foresight
                      </p>
                      <ul className="mt-5 space-y-3.5">
                        {GAINED.map((item) => (
                          <li key={item} className="flex items-start gap-2.5 text-sm">
                            <svg viewBox="0 0 16 16" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]">
                              <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-[var(--bone)]">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </BezelCard>
                </div>
              </RevealSection>

              <RevealSection className="mt-16" stagger={0.1}>
                <div data-reveal className="text-center">
                  <span className="text-[14px] font-semibold uppercase tracking-[0.18em] text-[var(--mute)]">
                    What we&apos;re building
                  </span>
                </div>
                <div className="mt-8 grid gap-5 sm:grid-cols-3">
                  {ROADMAP.map((item, i) => (
                    <div key={item.title} data-reveal data-reveal-x={i % 2 === 0 ? -20 : 20}>
                      <BezelCard className="h-full">
                        <div className="h-full space-y-2.5 p-6">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${
                              item.status === "Live"
                                ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                                : "bg-[var(--bone)]/10 text-[var(--mute)]"
                            }`}
                          >
                            {item.status}
                          </span>
                          <h3 className="text-[20px] font-semibold text-[var(--bone-strong)]">{item.title}</h3>
                          <p className="text-sm text-[var(--bone-dim)]">{item.body}</p>
                        </div>
                      </BezelCard>
                    </div>
                  ))}
                </div>
              </RevealSection>
            </div>
          </section>

          {/* How we actually work — the real pipeline, not an abstract diagram */}
          <section id="how-it-works" className="relative z-10 border-t border-dashed border-[rgba(140,148,166,0.35)] px-4 py-24 sm:py-32">
            <div className="mx-auto max-w-6xl">
              <RevealSection className="mx-auto max-w-xl text-center">
                <Eyebrow n="01">How we work</Eyebrow>
                <h2 data-reveal className="mt-4 text-[28px] font-normal tracking-[-0.02em] text-balance text-[var(--bone-strong)] sm:text-[36px]">
                  Your data is messy. What comes out the other side isn&apos;t.
                </h2>
                <p data-reveal className="mt-4 text-[var(--bone-dim)]">
                  Orders, inventory, supplier records — scattered and noisy
                  going in. Foresight resolves it into a handful of clear
                  things worth acting on.
                </p>
              </RevealSection>

              <RevealSection className="mt-16" stagger={0.08}>
                <LiveDecisionFeed />
              </RevealSection>
            </div>
          </section>

          {/* Proof — real numbers from the validation dataset */}
          <section className="relative z-10 border-t border-dashed border-[rgba(140,148,166,0.35)] px-4 py-16 sm:py-20">
            <RevealSection className="mx-auto max-w-4xl" stagger={0.08}>
              <div data-reveal className="text-center">
                <span className="text-[14px] font-semibold uppercase tracking-[0.18em] text-[var(--mute)]">
                  Proven before you ever see it
                </span>
              </div>
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  { value: 180519, suffix: "", label: "real order records analyzed" },
                  { value: 51, suffix: "", label: "product categories covered" },
                  { value: 6, suffix: "/6", label: "engineered risk signals caught" },
                  { value: 0, suffix: "", label: "false positives raised" },
                ].map((stat) => (
                  <div key={stat.label} data-reveal>
                    <BezelCard className="h-full">
                      <div className="flex h-full flex-col items-center justify-center gap-1.5 px-4 py-7 text-center">
                        <div className="font-mono text-3xl font-semibold text-[var(--accent)] sm:text-4xl">
                          <StatCounter value={stat.value} suffix={stat.suffix} />
                        </div>
                        <p className="text-xs text-[var(--bone-dim)]">{stat.label}</p>
                      </div>
                    </BezelCard>
                  </div>
                ))}
              </div>
              <p data-reveal className="mx-auto mt-8 max-w-md text-center text-xs text-[var(--bone-dim)]">
                Verified during development against a real supply-chain
                dataset, not simulated for this page. See the same detection
                logic run on your own data next.
              </p>
            </RevealSection>
          </section>

          {/* Evidence / credibility */}
          <section id="evidence" className="relative z-10 border-t border-dashed border-[rgba(140,148,166,0.35)] px-4 py-24 sm:py-32">
            <div className="mx-auto grid max-w-5xl items-center gap-12 sm:grid-cols-2">
              <RevealSection stagger={0.1}>
                <div data-reveal><Eyebrow n="02">No black box</Eyebrow></div>
                <h2 data-reveal className="mt-4 text-[28px] font-normal tracking-[-0.02em] text-balance text-[var(--bone-strong)] sm:text-[36px]">
                  You&apos;re right not to trust a black box. So we don&apos;t build one.
                </h2>
                <p data-reveal className="mt-4 text-[var(--bone-dim)]">
                  No paid AI making the call quietly in the background. Every
                  time we flag something, you see the plain math behind it —
                  right next to the simple baseline it&apos;s being measured
                  against — so you&apos;re never just asked to take our word
                  for it.
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  {[
                    "The simple math is shown, not hidden",
                    "Low-confidence signals become “monitor,” never a false alarm",
                    "Every past recommendation is tracked against what actually happened",
                  ].map((item) => (
                    <li key={item} data-reveal className="flex items-start gap-2.5">
                      <svg viewBox="0 0 16 16" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]">
                        <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="text-[var(--bone)]/80">{item}</span>
                    </li>
                  ))}
                </ul>
              </RevealSection>

              <RevealSection>
                <div data-reveal>
                  <BezelCard>
                    <div className="space-y-4 p-6">
                      <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--bone-dim)]">
                        Baseline vs. advanced
                      </p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[var(--bone-dim)]">Baseline (robust z-score)</span>
                          <span className="font-mono text-xs text-[var(--bone)]">6.3</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--line)]">
                          <div className="h-full w-[63%] rounded-full bg-[var(--bone-dim)]" />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[var(--bone-dim)]">Advanced model</span>
                          <span className="font-mono text-xs text-[var(--bone)]">6.5</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--line)]">
                          <div className="h-full w-[65%] rounded-full bg-[var(--accent)]" />
                        </div>
                      </div>
                      <p className="text-xs text-[var(--bone-dim)]">
                        When the advanced model barely improves on the
                        baseline, we keep the simpler one — it&apos;s the more
                        defensible answer.
                      </p>
                    </div>
                  </BezelCard>
                </div>
              </RevealSection>
            </div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="relative z-10 border-t border-dashed border-[rgba(140,148,166,0.35)] px-4 py-24 sm:py-32">
            <div className="mx-auto max-w-5xl">
              <RevealSection className="mx-auto max-w-xl text-center">
                <span className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent)]">Pricing</span>
                <h2 className="mt-4 text-[28px] font-normal tracking-[-0.02em] text-balance text-[var(--bone-strong)] sm:text-[36px]">
                  Simple pricing, no free tier to outgrow.
                </h2>
                <p className="mt-4 text-[var(--bone-dim)]">
                  One plan for a single location, one for a growing operation,
                  one for teams that need it built around them.
                </p>
              </RevealSection>

              <RevealSection className="mt-14 grid gap-6 sm:grid-cols-3" stagger={0.08}>
                {[
                  {
                    name: "Starter",
                    price: 20,
                    tagline: "For one location watching one signal.",
                    features: ["Supplier lead-time drift detection", "Evidence-backed action queue", "One warehouse / location"],
                    emphasis: false,
                  },
                  {
                    name: "Growth",
                    price: 100,
                    tagline: "For a growing operation across suppliers.",
                    features: ["Everything in Starter", "Multiple suppliers & locations", "Urgent-signal email alerts"],
                    emphasis: true,
                  },
                  {
                    name: "Enterprise",
                    price: 200,
                    tagline: "For teams that need it shaped around them.",
                    features: ["Everything in Growth", "Priority support", "Custom onboarding"],
                    emphasis: false,
                  },
                ].map((plan) => (
                  <div key={plan.name} data-reveal>
                    <div
                      className={
                        plan.emphasis
                          ? "flex h-full flex-col rounded-[8px] bg-[var(--void-2)] p-7 text-[var(--bone)] border-2 border-[var(--accent)]"
                          : "flex h-full flex-col rounded-[8px] bg-[var(--void-2)] p-7 border border-[var(--line)]"
                      }
                    >
                      {plan.emphasis && (
                        <span className="mb-4 w-fit rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--void)]">
                          Most popular
                        </span>
                      )}
                      <p className="text-sm font-semibold uppercase tracking-wide text-[var(--bone-dim)]">{plan.name}</p>
                      <p className="mt-2 flex items-baseline gap-1">
                        <span className="font-mono text-4xl font-semibold tracking-tight text-[var(--bone-strong)]">${plan.price}</span>
                        <span className="text-sm text-[var(--bone-dim)]">/month</span>
                      </p>
                      <p className="mt-2 text-sm text-[var(--bone-dim)]">{plan.tagline}</p>
                      <ul className="mt-6 space-y-3 text-sm">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5">
                            <svg viewBox="0 0 16 16" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]">
                              <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="text-[var(--bone)]/80">{f}</span>
                          </li>
                        ))}
                      </ul>
                      <a
                        href="/login"
                        className={
                          plan.emphasis
                            ? "mt-7 block rounded-[6px] bg-[var(--accent)] py-3 text-center text-sm font-medium text-[var(--void)] shadow-[0_0_30px_-10px_var(--accent-dim)] transition-all hover:brightness-110"
                            : "mt-7 block rounded-[6px] border border-[var(--line)] py-3 text-center text-sm font-medium text-[var(--bone)] transition-all hover:bg-[var(--bone)]/[0.05]"
                        }
                      >
                        Request access
                      </a>
                    </div>
                  </div>
                ))}
              </RevealSection>
            </div>
          </section>

          {/* Who it's for */}
          <section id="who-its-for" className="relative z-10 border-t border-dashed border-[rgba(140,148,166,0.35)] px-4 py-24 sm:py-32">
            <div className="mx-auto max-w-5xl">
              <RevealSection className="mx-auto max-w-xl text-center">
                <div data-reveal><Eyebrow n="03">Built for</Eyebrow></div>
                <h2 data-reveal className="mt-4 text-[28px] font-normal tracking-[-0.02em] text-balance text-[var(--bone-strong)] sm:text-[36px]">
                  If any of this sounds familiar, we built this for you.
                </h2>
              </RevealSection>

              <RevealSection className="mt-14 grid gap-5 sm:grid-cols-6" stagger={0.1}>
                {SEGMENTS.map((seg, i) => (
                  <div
                    key={seg.title}
                    data-reveal
                    data-reveal-x={i % 2 === 0 ? -20 : 20}
                    className={i < 2 ? "sm:col-span-3" : "sm:col-span-2"}
                  >
                    <BezelCard className="h-full">
                      <div className="h-full p-6">
                        <h3 className="text-[20px] font-semibold text-[var(--bone-strong)]">{seg.title}</h3>
                        <p className="mt-2 text-sm text-[var(--bone-dim)]">{seg.body}</p>
                      </div>
                    </BezelCard>
                  </div>
                ))}
              </RevealSection>
            </div>
          </section>

          {/* Closing CTA */}
          <section className="relative z-10 border-t border-dashed border-[rgba(140,148,166,0.35)] px-4 pb-32 pt-24">
            <RevealSection className="mx-auto max-w-2xl text-center">
              <h2 data-reveal className="text-[28px] font-normal tracking-[-0.02em] text-balance text-[var(--bone-strong)] sm:text-[36px]">
                Bring your own data. Let&apos;s see what it&apos;s been trying to tell you.
              </h2>
              <p data-reveal className="mx-auto mt-4 max-w-md text-[var(--bone-dim)]">
                Access is reviewed before use, not because we want to be
                precious about it — we&apos;d just rather get this right for
                a few real teams than open the doors to everyone at once.
                Request access and we&apos;ll follow up.
              </p>
              <div data-reveal className="mt-8 flex justify-center">
                <CtaButton href="/login" size="lg">
                  Request access
                </CtaButton>
              </div>
            </RevealSection>
          </section>

          <footer className="relative z-10 border-t border-[var(--line)] px-4 py-8 text-center font-mono text-xs text-[var(--bone-dim)]">
            <p>Foresight — private beta. Access is reviewed before use.</p>
            <p className="mt-2">
              <TermsModal />
            </p>
          </footer>
        </main>
      </SmoothScrollProvider>
    </div>
  );
}
