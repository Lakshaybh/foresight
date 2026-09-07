import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { SmoothScrollProvider } from "@/lib/smooth-scroll";
import { AtmosphereBackground } from "@/components/marketing/atmosphere-background";
import { SiteNav } from "@/components/marketing/site-nav";
import { CtaButton } from "@/components/marketing/cta-button";
import { BezelCard } from "@/components/marketing/bezel-card";
import { ProductPreview } from "@/components/marketing/product-preview";
import { RevealSection } from "@/components/marketing/reveal-section";
import { HeroHeadline } from "@/components/marketing/hero-headline";
import { ScrambleLine } from "@/components/marketing/scramble-heading";
import { Flow3D } from "@/components/marketing/flow-3d";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

function Eyebrow({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <span
      data-reveal
      className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--teal)]"
    >
      <span className="text-[var(--bone-dim)]">SIGNAL {n} —</span> {children}
    </span>
  );
}

const SEGMENTS = [
  { title: "Small e-commerce", body: "Keep bestsellers in stock without babysitting a spreadsheet daily." },
  { title: "Distributors", body: "Catch a slipping supplier before a customer notices a late shipment." },
  { title: "Manufacturers", body: "See raw-material risk building before it stalls the production line." },
  { title: "Retail chains", body: "One view across locations instead of checking each store by hand." },
  { title: "Import / export", body: "Long lead times make early warning worth the most — see delays coming." },
];

export default function HomePage() {
  return (
    <div className={`${spaceGrotesk.variable} ${plexMono.variable} marketing-dark font-[family-name:var(--font-display)]`}>
      <SmoothScrollProvider>
        <main className="relative overflow-x-clip">
          <AtmosphereBackground />
          <SiteNav />

          {/* Hero */}
          <section className="relative z-10 px-4 pt-40 pb-24 sm:pt-48 sm:pb-32">
            <div className="mx-auto max-w-3xl text-center">
              <ScrambleLine
                text="DETECT · EXPLAIN · RECOMMEND · TRACK"
                className="text-[11px] tracking-[0.3em] text-[var(--teal)]"
              />
              <HeroHeadline className="mt-6 text-5xl font-semibold tracking-tight text-balance text-[var(--bone)] sm:text-7xl">
                Know what happens next.
              </HeroHeadline>
              <p
                data-reveal
                className="mx-auto mt-6 max-w-xl text-balance text-lg text-[var(--bone-dim)]"
              >
                Right now, you probably find out about a stockout the day a
                customer asks where their order is. By then it&apos;s already
                cost you a sale. We watch your suppliers and your stock every
                day, so you find out weeks earlier — while there&apos;s still
                time to do something about it.
              </p>
              <div data-reveal className="mt-9 flex justify-center">
                <CtaButton href="/login" size="lg">
                  Request access
                </CtaButton>
              </div>
            </div>

            <RevealSection className="mx-auto mt-20 max-w-4xl" y={48}>
              <div data-reveal>
                <ProductPreview />
                <p className="mt-4 text-center text-xs text-[var(--bone-dim)]">
                  Illustrative example — evidence, confidence, and recommended action for one signal.
                </p>
              </div>
            </RevealSection>
          </section>

          {/* How we actually work — 3D pipeline */}
          <section id="how-it-works" className="relative z-10 px-4 py-24 sm:py-32">
            <div className="mx-auto max-w-5xl">
              <RevealSection className="mx-auto max-w-xl text-center">
                <Eyebrow n="01">How we work</Eyebrow>
                <h2 data-reveal className="mt-4 text-3xl font-semibold tracking-tight text-balance text-[var(--bone)] sm:text-4xl">
                  This is the exact pipeline running on your data.
                </h2>
                <p data-reveal className="mt-4 text-[var(--bone-dim)]">
                  Not a diagram we drew for the website — this is the real
                  sequence: your data goes in one end, a decision with
                  evidence comes out the other, and nothing moves without you.
                </p>
              </RevealSection>

              <Flow3D />
            </div>
          </section>

          {/* Evidence / credibility */}
          <section id="evidence" className="relative z-10 px-4 py-24 sm:py-32">
            <div className="mx-auto grid max-w-5xl items-center gap-12 sm:grid-cols-2">
              <RevealSection stagger={0.1}>
                <div data-reveal><Eyebrow n="02">No black box</Eyebrow></div>
                <h2 data-reveal className="mt-4 text-3xl font-semibold tracking-tight text-balance text-[var(--bone)] sm:text-4xl">
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
                      <svg viewBox="0 0 16 16" fill="none" className="mt-0.5 h-4 w-4 shrink-0 text-[var(--teal)]">
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
                        <div className="h-1.5 rounded-full bg-[var(--bone)]/10">
                          <div className="h-full w-[63%] rounded-full bg-[var(--bone)]/25" />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-[var(--bone-dim)]">Advanced model</span>
                          <span className="font-mono text-xs text-[var(--bone)]">6.5</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--bone)]/10">
                          <div className="h-full w-[65%] rounded-full bg-[var(--teal)]" />
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

          {/* Human control — contrast band */}
          <section className="relative z-10 px-4 py-24 sm:py-32">
            <RevealSection className="mx-auto max-w-4xl">
              <div
                data-reveal
                className="overflow-hidden rounded-[2rem] border border-[var(--orange)]/20 bg-[radial-gradient(80%_120%_at_50%_0%,rgba(242,121,60,0.12),transparent)] px-8 py-16 text-center sm:px-16"
              >
                <Eyebrow n="03">Always your call</Eyebrow>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-[var(--bone)] sm:text-4xl">
                  The system recommends. You decide.
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-[var(--bone-dim)]">
                  Nothing is ever executed automatically. Every recommendation
                  waits for a person to approve, reject, or snooze it — and
                  every decision is recorded so you can see whether it
                  actually helped.
                </p>
              </div>
            </RevealSection>
          </section>

          {/* Who it's for */}
          <section id="who-its-for" className="relative z-10 px-4 py-24 sm:py-32">
            <div className="mx-auto max-w-5xl">
              <RevealSection className="mx-auto max-w-xl text-center">
                <div data-reveal><Eyebrow n="04">Built for</Eyebrow></div>
                <h2 data-reveal className="mt-4 text-3xl font-semibold tracking-tight text-balance text-[var(--bone)] sm:text-4xl">
                  If any of this sounds familiar, we built this for you.
                </h2>
              </RevealSection>

              <RevealSection className="mt-14 grid gap-5 sm:grid-cols-6" stagger={0.1}>
                {SEGMENTS.map((seg, i) => (
                  <div key={seg.title} data-reveal className={i < 2 ? "sm:col-span-3" : "sm:col-span-2"}>
                    <BezelCard className="h-full">
                      <div className="h-full p-6">
                        <h3 className="font-medium text-[var(--bone)]">{seg.title}</h3>
                        <p className="mt-2 text-sm text-[var(--bone-dim)]">{seg.body}</p>
                      </div>
                    </BezelCard>
                  </div>
                ))}
              </RevealSection>
            </div>
          </section>

          {/* Closing CTA */}
          <section className="relative z-10 px-4 pb-32 pt-8">
            <RevealSection className="mx-auto max-w-2xl text-center">
              <h2 data-reveal className="text-3xl font-semibold tracking-tight text-balance text-[var(--bone)] sm:text-4xl">
                Bring your own data. Let's see what it's been trying to tell you.
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
            Foresight — private beta. Access is reviewed before use.
          </footer>
        </main>
      </SmoothScrollProvider>
    </div>
  );
}
