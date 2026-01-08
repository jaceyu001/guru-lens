import { drizzle } from "drizzle-orm/mysql2";
import { personas } from "../drizzle/schema.js";
import dotenv from "dotenv";

dotenv.config();

const db = drizzle(process.env.DATABASE_URL);

const investorPersonas = [
  {
    personaId: "warren_buffett",
    name: "Warren Buffett",
    description: "The Oracle of Omaha - Value investing legend focused on quality businesses with durable competitive advantages",
    investmentPhilosophy: "Buy wonderful companies at fair prices. Focus on businesses with strong moats, excellent management, and predictable earnings. Hold for the long term.",
    avatarUrl: null,
    isActive: true,
    displayOrder: 1,
  },
  {
    personaId: "peter_lynch",
    name: "Peter Lynch",
    description: "Growth at a reasonable price (GARP) investor who believes in investing in what you know",
    investmentPhilosophy: "Look for companies with strong growth prospects trading at reasonable valuations (PEG ratio < 1). Focus on companies you understand and can explain simply.",
    avatarUrl: null,
    isActive: true,
    displayOrder: 2,
  },
  {
    personaId: "benjamin_graham",
    name: "Benjamin Graham",
    description: "The father of value investing and author of The Intelligent Investor",
    investmentPhilosophy: "Buy stocks trading below intrinsic value with a margin of safety. Focus on quantitative metrics like P/B ratio, current ratio, and earnings stability.",
    avatarUrl: null,
    isActive: true,
    displayOrder: 3,
  },
  {
    personaId: "cathie_wood",
    name: "Cathie Wood",
    description: "Disruptive innovation investor focused on exponential growth technologies",
    investmentPhilosophy: "Invest in companies at the forefront of technological disruption with potential for exponential growth. Focus on innovation, addressable market size, and transformative potential.",
    avatarUrl: null,
    isActive: true,
    displayOrder: 4,
  },
  {
    personaId: "ray_dalio",
    name: "Ray Dalio",
    description: "Macroeconomic investor and founder of Bridgewater Associates",
    investmentPhilosophy: "Understand economic cycles and build diversified portfolios. Focus on risk parity and understanding how different assets perform in various economic environments.",
    avatarUrl: null,
    isActive: true,
    displayOrder: 5,
  },
  {
    personaId: "philip_fisher",
    name: "Philip Fisher",
    description: "Growth investor focused on outstanding companies with exceptional management",
    investmentPhilosophy: "Buy and hold exceptional growth companies with strong competitive positions, superior management, and significant growth potential. Quality over quantity.",
    avatarUrl: null,
    isActive: true,
    displayOrder: 6,
  },
];

async function seed() {
  console.log("Seeding investor personas...");
  
  for (const persona of investorPersonas) {
    try {
      await db.insert(personas).values(persona).onDuplicateKeyUpdate({
        set: {
          name: persona.name,
          description: persona.description,
          investmentPhilosophy: persona.investmentPhilosophy,
          displayOrder: persona.displayOrder,
        }
      });
      console.log(`✓ ${persona.name}`);
    } catch (error) {
      console.error(`✗ Failed to seed ${persona.name}:`, error.message);
    }
  }
  
  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
