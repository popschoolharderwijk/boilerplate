import type { AgendaEventDeviationRow, AgendaEventRow } from '../../../src/types/agenda-events';
import type { LessonAgreementWithStudent } from '../../../src/types/lesson-agreements';

type AgendaEventDeviationWithEvent = AgendaEventDeviationRow & {
	agenda_event: AgendaEventRow;
};

export type LessonAppointmentDeviationWithAgreement = AgendaEventDeviationWithEvent & {
	lesson_agreement?: LessonAgreementWithStudent;
};
