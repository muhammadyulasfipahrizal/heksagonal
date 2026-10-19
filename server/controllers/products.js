
const prisma = require("../utills/db");
const {
  asyncHandler,
  AppError,
} = require("../utills/errorHandler");

const PAGE_SIZE = 12;

const ALLOWED_SORTS = {
  defaultSort: undefined,
  titleAsc: { title: "asc" },
  titleDesc: { title: "desc" },
  lowPrice: { price: "asc" },
  highPrice: { price: "desc" },
};

const slugify = (text) =>
  String(text ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Generate a unique slug.
 *
 * excludeId is used when updating an existing product,
 * so the product can retain its own slug.
 */
const generateUniqueProductSlug = async (title, excludeId = null) => {
  const baseSlug = slugify(title);

  if (!baseSlug) {
    throw new AppError(
      "Product title cannot generate a valid slug",
      400
    );
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existingProduct = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!existingProduct || existingProduct.id === excludeId) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

const isValidNumber = (value) =>
  value !== null &&
  value !== undefined &&
  value !== "" &&
  Number.isFinite(Number(value));

const parseOptionalNumber = (value, fieldName, options = {}) => {
  const { min = 0, max = Infinity, integer = false } = options;

  if (value === undefined) return undefined;

  if (!isValidNumber(value)) {
    throw new AppError(`${fieldName} must be a valid number`, 400);
  }

  const number = Number(value);

  if (number < min || number > max) {
    throw new AppError(
      `${fieldName} must be between ${min} and ${max}`,
      400
    );
  }

  if (integer && !Number.isInteger(number)) {
    throw new AppError(`${fieldName} must be an integer`, 400);
  }

  return number;
};

const getQueryString = (value) =>
  typeof value === "string" ? value.trim() : "";

const getNumericQueryFilter = (query, field, operator) => {
  const rawValue = query.get(`filters[${field}][$${operator}]`);

  if (rawValue === null || rawValue.trim() === "") {
    return undefined;
  }

  const value = Number(rawValue);

  return Number.isFinite(value) ? value : undefined;
};

// GET /api/products
const getAllProducts = asyncHandler(async (request, response) => {
  const mode = request.query.mode;

  if (mode === "admin") {
    const products = await prisma.product.findMany({
      include: {
        category: { select: { name: true } },
      },
    });

    return response.status(200).json(products);
  }

  const query = new URLSearchParams(
    request.originalUrl.split("?")[1] || ""
  );

  const rawPage = query.get("page");
  const parsedPage = Number(rawPage || 1);
  const page =
    Number.isInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;

  const where = {};

  // Filter by Category ID.
  const categoryId = query.get("categoryId");

  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Maximum price.
  const maxPrice = getNumericQueryFilter(query, "price", "lte");

  if (maxPrice !== undefined && maxPrice >= 0) {
    where.price = { lte: maxPrice };
  }

  // Minimum rating.
  const minRating = getNumericQueryFilter(query, "rating", "gte");

  if (minRating !== undefined && minRating >= 0 && minRating <= 5) {
    where.rating = { gte: minRating };
  }

  // Stock filter: only apply when a stock filter was explicitly sent.
  const stockOperators = ["equals", "lt", "lte", "gt", "gte"];

  for (const operator of stockOperators) {
    const stockValue = getNumericQueryFilter(
      query,
      "inStock",
      operator
    );

    if (stockValue !== undefined && stockValue >= 0) {
      where.inStock = { [operator]: stockValue };
      break;
    }
  }

  // Sorting: only allow known sort values.
  const sortValue = query.get("sort") || "defaultSort";
  const orderBy = Object.prototype.hasOwnProperty.call(
    ALLOWED_SORTS,
    sortValue
  )
    ? ALLOWED_SORTS[sortValue]
    : undefined;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: {
          select: { name: true },
        },
      },
      ...(orderBy ? { orderBy } : {}),
    }),

    prisma.product.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return response.status(200).json({
    products,
    total,
    page,
    totalPages,
  });
});

// GET /api/products/all (legacy handler, if used by existing routes)
const getAllProductsOld = asyncHandler(async (request, response) => {
  const products = await prisma.product.findMany({
    include: {
      category: {
        select: { name: true },
      },
    },
  });

  return response.status(200).json(products);
});

// POST /api/products
const createProduct = asyncHandler(async (request, response) => {
  const {
    merchantId,
    title,
    mainImage,
    price,
    description,
    manufacturer,
    categoryId,
    inStock,
  } = request.body;

  if (typeof title !== "string" || !title.trim()) {
    throw new AppError("Missing required field: title", 400);
  }

  if (typeof merchantId !== "string" || !merchantId.trim()) {
    throw new AppError("Missing required field: merchantId", 400);
  }

  if (typeof categoryId !== "string" || !categoryId.trim()) {
    throw new AppError("Missing required field: categoryId", 400);
  }

  const parsedPrice = parseOptionalNumber(price, "price", {
    min: 0,
    integer: true,
  });

  if (parsedPrice === undefined) {
    throw new AppError("Missing required field: price", 400);
  }

  const parsedStock = parseOptionalNumber(inStock, "inStock", {
    min: 0,
    integer: true,
  });

  // Validate related records before creating the product.
  const [merchant, category] = await Promise.all([
    prisma.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true },
    }),
    prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    }),
  ]);

  if (!merchant) {
    throw new AppError("Merchant not found", 404);
  }

  if (!category) {
    throw new AppError("Category not found", 404);
  }

  const slug = await generateUniqueProductSlug(title);

  try {
    const product = await prisma.product.create({
      data: {
        merchantId,
        slug,
        title: title.trim(),
        mainImage: mainImage ?? "",
        price: parsedPrice,
        rating: 5,
        description: description ?? "",
        manufacturer: manufacturer ?? "",
        categoryId,
        inStock: parsedStock ?? 1,
      },
    });

    return response.status(201).json(product);
  } catch (error) {
    // Another request may have created the same slug after our lookup.
    if (
      error?.code === "P2002" &&
      String(error?.meta?.target ?? "").includes("slug")
    ) {
      throw new AppError(
        "A product with this slug already exists. Please try again.",
        409
      );
    }

    throw error;
  }
});

// PUT/PATCH /api/products/:id
const updateProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id },
  });

  if (!existingProduct) {
    throw new AppError("Product not found", 404);
  }

  const body = request.body;
  const data = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      throw new AppError("Title cannot be empty", 400);
    }

    data.title = body.title.trim();
  }

  if (body.slug !== undefined) {
    if (typeof body.slug !== "string" || !body.slug.trim()) {
      throw new AppError("Slug cannot be empty", 400);
    }

    data.slug = await generateUniqueProductSlug(body.slug, id);
  }

  if (body.price !== undefined) {
    data.price = parseOptionalNumber(body.price, "price", {
      min: 0,
      integer: true,
    });
  }

  if (body.rating !== undefined) {
    data.rating = parseOptionalNumber(body.rating, "rating", {
      min: 0,
      max: 5,
      integer: true,
    });
  }

  if (body.inStock !== undefined) {
    data.inStock = parseOptionalNumber(body.inStock, "inStock", {
      min: 0,
      integer: true,
    });
  }

  for (const field of [
    "mainImage",
    "description",
    "manufacturer",
  ]) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  if (body.merchantId !== undefined) {
    const merchant = await prisma.merchant.findUnique({
      where: { id: body.merchantId },
      select: { id: true },
    });

    if (!merchant) {
      throw new AppError("Merchant not found", 404);
    }

    data.merchantId = body.merchantId;
  }

  if (body.categoryId !== undefined) {
    const category = await prisma.category.findUnique({
      where: { id: body.categoryId },
      select: { id: true },
    });

    if (!category) {
      throw new AppError("Category not found", 404);
    }

    data.categoryId = body.categoryId;
  }

  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
    });

    return response.status(200).json(updatedProduct);
  } catch (error) {
    if (
      error?.code === "P2002" &&
      String(error?.meta?.target ?? "").includes("slug")
    ) {
      throw new AppError(
        "A product with this slug already exists.",
        409
      );
    }

    throw error;
  }
});

// DELETE /api/products/:id
const deleteProduct = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  const existingProduct = await prisma.product.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingProduct) {
    throw new AppError("Product not found", 404);
  }

  const relatedOrderProductItems =
    await prisma.customer_order_product.findMany({
      where: { productId: id },
      select: { productId: true },
      take: 1,
    });

  if (relatedOrderProductItems.length > 0) {
    throw new AppError(
      "Cannot delete product because it is associated with an order",
      409
    );
  }

  await prisma.product.delete({
    where: { id },
  });

  return response.status(204).send();
});

// GET /api/products/search?query=...
const searchProducts = asyncHandler(async (request, response) => {
  const searchQuery = getQueryString(request.query.query);

  if (!searchQuery) {
    throw new AppError("Query parameter is required", 400);
  }

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { title: { contains: searchQuery } },
        { description: { contains: searchQuery } },
      ],
    },
    include: {
      category: {
        select: { name: true },
      },
    },
  });

  return response.status(200).json(products);
});

// GET /api/products/:id
const getProductById = asyncHandler(async (request, response) => {
  const { id } = request.params;

  if (!id) {
    throw new AppError("Product ID is required", 400);
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return response.status(200).json(product);
});

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  searchProducts,
  getProductById,
};
