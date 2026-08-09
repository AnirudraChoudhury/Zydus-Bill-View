"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { catalogCacheTtlMs, getCatalogData } from "../lib/catalogCache";

type CatalogRow = Record<string, string | number | boolean | null>;

export default function Home() {
  const endpoint = process.env.NEXT_PUBLIC_API_URL || "";
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [loading, setLoading] = useState(Boolean(endpoint));
  const [error, setError] = useState(endpoint ? "" : "Missing NEXT_PUBLIC_API_URL. Add it to your .env file.");
  const [dataSource, setDataSource] = useState("");

  const refreshCatalog = async () => {
    if (!endpoint) return;
    setLoading(true);
    setError("");
    try {
      const { data, fromCache } = await getCatalogData(endpoint, { forceRefresh: true });
      setRows(data);
      setDataSource(fromCache ? "Loaded from browser cache" : "Fetched from API");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    if (!endpoint) return undefined;

    (async () => {
      try {
        const { data, fromCache } = await getCatalogData(endpoint);
        if (!active) return;
        setRows(data);
        setDataSource(fromCache ? "Loaded from browser cache" : "Fetched from API");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load data.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [endpoint]);

  const columns = useMemo(() => {
    if (!rows.length) return [];
    const colSet = new Set<string>();
    rows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => colSet.add(key));
    });
    return Array.from(colSet).filter((col) => !/^(qty|quantity)$/i.test(col));
  }, [rows]);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <main className="mx-auto w-full max-w-7xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Product Catalog</h1>
            <p className="mt-1 text-sm text-slate-600">
              Cache TTL: {Math.floor(catalogCacheTtlMs / (1000 * 60 * 60))} hours
              {dataSource ? ` • ${dataSource}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshCatalog}
              disabled={loading || !endpoint}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              Refresh Data
            </button>
            <Link
              href="/Order"
              className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Go to Order Form
            </Link>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-700">Loading catalog...</p>}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && !rows.length && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            No data available.
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="whitespace-nowrap border-b border-slate-200 px-3 py-2 text-left font-semibold uppercase tracking-wide text-slate-700"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="odd:bg-white even:bg-slate-50/50">
                    {columns.map((col) => (
                      <td key={`${idx}-${col}`} className="border-b border-slate-100 px-3 py-2 text-slate-800">
                        {row?.[col] != null && row?.[col] !== "" ? String(row[col]) : "-"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
