"use client";

import { MinusIcon, PlusIcon } from "./icons";

export function QuantityStepper({
  value,
  onChange,
  max = 10,
  label,
  size = "md",
  disabled = false,
}: {
  value: number;
  onChange: (n: number) => void;
  max?: number;
  label: string;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  const h = size === "sm" ? "h-11" : "h-12";
  return (
    <div role="group" aria-label={label} className={`inline-flex ${h} items-stretch rounded-[10px] border-[1.5px] border-line-strong bg-white`}>
      <button
        type="button"
        className="grid w-11 place-items-center rounded-l-[9px] text-evergreen hover:bg-warm disabled:text-line-strong"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Decrease quantity"
      >
        <MinusIcon />
      </button>
      <input
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        disabled={disabled}
        aria-label="Quantity"
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n) && n >= 1) onChange(Math.min(max, Math.floor(n)));
        }}
        className="w-12 border-x border-line bg-transparent text-center font-semibold tabular-nums [appearance:textfield] focus-visible:outline-offset-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        className="grid w-11 place-items-center rounded-r-[9px] text-evergreen hover:bg-warm disabled:text-line-strong"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <PlusIcon />
      </button>
    </div>
  );
}
