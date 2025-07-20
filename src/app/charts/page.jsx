"use client";
import React, { useEffect, useState, useMemo } from "react";
import { FinanceCharts } from "@/components/ui/FinanceCharts";

export default function ChartsPage() {
  const [transactions, setTransactions] = useState([]);
  const [viewMode, setViewMode] = useState("weekly"); // 'weekly' or 'monthly'

  useEffect(() => {
    async function fetchTransactions() {
      const res = await fetch("/api/transactions");
      const data = await res.json();
      setTransactions(data);
    }
    fetchTransactions();
  }, []);

  const { incomeTotal, expenseTotal } = useMemo(() => {
    const now = new Date();
    let filtered = [];

    if (viewMode === "monthly") {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      filtered = transactions.filter((t) => {
        const date = new Date(t.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      });
    } else {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = transactions.filter((t) => new Date(t.date) >= weekAgo);
    }

    let income = 0;
    let expenses = 0;
    filtered.forEach((t) => {
      if (t.category === "income") {
        income += t.amount;
      } else {
        expenses += t.amount;
      }
    });

    return { incomeTotal: income, expenseTotal: expenses };
  }, [transactions, viewMode]);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Finance Charts</h1>
      <div className="flex justify-between items-center">
        <button
          onClick={() => window.location.href = "/overview"} // or use Next.js router if preferred
          className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
        >
          ← Back to Overview
        </button>

        <button
          onClick={() => setViewMode(viewMode === "weekly" ? "monthly" : "weekly")}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Switch to {viewMode === "weekly" ? "Monthly" : "Weekly"} View
        </button>
      </div>
      

      {/* Income / Expense Cards */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="border rounded p-4 w-full sm:w-1/2 bg-green-100">
          <p className="text-lg font-semibold">
            {viewMode === "weekly" ? "Weekly" : "Monthly"} Income
          </p>
          <p className="text-2xl text-green-700">${incomeTotal.toFixed(2)}</p>
        </div>
        <div className="border rounded p-4 w-full sm:w-1/2 bg-red-100">
          <p className="text-lg font-semibold">
            {viewMode === "weekly" ? "Weekly" : "Monthly"} Expenses
          </p>
          <p className="text-2xl text-red-700">${expenseTotal.toFixed(2)}</p>
        </div>
      </div>

      {/* Charts */}
      <FinanceCharts transactions={transactions} viewMode={viewMode} />
    </div>
  );
}
