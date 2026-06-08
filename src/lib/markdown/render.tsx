import type { JSX, ReactNode } from 'react';

/**
 * Minimalistische, veilige markdown renderer voor nieuwsberichten.
 * Ondersteunt: paragrafen, regelafbrekingen, **bold**, *italic*, `code`,
 * [tekst](url), ![alt](url), ongeordende lijsten (- of *), kop niveaus # tot ###.
 *
 * Onbekende HTML wordt nooit gerenderd — we werken puur op tekst en bouwen JSX,
 * zodat XSS niet mogelijk is via raw HTML.
 */

const URL_PATTERN = /^https?:\/\/[^\s)]+$/i;

function safeHref(url: string): string | null {
	if (!URL_PATTERN.test(url)) return null;
	return url;
}

/** Inline parser: bold, italic, code, links, images. */
function parseInline(text: string, keyPrefix: string): ReactNode[] {
	const nodes: ReactNode[] = [];
	let cursor = 0;
	let counter = 0;

	// Combined regex; we process tokens left-to-right.
	const pattern =
		/!\[([^\]]*)\]\(([^)\s]+)\)|\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`\n]+)`/g;

	let match = pattern.exec(text);
	while (match !== null) {
		if (match.index > cursor) {
			nodes.push(text.slice(cursor, match.index));
		}
		const key = `${keyPrefix}-i-${counter++}`;
		if (match[2] !== undefined) {
			// image
			const href = safeHref(match[2]);
			if (href) {
				nodes.push(
					<img
						key={key}
						src={href}
						alt={match[1] ?? ''}
						className="my-2 max-w-full rounded-md border border-border"
						loading="lazy"
					/>,
				);
			}
		} else if (match[4] !== undefined) {
			// link
			const href = safeHref(match[4]);
			if (href) {
				nodes.push(
					<a
						key={key}
						href={href}
						target="_blank"
						rel="noopener noreferrer"
						className="text-primary underline underline-offset-2 hover:no-underline"
					>
						{match[3]}
					</a>,
				);
			} else {
				nodes.push(match[3]);
			}
		} else if (match[5] !== undefined) {
			nodes.push(<strong key={key}>{match[5]}</strong>);
		} else if (match[6] !== undefined) {
			nodes.push(<em key={key}>{match[6]}</em>);
		} else if (match[7] !== undefined) {
			nodes.push(
				<code key={key} className="rounded bg-muted px-1 py-0.5 text-xs">
					{match[7]}
				</code>,
			);
		}
		cursor = match.index + match[0].length;
		match = pattern.exec(text);
	}

	if (cursor < text.length) {
		nodes.push(text.slice(cursor));
	}
	return nodes;
}

export function renderMarkdown(source: string): ReactNode {
	const lines = source.replace(/\r\n/g, '\n').split('\n');
	const blocks: ReactNode[] = [];
	let paragraph: string[] = [];
	let listItems: string[] = [];
	let blockIndex = 0;

	const flushParagraph = () => {
		if (paragraph.length === 0) return;
		const text = paragraph.join('\n');
		blocks.push(
			<p key={`p-${blockIndex++}`} className="leading-relaxed">
				{parseInline(text, `p${blockIndex}`)}
			</p>,
		);
		paragraph = [];
	};

	const flushList = () => {
		if (listItems.length === 0) return;
		blocks.push(
			<ul key={`ul-${blockIndex++}`} className="list-disc space-y-1 pl-6">
				{listItems.map((item, idx) => (
					<li key={`li-${blockIndex}-${idx}`}>{parseInline(item, `li${blockIndex}-${idx}`)}</li>
				))}
			</ul>,
		);
		listItems = [];
	};

	for (const rawLine of lines) {
		const line = rawLine.trimEnd();

		if (line.trim() === '') {
			flushParagraph();
			flushList();
			continue;
		}

		const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
		const listMatch = /^[-*]\s+(.+)$/.exec(line);

		if (headingMatch) {
			flushParagraph();
			flushList();
			const level = headingMatch[1].length;
			const Tag = (`h${Math.min(level + 2, 6)}` as keyof JSX.IntrinsicElements);
			const sizeClass = level === 1 ? 'text-lg font-semibold' : level === 2 ? 'text-base font-semibold' : 'text-sm font-semibold';
			blocks.push(
				<Tag key={`h-${blockIndex++}`} className={`${sizeClass} mt-2`}>
					{parseInline(headingMatch[2], `h${blockIndex}`)}
				</Tag>,
			);
			continue;
		}

		if (listMatch) {
			flushParagraph();
			listItems.push(listMatch[1]);
			continue;
		}

		// Otherwise accumulate paragraph
		flushList();
		paragraph.push(line);
	}

	flushParagraph();
	flushList();

	return <div className="space-y-3 text-sm">{blocks}</div>;
}
