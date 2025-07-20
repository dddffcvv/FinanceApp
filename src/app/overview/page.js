"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";

export default function OverviewPage() {
  const [transactions, setTransactions] = useState([]);
  const [newTxn, setNewTxn] = useState({
    title: "",
    amount: "",
    category: "",
    date: "",
    incomeAmount: "",
  });
  const [filterCategory, setFilterCategory] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [aiReport, setAiReport] = useState("");
  const [loadingReport, setLoadingReport] = useState(false);
  const fileInputRef = useRef(null);
  const [fileName, setFileName] = useState("transactions");
  const [showPopover, setShowPopover] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    const res = await fetch("/api/transactions");
    const data = await res.json();
    setTransactions(data);
  }

  const handleInputChange = (e) => {
    setNewTxn({ ...newTxn, [e.target.name]: e.target.value });
  };

  const handleAddTransaction = async () => {
    if (!newTxn.amount || !newTxn.category || !newTxn.date) return;

    const transaction = {
      id: crypto.randomUUID(),
      title: newTxn.title || "Untitled",
      amount: parseFloat(newTxn.amount),
      category: newTxn.category,
      date: newTxn.date,
    };
    await fetch("/api/transactions", {
      method: "POST",
      body: JSON.stringify(transaction),
    });

    setNewTxn({ title: "", amount: "", category: "", date: "", incomeAmount: "" });
    fetchTransactions();
  };

  const handleAddMoney = async (amount) => {
    if (!amount) return;

    const now = new Date().toISOString().split("T")[0];
    const transaction = {
      id: crypto.randomUUID(),
      title: "Added Funds",
      amount: parseFloat(amount),
      category: "income",
      date: now,
    };
    await fetch("/api/transactions", {
      method: "POST",
      body: JSON.stringify(transaction),
    });

    setNewTxn({ ...newTxn, incomeAmount: "" });
    fetchTransactions();
  };

  const handleDelete = async (id) => {
    await fetch("/api/transactions", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    fetchTransactions();
  };

  const handleEditClick = (id, txn) => {
    setEditingId(id);
    setEditValues({
      title: txn.title,
      amount: txn.amount,
      category: txn.category,
      date: txn.date,
    });
  };

  async function handleSaveEdit(id) {
    await fetch("/api/transactions", {
      method: "PUT",
      body: JSON.stringify({ id, ...editValues }),
    });

    setEditingId(null);
    fetchTransactions();
  }

  const balance = useMemo(() => {
    const income = transactions.filter((t) => t.category === "income").reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter((t) => t.category !== "income").reduce((sum, t) => sum + t.amount, 0);
    return income - expenses;
  }, [transactions]);

  const filteredTransactions = filterCategory
    ? transactions.filter((txn) => txn.category === filterCategory)
    : transactions;

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    setAiReport("");

    try {
      const res = await fetch("/api/quarterly-report");
      const data = await res.json();
      setAiReport(data.summary);
    } catch (error) {
      setAiReport("Error generating report.");
    } finally {
      setLoadingReport(false);
    }
  };

  const handleExport = () => {
    const headers = ["Title", "Category", "Amount", "Date"];
    const rows = transactions.map((txn) => [
      `"${txn.title}"`,
      `"${txn.category}"`,
      txn.amount,
      txn.date,
    ]);

    const csvContent =
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName || "transactions"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowPopover(false);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const lines = text.trim().split("\n");

        if (lines.length < 2) {
          alert("Invalid CSV format. Must have headers and data.");
          return;
        }

        const rows = lines.slice(1); // Skip header
        const importedData = rows.map((line) => {
          const [title, category, amount, date] = line.split(",");

          return {
            id: crypto.randomUUID(),
            title: title.replace(/"/g, ""),
            category: category.replace(/"/g, ""),
            amount: parseFloat(amount),
            date: date,
          };
        });

        await fetch("/api/transactions", {
          method: "DELETE",
          body: JSON.stringify({ deleteAll: true }),
        });

        await Promise.all(
          importedData.map((txn) =>
            fetch("/api/transactions", {
              method: "POST",
              body: JSON.stringify(txn),
            })
          )
        );

        fetchTransactions();
      } catch (error) {
        alert("Failed to import CSV file.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Finance Tracker</h1>

      {/* Add Money Section */}
      <div className="border p-4 rounded-md space-y-4">
        <h2 className="font-semibold text-lg">Add Money</h2>
        <div className="flex items-center gap-4">
          <input
            type="number"
            placeholder="Amount"
            name="incomeAmount"
            value={newTxn.incomeAmount || ""}
            onChange={handleInputChange}
            className="border p-2 rounded"
          />
          <button
            onClick={() => handleAddMoney(newTxn.incomeAmount)}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Add Money
          </button>
        </div>
      </div>

      {/* Add Transaction Section */}
      <div className="border p-4 rounded-md space-y-4">
        <h2 className="font-semibold text-lg">Add Transaction</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <input
            name="title"
            placeholder="Title"
            value={newTxn.title || ""}
            onChange={handleInputChange}
            className="border p-2 rounded"
          />
          <input
            name="amount"
            type="number"
            placeholder="Amount"
            value={newTxn.amount || ""}
            onChange={handleInputChange}
            className="border p-2 rounded"
          />
          <input
            name="category"
            placeholder="Category"
            value={newTxn.category || ""}
            onChange={handleInputChange}
            className="border p-2 rounded"
          />
          <input
            name="date"
            type="date"
            value={newTxn.date || ""}
            onChange={handleInputChange}
            className="border p-2 rounded"
          />
        </div>
        <button
          onClick={handleAddTransaction}
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Transaction
        </button>
      </div>

      {/* Filter Section */}
      <div className="border p-4 mb-4">
        <label>Filter by Category:</label>
        <input
          className="border p-2 ml-2 rounded"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          placeholder="Enter a category to filter"
        />
        <button
          onClick={() => setFilterCategory("")}
          className="bg-gray-500 ml-2 text-black px-2 py-1 rounded"
        >
          Clear Filter
        </button>
      </div>

      <div className="text-xl font-semibold">
        Current Balance: ${balance.toFixed(2)}
      </div>

      {/* Chart and File Actions Section */}
      <div className="mt-4">
        <Link href="/charts">
          <button className="bg-purple-600 text-white px-4 py-2 rounded">
            View Charts
          </button>
        </Link>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 mb-4 relative">
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded"
            onClick={() => fileInputRef.current.click()}
          >
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleImport}
            className="hidden"
          />

          <div className="relative">
            <button
              className="bg-blue-600 text-white px-3 py-1 rounded"
              onClick={() => setShowPopover(!showPopover)}
            >
              Export
            </button>
            {showPopover && (
              <div className="absolute z-10 mt-2 bg-white border rounded shadow p-4 space-y-2 min-w-[250px]">
                <input
                  type="text"
                  placeholder="File name"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="border p-1 rounded w-full"
                />
                <button
                  onClick={handleExport}
                  className="bg-green-600 text-white px-3 py-1 rounded w-full"
                >
                  Confirm Export
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2">Title</th>
            <th className="border p-2">Category</th>
            <th className="border p-2">Amount</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions?.map((txn) => (
            <tr key={txn.id}>
              <td className="border p-2">
                {editingId === txn.id ? (
                  <input
                    name="title"
                    value={editValues.title}
                    onChange={(e) =>
                      setEditValues({ ...editValues, title: e.target.value })
                    }
                  />
                ) : (
                  txn.title
                )}
              </td>
              <td className="border p-2">
                {editingId === txn.id ? (
                  <input
                    name="category"
                    value={editValues.category}
                    onChange={(e) =>
                      setEditValues({ ...editValues, category: e.target.value })
                    }
                  />
                ) : (
                  txn.category
                )}
              </td>
              <td className="border p-2">
                {editingId === txn.id ? (
                  <input
                    name="amount"
                    type="number"
                    value={editValues.amount}
                    onChange={(e) =>
                      setEditValues({
                        ...editValues,
                        amount: parseFloat(e.target.value),
                      })
                    }
                  />
                ) : (
                  `$${txn.amount?.toFixed(2)}`
                )}
              </td>
              <td className="border p-2">
                {editingId === txn.id ? (
                  <input
                    name="date"
                    type="date"
                    value={editValues.date}
                    onChange={(e) =>
                      setEditValues({ ...editValues, date: e.target.value })
                    }
                  />
                ) : (
                  txn.date
                )}
              </td>
              <td className="border p-2">
                {editingId === txn.id ? (
                  <>
                    <button
                      onClick={() => handleSaveEdit(txn.id)}
                      className="bg-green-500 text-white px-2 py-1 mr-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="bg-gray-500 text-black px-2 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditClick(txn.id, txn)}
                      className="bg-blue-500 text-white px-2 py-1 mr-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(txn.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
