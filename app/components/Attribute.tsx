import { Check, Copy } from 'lucide-react';
import cn from '~/utils/cn';
import toast from '~/utils/toast';

export interface AttributeProps {
	name: string;
	value: string;
	isCopyable?: boolean;
	link?: string;
	isWide?: boolean;
}

export default function Attribute({
	name,
	value,
	link,
	isCopyable,
	isWide
}: AttributeProps) {
	return (
		<dl className={cn(
			'flex items-center w-full gap-x-1',
				isWide && 'gap-x-[6rem]',
			)}
		>
			<dt className="font-semibold w-1/4 shrink-0 text-sm">
				{link ? (
					<a
						className={cn(
							'hover:underline',
							isWide && 'max-w-[10rem]',
						)}
						href={link}
					>
						{name}
					</a>
				) : (
					name
				)}
			</dt>
			<dd
				className={cn(
					'rounded-lg truncate px-2.5 py-1 text-sm',
					'flex items-center gap-x-1',
					'focus-within:none',
					isCopyable && 'hover:bg-headplane-100 dark:hover:bg-headplane-800',
				)}
			>
				{isCopyable ? (
					<button
						type="button"
						className="w-full flex items-center gap-x-1 outline-none"
						onClick={async (event) => {
							const svgs = event.currentTarget.querySelectorAll('svg');
							for (const svg of svgs) {
								svg.toggleAttribute('data-copied', true);
							}

							await navigator.clipboard.writeText(value);
							toast(`Copied ${name} to clipboard`);

							setTimeout(() => {
								for (const svg of svgs) {
									svg.toggleAttribute('data-copied', false);
								}
							}, 1000);
						}}
					>
						<p className="truncate">{value}</p>
						<Check className="h-4.5 w-4.5 p-1 hidden data-[copied]:block" />
						<Copy className="h-4.5 w-4.5 p-1 block data-[copied]:hidden" />
					</button>
				) : (
					value
				)}
			</dd>
		</dl>
	);
}
