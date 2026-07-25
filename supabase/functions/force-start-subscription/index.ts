// TEST-ONLY: Force a 'scheduled' subscription to start NOW in Stripe.
// Cancels the existing Stripe Subscription Schedule and creates a fresh
// Subscription that bills immediately on the existing customer + default
// payment method. The webhook updates the local 'subscriptions' row from
// 'scheduled' to 'active' once Stripe emits customer.subscription.created.
//
// Privileged staff/admin only.
import { serveLessonAgreementPost } from '../_shared/http-serve.ts';
import { handleForceStartSubscription } from './handler.ts';

serveLessonAgreementPost(handleForceStartSubscription);
