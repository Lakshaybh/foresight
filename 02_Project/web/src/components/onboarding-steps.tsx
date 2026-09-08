const STEPS = ["Your business", "Terms & Conditions"];

export function OnboardingSteps({ current }: { current: 1 | 2 }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-3">
      {STEPS.map((label, i) => {
        const step = (i + 1) as 1 | 2;
        const active = step === current;
        const done = step < current;
        return (
          <div key={label} className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                  done
                    ? "bg-[var(--accent)] text-[var(--void)]"
                    : active
                      ? "border-2 border-[var(--accent)] text-[var(--accent)]"
                      : "border border-[var(--line)] text-[var(--bone-dim)]"
                }`}
              >
                {done ? "✓" : step}
              </span>
              <span className={`text-sm ${active ? "font-medium text-[var(--bone)]" : "text-[var(--bone-dim)]"}`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="h-px w-8 bg-[var(--line)]" />}
          </div>
        );
      })}
    </div>
  );
}
