"use client";

import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useReveal } from "./useReveal";

// `compare` (design.md §13.39): a titled table with an optional recommended
// column. Rows fade up in turn when the block enters; the recommended column's
// tint arrives after the last row.
export function Compare({
  title,
  highlight,
  header,
  rows,
}: {
  title: string | null;
  highlight: number | null;
  header: ReactNode[];
  rows: ReactNode[][];
}) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);
  const tint = (column: number) =>
    column === highlight &&
    "bg-primary/6 transition-colors delay-[600ms] duration-300 group-data-[phase=armed]/compare:bg-transparent";

  return (
    <div
      ref={ref}
      className="group/compare my-10 rounded-lg bg-tile p-5 sm:p-6"
    >
      <p className="type-label text-muted">Compare</p>
      {title && (
        <p className="mt-1 text-body font-semibold text-foreground">{title}</p>
      )}
      <div
        role="region"
        aria-label={title ?? "Comparison"}
        tabIndex={0}
        className="mt-4 overflow-x-auto outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <table className="w-full min-w-max border-collapse text-left text-[0.9375rem]">
          <thead>
            <tr>
              {header.map((cell, column) => (
                <th
                  key={column}
                  scope="col"
                  className={cn(
                    "type-label border-b border-border px-4 py-3 align-bottom text-muted first:sticky first:left-0 first:bg-tile",
                    column === highlight && "border-b-2 border-b-primary",
                    tint(column),
                  )}
                >
                  {column === highlight && (
                    <span className="mb-2 block text-primary-text">
                      Recommended
                    </span>
                  )}
                  {cell}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr
                key={index}
                style={{ transitionDelay: `${index * 60}ms` }}
                className="transition-[opacity,transform,background-color] duration-[400ms] ease-out group-data-[phase=armed]/compare:translate-y-2 group-data-[phase=armed]/compare:opacity-0 hover:bg-tile-hover"
              >
                {row.map((cell, column) => {
                  const Cell = column === 0 ? "th" : "td";
                  return (
                    <Cell
                      key={column}
                      {...(column === 0 ? { scope: "row" as const } : {})}
                      className={cn(
                        "border-b border-border px-4 py-3 text-left align-top text-[0.9375rem] font-normal text-muted transition-colors duration-150 hover:text-foreground",
                        column === 0 &&
                          "sticky left-0 bg-tile font-medium text-foreground",
                        tint(column),
                      )}
                    >
                      {cell}
                    </Cell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
