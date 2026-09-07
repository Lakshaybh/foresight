import { SiteNav } from "@/components/marketing/site-nav";
import { CtaButton } from "@/components/marketing/cta-button";
import { BezelCard } from "@/components/marketing/bezel-card";
import { ProductPreview } from "@/components/marketing/product-preview";
import { Reveal } from "@/components/marketing/reveal";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-primary">
      {children}
    </span>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Connect your data",
    body: "Upload the spreadsheet you already have — orders, inventory, supplier history. No integration project required.",
  },
  {
    n: "02",
    title: "We watch it daily",
    body: "Every supplier and every stock level, checked continuously against its own history for early warning signs.",
  },
  {
    n: "03",
    title: "You decide what to do",
    body: "A ranked recommendation with evidence attached. You approve, reject, or snooze — the system never acts alone.",
  },
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
    <main className="overflow-x-clip bg-background">
      <SiteNav />

      {/* Hero */}
      <section className="relative px-4 pt-40 pb-24 sm:pt-48 sm:pb-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] bg-[radial-gradient(60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary),transparent_88%),transparent)]"
        />
        <div className="mx-auto max-w-3xl text-center">
          <Reveal>
            <Eyebrow>Operational decision intelligence</Eyebrow>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight text-balance sm:text-7xl">
              Know what happens next.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground">
              See emerging operational risks, understand why they&apos;re
              forming, and decide what to do — before they become expensive
              problems.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <div className="mt-9 flex justify-center">
              <CtaButton href="/login" size="lg">
                Request access
              </CtaButton>
            </div>
          </Reveal>
        </div>

        <Reveal delay={320} className="mx-auto mt-20 max-w-4xl">
          <ProductPreview />
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Illustrative example — evidence, confidence, and recommended action for one signal.
          </p>
        </Reveal>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mx-auto max-w-xl text-center">
            <Eyebrow>The platform</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              One workflow, running quietly every day.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 120}>
                <BezelCard className="h-full">
                  <div className="flex h-full flex-col p-6">
                    <span className="font-mono text-xs text-primary">{step.n}</span>
                    <h3 className="mt-3 font-medium">{step.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                </BezelCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Evidence / credibility */}
      <section id="evidence" className="px-4 py-24 sm:py-32">
        <div className="mx-auto grid max-w-5xl items-center gap-12 sm:grid-cols-2">
          <Reveal>
            <Eyebrow>No black box</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Every recommendation shows its evidence.
            </h2>
            <p className="mt-4 text-muted-foreground">
              No paid AI making the call quietly in the background. Plain
              statistics, shown next to the simple baseline they&apos;re
              measured against — so you can always see why the system flagged
              something, not just that it did.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "The simple math is shown, not hidden",
                "Low-confidence signals become “monitor,” never a false alarm",
                "Every past recommendation is tracked against what actually happened",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <svg viewBox="0 0 16 16" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-primary">
                    <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-foreground/80">{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={150}>
            <BezelCard>
              <div className="space-y-4 p-6">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                  Baseline vs. advanced
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Baseline (robust z-score)</span>
                    <span className="font-mono text-xs">6.3</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/5">
                    <div className="h-full w-[63%] rounded-full bg-black/20" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Advanced model</span>
                    <span className="font-mono text-xs">6.5</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/5">
                    <div className="h-full w-[65%] rounded-full bg-primary" />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  When the advanced model barely improves on the baseline, we
                  keep the simpler one — it&apos;s the more defensible answer.
                </p>
              </div>
            </BezelCard>
          </Reveal>
        </div>
      </section>

      {/* Human control — contrast band */}
      <section className="px-4 py-24 sm:py-32">
        <Reveal className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-foreground px-8 py-16 text-center sm:px-16">
          <Eyebrow>Always your call</Eyebrow>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-background sm:text-4xl">
            The system recommends. You decide.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-background/70">
            Nothing is ever executed automatically. Every recommendation waits
            for a person to approve, reject, or snooze it — and every decision
            is recorded so you can see whether it actually helped.
          </p>
        </Reveal>
      </section>

      {/* Who it's for */}
      <section id="who-its-for" className="px-4 py-24 sm:py-32">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mx-auto max-w-xl text-center">
            <Eyebrow>Built for</Eyebrow>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Teams with real stock and real suppliers.
            </h2>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-6">
            {SEGMENTS.map((seg, i) => (
              <Reveal
                key={seg.title}
                delay={i * 90}
                className={i < 2 ? "sm:col-span-3" : "sm:col-span-2"}
              >
                <BezelCard className="h-full">
                  <div className="h-full p-6">
                    <h3 className="font-medium">{seg.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{seg.body}</p>
                  </div>
                </BezelCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="px-4 pb-32 pt-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            See it on your own data.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Access is reviewed before use — request an account and we&apos;ll
            follow up.
          </p>
          <div className="mt-8 flex justify-center">
            <CtaButton href="/login" size="lg">
              Request access
            </CtaButton>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-black/5 px-4 py-8 text-center text-xs text-muted-foreground">
        Foresight — private beta. Access is reviewed before use.
      </footer>
    </main>
  );
}
