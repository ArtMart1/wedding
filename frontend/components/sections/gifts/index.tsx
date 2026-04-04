import { GIFT_OPTIONS } from "@/config/options";
import { getSectionImage } from "@/config/scene-assets";
import type { InviteResponses } from "@/lib/types";

interface GiftsSectionProps {
  readOnly: boolean;
  responses: InviteResponses;
  onToggleSelection: (key: string) => void;
}

export function GiftsSection({ readOnly, responses, onToggleSelection }: GiftsSectionProps) {
  return (
    <article className="sectionDetail">
      <div className="sectionDetailLayout">
        <div className="sectionHero">
          <img className="sectionHeroImage" src={getSectionImage("gifts")} alt="" />
        </div>
        <div className="sectionGallery">
          <div className="galleryCard" aria-hidden="true" />
          <div className="galleryCard" aria-hidden="true" />
          <div className="galleryCard" aria-hidden="true" />
        </div>
      </div>
      <div className="sectionDetailContent">
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
                onClick={() => onToggleSelection(option.key)}
                disabled={readOnly}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </article>
  );
}
