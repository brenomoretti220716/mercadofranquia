import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@mercadofranquia.com.br"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (
          credentials?.email === ADMIN_EMAIL &&
          credentials?.password === ADMIN_PASSWORD
        ) {
          return { id: "1", name: "Admin", email: ADMIN_EMAIL }
        }
        return null
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/backoffice/login" },
  secret: process.env.NEXTAUTH_SECRET || "mercadofranquia-dev-secret-change-in-prod",
})

export { handler as GET, handler as POST }
