"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AUTH_LOGO_URL, getStageImages, HERO_LOGO_URL } from "@/config/scene-assets";
import { CrossIcon } from "@/components/icons/cross-icon";
import { DresscodeSection } from "@/components/sections/dresscode";
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

function isAllAcknowledged(responses: InviteResponses): boolean {
  return SECTION_ORDER.every((section) => responses[section].acknowledged);
}

function getInitialScreen(responses: InviteResponses): "sections" | "final" {
  return isAllAcknowledged(responses) ? "final" : "sections";
}

function getInitialSection(responses: InviteResponses): SectionKey {
  return SECTION_ORDER.find((section) => !responses[section].acknowledged) ?? "dresscode";
}

export function InviteFlow() {
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(true);
  const [inviteId, setInviteId] = useState<string | null>(null);
  const [profile, setProfile] = useState<InviteProfile | null>(null);
  const [responses, setResponses] = useState<InviteResponses>(createDefaultResponses);
  const [screen, setScreen] = useState<"sections" | "final">("sections");
  const [activeSection, setActiveSection] = useState<SectionKey>("dresscode");
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
  const [lookMode, setLookMode] = useState<"male" | "female">("male");
  const [detailSection, setDetailSection] = useState<SectionKey | null>(null);
  const autoSubmitRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isAuthSubmitting }
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema)
  });

  const stageImages = useMemo(() => getStageImages(activeSection, SECTION_ORDER), [activeSection]);

  const onProfileSubmit = handleSubmit(async (values) => {
    try {
      setFetchError(null);
      setSubmitError(null);
      setSubmitMessage(null);

      const payload = await loginInvite(values);
      if (!payload.invite) {
        throw new Error("Не удалось получить приглашение");
      }

      setInviteId(payload.invite.id);
      setProfile(payload.invite.profile);
      setResponses(payload.invite.responses ?? createDefaultResponses());
      setScreen(getInitialScreen(payload.invite.responses ?? createDefaultResponses()));
      setActiveSection(getInitialSection(payload.invite.responses ?? createDefaultResponses()));
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

  function navigateToSection(nextSection: SectionKey) {
    if (screen !== "sections") {
      return;
    }

    if (activeSection === nextSection) {
      return;
    }

    if (!responses[activeSection].acknowledged) {
      setNeedsAttention((current) => ({ ...current, [activeSection]: true }));
    }

    setActiveSection(nextSection);
    if (detailSection) {
      setDetailSection(nextSection);
    }
    setSubmitMessage(null);
    setSubmitError(null);
  }

  function handleStageImageClick(section: SectionKey) {
    if (section !== activeSection) {
      setActiveSection(section);
      return;
    }

    openSectionDetails(section);
  }

  function toggleFoodSelection(category: FoodCategoryKey, key: string) {
    if (readOnly) {
      return;
    }

    markUnsavedChanges();
    updateResponses((current) => {
      const previousValues = current.food.selections?.[category] ?? [];
      const nextValues = previousValues.includes(key)
        ? previousValues.filter((optionKey) => optionKey !== key)
        : [...previousValues, key];

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
  }

  function toggleGiftSelection(key: string) {
    if (readOnly) {
      return;
    }

    markUnsavedChanges();
    updateResponses((current) => {
      const previous = current.gifts.selections ?? [];
      const next = previous.includes(key) ? previous.filter((giftKey) => giftKey !== key) : [...previous, key];

      return {
        ...current,
        gifts: {
          ...current.gifts,
          selections: next
        }
      };
    });
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

  function handleNext() {
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
      setActiveSection(nextSection);
      return;
    }

    setScreen("final");
  }

  function openSectionDetails(section: SectionKey) {
    setDetailSection(section);
    setActiveSection(section);
    setSubmitMessage(null);
    setSubmitError(null);
  }

  function closeSectionDetails() {
    setDetailSection(null);
  }

  function handleDetailNext() {
    handleNext();
    setDetailSection(null);
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

      setResponses(payload.invite.responses);
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

  const showLookSwitch = activeSection === "dresscode" || activeSection === "plan";
  const showLookSwitchDetail = detailSection === "dresscode" || detailSection === "plan";

  if (detailSection) {
    return (
      <main className="sceneShell sceneShellDetail">
        <header className="sceneHeader sceneHeaderDetail">
          <div className="detailHeaderControls">
            <button className="closeButton" type="button" onClick={closeSectionDetails} aria-label="Закрыть">
              <CrossIcon className="closeIcon" />
            </button>
            <span className="detailSectionPill">{SECTION_TAB_LABELS[activeSection]}</span>
            {showLookSwitchDetail ? (
              <div className="lookSwitch" role="group" aria-label="Режим образа">
                <button
                  type="button"
                  className={`lookButton ${lookMode === "male" ? "active" : ""}`}
                  onClick={() => setLookMode("male")}
                >
                  male
                </button>
                <button
                  type="button"
                  className={`lookButton ${lookMode === "female" ? "active" : ""}`}
                  onClick={() => setLookMode("female")}
                >
                  female
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <section className="detailContent">
          <div className="sceneEditor">
            {activeSection === "dresscode" ? (
              <DresscodeSection lookMode={lookMode} onLookChange={setLookMode} />
            ) : null}
            {activeSection === "food" ? (
              <FoodSection
                readOnly={readOnly}
                responses={responses}
                onToggleSelection={toggleFoodSelection}
                onCommentChange={updateFoodComment}
              />
            ) : null}
            {activeSection === "gifts" ? (
              <GiftsSection readOnly={readOnly} responses={responses} onToggleSelection={toggleGiftSelection} />
            ) : null}
            {activeSection === "plan" ? <PlanSection lookMode={lookMode} onLookChange={setLookMode} /> : null}
          </div>
        </section>

        <div className="detailFooter">
          <button className="nextButton detailNextButton" type="button" onClick={handleDetailNext} disabled={readOnly}>
            next
          </button>
        </div>
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
        className={`heroStage stage-${activeSection} look-${lookMode}`}
        style={{ "--hero-logo-url": `url("${HERO_LOGO_URL}")` } as CSSProperties}
      >
        <button
          className="stagePropButton propLeft"
          type="button"
          onClick={() => handleStageImageClick(stageImages.left.section)}
          aria-label={`Открыть раздел ${SECTION_LABELS[stageImages.left.section]}`}
        >
          <img className="stagePropImage" src={stageImages.left.src} alt="" />
        </button>
        <button
          className="stagePropButton propCenter"
          type="button"
          onClick={() => handleStageImageClick(stageImages.center.section)}
          aria-label={`Открыть раздел ${SECTION_LABELS[stageImages.center.section]}`}
        >
          <img className="stagePropImage" src={stageImages.center.src} alt="" />
        </button>
        <button
          className="stagePropButton propRight"
          type="button"
          onClick={() => handleStageImageClick(stageImages.right.section)}
          aria-label={`Открыть раздел ${SECTION_LABELS[stageImages.right.section]}`}
        >
          <img className="stagePropImage" src={stageImages.right.src} alt="" />
        </button>
      </section>

      <div className="sceneToolbar sceneToolbarStage">
        {showLookSwitch ? (
          <div className="lookSwitch" role="group" aria-label="Режим образа">
            <button
              type="button"
              className={`lookButton ${lookMode === "male" ? "active" : ""}`}
              onClick={() => setLookMode("male")}
            >
              male
            </button>
            <button
              type="button"
              className={`lookButton ${lookMode === "female" ? "active" : ""}`}
              onClick={() => setLookMode("female")}
            >
              female
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
