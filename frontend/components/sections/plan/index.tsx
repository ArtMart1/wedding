interface PlanSectionProps {
  onDownload?: () => void;
}

export function PlanSection({ onDownload }: PlanSectionProps) {
  return (
    <article className="sectionDetail dresscodeDetail planDetail">
      <div className="planViewer">
        <div className="detailTopHint hintAnchor detailCardHint detailCardHintPlan" aria-hidden="true" />
        <a
          className="dresscodeSlide isActive planDownloadCard hintAnchor detailCardHint detailCardHintPlan detailCardHintMobileOnly"
          href="/plan-day-placeholder.pdf"
          download="plan-day.pdf"
          onClick={onDownload}
        >
          <span className="planDownloadLabel">Отсканированное приглашение</span>
        </a>
      </div>
    </article>
  );
}
