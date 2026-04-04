import { getSectionImage } from "@/config/scene-assets";

const GALLERY_PLACEHOLDERS = ["one", "two", "three"];

interface DresscodeSectionProps {
  lookMode: "male" | "female";
}

export function DresscodeSection({ lookMode }: DresscodeSectionProps) {
  return (
    <article className="sectionDetail">
      <div className="sectionDetailLayout">
        <div className={`sectionHero look-${lookMode}`}>
          <img className="sectionHeroImage" src={getSectionImage("dresscode")} alt="" />
        </div>
        <div className="sectionGallery">
          {GALLERY_PLACEHOLDERS.map((key) => (
            <div key={key} className="galleryCard" aria-hidden="true" />
          ))}
        </div>
      </div>
    </article>
  );
}
