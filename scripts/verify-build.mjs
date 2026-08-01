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

const canonicalTag = linkTags.find((tag) => tag.includes('rel="canonical"'));
assert(canonicalTag, "Built index is missing its canonical link");
assert(canonicalTag.includes('href="https://masarray.github.io/argrid-energy/"'), "Canonical URL is incorrect");

requireMeta("property", "og:type", "website");
requireMeta("property", "og:title", "ArGrid Energy Management System");
requireMeta("property", "og:url", "https://masarray.github.io/argrid-energy/");
requireMeta("property", "og:image:type", "image/png");
requireMeta("property", "og:image:width", "1280");
requireMeta("property", "og:image:height", "640");
requireMeta("name", "twitter:card", "summary_large_image");
assert(findMeta("property", "og:description"), "Built index is missing og:description");

const ogImageTag = findMeta("property", "og:image");
assert(ogImageTag, "Built index is missing an Open Graph image URL");
const ogImageMatch = ogImageTag.match(/content=["']([^"']+)["']/);
assert(ogImageMatch, "Open Graph image tag has no content value");
assert(ogImageMatch[1].startsWith("https://"), "Open Graph image must use an absolute HTTPS URL");
assert(ogImageMatch[1].includes("opengraph.githubassets.com/"), "Open Graph image is not using the configured public social-preview endpoint");

const secureImageTag = findMeta("property", "og:image:secure_url");
assert(secureImageTag?.includes(`content="${ogImageMatch[1]}"`), "Secure Open Graph image URL must match og:image");

const assetReferences = [...indexHtml.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((reference) => reference.startsWith(expectedBase) && !reference.endsWith("/"));

for (const reference of assetReferences) {
  const cleanReference = reference.split(/[?#]/, 1)[0];
  const relativePath = expectedBase === "/" ? cleanReference.slice(1) : cleanReference.slice(expectedBase.length);
  assert(existsSync(path.join("dist", relativePath)), `Built asset is referenced but missing: ${reference}`);
}

console.log(`Verified ${expectedRoutes.length} routes, ${assetReferences.length} built assets, social preview metadata, and base ${expectedBase}`);
