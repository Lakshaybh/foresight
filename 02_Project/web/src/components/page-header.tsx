// Title + optional inline actions for one page's content — separated from
// AppShell (which is now rendered once per section by layout.tsx and stays
// mounted across navigations) so each page still controls its own title
// without forcing the whole shell to re-render.
export function PageHeader({
  title,
  actions,
}: {
  title: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
      <h1 className="text-[26px] font-normal tracking-[-0.02em] text-[var(--bone-strong)]">{title}</h1>
      {actions}
    </div>
  );
}
