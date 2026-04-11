"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  AUTH_LOGO_MOBILE_URL,
  AUTH_LOGO_URL,
  ENTRY_SPLASH_URL,
  getSectionImage,
  HERO_LOGO_MOBILE_URL,
  HERO_LOGO_URL
} from "@/config/scene-assets";
import { CrossIcon } from "@/components/icons/cross-icon";
import { DetailBackIcon } from "@/components/icons/detail-back-icon";
import { DresscodeFemaleIcon, DresscodeMaleIcon } from "@/components/icons/dresscode-look-icons";
import { FoodCommentIcon } from "@/components/icons/food-comment-icon";
import { FOOD_OPTIONS, GIFT_OPTIONS } from "@/config/options";
import {
  DresscodeSection,
  isDresscodeModeComplete,
  isDresscodeProgressComplete,
  type DresscodeLookMode
} from "@/components/sections/dresscode";
import { FoodSection } from "@/components/sections/food";
import { GiftsSection } from "@/components/sections/gifts";
import { PlanSection } from "@/components/sections/plan";
import { getInviteSession, loginInvite, saveInviteDraft, submitInvite } from "@/lib/api";
import type {
  FoodCategoryKey,
  InvitePayload,
  InviteProfile,
  InviteProgress,
  InviteResponses,
  SectionKey
} from "@/lib/types";

const SECTION_ORDER: SectionKey[] = ["dresscode", "food", "gifts", "plan"];

const SECTION_LABELS: Record<SectionKey, string> = {
  dresscode: "Дресс-код",
  food: "Еда",
  gifts: "Подарки",
  plan: "План дня"
};

const SECTION_TAB_LABELS: Record<SectionKey, string> = {
  dresscode: "dresscode",
  food: "food",
  gifts: "gifts",
  plan: "plan"
};

const EVENT_DETAILS = {
  title: "Приглашение на свадьбу",
  date: "15 августа 2026",
  time: "16:00",
  place: "Загородный клуб «Берег»"
};

const authSchema = z.object({
  firstName: z.string().trim().min(1, "Введите имя").max(80, "Максимум 80 символов"),
  lastName: z.string().trim().min(1, "Введите фамилию").max(80, "Максимум 80 символов")
});

type AuthFormValues = z.infer<typeof authSchema>;
type CarouselDirection = -1 | 1;
type StageSlot = "far-left" | "left" | "center" | "right" | "far-right";

const DRAG_ACTIVATION_PX = 12;
const DRAG_COMMIT_RATIO = 0.34;
const WHEEL_BURST_GAP_MS = 96;
const WHEEL_SETTLE_DELTA = 8;
const WHEEL_TRIGGER_DELTA = 18;
const MAX_DRAG_STEPS = SECTION_ORDER.length * 3;
const STAGE_RENDER_RADIUS = 3;
const FOOD_CATEGORY_ORDER: FoodCategoryKey[] = ["salad", "hot", "drinks"];
const FOOD_AUTO_ADVANCE_DELAY_MS = 700;
const FOOD_CATEGORY_SWITCH_FADE_MS = 220;
const MOBILE_STAGE_BREAKPOINT_PX = 680;
const ENTRY_SPLASH_HOLD_MS = 1000;
const ENTRY_SPLASH_FADE_MS = 420;
const INITIAL_RESTORE_SPLASH_MIN_MS = 3000;
const INITIAL_RESTORE_SPLASH_SESSION_KEY = "wedding-initial-restore-splash-seen";

function createDefaultResponses(): InviteResponses {
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

function createDefaultProgress(): InviteProgress {
  return {
    dresscode: {
      viewedByMode: createDresscodeIndexMap(),
      completed: false
    },
    plan: {
      opened: false,
      downloaded: false
    }
  };
}

function normalizeFoodSelections(
  selections?: Partial<Record<FoodCategoryKey, string[]>>
): Partial<Record<FoodCategoryKey, string[]>> {
  if (!selections) {
    return {};
  }

  return {
    salad: selections.salad?.[0] ? [selections.salad[0]] : [],
    hot: selections.hot?.[0] ? [selections.hot[0]] : [],
    drinks: selections.drinks?.[0] ? [selections.drinks[0]] : []
  };
}

function normalizeGiftSelections(selections?: string[]): string[] {
  return selections?.[0] ? [selections[0]] : [];
}

function normalizeInviteResponses(responses: InviteResponses): InviteResponses {
  return {
    dresscode: {},
    food: {
      selections: normalizeFoodSelections(responses.food?.selections),
      comment: responses.food?.comment ?? ""
    },
    gifts: {
      selections: normalizeGiftSelections(responses.gifts?.selections)
    },
    plan: {}
  };
}

function normalizeInviteProgress(progress?: InviteProgress): InviteProgress {
  const defaults = createDefaultProgress();
  const viewedByMode = {
    male: progress?.dresscode?.viewedByMode?.male ?? defaults.dresscode.viewedByMode.male,
    female: progress?.dresscode?.viewedByMode?.female ?? defaults.dresscode.viewedByMode.female
  };

  return {
    dresscode: {
      viewedByMode,
      completed: Boolean(progress?.dresscode?.completed) || isDresscodeProgressComplete(viewedByMode)
    },
    plan: {
      opened: progress?.plan?.opened ?? defaults.plan.opened,
      downloaded: progress?.plan?.downloaded ?? defaults.plan.downloaded
    }
  };
}

function isFoodSelectionComplete(responses: InviteResponses): boolean {
  return FOOD_CATEGORY_ORDER.every((category) => Boolean(responses.food.selections?.[category]?.[0]));
}

function isGiftSelectionComplete(responses: InviteResponses): boolean {
  return Boolean(responses.gifts.selections?.[0]);
}

function isSectionComplete(section: SectionKey, responses: InviteResponses, progress: InviteProgress): boolean {
  switch (section) {
    case "dresscode":
      return progress.dresscode.completed;
    case "food":
      return isFoodSelectionComplete(responses);
    case "gifts":
      return isGiftSelectionComplete(responses);
    case "plan":
      return progress.plan.opened;
  }
}

function isAllSectionsComplete(responses: InviteResponses, progress: InviteProgress): boolean {
  return SECTION_ORDER.every((section) => isSectionComplete(section, responses, progress));
}

function getInitialScreen(_responses: InviteResponses): "sections" {
  return "sections";
}

function getInitialSection(responses: InviteResponses, progress: InviteProgress): SectionKey {
  return SECTION_ORDER.find((section) => !isSectionComplete(section, responses, progress)) ?? "dresscode";
}

function normalizeTrackIndex(index: number): number {
  return ((index % SECTION_ORDER.length) + SECTION_ORDER.length) % SECTION_ORDER.length;
}

function getSectionIndex(section: SectionKey): number {
  return SECTION_ORDER.indexOf(section);
}

function getSectionByTrackIndex(trackIndex: number): SectionKey {
  return SECTION_ORDER[normalizeTrackIndex(trackIndex)];
}

function getForwardDistance(from: SectionKey, to: SectionKey): number {
  const fromIndex = SECTION_ORDER.indexOf(from);
  const toIndex = SECTION_ORDER.indexOf(to);

  return (toIndex - fromIndex + SECTION_ORDER.length) % SECTION_ORDER.length;
}

function getStageSlot(distance: number): StageSlot {
  if (distance <= -1.5) {
    return "far-left";
  }

  if (distance < -0.5) {
    return "left";
  }

  if (distance < 0.5) {
    return "center";
  }

  if (distance < 1.5) {
    return "right";
  }

  return "far-right";
}

function getShortestTrackDistance(
  fromTrackIndex: number,
  toSection: SectionKey,
  preferredDirection: CarouselDirection
): number {
  const fromSection = getSectionByTrackIndex(fromTrackIndex);
  const forwardDistance = getForwardDistance(fromSection, toSection);

  if (forwardDistance === 0) {
    return 0;
  }

  const backwardDistance = forwardDistance - SECTION_ORDER.length;

  if (Math.abs(forwardDistance) < Math.abs(backwardDistance)) {
    return forwardDistance;
  }

  if (Math.abs(backwardDistance) < Math.abs(forwardDistance)) {
    return backwardDistance;
  }

  return preferredDirection > 0 ? forwardDistance : backwardDistance;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function mod(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function createDresscodeIndexMap(): Record<DresscodeLookMode, number> {
  return {
    male: 0,
    female: 0
  };
}

function createFoodIndexMap(): Record<FoodCategoryKey, number> {
  return {
    salad: 0,
    hot: 0,
    drinks: 0
  };
}

function createGiftActiveIndex(): number {
  return 0;
}

function isFoodCategoryKey(value: unknown): value is FoodCategoryKey {
  return value === "salad" || value === "hot" || value === "drinks";
}

function isFoodIndexMap(value: unknown): value is Record<FoodCategoryKey, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<Record<FoodCategoryKey, unknown>>;

  return (
    typeof candidate.salad === "number" &&
    typeof candidate.hot === "number" &&
    typeof candidate.drinks === "number"
  );
}

export function InviteFlow() {
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [authRequired, setAuthRequired] = useState(true);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [profile, setProfile] = useState<InviteProfile | null>(null);
  const [responses, setResponses] = useState<InviteResponses>(createDefaultResponses);
  const [progress, setProgress] = useState<InviteProgress>(createDefaultProgress);
  const [screen, setScreen] = useState<"sections" | "final">("sections");
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [needsAttention, setNeedsAttention] = useState<Record<SectionKey, boolean>>({
    dresscode: false,
    food: false,
    gifts: false,
    plan: false
  });
  const [readOnly, setReadOnly] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [editableUntil, setEditableUntil] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasPendingDraftChanges, setHasPendingDraftChanges] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dresscodeLookMode, setDresscodeLookMode] = useState<DresscodeLookMode>("male");
  const [dresscodeActiveIndexByMode, setDresscodeActiveIndexByMode] = useState<Record<DresscodeLookMode, number>>(createDresscodeIndexMap);
  const [dresscodeMaxViewedIndexByMode, setDresscodeMaxViewedIndexByMode] =
    useState<Record<DresscodeLookMode, number>>(createDresscodeIndexMap);
  const [foodActiveCategory, setFoodActiveCategory] = useState<FoodCategoryKey>("salad");
  const [foodActiveIndexByCategory, setFoodActiveIndexByCategory] = useState<Record<FoodCategoryKey, number>>(createFoodIndexMap);
  const [foodDetailOpenKey, setFoodDetailOpenKey] = useState(0);
  const [isFoodCategorySwitching, setIsFoodCategorySwitching] = useState(false);
  const [isFoodCommentDialogOpen, setIsFoodCommentDialogOpen] = useState(false);
  const [foodCommentDraft, setFoodCommentDraft] = useState("");
  const [giftActiveIndex, setGiftActiveIndex] = useState(createGiftActiveIndex);
  const [giftDetailOpenKey, setGiftDetailOpenKey] = useState(0);
  const [detailSection, setDetailSection] = useState<SectionKey | null>(null);
  const [showFoodCommentHint, setShowFoodCommentHint] = useState(false);
  const [showFoodTopHint, setShowFoodTopHint] = useState(false);
  const [isCompactMobile, setIsCompactMobile] = useState(false);
  const [mobileStageProgress, setMobileStageProgress] = useState(0);
  const [showEntrySplash, setShowEntrySplash] = useState(false);
  const [isEntrySplashExiting, setIsEntrySplashExiting] = useState(false);
  const autoSubmitRef = useRef(false);
  const responsesRef = useRef<InviteResponses>(responses);
  const progressRef = useRef<InviteProgress>(progress);
  const inviteIdRef = useRef<string | null>(inviteId);
  const readOnlyRef = useRef(readOnly);
  const hasPendingDraftChangesRef = useRef(hasPendingDraftChanges);
  const draftRevisionRef = useRef(0);
  const lastDraftSavedRevisionRef = useRef(0);
  const draftSaveTimeoutRef = useRef<number | null>(null);
  const entrySplashExitTimeoutRef = useRef<number | null>(null);
  const entrySplashCleanupTimeoutRef = useRef<number | null>(null);
  const foodCommentHintTimeoutRef = useRef<number | null>(null);
  const hasShownFoodTopHintRef = useRef(false);
  const hasShownFoodCommentHintRef = useRef(false);
  const hasPlayedEntrySplashRef = useRef(false);
  const skipNextEntrySplashRef = useRef(false);
  const foodAutoAdvanceTimeoutRef = useRef<number | null>(null);
  const foodCategorySwitchTimeoutRef = useRef<number | null>(null);
  const heroStageRef = useRef<HTMLElement | null>(null);
  const mobileStageRef = useRef<HTMLDivElement | null>(null);
  const mobileStageSyncTimeoutRef = useRef<number | null>(null);
  const mobileStageIsSyncingRef = useRef(false);
  const dragStartTrackIndexRef = useRef(0);
  const dragSessionRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    dragging: false
  });
  const dragOffsetRef = useRef(0);
  const suppressStageClickRef = useRef(false);
  const suppressResetTimeoutRef = useRef<number | null>(null);
  const lastIntentDirectionRef = useRef<CarouselDirection>(1);
  const wheelGestureSettledRef = useRef(true);
  const lastWheelEventTimeRef = useRef(0);
  const wheelGestureDirectionRef = useRef<CarouselDirection | 0>(0);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDraggingStage, setIsDraggingStage] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isAuthSubmitting }
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema)
  });

  const activeSection = getSectionByTrackIndex(activeTrackIndex);
  const isDresscodeDetail = detailSection === "dresscode";
  const isFoodDetail = detailSection === "food";
  const isGiftDetail = detailSection === "gifts";
  const isPlanDetail = detailSection === "plan";
  const isDresscodeReviewComplete =
    progress.dresscode.completed || isDresscodeModeComplete(dresscodeLookMode, dresscodeMaxViewedIndexByMode[dresscodeLookMode]);
  const isFoodSelectionCompleteValue = isFoodSelectionComplete(responses);
  const isGiftSelectionCompleteValue = isGiftSelectionComplete(responses);
  const isAllSectionsCompleteValue = isAllSectionsComplete(responses, progress);
  const isDetailNextDisabled =
    readOnly ||
    (isDresscodeDetail && !isDresscodeReviewComplete) ||
    (isFoodDetail && !isFoodSelectionCompleteValue) ||
    (isGiftDetail && !isGiftSelectionCompleteValue);
  const dragTravelPx = heroStageRef.current
    ? clamp(heroStageRef.current.clientWidth * 0.16, 140, 240)
    : 180;
  const maxDragOffsetPx = dragTravelPx * MAX_DRAG_STEPS;
  const visualTrackPosition = isDraggingStage ? dragStartTrackIndexRef.current - dragOffsetPx / dragTravelPx : activeTrackIndex;
  const renderCenterTrackIndex = Math.round(visualTrackPosition);
  const stageItems = useMemo(
    () => {
      const items: Array<{
        absoluteIndex: number;
        relativeStep: number;
        section: SectionKey;
        slot: StageSlot;
        src: string;
      }> = [];

      for (
        let absoluteIndex = renderCenterTrackIndex - STAGE_RENDER_RADIUS;
        absoluteIndex <= renderCenterTrackIndex + STAGE_RENDER_RADIUS;
        absoluteIndex += 1
      ) {
        const section = getSectionByTrackIndex(absoluteIndex);
        const relativeStep = absoluteIndex - visualTrackPosition;

        items.push({
          absoluteIndex,
          relativeStep,
          section,
          slot: getStageSlot(relativeStep),
          src: getSectionImage(section)
        });
      }

      return items;
    },
    [renderCenterTrackIndex, visualTrackPosition]
  );
  const mobileStageItems = useMemo(
    () =>
      SECTION_ORDER.map((section, index) => ({
        loopIndex: index,
        sectionIndex: index,
        section,
        src: getSectionImage(section)
      })),
    []
  );

  useEffect(() => {
    dragOffsetRef.current = dragOffsetPx;
  }, [dragOffsetPx]);

  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    inviteIdRef.current = inviteId;
  }, [inviteId]);

  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);

  useEffect(() => {
    hasPendingDraftChangesRef.current = hasPendingDraftChanges;
  }, [hasPendingDraftChanges]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_STAGE_BREAKPOINT_PX}px)`);

    const updateMobileMode = () => {
      setIsCompactMobile(mediaQuery.matches);
    };

    updateMobileMode();

    mediaQuery.addEventListener("change", updateMobileMode);

    return () => {
      mediaQuery.removeEventListener("change", updateMobileMode);
    };
  }, []);

  useEffect(() => {
    if (!isFoodCategoryKey(foodActiveCategory)) {
      setFoodActiveCategory("salad");
    }
  }, [foodActiveCategory]);

  useEffect(() => {
    if (!isFoodIndexMap(foodActiveIndexByCategory)) {
      setFoodActiveIndexByCategory(createFoodIndexMap());
    }
  }, [foodActiveIndexByCategory]);

  useEffect(() => {
    if (detailSection === "food") {
      return;
    }

    if (foodAutoAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(foodAutoAdvanceTimeoutRef.current);
      foodAutoAdvanceTimeoutRef.current = null;
    }

    if (foodCategorySwitchTimeoutRef.current !== null) {
      window.clearTimeout(foodCategorySwitchTimeoutRef.current);
      foodCategorySwitchTimeoutRef.current = null;
    }

    setIsFoodCategorySwitching(false);
    setShowFoodCommentHint(false);
  }, [detailSection]);

  useEffect(() => {
    return () => {
      if (entrySplashExitTimeoutRef.current !== null) {
        window.clearTimeout(entrySplashExitTimeoutRef.current);
      }
      if (entrySplashCleanupTimeoutRef.current !== null) {
        window.clearTimeout(entrySplashCleanupTimeoutRef.current);
      }
      if (mobileStageSyncTimeoutRef.current !== null) {
        window.clearTimeout(mobileStageSyncTimeoutRef.current);
      }
      if (foodAutoAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(foodAutoAdvanceTimeoutRef.current);
      }
      if (foodCategorySwitchTimeoutRef.current !== null) {
        window.clearTimeout(foodCategorySwitchTimeoutRef.current);
      }
      if (foodCommentHintTimeoutRef.current !== null) {
        window.clearTimeout(foodCommentHintTimeoutRef.current);
      }
      if (draftSaveTimeoutRef.current !== null) {
        window.clearTimeout(draftSaveTimeoutRef.current);
      }
      if (suppressResetTimeoutRef.current !== null) {
        window.clearTimeout(suppressResetTimeoutRef.current);
      }
    };
  }, []);

  const hydrateInviteSession = useCallback((payload: InvitePayload): boolean => {
    if (!payload.invite) {
      return false;
    }

    const initialResponses = normalizeInviteResponses(payload.invite.responses ?? createDefaultResponses());
    const initialProgress = normalizeInviteProgress(payload.invite.progress);

    setInviteId(payload.invite.id);
    setProfile(payload.invite.profile);
    setResponses(initialResponses);
    setProgress(initialProgress);
    setScreen(getInitialScreen(initialResponses));
    {
      const initialSection = getInitialSection(initialResponses, initialProgress);
      const initialTrackIndex = getSectionIndex(initialSection);

      dragStartTrackIndexRef.current = initialTrackIndex;
      lastIntentDirectionRef.current = 1;
      setActiveTrackIndex(initialTrackIndex);
    }
    setDresscodeLookMode("male");
    setDresscodeActiveIndexByMode(createDresscodeIndexMap());
    setDresscodeMaxViewedIndexByMode(initialProgress.dresscode.viewedByMode);
    setFoodActiveCategory("salad");
    setFoodActiveIndexByCategory(createFoodIndexMap());
    setFoodDetailOpenKey(0);
    setGiftActiveIndex(createGiftActiveIndex());
    setGiftDetailOpenKey(0);
    setShowFoodTopHint(false);
    hasShownFoodTopHintRef.current = false;
    setShowFoodCommentHint(false);
    hasShownFoodCommentHintRef.current = false;
    setIsFoodCategorySwitching(false);
    setIsFoodCommentDialogOpen(false);
    setDetailSection(null);
    setNeedsAttention({
      dresscode: false,
      food: false,
      gifts: false,
      plan: false
    });
    setAuthRequired(false);
    setReadOnly(payload.readOnly);
    setIsSubmitted(payload.invite.meta.isSubmitted);
    setEditableUntil(payload.invite.meta.editableUntil);
    setHasUnsavedChanges(false);
    setHasPendingDraftChanges(false);
    draftRevisionRef.current = 0;
    lastDraftSavedRevisionRef.current = 0;
    autoSubmitRef.current = false;

    return true;
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function restoreInviteSession() {
      let shouldHoldInitialSplash = false;

      if (window.matchMedia(`(max-width: ${MOBILE_STAGE_BREAKPOINT_PX}px)`).matches) {
        try {
          shouldHoldInitialSplash = window.sessionStorage.getItem(INITIAL_RESTORE_SPLASH_SESSION_KEY) !== "true";

          if (shouldHoldInitialSplash) {
            window.sessionStorage.setItem(INITIAL_RESTORE_SPLASH_SESSION_KEY, "true");
          }
        } catch {
          shouldHoldInitialSplash = true;
        }
      }

      const minSplashDelay = shouldHoldInitialSplash
        ? new Promise<void>((resolve) => {
            window.setTimeout(resolve, INITIAL_RESTORE_SPLASH_MIN_MS);
          })
        : Promise.resolve();

      try {
        setFetchError(null);
        const payload = await getInviteSession();
        await minSplashDelay;

        if (!isMounted) {
          return;
        }

        if (!hydrateInviteSession(payload)) {
          setAuthRequired(true);
        } else {
          skipNextEntrySplashRef.current = true;
        }
      } catch (error) {
        await minSplashDelay;

        if (!isMounted) {
          return;
        }

        setFetchError(error instanceof Error ? error.message : "Не удалось восстановить сессию");
        setAuthRequired(true);
      } finally {
        if (isMounted) {
          setIsRestoringSession(false);
        }
      }
    }

    void restoreInviteSession();

    return () => {
      isMounted = false;
    };
  }, [hydrateInviteSession]);

  useEffect(() => {
    if (isRestoringSession || authRequired || hasPlayedEntrySplashRef.current || !isCompactMobile) {
      return;
    }

    if (skipNextEntrySplashRef.current) {
      skipNextEntrySplashRef.current = false;
      hasPlayedEntrySplashRef.current = true;
      return;
    }

    hasPlayedEntrySplashRef.current = true;
    setShowEntrySplash(true);
    setIsEntrySplashExiting(false);

    entrySplashExitTimeoutRef.current = window.setTimeout(() => {
      entrySplashExitTimeoutRef.current = null;
      setIsEntrySplashExiting(true);
    }, ENTRY_SPLASH_HOLD_MS);

    entrySplashCleanupTimeoutRef.current = window.setTimeout(() => {
      entrySplashCleanupTimeoutRef.current = null;
      setShowEntrySplash(false);
      setIsEntrySplashExiting(false);
    }, ENTRY_SPLASH_HOLD_MS + ENTRY_SPLASH_FADE_MS);

    return () => {
      if (entrySplashExitTimeoutRef.current !== null) {
        window.clearTimeout(entrySplashExitTimeoutRef.current);
        entrySplashExitTimeoutRef.current = null;
      }

      if (entrySplashCleanupTimeoutRef.current !== null) {
        window.clearTimeout(entrySplashCleanupTimeoutRef.current);
        entrySplashCleanupTimeoutRef.current = null;
      }
    };
  }, [authRequired, isCompactMobile, isRestoringSession]);

  useEffect(() => {
    if (!isCompactMobile) {
      return;
    }

    if (detailSection || screen !== "sections") {
      return;
    }

    const normalizedIndex = normalizeTrackIndex(activeTrackIndex);
    syncMobileStageToIndex(normalizedIndex, "auto");
  }, [detailSection, isCompactMobile, screen]);

  const persistDraft = useCallback(async (options?: { keepalive?: boolean }) => {
    const currentInviteId = inviteIdRef.current;

    if (!currentInviteId || readOnlyRef.current || !hasPendingDraftChangesRef.current) {
      return;
    }

    const revision = draftRevisionRef.current;

    try {
      await saveInviteDraft(currentInviteId, responsesRef.current, progressRef.current, {
        keepalive: options?.keepalive
      });

      lastDraftSavedRevisionRef.current = revision;

      if (draftRevisionRef.current === revision) {
        setHasPendingDraftChanges(false);
      }
    } catch (error) {
      if (!options?.keepalive) {
        setSubmitError(error instanceof Error ? error.message : "Не удалось сохранить черновик");
      }
    }
  }, []);

  useEffect(() => {
    if (!inviteId || authRequired || isRestoringSession || readOnly || !hasPendingDraftChanges) {
      return;
    }

    if (draftSaveTimeoutRef.current !== null) {
      window.clearTimeout(draftSaveTimeoutRef.current);
    }

    draftSaveTimeoutRef.current = window.setTimeout(() => {
      draftSaveTimeoutRef.current = null;
      void persistDraft();
    }, 900);

    return () => {
      if (draftSaveTimeoutRef.current !== null) {
        window.clearTimeout(draftSaveTimeoutRef.current);
        draftSaveTimeoutRef.current = null;
      }
    };
  }, [inviteId, authRequired, isRestoringSession, readOnly, hasPendingDraftChanges, responses, progress, persistDraft]);

  useEffect(() => {
    function flushDraftOnLeave() {
      if (!inviteIdRef.current || readOnlyRef.current || !hasPendingDraftChangesRef.current) {
        return;
      }

      void persistDraft({ keepalive: true });
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        flushDraftOnLeave();
      }
    }

    window.addEventListener("pagehide", flushDraftOnLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushDraftOnLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [persistDraft]);

  const onProfileSubmit = handleSubmit(async (values) => {
    try {
      setFetchError(null);
      setSubmitError(null);
      setSubmitMessage(null);

      const payload = await loginInvite(values);
      if (!hydrateInviteSession(payload)) {
        throw new Error("Не удалось получить приглашение");
      }
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Не удалось выполнить вход");
    }
  });

  function markUnsavedChanges() {
    draftRevisionRef.current += 1;
    setHasPendingDraftChanges(true);

    if (isSubmitted) {
      setHasUnsavedChanges(true);
    }
  }

  function updateResponses(updater: (current: InviteResponses) => InviteResponses) {
    setResponses((current) => updater(current));
  }

  function updateProgress(updater: (current: InviteProgress) => InviteProgress) {
    setProgress((current) => updater(current));
  }

  function nudgeNeedsAttention() {
    if (!isSectionComplete(activeSection, responses, progress)) {
      setNeedsAttention((current) => ({ ...current, [activeSection]: true }));
    }
  }

  function stepCarousel(direction: CarouselDirection) {
    if (screen !== "sections" || detailSection || isDraggingStage) {
      return;
    }

    nudgeNeedsAttention();
    dragOffsetRef.current = 0;
    setSubmitMessage(null);
    setSubmitError(null);
    lastIntentDirectionRef.current = direction;
    setActiveTrackIndex((current) => current + direction);
  }

  const processStageWheel = useCallback(
    (deltaX: number, deltaY: number, deltaMode: number): boolean => {
      if (detailSection || isDraggingStage) {
        return false;
      }

      const dominantIsHorizontal = Math.abs(deltaX) >= Math.abs(deltaY);
      const dominantDelta = dominantIsHorizontal ? deltaX : deltaY;
      const magnitude = Math.abs(dominantDelta);

      if (magnitude === 0) {
        return false;
      }

      const direction: CarouselDirection = dominantDelta > 0 ? 1 : -1;

      if (magnitude < WHEEL_SETTLE_DELTA) {
        wheelGestureSettledRef.current = true;
        return dominantIsHorizontal;
      }

      if (deltaMode !== WheelEvent.DOM_DELTA_PIXEL) {
        stepCarousel(direction);
        return true;
      }

      const now = performance.now();
      const timeSinceLastEvent = now - lastWheelEventTimeRef.current;
      const isNewBurst = timeSinceLastEvent > WHEEL_BURST_GAP_MS;
      const directionChanged = direction !== wheelGestureDirectionRef.current;
      lastWheelEventTimeRef.current = now;

      if (isNewBurst || directionChanged) {
        wheelGestureSettledRef.current = true;
        wheelGestureDirectionRef.current = direction;
      }

      if (magnitude < WHEEL_TRIGGER_DELTA || !wheelGestureSettledRef.current) {
        return true;
      }

      wheelGestureSettledRef.current = false;
      wheelGestureDirectionRef.current = direction;
      stepCarousel(direction);

      return true;
    },
    [detailSection, isDraggingStage, screen, stepCarousel]
  );

  function navigateToTrackIndex(nextTrackIndex: number, nextSection: SectionKey) {
    if (screen !== "sections") {
      return;
    }

    if (nextTrackIndex === activeTrackIndex) {
      return;
    }

    nudgeNeedsAttention();

    if (detailSection) {
      setDetailSection(nextSection);
    }

    setSubmitMessage(null);
    setSubmitError(null);
    lastIntentDirectionRef.current = nextTrackIndex > activeTrackIndex ? 1 : -1;
    setActiveTrackIndex(nextTrackIndex);
  }

  function handleDresscodeActiveIndexChange(lookMode: DresscodeLookMode, index: number) {
    const currentMaxViewedIndex = dresscodeMaxViewedIndexByMode[lookMode];
    const nextMaxViewedIndex = Math.max(currentMaxViewedIndex, index);
    const nextCompleted = progress.dresscode.completed || isDresscodeModeComplete(lookMode, nextMaxViewedIndex);

    setDresscodeActiveIndexByMode((current) => {
      if (current[lookMode] === index) {
        return current;
      }

      return {
        ...current,
        [lookMode]: index
      };
    });

    setDresscodeMaxViewedIndexByMode((current) => {
      if (nextMaxViewedIndex <= current[lookMode]) {
        return current;
      }

      return {
        ...current,
        [lookMode]: nextMaxViewedIndex
      };
    });

    if (nextMaxViewedIndex !== currentMaxViewedIndex || nextCompleted !== progress.dresscode.completed) {
      markUnsavedChanges();
      updateProgress((current) => ({
        ...current,
        dresscode: {
          viewedByMode: {
            ...current.dresscode.viewedByMode,
            [lookMode]: Math.max(current.dresscode.viewedByMode[lookMode], index)
          },
          completed:
            current.dresscode.completed ||
            isDresscodeModeComplete(lookMode, Math.max(current.dresscode.viewedByMode[lookMode], index))
        }
      }));
    }
  }

  function navigateToSection(nextSection: SectionKey) {
    if (screen !== "sections") {
      return;
    }

    if (detailSection) {
      setDetailSection(nextSection);
    }

    if (activeSection === nextSection) {
      return;
    }

    if (isCompactMobile && !detailSection) {
      const nextIndex = getSectionIndex(nextSection);

      syncMobileStageToIndex(nextIndex, "smooth");
      navigateToTrackIndex(nextIndex, nextSection);
      return;
    }

    const delta = getShortestTrackDistance(activeTrackIndex, nextSection, lastIntentDirectionRef.current);
    navigateToTrackIndex(activeTrackIndex + delta, nextSection);
  }

  function handleStageImageClick(section: SectionKey, absoluteIndex: number) {
    if (suppressStageClickRef.current) {
      suppressStageClickRef.current = false;
      return;
    }

    if (absoluteIndex !== activeTrackIndex) {
      navigateToTrackIndex(absoluteIndex, section);
      return;
    }

    openSectionDetails(section);
  }

  function syncMobileStageToIndex(index: number, behavior: ScrollBehavior) {
    const stage = mobileStageRef.current;

    if (!stage) {
      return;
    }

    const slideWidth = stage.clientWidth;

    if (!slideWidth) {
      return;
    }

    const normalizedIndex = clamp(index, 0, SECTION_ORDER.length - 1);
    const targetLeft = slideWidth * normalizedIndex;

    if (Math.abs(stage.scrollLeft - targetLeft) < 2) {
      setMobileStageProgress(normalizedIndex);
      return;
    }

    mobileStageIsSyncingRef.current = true;
    stage.scrollTo({
      left: targetLeft,
      behavior
    });

    setMobileStageProgress(normalizedIndex);

    if (mobileStageSyncTimeoutRef.current !== null) {
      window.clearTimeout(mobileStageSyncTimeoutRef.current);
    }

    mobileStageSyncTimeoutRef.current = window.setTimeout(() => {
      mobileStageIsSyncingRef.current = false;
      mobileStageSyncTimeoutRef.current = null;
    }, behavior === "smooth" ? 420 : 120);
  }

  function handleMobileStageScroll(event: React.UIEvent<HTMLDivElement>) {
    const stage = event.currentTarget;
    const slideWidth = stage.clientWidth;

    if (!slideWidth) {
      return;
    }

    const rawProgress = stage.scrollLeft / slideWidth;
    const clampedProgress = clamp(rawProgress, 0, SECTION_ORDER.length - 1);
    setMobileStageProgress(clampedProgress);

    if (mobileStageIsSyncingRef.current) {
      return;
    }

    const currentIndex = normalizeTrackIndex(activeTrackIndex);
    const nextIndex = clamp(Math.round(clampedProgress), 0, SECTION_ORDER.length - 1);

    if (nextIndex === currentIndex) {
      return;
    }

    lastIntentDirectionRef.current = nextIndex > currentIndex ? 1 : -1;
    setActiveTrackIndex(nextIndex);
  }

  function toggleFoodSelection(category: FoodCategoryKey, key: string) {
    if (readOnly) {
      return;
    }

    if (foodAutoAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(foodAutoAdvanceTimeoutRef.current);
      foodAutoAdvanceTimeoutRef.current = null;
    }

    if (foodCommentHintTimeoutRef.current !== null) {
      window.clearTimeout(foodCommentHintTimeoutRef.current);
      foodCommentHintTimeoutRef.current = null;
    }

    if (foodCategorySwitchTimeoutRef.current !== null) {
      window.clearTimeout(foodCategorySwitchTimeoutRef.current);
      foodCategorySwitchTimeoutRef.current = null;
    }

    setIsFoodCategorySwitching(false);
    setShowFoodTopHint(false);
    markUnsavedChanges();
    const selectedKey = responses.food.selections?.[category]?.[0];
    const nextSelectedKey = selectedKey === key ? null : key;

    const previousSelectedKey = responses.food.selections?.[category]?.[0] ?? null;
    const isInitialCategorySelection = !previousSelectedKey && Boolean(nextSelectedKey);

    updateResponses((current) => {
      const previousValues = current.food.selections?.[category] ?? [];
      const currentSelectedKey = previousValues[0];
      const nextValues = currentSelectedKey === key ? [] : [key];

      return {
        ...current,
        food: {
          ...current.food,
          selections: {
            ...(current.food.selections ?? {}),
            [category]: nextValues
          }
        }
      };
    });

    if (!nextSelectedKey) {
      return;
    }

    if (category === "salad" && !hasShownFoodCommentHintRef.current) {
      hasShownFoodCommentHintRef.current = true;
      foodCommentHintTimeoutRef.current = window.setTimeout(() => {
        if (detailSection === "food") {
          setShowFoodCommentHint(true);
        }
        foodCommentHintTimeoutRef.current = null;
      }, 300);
    }

    if (!isInitialCategorySelection) {
      return;
    }

    const currentCategoryIndex = FOOD_CATEGORY_ORDER.indexOf(category);
    const nextCategory = FOOD_CATEGORY_ORDER[currentCategoryIndex + 1];

    if (!nextCategory) {
      return;
    }

    foodAutoAdvanceTimeoutRef.current = window.setTimeout(() => {
      setIsFoodCategorySwitching(true);

      foodCategorySwitchTimeoutRef.current = window.setTimeout(() => {
        resetFoodCategoryView(nextCategory);
        setIsFoodCategorySwitching(false);
        foodCategorySwitchTimeoutRef.current = null;
      }, FOOD_CATEGORY_SWITCH_FADE_MS);

      foodAutoAdvanceTimeoutRef.current = null;
    }, FOOD_AUTO_ADVANCE_DELAY_MS);
  }

  function toggleGiftSelection(key: string) {
    if (readOnly) {
      return;
    }

    markUnsavedChanges();
    updateResponses((current) => {
      const previousSelectedKey = current.gifts.selections?.[0];
      const next = previousSelectedKey === key ? [] : [key];

      return {
        ...current,
        gifts: {
          ...current.gifts,
          selections: next
        }
      };
    });
  }

  function handleGiftActiveIndexChange(index: number) {
    setGiftActiveIndex((current) => (current === index ? current : index));
  }

  function updateFoodComment(value: string) {
    if (readOnly) {
      return;
    }

    markUnsavedChanges();
    updateResponses((current) => ({
      ...current,
      food: {
        ...current.food,
        comment: value.slice(0, 400)
      }
    }));
  }

  function openFoodCommentDialog() {
    setFoodCommentDraft(responses.food.comment ?? "");
    setIsFoodCommentDialogOpen(true);
  }

  function closeFoodCommentDialog() {
    setIsFoodCommentDialogOpen(false);
    setFoodCommentDraft(responses.food.comment ?? "");
  }

  function handleFoodCommentDraftChange(value: string) {
    setFoodCommentDraft(value.slice(0, 400));
  }

  function submitFoodCommentDialog() {
    if (!readOnly) {
      updateFoodComment(foodCommentDraft);
    }

    setIsFoodCommentDialogOpen(false);
  }

  function handleFoodActiveIndexChange(index: number) {
    setFoodActiveIndexByCategory((current) => {
      if (current[foodActiveCategory] === index) {
        return current;
      }

      return {
        ...current,
        [foodActiveCategory]: index
      };
    });
  }

  function resetFoodCategoryView(category: FoodCategoryKey) {
    const nextIndex = createFoodIndexMap()[category];

    setFoodActiveCategory(category);
    setFoodActiveIndexByCategory((current) => ({
      ...current,
      [category]: nextIndex
    }));
    setFoodDetailOpenKey((current) => current + 1);
  }

  function handleFoodCategoryChange(category: FoodCategoryKey) {
    if (foodAutoAdvanceTimeoutRef.current !== null) {
      window.clearTimeout(foodAutoAdvanceTimeoutRef.current);
      foodAutoAdvanceTimeoutRef.current = null;
    }

    if (foodCategorySwitchTimeoutRef.current !== null) {
      window.clearTimeout(foodCategorySwitchTimeoutRef.current);
      foodCategorySwitchTimeoutRef.current = null;
    }

    setIsFoodCategorySwitching(false);
    resetFoodCategoryView(category);
  }

  function getDetailTitle(section: SectionKey): string {
    switch (section) {
      case "dresscode":
        return "Одежда";
      case "food":
        return "Еда";
      case "gifts":
        return "Подарки";
      case "plan":
        return "План на день";
    }
  }

  function getDetailSubtitle(section: SectionKey): string | null {
    switch (section) {
      case "dresscode":
        return "Просто посмотреть";
      case "food":
        return "Выберите позиции";
      case "gifts":
        return "Выберите подарок";
      case "plan":
        return "Просто посмотреть";
      default:
        return null;
    }
  }

  function finishStageDrag(sectionElement?: HTMLElement) {
    const dragSteps = clamp(-dragOffsetRef.current / dragTravelPx, -MAX_DRAG_STEPS, MAX_DRAG_STEPS);
    const dragStepsMagnitude = Math.abs(dragSteps);
    const snappedMagnitude =
      dragStepsMagnitude < DRAG_COMMIT_RATIO
        ? 0
        : Math.min(MAX_DRAG_STEPS, Math.floor(dragStepsMagnitude + (1 - DRAG_COMMIT_RATIO)));
    const snappedSteps = Math.sign(dragSteps) * snappedMagnitude;
    const pointerId = dragSessionRef.current.pointerId;
    const didDrag = dragSessionRef.current.dragging;
    const dragStartTrackIndex = dragStartTrackIndexRef.current;

    if (pointerId !== null && sectionElement?.hasPointerCapture(pointerId)) {
      sectionElement.releasePointerCapture(pointerId);
    }

    dragSessionRef.current = {
      pointerId: null,
      startX: 0,
      startY: 0,
      dragging: false
    };

    dragOffsetRef.current = 0;
    setIsDraggingStage(false);
    setDragOffsetPx(0);

    if (didDrag) {
      if (suppressResetTimeoutRef.current !== null) {
        window.clearTimeout(suppressResetTimeoutRef.current);
      }

      suppressResetTimeoutRef.current = window.setTimeout(() => {
        suppressStageClickRef.current = false;
        suppressResetTimeoutRef.current = null;
      }, 0);
    }

    if (!didDrag) {
      return;
    }

    if (snappedSteps === 0) {
      return;
    }

    nudgeNeedsAttention();
    setSubmitMessage(null);
    setSubmitError(null);
    lastIntentDirectionRef.current = snappedSteps > 0 ? 1 : -1;
    setActiveTrackIndex(dragStartTrackIndex + snappedSteps);
  }

  function handleStagePointerDown(event: React.PointerEvent<HTMLElement>) {
    if (detailSection) {
      return;
    }

    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    if (suppressResetTimeoutRef.current !== null) {
      window.clearTimeout(suppressResetTimeoutRef.current);
      suppressResetTimeoutRef.current = null;
    }

    suppressStageClickRef.current = false;
    dragStartTrackIndexRef.current = activeTrackIndex;
    dragSessionRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false
    };
  }

  function handleStagePointerMove(event: React.PointerEvent<HTMLElement>) {
    if (dragSessionRef.current.pointerId !== event.pointerId || detailSection) {
      return;
    }

    const offsetX = event.clientX - dragSessionRef.current.startX;
    const offsetY = event.clientY - dragSessionRef.current.startY;

    if (!dragSessionRef.current.dragging) {
      if (Math.abs(offsetX) < DRAG_ACTIVATION_PX || Math.abs(offsetX) <= Math.abs(offsetY)) {
        return;
      }

      dragSessionRef.current.dragging = true;
      suppressStageClickRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDraggingStage(true);
    }

    event.preventDefault();
    const nextOffset = clamp(offsetX, -maxDragOffsetPx, maxDragOffsetPx);
    dragOffsetRef.current = nextOffset;
    setDragOffsetPx(nextOffset);
  }

  function handleStagePointerUp(event: React.PointerEvent<HTMLElement>) {
    if (dragSessionRef.current.pointerId !== event.pointerId) {
      return;
    }

    finishStageDrag(event.currentTarget);
  }

  function handleStagePointerCancel(event: React.PointerEvent<HTMLElement>) {
    if (dragSessionRef.current.pointerId !== event.pointerId) {
      return;
    }

    finishStageDrag(event.currentTarget);
  }

  useEffect(() => {
    if (isCompactMobile || detailSection) {
      return;
    }

    const stage = heroStageRef.current;

    if (!stage) {
      return;
    }

    const handleNativeStageWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        return;
      }

      if (!processStageWheel(event.deltaX, event.deltaY, event.deltaMode)) {
        return;
      }

      event.preventDefault();
    };

    stage.addEventListener("wheel", handleNativeStageWheel, { passive: false });

    return () => {
      stage.removeEventListener("wheel", handleNativeStageWheel);
    };
  }, [detailSection, isCompactMobile, processStageWheel]);

  function getStageItemStyle(relativeStep: number): CSSProperties {
    const style: Record<string, string> = {
      "--stage-drag-x": "0px"
    };

    const clampedRelativeStep = clamp(relativeStep, -2.6, 2.6);
    const absRelativeStep = Math.abs(clampedRelativeStep);
    const centerBlend = clamp(1 - absRelativeStep, 0, 1);
    const scale = clamp(1 - 0.16 * Math.min(absRelativeStep, 1) - 0.12 * Math.max(absRelativeStep - 1, 0), 0.72, 1);
    const opacity =
      absRelativeStep <= 1
        ? 1 - 0.04 * absRelativeStep
        : clamp(0.96 - 0.96 * (absRelativeStep - 1), 0, 0.96);
    const outerProgress = clamp(absRelativeStep - 1, 0, 1);
    const signedX =
      absRelativeStep <= 1
        ? `calc(var(--stage-side-x) * ${clampedRelativeStep})`
        : `calc((var(--stage-side-x) + (var(--stage-far-x) - var(--stage-side-x)) * ${outerProgress}) * ${
            clampedRelativeStep < 0 ? "-1" : "1"
          })`;

    style["--stage-slot-x"] = signedX;
    style["--stage-slot-y"] = `calc(11.851852vh * ${centerBlend})`;
    style["--stage-slot-scale"] = `${scale}`;
    style["--stage-slot-opacity"] = `${opacity}`;
    style["--stage-slot-visibility"] = absRelativeStep <= 2.15 ? "visible" : "hidden";
    style["--stage-slot-z"] = `${Math.max(0, 5 - Math.round(absRelativeStep * 2))}`;
    style["--stage-shadow-y"] = `calc(16px + 12px * ${centerBlend})`;
    style["--stage-shadow-blur"] = `calc(24px + 14px * ${centerBlend})`;
    style.width = `calc(var(--stage-side-width) + (var(--stage-center-width) - var(--stage-side-width)) * ${centerBlend})`;
    style.height = `calc(var(--stage-side-height) + (var(--stage-center-height) - var(--stage-side-height)) * ${centerBlend})`;

    return style as CSSProperties;
  }

  function handleNext(options?: { openNextDetail?: boolean }) {
    if (readOnly) {
      return;
    }

    if (activeSection === "dresscode" && !progress.dresscode.completed) {
      markUnsavedChanges();
      updateProgress((current) => ({
        ...current,
        dresscode: {
          ...current.dresscode,
          completed: true
        }
      }));
    }

    setNeedsAttention((current) => ({ ...current, [activeSection]: false }));

    const currentIndex = SECTION_ORDER.indexOf(activeSection);
    const nextSection = SECTION_ORDER[currentIndex + 1];

    if (nextSection) {
      lastIntentDirectionRef.current = 1;
      setActiveTrackIndex((current) => current + 1);

      if (options?.openNextDetail) {
        openSectionDetails(nextSection);
      }

      return;
    }

    if (options?.openNextDetail) {
      closeFoodCommentDialog();
      setDetailSection(null);
    }
  }

  function openSectionDetails(section: SectionKey) {
    if (section === "food") {
      setFoodActiveCategory("salad");
      setFoodActiveIndexByCategory(createFoodIndexMap());
      setShowFoodTopHint(!hasShownFoodTopHintRef.current);
      hasShownFoodTopHintRef.current = true;
      setShowFoodCommentHint(false);
      setFoodDetailOpenKey((current) => current + 1);
    } else {
      setShowFoodTopHint(false);
      setShowFoodCommentHint(false);
    }

    if (section === "gifts") {
      setGiftActiveIndex(createGiftActiveIndex());
      setGiftDetailOpenKey((current) => current + 1);
    }

    if (section === "plan" && !readOnly) {
      if (!progress.plan.opened) {
        markUnsavedChanges();
        updateProgress((current) => ({
          ...current,
          plan: {
            ...current.plan,
            opened: true
          }
        }));
      }

      setNeedsAttention((current) => ({ ...current, plan: false }));
    }

    setDetailSection(section);
    closeFoodCommentDialog();
    setSubmitMessage(null);
    setSubmitError(null);
  }

  function closeSectionDetails() {
    closeFoodCommentDialog();
    setDetailSection(null);
  }

  function handleDetailNext() {
    handleNext({ openNextDetail: true });
  }

  function handlePlanDownload() {
    if (readOnly || progress.plan.downloaded) {
      return;
    }

    markUnsavedChanges();
    updateProgress((current) => ({
      ...current,
      plan: {
        opened: true,
        downloaded: true
      }
    }));
  }

  const handleFinalSubmit = useCallback(async () => {
    if (readOnly || !isAllSectionsCompleteValue) {
      return;
    }

    if (!inviteId) {
      setSubmitError("Сессия входа недействительна. Выполните вход снова.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitMessage(null);

    try {
      const payload = await submitInvite(inviteId, responses, progress);
      if (!payload.invite) {
        throw new Error("Пустой ответ от сервера");
      }

      setResponses(normalizeInviteResponses(payload.invite.responses));
      setProgress(normalizeInviteProgress(payload.invite.progress));
      setDresscodeMaxViewedIndexByMode(normalizeInviteProgress(payload.invite.progress).dresscode.viewedByMode);
      setIsSubmitted(payload.invite.meta.isSubmitted);
      setEditableUntil(payload.invite.meta.editableUntil);
      setReadOnly(payload.readOnly);
      setHasUnsavedChanges(false);
      setHasPendingDraftChanges(false);
      lastDraftSavedRevisionRef.current = draftRevisionRef.current;
      setSubmitMessage("Данные успешно сохранены");
    } catch (error) {
      autoSubmitRef.current = false;
      setSubmitError(error instanceof Error ? error.message : "Не удалось сохранить данные");
    } finally {
      autoSubmitRef.current = false;
      setSubmitting(false);
    }
  }, [inviteId, isAllSectionsCompleteValue, progress, readOnly, responses]);

  useEffect(() => {
    if (
      !readOnly &&
      isAllSectionsCompleteValue &&
      (!isSubmitted || hasUnsavedChanges) &&
      !autoSubmitRef.current &&
      !submitting
    ) {
      autoSubmitRef.current = true;
      void handleFinalSubmit();
    }
  }, [readOnly, isAllSectionsCompleteValue, isSubmitted, hasUnsavedChanges, submitting, handleFinalSubmit]);

  async function handleShare() {
    const shareUrl = `${window.location.origin}/`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: EVENT_DETAILS.title,
          text: "Приглашаем вас на свадьбу",
          url: shareUrl
        });
        return;
      } catch {
        // fall back to clipboard below
      }
    }

    await navigator.clipboard.writeText(shareUrl);
    setSubmitMessage("Ссылка скопирована в буфер обмена");
  }

  const entrySplashOverlay = showEntrySplash ? (
    <div className={`entrySplash ${isEntrySplashExiting ? "isExiting" : ""}`} aria-hidden="true">
      <img className="entrySplashImage" src={ENTRY_SPLASH_URL} alt="" />
    </div>
  ) : null;
  const mobileIndicatorIndex = mod(Math.round(mobileStageProgress), SECTION_ORDER.length);
  const mobileHomeActiveSection = SECTION_ORDER[mobileIndicatorIndex];

  if (isRestoringSession) {
    return (
      <>
        <main className="shell authShell">
          <section
            className="authSection authSectionWithLogoBg"
            style={
              {
                "--auth-logo-url": `url("${AUTH_LOGO_URL}")`,
                "--auth-logo-mobile-url": `url("${AUTH_LOGO_MOBILE_URL}")`
              } as CSSProperties
            }
          />
        </main>
        <div className="entrySplash entrySplashRestore" aria-hidden="true">
          <img className="entrySplashImage" src={ENTRY_SPLASH_URL} alt="" />
        </div>
      </>
    );
  }

  if (authRequired) {
    return (
      <main className="shell authShell authShellLogin">
        <section
          className="authSection authSectionWithLogoBg authSectionLogin"
          style={
            {
              "--auth-logo-url": `url("${AUTH_LOGO_URL}")`,
              "--auth-logo-mobile-url": `url("${AUTH_LOGO_MOBILE_URL}")`
            } as CSSProperties
          }
        >
          <form className="authForm authFormLogin" onSubmit={onProfileSubmit}>
            <div className="authIntro">
              <div className="authLogoFrame" aria-hidden="true" />

              <div className="authFormFields">
                <label className="fieldLabel">
                  <input className="input" placeholder="Имя" aria-label="Имя" {...register("firstName")} />
                  {errors.firstName ? <small className="fieldError">{errors.firstName.message}</small> : null}
                </label>

                <label className="fieldLabel">
                  <input className="input" placeholder="Фамилия" aria-label="Фамилия" {...register("lastName")} />
                  {errors.lastName ? <small className="fieldError">{errors.lastName.message}</small> : null}
                </label>

                {fetchError ? <p className="errorText">{fetchError}</p> : null}
              </div>
            </div>
            <button className="detailNextButton authNextButton" type="submit" disabled={isAuthSubmitting}>
              {isAuthSubmitting ? "..." : "Далее"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (detailSection) {
    return (
      <>
        {entrySplashOverlay}
        <main
          className={`sceneShell sceneShellDetail ${isDresscodeDetail || isPlanDetail ? "sceneShellDetailDresscode" : ""} ${
            isFoodDetail || isGiftDetail ? "sceneShellDetailFood" : ""
          }`}
        >
          <header className="sceneHeader sceneHeaderDetail">
            {isDresscodeDetail || isFoodDetail || isGiftDetail || isPlanDetail ? (
              <div className={`detailHeaderPrimary ${isDresscodeDetail ? "detailHeaderDresscode" : "detailHeaderFood"}`}>
                <button className="detailBackButton" type="button" onClick={closeSectionDetails} aria-label="Назад">
                  <DetailBackIcon className="detailBackIcon" />
                </button>
                <div className="detailHeaderText">
                  <h1 className="detailHeaderTitle">{getDetailTitle(detailSection)}</h1>
                  {getDetailSubtitle(detailSection) ? <p className="detailHeaderSubtitle">{getDetailSubtitle(detailSection)}</p> : null}
                </div>
              </div>
            ) : (
              <div className="detailHeaderControls">
                <button className="closeButton" type="button" onClick={closeSectionDetails} aria-label="Закрыть">
                  <CrossIcon className="closeIcon" />
                </button>
                <span className="detailSectionPill">{SECTION_TAB_LABELS[activeSection]}</span>
              </div>
            )}
          </header>

          <section className="detailContent">
            <div className={`sceneEditor ${isDresscodeDetail ? "sceneEditorWide" : ""}`}>
              {activeSection === "dresscode" ? (
                <DresscodeSection
                  lookMode={dresscodeLookMode}
                  activeIndexByMode={dresscodeActiveIndexByMode}
                  onActiveIndexChange={handleDresscodeActiveIndexChange}
                />
              ) : null}
              {activeSection === "food" ? (
                <FoodSection
                  readOnly={readOnly}
                  responses={responses}
                  activeCategory={foodActiveCategory}
                  activeIndexByCategory={foodActiveIndexByCategory}
                  showCommentHint={showFoodCommentHint}
                  showTopHint={showFoodTopHint}
                  openKey={foodDetailOpenKey}
                  isCategorySwitching={isFoodCategorySwitching}
                  onCategoryChange={handleFoodCategoryChange}
                  onActiveIndexChange={handleFoodActiveIndexChange}
                  onToggleSelection={toggleFoodSelection}
                  onCommentClick={openFoodCommentDialog}
                />
              ) : null}
              {activeSection === "gifts" ? (
                <GiftsSection
                  readOnly={readOnly}
                  responses={responses}
                  activeIndex={giftActiveIndex}
                  openKey={giftDetailOpenKey}
                  onActiveIndexChange={handleGiftActiveIndexChange}
                  onToggleSelection={toggleGiftSelection}
                />
              ) : null}
              {activeSection === "plan" ? <PlanSection onDownload={handlePlanDownload} /> : null}
            </div>
          </section>

          {!isPlanDetail ? (
            <div
              className={`detailFooter ${isDresscodeDetail ? "detailFooterSplit" : ""} ${
                isFoodDetail || isGiftDetail ? "detailFooterFood" : ""
              }`}
            >
              {isDresscodeDetail ? (
                <div className="detailFooterInfo">
                  <div className="dresscodeLookPicker" role="group" aria-label="Режим dresscode">
                    <button
                      type="button"
                      className={`dresscodeLookButton ${dresscodeLookMode === "male" ? "active" : ""}`}
                      onClick={() => setDresscodeLookMode("male")}
                      aria-pressed={dresscodeLookMode === "male"}
                      aria-label="male"
                    >
                      <DresscodeMaleIcon className="dresscodeLookIcon" />
                    </button>
                    <button
                      type="button"
                      className={`dresscodeLookButton ${dresscodeLookMode === "female" ? "active" : ""}`}
                      onClick={() => setDresscodeLookMode("female")}
                      aria-pressed={dresscodeLookMode === "female"}
                      aria-label="female"
                    >
                      <DresscodeFemaleIcon className="dresscodeLookIcon" />
                    </button>
                  </div>
                </div>
              ) : null}

              <button className="detailNextButton" type="button" onClick={handleDetailNext} disabled={isDetailNextDisabled}>
                Далее
              </button>
            </div>
          ) : null}

          {isFoodDetail && isFoodCommentDialogOpen ? (
            <div className="detailModalOverlay" onClick={closeFoodCommentDialog}>
              <div className="detailModal detailModalFoodComment" onClick={(event) => event.stopPropagation()}>
                <div className="detailModalHeader">
                  <div className="detailModalLead">
                    <FoodCommentIcon className="detailModalLeadIcon" />
                    <div className="detailModalText">
                      <h2 className="detailModalTitle">Комментарий</h2>
                      <p className="detailModalSubtitle">Сообщите о предпочтениях</p>
                    </div>
                  </div>
                </div>

                <div className="detailModalEditor">
                  <textarea
                    className="detailModalTextarea"
                    value={foodCommentDraft}
                    onChange={(event) => handleFoodCommentDraftChange(event.target.value)}
                    maxLength={400}
                    placeholder="По аллергиям и тд"
                    disabled={readOnly}
                  />
                  <div className="detailModalMeta">{foodCommentDraft.length}/400</div>
                </div>

                <button
                  className="detailModalSubmitButton"
                  type="button"
                  onClick={submitFoodCommentDialog}
                  disabled={readOnly}
                >
                  Отправить
                </button>
              </div>
            </div>
          ) : null}
        </main>
      </>
    );
  }

  return (
    <>
      {entrySplashOverlay}
      <main className="sceneShell sceneShellHome">
        <header className="sceneHeader">
          <nav className="sectionTabs sceneTabs" aria-label="Разделы">
            {SECTION_ORDER.map((section) => (
              <button
                key={section}
                className={`tabButton ${
                  (isCompactMobile ? mobileHomeActiveSection === section : activeSection === section) ? "active" : ""
                }`}
                type="button"
                onClick={() => navigateToSection(section)}
              >
                <span>{SECTION_TAB_LABELS[section]}</span>
              </button>
            ))}
          </nav>
        </header>

        {isCompactMobile ? (
          <section className="mobileStage">
            <div ref={mobileStageRef} className="mobileStageGallery" onScroll={handleMobileStageScroll}>
              {mobileStageItems.map(({ loopIndex, section, sectionIndex, src }) => (
                <div key={loopIndex} className="mobileStageSlide" data-section-index={sectionIndex}>
                  <button
                    className="mobileStageButton"
                    type="button"
                    onClick={() => openSectionDetails(section)}
                    aria-label={`Открыть раздел ${SECTION_LABELS[section]}`}
                  >
                    <img className="mobileStageImage" src={src} alt="" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mobileStageIndicators" aria-label="Позиция в галерее">
              <div className="mobileStageIndicatorTrack">
                {SECTION_ORDER.map((section, index) => (
                  <button
                    key={section}
                    className={`mobileStageIndicator ${mobileIndicatorIndex === index ? "isActive" : ""}`}
                    type="button"
                    onClick={() => navigateToSection(section)}
                    aria-label={`Перейти к разделу ${SECTION_LABELS[section]}`}
                    aria-pressed={mobileIndicatorIndex === index}
                  />
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section
            ref={heroStageRef}
            className={`heroStage stage-${activeSection} ${isDraggingStage ? "isDragging" : ""}`}
            style={
              {
                "--hero-logo-url": `url("${HERO_LOGO_URL}")`,
                "--hero-logo-mobile-url": `url("${HERO_LOGO_MOBILE_URL}")`
              } as CSSProperties
            }
            onPointerDown={handleStagePointerDown}
            onPointerMove={handleStagePointerMove}
            onPointerUp={handleStagePointerUp}
            onPointerCancel={handleStagePointerCancel}
          >
            {stageItems.map(({ absoluteIndex, relativeStep, section, slot, src }) => {
              const isHidden = Math.abs(relativeStep) > 1.6;
              const isActive = slot === "center";

              return (
                <button
                  key={absoluteIndex}
                  className="stagePropButton"
                  data-slot={slot}
                  data-active={isActive ? "true" : "false"}
                  type="button"
                  onClick={() => handleStageImageClick(section, absoluteIndex)}
                  style={getStageItemStyle(relativeStep)}
                  aria-hidden={isHidden ? true : undefined}
                  aria-label={isActive ? `Открыть раздел ${SECTION_LABELS[section]}` : `Перейти к разделу ${SECTION_LABELS[section]}`}
                  tabIndex={isHidden ? -1 : 0}
                >
                  <img className="stagePropImage" src={src} alt="" />
                </button>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
}
