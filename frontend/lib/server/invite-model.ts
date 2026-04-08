import { Schema, model, models, type HydratedDocument, type Model } from "mongoose";

interface InviteProfile {
  firstName: string;
  lastName: string;
}

interface InviteResponses {
  dresscode: Record<string, never>;
  food: {
    selections?: {
      salad?: string[];
      hot?: string[];
      drinks?: string[];
    };
    comment?: string;
  };
  gifts: {
    selections?: string[];
  };
  plan: Record<string, never>;
}

interface InviteProgress {
  dresscode: {
    viewedByMode: {
      male: number;
      female: number;
    };
    completed: boolean;
  };
  plan: {
    opened: boolean;
    downloaded: boolean;
  };
}

interface InviteMeta {
  isSubmitted: boolean;
  editableUntil: Date | null;
  draftUpdatedAt: Date | null;
  submittedAt: Date | null;
}

interface InviteAuthSession {
  tokenHash: string | null;
  expiresAt: Date | null;
}

export interface Invite {
  profileKey: string;
  profile: InviteProfile;
  responses: InviteResponses;
  progress: InviteProgress;
  meta: InviteMeta;
  authSession: InviteAuthSession;
}

const inviteSchema = new Schema<Invite>(
  {
    profileKey: { type: String, required: true, unique: true, index: true },
    profile: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true }
    },
    responses: {
      dresscode: { type: Object, default: {} },
      food: {
        selections: {
          salad: { type: [String], default: undefined },
          hot: { type: [String], default: undefined },
          drinks: { type: [String], default: undefined }
        },
        comment: { type: String, maxlength: 400, default: "" }
      },
      gifts: {
        selections: { type: [String], default: undefined }
      },
      plan: { type: Object, default: {} }
    },
    progress: {
      dresscode: {
        viewedByMode: {
          male: { type: Number, default: 0 },
          female: { type: Number, default: 0 }
        },
        completed: { type: Boolean, default: false }
      },
      plan: {
        opened: { type: Boolean, default: false },
        downloaded: { type: Boolean, default: false }
      }
    },
    meta: {
      isSubmitted: { type: Boolean, default: false },
      editableUntil: { type: Date, default: null },
      draftUpdatedAt: { type: Date, default: null },
      submittedAt: { type: Date, default: null }
    },
    authSession: {
      tokenHash: { type: String, default: null, index: true },
      expiresAt: { type: Date, default: null }
    }
  },
  {
    versionKey: false
  }
);

export type InviteDocument = HydratedDocument<Invite>;

export const InviteModel = (models.Invite as Model<Invite> | undefined) ?? model<Invite>("Invite", inviteSchema);
