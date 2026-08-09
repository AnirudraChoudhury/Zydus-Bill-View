"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, ShoppingCart, Trash2 } from "lucide-react";
import { catalogCacheTtlMs, getCatalogData } from "../../lib/catalogCache";

export default function OrderPage() {
  const endpoint = process.env.NEXT_PUBLIC_API_URL || "";
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(Boolean(endpoint));
  const [error, setError] = useState(endpoint ? null : "Missing NEXT_PUBLIC_API_URL. Add it to your .env file.");
  const [dataSource, setDataSource] = useState("");
  const nextRowId = useRef(2);

  const [orderItems, setOrderItems] = useState([{ id: 1, sku: "", rate: 0, qty: 1, total: 0 }]);

  useEffect(() => {
    let active = true;

    if (!endpoint) return undefined;

    (async () => {
      try {
        const { data, fromCache } = await getCatalogData(endpoint);
        if (!active) return;
        setCatalog(data);
        setDataSource(fromCache ? "Loaded from browser cache" : "Fetched from API");
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load product catalog.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [endpoint]);

  const addRow = () => {
    const newId = nextRowId.current;
    nextRowId.current += 1;
    setOrderItems((prev) => [...prev, { id: newId, sku: "", rate: 0, qty: 1, total: 0 }]);
  };

  const removeRow = (id) => {
    if (orderItems.length === 1) return;
    setOrderItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleItemChange = (id, field, value) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === "sku") {
          const matchedProduct = catalog.find((p) => p.SKU === value);
          const rate = matchedProduct && matchedProduct.RATE ? parseFloat(matchedProduct.RATE) : 0;
          updated.rate = rate;
          updated.total = rate * (parseFloat(updated.qty) || 0);
        }

        if (field === "qty") {
          const qty = parseFloat(value) || 0;
          updated.qty = value;
          updated.total = updated.rate * qty;
        }

        return updated;
      })
    );
  };

  const grandTotal = orderItems.reduce((acc, item) => acc + (item.total || 0), 0);

  return (
    <div className="max-w-4xl mx-4 sm:mx-auto p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-100 my-4 sm:my-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-gray-200 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">New Purchase Order</h1>
            <p className="text-sm text-gray-600">Select products and set quantities</p>
          </div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-xs text-gray-600">
          Cache TTL: {Math.floor(catalogCacheTtlMs / (1000 * 60 * 60))} hours
          {dataSource ? ` • ${dataSource}` : ""}
        </p>
      </div>

      {loading && <p className="mb-6 text-sm text-gray-700">Loading catalog...</p>}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          <strong>Error loading products:</strong> {error}
        </div>
      )}

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase bg-gray-50">
              <th className="p-3 w-1/2">Product SKU</th>
              <th className="p-3 w-1/6 text-right">Rate (₹)</th>
              <th className="p-3 w-1/6 text-center">Qty</th>
              <th className="p-3 w-1/6 text-right">Row Total (₹)</th>
              <th className="p-3 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orderItems.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50/50">
                <td className="p-3">
                  <select
                    value={row.sku}
                    onChange={(e) => handleItemChange(row.id, "sku", e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Select Product --</option>
                    {catalog.map((item, idx) => (
                      <option key={idx} value={item.SKU}>
                        {item.SKU} {item.SCHEME ? `(${item.SCHEME})` : ""}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3 text-right font-medium text-gray-700 text-sm">
                  {row.rate ? `₹${row.rate.toLocaleString("en-IN")}` : "-"}
                </td>
                <td className="p-3">
                  <input
                    type="number"
                    min="1"
                    value={row.qty}
                    onChange={(e) => handleItemChange(row.id, "qty", e.target.value)}
                    className="w-20 mx-auto block p-2 border border-gray-300 rounded-lg text-sm text-gray-900 text-center bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </td>
                <td className="p-3 text-right font-semibold text-gray-900 text-sm">
                  ₹{row.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => removeRow(row.id)}
                    disabled={orderItems.length === 1}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition disabled:opacity-30 disabled:hover:text-gray-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {orderItems.map((row) => (
          <div key={row.id} className="border border-gray-200 rounded-lg p-3 bg-white">
            <div className="flex items-start justify-between gap-3">
              <label className="text-xs font-semibold uppercase text-gray-600">Product SKU</label>
              <button
                onClick={() => removeRow(row.id)}
                disabled={orderItems.length === 1}
                className="p-1.5 text-gray-500 hover:text-red-600 rounded-md transition disabled:opacity-30 disabled:hover:text-gray-500"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <select
              value={row.sku}
              onChange={(e) => handleItemChange(row.id, "sku", e.target.value)}
              className="mt-2 w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Product --</option>
              {catalog.map((item, idx) => (
                <option key={idx} value={item.SKU}>
                  {item.SKU} {item.SCHEME ? `(${item.SCHEME})` : ""}
                </option>
              ))}
            </select>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                <p className="text-[11px] font-semibold uppercase text-gray-600">Rate (₹)</p>
                <p className="text-sm font-medium text-gray-800 mt-1">
                  {row.rate ? `₹${row.rate.toLocaleString("en-IN")}` : "-"}
                </p>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase text-gray-600">Qty</label>
                <input
                  type="number"
                  min="1"
                  value={row.qty}
                  onChange={(e) => handleItemChange(row.id, "qty", e.target.value)}
                  className="mt-1 w-full p-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 p-2.5">
              <span className="text-xs font-semibold uppercase text-blue-800">Row Total</span>
              <span className="text-base font-bold text-blue-900">
                ₹{row.total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <button
          onClick={addRow}
          className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Item</span>
        </button>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 p-4 rounded-xl">
        <span className="text-gray-700 font-medium mb-2 sm:mb-0">Grand Total</span>
        <span className="text-xl sm:text-2xl font-bold text-blue-700">
          ₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}
