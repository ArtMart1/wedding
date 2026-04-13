import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FOOD_OPTIONS } from "@/config/options";
import { FoodCommentIcon } from "@/components/icons/food-comment-icon";
import type { FoodCategoryKey, InviteResponses } from "@/lib/types";
import { useCenteredSnapGallery } from "@/components/sections/shared/use-centered-snap-gallery";
import { FoodRadioOffIcon, FoodRadioOnIcon } from "@/components/icons/food-radio-icons";

const FOOD_CATEGORY_LABELS: Record<FoodCategoryKey, string> = {
  salad: "Салат",
  hot: "Горячее",
  drinks: "Напиток"
};

const FOOD_CATEGORY_ORDER: FoodCategoryKey[] = ["salad", "hot", "drinks"];
const DEFAULT_FOOD_INDEX_MAP: Record<FoodCategoryKey, number> = {
  salad: 0,
  hot: 0,
  drinks: 0
};

const FOOD_WIDOW_WORDS = [
  "а",
  "без",
  "в",
  "во",
  "вне",
  "да",
  "для",
  "до",
  "за",
  "и",
  "из",
  "изо",
  "или",
  "к",
  "ко",
  "на",
  "над",
  "не",
  "но",
  "о",
  "об",
  "обо",
  "от",
  "по",
  "под",
  "при",
  "про",
  "с",
  "со",
  "у"
];

const FOOD_WIDOW_PATTERN = new RegExp(`(^|[\\s(])(${FOOD_WIDOW_WORDS.join("|")})\\s+(?=\\S)`, "giu");

function isFoodCategoryKey(value: unknown): value is FoodCategoryKey {
  return typeof value === "string" && FOOD_CATEGORY_ORDER.includes(value as FoodCategoryKey);
}

function keepFoodPrepositions(text: string): string {
  return text.replace(FOOD_WIDOW_PATTERN, (_match, prefix: string, word: string) => `${prefix}${word}\u00A0`);
}

interface FoodSectionProps {
  readOnly: boolean;
  responses: InviteResponses;
  activeCategory?: FoodCategoryKey;
  activeIndexByCategory?: Record<FoodCategoryKey, number>;
  showCommentHint?: boolean;
  showCommentSentBubble?: boolean;
  showTopHint?: boolean;
  openKey?: string | number;
  isCategorySwitching?: boolean;
  onCategoryChange: (category: FoodCategoryKey) => void;
  onActiveIndexChange: (index: number) => void;
  onToggleSelection: (category: FoodCategoryKey, key: string) => void;
  onCommentClick: () => void;
}

export function FoodSection({
  readOnly,
  responses,
  activeCategory,
  activeIndexByCategory,
  showCommentHint = false,
  showCommentSentBubble = false,
  showTopHint = false,
  openKey = 0,
  isCategorySwitching = false,
  onCategoryChange,
  onActiveIndexChange,
  onToggleSelection,
  onCommentClick
}: FoodSectionProps) {
  const [mobileBodyHeight, setMobileBodyHeight] = useState<number | null>(null);
  const bodyMeasureFrameRef = useRef<number | null>(null);
  const safeCategory = isFoodCategoryKey(activeCategory) ? activeCategory : "salad";
  const safeIndexByCategory =
    activeIndexByCategory &&
    typeof activeIndexByCategory === "object" &&
    !Array.isArray(activeIndexByCategory)
      ? { ...DEFAULT_FOOD_INDEX_MAP, ...activeIndexByCategory }
      : DEFAULT_FOOD_INDEX_MAP;
  const activeIndex = safeIndexByCategory[safeCategory] ?? 0;
  const activeSlides = FOOD_OPTIONS[safeCategory].map((option) => ({
    ...option,
    category: safeCategory
  }));
  const { galleryRef, handleGalleryScroll, markUserIntent } = useCenteredSnapGallery({
    activeIndex,
    onActiveIndexChange,
    syncKey: `${safeCategory}-${openKey}`,
    syncIndex: 0
  });
  const selectedKey = responses.food.selections?.[safeCategory]?.[0] ?? null;
  const sectionStyle =
    mobileBodyHeight !== null
      ? ({ "--food-mobile-body-height": `${mobileBodyHeight}px` } as CSSProperties)
      : undefined;

  useEffect(() => {
    const gallery = galleryRef.current;

    if (!gallery) {
      return;
    }

    const measureBodyHeight = () => {
      if (bodyMeasureFrameRef.current !== null) {
        window.cancelAnimationFrame(bodyMeasureFrameRef.current);
      }

      bodyMeasureFrameRef.current = window.requestAnimationFrame(() => {
        bodyMeasureFrameRef.current = null;

        const bodyNodes = Array.from(gallery.querySelectorAll<HTMLElement>(".foodSlideBody"));
        const nextHeight = bodyNodes.reduce((maxHeight, node) => {
          const nodeHeight = Math.ceil(node.getBoundingClientRect().height);
          return Math.max(maxHeight, nodeHeight);
        }, 0);

        setMobileBodyHeight((current) => (current === nextHeight ? current : nextHeight || null));
      });
    };

    measureBodyHeight();

    const resizeObserver = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measureBodyHeight) : null;
    const bodyNodes = Array.from(gallery.querySelectorAll<HTMLElement>(".foodSlideBody"));

    resizeObserver?.observe(gallery);
    bodyNodes.forEach((node) => resizeObserver?.observe(node));
    window.addEventListener("resize", measureBodyHeight);

    return () => {
      window.removeEventListener("resize", measureBodyHeight);
      resizeObserver?.disconnect();

      if (bodyMeasureFrameRef.current !== null) {
        window.cancelAnimationFrame(bodyMeasureFrameRef.current);
        bodyMeasureFrameRef.current = null;
      }
    };
  }, [galleryRef, openKey, safeCategory]);

  return (
    <article
      className={`sectionDetail choiceDetail foodDetail ${isCategorySwitching ? "isCategorySwitching" : ""}`}
      style={sectionStyle}
    >
      <div className="choiceToolbar foodToolbar">
        <div className="foodCategoryTabs" role="tablist" aria-label="Категории еды">
          {FOOD_CATEGORY_ORDER.map((category) => (
            <button
              key={category}
              type="button"
              role="tab"
              className={`foodCategoryTab ${safeCategory === category ? "active" : ""}`}
              aria-selected={safeCategory === category}
              onClick={() => onCategoryChange(category)}
            >
              <span>{FOOD_CATEGORY_LABELS[category]}</span>
            </button>
          ))}
        </div>

        <div className="foodCommentRail">
          <div className={`foodCommentButtonAnchor ${showCommentHint ? "hintAnchor" : ""}`}>
            <button className="foodCommentButton" type="button" onClick={onCommentClick} aria-label="Открыть комментарий">
              <FoodCommentIcon className="foodCommentButtonIcon" />
            </button>
            {showCommentSentBubble ? (
              <div className="foodCommentStatusBubble" role="status" aria-live="polite">
                <span className="foodCommentStatusBubbleText">Комментарий отправлен</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="choiceViewer foodViewer">
        <div
          ref={galleryRef}
          className="choiceGallery foodGallery"
          onScroll={handleGalleryScroll}
          onPointerDown={markUserIntent}
          onWheel={markUserIntent}
        >
          {activeSlides.map((slide, index) => {
            const isSelected = selectedKey === slide.key;
            const isActive = index === activeIndex;
            const isDimmed = Boolean(selectedKey) && !isSelected;
            const formattedTitle = keepFoodPrepositions(slide.title);
            const formattedDescription = slide.description ? keepFoodPrepositions(slide.description) : null;

            return (
              <button
                key={slide.key}
                type="button"
                className={`foodSlide ${slide.category === "drinks" ? "foodSlideDrinks" : ""} ${isActive ? "isActive" : ""} ${isSelected ? "isSelected" : ""} ${isDimmed ? "isDimmed" : ""}`}
                data-slide-index={index}
                data-food-category={slide.category}
                onClick={() => onToggleSelection(slide.category, slide.key)}
                disabled={readOnly}
                aria-pressed={isSelected}
                aria-label={slide.description ? `${slide.title}. ${slide.description}` : slide.title}
              >
                <div className="foodSlideInner">
                  <div
                    className={`foodSlideArtworkWrap ${
                      showTopHint && safeCategory === "salad" && index === 0
                        ? "hintAnchor detailCardHint detailCardHintFood"
                        : ""
                    }`}
                    aria-hidden="true"
                  >
                    <img className="foodSlideArtwork" src={slide.iconSrc} alt="" draggable="false" />
                  </div>

                  <div className="foodSlideBody">
                    <span className="foodSlideSelection" aria-hidden="true">
                      {isSelected ? (
                        <FoodRadioOnIcon className="foodSlideSelectionIcon" />
                      ) : (
                        <FoodRadioOffIcon className="foodSlideSelectionIcon" />
                      )}
                    </span>
                    <div className="foodSlideCopy">
                      <strong className="foodSlideLabel">{formattedTitle}</strong>
                      {formattedDescription ? <span className="foodSlideDescription">{formattedDescription}</span> : null}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
