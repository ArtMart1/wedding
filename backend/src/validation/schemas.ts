import { z } from "zod";

export const inviteIdParamSchema = z.object({
  inviteId: z.string().trim().regex(/^[a-fA-F0-9]{24}$/)
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80)
});

const optionalMultiSelectSchema = z.array(z.string().trim().min(1)).optional();

const dresscodeProgressSchema = z.object({
  viewedByMode: z.object({
    male: z.number().int().min(0),
    female: z.number().int().min(0)
  }),
  completed: z.boolean()
});

const planProgressSchema = z.object({
  opened: z.boolean(),
  downloaded: z.boolean()
});

const responsesSchema = z.object({
  dresscode: z.object({}).optional().default({}),
  food: z.object({
    selections: z
      .object({
        salad: optionalMultiSelectSchema,
        hot: optionalMultiSelectSchema,
        drinks: optionalMultiSelectSchema
      })
      .optional(),
    comment: z.string().max(400).optional()
  }),
  gifts: z.object({
    selections: optionalMultiSelectSchema
  }),
  plan: z.object({}).optional().default({})
});

const progressSchema = z.object({
  dresscode: dresscodeProgressSchema,
  plan: planProgressSchema
});

export const draftSchema = z.object({
  responses: responsesSchema,
  progress: progressSchema
});

export const submitSchema = draftSchema;
