export interface DeviationBannerPresentation {
	containerClassName: string;
	title: string;
	buttonClassName: string;
}

export function getDeviationBannerPresentation(isCancelled: boolean): DeviationBannerPresentation {
	if (isCancelled) {
		return {
			containerClassName: 'bg-red-500/10 text-red-600 dark:text-red-400',
			title: 'Afspraak vervallen',
			buttonClassName:
				'text-red-600 hover:text-red-700 hover:bg-red-500/20 dark:text-red-400 dark:hover:text-red-300',
		};
	}

	return {
		containerClassName: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
		title: 'Afwijkende afspraak',
		buttonClassName:
			'text-amber-600 hover:text-amber-700 hover:bg-amber-500/20 dark:text-amber-400 dark:hover:text-amber-300',
	};
}
