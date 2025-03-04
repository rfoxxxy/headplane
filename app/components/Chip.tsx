import React from 'react';
import cn from '~/utils/cn';

export interface ChipProps {
	text: string;
	className?: string;
	leftIcon?: React.ReactNode;
	rightIcon?: React.ReactNode;
}

export default function Chip({
	text,
	className,
	leftIcon,
	rightIcon,
}: ChipProps) {
	return (
		<span
			className={cn(
				'text-xs px-2 py-0.5 rounded-full',
				'text-headplane-700 dark:text-headplane-100',
				'bg-headplane-100 dark:bg-headplane-700 overflow-ellipsis text-nowrap',
				leftIcon || rightIcon ? 'inline-flex items-center gap-x-1' : '',
				className,
			)}
		>
			{leftIcon}
			{text}
			{rightIcon}
		</span>
	);
}
