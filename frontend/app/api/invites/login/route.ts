import { NextResponse } from "next/server";
import { InviteHttpError, getSessionCookieConfig, isValidationError, loginInvite } from "@/lib/server/invite-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await loginInvite(body);
    const response = NextResponse.json(result.payload, { status: result.status });
    response.cookies.set("wedding_session", result.sessionToken, getSessionCookieConfig());
    return response;
  } catch (error) {
    if (isValidationError(error)) {
      return new NextResponse(error.message, { status: 400 });
    }

    if (error instanceof InviteHttpError) {
      return new NextResponse(error.message, { status: error.status });
    }

    return new NextResponse("Не удалось выполнить вход", { status: 500 });
  }
}
