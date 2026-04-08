export type SectionKey = "dresscode" | "food" | "gifts" | "plan";

export type FoodCategoryKey = "salad" | "hot" | "drinks";
export type DresscodeLookMode = "male" | "female";

export interface InviteProfile {
  firstName: string;
  lastName: string;
}

export interface InviteResponses {
  dresscode: Record<string, never>;
  food: {
    selections?: Partial<Record<FoodCategoryKey, string[]>>;
    comment?: string;
  };
  gifts: {
    selections?: string[];
  };
  plan: Record<string, never>;
}

export interface InviteProgress {
  dresscode: {
    viewedByMode: Record<DresscodeLookMode, number>;
    completed: boolean;
  };
  plan: {
    opened: boolean;
    downloaded: boolean;
  };
}

export interface InviteMeta {
  isSubmitted: boolean;
  editableUntil: string | null;
  draftUpdatedAt: string | null;
  submittedAt: string | null;
}

export interface InviteDocument {
  id: string;
  profile: InviteProfile;
  responses: InviteResponses;
  progress: InviteProgress;
  meta: InviteMeta;
}

export interface InvitePayload {
  invite: InviteDocument | null;
  readOnly: boolean;
}
