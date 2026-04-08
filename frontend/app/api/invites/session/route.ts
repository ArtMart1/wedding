import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  getClearSessionCookieConfig,
  getInviteSession,
  getSessionCookieConfig
} from "@/lib/server/invite-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const result = await getInviteSession(sessionToken);
    const response = NextResponse.json(result.payload);

    if (result.clearSession) {
      response.cookies.set(SESSION_COOKIE_NAME, "", {
        ...getClearSessionCookieConfig(),
        maxAge: 0,
        expires: new Date(0)
      });
      return response;
    }

    if (result.sessionToken) {
      response.cookies.set(SESSION_COOKIE_NAME, result.sessionToken, getSessionCookieConfig());
    }

    return response;
  } catch {
    return new NextResponse("Не удалось восстановить сессию", { status: 500 });
  }
}
