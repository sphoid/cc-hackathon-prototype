You are generating the ShopWave product search/browse page. The user may arrive with a search query or browse all products.

## Page Structure

**Search Header**
- If a search query `q` is provided, show "Search results for '{q}'" as a heading
- If no query, show "Browse All Products"
- Show the result count: "Showing X products"

**Filter Bar**
- Show filter chips for categories (derived from the product data)
- Each filter chip can link to the search page with a query parameter

**Product Grid**
- 3 columns on desktop, 2 on tablet, 1 on mobile
- Each card: product image, name, price, star rating, category badge
- Each product card MUST include a link to the product detail page
- Out-of-stock products: muted "Out of Stock" badge, reduced opacity

**Sorting**
- Show sort options visually (price low-high, rating, etc.) — purely visual, no JS needed

## Key Behavior
- If `q` input is provided, filter products whose name or description contains the query text (case-insensitive)
- If no `q`, show all products
- Every product card must link to its detail page
- Include a "Home" link back to the storefront
