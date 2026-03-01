import { z } from "zod";

export const inviteIdParamSchema = z.object({
  inviteId: z.string().trim().regex(/^[a-fA-F0-9]{24}$/)
});

export const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80)
});

const optionalMultiSelectSchema = z.array(z.string().trim().min(1)).optional();

export const submitSchema = z.object({
  responses: z.object({
    dresscode: z.object({
      acknowledged: z.literal(true)
    }),
    food: z.object({
      acknowledged: z.literal(true),
      selections: z
        .object({
          salad: optionalMultiSelectSchema,
          appetizer: optionalMultiSelectSchema,
          hot: optionalMultiSelectSchema,
          drinks: optionalMultiSelectSchema
        })
        .optional(),
      comment: z.string().max(400).optional()
    }),
    gifts: z.object({
      acknowledged: z.literal(true),
      selections: optionalMultiSelectSchema
    }),
    plan: z.object({
      acknowledged: z.literal(true)
    })
  })
});
