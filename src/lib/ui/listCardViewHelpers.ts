export type ListCardView = 'loading' | 'empty' | 'list';

export function resolveListCardView(loading: boolean, itemCount: number): ListCardView {
	if (loading) return 'loading';
	if (itemCount === 0) return 'empty';
	return 'list';
}
