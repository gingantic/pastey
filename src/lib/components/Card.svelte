<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'interactive';
		padding?: 'p-6' | 'p-8' | 'none';
		class?: string;
		header?: Snippet;
		children?: Snippet;
		footer?: Snippet;
		[key: string]: any;
	}

	let {
		variant = 'default',
		padding = 'p-6',
		class: customClass = '',
		header,
		children,
		footer,
		...restProps
	}: Props = $props();

	let paddingClass = $derived(() => {
		if (padding === 'p-6') return 'p-6';
		if (padding === 'p-8') return 'p-8';
		return '';
	});

	let baseClass =
		'bg-brand-surface rounded-3xl border border-border-dim transition-all duration-300';

	let variantClass = $derived(() => {
		if (variant === 'interactive') {
			return 'hover:border-border-light hover:shadow-glass group cursor-pointer';
		}
		return '';
	});
</script>

<div class="{baseClass} {paddingClass()} {variantClass()} {customClass}" {...restProps}>
	{#if header}
		<div class="mb-4">
			{@render header()}
		</div>
	{/if}

	{#if children}
		<div class="flex-grow">
			{@render children()}
		</div>
	{/if}

	{#if footer}
		<div class="mt-6">
			{@render footer()}
		</div>
	{/if}
</div>
