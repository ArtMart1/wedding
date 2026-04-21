import { GIFT_OPTIONS } from "@/config/options";
import type { InviteResponses } from "@/lib/types";
import { useCenteredSnapGallery } from "@/components/sections/shared/use-centered-snap-gallery";
import { FoodRadioOffIcon, FoodRadioOnIcon } from "@/components/icons/food-radio-icons";

interface GiftsSectionProps {
  readOnly: boolean;
  responses: InviteResponses;
  activeIndex: number;
  openKey?: string | number;
  onActiveIndexChange: (index: number) => void;
  onToggleSelection: (key: string) => void;
}

export function GiftsSection({
  readOnly,
  responses,
  activeIndex,
  openKey = 0,
  onActiveIndexChange,
  onToggleSelection
}: GiftsSectionProps) {
  const { galleryRef, handleGalleryScroll, handleGalleryWheel, markUserIntent } = useCenteredSnapGallery({
    activeIndex,
    onActiveIndexChange,
    syncKey: `gifts-${openKey}`,
    syncIndex: 0
  });
  const selectedKey = responses.gifts.selections?.[0] ?? null;

  return (
    <article className="sectionDetail choiceDetail foodDetail giftsDetail">
      <div className="choiceViewer foodViewer">
        <div
          ref={galleryRef}
          className="choiceGallery foodGallery giftsGallery"
          onScroll={handleGalleryScroll}
          onPointerDown={markUserIntent}
          onWheel={handleGalleryWheel}
        >
          {GIFT_OPTIONS.map((slide, index) => {
            const isSelected = selectedKey === slide.key;
            const isActive = index === activeIndex;
            const isDimmed = Boolean(selectedKey) && !isSelected;

            return (
              <button
                key={slide.key}
                type="button"
                className={`foodSlide giftSlide ${isActive ? "isActive" : ""} ${isSelected ? "isSelected" : ""} ${isDimmed ? "isDimmed" : ""}`}
                data-slide-index={index}
                onClick={() => onToggleSelection(slide.key)}
                disabled={readOnly}
                aria-pressed={isSelected}
                aria-label={slide.description ? `${slide.title}. ${slide.description}` : slide.title}
              >
                <div className="foodSlideInner">
                  <div
                    className={`foodSlideArtworkWrap ${
                      index === 0 ? "hintAnchor detailCardHint detailCardHintGifts" : ""
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
