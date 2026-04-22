import { inflectFirstNameToAccusative } from "@/lib/russian-name-cases";

interface PlanSectionProps {
  inviteeFirstName?: string | null;
}

export function PlanSection({ inviteeFirstName }: PlanSectionProps) {
  const normalizedFirstName = inviteeFirstName?.trim() ?? "";
  const inviteeFirstNameInAccusative = normalizedFirstName
    ? inflectFirstNameToAccusative(normalizedFirstName)
    : null;
  const inviteeTarget = inviteeFirstNameInAccusative ?? "тебя";

  return (
    <article className="sectionDetail planDetail">
      <div className="planViewer">
        <div className="planInvitationCard" aria-label="План дня">
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
              <p className="planInvitationLead">
                {`приглашают ${inviteeTarget}`}
                <br />
                на свадьбу
              </p>
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
        </div>
      </div>
    </article>
  );
}
