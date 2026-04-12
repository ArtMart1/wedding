import Image from "next/image";
import { useCenteredSnapGallery } from "@/components/sections/shared/use-centered-snap-gallery";

export type DresscodeLookMode = "male" | "female";

export const DRESSCODE_LOOK_MODES: DresscodeLookMode[] = ["male", "female"];

interface DresscodeLook {
  src: string;
  alt: string;
  focusPosition: string;
}

export const DRESSCODE_LOOKS: Record<DresscodeLookMode, DresscodeLook[]> = {
  male: [
    { src: "/assets/dresscode/male/IMG_0749.jpg", alt: "Мужской образ 1", focusPosition: "50% 8%" },
    { src: "/assets/dresscode/male/IMG_0750.jpg", alt: "Мужской образ 2", focusPosition: "50% 26%" },
    { src: "/assets/dresscode/male/IMG_0762.jpg", alt: "Мужской образ 3", focusPosition: "52% 28%" },
    { src: "/assets/dresscode/male/IMG_0763.jpg", alt: "Мужской образ 4", focusPosition: "50% 43%" },
    { src: "/assets/dresscode/male/IMG_0764.jpg", alt: "Мужской образ 5", focusPosition: "50% 8%" },
    { src: "/assets/dresscode/male/IMG_0765.jpg", alt: "Мужской образ 6", focusPosition: "60% 63%" },
    { src: "/assets/dresscode/male/IMG_0766.jpg", alt: "Мужской образ 7", focusPosition: "50% 8%" },
    { src: "/assets/dresscode/male/IMG_2234.jpg", alt: "Мужской образ 8", focusPosition: "50% 13%" },
    { src: "/assets/dresscode/male/IMG_2236.jpg", alt: "Мужской образ 9", focusPosition: "50% 18%" },
    { src: "/assets/dresscode/male/IMG_2288.jpg", alt: "Мужской образ 10", focusPosition: "47% 85%" },
    { src: "/assets/dresscode/male/IMG_2290.jpg", alt: "Мужской образ 11", focusPosition: "50% 18%" },
    { src: "/assets/dresscode/male/IMG_2292.jpg", alt: "Мужской образ 12", focusPosition: "50% 48%" },
    { src: "/assets/dresscode/male/IMG_2293.jpg", alt: "Мужской образ 13", focusPosition: "50% 33%" }
  ],
  female: [
    { src: "/assets/dresscode/female/IMG_0732.jpg", alt: "Женский образ 1", focusPosition: "38% 26%" },
    { src: "/assets/dresscode/female/IMG_0736.jpg", alt: "Женский образ 2", focusPosition: "50% 85%" },
    { src: "/assets/dresscode/female/IMG_0737.jpg", alt: "Женский образ 3", focusPosition: "62% 85%" },
    { src: "/assets/dresscode/female/IMG_0738.jpg", alt: "Женский образ 4", focusPosition: "50% 34%" },
    { src: "/assets/dresscode/female/IMG_0741.jpg", alt: "Женский образ 5", focusPosition: "52% 43%" },
    { src: "/assets/dresscode/female/IMG_0742.jpg", alt: "Женский образ 6", focusPosition: "58% 65%" },
    { src: "/assets/dresscode/female/IMG_0743.jpg", alt: "Женский образ 7", focusPosition: "45% 100%" },
    { src: "/assets/dresscode/female/IMG_2242.jpg", alt: "Женский образ 8", focusPosition: "37% 28%" },
    { src: "/assets/dresscode/female/IMG_2243.jpg", alt: "Женский образ 9", focusPosition: "52% 36%" },
    { src: "/assets/dresscode/female/IMG_2248.jpg", alt: "Женский образ 10", focusPosition: "50% 72%" },
    { src: "/assets/dresscode/female/IMG_2249.jpg", alt: "Женский образ 11", focusPosition: "50% 57%" },
    { src: "/assets/dresscode/female/IMG_2250.jpg", alt: "Женский образ 12", focusPosition: "50% 62%" },
    { src: "/assets/dresscode/female/IMG_9725.jpg", alt: "Женский образ 13", focusPosition: "67% 68%" },
    { src: "/assets/dresscode/female/IMG_2247.jpg", alt: "Женский образ 14", focusPosition: "52% 22%" }
  ]
};

export function getDresscodeLastSlideIndex(lookMode: DresscodeLookMode): number {
  return Math.max(DRESSCODE_LOOKS[lookMode].length - 1, 0);
}

export function isDresscodeModeComplete(lookMode: DresscodeLookMode, viewedIndex: number): boolean {
  return viewedIndex >= getDresscodeLastSlideIndex(lookMode);
}

export function isDresscodeProgressComplete(viewedByMode: Record<DresscodeLookMode, number>): boolean {
  return DRESSCODE_LOOK_MODES.some((mode) => isDresscodeModeComplete(mode, viewedByMode[mode]));
}

interface DresscodeSectionProps {
  lookMode: DresscodeLookMode;
  activeIndexByMode: Record<DresscodeLookMode, number>;
  onActiveIndexChange: (lookMode: DresscodeLookMode, index: number) => void;
}

export function DresscodeSection({ lookMode, activeIndexByMode, onActiveIndexChange }: DresscodeSectionProps) {
  const activeIndex = activeIndexByMode[lookMode];
  const looks = DRESSCODE_LOOKS[lookMode];
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
          {looks.map((look, index) => {
            const isActive = index === activeIndex;

            return (
              <div
                key={`${lookMode}-${look.src}`}
                className={`dresscodeSlide ${isActive ? "isActive" : ""} ${
                  index === 0 ? "hintAnchor detailCardHint detailCardHintDresscode detailCardHintMobileOnly" : ""
                }`}
                data-slide-index={index}
                aria-label={look.alt}
              >
                <div className="dresscodeSlideMedia">
                  <Image
                    src={look.src}
                    alt={look.alt}
                    fill
                    sizes="(max-width: 680px) 82vw, 702px"
                    className="dresscodeSlideImage"
                    style={{ objectPosition: look.focusPosition }}
                    priority={index < 2}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
