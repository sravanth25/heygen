import { requireAdmin } from "@/lib/server/admin-auth";
import { getCheckoutMode, getLaunchChecklist } from "@/lib/readiness";
import { getSiteMode } from "@/config/site";

export const metadata = { title: "Launch checklist" };
export const dynamic = "force-dynamic";

export default async function LaunchPage() {
  await requireAdmin();
  const items = getLaunchChecklist();
  const blockers = items.filter((i) => i.blocker && !i.done);
  const areas = [...new Set(items.map((i) => i.area))];
  return (
    <>
      <h1 className="text-3xl">Launch checklist</h1>
      <p className="mt-2 text-muted">
        Site mode: <strong>{getSiteMode()}</strong> · Checkout mode: <strong>{getCheckoutMode()}</strong> ·{" "}
        <strong className={blockers.length ? "text-alert" : "text-[#1d4d23]"}>{blockers.length} blocker(s) open</strong>
      </p>
      <p className="mt-2 mb-8 max-w-3xl text-sm text-muted">
        Live checkout stays disabled until every blocker is resolved, even if FORMORA_MODE=live is set.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        {areas.map((area) => (
          <section key={area} className="card p-5" aria-labelledby={`area-${area}`}>
            <h2 id={`area-${area}`} className="mb-3 font-sans text-base font-semibold tracking-normal">
              {area}
            </h2>
            <ul className="space-y-2 text-sm">
              {items
                .filter((i) => i.area === area)
                .map((i) => (
                  <li key={i.label} className="flex gap-2">
                    <span className={`mt-0.5 shrink-0 font-bold ${i.done ? "text-[#1d4d23]" : i.blocker ? "text-alert" : "text-muted"}`}>
                      {i.done ? "Done" : i.blocker ? "Blocker" : "To do"}
                    </span>
                    <span>{i.label}</span>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
