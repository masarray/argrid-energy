import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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

const requiredSocialMarkup = [
  'rel="canonical" href="https://masarray.github.io/argrid-energy/"',
  'property="og:type" content="website"',
  'property="og:title" content="ArGrid Energy Management System"',
  'property="og:description"',
  'property="og:url" content="https://masarray.github.io/argrid-energy/"',
  'property="og:image" content="https://opengraph.githubassets.com/',
  'property="og:image:secure_url" content="https://opengraph.githubassets.com/',
  'property="og:image:type" content="image/png"',
  'property="og:image:width" content="1280"',
  'property="og:image:height" content="640"',
  'name="twitter:card" content="summary_large_image"',
];

for (const markup of requiredSocialMarkup) {
  assert(indexHtml.includes(markup), `Built index is missing required social metadata: ${markup}`);
}

const ogImageMatch = indexHtml.match(/property=["']og:image["'][^>]*content=["']([^"']+)["']/);
assert(ogImageMatch, "Built index is missing an Open Graph image URL");
assert(ogImageMatch[1].startsWith("https://"), "Open Graph image must use an absolute HTTPS URL");

const assetReferences = [...indexHtml.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((reference) => reference.startsWith(expectedBase) && !reference.endsWith("/"));

for (const reference of assetReferences) {
  const cleanReference = reference.split(/[?#]/, 1)[0];
  const relativePath = expectedBase === "/" ? cleanReference.slice(1) : cleanReference.slice(expectedBase.length);
  assert(existsSync(path.join("dist", relativePath)), `Built asset is referenced but missing: ${reference}`);
}

console.log(`Verified ${expectedRoutes.length} routes, ${assetReferences.length} built assets, social preview metadata, and base ${expectedBase}`);
