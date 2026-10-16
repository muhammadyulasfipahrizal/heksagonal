"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { formatRupiah } from "@/lib/sanitize";
import { isValidEmailAddressFormat, isValidNameOrLastname } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

type DeliveryMethod = "PICKUP" | "SHIPPING";
type OrderStatus = "processing" | "delivered" | "canceled";

interface OrderProduct {
  id: string;
  customerOrderId: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    slug: string;
    title: string;
    mainImage: string;
    price: number;
    rating: number;
    description: string;
    manufacturer: string;
    inStock: number;
    categoryId: string;
  };
}

interface Order {
  id: string;
  name: string;
  phone: string;
  email: string;
  deliveryMethod: DeliveryMethod;
  adress: string | null;
  postalCode: string | null;
  city: string | null;
  province: string | null;
  district: string | null;
  dateTime: string | null;
  orderNotice: string | null;
  status: OrderStatus;
  total: number;
}

const SHIPPING_COST = 50000;

const AdminSingleOrder = () => {
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const params = useParams<{ id: string }>();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    const fetchOrderData = async () => {
      setIsLoading(true);

      try {
        const [orderResponse, productsResponse] = await Promise.all([
          apiClient.get(`/api/orders/${params.id}`),
          apiClient.get(`/api/order-product/${params.id}`),
        ]);

        if (!orderResponse.ok || !productsResponse.ok) {
          throw new Error("Failed to fetch order data");
        }

        const orderData: Order = await orderResponse.json();
        const productsData: OrderProduct[] = await productsResponse.json();

        if (!cancelled) {
          setOrder({
            ...orderData,
            deliveryMethod: orderData.deliveryMethod ?? "PICKUP",
            adress: orderData.adress ?? "",
            postalCode: orderData.postalCode ?? "",
            city: orderData.city ?? "",
            province: orderData.province ?? "",
            district: orderData.district ?? "",
            orderNotice: orderData.orderNotice ?? "",
          });
          setOrderProducts(productsData);
        }
      } catch {
        if (!cancelled) {
          toast.error("Failed to load order details");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchOrderData();

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const updateOrder = async () => {
    if (!order) return;

    if (!order.name.trim() || !order.phone.trim() || !order.email.trim()) {
      toast.error("Please fill in name, phone number, and email");
      return;
    }

    if (!isValidNameOrLastname(order.name.trim())) {
      toast.error("You entered an invalid name");
      return;
    }

    if (!isValidEmailAddressFormat(order.email.trim())) {
      toast.error("You entered an invalid email address");
      return;
    }

    if (order.deliveryMethod === "SHIPPING") {
      const requiredAddressFields = [
        order.adress,
        order.postalCode,
        order.city,
        order.province,
        order.district,
      ];

      if (requiredAddressFields.some((value) => !value?.trim())) {
        toast.error("Please complete all shipping address fields");
        return;
      }
    }

    setIsSaving(true);

    try {
      const payload = {
        name: order.name.trim(),
        phone: order.phone.trim(),
        email: order.email.trim().toLowerCase(),
        deliveryMethod: order.deliveryMethod,
        adress:
          order.deliveryMethod === "SHIPPING"
            ? order.adress?.trim() || null
            : null,
        postalCode:
          order.deliveryMethod === "SHIPPING"
            ? order.postalCode?.trim() || null
            : null,
        city:
          order.deliveryMethod === "SHIPPING"
            ? order.city?.trim() || null
            : null,
        province:
          order.deliveryMethod === "SHIPPING"
            ? order.province?.trim() || null
            : null,
        district:
          order.deliveryMethod === "SHIPPING"
            ? order.district?.trim() || null
            : null,
        orderNotice: order.orderNotice?.trim() || null,
        status: order.status,
      };

      const response = await apiClient.put(`/api/orders/${order.id}`, {
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to update order");
      }

      toast.success("Order updated successfully");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "There was an error while updating the order"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteOrder = async () => {
    if (!order || isDeleting) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this order?"
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      // Delete the order directly if the backend handles related products
      // through a transaction or cascading delete.
      const response = await apiClient.delete(`/api/orders/${order.id}`);

      if (!response.ok) {
        throw new Error("Failed to delete order");
      }

      toast.success("Order deleted successfully");
      router.push("/admin/orders");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "There was an error deleting the order"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-white">
        <DashboardSidebar />
        <main className="w-full p-6">
          <p>Loading order details...</p>
        </main>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen bg-white">
        <DashboardSidebar />
        <main className="w-full p-6">
          <h1 className="text-2xl font-semibold">Order not found</h1>
          <Link
            href="/admin/orders"
            className="mt-4 inline-block text-blue-700 underline"
          >
            Back to orders
          </Link>
        </main>
      </div>
    );
  }

  const updateField = <K extends keyof Order>(field: K, value: Order[K]) => {
    setOrder((current) =>
      current ? { ...current, [field]: value } : current
    );
  };

  const subtotal = order.total;
  const tax = Math.round(subtotal / 5);
  const shipping =
    order.deliveryMethod === "SHIPPING" && subtotal > 0
      ? SHIPPING_COST
      : 0;
  const grandTotal = subtotal + tax + shipping;

  return (
    <div className="mx-auto flex max-w-screen-2xl justify-start bg-white xl:h-full max-xl:flex-col max-xl:gap-y-5">
      <DashboardSidebar />

      <main className="flex w-full flex-col gap-y-7 xl:ml-5 max-xl:px-5">
        <h1 className="text-3xl font-semibold">Order details</h1>

        <div>
          <p className="text-xl font-bold">Order ID:</p>
          <p className="break-all text-base">{order.id}</p>
        </div>

        <div>
          <label className="form-control w-full max-w-md">
            <span className="label-text mb-2">Customer name</span>
            <input
              type="text"
              className="input input-bordered"
              value={order.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </label>
        </div>

        <div>
          <label className="form-control w-full max-w-md">
            <span className="label-text mb-2">Phone number</span>
            <input
              type="tel"
              className="input input-bordered"
              value={order.phone}
              onChange={(e) => updateField("phone", e.target.value)}
            />
          </label>
        </div>

        <div>
          <label className="form-control w-full max-w-md">
            <span className="label-text mb-2">Email address</span>
            <input
              type="email"
              className="input input-bordered"
              value={order.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </label>
        </div>

        <div>
          <label className="form-control w-full max-w-md">
            <span className="label-text mb-2">Delivery method</span>
            <select
              className="select select-bordered"
              value={order.deliveryMethod}
              onChange={(e) =>
                updateField(
                  "deliveryMethod",
                  e.target.value as DeliveryMethod
                )
              }
            >
              <option value="PICKUP">Pickup</option>
              <option value="SHIPPING">Shipping</option>
            </select>
          </label>
        </div>

        {order.deliveryMethod === "SHIPPING" && (
          <section className="flex flex-col gap-y-4 rounded-lg border p-5">
            <h2 className="text-xl font-semibold">Shipping address</h2>

            <label className="form-control w-full max-w-xl">
              <span className="label-text mb-2">Address</span>
              <input
                type="text"
                className="input input-bordered"
                value={order.adress ?? ""}
                onChange={(e) => updateField("adress", e.target.value)}
              />
            </label>

            <label className="form-control w-full max-w-md">
              <span className="label-text mb-2">Postal code</span>
              <input
                type="text"
                className="input input-bordered"
                value={order.postalCode ?? ""}
                onChange={(e) => updateField("postalCode", e.target.value)}
              />
            </label>

            <label className="form-control w-full max-w-md">
              <span className="label-text mb-2">City</span>
              <input
                type="text"
                className="input input-bordered"
                value={order.city ?? ""}
                onChange={(e) => updateField("city", e.target.value)}
              />
            </label>

            <label className="form-control w-full max-w-md">
              <span className="label-text mb-2">Province</span>
              <input
                type="text"
                className="input input-bordered"
                value={order.province ?? ""}
                onChange={(e) => updateField("province", e.target.value)}
              />
            </label>

            <label className="form-control w-full max-w-md">
              <span className="label-text mb-2">District</span>
              <input
                type="text"
                className="input input-bordered"
                value={order.district ?? ""}
                onChange={(e) => updateField("district", e.target.value)}
              />
            </label>
          </section>
        )}

        <div>
          <label className="form-control w-full max-w-md">
            <span className="label-text mb-2">Order status</span>
            <select
              className="select select-bordered"
              value={order.status}
              onChange={(e) =>
                updateField("status", e.target.value as OrderStatus)
              }
            >
              <option value="processing">Processing</option>
              <option value="delivered">Delivered</option>
              <option value="canceled">Canceled</option>
            </select>
          </label>
        </div>

        <div>
          <label className="form-control w-full max-w-xl">
            <span className="label-text mb-2">Order notice</span>
            <textarea
              className="textarea textarea-bordered h-24"
              value={order.orderNotice ?? ""}
              onChange={(e) => updateField("orderNotice", e.target.value)}
            />
          </label>
        </div>

        <section className="flex flex-col gap-y-4">
          <h2 className="text-xl font-semibold">Ordered products</h2>

          {orderProducts.length === 0 ? (
            <p>No products found for this order.</p>
          ) : (
            orderProducts.map((item) => (
              <div
                className="flex items-center gap-x-4"
                key={item.id}
              >
                <Image
                  src={
                    item.product.mainImage
                      ? `/${item.product.mainImage}`
                      : "/product_placeholder.jpg"
                  }
                  alt={item.product.title}
                  width={50}
                  height={50}
                  className="h-[50px] w-[50px] object-contain"
                />

                <div>
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="hover:underline"
                  >
                    {item.product.title}
                  </Link>
                  <p>
                    {formatRupiah(item.product.price)} × {item.quantity} items
                  </p>
                </div>
              </div>
            ))
          )}

          <div className="mt-6 flex flex-col gap-y-2">
            <p className="text-xl">
              Subtotal: {formatRupiah(subtotal)}
            </p>
            <p className="text-xl">
              Tax 20%: {formatRupiah(tax)}
            </p>
            <p className="text-xl">
              Shipping: {formatRupiah(shipping)}
            </p>
            <p className="text-3xl font-semibold">
              Total: {formatRupiah(grandTotal)}
            </p>
          </div>
        </section>

        <div className="mt-5 flex gap-x-2 max-sm:flex-col max-sm:gap-y-3">
          <button
            type="button"
            disabled={isSaving || isDeleting}
            className="border-gray-300 border bg-[#02054b] px-10 py-5 text-lg font-bold uppercase text-white shadow-sm hover:bg-[#01043D] disabled:cursor-not-allowed disabled:opacity-50"
            onClick={updateOrder}
          >
            {isSaving ? "Saving..." : "Update order"}
          </button>

          <button
            type="button"
            disabled={isSaving || isDeleting}
            className="border-gray-300 border bg-red-600 px-10 py-5 text-lg font-bold uppercase text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={deleteOrder}
          >
            {isDeleting ? "Deleting..." : "Delete order"}
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdminSingleOrder;
