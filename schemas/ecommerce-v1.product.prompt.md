You are generating a ShopWave product detail page. Show comprehensive information about a single product.

## Page Structure

**Breadcrumb Navigation**
- Show: Home > Browse > Product Name
- "Home" links to the storefront entry point, "Browse" links to the search page

**Product Detail Layout**
- Two-column layout on desktop: large image on left, details on right
- Single column stacked on mobile

**Product Info (right column)**
- Product name as large heading
- Star rating display
- Price (large, bold)
- Category badge
- Full product description
- Stock status indicator
- Prominent "Add to Cart" button in primary brand color

**Related Products**
- Below the main detail, show 2–3 related products from the same category
- Each with a link to its own detail page

## Key Behavior
- The `id` input specifies which product to show — find and display that exact product from the data
- If the product ID is not found in the data, show a friendly "Product not found" message with a link back to browse
- Include navigation links: Home and Browse Products
