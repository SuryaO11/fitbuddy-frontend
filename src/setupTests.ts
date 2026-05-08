import '@testing-library/jest-dom'; 

// Add fetch polyfill for Jest environment
if (typeof global.fetch === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  global.fetch = require('node-fetch');
}

// Mock jsPDF to avoid canvas issues in Jest
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    internal: {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297,
      },
    },
    setFillColor: jest.fn(),
    setTextColor: jest.fn(),
    setFontSize: jest.fn(),
    setFont: jest.fn(),
    text: jest.fn(),
    rect: jest.fn(),
    save: jest.fn(),
  }));
});

// Mock html-to-image to avoid canvas issues
jest.mock('html-to-image', () => ({
  toPng: jest.fn().mockResolvedValue('data:image/png;base64,mock'),
}));

if (!window.matchMedia) {
  window.matchMedia = function (query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  };
} 