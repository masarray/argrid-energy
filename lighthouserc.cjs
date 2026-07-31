module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      numberOfRuns: 2,
      url: [
        "http://localhost/#/",
        "http://localhost/#/portfolio",
        "http://localhost/#/electrical",
        "http://localhost/#/billing",
        "http://localhost/#/alarms/power-quality",
      ],
      settings: {
        preset: "desktop",
        throttlingMethod: "simulate",
        onlyCategories: ["performance", "accessibility", "best-practices"],
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.65, aggregationMethod: "median" }],
        "categories:accessibility": ["error", { minScore: 0.95, aggregationMethod: "pessimistic" }],
        "categories:best-practices": ["error", { minScore: 0.9, aggregationMethod: "pessimistic" }],
        "first-contentful-paint": ["error", { maxNumericValue: 3000, aggregationMethod: "median" }],
        "largest-contentful-paint": ["error", { maxNumericValue: 5000, aggregationMethod: "median" }],
        "total-blocking-time": ["error", { maxNumericValue: 800, aggregationMethod: "median" }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1, aggregationMethod: "pessimistic" }],
        "speed-index": ["warn", { maxNumericValue: 5000, aggregationMethod: "median" }],
        "dom-size": ["error", { maxNumericValue: 4000, aggregationMethod: "pessimistic" }],
        "resource-summary:script:size": ["error", { maxNumericValue: 2000000 }],
        "resource-summary:stylesheet:size": ["error", { maxNumericValue: 300000 }],
        "resource-summary:total:size": ["error", { maxNumericValue: 4000000 }],
        "color-contrast": "error",
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./lighthouse-report",
    },
  },
};
