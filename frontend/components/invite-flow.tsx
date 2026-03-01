"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FOOD_OPTIONS, GIFT_OPTIONS } from "@/config/options";
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
  gifts: "Impact",
  plan: "plan"
};

const FOOD_CATEGORY_LABELS: Record<FoodCategoryKey, string> = {
  salad: "Салаты",
  appetizer: "Закуски",
  hot: "Горячее",
  drinks: "Напитки"
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
  const autoSubmitRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isAuthSubmitting }
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema)
  });

  const completedSectionsCount = useMemo(
    () => SECTION_ORDER.filter((section) => responses[section].acknowledged).length,
    [responses]
  );
  const attentionSection = useMemo(
    () => SECTION_ORDER.find((section) => !responses[section].acknowledged && needsAttention[section]),
    [needsAttention, responses]
  );

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
    setSubmitMessage(null);
    setSubmitError(null);
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
        <section className="authSection">
          <h1 className="logo">ily@olga</h1>
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

      <section className={`heroStage stage-${activeSection} look-${lookMode}`}>
        <h1 className="heroWordmark">ily@olga</h1>
        <div className="stageProp propLeft" />
        <div className="stageProp propCenter" />
        <div className="stageProp propRight" />
        {attentionSection ? (
          <div className="stageAlert" aria-label={`Требует заполнения: ${SECTION_LABELS[attentionSection]}`}>
            !
          </div>
        ) : null}
      </section>

      <div className="sceneToolbar">
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

        <span className="muted">Заполнено разделов: {completedSectionsCount} из {SECTION_ORDER.length}</span>

        <button className="nextButton sceneNextButton" type="button" onClick={handleNext} disabled={readOnly}>
          Next
        </button>
      </div>

      {attentionSection ? (
        <p className="sceneWarning">Вернитесь к разделу «{SECTION_LABELS[attentionSection]}» и нажмите Next.</p>
      ) : null}

      <section className="sceneEditor">
        {activeSection === "dresscode" ? (
          <article className="sectionCard sectionCardCompact">
            <h2>Дресс-код</h2>
            <p>Раздел без выбора. Нажмите Next после ознакомления.</p>
          </article>
        ) : null}

        {activeSection === "food" ? (
          <article className="sectionCard sectionCardCompact">
            <h2>Еда</h2>
            {Object.entries(FOOD_OPTIONS).map(([categoryKey, options]) => {
              const typedCategory = categoryKey as FoodCategoryKey;
              const selectedKeys = responses.food.selections?.[typedCategory] ?? [];
              return (
                <section key={categoryKey} className="foodCategory">
                  <h3>{FOOD_CATEGORY_LABELS[typedCategory]}</h3>
                  <div className="optionGrid">
                    {options.map((option) => {
                      const isSelected = selectedKeys.includes(option.key);
                      return (
                        <button
                          key={option.key}
                          type="button"
                          className={`optionButton ${isSelected ? "selected" : ""}`}
                          onClick={() => toggleFoodSelection(typedCategory, option.key)}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            <label className="commentLabel" htmlFor="food-comment">Комментарий</label>
            <textarea
              id="food-comment"
              className="commentInput"
              value={responses.food.comment ?? ""}
              onChange={(event) => updateFoodComment(event.target.value)}
              maxLength={400}
              placeholder="Укажите пожелания по еде"
            />
            <small className="muted">{(responses.food.comment ?? "").length}/400</small>
          </article>
        ) : null}

        {activeSection === "gifts" ? (
          <article className="sectionCard sectionCardCompact">
            <h2>Подарки</h2>
            <p>Можно выбрать несколько вариантов, можно не выбирать.</p>
            <div className="optionGrid">
              {GIFT_OPTIONS.map((option) => {
                const selected = (responses.gifts.selections ?? []).includes(option.key);
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={`optionButton ${selected ? "selected" : ""}`}
                    onClick={() => toggleGiftSelection(option.key)}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </article>
        ) : null}

        {activeSection === "plan" ? (
          <article className="sectionCard sectionCardCompact">
            <h2>План дня</h2>
            <ul className="timeline">
              <li>16:00 - Сбор гостей</li>
              <li>17:00 - Церемония</li>
              <li>18:00 - Ужин</li>
              <li>20:00 - Танцы</li>
            </ul>
          </article>
        ) : null}
      </section>
    </main>
  );
}
