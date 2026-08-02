import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const expectedRoutes = [
  "/",
  "/portfolio",
  "/analytics",
  "/demand",
  "/opportunities",
  "/savings",
  "/electrical",
  "/alarms",
  "/alarms/power-quality",
  "/data-health",
  "/reports",
  "/billing",
  "/sustainability",
];

const routeTree = readFileSync("src/routeTree.gen.ts", "utf8");
for (const route of expectedRoutes) {
  assert(routeTree.includes(`'${route}'`) || routeTree.includes(`\"${route}\"`), `Route tree is missing ${route}`);
}

const indexPath = path.join("dist", "index.html");
assert(existsSync(indexPath), "dist/index.html was not generated");
const indexHtml = readFileSync(indexPath, "utf8");
const repository = process.env.GITHUB_REPOSITORY?.split("/")[1];
const expectedBase = process.env.GITHUB_ACTIONS === "true" && repository ? `/${repository}/` : "/";

if (expectedBase !== "/") {
  assert(indexHtml.includes(`${expectedBase}assets/`), `Built assets do not use the GitHub Pages base ${expectedBase}`);
  assert(!/\b(?:src|href)=["']\/assets\//.test(indexHtml), "Found a root-relative /assets URL that would break GitHub Pages");
}

const metaTags = [...indexHtml.matchAll(/<meta\b[^>]*>/gi)].map((match) => match[0]);
const linkTags = [...indexHtml.matchAll(/<link\b[^>]*>/gi)].map((match) => match[0]);

function findMeta(attribute, key) {
  return metaTags.find((tag) => tag.includes(`${attribute}="${key}"`));
}

function requireMeta(attribute, key, expectedContent) {
  const tag = findMeta(attribute, key);
  assert(tag, `Built index is missing ${attribute}=${key}`);
  assert(tag.includes(`content="${expectedContent}"`), `Built index has an unexpected value for ${key}`);
  return tag;
}

const canonicalUrl = "https://masarray.github.io/argrid-energy/";
const expectedOgImageUrl = "https://masarray.github.io/argrid-energy/og/argrid-og-premium-v1-1200x630.png";
const expectedOgAssetPath = path.join("dist", "og", "argrid-og-premium-v1-1200x630.png");

const canonicalTag = linkTags.find((tag) => tag.includes('rel="canonical"'));
assert(canonicalTag, "Built index is missing its canonical link");
assert(canonicalTag.includes(`href="${canonicalUrl}"`), "Canonical URL is incorrect");

requireMeta("property", "og:type", "website");
requireMeta("property", "og:title", "ArGrid — Industrial Energy Management System");
requireMeta("property", "og:url", canonicalUrl);
requireMeta("property", "og:image", expectedOgImageUrl);
requireMeta("property", "og:image:secure_url", expectedOgImageUrl);
requireMeta("property", "og:image:type", "image/png");
requireMeta("property", "og:image:width", "1200");
requireMeta("property", "og:image:height", "630");
requireMeta("name", "twitter:card", "summary_large_image");
requireMeta("name", "twitter:image", expectedOgImageUrl);

assert(findMeta("property", "og:description"), "Built index is missing og:description");
assert(findMeta("property", "og:image:alt"), "Built index is missing og:image:alt");
assert(findMeta("name", "twitter:description"), "Built index is missing twitter:description");
assert(findMeta("name", "twitter:image:alt"), "Built index is missing twitter:image:alt");

assert(existsSync(expectedOgAssetPath), `Built Open Graph image is missing: ${expectedOgAssetPath}`);
const ogImageStats = statSync(expectedOgAssetPath);
assert(ogImageStats.size > 0, "Built Open Graph image is empty");
assert(ogImageStats.size <= 5 * 1024 * 1024, "Built Open Graph image exceeds the 5 MB social-preview safety limit");

const png = readFileSync(expectedOgAssetPath);
assert(
  png.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "Open Graph image is not a valid PNG",
);
assert(png.length >= 24, "Open Graph PNG is too small to contain an IHDR header");
assert(png.readUInt32BE(16) === 1200, "Open Graph PNG width must be 1200 px");
assert(png.readUInt32BE(20) === 630, "Open Graph PNG height must be 630 px");

const assetReferences = [...indexHtml.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((reference) => reference.startsWith(expectedBase) && !reference.endsWith("/"));

for (const reference of assetReferences) {
  const cleanReference = reference.split(/[?#]/, 1)[0];
  const relativePath = expectedBase === "/" ? cleanReference.slice(1) : cleanReference.slice(expectedBase.length);
  assert(existsSync(path.join("dist", relativePath)), `Built asset is referenced but missing: ${reference}`);
}

console.log(
  `Verified ${expectedRoutes.length} routes, ${assetReferences.length} built assets, ` +
    `a 1200x630 PNG social preview, and base ${expectedBase}`,
);
