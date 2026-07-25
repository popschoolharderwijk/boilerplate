import { canSubmitOtp, type LoginState } from '@/lib/auth/loginHelpers';

interface LoginMagicLinkFormProps {
	email: string;
	state: LoginState;
	onEmailChange: (value: string) => void;
	onSubmit: (event: React.FormEvent) => void;
}

export function LoginMagicLinkForm({ email, state, onEmailChange, onSubmit }: LoginMagicLinkFormProps) {
	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<div>
				<label htmlFor="email" className="block text-sm font-medium mb-1">
					Email
				</label>
				<input
					id="email"
					type="email"
					value={email}
					onChange={(event) => onEmailChange(event.target.value)}
					placeholder="jouw@email.nl"
					required
					disabled={state === 'sending'}
					className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
				/>
			</div>
			<button
				type="submit"
				disabled={state === 'sending'}
				className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
			>
				{state === 'sending' ? 'Versturen...' : 'Verstuur Magic Link'}
			</button>
		</form>
	);
}

interface LoginOtpFormProps {
	email: string;
	otp: string;
	state: LoginState;
	onOtpChange: (value: string) => void;
	onSubmit: (event: React.FormEvent) => void;
	onReset: () => void;
}

export function LoginOtpForm({ email, otp, state, onOtpChange, onSubmit, onReset }: LoginOtpFormProps) {
	return (
		<div className="space-y-4">
			<div className="bg-accent border border-border px-4 py-3 rounded">
				<p className="font-medium text-foreground">Check je email!</p>
				<p className="text-sm mt-1 text-muted-foreground">
					Als het emailadres <strong className="text-foreground">{email}</strong> bij ons bekend is, ontvang
					je een magic link om in te loggen.
				</p>
				<p className="text-sm mt-1 text-muted-foreground">Klik op de link of voer de code hieronder in.</p>
			</div>

			<form onSubmit={onSubmit} className="space-y-4">
				<div>
					<label htmlFor="otp" className="block text-sm font-medium mb-1">
						Of voer de code in
					</label>
					<input
						id="otp"
						type="text"
						inputMode="numeric"
						pattern="[0-9]{6,8}"
						maxLength={8}
						value={otp}
						onChange={(event) => onOtpChange(event.target.value)}
						placeholder="00000000"
						disabled={state === 'verifying'}
						className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 text-center text-2xl tracking-widest"
					/>
				</div>
				<button
					type="submit"
					disabled={!canSubmitOtp(state, otp.length)}
					className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
				>
					{state === 'verifying' ? 'Verifiëren...' : 'Verifieer Code'}
				</button>
			</form>

			<button
				type="button"
				onClick={onReset}
				className="w-full py-2 px-4 text-muted-foreground hover:text-foreground"
			>
				← Ander emailadres gebruiken
			</button>
		</div>
	);
}
