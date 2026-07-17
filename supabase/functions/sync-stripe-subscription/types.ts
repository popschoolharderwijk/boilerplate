export interface Body {
	stripe_subscription_id?: string;
	lesson_agreement_id?: string;
}

export interface SubscriptionRow {
	stripe_subscription_id: string | null;
	stripe_schedule_id: string | null;
}
