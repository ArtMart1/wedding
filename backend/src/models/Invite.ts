import { Schema, model, type HydratedDocument } from "mongoose";

interface InviteProfile {
  firstName: string;
  lastName: string;
}

interface InviteResponses {
  dresscode: {
    acknowledged: boolean;
  };
  food: {
    acknowledged: boolean;
    selections?: {
      salad?: string[];
      appetizer?: string[];
      hot?: string[];
      drinks?: string[];
    };
    comment?: string;
  };
  gifts: {
    acknowledged: boolean;
    selections?: string[];
  };
  plan: {
    acknowledged: boolean;
  };
}

interface InviteMeta {
  isSubmitted: boolean;
  editableUntil: Date | null;
}

export interface Invite {
  profileKey: string;
  profile: InviteProfile;
  responses: InviteResponses;
  meta: InviteMeta;
}

const inviteSchema = new Schema<Invite>(
  {
    profileKey: { type: String, required: true, unique: true, index: true },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true }
    },
    responses: {
      dresscode: {
        acknowledged: { type: Boolean, default: false }
      },
      food: {
        acknowledged: { type: Boolean, default: false },
        selections: {
          salad: { type: [String], default: undefined },
          appetizer: { type: [String], default: undefined },
          hot: { type: [String], default: undefined },
          drinks: { type: [String], default: undefined }
        },
        comment: { type: String, maxlength: 400, default: "" }
      },
      gifts: {
        acknowledged: { type: Boolean, default: false },
        selections: { type: [String], default: undefined }
      },
      plan: {
        acknowledged: { type: Boolean, default: false }
      }
    },
    meta: {
      isSubmitted: { type: Boolean, default: false },
      editableUntil: { type: Date, default: null }
    }
  },
  {
    versionKey: false
  }
);

export type InviteDocument = HydratedDocument<Invite>;

export const InviteModel = model<Invite>("Invite", inviteSchema);
