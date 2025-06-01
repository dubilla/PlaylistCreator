This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Testing

This project uses Jest for unit and integration testing.

### Test Coverage and Known Limitations

- **`src/lib/spotify.ts`**: Fully tested. Unit tests cover successful API interactions, error handling, and input validation for functions communicating with the Spotify API.
- **`src/app/api/playlist/route.ts` (OpenAI Playlist Generation)**: **Testing Blocked**. Attempts to test this API route were blocked by a persistent ESM transformation issue with `next-auth`'s dependency `jose`. Jest (via `next/jest` with SWC) could not parse the API route module due to `SyntaxError: Unexpected token 'export'` originating from `node_modules/jose/dist/browser/index.js`. Multiple Jest configurations (`transformIgnorePatterns`, `moduleNameMapper`) and test strategies (including session injection) were attempted without resolving this core environment problem.
- **`src/app/api/spotify-playlist/route.ts` (Spotify Playlist Creation)**: **Testing Blocked**. Similar to the `/api/playlist` route, testing for this API route is also blocked by the same `jose` ESM transformation issue.

Due to these limitations, the primary API routes handling playlist generation and creation in Spotify are not currently covered by automated tests. Resolving the Jest/SWC configuration for `next-auth`'s ESM dependencies is required to enable testing for these components.
