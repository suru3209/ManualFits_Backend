import { Request, Response } from "express";
import Product, { ProductDocument, VariantPair } from "../models/ProductModal";

// Get all products with optional filtering
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const {
      category,
      subcategory,
      brand,
      minPrice,
      maxPrice,
      inStock,
      limit = 20,
      page = 1,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Build filter object
    const filter: any = { isActive: true };

    if (category) filter.category = category;
    if (subcategory)
      filter.subcategory = {
        $in: Array.isArray(subcategory) ? subcategory : [subcategory],
      };
    if (brand) filter.brand = new RegExp(brand as string, "i");
    if (inStock === "true") {
      // This will be handled by aggregation pipeline
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy as string] = sortOrder === "desc" ? -1 : 1;

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Aggregation pipeline for advanced filtering
    let pipeline: any[] = [
      { $match: filter },
      {
        $addFields: {
          totalStock: {
            $sum: {
              $map: {
                input: "$variants",
                as: "variant",
                in: "$$variant.stock",
              },
            },
          },
          minPrice: {
            $min: {
              $map: {
                input: "$variants",
                as: "variant",
                in: "$$variant.price",
              },
            },
          },
          maxPrice: {
            $max: {
              $map: {
                input: "$variants",
                as: "variant",
                in: "$$variant.price",
              },
            },
          },
        },
      },
    ];

    // Add stock filter if needed
    if (inStock === "true") {
      pipeline.push({ $match: { totalStock: { $gt: 0 } } });
    }

    // Add price filters
    if (minPrice || maxPrice) {
      const priceFilter: any = {};
      if (minPrice) priceFilter.$gte = Number(minPrice);
      if (maxPrice) priceFilter.$lte = Number(maxPrice);
      pipeline.push({ $match: { minPrice: priceFilter } });
    }

    // Add sorting and pagination
    pipeline.push({ $sort: sort }, { $skip: skip }, { $limit: Number(limit) });

    const products = await Product.aggregate(pipeline);
    const total = await Product.countDocuments(filter);

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalProducts: total,
        hasNextPage: skip + Number(limit) < total,
        hasPrevPage: Number(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get single product by ID with all variants
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product is not available",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get product by slug
export const getProductBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug, isActive: true });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get variant details by size and color
export const getVariantDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { size, color } = req.query;

    if (!size || !color) {
      return res.status(400).json({
        success: false,
        message: "Size and color parameters are required",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const variant = product.variants.find(
      (v: VariantPair) => v.size === size && v.color === color
    );

    if (!variant) {
      return res.status(404).json({
        success: false,
        message: "Variant not found",
      });
    }

    res.json({
      success: true,
      data: {
        variant,
        availableSizes: product.variants.map((v: VariantPair) => v.size),
        availableColors: product.variants
          .filter((v: VariantPair) => v.size === size)
          .map((v: VariantPair) => v.color),
      },
    });
  } catch (error) {
    console.error("Error fetching variant details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch variant details",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Add new product (Admin only)
export const addProduct = async (req: Request, res: Response) => {
  try {
    const productData = req.body;

    // Validate required fields
    if (
      !productData.title ||
      !productData.description ||
      !productData.category ||
      !productData.brand
    ) {
      return res.status(400).json({
        success: false,
        message: "Title, description, category, and brand are required",
      });
    }

    if (!productData.variants || productData.variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one variant is required",
      });
    }

    // Validate variant pairs
    for (const variant of productData.variants) {
      if (
        !variant.size ||
        !variant.color ||
        !variant.sku ||
        !variant.images ||
        variant.images.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Each variant must have size, color, sku, and at least one image",
        });
      }

      if (variant.price < 0 || variant.originalPrice < 0 || variant.stock < 0) {
        return res.status(400).json({
          success: false,
          message: "Price, originalPrice, and stock must be non-negative",
        });
      }
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error creating product:", error);

    if (error instanceof Error && error.message.includes("duplicate key")) {
      return res.status(400).json({
        success: false,
        message: "Product with this slug or SKU already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update product (Admin only)
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update variant stock (Admin only)
export const updateVariantStock = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { size, colorName, stock } = req.body;

    if (!size || !colorName || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Size, colorName, and stock are required",
      });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Update total stock for the product
    product.totalStock = stock;
    await product.save();

    res.json({
      success: true,
      message: "Total stock updated successfully",
      data: {
        totalStock: product.totalStock,
      },
    });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update stock",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete product (Admin only)
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Search products
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q, limit = 10, page = 1 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find({
      $and: [
        { isActive: true },
        {
          $or: [
            { title: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
            { tags: { $in: [new RegExp(q as string, "i")] } },
            { brand: { $regex: q, $options: "i" } },
          ],
        },
      ],
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments({
      $and: [
        { isActive: true },
        {
          $or: [
            { title: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
            { tags: { $in: [new RegExp(q as string, "i")] } },
            { brand: { $regex: q, $options: "i" } },
          ],
        },
      ],
    });

    res.json({
      success: true,
      data: products,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
        totalProducts: total,
        hasNextPage: skip + Number(limit) < total,
        hasPrevPage: Number(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search products",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
