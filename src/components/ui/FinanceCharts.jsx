"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, ResponsiveContainer
} from "recharts";
import { useMemo } from "react";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a569bd", "#f39c12"];

export function FinanceCharts({ transactions, viewMode }) {
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const filteredTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    if (viewMode === "weekly") {
      return date >= weekAgo;
    }
    return t.date.startsWith(thisMonth);
  });

  const lineChartData = filteredTransactions.reduce((acc, t) => {
    const date = new Date(t.date);
    const key =
      viewMode === "weekly"
        ? date.toLocaleDateString("en-US", { weekday: "short" })
        : date.getDate(); // Day of month for monthly

    const existing = acc.find(i => i.day === key);
    if (existing) {
      existing[t.category] = (existing[t.category] || 0) + t.amount;
    } else {
      acc.push({
        day: key,
        income: t.category === "income" ? t.amount : 0,
        expense: t.category !== "income" ? t.amount : 0,
      });
    }
    return acc;
  }, []);

  const categoryData = filteredTransactions
    .filter(t => t.category !== "income")
    .reduce((acc, t) => {
      const existing = acc.find(i => i.category === t.category);
      if (existing) {
        existing.amount += t.amount;
      } else {
        acc.push({ category: t.category, amount: t.amount });
      }
      return acc;
    }, []);



  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="border rounded shadow-sm">
        <div className="p-4 font-semibold text-lg">
          {viewMode === "weekly" ? "Weekly" : "Monthly"} Income vs Expenses
        </div>
        <div className="p-2">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineChartData}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="income" stroke="#82ca9d" />
              <Line type="monotone" dataKey="expense" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border rounded shadow-sm">
        <div className="p-4 font-semibold text-lg">
          {viewMode === "weekly" ? "Weekly" : "Monthly"} Spending by Category
        </div>

        <div className="p-2">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart key={viewMode}>

              <Pie
                data={categoryData}
                dataKey="amount"
                nameKey="category"
                outerRadius={90}
                fill="#82ca9d"
                label
              >
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
