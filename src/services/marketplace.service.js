import prisma from "../config/database.js";

const BRAND_KEY_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_BRAND_KEY_LENGTH = 60;

export async function recordBrandClick(brandKey) {
  const key = typeof brandKey === "string" ? brandKey.trim().toLowerCase() : "";
  if (!key || key.length > MAX_BRAND_KEY_LENGTH || !BRAND_KEY_PATTERN.test(key)) {
    throw { statusCode: 400, message: "Invalid brand" };
  }

  await prisma.brandClick.create({ data: { brandKey: key } });
}

/** Click totals per brand: all time and the last 30 days. */
export async function getBrandClickStats() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [allTime, recent] = await Promise.all([
    prisma.brandClick.groupBy({ by: ["brandKey"], _count: { _all: true } }),
    prisma.brandClick.groupBy({
      by: ["brandKey"],
      where: { createdAt: { gte: since } },
      _count: { _all: true },
    }),
  ]);

  const recentByKey = new Map(recent.map((row) => [row.brandKey, row._count._all]));

  return allTime.map((row) => ({
    brandKey: row.brandKey,
    total: row._count._all,
    last30Days: recentByKey.get(row.brandKey) || 0,
  }));
}
