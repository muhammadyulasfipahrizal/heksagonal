
"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { convertCategoryNameToURLFriendly as convertSlugToURLFriendly } from "@/utils/categoryFormating";
import { sanitizeFormData } from "@/lib/form-sanitize";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

type ProductVariantForm = {
  localId: string;
  sku: string;
  title: string;
  price: number;
  stock: number;
  image: string;
  attributesText: string;
  isDefault: boolean;
  isActive: boolean;
};

type ProductForm = {
  merchantId: string;
  title: string;
  manufacturer: string;
  mainImage: string;
  description: string;
  keywords: string;
  slug: string;
  categoryId: string;
};

const createVariant = (isDefault = false): ProductVariantForm => ({
  localId: crypto.randomUUID(),
  sku: "",
  title: "",
  price: 0,
  stock: 0,
  image: "",
  attributesText: "{}",
  isDefault,
  isActive: true,
});

const initialProduct: ProductForm = {
  merchantId: "",
  title: "",
  manufacturer: "",
  mainImage: "",
  description: "",
  keywords: "",
  slug: "",
  categoryId: "",
};

const AddNewProduct = () => {
  const [product, setProduct] = useState<ProductForm>(initialProduct);
  const [variants, setVariants] = useState<ProductVariantForm[]>([
    createVariant(true),
  ]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateVariant = (
    localId: string,
    changes: Partial<ProductVariantForm>
  ) => {
    setVariants((prev) =>
      prev.map((variant) =>
        variant.localId === localId
          ? { ...variant, ...changes }
          : variant
      )
    );
  };

  const addVariant = () => {
    setVariants((prev) => [...prev, createVariant(prev.length === 0)]);
  };

  const removeVariant = (localId: string) => {
    setVariants((prev) => {
      const remaining = prev.filter(
        (variant) => variant.localId !== localId
      );

      if (remaining.length > 0 && !remaining.some((v) => v.isDefault)) {
        remaining[0] = { ...remaining[0], isDefault: true };
      }

      return remaining;
    });
  };

  const setDefaultVariant = (localId: string) => {
    setVariants((prev) =>
      prev.map((variant) => ({
        ...variant,
        isDefault: variant.localId === localId,
      }))
    );
  };

  const addProduct = async () => {
    console.log('isinya produk', product)
    if (
      !product.merchantId ||
      !product.categoryId ||
      !product.title.trim() ||
      !product.manufacturer.trim() ||
      !product.description.trim() ||
      !product.mainImage
    ) {
      toast.error("Please complete all required product fields.");
      return;
    }

    if (variants.length === 0) {
      toast.error("Please add at least one product variant.");
      return;
    }

    if (!variants.some((variant) => variant.isDefault)) {
      toast.error("Please select a default variant.");
      return;
    }

    // Validate each variant before sending the request.
    const skuValues = variants
      .map((variant) => variant.sku.trim())
      .filter(Boolean);

    if (new Set(skuValues).size !== skuValues.length) {
      toast.error("Each variant must have a unique SKU.");
      return;
    }

    let preparedVariants: Array<{
      sku: string | null;
      title: string | null;
      price: number;
      stock: number;
      image: string | null;
      attributes: Record<string, unknown>;
      isDefault: boolean;
      isActive: boolean;
    }>;

    try {
      preparedVariants = variants.map((variant, index) => {
        if (
          !Number.isSafeInteger(variant.price) ||
          variant.price < 0 ||
          !Number.isSafeInteger(variant.stock) ||
          variant.stock < 0
        ) {
          throw new Error(
            `Variant ${index + 1}: price and stock must be non-negative integers.`
          );
        }

        let attributes: unknown;

        try {
          attributes = JSON.parse(variant.attributesText);
        } catch {
          throw new Error(
            `Variant ${index + 1}: attributes must contain valid JSON.`
          );
        }

        if (
          attributes === null ||
          typeof attributes !== "object" ||
          Array.isArray(attributes)
        ) {
          throw new Error(
            `Variant ${index + 1}: attributes must be a JSON object.`
          );
        }

        return {
          sku: variant.sku.trim() || null,
          title: variant.title.trim() || null,
          price: variant.price,
          stock: variant.stock,
          image: variant.image || null,
          attributes: attributes as Record<string, unknown>,
          isDefault: variant.isDefault,
          isActive: variant.isActive,
        };
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Invalid variant data."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Keep legacy Product.price and Product.inStock fields compatible.
      // Variant prices and stocks remain the source of truth.
      const defaultVariant = preparedVariants.find(
        (variant) => variant.isDefault
      )!;

      const payload = sanitizeFormData({
        ...product,
        slug:
          product.slug ||
          convertSlugToURLFriendly(product.title),
        price: defaultVariant.price,
        inStock: preparedVariants.some(
          (variant) => variant.isActive && variant.stock > 0
        )
          ? 1
          : 0,
        variants: preparedVariants,
      });

      const response = await apiClient.post(
        "/api/products",
        payload
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "Failed to add product."
        );
      }

      const data = await response.json();

      console.log("Product and variants created:", data);
      toast.success("Product and variants added successfully!");

      setProduct({
        ...initialProduct,
        categoryId: categories[0]?.id || "",
        merchantId: merchants[0]?.id || "",
      });

      setVariants([createVariant(true)]);
    } catch (error) {
      console.error("Error adding product:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Network error. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchMerchants = async () => {
    try {
      const response = await apiClient.get("/api/merchants");

      if (!response.ok) {
        throw new Error("Failed to fetch merchants.");
      }

      const data: Merchant[] = await response.json();
      setMerchants(data);

      setProduct((prev) => ({
        ...prev,
        merchantId: prev.merchantId || data[0]?.id || "",
      }));

      if (data.length === 0) {
        toast.error("Please create a merchant first.");
      }
    } catch (error) {
      console.error("Error fetching merchants:", error);
      toast.error("Failed to load merchants.");
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await apiClient.get("/api/categories");

      if (!response.ok) {
        throw new Error("Failed to fetch categories.");
      }

      const data: Category[] = await response.json();
      setCategories(data);

      setProduct((prev) => ({
        ...prev,
        categoryId: prev.categoryId || data[0]?.id || "",
      }));
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories.");
    }
  };

  const uploadFile = async (
    file: File,
    onSuccess: (filename: string) => void
  ) => {
    const formData = new FormData();
    formData.append("uploadedFile", file);

    try {
      const response = await apiClient.post(
        "/api/main-image",
        formData
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "Failed to upload image."
        );
      }

      const data = await response.json();

      // Adjust this if your API returns a different filename field.
      const filename =
        data.filename || data.fileName || file.name;

      onSuccess(filename);
      toast.success("Image uploaded successfully.");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload image."
      );
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchMerchants();
  }, []);

  const fieldClass = "input input-bordered w-full";
  const labelClass = "label label-text";

  return (
    <div className="mx-auto flex min-h-screen max-w-screen-2xl justify-start bg-white xl:h-full max-xl:flex-col max-xl:gap-y-5">
      <DashboardSidebar />

      <div className="flex w-full flex-col gap-y-7 xl:ml-5 max-xl:px-5">
        <h1 className="text-3xl font-semibold">
          Add new product
        </h1>

        {/* General product information */}
        <section className="space-y-5 rounded-lg border p-5">
          <h2 className="text-xl font-semibold">
            Product information
          </h2>

          <label className="form-control w-full max-w-xl">
            <span className={labelClass}>Merchant *</span>
            <select
              className="select select-bordered"
              value={product.merchantId}
              onChange={(e) =>
                setProduct({
                  ...product,
                  merchantId: e.target.value,
                })
              }
            >
              <option value="">Select merchant</option>
              {merchants.map((merchant) => (
                <option key={merchant.id} value={merchant.id}>
                  {merchant.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control w-full max-w-xl">
            <span className={labelClass}>Product name *</span>
            <input
              className={fieldClass}
              value={product.title}
              onChange={(e) =>
                setProduct({
                  ...product,
                  title: e.target.value,
                })
              }
              placeholder="Example: Industrial Cable"
            />
          </label>

          <label className="form-control w-full max-w-xl">
            <span className={labelClass}>Category *</span>
            <select
              className="select select-bordered"
              value={product.categoryId}
              onChange={(e) =>
                setProduct({
                  ...product,
                  categoryId: e.target.value,
                })
              }
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="form-control w-full max-w-xl">
            <span className={labelClass}>Manufacturer *</span>
            <input
              className={fieldClass}
              value={product.manufacturer}
              onChange={(e) =>
                setProduct({
                  ...product,
                  manufacturer: e.target.value,
                })
              }
              placeholder="Manufacturer name"
            />
          </label>

          <label className="form-control w-full max-w-xl">
            <span className={labelClass}>Main product image *</span>
            <input
              type="file"
              accept="image/*"
              className="file-input file-input-bordered w-full"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;

                void uploadFile(file, (filename) => {
                  setProduct((prev) => ({
                    ...prev,
                    mainImage: filename,
                  }));
                });
              }}
            />
          </label>

          {product.mainImage && (
            <div>
              <Image
                src={`/${product.mainImage}`}
                alt={product.title || "Product"}
                width={120}
                height={120}
                className="h-auto w-auto rounded border"
              />
              <p className="mt-1 text-xs text-gray-500">
                {product.mainImage}
              </p>
            </div>
          )}

          <label className="form-control w-full max-w-xl">
            <span className={labelClass}>Keywords</span>
            <textarea
              className="textarea textarea-bordered h-24"
              value={product.keywords}
              onChange={(e) =>
                setProduct({
                  ...product,
                  keywords: e.target.value,
                })
              }
              placeholder="Separate keywords with commas"
            />
          </label>

          <label className="form-control w-full max-w-xl">
            <span className={labelClass}>
              Product description *
            </span>
            <textarea
              className="textarea textarea-bordered h-32"
              value={product.description}
              onChange={(e) =>
                setProduct({
                  ...product,
                  description: e.target.value,
                })
              }
              placeholder="Describe the product..."
            />
          </label>
        </section>

        {/* Product variants */}
        <section className="space-y-5 rounded-lg border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                Product variants
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Configure the price, stock, SKU, and custom
                attributes for each purchasable variant.
              </p>
            </div>

            <button
              type="button"
              onClick={addVariant}
              className="btn btn-outline"
            >
              + Add variant
            </button>
          </div>

          {variants.map((variant, index) => (
            <div
              key={variant.localId}
              className="space-y-4 rounded-lg border bg-gray-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">
                  Variant {index + 1}
                  {variant.isDefault && (
                    <span className="ml-2 badge badge-primary">
                      Default
                    </span>
                  )}
                </h3>

                <button
                  type="button"
                  disabled={variants.length === 1}
                  onClick={() => removeVariant(variant.localId)}
                  className="btn btn-sm btn-error btn-outline"
                >
                  Remove
                </button>
              </div>

              <label className="form-control">
                <span className={labelClass}>
                  Variant name
                </span>
                <input
                  className={fieldClass}
                  value={variant.title}
                  onChange={(e) =>
                    updateVariant(variant.localId, {
                      title: e.target.value,
                    })
                  }
                  placeholder="Example: Red / 5 kg / Model A"
                />
              </label>

              <label className="form-control">
                <span className={labelClass}>
                  SKU (optional)
                </span>
                <input
                  className={fieldClass}
                  value={variant.sku}
                  onChange={(e) =>
                    updateVariant(variant.localId, {
                      sku: e.target.value,
                    })
                  }
                  placeholder="Example: CABLE-RED-100M"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className={labelClass}>
                    Price (IDR) *
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={fieldClass}
                    value={variant.price}
                    onChange={(e) =>
                      updateVariant(variant.localId, {
                        price:
                          e.target.value === ""
                            ? 0
                            : Number(e.target.value),
                      })
                    }
                  />
                </label>

                <label className="form-control">
                  <span className={labelClass}>
                    Stock quantity *
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={fieldClass}
                    value={variant.stock}
                    onChange={(e) =>
                      updateVariant(variant.localId, {
                        stock:
                          e.target.value === ""
                            ? 0
                            : Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>

              <label className="form-control">
                <span className={labelClass}>
                  Variant image (optional)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="file-input file-input-bordered w-full"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    void uploadFile(file, (filename) => {
                      updateVariant(variant.localId, {
                        image: filename,
                      });
                    });
                  }}
                />

                {variant.image && (
                  <div className="mt-2">
                    <Image
                      src={`/${variant.image}`}
                      alt={variant.title || `Variant ${index + 1}`}
                      width={80}
                      height={80}
                      className="h-auto w-auto rounded border"
                    />
                    <p className="text-xs text-gray-500">
                      {variant.image}
                    </p>
                  </div>
                )}
              </label>

              <label className="form-control">
                <span className={labelClass}>
                  Attributes (JSON) *
                </span>
                <textarea
                  className="textarea textarea-bordered h-32 font-mono text-sm"
                  value={variant.attributesText}
                  onChange={(e) =>
                    updateVariant(variant.localId, {
                      attributesText: e.target.value,
                    })
                  }
                  spellCheck={false}
                />
                <span className="mt-1 text-xs text-gray-500">
                  Example: {"{"}"color": "Red", "length": "100 m"
                  {"}"}
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={variant.isDefault}
                  onChange={() =>
                    setDefaultVariant(variant.localId)
                  }
                />
                <span className="text-sm">
                  Use as default variant
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={variant.isActive}
                  onChange={(e) =>
                    updateVariant(variant.localId, {
                      isActive: e.target.checked,
                    })
                  }
                />
                <span className="text-sm">
                  Variant is active
                </span>
              </label>
            </div>
          ))}
        </section>

        <div className="pb-10">
          <button
            onClick={addProduct}
            type="button"
            disabled={isSubmitting}
            className="border border-gray-300 bg-[#02054b] px-10 py-5 text-lg font-bold uppercase text-white shadow-sm hover:bg-[#01043D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Saving product..." : "Add product"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNewProduct;
