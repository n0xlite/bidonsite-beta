// WindowQuoteCalculator.js
"use client";
import React, { useState, useMemo } from "react";
import {
  Grid2x2,
  BrushCleaning,
  Leaf,
  RotateCcw,
  Copy,
  Check,
  X,
} from "lucide-react";

const PRICES = {
  XL_UPPER_WINDOW: 23.64,
  L_UPPER_WINDOW: 16.06,
  M_UPPER_WINDOW: 8.59,
  S_UPPER_WINDOW: 6.85,
  XS_UPPER_WINDOW: 3.56,
  XL_LOWER_WINDOW: 17.98,
  L_LOWER_WINDOW: 11.43,
  M_LOWER_WINDOW: 6.49,
  S_LOWER_WINDOW: 4.31,
  XS_LOWER_WINDOW: 2.54,
  EXTERIOR_HALF_SCREEN: 2.72,
  WHOLE_INTERIOR_SCREEN: 3.12,
  EXTERIOR_HALF_SCREEN_INTERIOR: 4.0,
  SOLAR_SCREEN: 5.56,
  SCREW_SOLAR_SCREEN: 8,
  UPPER_WOODEN_SCREEN: 14,
  LOWER_WOODEN_SCREEN: 7,
  FIRST_STORY_GUTTER: 1,
  SECOND_STORY_GUTTER: 2,
};

type PriceKey = keyof typeof PRICES;

type Section = "upperWindows" | "lowerWindows" | "screens" | "gutters";

type Item = { key: PriceKey; label: string; desc?: string };

type ItemsConfig = Record<Section, Item[]>;

const ITEMS_CONFIG: ItemsConfig = {
  upperWindows: [
    { key: "XL_UPPER_WINDOW", label: "XL Upper", desc: "> 27 sqft" },
    { key: "L_UPPER_WINDOW", label: "L Upper", desc: "13 - 26 sqft" },
    { key: "M_UPPER_WINDOW", label: "M Upper", desc: "4 - 12 sqft" },
    { key: "S_UPPER_WINDOW", label: "S Upper", desc: "1 - 3 sqft" },
    { key: "XS_UPPER_WINDOW", label: "XS Upper", desc: "< 1 sqft" },
  ],
  lowerWindows: [
    { key: "XL_LOWER_WINDOW", label: "XL Lower", desc: "> 27 sqft" },
    { key: "L_LOWER_WINDOW", label: "L Lower", desc: "13 - 26 sqft" },
    { key: "M_LOWER_WINDOW", label: "M Lower", desc: "4 - 12 sqft" },
    { key: "S_LOWER_WINDOW", label: "S Lower", desc: "1 - 3 sqft" },
    { key: "XS_LOWER_WINDOW", label: "XS Lower", desc: "< 1 sqft" },
  ],
  screens: [
    { key: "EXTERIOR_HALF_SCREEN", label: "Half Screens" },
    {
      key: "EXTERIOR_HALF_SCREEN_INTERIOR",
      label: "Half Screens",
      desc: "Remove from inside",
    },
    {
      key: "WHOLE_INTERIOR_SCREEN",
      label: "Full Screens",
      desc: "Interior or exterior",
    },
    { key: "SOLAR_SCREEN", label: "Solar Screens" },
    { key: "SCREW_SOLAR_SCREEN", label: "Screw-On Solar Screens" },
    { key: "UPPER_WOODEN_SCREEN", label: "Upper Wooden Screens" },
    { key: "LOWER_WOODEN_SCREEN", label: "Lower Wooden Screens" },
  ],
  gutters: [
    {
      key: "FIRST_STORY_GUTTER",
      label: "First Story",
      desc: "Linear feet",
    },
    {
      key: "SECOND_STORY_GUTTER",
      label: "Second Story",
      desc: "Linear feet",
    },
  ],
};

const initQuantities = () =>
  Object.keys(PRICES).reduce(
    (acc, key) => ({ ...acc, [key as PriceKey]: 0 }),
    {} as Record<PriceKey, number>,
  );

const WindowQuoteCalculator = () => {
  const [quantities, setQuantities] =
    useState<Record<PriceKey, number>>(initQuantities);
  const [toast, setToast] = useState("");

  const toggleSelection = (key: PriceKey) =>
    setQuantities((prev) => ({
      ...prev,
      [key]: prev[key] > 0 ? 0 : 1,
    }));

  const incrementQty = (key: PriceKey) =>
    setQuantities((prev) => ({ ...prev, [key]: prev[key] + 1 }));

  const decrementQty = (key: PriceKey) =>
    setQuantities((prev) => ({
      ...prev,
      [key]: Math.max(1, prev[key] - 1),
    }));

  const resetAll = () => setQuantities(initQuantities());

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 3000);
  };

  const totals = useMemo(() => {
    const entries = Object.entries(quantities) as [PriceKey, number][];

    const windows = entries
      .filter(([k]) => k.includes("WINDOW"))
      .reduce((sum, [k, qty]) => sum + qty * PRICES[k], 0);

    const screens = entries
      .filter(([k]) => k.includes("SCREEN"))
      .reduce((sum, [k, qty]) => sum + qty * PRICES[k], 0);

    const gutters = entries
      .filter(([k]) => k.includes("GUTTER"))
      .reduce((sum, [k, qty]) => sum + qty * PRICES[k], 0);

    return {
      inOut: windows + screens,
      outOnly: windows * 0.67 + screens,
      gutters,
    };
  }, [quantities]);

  const generateQuote = () => {
    const lines = [];

    (Object.keys(ITEMS_CONFIG) as Section[]).forEach((section) => {
      ITEMS_CONFIG[section].forEach(({ key, label }) => {
        if (quantities[key] > 0) {
          const isGutter = section === "gutters";
          const value = isGutter ? `${quantities[key]} ft` : quantities[key];
          const fullLabel = label + (isGutter ? " Gutter" : "");
          lines.push(`${fullLabel}: ${value}`);
        }
      });
    });

    if (lines.length) lines.push("");
    if (totals.inOut > 0) lines.push(`In/Out: $${totals.inOut.toFixed(2)}`);
    if (totals.outOnly > 0)
      lines.push(`Out Only: $${totals.outOnly.toFixed(2)}`);
    if (totals.gutters > 0)
      lines.push(`Gutter Cleaning: $${totals.gutters.toFixed(2)}`);

    return lines.join("\n");
  };

  const copyQuote = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generateQuote());
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = generateQuote();
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      showToast("Bid copied to clipboard");
    } catch (err) {
      console.error("Clipboard error:", err);
      showToast("Could not copy to clipboard");
    }
  };

  const getIcon = (section: Section) => {
    if (section === "screens") return BrushCleaning;
    if (section === "gutters") return Leaf;
    return Grid2x2;
  };

  const getSectionTitle = (section: Section) => {
    const titles: Record<Section, string> = {
      upperWindows: "Upper Windows",
      lowerWindows: "Lower Windows",
      screens: "Screens",
      gutters: "Gutters",
    };
    return titles[section];
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50">
          <div className="border-neutral-100 border rounded-[10px] bg-background">
            <div className="relative block px-4 outline-primary forced-colors:outline-[Highlight] outline-offset-2 py-3">
              <div className="flex flex-row items-center gap-4">
                <div className="relative shrink-0">
                  {toast.includes("copied") ? (
                    <Check className="w-[30px] h-[30px]" />
                  ) : (
                    <X className="w-[30px] h-[30px]" />
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">{toast}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-full sm:px-0 md:px-4 lg:px-0 lg:max-w-265.5 xl:max-w-290 mx-auto mb-32">
        <div className="grid gap-8 md:gap-7.5 lg:gap-12.5 px-5 md:px-0 grid-cols-1 md:grid-cols-[20%_53%_20%] lg:grid-cols-[214px_532px_214px] xl:grid-cols-[214px_632px_214px]">
          {/* Left Column - All Items */}
          <div className="flex flex-col gap-7">
            {(Object.keys(ITEMS_CONFIG) as Section[]).map((section) => {
              const items = ITEMS_CONFIG[section];
              const Icon = getIcon(section);
              return (
                <aside key={section} className="flex flex-col gap-2">
                  <header>
                    <h2 className="px-3">{getSectionTitle(section)}</h2>
                  </header>
                  <ol>
                    {items.map((item) => {
                      const isSelected = quantities[item.key] > 0;
                      return (
                        <li
                          key={item.key}
                          className="border-neutral-100 hover:bg-neutral-100/50 border-t border-x last:border-b w-full first:rounded-t-[10px] last:rounded-b-[10px] cursor-pointer"
                          onClick={() => toggleSelection(item.key)}
                        >
                          <div className="relative block px-4 outline-primary forced-colors:outline-[Highlight] outline-offset-2 py-3">
                            <div className="flex flex-row items-center gap-4">
                              <div className="relative shrink-0">
                                <Icon className="w-[30px] h-[30px]" />
                                {isSelected && (
                                  <div className="bg-[#CF3232] w-[7px] h-[7px] rounded-full absolute right-0 top-0"></div>
                                )}
                              </div>
                              <div className="flex flex-col gap-1">
                                <p className="text-sm font-medium leading-none">
                                  {item.label}
                                </p>
                                {item.desc && (
                                  <div className="flex flex-row items-center gap-1.5">
                                    <div className="text-neutral-50 font-medium text-xs leading-none truncate">
                                      {item.desc}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </aside>
              );
            })}
          </div>

          {/* Middle Column - Selected Items */}
          <main className="-order-1 md:order-0 flex flex-col gap-7">
            <section className="flex flex-col gap-4">
              <h2 className="px-3 font-medium text-[#adadad]">Current Bid</h2>
              {Object.values(quantities).every((qty) => qty === 0) ? (
                <div className="px-4 py-8 text-center text-neutral-50">
                  <p className="hidden md:block">
                    Select items from the left to get started
                  </p>
                  <p className="md:hidden">
                    Select items from below to get started
                  </p>
                </div>
              ) : (
                <ol>
                  {(Object.keys(ITEMS_CONFIG) as Section[]).map((section) => {
                    const items = ITEMS_CONFIG[section];
                    const Icon = getIcon(section);
                    return items
                      .filter((item) => quantities[item.key] > 0)
                      .map((item) => (
                        <li
                          key={item.key}
                          className="border-neutral-100 hover:bg-neutral-100/50 border-t border-x last:border-b w-full first:rounded-t-[10px] last:rounded-b-[10px] select-none"
                        >
                          <section>
                            <div className="relative block px-4 outline-primary forced-colors:outline-[Highlight] outline-offset-2 py-3">
                              <div className="flex flex-row items-center gap-3">
                                <div
                                  className="grow flex flex-row items-center gap-4 cursor-pointer"
                                  onClick={() => incrementQty(item.key)}
                                >
                                  <Icon className="w-[18px] h-[18px] shrink-0" />
                                  <p className="select-none">{item.label}</p>
                                </div>
                                <span
                                  className="text-neutral-50 cursor-pointer px-3 py-1"
                                  onClick={() => decrementQty(item.key)}
                                >
                                  {quantities[item.key]}
                                </span>
                              </div>
                            </div>
                          </section>
                        </li>
                      ));
                  })}
                </ol>
              )}
            </section>
          </main>

          {/* Right Column - Totals */}
          <div className="flex flex-col gap-7">
            <aside className="flex flex-col gap-2">
              <header>
                <h2 className="px-3">Totals</h2>
              </header>
              <ol>
                <li className="border-neutral-100 border-t border-x w-full first:rounded-t-[10px]">
                  <div className="relative block px-4 outline-primary forced-colors:outline-[Highlight] outline-offset-2 py-3">
                    <div className="flex flex-row items-center gap-3">
                      <div className="grow flex flex-row items-center gap-4">
                        <p className="text-sm font-medium leading-none">
                          In/Out
                        </p>
                      </div>
                      <span className="text-sm text-neutral-50">
                        ${totals.inOut.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
                <li className="border-neutral-100 border-t border-x w-full">
                  <div className="relative block px-4 outline-primary forced-colors:outline-[Highlight] outline-offset-2 py-3">
                    <div className="flex flex-row items-center gap-3">
                      <div className="grow flex flex-row items-center gap-4">
                        <p className="text-sm font-medium leading-none">
                          Out Only
                        </p>
                      </div>
                      <span className="text-sm text-neutral-50">
                        ${totals.outOnly.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
                <li className="border-neutral-100 border-t border-x last:border-b w-full last:rounded-b-[10px]">
                  <div className="relative block px-4 outline-primary forced-colors:outline-[Highlight] outline-offset-2 py-3">
                    <div className="flex flex-row items-center gap-3">
                      <div className="grow flex flex-row items-center gap-4">
                        <p className="text-sm font-medium leading-none">
                          Gutter Cleaning
                        </p>
                      </div>
                      <span className="text-sm text-neutral-50">
                        ${totals.gutters.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </li>
              </ol>

              {/* Action Buttons */}
              <div className="flex flex-row gap-2">
                <button
                  onClick={resetAll}
                  className="flex-1 border-neutral-100 hover:bg-neutral-100/50 border rounded-[10px] cursor-pointer"
                  aria-label="Reset all"
                >
                  <div className="relative block px-4 outline-primary forced-colors:outline-[Highlight] outline-offset-2 py-3">
                    <div className="flex flex-row items-center justify-center gap-2">
                      <RotateCcw size={16} />
                      <span className="text-sm font-medium">Reset</span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={copyQuote}
                  className="flex-1 border-neutral-100 hover:bg-neutral-100/50 border rounded-[10px] cursor-pointer"
                  aria-label="Copy bid"
                >
                  <div className="relative block px-4 outline-primary forced-colors:outline-[Highlight] outline-offset-2 py-3">
                    <div className="flex flex-row items-center justify-center gap-2">
                      <Copy size={16} />
                      <span className="text-sm font-medium">Copy</span>
                    </div>
                  </div>
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WindowQuoteCalculator;
