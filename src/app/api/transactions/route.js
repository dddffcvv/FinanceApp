import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const filePath = path.resolve(process.cwd(), "transactions.json");

// Helper to read transactions from file
async function readTransactions() {
  try {
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return []; // If file doesn't exist or is empty, return empty array
  }
}

// Helper to write transactions to file
async function writeTransactions(transactions) {
  await fs.writeFile(filePath, JSON.stringify(transactions, null, 2));
}

// GET all transactions
export async function GET() {
  const transactions = await readTransactions();
  return NextResponse.json(transactions);
}

// POST new transaction
export async function POST(req) {
  const body = await req.json();
  const transactions = await readTransactions();
  transactions.push(body);
  await writeTransactions(transactions);
  return NextResponse.json({ message: "Added" });
}

// PUT update transaction
export async function PUT(req) {
  const body = await req.json();
  const transactions = await readTransactions();
  const index = transactions.findIndex((t) => t.id === body.id);

  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...body };
    await writeTransactions(transactions);
  }

  return NextResponse.json({ message: "Updated" });
}

// DELETE single OR all
export async function DELETE(req) {
  const body = await req.json();
  let transactions = await readTransactions();

  if (body.deleteAll) {
    transactions = [];
    await writeTransactions(transactions);
    return NextResponse.json({ message: "All transactions deleted." });
  }

  const index = transactions.findIndex((t) => t.id === body.id);
  if (index !== -1) {
    transactions.splice(index, 1);
    await writeTransactions(transactions);
  }

  return NextResponse.json({ message: "Deleted" });
}
