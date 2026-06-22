import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "am_session";

function tokenAtteso(): string {
  const pwd = process.env.APP_PASSWORD ?? "albero";
  return btoa(`am:${pwd}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function proxy(req: NextRequest) {
  const valido = req.cookies.get(COOKIE)?.value === tokenAtteso();
  if (!valido) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // protegge tutto tranne login, asset statici e favicon
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
