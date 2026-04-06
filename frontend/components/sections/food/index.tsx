import { FoodCategoryTabIcon } from "@/components/icons/food-category-tab-icon";
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

function isFoodCategoryKey(value: unknown): value is FoodCategoryKey {
  return typeof value === "string" && FOOD_CATEGORY_ORDER.includes(value as FoodCategoryKey);
}

interface FoodSectionProps {
  readOnly: boolean;
  responses: InviteResponses;
  activeCategory?: FoodCategoryKey;
  activeIndexByCategory?: Record<FoodCategoryKey, number>;
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
  openKey = 0,
  isCategorySwitching = false,
  onCategoryChange,
  onActiveIndexChange,
  onToggleSelection,
  onCommentClick
}: FoodSectionProps) {
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
  const { galleryRef, handleGalleryScroll } = useCenteredSnapGallery({
    activeIndex,
    onActiveIndexChange,
    syncKey: `${safeCategory}-${openKey}`
  });
  const selectedKey = responses.food.selections?.[safeCategory]?.[0] ?? null;

  return (
    <article className={`sectionDetail foodDetail ${isCategorySwitching ? "isCategorySwitching" : ""}`}>
      <div className="foodToolbar">
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
              {safeCategory !== category ? <FoodCategoryTabIcon className="foodCategoryTabMarker" aria-hidden="true" /> : null}
              <span>{FOOD_CATEGORY_LABELS[category]}</span>
            </button>
          ))}
        </div>

        <div className="foodCommentButtonAnchor hintAnchor">
          <button className="foodCommentButton" type="button" onClick={onCommentClick} aria-label="Открыть комментарий">
            <FoodCommentIcon className="foodCommentButtonIcon" />
          </button>
        </div>
      </div>

      <div className="foodViewer">
        <div ref={galleryRef} className="foodGallery" onScroll={handleGalleryScroll}>
          {activeSlides.map((slide, index) => {
            const isSelected = selectedKey === slide.key;
            const isActive = index === activeIndex;
            const isDimmed = Boolean(selectedKey) && !isSelected;

            return (
              <button
                key={slide.key}
                type="button"
                className={`foodSlide ${isActive ? "isActive" : ""} ${isSelected ? "isSelected" : ""} ${isDimmed ? "isDimmed" : ""}`}
                data-slide-index={index}
                onClick={() => onToggleSelection(slide.category, slide.key)}
                disabled={readOnly}
                aria-pressed={isSelected}
                aria-label={slide.description ? `${slide.title}. ${slide.description}` : slide.title}
              >
                <div className="foodSlideInner">
                  <div className="foodSlideArtworkWrap" aria-hidden="true">
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
                      <strong className="foodSlideLabel">{slide.title}</strong>
                      {slide.description ? <span className="foodSlideDescription">{slide.description}</span> : null}
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
