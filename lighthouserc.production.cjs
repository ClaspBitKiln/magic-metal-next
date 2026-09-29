module.exports = {
  ci: {
    collect: {
      url: ['https://magicmet.ru/'],
      numberOfRuns: 2,
      settings: {
        chromeFlags: '--headless --no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.65 }],
        'categories:accessibility': ['error', { minScore: 0.85 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.85 }],
        'font-display': 'off',
      },
    },
    upload: { target: 'filesystem', outputDir: './lhci-report' },
  },
}
