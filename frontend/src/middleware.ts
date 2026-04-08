// middleware.ts
import { jwtDecode } from 'jwt-decode'
import { NextRequest, NextResponse } from 'next/server'
import { Role } from './schemas/users/constants'
import { AUTH_COOKIE_NAME, DecodedToken } from './utils/clientCookie'

enum WhenAuthenticated {
  REDIRECT = 'redirect',
  NEXT = 'next',
}

// Use regex para rotas dinâmicas
const publicRoutes = [
  {
    pattern: /^\/login$/,
    whenAuthenticated: WhenAuthenticated.REDIRECT,
  },
  {
    pattern: /^\/cadastro$/,
    whenAuthenticated: WhenAuthenticated.REDIRECT,
  },
  {
    pattern: /^\/$/,
    whenAuthenticated: WhenAuthenticated.NEXT,
  },
  {
    pattern: /^\/noticias(\/.*)?$/,
    whenAuthenticated: WhenAuthenticated.NEXT,
  },
  {
    pattern: /^\/ranking(\/.*)?$/,
    whenAuthenticated: WhenAuthenticated.NEXT,
  },
  {
    pattern: /^\/modelos-negocio(\/.*)?$/,
    whenAuthenticated: WhenAuthenticated.NEXT,
  },
  {
    pattern: /^\/mercado$/,
    whenAuthenticated: WhenAuthenticated.NEXT,
  },
  {
    pattern: /^\/termos$/,
    whenAuthenticated: WhenAuthenticated.NEXT,
  },
] as const

const privateRoutes = [
  {
    pattern: /^\/admin(\/.*)?$/,
    whenAuthenticated: 'next',
    necessaryRole: Role.ADMIN,
  },
  {
    pattern: /^\/franqueador(\/.*)?$/,
    whenAuthenticated: 'next',
    necessaryRole: Role.FRANCHISOR,
  },
  {
    pattern: /^\/perfil$/,
    whenAuthenticated: 'next',
  },
  {
    pattern: /^\/quiz(\/.*)?$/,
    whenAuthenticated: 'next',
  },
] as const satisfies ReadonlyArray<{
  pattern: RegExp
  whenAuthenticated: 'next'
  necessaryRole?: Role | Role[]
}>

const REDIRECT_WHEN_NOT_AUTHENTICATED = '/login'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const publicRoute = publicRoutes.find((route) => route.pattern.test(pathname))
  const privateRoute = privateRoutes.find((route) =>
    route.pattern.test(pathname),
  )
  const authToken = request.cookies.get(AUTH_COOKIE_NAME)

  // Não autenticado e rota pública
  if (!authToken && publicRoute) {
    return NextResponse.next()
  }

  // Não autenticado e rota privada
  if (!authToken && !publicRoute) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = REDIRECT_WHEN_NOT_AUTHENTICATED
    return NextResponse.redirect(redirectUrl)
  }

  // Autenticado e rota pública que redireciona
  if (
    authToken &&
    publicRoute &&
    publicRoute.whenAuthenticated === WhenAuthenticated.REDIRECT
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/'
    return NextResponse.redirect(redirectUrl)
  }

  // Autenticado e rota privada
  if (authToken && privateRoute) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value as string
    const decodedToken: DecodedToken = jwtDecode(token)

    if (decodedToken.exp && decodedToken.exp < Date.now() / 1000) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = REDIRECT_WHEN_NOT_AUTHENTICATED
      return NextResponse.redirect(redirectUrl)
    }

    if ('necessaryRole' in privateRoute && privateRoute.necessaryRole) {
      const userRole = decodedToken.role as Role | undefined
      const necessaryRoles = (
        Array.isArray(privateRoute.necessaryRole)
          ? privateRoute.necessaryRole
          : [privateRoute.necessaryRole]
      ) as ReadonlyArray<Role>

      if (!userRole || !necessaryRoles.includes(userRole)) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/'
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|assets|favicon.ico).*)'],
}
