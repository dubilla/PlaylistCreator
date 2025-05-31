import NextAuth, { type AuthOptions } from "next-auth";
import Spotify from "next-auth/providers/spotify";
import type { JWT } from "next-auth/jwt";
import type { Session } from "next-auth";
import type { Account, Profile } from "next-auth";

interface SpotifyProfile extends Profile {
  id: string;
  display_name: string;
  email: string;
  images?: Array<{ url: string }>;
}

// Ensure we have the required environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set");
}

if (!process.env.NEXTAUTH_URL) {
  throw new Error("NEXTAUTH_URL is not set");
}
export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Spotify({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "user-read-email user-read-private playlist-modify-public playlist-modify-private",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, account, profile }: { token: JWT; account: Account | null; profile?: Profile }) {
      console.log("JWT Callback:", {
        hasToken: !!token,
        hasAccount: !!account,
        hasProfile: !!profile,
        tokenKeys: Object.keys(token),
      });

      if (account) {
        token.accessToken = account.access_token;
        console.log("Added access token to JWT");
      }
      if (profile) {
        token.id = (profile as SpotifyProfile).id;
        console.log("Added user ID to JWT");
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      console.log("Session Callback:", {
        hasSession: !!session,
        hasToken: !!token,
        tokenKeys: Object.keys(token),
      });

      session.accessToken = token.accessToken;
      if (session.user) {
        session.user.id = token.id;
      }
      console.log("Session after callback:", {
        hasAccessToken: !!session.accessToken,
        hasUserId: !!session.user?.id,
      });
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  debug: process.env.NODE_ENV === "development",
};

// Create a single instance of NextAuth
const handler = NextAuth(authOptions);

// Export the handler for API routes
export { handler as GET, handler as POST };

// Export auth utilities from the same instance
export const { auth, signIn, signOut } = handler; 