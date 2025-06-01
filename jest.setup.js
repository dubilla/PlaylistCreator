// jest.setup.js
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Attempt to polyfill fetch APIs if not available globally from JSDOM
if (typeof fetch === 'undefined' || typeof Request === 'undefined') {
  try {
    const { fetch, Headers, Request, Response } = require('undici');
    global.fetch = fetch;
    global.Headers = Headers;
    global.Request = Request;
    global.Response = Response;
    // console.log('Polyfilled fetch, Headers, Request, Response using undici');
  } catch (err) {
    // console.error('Failed to polyfill fetch APIs using undici. Trying whatwg-fetch.', err);
    // Fallback to whatwg-fetch if undici is not available or fails
    require('whatwg-fetch');
    // console.log('Polyfilled fetch APIs using whatwg-fetch as fallback.');
  }
}
global.TextDecoder = TextDecoder;

// Set up required environment variables for next-auth
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000/api/auth'; // Or any valid URL

// You can add other global setups here, like environment variables:
// process.env.SOME_VARIABLE = 'some_value';

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn()
      },
      beforePopState: jest.fn(() => null),
      prefetch: jest.fn(() => null)
    };
  },
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));
