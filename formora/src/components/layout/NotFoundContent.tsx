import Link from "next/link";

export function NotFoundContent() {
  return (
    <div className="container-page max-w-2xl py-20">
      <h1 className="text-4xl">Page not found</h1>
      <p className="mt-4 text-lg text-muted">That page doesn&apos;t exist, or it has moved.</p>
      <div className="mt-8 flex gap-3">
        <Link href="/shop" className="btn btn-primary">
          Shop Formora
        </Link>
        <Link href="/" className="btn btn-secondary">
          Home
        </Link>
      </div>
    </div>
  );
}
