import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";
import type { LifecycleType } from "@/lib/generated/prisma/enums";

type CatalogGenus = {
  scientificName: string;
  commonName: string;
  baseLossRate: number;
  categories: Array<{
    cultivarName: string;
    lifecycleType: LifecycleType;
    minSurvivalZone: number;
    decayModifier: number;
    weeksToHarvest: number;
  }>;
};

const catalog: CatalogGenus[] = [
  {
    scientificName: "Malus domestica",
    commonName: "Pome Fruits",
    baseLossRate: 0.08,
    categories: [
      cultivar("Honeycrisp", "MULTI_YEAR_PERENNIAL", 4, 0.02, 52),
      cultivar("Gala", "MULTI_YEAR_PERENNIAL", 4, 0.0, 50),
      cultivar("Granny Smith", "MULTI_YEAR_PERENNIAL", 5, 0.01, 54),
      cultivar("Liberty", "MULTI_YEAR_PERENNIAL", 4, -0.01, 48),
      cultivar("Enterprise", "MULTI_YEAR_PERENNIAL", 4, -0.01, 48),
    ],
  },
  {
    scientificName: "Pyrus communis",
    commonName: "Pome Fruits",
    baseLossRate: 0.07,
    categories: [
      cultivar("Bartlett", "MULTI_YEAR_PERENNIAL", 5, 0.0, 56),
      cultivar("Bosc", "MULTI_YEAR_PERENNIAL", 5, 0.01, 58),
      cultivar("Anjou", "MULTI_YEAR_PERENNIAL", 5, 0.0, 56),
    ],
  },
  {
    scientificName: "Prunus persica",
    commonName: "Stone Fruits",
    baseLossRate: 0.1,
    categories: [
      cultivar("Redhaven", "MULTI_YEAR_PERENNIAL", 5, 0.02, 60),
      cultivar("Reliance", "MULTI_YEAR_PERENNIAL", 4, 0.0, 58),
      cultivar("Contender", "MULTI_YEAR_PERENNIAL", 4, 0.01, 60),
    ],
  },
  {
    scientificName: "Prunus cerasus",
    commonName: "Stone Fruits",
    baseLossRate: 0.09,
    categories: [
      cultivar("Montmorency", "MULTI_YEAR_PERENNIAL", 4, 0.0, 60),
      cultivar("North Star", "MULTI_YEAR_PERENNIAL", 4, -0.01, 58),
    ],
  },
  {
    scientificName: "Vaccinium corymbosum",
    commonName: "Berry Bushes",
    baseLossRate: 0.06,
    categories: [
      cultivar("Bluecrop", "MULTI_YEAR_PERENNIAL", 4, 0.0, 64),
      cultivar("Duke", "MULTI_YEAR_PERENNIAL", 4, 0.0, 62),
      cultivar("Jersey", "MULTI_YEAR_PERENNIAL", 4, -0.01, 64),
    ],
  },
  {
    scientificName: "Fragaria x ananassa",
    commonName: "Propagation Runners",
    baseLossRate: 0.05,
    categories: [
      cultivar("Albion", "PROPAGATION_RUNNER", 5, 0.0, 16),
      cultivar("Seascape", "PROPAGATION_RUNNER", 5, 0.0, 16),
      cultivar("Jewel", "PROPAGATION_RUNNER", 4, -0.01, 18),
    ],
  },
  {
    scientificName: "Rubus idaeus",
    commonName: "Cane Fruits",
    baseLossRate: 0.08,
    categories: [
      cultivar("Heritage", "MULTI_YEAR_PERENNIAL", 4, 0.0, 56),
      cultivar("Caroline", "MULTI_YEAR_PERENNIAL", 5, 0.01, 56),
    ],
  },
  {
    scientificName: "Solanum lycopersicum",
    commonName: "Greenhouse Plugs",
    baseLossRate: 0.14,
    categories: [
      cultivar("Roma", "RAPID_ANNUAL", 3, 0.0, 10),
      cultivar("Sungold", "RAPID_ANNUAL", 3, 0.01, 10),
      cultivar("Brandywine", "RAPID_ANNUAL", 3, 0.02, 11),
    ],
  },
  {
    scientificName: "Capsicum annuum",
    commonName: "Greenhouse Plugs",
    baseLossRate: 0.12,
    categories: [
      cultivar("California Wonder", "RAPID_ANNUAL", 3, 0.0, 12),
      cultivar("Jalapeno M", "RAPID_ANNUAL", 3, 0.0, 11),
      cultivar("Shishito", "RAPID_ANNUAL", 3, 0.01, 11),
    ],
  },
  {
    scientificName: "Lactuca sativa",
    commonName: "Leafy Greens",
    baseLossRate: 0.1,
    categories: [
      cultivar("Buttercrunch", "RAPID_ANNUAL", 2, 0.0, 5),
      cultivar("Romaine Parris Island", "RAPID_ANNUAL", 2, 0.0, 6),
      cultivar("Red Sails", "RAPID_ANNUAL", 2, 0.0, 5),
    ],
  },
  {
    scientificName: "Ocimum basilicum",
    commonName: "Herbs",
    baseLossRate: 0.11,
    categories: [
      cultivar("Genovese", "RAPID_ANNUAL", 3, 0.0, 7),
      cultivar("Thai Basil", "RAPID_ANNUAL", 3, 0.0, 7),
      cultivar("Purple Petra", "RAPID_ANNUAL", 3, 0.01, 7),
    ],
  },
  {
    scientificName: "Mentha spicata",
    commonName: "Herbs",
    baseLossRate: 0.06,
    categories: [
      cultivar("Spearmint", "PROPAGATION_RUNNER", 4, -0.01, 12),
      cultivar("Kentucky Colonel", "PROPAGATION_RUNNER", 4, 0.0, 12),
    ],
  },
  {
    scientificName: "Rosmarinus officinalis",
    commonName: "Herbs",
    baseLossRate: 0.1,
    categories: [
      cultivar("Arp", "MULTI_YEAR_PERENNIAL", 6, 0.01, 20),
      cultivar("Tuscan Blue", "MULTI_YEAR_PERENNIAL", 7, 0.02, 22),
    ],
  },
  {
    scientificName: "Lavandula x intermedia",
    commonName: "Perennials",
    baseLossRate: 0.09,
    categories: [
      cultivar("Phenomenal", "MULTI_YEAR_PERENNIAL", 5, 0.0, 52),
      cultivar("Grosso", "MULTI_YEAR_PERENNIAL", 5, 0.01, 52),
    ],
  },
  {
    scientificName: "Echinacea purpurea",
    commonName: "Perennials",
    baseLossRate: 0.07,
    categories: [
      cultivar("PowWow Wild Berry", "MULTI_YEAR_PERENNIAL", 3, 0.0, 44),
      cultivar("Magnus", "MULTI_YEAR_PERENNIAL", 3, -0.01, 44),
    ],
  },
  {
    scientificName: "Hosta",
    commonName: "Perennials",
    baseLossRate: 0.06,
    categories: [
      cultivar("Blue Angel", "MULTI_YEAR_PERENNIAL", 3, -0.01, 40),
      cultivar("June", "MULTI_YEAR_PERENNIAL", 3, 0.0, 40),
    ],
  },
  {
    scientificName: "Tagetes erecta",
    commonName: "Annuals",
    baseLossRate: 0.08,
    categories: [
      cultivar("Inca II Orange", "RAPID_ANNUAL", 2, 0.0, 8),
      cultivar("Antigua Yellow", "RAPID_ANNUAL", 2, 0.0, 8),
    ],
  },
  {
    scientificName: "Petunia x hybrida",
    commonName: "Annuals",
    baseLossRate: 0.09,
    categories: [
      cultivar("Supertunia Vista Bubblegum", "RAPID_ANNUAL", 2, 0.01, 9),
      cultivar("Wave Purple", "RAPID_ANNUAL", 2, 0.0, 9),
    ],
  },
  {
    scientificName: "Zinnia elegans",
    commonName: "Annuals",
    baseLossRate: 0.08,
    categories: [
      cultivar("Benary Giant Mix", "RAPID_ANNUAL", 2, 0.0, 7),
      cultivar("Oklahoma Salmon", "RAPID_ANNUAL", 2, 0.0, 7),
    ],
  },
  {
    scientificName: "Salvia farinacea",
    commonName: "Annuals",
    baseLossRate: 0.09,
    categories: [
      cultivar("Victoria Blue", "RAPID_ANNUAL", 3, 0.0, 9),
      cultivar("Fairy Queen", "RAPID_ANNUAL", 3, 0.01, 9),
    ],
  },
];

function cultivar(
  cultivarName: string,
  lifecycleType: LifecycleType,
  minSurvivalZone: number,
  decayModifier: number,
  weeksToHarvest: number,
) {
  return {
    cultivarName,
    lifecycleType,
    minSurvivalZone,
    decayModifier,
    weeksToHarvest,
  };
}

async function main() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to seed the plant catalog.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg(connectionString),
  });

  for (const genus of catalog) {
    const savedGenus = await prisma.plantGenus.upsert({
      where: {
        scientificName: genus.scientificName,
      },
      create: {
        scientificName: genus.scientificName,
        commonName: genus.commonName,
        baseLossRate: genus.baseLossRate,
      },
      update: {
        commonName: genus.commonName,
        baseLossRate: genus.baseLossRate,
      },
    });

    for (const category of genus.categories) {
      await prisma.plantCategory.upsert({
        where: {
          genusId_cultivarName: {
            genusId: savedGenus.id,
            cultivarName: category.cultivarName,
          },
        },
        create: {
          genusId: savedGenus.id,
          ...category,
        },
        update: category,
      });
    }
  }

  const [genusCount, categoryCount] = await Promise.all([
    prisma.plantGenus.count(),
    prisma.plantCategory.count(),
  ]);

  await prisma.$disconnect();
  console.log(`Seeded ${genusCount} genera and ${categoryCount} plant categories.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
