import { Header } from "@/components/layout/header";
import { ProductCard, Product } from "@/components/product/product-card";

// Mock Data
const products: Product[] = [
    {
        id: "1",
        name: "Premium Stainless Steel Kitchen Sink - Single Bowl",
        slug: "stainless-steel-sink-single",
        category: "Kitchen Sinks",
        price: 4999,
        originalPrice: 7999,
        image: "/images/products/kicjen sunk 1.webp",
    },
    {
        id: "2",
        name: "Double Bowl Granite Sink - Matte Black",
        slug: "granite-sink-double-black",
        category: "Kitchen Sinks",
        price: 12499,
        originalPrice: 15999,
        image: "/images/products/k s 2.jpg",
    },
    {
        id: "3",
        name: "Ceramic Farmhouse Sink - White",
        slug: "ceramic-farmhouse-sink",
        category: "Kitchen Sinks",
        price: 8999,
        originalPrice: 10999,
        image: "/images/products/kicjen sunk 1.webp", // Reuse for demo
    },
    {
        id: "4",
        name: "Modern Kitchen Faucet with Pull-Down Sprayer",
        slug: "kitchen-faucet-pull-down",
        category: "Accessories",
        price: 3499,
        originalPrice: 5499,
        image: "/images/products/k s 2.jpg", // Reuse for demo
    },
];

export default function KitchenPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1 bg-background">
                <div className="container py-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Kitchen Collection</h1>
                            <p className="text-muted-foreground mt-1">Premium sinks and accessories for your modern kitchen.</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {/* Placeholders for filters */}
                            <select className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                <option>Sort by: Featured</option>
                                <option>Price: Low to High</option>
                                <option>Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </div>
            </main>
            <footer className="border-t bg-background py-8 mt-auto">
                <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
                    <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                        © 2026 Hindustan Elements. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
