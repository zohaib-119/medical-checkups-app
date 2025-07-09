import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/dbConnect";
// import bcrypt from "bcrypt";
import { SupabaseClient } from "@supabase/supabase-js";

interface DBUser {
  id: string;
  name: string;
  username: string;
  password_hash: string;
  created_at: string;
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      name: string;
    };
  }

  interface User {
    id: string;
    username: string;
    name: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: {
      id: string;
      username: string;
      name: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const { username, password } = credentials as {
          username: string;
          password: string;
        };

        try {
          const client: SupabaseClient = await dbConnect();

          const { data: user, error } = await client
            .from("med_doctors")
            .select("*")
            .eq("username", username)
            .single();

          if (error) {
            console.error("Error fetching user:", error);
            return null;
          }

          if (!user) {
            console.error("User not found");
            return null;
          }

          // const isPasswordValid = await bcrypt.compare(
          //   password,
          //   (user as DBUser).password_hash
          // );

          const isPasswordValid = (user as DBUser).password_hash === password;

          if (!isPasswordValid) {
            console.error("Invalid password");
            return null;
          }

          return {
            id: user.id,
            username: user.username,
            name: user.name
          };
        } catch (error) {
          console.error("Error authorizing user:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.user) {
        session.user = token.user;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
