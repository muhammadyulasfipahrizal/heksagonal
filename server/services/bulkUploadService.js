const { parse } = require("csv-parse/sync");

// Validate a single CSV row according to the Product schema constraints
function validateRow(row) {
  console.log("Merchant ID:", row.merchantId);
  
  const errs = [];
  const clean = {};

  const title = String(row.title ?? "").trim();
  const slug = String(row.slug ?? "").trim();
  const code = String(row.code ?? "").trim();
  const weight = Number(row.weight);
  const price = Number(row.price);
  const categoryId = String(row.categoryId ?? "").trim();
  const inStock = Number(row.inStock ?? 0);

  if (!title) errs.push("title is required");
  if (!slug) errs.push("slug is required");
  if (!code) errs.push("code is required");
  if (!Number.isFinite(price) || price < 0)
    errs.push("price must be a non-negative number");
  if (!categoryId) errs.push("categoryId is required");
  if (!Number.isFinite(inStock) || inStock < 0)
    errs.push("inStock must be a non-negative number");

  if (errs.length) return { ok: false, error: errs.join(", ") };

  const merchantId = String(row.merchantId ?? "").trim();

  if (!merchantId) {
    errs.push("merchantId is required");
  }

  if (
    row.weight === undefined ||
    String(row.weight).trim() === "" ||
    !Number.isInteger(weight) ||
    weight < 0
  ) {
    errs.push("weight must be a non-negative integer");
  }

  clean.merchantId = merchantId;

  clean.title = title;
  clean.slug = slug;
  clean.price = Math.round(price); // Keep 2 decimal places
  clean.categoryId = categoryId;
  clean.code = code;
  clean.weight = weight;
  clean.inStock = Math.floor(inStock); // Integer stock quantity

  clean.manufacturer = row.manufacturer
    ? String(row.manufacturer).trim()
    : null;
  clean.description = row.description ? String(row.description).trim() : null;
  clean.mainImage = row.mainImage ? String(row.mainImage).trim() : null;

  return { ok: true, data: clean };
}

async function parseCsvBufferToRows(buffer) {
  const text = buffer.toString("utf-8");
  const records = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records;
}

function computeBatchStatus(successCount, errorCount) {
  if (successCount > 0 && errorCount === 0) return "COMPLETED";
  if (successCount > 0 && errorCount > 0) return "PARTIAL";
  if (successCount === 0 && errorCount > 0) return "FAILED";
  return "PENDING";
}

// Create products + items for valid rows, error items for invalid
async function createBatchWithItems(tx, batchId, validRows, errorRows) {
  const uniqueCategoryIds = [...new Set(validRows.map((r) => r.categoryId))];

  // Fetch categories by both ID and name (case-insensitive)
  const categories = await tx.category.findMany({
    where: {
      OR: [
        { id: { in: uniqueCategoryIds } },
        { name: { in: uniqueCategoryIds } },
      ],
    },
    select: { id: true, name: true },
  });

  // Create a map for both ID and name lookup
  const categoryMap = new Map();
  categories.forEach((cat) => {
    categoryMap.set(cat.id, cat.id); // UUID -> UUID
    categoryMap.set(cat.name.toLowerCase(), cat.id); // name -> UUID
  });

  let success = 0;
  let failed = 0;

  for (const row of validRows) {
    // Try to resolve categoryId (could be UUID or category name)
    const resolvedCategoryId =
      categoryMap.get(row.categoryId) ||
      categoryMap.get(row.categoryId.toLowerCase());

    if (!resolvedCategoryId) {
      await tx.bulk_upload_item.create({
        data: {
          batchId,
          title: row.title,
          slug: row.slug,
          code: row.code,
          weight: row.weight,
          price: row.price,
          manufacturer: row.manufacturer,
          description: row.description,
          mainImage: row.mainImage,
          categoryId: row.categoryId,
          inStock: row.inStock,
          status: "ERROR",
          error: `Category not found: ${row.categoryId}`,
        },
      });
      failed++;
      continue;
    }

    try {
      const product = await tx.product.create({
        data: {
          title: row.title,
          slug: row.slug,
          code: row.code,
          weight: row.weight,
          price: row.price,
          rating: 5,
          description: row.description,
          manufacturer: row.manufacturer,
          mainImage: row.mainImage,
          inStock: row.inStock,
          category: {
            connect: {
              id: resolvedCategoryId,
            },
          },
          merchant: {
            connect: {
              id: row.merchantId,
            },
          },
        },
      });

      await tx.bulk_upload_item.create({
        data: {
          batchId,
          productId: product.id,
          title: row.title,
          slug: row.slug,
          code: row.code,
          weight: row.weight,
          price: row.price,
          manufacturer: row.manufacturer,
          description: row.description,
          mainImage: row.mainImage,
          categoryId: resolvedCategoryId, // Use resolved category ID
          inStock: row.inStock,
          status: "CREATED",
          error: null,
        },
      });
      success++;
    } catch (e) {
      await tx.bulk_upload_item.create({
        data: {
          batchId,
          title: row.title,
          slug: row.slug,
          code: row.code,
          weight: row.weight,
          price: row.price,
          manufacturer: row.manufacturer,
          description: row.description,
          mainImage: row.mainImage,
          categoryId: resolvedCategoryId || row.categoryId,
          inStock: row.inStock,
          status: "ERROR",
          error: e?.message || "Create failed",
        },
      });
      failed++;
    }
  }

  for (const err of errorRows) {
    await tx.bulk_upload_item.create({
      data: {
        batchId,
        title: "",
        slug: "",
        price: 0,
        code: null,
        weight: null,
        manufacturer: null,
        description: null,
        mainImage: null,
        categoryId: "",
        inStock: 0,
        status: "ERROR",
        error: `Row ${err.index}: ${err.error}`,
      },
    });
    failed++;
  }

  return { successCount: success, errorCount: failed };
}

async function getBatchSummary(prisma, batchId) {
  const total = await prisma.bulk_upload_item.count({ where: { batchId } });
  const errors = await prisma.bulk_upload_item.count({
    where: { batchId, status: "ERROR" },
  });
  const created = await prisma.bulk_upload_item.count({
    where: { batchId, status: "CREATED" },
  });
  const updated = await prisma.bulk_upload_item.count({
    where: { batchId, status: "UPDATED" },
  });
  return { total, errors, created, updated };
}

async function canDeleteProductsForBatch(prisma, batchId) {
  const items = await prisma.bulk_upload_item.findMany({
    where: { batchId, productId: { not: null } },
    select: { productId: true },
  });
  const productIds = items.map((i) => i.productId).filter(Boolean);

  if (productIds.length === 0) {
    return { canDelete: true, blockedProductIds: [] };
  }

  const referenced = await prisma.customer_order_product.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true },
  });

  const blocked = new Set(referenced.map((r) => r.productId));
  const blockedList = productIds.filter((id) => blocked.has(id));

  if (blockedList.length > 0) {
    return {
      canDelete: false,
      reason: "Some products are in orders",
      blockedProductIds: blockedList,
    };
  }

  return { canDelete: true, blockedProductIds: [] };
}


async function applyItemUpdates(tx, batchId, updates) {
  const ids = updates.map((u) => u.itemId);

  const items = await tx.bulk_upload_item.findMany({
    where: { id: { in: ids }, batchId },
    select: { id: true, productId: true },
  });

  const byId = new Map(items.map((i) => [i.id, i]));
  const result = [];

  for (const upd of updates) {
    const current = byId.get(upd.itemId);
    if (!current) continue;

    const data = {};

    if (upd.price !== undefined) {
      const price = Number(upd.price);

      if (!Number.isFinite(price) || price < 0) {
        throw new Error("price must be a non-negative number");
      }

      data.price = Math.round(price);
    }

    if (upd.inStock !== undefined) {
      const inStock = Number(upd.inStock);

      if (!Number.isFinite(inStock) || inStock < 0) {
        throw new Error("inStock must be a non-negative number");
      }

      data.inStock = Math.floor(inStock);
    }

    if (upd.code !== undefined) {
      const code = String(upd.code ?? "").trim();

      if (!code) {
        throw new Error("code is required");
      }

      data.code = code;
    }

    if (upd.weight !== undefined) {
      const weight = Number(upd.weight);

      if (
        upd.weight === null ||
        String(upd.weight).trim() === "" ||
        !Number.isFinite(weight) ||
        weight < 0
      ) {
        throw new Error("weight must be a non-negative number");
      }

      data.weight = weight;
    }

    if (current.productId && Object.keys(data).length > 0) {
      await tx.product.update({
        where: { id: current.productId },
        data,
      });
    }

    const updatedItem = await tx.bulk_upload_item.update({
      where: { id: upd.itemId },
      data: {
        ...data,
        status: "UPDATED",
        error: null,
      },
    });

    result.push(updatedItem);
  }

  return result;
}


module.exports = {
  parseCsvBufferToRows,
  validateRow,
  createBatchWithItems,
  computeBatchStatus,
  getBatchSummary,
  canDeleteProductsForBatch,
  applyItemUpdates,
};
