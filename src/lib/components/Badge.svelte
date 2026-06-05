<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'skill' | 'social';
		href?: string;
		class?: string;
		icon?: Snippet;
		children?: Snippet;
		[key: string]: any;
	}

	let {
		variant = 'skill',
		href = '',
		class: customClass = '',
		icon,
		children,
		...restProps
	}: Props = $props();

	let baseClass = 'inline-flex items-center gap-2 font-mono transition-colors duration-300';

	let variantClass = $derived(() => {
		if (variant === 'skill') {
			return 'px-3 py-1 bg-brand-accent border border-border-light rounded-full text-[10px] text-gray-300 tracking-tight';
		} else {
			return 'bg-brand-accent hover:bg-[#252525] border border-border-dim px-3 py-2 rounded-lg text-xs text-text-secondary hover:text-white cursor-pointer';
		}
	});
</script>

{#if href}
	<a {href} class="{baseClass} {variantClass()} {customClass}" {...restProps}>
		{#if icon}
			{@render icon()}
		{/if}
		{#if children}
			<span>{@render children()}</span>
		{/if}
	</a>
{:else}
	<div class="{baseClass} {variantClass()} {customClass}" {...restProps}>
		{#if icon}
			{@render icon()}
		{/if}
		{#if children}
			<span>{@render children()}</span>
		{/if}
	</div>
{/if}
