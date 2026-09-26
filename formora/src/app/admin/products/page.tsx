import { requireAdmin } from "@/lib/server/admin-auth";
import { getProducts, isProductFullyVerified } from "@/config/products";
import { formatUSD } from "@/lib/money";

export const metadata = { title: "Products & SKUs" };

export default async function ProductsAdminPage() {
  await requireAdmin();
  const products = getProducts();
  return (
    <>
      <h1 className="text-3xl">Products and supplier mapping</h1>
      <p className="mt-2 mb-6 max-w-3xl text-muted">
        Edit these in <code className="rounded bg-white px-1">src/config/products.ts</code>. Stock is not synced with Supliful —
        mark a product unavailable with <code className="rounded bg-white px-1">FORMORA_UNAVAILABLE_PRODUCTS</code>.
      </p>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[60rem] text-left text-sm">
          <thead className="border-b border-line bg-warm text-muted">
            <tr>
              {["Website SKU", "Product", "Supliful product", "Price", "Available", "Facts", "Sources"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3 font-mono">{p.sku}</td>
                <td className="px-4 py-3">
                  {p.title}
                  <span className="block text-muted">{p.flavor}</span>
                </td>
                <td className="px-4 py-3">
                  {p.supplier.productName} — {p.supplier.variant}
                </td>
                <td className="px-4 py-3">
                  {formatUSD(p.price.amountCents)}
                  <span className={`block text-xs ${p.price.confirmed ? "text-[#1d4d23]" : "text-alert"}`}>{p.price.confirmed ? "Confirmed" : "Sample — not confirmed"}</span>
                </td>
                <td className="px-4 py-3">{p.available ? "Yes" : "No"}</td>
                <td className="px-4 py-3">
                  <span className={isProductFullyVerified(p) ? "text-[#1d4d23]" : "text-alert"}>
                    {isProductFullyVerified(p) ? "Label-verified" : "Pending label verification"}
                  </span>
                  <span className="block text-xs text-muted">Checked {p.verification.lastChecked}</span>
                </td>
                <td className="px-4 py-3">
                  {p.sources.map((s) => (
                    <a key={s.url} href={s.url} className="link block" target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
