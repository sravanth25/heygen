"use client";

import { useState } from "react";
import type { Product } from "@/config/products";
import { ProductMedia } from "./ProductVisual";
import { Modal } from "@/components/ui/Modal";
import { CloseIcon, ZoomIcon } from "@/components/ui/icons";

export function Gallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const asset = product.assets[index];
  const hasThumbs = product.assets.length > 1;

  return (
    <div>
      <div className="relative">
        <ProductMedia product={product} asset={asset} priority aspect="aspect-[4/3] sm:aspect-square" sizes="(min-width: 1024px) 55vw, 100vw" />
        <button
          type="button"
          onClick={() => setZoom(true)}
          className="absolute right-3 bottom-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-white/95 px-4 text-sm font-semibold text-ink hover:bg-white"
          aria-haspopup="dialog"
        >
          <ZoomIcon /> Zoom<span className="sr-only"> image: {asset.alt}</span>
        </button>
      </div>
      <p className="mt-2 text-sm text-muted">{asset.label}</p>

      {hasThumbs && (
        <ul className="mt-3 flex gap-3" aria-label="Product images">
          {product.assets.map((a, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${product.assets.length}: ${a.alt}`}
                aria-current={i === index ? "true" : undefined}
                className={`block w-16 overflow-hidden rounded-xl border-2 sm:w-24 ${i === index ? "border-evergreen" : "border-transparent hover:border-line-strong"}`}
              >
                <ProductMedia product={product} asset={a} showLabel={false} className="rounded-[10px]" sizes="96px" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={zoom}
        onClose={() => setZoom(false)}
        labelledBy="zoom-title"
        className="m-auto h-[min(92vh,900px)] w-[min(94vw,900px)] max-w-none rounded-2xl bg-white p-0"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-line px-4 py-2">
            <h2 id="zoom-title" className="font-sans text-base font-semibold">
              {product.title} — {asset.label}
            </h2>
            <button type="button" onClick={() => setZoom(false)} className="grid h-11 w-11 place-items-center rounded-full hover:bg-warm" aria-label="Close zoomed image">
              <CloseIcon />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <ProductMedia product={product} asset={asset} className="mx-auto h-full max-h-full w-auto" sizes="900px" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
