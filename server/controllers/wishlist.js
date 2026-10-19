const prisma = require("../utills/db");
const {
  asyncHandler,
  AppError,
} = require("../utills/errorHandler");

// GET /api/wishlist
// Mengambil seluruh wishlist.
const getAllWishlist = asyncHandler(async (request, response) => {
  const wishlist = await prisma.wishlist.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      product: {
        select: {
          id: true,
          slug: true,
          title: true,
          mainImage: true,
          price: true,
          rating: true,
          inStock: true,
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  return response.status(200).json({
    message: "Wishlist retrieved successfully",
    total: wishlist.length,
    wishlist,
  });
});

// GET /api/wishlist/:userId
// Mengambil wishlist milik satu user.
const getAllWishlistByUserId = asyncHandler(
  async (request, response) => {
    const { userId } = request.params;

    if (!userId || !userId.trim()) {
      throw new AppError("User ID is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const wishlist = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            mainImage: true,
            price: true,
            rating: true,
            inStock: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    return response.status(200).json({
      message: "User wishlist retrieved successfully",
      total: wishlist.length,
      wishlist,
    });
  }
);

// POST /api/wishlist
// Menambahkan product ke wishlist user.
const createWishItem = asyncHandler(async (request, response) => {
  const { userId, productId } = request.body ?? {};

  if (typeof userId !== "string" || !userId.trim()) {
    throw new AppError("User ID is required", 400);
  }

  if (typeof productId !== "string" || !productId.trim()) {
    throw new AppError("Product ID is required", 400);
  }

  const [user, product] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    }),
    prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    }),
  ]);

  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  const existingItem = await prisma.wishlist.findFirst({
    where: {
      userId,
      productId,
    },
  });

  if (existingItem) {
    throw new AppError("Product already exists in wishlist", 409);
  }

  try {
    const wishlist = await prisma.wishlist.create({
      data: {
        userId,
        productId,
      },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            mainImage: true,
            price: true,
            rating: true,
            inStock: true,
          },
        },
      },
    });

    return response.status(201).json({
      message: "Product added to wishlist successfully",
      wishlist,
    });
  } catch (error) {
    // Handle duplicate records if a unique constraint exists.
    if (error?.code === "P2002") {
      throw new AppError("Product already exists in wishlist", 409);
    }

    throw error;
  }
});

// GET /api/wishlist/:userId/:productId
// Memeriksa apakah product ada dalam wishlist user.
const getSingleProductFromWishlist = asyncHandler(
  async (request, response) => {
    const { userId, productId } = request.params;

    if (!userId || !productId) {
      throw new AppError("User ID and Product ID are required", 400);
    }

    const wishlist = await prisma.wishlist.findFirst({
      where: {
        userId,
        productId,
      },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            title: true,
            mainImage: true,
            price: true,
            rating: true,
            inStock: true,
          },
        },
      },
    });

    if (!wishlist) {
      throw new AppError("Product not found in wishlist", 404);
    }

    return response.status(200).json({
      message: "Wishlist item retrieved successfully",
      isWishlisted: true,
      wishlist,
    });
  }
);

// DELETE /api/wishlist/:userId/:productId
// Menghapus product dari wishlist user.
const deleteWishItem = asyncHandler(async (request, response) => {
  const { userId, productId } = request.params;

  if (!userId || !productId) {
    throw new AppError("User ID and Product ID are required", 400);
  }

  const wishlist = await prisma.wishlist.findFirst({
    where: {
      userId,
      productId,
    },
    select: {
      id: true,
    },
  });

  if (!wishlist) {
    throw new AppError("Product not found in wishlist", 404);
  }

  await prisma.wishlist.delete({
    where: {
      id: wishlist.id,
    },
  });

  return response.status(200).json({
    message: "Product removed from wishlist successfully",
    deletedId: wishlist.id,
  });
});

module.exports = {
  getAllWishlistByUserId,
  getAllWishlist,
  createWishItem,
  deleteWishItem,
  getSingleProductFromWishlist,
};