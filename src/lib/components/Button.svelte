<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'icon' | 'circle';
		type?: 'button' | 'submit' | 'reset';
		href?: string;
		disabled?: boolean;
		class?: string;
		onclick?: (event: MouseEvent) => void;
		children?: Snippet;
		[key: string]: any; // Allow other standard HTML attributes
	}

	let {
		variant = 'primary',
		type = 'button',
		href = '',
		disabled = false,
		class: customClass = '',
		onclick,
		children,
		...restProps
	}: Props = $props();

	// Computed Tailwind classes based on variant
	let baseClass =
		'inline-flex items-center justify-center font-mono transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20 select-none';

	let variantClasses = $derived(() => {
		switch (variant) {
			case 'primary':
				return 'bg-white text-black px-8 py-3 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:pointer-events-none';
			case 'secondary':
				return 'bg-brand-accent hover:bg-[#252525] border border-border-dim px-4 py-2.5 rounded-lg text-xs text-text-secondary hover:text-white active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none';
			case 'outline':
				return 'border border-border-dim rounded-full text-text-secondary hover:text-black hover:bg-white active:scale-95 disabled:opacity-30 disabled:pointer-events-none';
			case 'text':
				return 'text-text-muted hover:text-white px-3 py-1 text-sm font-medium disabled:opacity-40 disabled:pointer-events-none';
			case 'icon':
				return 'w-10 h-10 rounded-full bg-brand-accent border border-border-dim text-white hover:bg-white hover:text-black active:scale-90 disabled:opacity-50 disabled:pointer-events-none';
			case 'circle':
				return 'w-12 h-12 rounded-full bg-brand-accent text-white border border-border-light hover:bg-white hover:text-black active:scale-90 disabled:opacity-50 disabled:pointer-events-none';
			default:
				return '';
		}
	});
</script>

{#if href}
	<a {href} class="{baseClass} {variantClasses()} {customClass}" {...restProps}>
		{#if children}
			{@render children()}
		{/if}
	</a>
{:else}
	<button
		{type}
		{disabled}
		class="{baseClass} {variantClasses()} {customClass}"
		{onclick}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</button>
{/if}
