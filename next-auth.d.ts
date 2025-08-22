import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "AGENT" | "CUSTOMER";
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: "ADMIN" | "AGENT" | "CUSTOMER";
  }
}
