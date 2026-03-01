export type SectionKey = "dresscode" | "food" | "gifts" | "plan";

export type FoodCategoryKey = "salad" | "appetizer" | "hot" | "drinks";

export interface InviteProfile {
  firstName: string;
  lastName: string;
}

export interface InviteResponses {
  dresscode: {
    acknowledged: boolean;
  };
  food: {
    acknowledged: boolean;
    selections?: Partial<Record<FoodCategoryKey, string[]>>;
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

export interface InviteMeta {
  isSubmitted: boolean;
  editableUntil: string | null;
}

export interface InviteDocument {
  id: string;
  profile: InviteProfile;
  responses: InviteResponses;
  meta: InviteMeta;
}

export interface InvitePayload {
  invite: InviteDocument | null;
  readOnly: boolean;
}
