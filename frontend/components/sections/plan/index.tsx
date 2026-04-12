interface PlanSectionProps {
  onDownload?: () => void;
}

export function PlanSection({ onDownload }: PlanSectionProps) {
  return (
    <article className="sectionDetail planDetail">
      <div className="planViewer">
        <a
          className="planInvitationCard"
          href="/assets/plan/invitation-plan.png"
          download="plan-day.png"
          onClick={onDownload}
          aria-label="Скачать приглашение с планом дня"
        >
          <img
            className="planInvitationBackground"
            src="/assets/plan/invitation-plan.png"
            alt=""
            aria-hidden="true"
            draggable="false"
          />

          <div className="planInvitationContent">
            <div className="planInvitationHero">
              <p className="planInvitationNames">Илья и Ольга</p>
              <p className="planInvitationLead">приглашают тебя на свадьбу</p>
            </div>

            <p className="planInvitationDate">30 мая 2026</p>

            <div className="planInvitationSchedule">
              <p className="planInvitationScheduleLine">
                <span className="planInvitationTime">13:45</span>
                <span className="planInvitationLocation">Читальня Пушкина</span>
              </p>

              <p className="planInvitationScheduleLine planInvitationScheduleLineStacked">
                <span className="planInvitationTime">16:00</span>
                <span className="planInvitationLocation">
                  Гранде френдс форевер
                  <br />
                  Остоженка 7
                </span>
              </p>
            </div>
          </div>
        </a>
      </div>
    </article>
  );
}
