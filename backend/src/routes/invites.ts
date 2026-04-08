import { createHash, randomBytes } from "node:crypto";
import { Router, type Request, type Response } from "express";
import { ZodError } from "zod";
import { InviteModel, type InviteDocument } from "../models/Invite.js";
import { draftSchema, inviteIdParamSchema, profileSchema, submitSchema } from "../validation/schemas.js";

const router = Router();
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = 30 * 60 * 1000;
const SESSION_COOKIE_NAME = "wedding_session";

function normalizeProfileKey(firstName: string, lastName: string): string {
  return `${firstName.trim().toLowerCase()}::${lastName.trim().toLowerCase()}`;
}

function isReadOnly(invite: InviteDocument): boolean {
  if (!invite.meta.isSubmitted || !invite.meta.editableUntil) {
    return false;
  }

  return invite.meta.editableUntil.getTime() < Date.now();
}

function uniqueList(values?: string[]): string[] | undefined {
  if (!values?.length) {
    return undefined;
  }

  return [...new Set(values)];
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
        salad: uniqueList(responses.food.selections?.salad),
        hot: uniqueList(responses.food.selections?.hot),
        drinks: uniqueList(responses.food.selections?.drinks)
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

function createSessionToken(): string {
  return randomBytes(24).toString("base64url");
}

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function buildSessionState(token: string) {
  return {
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS)
  };
}

function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/"
  });
}

function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}

function refreshSessionCookie(req: Request, res: Response, invite: InviteDocument) {
  const sessionToken = getCookieValue(req.headers.cookie, SESSION_COOKIE_NAME);

  if (!sessionToken || invite.authSession.tokenHash !== hashSessionToken(sessionToken)) {
    return;
  }

  invite.authSession = buildSessionState(sessionToken);
  setSessionCookie(res, sessionToken);
}

function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  const targetPrefix = `${name}=`;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(targetPrefix));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(targetPrefix.length));
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
        salad: uniqueList(invite.responses.food?.selections?.salad),
        hot: uniqueList(invite.responses.food?.selections?.hot),
        drinks: uniqueList(invite.responses.food?.selections?.drinks)
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
  const normalizedProgress = {
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
  };

  return {
    invite: {
      id: invite.id,
      profile: invite.profile,
      responses: normalizedResponses,
      progress: normalizedProgress,
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

router.post("/login", async (req, res) => {
  try {
    const profile = profileSchema.parse(req.body);
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

      setSessionCookie(res, sessionToken);

      return res.status(201).json(toPayload(created));
    }

    existingInvite.authSession = buildSessionState(sessionToken);

    if (isReadOnly(existingInvite)) {
      await existingInvite.save();
      setSessionCookie(res, sessionToken);

      return res.json(toPayload(existingInvite));
    }

    existingInvite.profile = profile;
    await existingInvite.save();
    setSessionCookie(res, sessionToken);

    return res.json(toPayload(existingInvite));
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).send(error.message);
    }

    return res.status(500).send("Не удалось выполнить вход");
  }
});

router.get("/session", async (req, res) => {
  try {
    const sessionToken = getCookieValue(req.headers.cookie, SESSION_COOKIE_NAME);

    if (!sessionToken) {
      clearSessionCookie(res);
      return res.json(toPayload(null));
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

      clearSessionCookie(res);
      return res.json(toPayload(null));
    }

    invite.authSession = buildSessionState(sessionToken);
    await invite.save();
    setSessionCookie(res, sessionToken);

    return res.json(toPayload(invite));
  } catch (error) {
    return res.status(500).send("Не удалось восстановить сессию");
  }
});

router.patch("/:inviteId/draft", async (req, res) => {
  try {
    const { inviteId } = inviteIdParamSchema.parse(req.params);
    const { responses, progress } = draftSchema.parse(req.body);

    const invite = await InviteModel.findById(inviteId).exec();

    if (!invite) {
      return res.status(404).send("Приглашение не найдено");
    }

    if (isReadOnly(invite)) {
      return res.status(403).send("Срок редактирования истек");
    }

    invite.responses = normalizeResponses(responses);
    invite.progress = normalizeProgress(progress);
    refreshSessionCookie(req, res, invite);
    invite.meta = {
      ...invite.meta,
      draftUpdatedAt: new Date()
    };

    await invite.save();

    return res.json(toPayload(invite));
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).send(error.message);
    }

    return res.status(500).send("Не удалось сохранить черновик");
  }
});

router.post("/:inviteId/submit", async (req, res) => {
  try {
    const { inviteId } = inviteIdParamSchema.parse(req.params);
    const { responses, progress } = submitSchema.parse(req.body);

    const invite = await InviteModel.findById(inviteId).exec();

    if (!invite) {
      return res.status(404).send("Приглашение не найдено");
    }

    if (isReadOnly(invite)) {
      return res.status(403).send("Срок редактирования истек");
    }

    invite.responses = normalizeResponses(responses);
    invite.progress = normalizeProgress(progress);
    refreshSessionCookie(req, res, invite);

    invite.meta = {
      isSubmitted: true,
      editableUntil: new Date(Date.now() + THIRTY_DAYS_MS),
      draftUpdatedAt: new Date(),
      submittedAt: new Date()
    };

    await invite.save();

    return res.json(toPayload(invite));
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).send(error.message);
    }

    return res.status(500).send("Не удалось отправить анкету");
  }
});

export { router as invitesRouter };
