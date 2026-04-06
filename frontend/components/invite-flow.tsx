"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AUTH_LOGO_URL, getSectionImage, HERO_LOGO_URL } from "@/config/scene-assets";
import { CrossIcon } from "@/components/icons/cross-icon";
import { DetailBackIcon } from "@/components/icons/detail-back-icon";
import { DresscodeFemaleIcon, DresscodeMaleIcon } from "@/components/icons/dresscode-look-icons";
import { FoodCommentIcon } from "@/components/icons/food-comment-icon";
import { FOOD_OPTIONS, GIFT_OPTIONS } from "@/config/options";
import {
  DresscodeSection,
  DRESSCODE_LAST_SLIDE_INDEX,
  type DresscodeLookMode
} from "@/components/sections/dresscode";
import { FoodSection } from "@/components/sections/food";
import { GiftsSection } from "@/components/sections/gifts";
import { PlanSection } from "@/components/sections/plan";
import { loginInvite, submitInvite } from "@/lib/api";
import type { FoodCategoryKey, InviteProfile, InviteResponses, SectionKey } from "@/lib/types";

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
const WHEEL_LOCK_MS = 360;
const MAX_DRAG_STEPS = SECTION_ORDER.length * 3;
const STAGE_RENDER_RADIUS = 3;
const FOOD_CATEGORY_ORDER: FoodCategoryKey[] = ["salad", "hot", "drinks"];
const FOOD_AUTO_ADVANCE_DELAY_MS = 800;
const FOOD_CATEGORY_SWITCH_FADE_MS = 220;

function createDefaultResponses(): InviteResponses {
  return {
    dresscode: { acknowledged: false },
    food: {
      acknowledged: false,
      selections: {},
      comment: ""
    },
    gifts: {
      acknowledged: false,
      selections: []
    },
    plan: { acknowledged: false }
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
    ...responses,
    food: {
      ...responses.food,
      selections: normalizeFoodSelections(responses.food.selections)
    },
    gifts: {
      ...responses.gifts,
      selections: normalizeGiftSelections(responses.gifts.selections)
    }
  };
}

function isAllAcknowledged(responses: InviteResponses): boolean {
  return SECTION_ORDER.every((section) => responses[section].acknowledged);
}

function getInitialScreen(responses: InviteResponses): "sections" | "final" {
  return isAllAcknowledged(responses) ? "final" : "sections";
}

function getInitialSection(responses: InviteResponses): SectionKey {
  return SECTION_ORDER.find((section) => !responses[section].acknowledged) ?? "dresscode";
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

function createDresscodeIndexMap(): Record<DresscodeLookMode, number> {
  return {
    male: 0,
    female: 0
  };
}

function createFoodIndexMap(): Record<FoodCategoryKey, number> {
  return {
    salad: Math.min(1, FOOD_OPTIONS.salad.length - 1),
    hot: Math.min(1, FOOD_OPTIONS.hot.length - 1),
    drinks: Math.min(1, FOOD_OPTIONS.drinks.length - 1)
  };
}

function createGiftActiveIndex(): number {
  return Math.min(1, GIFT_OPTIONS.length - 1);
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
  const [authRequired, setAuthRequired] = useState(true);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [profile, setProfile] = useState<InviteProfile | null>(null);
  const [responses, setResponses] = useState<InviteResponses>(createDefaultResponses);
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
  const autoSubmitRef = useRef(false);
  const foodAutoAdvanceTimeoutRef = useRef<number | null>(null);
  const foodCategorySwitchTimeoutRef = useRef<number | null>(null);
  const heroStageRef = useRef<HTMLElement | null>(null);
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
  const wheelLockUntilRef = useRef(0);
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
  const isDresscodeReviewComplete = dresscodeMaxViewedIndexByMode[dresscodeLookMode] >= DRESSCODE_LAST_SLIDE_INDEX;
  const isFoodSelectionComplete = FOOD_CATEGORY_ORDER.every((category) =>
    Boolean(responses.food.selections?.[category]?.[0])
  );
  const isGiftSelectionComplete = Boolean(responses.gifts.selections?.[0]);
  const isDetailNextDisabled =
    readOnly ||
    (isDresscodeDetail && !isDresscodeReviewComplete) ||
    (isFoodDetail && !isFoodSelectionComplete) ||
    (isGiftDetail && !isGiftSelectionComplete);
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

  useEffect(() => {
    dragOffsetRef.current = dragOffsetPx;
  }, [dragOffsetPx]);

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
  }, [detailSection]);

  useEffect(() => {
    return () => {
      if (foodAutoAdvanceTimeoutRef.current !== null) {
        window.clearTimeout(foodAutoAdvanceTimeoutRef.current);
      }
      if (foodCategorySwitchTimeoutRef.current !== null) {
        window.clearTimeout(foodCategorySwitchTimeoutRef.current);
      }
      if (suppressResetTimeoutRef.current !== null) {
        window.clearTimeout(suppressResetTimeoutRef.current);
      }
    };
  }, []);

  const onProfileSubmit = handleSubmit(async (values) => {
    try {
      setFetchError(null);
      setSubmitError(null);
      setSubmitMessage(null);

      const payload = await loginInvite(values);
      if (!payload.invite) {
        throw new Error("Не удалось получить приглашение");
      }

      const initialResponses = normalizeInviteResponses(payload.invite.responses ?? createDefaultResponses());

      setInviteId(payload.invite.id);
      setProfile(payload.invite.profile);
      setResponses(initialResponses);
      setScreen(getInitialScreen(initialResponses));
      {
        const initialSection = getInitialSection(initialResponses);
        const initialTrackIndex = getSectionIndex(initialSection);

        dragStartTrackIndexRef.current = initialTrackIndex;
        lastIntentDirectionRef.current = 1;
        setActiveTrackIndex(initialTrackIndex);
      }
      setDresscodeLookMode("male");
      setDresscodeActiveIndexByMode(createDresscodeIndexMap());
      setDresscodeMaxViewedIndexByMode(createDresscodeIndexMap());
      setFoodActiveCategory("salad");
      setFoodActiveIndexByCategory(createFoodIndexMap());
      setGiftActiveIndex(createGiftActiveIndex());
      setIsFoodCategorySwitching(false);
      setIsFoodCommentDialogOpen(false);
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
      autoSubmitRef.current = false;
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Не удалось выполнить вход");
    }
  });

  function markUnsavedChanges() {
    if (isSubmitted) {
      setHasUnsavedChanges(true);
    }
  }

  function updateResponses(updater: (current: InviteResponses) => InviteResponses) {
    setResponses((current) => updater(current));
  }

  function nudgeNeedsAttention() {
    if (!responses[activeSection].acknowledged) {
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
      if (index <= current[lookMode]) {
        return current;
      }

      return {
        ...current,
        [lookMode]: index
      };
    });
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

  function toggleFoodSelection(category: FoodCategoryKey, key: string) {
    if (readOnly) {
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
    markUnsavedChanges();
    const selectedKey = responses.food.selections?.[category]?.[0];
    const nextSelectedKey = selectedKey === key ? null : key;

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

    const currentCategoryIndex = FOOD_CATEGORY_ORDER.indexOf(category);
    const nextCategory = FOOD_CATEGORY_ORDER[currentCategoryIndex + 1];

    if (!nextCategory) {
      return;
    }

    foodAutoAdvanceTimeoutRef.current = window.setTimeout(() => {
      setIsFoodCategorySwitching(true);

      foodCategorySwitchTimeoutRef.current = window.setTimeout(() => {
        setFoodActiveCategory(nextCategory);
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
    setFoodActiveCategory(category);
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
        return SECTION_TAB_LABELS.plan;
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

  function handleStageWheel(event: React.WheelEvent<HTMLElement>) {
    if (detailSection || isDraggingStage) {
      return;
    }

    const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;

    if (Math.abs(dominantDelta) < 18) {
      return;
    }

    const now = Date.now();
    if (now < wheelLockUntilRef.current) {
      return;
    }

    wheelLockUntilRef.current = now + WHEEL_LOCK_MS;
    event.preventDefault();
    stepCarousel(dominantDelta > 0 ? 1 : -1);
  }

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
    style["--stage-slot-scale"] = `${scale}`;
    style["--stage-slot-opacity"] = `${opacity}`;
    style["--stage-slot-visibility"] = absRelativeStep <= 2.15 ? "visible" : "hidden";
    style["--stage-slot-z"] = `${Math.max(0, 5 - Math.round(absRelativeStep * 2))}`;
    style.width = `calc(var(--stage-side-width) + (var(--stage-center-width) - var(--stage-side-width)) * ${centerBlend})`;
    style.height = `calc(var(--stage-side-height) + (var(--stage-center-height) - var(--stage-side-height)) * ${centerBlend})`;

    return style as CSSProperties;
  }

  function handleNext(options?: { openNextDetail?: boolean }) {
    if (readOnly) {
      return;
    }

    updateResponses((current) => ({
      ...current,
      [activeSection]: {
        ...current[activeSection],
        acknowledged: true
      }
    }));

    setNeedsAttention((current) => ({ ...current, [activeSection]: false }));

    const currentIndex = SECTION_ORDER.indexOf(activeSection);
    const nextSection = SECTION_ORDER[currentIndex + 1];

    if (nextSection) {
      lastIntentDirectionRef.current = 1;
      setActiveTrackIndex((current) => current + 1);

      if (options?.openNextDetail) {
        closeFoodCommentDialog();
        setDetailSection(nextSection);
        setSubmitMessage(null);
        setSubmitError(null);
      }

      return;
    }

    if (options?.openNextDetail) {
      closeFoodCommentDialog();
      setDetailSection(null);
    }

    setScreen("final");
  }

  function openSectionDetails(section: SectionKey) {
    if (section === "food") {
      setFoodActiveIndexByCategory(createFoodIndexMap());
      setFoodDetailOpenKey((current) => current + 1);
    }

    if (section === "gifts") {
      setGiftActiveIndex(createGiftActiveIndex());
      setGiftDetailOpenKey((current) => current + 1);
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

  const handleFinalSubmit = useCallback(async () => {
    if (readOnly || !isAllAcknowledged(responses)) {
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
      const payload = await submitInvite(inviteId, responses);
      if (!payload.invite) {
        throw new Error("Пустой ответ от сервера");
      }

      setResponses(normalizeInviteResponses(payload.invite.responses));
      setIsSubmitted(payload.invite.meta.isSubmitted);
      setEditableUntil(payload.invite.meta.editableUntil);
      setReadOnly(payload.readOnly);
      setHasUnsavedChanges(false);
      setSubmitMessage("Данные успешно сохранены");
    } catch (error) {
      autoSubmitRef.current = false;
      setSubmitError(error instanceof Error ? error.message : "Не удалось сохранить данные");
    } finally {
      setSubmitting(false);
    }
  }, [inviteId, readOnly, responses]);

  useEffect(() => {
    if (!readOnly && screen === "final" && isAllAcknowledged(responses) && !isSubmitted && !autoSubmitRef.current) {
      autoSubmitRef.current = true;
      void handleFinalSubmit();
    }
  }, [screen, readOnly, responses, isSubmitted, handleFinalSubmit]);

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

  function getSectionStatus(section: SectionKey): "ok" | "warn" | "idle" {
    if (responses[section].acknowledged) {
      return "ok";
    }

    if (needsAttention[section]) {
      return "warn";
    }

    return "idle";
  }

  if (authRequired) {
    return (
      <main className="shell">
        <section
          className="authSection authSectionWithLogoBg"
          style={{ "--auth-logo-url": `url("${AUTH_LOGO_URL}")` } as CSSProperties}
        >
          <form className="authForm" onSubmit={onProfileSubmit}>
            <label className="fieldLabel">
              <span>Имя</span>
              <input className="input" placeholder="Имя" {...register("firstName")} />
              {errors.firstName ? <small className="fieldError">{errors.firstName.message}</small> : null}
            </label>

            <label className="fieldLabel">
              <span>Фамилия</span>
              <input className="input" placeholder="Фамилия" {...register("lastName")} />
              {errors.lastName ? <small className="fieldError">{errors.lastName.message}</small> : null}
            </label>

            <button className="nextButton" type="submit" disabled={isAuthSubmitting}>
              {isAuthSubmitting ? "..." : "Далее"}
            </button>
          </form>
          {fetchError ? <p className="errorText">{fetchError}</p> : null}
        </section>
      </main>
    );
  }

  if (screen === "final") {
    return (
      <main className="shell">
        <section className="panel">
          <header className="panelHeader">
            <h1 className="logo">ily@olga</h1>
            <div className="nameTag">{profile?.firstName} {profile?.lastName}</div>
          </header>

          <article className="inviteCard">
            <h2>{EVENT_DETAILS.title}</h2>
            <p><strong>Дата:</strong> {EVENT_DETAILS.date}</p>
            <p><strong>Время:</strong> {EVENT_DETAILS.time}</p>
            <p><strong>Место:</strong> {EVENT_DETAILS.place}</p>
            {editableUntil ? <p className="muted">Редактирование доступно до: {new Date(editableUntil).toLocaleDateString("ru-RU")}</p> : null}
          </article>

          <div className="finalActions">
            {!readOnly ? (
              <button className="primaryButton" type="button" disabled={submitting} onClick={() => void handleFinalSubmit()}>
                {submitting ? "Сохраняем..." : hasUnsavedChanges || !isSubmitted ? "Сохранить ответы" : "Обновить ответы"}
              </button>
            ) : (
              <span className="readonlyBadge">Режим только чтение</span>
            )}
            <button className="secondaryButton" type="button" onClick={() => void handleShare()}>
              Поделиться ссылкой
            </button>
            {!readOnly ? (
              <button className="ghostButton" type="button" onClick={() => setScreen("sections")}>
                Редактировать разделы
              </button>
            ) : null}
          </div>

          {submitMessage ? <p className="successText">{submitMessage}</p> : null}
          {submitError ? <p className="errorText">{submitError}</p> : null}
        </section>
      </main>
    );
  }

  if (detailSection) {
    return (
      <main
        className={`sceneShell sceneShellDetail ${isDresscodeDetail ? "sceneShellDetailDresscode" : ""} ${
          isFoodDetail || isGiftDetail ? "sceneShellDetailFood" : ""
        }`}
      >
        <header className="sceneHeader sceneHeaderDetail">
          {isDresscodeDetail || isFoodDetail || isGiftDetail ? (
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
            {activeSection === "plan" ? <PlanSection /> : null}
          </div>
        </section>

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
    );
  }

  return (
    <main className="sceneShell">
      <header className="sceneHeader">
        <nav className="sectionTabs sceneTabs" aria-label="Разделы">
          {SECTION_ORDER.map((section) => {
            const status = getSectionStatus(section);
            return (
              <button
                key={section}
                className={`tabButton ${activeSection === section ? "active" : ""}`}
                type="button"
                onClick={() => navigateToSection(section)}
              >
                <span>{SECTION_TAB_LABELS[section]}</span>
                {status === "ok" ? <span className="dot dotOk" /> : null}
                {status === "warn" ? <span className="dot dotWarn" /> : null}
              </button>
            );
          })}
        </nav>
      </header>

      <section
        ref={heroStageRef}
        className={`heroStage stage-${activeSection} ${isDraggingStage ? "isDragging" : ""}`}
        style={{ "--hero-logo-url": `url("${HERO_LOGO_URL}")` } as CSSProperties}
        onPointerDown={handleStagePointerDown}
        onPointerMove={handleStagePointerMove}
        onPointerUp={handleStagePointerUp}
        onPointerCancel={handleStagePointerCancel}
        onWheel={handleStageWheel}
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
    </main>
  );
}
