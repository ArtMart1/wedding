import { NextRequest, NextResponse } from "next/server";
import {
  InviteHttpError,
  SESSION_COOKIE_NAME,
  getSessionCookieConfig,
  isValidationError,
  saveInviteDraft
} from "@/lib/server/invite-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ inviteId: string }> }) {
  try {
    const body = await request.json();
    const params = await context.params;
    const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const result = await saveInviteDraft(params, body, sessionToken);
    const response = NextResponse.json(result.payload);

    if (result.sessionToken) {
      response.cookies.set(SESSION_COOKIE_NAME, result.sessionToken, getSessionCookieConfig());
    }

    return response;
  } catch (error) {
    if (isValidationError(error)) {
      return new NextResponse(error.message, { status: 400 });
    }

    if (error instanceof InviteHttpError) {
      return new NextResponse(error.message, { status: error.status });
    }

    return new NextResponse("Не удалось сохранить черновик", { status: 500 });
  }
}
