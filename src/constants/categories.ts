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
    desc: "Premium Sinks",
    subCategories: [
      {
        name: "Quartz Sinks",
        slug: "quartz-sinks",
        image: "/images/products/quartz-main.png",
        subCategories: [
          { name: "Quartz Single Bowl", slug: "quartz-single-bowl", image: "/images/products/QSB.png" },
          { name: "Quartz Double Bowl", slug: "quartz-double-bowl", image: "/images/products/quartz-main.png" },
          { name: "Quartz Single Bowl With Drainboard", slug: "quartz-single-drainboard", image: "/images/products/QSBD.png" },
          { name: "Quartz Double Bowl With Drainboard", slug: "quartz-double-drainboard", image: "/images/products/QDBD.png" },
        ]
      },
      {
        name: "Handmade Sinks",
        slug: "handmade-sinks",
        image: "/images/products/handmade-main.png",
        subCategories: [
          { name: "Handmade Single Bowl", slug: "handmade-single-bowl", image: "/images/products/handmade-main.png" },
          { name: "Handmade Double Bowl", slug: "handmade-double-bowl", image: "/images/products/HDB.png" },
          { name: "Handmade Single Bowl With Drainboard", slug: "handmade-single-drainboard", image: "/images/products/HSBD.png" },
        ]
      },
      {
        name: "Smart Sinks", slug: "multi-functional-sinks", image: "/images/products/multifunctional.jpg",
        subCategories: [
          { name: "Nano Smart Sink", slug: "nano-smart", image: "/images/products/Nano.png" },
          { name: "Piano Smart Sink", slug: "piano-smart", image: "/images/products/Piano.png" },
          { name: "Opera Smart Sink", slug: "opera-smart", image: "/images/products/Opera.png" },
        ]
      },
    ]
  },
  {
    name: "ARTIFICIAL GRASS & PVC PANNELS",
    image: "/images/products/ag.png",
    slug: "artificial-grass",
    desc: "Artificial Grass & Panels for Modern Living",
    subCategories: [
      { name: "Charcol Panels", slug: "charcol-panels", image: "/images/products/ag.webp" },
      { name: "Soffit Panels", slug: "soft-panels", image: "/images/products/sofit.png" },
      { name: "Green Grass", slug: "green-grass", image: "/images/products/green-grass.png" },
    ]
  },
  {
    name: "ALUMINIUM INSULATION FOILS  ",
    image: "/images/products/aluminium-insulation.jpg",
    slug: "aluminium-insulation",
    desc: "Aluminium Insulation Foils & Covers",
    subCategories: [
      { name: "ALUMINIUM BUBBLE INSULATION", slug: "foils", image: "/images/products/ABI.jpg" },
      { name: "ALUMINIUM TANK COVERS", slug: "covers", image: "/images/products/tankcover.png" },
    ]
  },
  {
    name: "FRP MANHOLE COVERS",
    image: "/images/products/mc.png",
    slug: "manhole-covers",
    desc: "FRP Manhole Covers",
    subCategories: [
      { name: "FRP MANHOLE COVERS", slug: "FRP", image: "/images/products/frp.png" },
      { name: "SS RECESSED", slug: "ssinlay", image: "/images/products/ss-inlay.png" },
      { name: "FRP RECESSED", slug: "frpinlay", image: "/images/products/frp-inlay.png" },
      { 
        name: "TRAP DOORS", 
        slug: "trapdoors", 
        image: "/images/products/trap.png",
        subCategories: [
          { name: "Wall Trap Doors", slug: "wall-trapdoor", image: "/images/products/trap.png" },
          { name: "Ceiling Trap Doors", slug: "ceiling-trapdoor", image: "/images/products/trap.png" }
        ]
      },
    ]
  },

  {
    name: "TERRACOTA PRODUCTS", image: "/images/products/Tp.png", slug: "terracota-products", desc: "Terracota products",
    subCategories: [
      { name: "TERRACOTA CLAY JALI", slug: "jali", image: "/images/products/terracotta clay jali.png" },
      {
        name: "ROOF TILES",
        slug: "roof-tiles",
        image: "/images/products/roof-tiles.png",
        subCategories: [
          { name: "CLAY ROOF TILES", slug: "clay-roof-tiles", image: "/images/products/clay-floor.png" },
          { name: "CERAMIC ROOF TILES", slug: "ceramic-roof-tiles", image: "/images/products/ceramic-floor.png" },
        ]
      },
      { name: "TERRACOTA CLADING BRICKS", slug: "cladding-bricks", image: "/images/products/cladding-bricks.png" },
      { name: "DECORATIVE TILES", slug: "decorative-tiles", image: "/images/products/decorative.png" },

      {
        name: " BRICKS", slug: "bricks", image: "/images/products/bricks.png",
        subCategories: [
          { name: "SOLID BRICKS", slug: "solid-bricks", image: "/images/products/solid.png" },
          { name: "HOLLOW BRICKS", slug: "hollow-bricks", image: "/images/products/hollow.png" },
        ]
      },
    ]
  },

  {
    name: "MASON HOUSE", image: "/images/products/mason-house.png", slug: "tile-adhesive-epoxy", desc: "Designer printed & vitrified tiles",
    subCategories: [
      { name: "TILE ADHESIVE", slug: "tile-adhesive", image: "/images/products/tp.webp" },
      { name: "TILE EPOXY", slug: "tile-epoxy", image: "/images/products/Epoxy.png" },
      { name: "TILING TOOLS", slug: "tile-tools", image: "/images/products/TILE LEVELING TOOLS.png" },
    ]
  },

  {
    name: "PVD PRODUCTS & SHINEX", image: "/images/products/pvd.jpg", slug: "pvd-profiles-sheets", desc: "Designer printed & vitrified tiles",
    subCategories: [
      { name: "PVD FURNITURE", slug: "pvd-furniture", image: "/images/products/pvd-furniture.png" },
      { name: "PVD SHEETS", slug: "pvd-sheets", image: "/images/products/pvd-sheets.png" },
      { name: "PVD PROFILES", slug: "pvd-profile", image: "/images/products/pvd-profiles.png" },
    ]
  },
  { name: "FLOOR PROTECTION", image: "/images/products/FP.png", slug: "floor-protection", desc: "Designer printed & vitrified tiles" },
];

