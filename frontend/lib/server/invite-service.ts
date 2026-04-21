import { createHash, randomBytes } from "node:crypto";
import { ZodError } from "zod";
import { connectToDatabase } from "./db";
import { InviteModel, type InviteDocument } from "./invite-model";
import { draftSchema, inviteIdParamSchema, profileSchema, submitSchema } from "./invite-schemas";
import { DRINKS_SELECTION_LIMIT } from "../types";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = 30 * 60 * 1000;
export const SESSION_COOKIE_NAME = "wedding_session";

export class InviteHttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export function isValidationError(error: unknown): error is ZodError {
  return error instanceof ZodError;
}

function normalizeProfileKey(firstName: string, lastName: string) {
  return `${firstName.trim().toLowerCase()}::${lastName.trim().toLowerCase()}`;
}

function isReadOnly(invite: InviteDocument): boolean {
  if (!invite.meta.isSubmitted || !invite.meta.editableUntil) {
    return false;
  }

  return invite.meta.editableUntil.getTime() < Date.now();
}

function uniqueList(values?: string[]) {
  if (!values?.length) {
    return undefined;
  }

  return [...new Set(values)];
}

function singleChoiceList(values?: string[]) {
  if (!values?.length || !values[0]) {
    return undefined;
  }

  return [values[0]];
}

function drinksChoiceList(values?: string[]) {
  if (!values?.length) {
    return undefined;
  }

  return values.filter(Boolean).slice(0, DRINKS_SELECTION_LIMIT);
}

function createDefaultResponses() {
  return {
    dresscode: {},
    food: {
      selections: {},
      comment: ""
    },
    gifts: {
      selections: []
    },
    plan: {}
  };
}

function createDefaultProgress() {
  return {
    dresscode: {
      viewedByMode: {
        male: 0,
        female: 0
      },
      completed: false
    },
    plan: {
      opened: false,
      downloaded: false
    }
  };
}

function normalizeResponses(responses: ReturnType<typeof draftSchema.parse>["responses"]) {
  return {
    dresscode: {},
    food: {
      selections: {
        salad: singleChoiceList(responses.food.selections?.salad),
        hot: singleChoiceList(responses.food.selections?.hot),
        drinks: drinksChoiceList(responses.food.selections?.drinks)
      },
      comment: responses.food.comment ?? ""
    },
    gifts: {
      selections: uniqueList(responses.gifts.selections) ?? []
    },
    plan: {}
  };
}

function normalizeProgress(progress: ReturnType<typeof draftSchema.parse>["progress"]) {
  return {
    dresscode: {
      viewedByMode: {
        male: Math.max(0, progress.dresscode.viewedByMode.male),
        female: Math.max(0, progress.dresscode.viewedByMode.female)
      },
      completed: progress.dresscode.completed
    },
    plan: {
      opened: progress.plan.opened,
      downloaded: progress.plan.downloaded
    }
  };
}

function createSessionToken() {
  return randomBytes(24).toString("base64url");
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildSessionState(token: string) {
  return {
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS)
  };
}

export function getSessionCookieConfig() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/"
  };
}

export function getClearSessionCookieConfig() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/"
  };
}

function toPayload(invite: InviteDocument | null) {
  if (!invite) {
    return {
      invite: null,
      readOnly: false
    };
  }

  const normalizedResponses = {
    dresscode: {},
    food: {
      selections: {
        salad: singleChoiceList(invite.responses.food?.selections?.salad),
        hot: singleChoiceList(invite.responses.food?.selections?.hot),
        drinks: drinksChoiceList(invite.responses.food?.selections?.drinks)
      },
      comment: invite.responses.food?.comment ?? ""
    },
    gifts: {
      selections: uniqueList(invite.responses.gifts?.selections) ?? []
    },
    plan: {}
  };

  const viewedMale = invite.progress?.dresscode?.viewedByMode?.male ?? 0;
  const viewedFemale = invite.progress?.dresscode?.viewedByMode?.female ?? 0;

  return {
    invite: {
      id: invite.id,
      profile: invite.profile,
      responses: normalizedResponses,
      progress: {
        dresscode: {
          viewedByMode: {
            male: viewedMale,
            female: viewedFemale
          },
          completed:
            invite.progress?.dresscode?.completed ?? Math.max(viewedMale, viewedFemale) >= 2
        },
        plan: {
          opened: invite.progress?.plan?.opened ?? false,
          downloaded: invite.progress?.plan?.downloaded ?? false
        }
      },
      meta: {
        isSubmitted: invite.meta.isSubmitted,
        editableUntil: invite.meta.editableUntil,
        draftUpdatedAt: invite.meta.draftUpdatedAt ?? null,
        submittedAt: invite.meta.submittedAt ?? null
      }
    },
    readOnly: isReadOnly(invite)
  };
}

export async function loginInvite(body: unknown) {
  await connectToDatabase();

  const profile = profileSchema.parse(body);
  const profileKey = normalizeProfileKey(profile.firstName, profile.lastName);
  const sessionToken = createSessionToken();

  const existingInvite = await InviteModel.findOne({ profileKey }).exec();

  if (!existingInvite) {
    const created = await InviteModel.create({
      profileKey,
      profile,
      responses: createDefaultResponses(),
      progress: createDefaultProgress(),
      meta: {
        isSubmitted: false,
        editableUntil: null,
        draftUpdatedAt: null,
        submittedAt: null
      },
      authSession: buildSessionState(sessionToken)
    });

    return {
      status: 201,
      payload: toPayload(created),
      sessionToken
    };
  }

  existingInvite.authSession = buildSessionState(sessionToken);

  if (!isReadOnly(existingInvite)) {
    existingInvite.profile = profile;
  }

  await existingInvite.save();

  return {
    status: 200,
    payload: toPayload(existingInvite),
    sessionToken
  };
}

export async function getInviteSession(sessionToken?: string) {
  await connectToDatabase();

  if (!sessionToken) {
    return {
      payload: toPayload(null),
      clearSession: true
    };
  }

  const invite = await InviteModel.findOne({
    "authSession.tokenHash": hashSessionToken(sessionToken)
  }).exec();

  if (!invite || !invite.authSession.expiresAt || invite.authSession.expiresAt.getTime() < Date.now()) {
    if (invite) {
      invite.authSession = {
        tokenHash: null,
        expiresAt: null
      };

      await invite.save();
    }

    return {
      payload: toPayload(null),
      clearSession: true
    };
  }

  invite.authSession = buildSessionState(sessionToken);
  await invite.save();

  return {
    payload: toPayload(invite),
    sessionToken
  };
}

async function resolveInvite(inviteId: string) {
  await connectToDatabase();

  const invite = await InviteModel.findById(inviteId).exec();

  if (!invite) {
    throw new InviteHttpError(404, "Приглашение не найдено");
  }

  if (isReadOnly(invite)) {
    throw new InviteHttpError(403, "Срок редактирования истек");
  }

  return invite;
}

function refreshSession(invite: InviteDocument, sessionToken?: string) {
  if (!sessionToken || invite.authSession.tokenHash !== hashSessionToken(sessionToken)) {
    return null;
  }

  invite.authSession = buildSessionState(sessionToken);
  return sessionToken;
}

export async function saveInviteDraft(params: unknown, body: unknown, sessionToken?: string) {
  const { inviteId } = inviteIdParamSchema.parse(params);
  const { responses, progress } = draftSchema.parse(body);
  const invite = await resolveInvite(inviteId);

  invite.responses = normalizeResponses(responses);
  invite.progress = normalizeProgress(progress);
  const refreshedSessionToken = refreshSession(invite, sessionToken);
  invite.meta = {
    ...invite.meta,
    draftUpdatedAt: new Date()
  };

  await invite.save();

  return {
    payload: toPayload(invite),
    sessionToken: refreshedSessionToken
  };
}

export async function submitInvite(params: unknown, body: unknown, sessionToken?: string) {
  const { inviteId } = inviteIdParamSchema.parse(params);
  const { responses, progress } = submitSchema.parse(body);
  const invite = await resolveInvite(inviteId);

  invite.responses = normalizeResponses(responses);
  invite.progress = normalizeProgress(progress);
  const refreshedSessionToken = refreshSession(invite, sessionToken);
  invite.meta = {
    isSubmitted: true,
    editableUntil: new Date(Date.now() + THIRTY_DAYS_MS),
    draftUpdatedAt: new Date(),
    submittedAt: new Date()
  };

  await invite.save();

  return {
    payload: toPayload(invite),
    sessionToken: refreshedSessionToken
  };
}
