"use client";
import { useParams } from "next/navigation";

export default function TransactionDetailPage() {
  const { id } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Transaction Details</h1>
      <p className="text-gray-600">Transaction ID: {id}</p>
    </div>
  );
}
