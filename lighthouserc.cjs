module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run preview -- --host 127.0.0.1 --port 4173",
      startServerReadyPattern: "Local:",
      startServerReadyTimeout: 120000,
      numberOfRuns: 1,
      url: [
        "http://127.0.0.1:4173/#/",
        "http://127.0.0.1:4173/#/portfolio",
        "http://127.0.0.1:4173/#/electrical",
        "http://127.0.0.1:4173/#/billing",
      ],
      settings: {
        preset: "desktop",
        chromeFlags: "--headless --no-sandbox --disable-dev-shm-usage",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.72 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.85 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 4200 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { maxNumericValue: 700 }],
        "total-byte-weight": ["error", { maxNumericValue: 2200000 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci/reports",
    },
  },
};
