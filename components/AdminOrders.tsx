
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/api";
import { formatRupiah } from "@/lib/sanitize";

interface Order {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  status: string;
  total: number;
  dateTime: string;
}

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchOrders = async () => {
      try {
        const response = await apiClient.get("/api/orders");

        if (!response.ok) {
          throw new Error("Failed to fetch orders");
        }

        const data = await response.json();

        if (!cancelled) {
          setOrders(Array.isArray(data?.orders) ? data.orders : []);
        }
      } catch (error) {
        console.error("Failed to fetch orders:", error);
        if (!cancelled) {
          setOrders([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchOrders();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return orders;

    return orders.filter((order) =>
      [
        order.id,
        order.name,
        order.email,
        order.phone,
        order.status,
        order.country,
        order.city,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      )
    );
  }, [orders, searchTerm]);

  return (
    <div className="w-full xl:ml-5 max-xl:mt-5">
      <h1 className="mb-5 text-center text-3xl font-semibold">
        Semua Order
      </h1>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Cari Order ID, nama, email, telepon, atau status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input input-bordered w-full sm:max-w-md"
          aria-label="Cari pesanan"
        />

        <p className="text-sm text-gray-500">
          Menampilkan {filteredOrders.length} dari {orders.length} pesanan
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-md table-pin-cols">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Nama pelanggan</th>
              <th>Status</th>
              <th>Subtotal</th>
              <th>Tanggal</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center">
                  Memuat pesanan...
                </td>
              </tr>
            ) : filteredOrders.length > 0 ? (
              filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <p className="font-bold">#{order.id}</p>
                  </td>

                  <td>
                    <div className="font-bold">{order.name}</div>
                    {order.email && (
                      <div className="text-sm opacity-60">
                        {order.email}
                      </div>
                    )}
                    {order.phone && (
                      <div className="text-sm opacity-60">
                        {order.phone}
                      </div>
                    )}
                  </td>

                  <td>
                    <span className="badge badge-sm">
                      {order.status}
                    </span>
                  </td>

                  <td>{formatRupiah(order.total)}</td>

                  <td>
                    {order.dateTime
                      ? new Date(order.dateTime).toLocaleDateString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        )
                      : "-"}
                  </td>

                  <td>
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="btn btn-ghost btn-xs"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center">
                  {searchTerm.trim()
                    ? `Tidak ada pesanan yang cocok dengan "${searchTerm}".`
                    : "Belum ada pesanan."}
                </td>
              </tr>
            )}
          </tbody>

          <tfoot>
            <tr>
              <th>Order ID</th>
              <th>Nama pelanggan</th>
              <th>Status</th>
              <th>Subtotal</th>
              <th>Tanggal</th>
              <th></th>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
