import { useCenteredSnapGallery } from "@/components/sections/shared/use-centered-snap-gallery";

export type DresscodeLookMode = "male" | "female";

export const DRESSCODE_LOOK_MODES: DresscodeLookMode[] = ["male", "female"];
export const DRESSCODE_SLIDE_COUNT = 3;
export const DRESSCODE_LAST_SLIDE_INDEX = DRESSCODE_SLIDE_COUNT - 1;

const DRESSCODE_PLACEHOLDERS: Record<DresscodeLookMode, string[]> = {
  male: ["Look 1", "Look 2", "Look 3"],
  female: ["Look 1", "Look 2", "Look 3"]
};

interface DresscodeSectionProps {
  lookMode: DresscodeLookMode;
  activeIndexByMode: Record<DresscodeLookMode, number>;
  onActiveIndexChange: (lookMode: DresscodeLookMode, index: number) => void;
}

export function DresscodeSection({ lookMode, activeIndexByMode, onActiveIndexChange }: DresscodeSectionProps) {
  const activeIndex = activeIndexByMode[lookMode];
  const { galleryRef, handleGalleryScroll, markUserIntent } = useCenteredSnapGallery({
    activeIndex,
    onActiveIndexChange: (index) => onActiveIndexChange(lookMode, index),
    syncKey: lookMode
  });

  return (
    <article className="sectionDetail dresscodeDetail">
      <div className="dresscodeViewer">
        <div className="detailTopHint hintAnchor detailCardHint detailCardHintDresscode" aria-hidden="true" />
        <div
          className="hintAnchor detailCardHint detailCardHintDresscode detailCardHintDresscodeMobileFloat"
          aria-hidden="true"
        />
        <div
          ref={galleryRef}
          className="dresscodeGallery"
          onScroll={handleGalleryScroll}
          onPointerDown={markUserIntent}
          onWheel={markUserIntent}
        >
          {DRESSCODE_PLACEHOLDERS[lookMode].map((label, index) => {
            const isActive = index === activeIndex;

            return (
              <div
                key={`${lookMode}-${label}`}
                className={`dresscodeSlide ${isActive ? "isActive" : ""} ${
                  index === 0 ? "hintAnchor detailCardHint detailCardHintDresscode detailCardHintMobileOnly" : ""
                }`}
                data-slide-index={index}
                aria-label={`${lookMode} ${index + 1}`}
              />
            );
          })}
        </div>
      </div>
    </article>
  );
}
