/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvier from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvier({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: { params: { access_type: "offline", prompt: "consent" } },
    }),
    {
      id: "email",
      type: "email",
      from: "tstacktodoapp@gmail.com",
      server: {},
      maxAge: 24 * 60 * 60,
      name: "Email",
      options: {},
      sendVerificationRequest: async params => {
        const { identifier, url } = params;
        const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
          body: JSON.stringify({
            personalizations: [
              {
                to: [
                  {
                    email: identifier,
                  },
                ],
                subject: "T3Stack-TodoApp認証メール",
              },
            ],
            from: { email: "tstacktodoapp@gmail.com" },
            content: [
              {
                type: "text/plain",
                value: `Please click here to authenticate - ${url}`,
              },
            ],
          }),
          headers: {
            Authorization: `Bearer ${process.env.SENDGRID_API}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        });
        if (!response.ok) {
          const { errors } = await response.json();
          throw new Error(JSON.stringify(errors));
        }
      },
    },
  ],
  callbacks: {},
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
