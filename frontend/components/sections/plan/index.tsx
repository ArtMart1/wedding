import { getSectionImage } from "@/config/scene-assets";

const GALLERY_PLACEHOLDERS = ["one", "two", "three"];

export function PlanSection() {
  return (
    <article className="sectionDetail">
      <div className="sectionDetailLayout">
        <div className="sectionHero">
          <img className="sectionHeroImage" src={getSectionImage("plan")} alt="" />
        </div>
        <div className="sectionGallery">
          {GALLERY_PLACEHOLDERS.map((key) => (
            <div key={key} className="galleryCard" aria-hidden="true" />
          ))}
        </div>
      </div>
      <div className="sectionDetailContent">
        <h2>План дня</h2>
        <ul className="timeline">
          <li>16:00 - Сбор гостей</li>
          <li>17:00 - Церемония</li>
          <li>18:00 - Ужин</li>
          <li>20:00 - Танцы</li>
        </ul>
      </div>
    </article>
  );
}
