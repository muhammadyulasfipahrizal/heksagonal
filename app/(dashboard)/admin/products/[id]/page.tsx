
"use client";

import { DashboardSidebar } from "@/components";
import apiClient from "@/lib/api";
import { sanitizeFormData } from "@/lib/form-sanitize";
import { getImageSrc } from "@/lib/utils";
import {
  convertCategoryNameToURLFriendly as convertSlugToURLFriendly,
  formatCategoryName,
} from "@/utils/categoryFormating";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

type ProductVariantForm = {
  localId: string;
  id?: string;
  sku: string;
  title: string;
  price: number;
  stock: number;
  image: string;
  attributesText: string;
  description: string;
  isDefault: boolean;
  isActive: boolean;
};

type ProductForm = {
  title: string;
  slug: string;
  mainImage: string;
  manufacturer: string;
  description: string;
  keywords: string;
  categoryId: string;
  merchantId: string;
  rating: number;
};

type ProductVariantResponse = {
  id: string;
  sku: string | null;
  title: string | null;
  price: number;
  stock: number;
  image: string | null;
  description: string;
  attributes: Record<string, unknown>;
  isDefault: boolean;
  isActive: boolean;
};

type ProductResponse = ProductForm & {
  id: string;
  variants: ProductVariantResponse[];
};

const createVariant = (isDefault = false): ProductVariantForm => ({
  localId: crypto.randomUUID(),
  sku: "",
  title: "",
  price: 0,
  stock: 0,
  image: "",
  description: "",
  attributesText: "{}",
  isDefault,
  isActive: true,
});

const emptyProduct: ProductForm = {
  title: "",
  slug: "",
  mainImage: "",
  manufacturer: "",
  description: "",
  keywords: "",
  categoryId: "",
  merchantId: "",
  rating: 0,
};

const getErrorMessage = (
  data: Record<string, unknown> | null,
  fallback: string
) => {
  const message = data?.message || data?.error;
  return typeof message === "string" ? message : fallback;
};

const DashboardProductDetails = () => {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [product, setProduct] = useState<ProductForm>(emptyProduct);
  const [variants, setVariants] = useState<ProductVariantForm[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateVariant = useCallback(
    (localId: string, changes: Partial<ProductVariantForm>) => {
      setVariants((current) =>
        current.map((variant) =>
          variant.localId === localId
            ? { ...variant, ...changes }
            : variant
        )
      );
    },
    []
  );

  const addVariant = () => {
    setVariants((current) => [
      ...current,
      createVariant(current.length === 0),
    ]);
  };

  const removeVariant = (localId: string) => {
    setVariants((current) => {
      const remaining = current.filter(
        (variant) => variant.localId !== localId
      );

      if (
        remaining.length > 0 &&
        !remaining.some((variant) => variant.isDefault)
      ) {
        remaining[0] = {
          ...remaining[0],
          isDefault: true,
        };
      }

      return remaining;
    });
  };

  const setDefaultVariant = (localId: string) => {
    setVariants((current) =>
      current.map((variant) => ({
        ...variant,
        isDefault: variant.localId === localId,
      }))
    );
  };

  const fetchProductData = useCallback(async () => {
    setLoading(true);

    try {
      const response = await apiClient.get(
        `/api/products/${id}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch product details.");
      }

      const data: ProductResponse = await response.json();

      setProduct({
        title: data.title ?? "",
        slug: data.slug ?? "",
        mainImage: data.mainImage ?? "",
        manufacturer: data.manufacturer ?? "",
        description: data.description ?? "",
        keywords: data.keywords ?? "",
        categoryId: data.categoryId ?? "",
        merchantId: data.merchantId ?? "",
        rating: data.rating ?? 0,
      });

      const loadedVariants = Array.isArray(data.variants)
        ? data.variants.map((variant) => ({
            localId: crypto.randomUUID(),
            id: variant.id,
            sku: variant.sku ?? "",
            title: variant.title ?? "",
            price: Number(variant.price),
            stock: Number(variant.stock),
            image: variant.image ?? "",
            description: variant.description ?? "",
            attributesText: JSON.stringify(
              variant.attributes ?? {},
              null,
              2
            ),
            isDefault: Boolean(variant.isDefault),
            isActive: Boolean(variant.isActive),
          }))
        : [];

      setVariants(loadedVariants);
    } catch (error) {
      console.error("Failed to fetch product:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to load product."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get("/api/categories");

      if (!response.ok) {
        throw new Error("Failed to fetch categories.");
      }

      const data: Category[] = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      toast.error("Failed to load categories.");
    }
  }, []);

  useEffect(() => {
    void fetchProductData();
    void fetchCategories();
  }, [fetchProductData, fetchCategories]);

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

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to upload image.")
        );
      }

      const filename = data?.filename || data?.fileName;

      if (typeof filename !== "string" || !filename) {
        throw new Error(
          "Upload succeeded, but the server did not return a filename."
        );
      }

      onSuccess(filename);
      toast.success("Image uploaded successfully.");
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload image."
      );
    }
  };

  const updateProduct = async () => {
    if (
      !product.title.trim() ||
      !product.mainImage.trim() ||
      !product.categoryId
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
      description: string,
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
            `Variant ${index + 1}: attributes must be valid JSON.`
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
          description: variant.description,
          image: variant.image.trim() || null,
          attributes: attributes as Record<string, unknown>,
          isDefault: variant.isDefault,
          isActive: variant.isActive,
        };
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Invalid variant data."
      );
      return;
    }

    setIsSaving(true);

    try {
      const defaultVariant = preparedVariants.find(
        (variant) => variant.isDefault
      )!;

      const payload = sanitizeFormData({
        ...product,
        slug:
          product.slug.trim() ||
          convertSlugToURLFriendly(product.title),
        price: defaultVariant.price,
        inStock: preparedVariants.some(
          (variant) => variant.isActive && variant.stock > 0
        )
          ? 1
          : 0,
        variants: preparedVariants,
      });

      const response = await apiClient.put(
        `/api/products/${id}`,
        payload
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to update product.")
        );
      }

      toast.success("Product and variants updated successfully.");
      await fetchProductData();
    } catch (error) {
      console.error("Failed to update product:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update product."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await apiClient.delete(
        `/api/products/${id}`
      );

      if (response.status === 204) {
        toast.success("Product deleted successfully.");
        router.push("/admin/products");
        return;
      }

      const data = await response.json().catch(() => null);

      throw new Error(
        getErrorMessage(data, "Failed to delete product.")
      );
    } catch (error) {
      console.error("Failed to delete product:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete product."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const fieldClass = "input input-bordered w-full";
  const labelClass = "label label-text";

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <DashboardSidebar />
        <div className="p-8">Loading product details...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-screen-2xl justify-start bg-white max-xl:flex-col max-xl:gap-y-5 xl:h-full">
      <DashboardSidebar />

      <div className="flex w-full flex-col gap-y-7 xl:ml-5 max-xl:px-5">
        <h1 className="text-3xl font-semibold">Edit product</h1>

        {/* Product information */}
        <section className="space-y-5 rounded-lg border p-5">
          <h2 className="text-xl font-semibold">
            Product information
          </h2>

          <label className="form-control w-full max-w-xl">
            <span className={labelClass}>Product name *</span>
            <input
              className={fieldClass}
              value={product.title}
              onChange={(e) =>
                setProduct((current) => ({
                  ...current,
                  title: e.target.value,
                }))
              }
            />
          </label>

          <label className="form-control w-full max-w-xl">
            <span className={labelClass}>Slug</span>
            <input
              className={fieldClass}
              value={product.slug}
              onChange={(e) =>
                setProduct((current) => ({
                  ...current,
                  slug: convertSlugToURLFriendly(e.target.value),
                }))
              }
            />
          </label>

          <label className="form-control w-full max-w-xl">
            <span className={labelClass}>Manufacturer optional</span>
            <input
              className={fieldClass}
              value={product.manufacturer}
              onChange={(e) =>
                setProduct((current) => ({
                  ...current,
                  manufacturer: e.target.value,
                }))
              }
            />
          </label>

          <label className="form-control w-full max-w-xl">
            <span className={labelClass}>Category *</span>
            <select
              className="select select-bordered w-full"
              value={product.categoryId}
              onChange={(e) =>
                setProduct((current) => ({
                  ...current,
                  categoryId: e.target.value,
                }))
              }
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {formatCategoryName(category.name)}
                </option>
              ))}
            </select>
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
                  setProduct((current) => ({
                    ...current,
                    mainImage: filename,
                  }));
                });

                e.target.value = "";
              }}
            />
          </label>

          {product.mainImage && (
            <div>
              <Image
                src={getImageSrc(product.mainImage)}
                alt={product.title || "Product image"}
                width={120}
                height={120}
                className="h-auto w-auto rounded border object-contain"
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
                setProduct((current) => ({
                  ...current,
                  keywords: e.target.value,
                }))
              }
            />
          </label>
        </section>

        {/* Variants */}
        <section className="space-y-5 rounded-lg border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">
                Product variants
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Edit prices, stock, images, SKU, and custom attributes.
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
                    <span className="badge badge-primary ml-2">
                      Default
                    </span>
                  )}
                  {variant.id && (
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      Existing variant
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
                <span className={labelClass}>Variant name</span>
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

              {/* <label className="form-control">
                <span className={labelClass}>SKU (optional)</span>
                <input
                  className={fieldClass}
                  value={variant.sku}
                  onChange={(e) =>
                    updateVariant(variant.localId, {
                      sku: e.target.value,
                    })
                  }
                  placeholder="Example: PRODUCT-RED-5KG"
                />
              </label> */}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="form-control">
                  <span className={labelClass}>Price (IDR) *</span>
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
                  <span className={labelClass}>Stock quantity *</span>
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
                <span className={labelClass}>Variant image</span>
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

                    e.target.value = "";
                  }}
                />
              </label>

              {variant.image && (
                <div>
                  <Image
                    src={getImageSrc(variant.image)}
                    alt={variant.title || `Variant ${index + 1}`}
                    width={100}
                    height={100}
                    className="h-auto w-auto rounded border object-contain"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    {variant.image}
                  </p>
                </div>
              )}

              <label className="form-control">
                <span className={labelClass}>Variant description</span>

                <textarea
                  className="textarea textarea-bordered h-40"
                  value={variant.description}
                  onChange={(e) =>
                    updateVariant(variant.localId, {
                      description: e.target.value,
                    })
                  }
                />
              </label>

              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={variant.isDefault}
                  onChange={() => setDefaultVariant(variant.localId)}
                />
                <span className="text-sm">Default variant</span>
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
                <span className="text-sm">Variant is active</span>
              </label>
            </div>
          ))}

          {variants.length === 0 && (
            <p className="text-sm text-error">
              No variants. Add at least one variant before saving.
            </p>
          )}
        </section>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pb-10">
          <button
            type="button"
            onClick={updateProduct}
            disabled={isSaving || isDeleting}
            className="bg-[#02054b] px-8 py-4 font-bold uppercase text-white shadow-sm hover:bg-[#01043D] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving changes..." : "Update product"}
          </button>

          <button
            type="button"
            onClick={deleteProduct}
            disabled={isSaving || isDeleting}
            className="bg-red-600 px-8 py-4 font-bold uppercase text-white shadow-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "Deleting..." : "Delete product"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/admin/products")}
            disabled={isSaving || isDeleting}
            className="btn btn-outline"
          >
            Cancel
          </button>
        </div>

        <p className="pb-5 text-sm text-error">
          Products associated with customer orders cannot be deleted
          until the related order records are handled.
        </p>
      </div>
    </div>
  );
};

export default DashboardProductDetails;
