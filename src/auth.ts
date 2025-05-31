import NextAuth from "next-auth";
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
export const authOptions = {
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
  callbacks: {
    async jwt({ token, account, profile }: { token: JWT; account: Account | null; profile?: Profile }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (profile) {
        token.id = (profile as SpotifyProfile).id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.accessToken = token.accessToken;
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
    async profile(profile: Profile) {
      const spotifyProfile = profile as SpotifyProfile;
      return {
        id: spotifyProfile.id,
        name: spotifyProfile.display_name,
        email: spotifyProfile.email,
        image: spotifyProfile.images?.[0]?.url,
      };
    },
  },
  pages: {
    signIn: "/",
  },
};

// Create a single instance of NextAuth
const handler = NextAuth(authOptions);

// Export the handler for API routes
export { handler as GET, handler as POST };

// Export auth utilities from the same instance
export const { auth, signIn, signOut } = handler; 