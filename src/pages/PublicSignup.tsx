import { type FormEvent, useEffect, useState } from 'react';
import { LuCheck, LuMusic } from 'react-icons/lu';
import { LessonTypeOptionSelect, type OptionSnapshot } from '@/components/lesson-type-options/LessonTypeOptionSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { formatIban, isValidIban, normalizeIban } from '@/lib/incasso/iban';
import { frequencyLabels } from '@/lib/frequencies';
import type { LessonTypeOptionRow } from '@/types/lesson-agreements';

interface LessonType {
	id: string;
	name: string;
	icon: string;
	color: string;
	is_group_lesson: boolean;
}

interface GroupOption {
	id: string;
	name: string;
	day_of_week: number;
	start_time: string;
	duration_minutes: number;
	frequency: string;
	price_per_lesson: number;
	teacher_name: string | null;
	members_count: number;
}

const DAY_LABELS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

type Step = 1 | 2 | 3 | 4;

export default function PublicSignup() {
	const [step, setStep] = useState<Step>(1);
	const [lessonTypes, setLessonTypes] = useState<LessonType[]>([]);
	const [selectedType, setSelectedType] = useState<LessonType | null>(null);
	const [groups, setGroups] = useState<GroupOption[]>([]);
	const [selectedGroupId, setSelectedGroupId] = useState<string | 'waitlist' | null>(null);
	const [lessonTypeOptions, setLessonTypeOptions] = useState<LessonTypeOptionRow[]>([]);
	const [selectedOption, setSelectedOption] = useState<OptionSnapshot | null>(null);

	const [form, setForm] = useState({
		first_name: '',
		last_name: '',
		email: '',
		phone_number: '',
		date_of_birth: '',
		parent_name: '',
		parent_email: '',
		parent_phone_number: '',
		notes: '',
	});

	const [sepaEnabled, setSepaEnabled] = useState(false);
	const [sepaIban, setSepaIban] = useState('');
	const [sepaHolder, setSepaHolder] = useState('');
	const [sepaBic, setSepaBic] = useState('');
	const [sepaConsent, setSepaConsent] = useState(false);


	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);

	useEffect(() => {
		supabase
			.from('lesson_types')
			.select('id, name, icon, color, is_group_lesson')
			.eq('is_active', true)
			.order('name')
			.then(({ data }) => setLessonTypes(data ?? []));
	}, []);

	useEffect(() => {
		if (!selectedType?.is_group_lesson) {
			setGroups([]);
			return;
		}
		(async () => {
			const { data: lg } = await supabase
				.from('lesson_groups')
				.select(
					'id, name, day_of_week, start_time, duration_minutes, frequency, price_per_lesson, teacher_user_id',
				)
				.eq('lesson_type_id', selectedType.id)
				.eq('is_active', true);
			if (!lg?.length) {
				setGroups([]);
				return;
			}
			const teacherIds = [...new Set(lg.map((g) => g.teacher_user_id))];
			const groupIds = lg.map((g) => g.id);
			const [{ data: profiles }, { data: members }] = await Promise.all([
				supabase.from('profiles').select('user_id, first_name, last_name').in('user_id', teacherIds),
				supabase
					.from('lesson_group_members')
					.select('lesson_group_id')
					.in('lesson_group_id', groupIds)
					.is('left_date', null),
			]);
			const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) ?? []);
			const counts = new Map<string, number>();
			for (const m of members ?? []) counts.set(m.lesson_group_id, (counts.get(m.lesson_group_id) ?? 0) + 1);
			setGroups(
				lg.map((g) => {
					const p = profileMap.get(g.teacher_user_id);
					return {
						id: g.id,
						name: g.name,
						day_of_week: g.day_of_week,
						start_time: g.start_time,
						duration_minutes: g.duration_minutes,
						frequency: g.frequency,
						price_per_lesson: g.price_per_lesson,
						teacher_name: p ? [p.first_name, p.last_name].filter(Boolean).join(' ') : null,
						members_count: counts.get(g.id) ?? 0,
					};
				}),
			);
		})();
	}, [selectedType]);

	useEffect(() => {
		if (!selectedType || selectedType.is_group_lesson) {
			setLessonTypeOptions([]);
			return;
		}
		supabase
			.from('lesson_type_options')
			.select('id, duration_minutes, frequency, price_per_lesson')
			.eq('lesson_type_id', selectedType.id)
			.order('duration_minutes')
			.order('frequency')
			.then(({ data }) => setLessonTypeOptions((data ?? []) as LessonTypeOptionRow[]));
	}, [selectedType]);

	const submit = async (e: FormEvent) => {
		e.preventDefault();
		if (!selectedType) return;
		if (sepaEnabled) {
			if (!isValidIban(sepaIban)) {
				setError('Ongeldig IBAN');
				return;
			}
			if (!sepaHolder.trim()) {
				setError('Vul de rekeninghouder in');
				return;
			}
			if (!sepaConsent) {
				setError('Bevestig de SEPA-machtiging om door te gaan');
				return;
			}
		}
		setSubmitting(true);
		setError(null);
		const groupId = selectedType.is_group_lesson && selectedGroupId !== 'waitlist' ? selectedGroupId : null;
		const optionId =
			!selectedType.is_group_lesson && selectedOption
				? (lessonTypeOptions.find(
						(o) =>
							o.duration_minutes === selectedOption.duration_minutes &&
							o.frequency === selectedOption.frequency &&
							o.price_per_lesson === selectedOption.price_per_lesson,
					)?.id ?? null)
				: null;
		const { data, error } = await supabase.functions.invoke('submit-signup-request', {
			body: {
				lesson_type_id: selectedType.id,
				lesson_group_id: groupId,
				lesson_type_option_id: optionId,
				...form,
				sepa_iban: sepaEnabled ? normalizeIban(sepaIban) : null,
				sepa_account_holder: sepaEnabled ? sepaHolder.trim() : null,
				sepa_bic: sepaEnabled && sepaBic.trim() ? sepaBic.trim().toUpperCase() : null,
			},
		});
		setSubmitting(false);
		if (error) {
			let msg = error.message ?? 'Er ging iets mis';
			const ctx = (error as { context?: { json?: () => Promise<{ error?: string }> } }).context;
			if (ctx?.json) {
				try {
					const body = await ctx.json();
					if (body?.error) msg = body.error;
				} catch {
					// ignore
				}
			}
			setError(msg);
			return;
		}
		if (data && (data as { error?: string }).error) {
			setError((data as { error?: string }).error ?? 'Er ging iets mis');
			return;
		}
		setDone(true);
		setStep(4);
	};

	if (done) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4 bg-background">
				<div className="max-w-md w-full text-center space-y-4 rounded-lg border bg-card p-8">
					<div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
						<LuCheck className="h-6 w-6 text-primary" />
					</div>
					<h1 className="text-2xl font-bold">Bedankt voor je aanmelding!</h1>
					<p className="text-muted-foreground">
						We nemen zo snel mogelijk contact op via {form.email} om de aanmelding te bevestigen.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background py-8 px-4">
			<div className="max-w-2xl mx-auto">
				<header className="text-center mb-8">
					<div className="inline-flex items-center gap-2 mb-3">
						<div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
							<LuMusic className="h-5 w-5" />
						</div>
						<span className="text-xl font-bold">
							<span className="text-primary uppercase">POP</span>
							<span className="lowercase">school Harderwijk</span>
						</span>
					</div>
					<h1 className="text-3xl font-bold">Aanmelden voor lessen</h1>
					<p className="text-muted-foreground mt-2">Stap {step} van 3</p>
					<p className="sr-only">
						{selectedType?.is_group_lesson ? 'Groepsles aanmelding' : 'Individuele les aanmelding'}
					</p>
				</header>

				<div className="rounded-lg border bg-card p-6">
					{step === 1 && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">Welke les wil je volgen?</h2>
							<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
								{lessonTypes.map((lt) => (
									<button
										type="button"
										key={lt.id}
										onClick={() => {
											setSelectedType(lt);
											setSelectedGroupId(null);
											setSelectedOption(null);
										}}
										className={`p-4 rounded-lg border-2 text-left transition ${
											selectedType?.id === lt.id
												? 'border-primary bg-primary/5'
												: 'border-border hover:border-primary/50'
										}`}
									>
										<div className="font-medium">{lt.name}</div>
										{lt.is_group_lesson && (
											<div className="text-xs text-muted-foreground mt-1">Groepsles</div>
										)}
									</button>
								))}
							</div>
							<div className="flex justify-end pt-4">
								<Button disabled={!selectedType} onClick={() => setStep(2)}>
									Volgende
								</Button>
							</div>
						</div>
					)}

					{step === 2 && selectedType && (
						<div className="space-y-4">
							<h2 className="text-lg font-semibold">
								{selectedType.is_group_lesson ? 'Kies een groep' : 'Kies hoe vaak en hoe lang'}
							</h2>
							{selectedType.is_group_lesson ? (
								<div className="space-y-2">
									{groups.length === 0 && (
										<p className="text-sm text-muted-foreground">
											Geen actieve groepen beschikbaar.
										</p>
									)}
									{groups.map((g) => (
										<button
											type="button"
											key={g.id}
											onClick={() => setSelectedGroupId(g.id)}
											className={`w-full p-4 rounded-lg border-2 text-left transition ${
												selectedGroupId === g.id
													? 'border-primary bg-primary/5'
													: 'border-border hover:border-primary/50'
											}`}
										>
											<div className="font-medium">{g.name}</div>
											<div className="text-sm text-muted-foreground mt-1">
												{DAY_LABELS[g.day_of_week]} {g.start_time.slice(0, 5)} ·{' '}
												{g.duration_minutes} min ·{' '}
												{frequencyLabels[g.frequency as keyof typeof frequencyLabels] ??
													g.frequency}
											</div>
											<div className="text-sm text-muted-foreground">
												{g.teacher_name ? `Docent: ${g.teacher_name}` : ''} · {g.members_count}{' '}
												deelnemers · €{Number(g.price_per_lesson).toFixed(2)} per les
											</div>
										</button>
									))}
									<button
										type="button"
										onClick={() => setSelectedGroupId('waitlist')}
										className={`w-full p-4 rounded-lg border-2 border-dashed text-left transition ${
											selectedGroupId === 'waitlist'
												? 'border-primary bg-primary/5'
												: 'border-border hover:border-primary/50'
										}`}
									>
										<div className="font-medium">Zet me op de wachtlijst</div>
										<div className="text-sm text-muted-foreground">
											We nemen contact op zodra een plek beschikbaar is.
										</div>
									</button>
								</div>
							) : (
								<div className="space-y-4">
									<p className="text-sm text-muted-foreground">
										Je meldt je aan voor individuele {selectedType.name}-les. Kies hieronder hoe
										vaak en hoe lang je per les wilt komen. De prijs per les wordt direct getoond.
									</p>
									{lessonTypeOptions.length === 0 ? (
										<p className="text-sm text-muted-foreground">
											Er zijn nog geen opties ingesteld voor deze les. Vul je gegevens in op de
											volgende stap; we nemen contact op om de details af te stemmen.
										</p>
									) : (
										<div className="space-y-2">
											<Label>Duur, frequentie en prijs</Label>
											<LessonTypeOptionSelect
												options={lessonTypeOptions}
												value={selectedOption}
												onChange={setSelectedOption}
											/>
										</div>
									)}
								</div>
							)}
							<div className="flex justify-between pt-4">
								<Button variant="outline" onClick={() => setStep(1)}>
									Vorige
								</Button>
								<Button
									disabled={
										selectedType.is_group_lesson
											? !selectedGroupId
											: lessonTypeOptions.length > 0 && !selectedOption
									}
									onClick={() => setStep(3)}
								>
									Volgende
								</Button>
							</div>
						</div>
					)}

					{step === 3 && (
						<form className="space-y-4" onSubmit={submit}>
							<h2 className="text-lg font-semibold">Jouw gegevens</h2>
							{error && (
								<div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded text-sm">
									{error}
								</div>
							)}
							<div className="grid grid-cols-2 gap-3">
								<Field
									label="Voornaam *"
									value={form.first_name}
									onChange={(v) => setForm({ ...form, first_name: v })}
									required
								/>
								<Field
									label="Achternaam *"
									value={form.last_name}
									onChange={(v) => setForm({ ...form, last_name: v })}
									required
								/>
							</div>
							<Field
								label="E-mail *"
								type="email"
								value={form.email}
								onChange={(v) => setForm({ ...form, email: v })}
								required
							/>
							<Field
								label="Telefoonnummer"
								value={form.phone_number}
								onChange={(v) => setForm({ ...form, phone_number: v })}
							/>
							<Field
								label="Geboortedatum"
								type="date"
								value={form.date_of_birth}
								onChange={(v) => setForm({ ...form, date_of_birth: v })}
							/>
							<div className="border-t pt-4 space-y-3">
								<p className="text-sm font-medium">Ouder/verzorger (indien minderjarig)</p>
								<Field
									label="Naam ouder"
									value={form.parent_name}
									onChange={(v) => setForm({ ...form, parent_name: v })}
								/>
								<Field
									label="E-mail ouder"
									type="email"
									value={form.parent_email}
									onChange={(v) => setForm({ ...form, parent_email: v })}
								/>
								<Field
									label="Telefoon ouder"
									value={form.parent_phone_number}
									onChange={(v) => setForm({ ...form, parent_phone_number: v })}
								/>
							</div>
							<div className="border-t pt-4 space-y-3">
								<label className="flex items-start gap-2 cursor-pointer">
									<input
										type="checkbox"
										className="mt-1"
										checked={sepaEnabled}
										onChange={(e) => setSepaEnabled(e.target.checked)}
									/>
									<span className="text-sm">
										<span className="font-medium">Betalen via automatische incasso (SEPA)</span>
										<span className="block text-muted-foreground">
											Vul hieronder je bankgegevens in. We rekenen pas af na bevestiging van de
											aanmelding.
										</span>
									</span>
								</label>
								{sepaEnabled && (
									<div className="space-y-3 pl-6">
										<div>
											<Label>IBAN *</Label>
											<Input
												className="mt-1 font-mono"
												value={sepaIban}
												onChange={(e) => setSepaIban(e.target.value)}
												onBlur={() => setSepaIban(formatIban(sepaIban))}
												placeholder="NL00 BANK 0123 4567 89"
												required={sepaEnabled}
											/>
										</div>
										<Field
											label="Rekeninghouder *"
											value={sepaHolder}
											onChange={setSepaHolder}
											required={sepaEnabled}
										/>
										<Field
											label="BIC (optioneel)"
											value={sepaBic}
											onChange={setSepaBic}
										/>
										<label className="flex items-start gap-2 cursor-pointer">
											<input
												type="checkbox"
												className="mt-1"
												checked={sepaConsent}
												onChange={(e) => setSepaConsent(e.target.checked)}
											/>
											<span className="text-xs text-muted-foreground">
												Door ondertekening van dit machtigingsformulier geef ik toestemming
												aan POPschool Harderwijk om doorlopend incasso-opdrachten naar mijn
												bank te sturen om een bedrag van mijn rekening af te schrijven
												wegens lesgeld, en aan mijn bank om doorlopend een bedrag van mijn
												rekening af te schrijven overeenkomstig die opdracht.
											</span>
										</label>
									</div>
								)}
							</div>
							<div>
								<Label htmlFor="notes">Opmerkingen</Label>
								<textarea
									id="notes"
									className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm"
									rows={3}
									value={form.notes}
									onChange={(e) => setForm({ ...form, notes: e.target.value })}
								/>
							</div>
							<div className="flex justify-between pt-4">
								<Button type="button" variant="outline" onClick={() => setStep(2)}>
									Vorige
								</Button>
								<Button type="submit" disabled={submitting}>
									{submitting ? 'Versturen...' : 'Aanmelden'}
								</Button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}

function Field({
	label,
	value,
	onChange,
	type = 'text',
	required,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
	type?: string;
	required?: boolean;
}) {
	return (
		<div>
			<Label>{label}</Label>
			<Input
				className="mt-1"
				type={type}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				required={required}
			/>
		</div>
	);
}
