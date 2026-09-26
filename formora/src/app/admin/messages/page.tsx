import { requireAdmin } from "@/lib/server/admin-auth";
import { read } from "@/lib/server/db";

export const metadata = { title: "Messages" };
export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  await requireAdmin();
  const messages = await read((db) => db.messages);
  return (
    <>
      <h1 className="mb-6 text-3xl">Contact messages</h1>
      {messages.length === 0 && <p className="text-muted">No messages yet.</p>}
      <ul className="space-y-4">
        {messages.map((m) => (
          <li key={m.id} className="card p-5">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span className="font-semibold">
                {m.name} · <a className="link" href={`mailto:${m.email}`}>{m.email}</a>
                {m.orderNumber && <span className="text-muted"> · {m.orderNumber}</span>}
              </span>
              <span className="text-muted">{new Date(m.createdAt).toLocaleString("en-US")}</span>
            </div>
            <p className="mt-3 whitespace-pre-wrap">{m.message}</p>
          </li>
        ))}
      </ul>
    </>
  );
}
