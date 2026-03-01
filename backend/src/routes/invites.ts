import { Router } from "express";
import { ZodError } from "zod";
import { InviteModel, type InviteDocument } from "../models/Invite.js";
import { inviteIdParamSchema, profileSchema, submitSchema } from "../validation/schemas.js";

const router = Router();
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

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

function toPayload(invite: InviteDocument | null) {
  if (!invite) {
    return {
      invite: null,
      readOnly: false
    };
  }

  return {
    invite: {
      id: invite.id,
      profile: invite.profile,
      responses: invite.responses,
      meta: {
        isSubmitted: invite.meta.isSubmitted,
        editableUntil: invite.meta.editableUntil
      }
    },
    readOnly: isReadOnly(invite)
  };
}

router.post("/login", async (req, res) => {
  try {
    const profile = profileSchema.parse(req.body);
    const profileKey = normalizeProfileKey(profile.firstName, profile.lastName);

    const existingInvite = await InviteModel.findOne({ profileKey }).exec();

    if (!existingInvite) {
      const created = await InviteModel.create({
        profileKey,
        profile,
        responses: {
          dresscode: { acknowledged: false },
          food: { acknowledged: false, selections: {}, comment: "" },
          gifts: { acknowledged: false, selections: [] },
          plan: { acknowledged: false }
        },
        meta: {
          isSubmitted: false,
          editableUntil: null
        }
      });

      return res.status(201).json(toPayload(created));
    }

    if (isReadOnly(existingInvite)) {
      return res.json(toPayload(existingInvite));
    }

    existingInvite.profile = profile;
    await existingInvite.save();

    return res.json(toPayload(existingInvite));
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).send(error.message);
    }

    return res.status(500).send("Не удалось выполнить вход");
  }
});

router.post("/:inviteId/submit", async (req, res) => {
  try {
    const { inviteId } = inviteIdParamSchema.parse(req.params);
    const { responses } = submitSchema.parse(req.body);

    const invite = await InviteModel.findById(inviteId).exec();

    if (!invite) {
      return res.status(404).send("Приглашение не найдено");
    }

    if (isReadOnly(invite)) {
      return res.status(403).send("Срок редактирования истек");
    }

    invite.responses = {
      dresscode: {
        acknowledged: responses.dresscode.acknowledged
      },
      food: {
        acknowledged: responses.food.acknowledged,
        selections: {
          salad: uniqueList(responses.food.selections?.salad),
          appetizer: uniqueList(responses.food.selections?.appetizer),
          hot: uniqueList(responses.food.selections?.hot),
          drinks: uniqueList(responses.food.selections?.drinks)
        },
        comment: responses.food.comment ?? ""
      },
      gifts: {
        acknowledged: responses.gifts.acknowledged,
        selections: uniqueList(responses.gifts.selections)
      },
      plan: {
        acknowledged: responses.plan.acknowledged
      }
    };

    invite.meta = {
      isSubmitted: true,
      editableUntil: new Date(Date.now() + THIRTY_DAYS_MS)
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
