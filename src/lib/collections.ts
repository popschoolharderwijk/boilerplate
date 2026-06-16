/** Push value to map's array at key; creates array if missing. */
export function pushToMapArray<K, V>(map: Map<K, V[]>, key: K, value: V): void {
	const list = map.get(key);
	if (list) list.push(value);
	else map.set(key, [value]);
}

export function indexById<T extends { id: string }>(items: readonly T[]): Map<string, T> {
	return new Map(items.map((item) => [item.id, item]));
}

export function indexByUserId<T extends { user_id: string }>(items: readonly T[]): Map<string, T> {
	return new Map(items.map((item) => [item.user_id, item]));
}
