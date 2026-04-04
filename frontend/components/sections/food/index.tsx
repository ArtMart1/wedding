import { FOOD_OPTIONS } from "@/config/options";
import { getSectionImage } from "@/config/scene-assets";
import type { FoodCategoryKey, InviteResponses } from "@/lib/types";

const FOOD_CATEGORY_LABELS: Record<FoodCategoryKey, string> = {
  salad: "Салаты",
  appetizer: "Закуски",
  hot: "Горячее",
  drinks: "Напитки"
};

interface FoodSectionProps {
  readOnly: boolean;
  responses: InviteResponses;
  onToggleSelection: (category: FoodCategoryKey, key: string) => void;
  onCommentChange: (value: string) => void;
}

export function FoodSection({ readOnly, responses, onToggleSelection, onCommentChange }: FoodSectionProps) {
  return (
    <article className="sectionDetail">
      <div className="sectionDetailLayout">
        <div className="sectionHero">
          <img className="sectionHeroImage" src={getSectionImage("food")} alt="" />
        </div>
        <div className="sectionGallery">
          <div className="galleryCard" aria-hidden="true" />
          <div className="galleryCard" aria-hidden="true" />
          <div className="galleryCard" aria-hidden="true" />
        </div>
      </div>
      <div className="sectionDetailContent">
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
                      onClick={() => onToggleSelection(typedCategory, option.key)}
                      disabled={readOnly}
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
          onChange={(event) => onCommentChange(event.target.value)}
          maxLength={400}
          placeholder="Укажите пожелания по еде"
          disabled={readOnly}
        />
        <small className="muted">{(responses.food.comment ?? "").length}/400</small>
      </div>
    </article>
  );
}
