export interface Category {
  name: string;
  image: string;
  slug: string;
  desc?: string;
  subCategories?: Category[];
}

export const CATEGORIES: Category[] = [
  { 
    name: "KITCHEN SINKS", 
    image: "/images/products/main-kitchen.png", 
    slug: "kitchen", 
    desc: "Premium Quartz Sinks",
    subCategories: [
      { 
        name: "Quartz Sinks", 
        slug: "quartz-sinks", 
        image: "/images/products/quartz-main.png",
        subCategories: [
          { name: "Quartz Single Bowl", slug: "quartz-single-bowl", image: "/images/products/quartz-single-bowl.jpg" },
          { name: "Quartz Double Bowl", slug: "quartz-double-bowl", image: "/images/products/quartz-main.png" },
          { name: "Quartz Single Bowl With Drainboard", slug: "quartz-single-drainboard", image: "/images/products/quartz-main.png" },
          { name: "Quartz Double Bowl With Drainboard", slug: "quartz-double-drainboard", image: "/images/products/quartz-main.png" },
        ]
      },
      { 
        name: "Handmade Sinks", 
        slug: "handmade-sinks", 
        image: "/images/products/handmade-main.png",
        subCategories: [
          { name: "Handmade Single Bowl", slug: "handmade-single-bowl", image: "/images/products/handmade-main.png" },
          { name: "Handmade Double Bowl", slug: "handmade-double-bowl", image: "/images/products/handmade-main.png" },
          { name: "Handmade Single Bowl With Drainboard", slug: "handmade-single-drainboard", image: "/images/products/handmade-main.png" },
          { name: "Handmade Double Bowl With Drainboard", slug: "handmade-double-drainboard", image: "/images/products/handmade-main.png" },
        ]
      },
      { name: "Smart Sinks", slug: "multi-functional-sinks", image: "/images/products/multifunctional.jpg" },
    ]
  },
  { 
    name: "ARTIFICIAL GRASS & PVC PANNELS GREENLINES", 
    image: "/images/products/ag.webp", 
    slug: "artificial-grass", 
    desc: "Artificial Grass for Modern Living",
    subCategories: [
      { name:"Charcol Panels", slug: "charcol-panels", image: "/images/products/ag.webp" },
      { name: "Soft Panels", slug: "soft-panels", image: "/images/products/ag.webp" },
      { name: "Green Grass", slug: "green-grass", image: "/images/products/ag.webp" },
    ]
  },
  { 
    name: "ALUMINIUM INSULATION FOILS  ", 
    image: "/images/products/aluminium insulation.avif", 
    slug: "aluminium-insulation", 
    desc: "Mitti magic terracotta panels",
    subCategories: [
      { name: "ALUMINIUM BUBBLE INSULATION", slug: "foils", image: "/images/products/aluminium insulation.avif" },
      { name: " ALUMINIUM TANK COVERS", slug: "covers", image: "/images/products/aluminium insulation.avif" },
    ]
  },
  { 
    name: " FRP MANHOLE COVERS", 
    image: "/images/products/mc.png", 
    slug: "manhole-covers", 
    desc: "Durable and aesthetic covers",
    subCategories: [
      { name: "  FRP MANHOLE COVERS", slug: "FRP", image: "/images/products/mc.png" },
      { name: "SS INLAY", slug: "ssinlay", image: "/images/products/mc.png" },
      { name: "FRP INLAY", slug: "frpinlay", image: "/images/products/mc.png" },
    ]
  },
  { name: "TERRACOTA PRODUCTS", image: "/images/products/tp.webp", slug: "terracota-products", desc: "Designer printed & vitrified tiles",
  subCategories: [
    { name: "TERRACOTA CLAY JALI", slug: "jali", image: "/images/products/tp.webp" },
    { name: "TERRACOTA ROOF TILES", slug: "roof-tiles", image: "/images/products/tp.webp" },
     { name: "TERRACOTA CLADING BRICKS", slug: "cladding", image: "/images/products/tp.webp" },
  ]
 },

  { name: "MASON HOUSE", image: "/images/products/mason house.avif", slug: "tile-adhesive-epoxy", desc: "Designer printed & vitrified tiles", 
  subCategories: [
    { name: "TILE ADHESIVE", slug: "tile-adhesive", image: "/images/products/tp.webp" },
    { name: "TILE EPOXY", slug: "tile-epoxy", image: "/images/products/tp.webp" },
    { name: "TILING TOOLS", slug: "tile-tools", image: "/images/products/tp.webp" },
  ]},
  
  { name: "PVD PRODUCTS & SHINEX", image: "/images/products/pvd.webp", slug: "pvd-profiles-sheets", desc: "Designer printed & vitrified tiles", 
    subCategories: [
      { name: "PVD FURNITURE", slug: "pvd-furniture", image: "/images/products/tp.webp" },
      { name: "PVD SHEETS", slug: "pvd-sheets", image: "/images/products/tp.webp" },
      { name: "PVD PROFILES", slug: "pvd-profile", image: "/images/products/tp.webp" },
    ]
  },
  { name: "FLOOR PROTECTION", image: "/images/products/fp.webp", slug: "floor-protection", desc: "Designer printed & vitrified tiles" },
];
