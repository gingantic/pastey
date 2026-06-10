<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		value?: string | number;
		type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
		placeholder?: string;
		label?: string;
		error?: string;
		disabled?: boolean;
		required?: boolean;
		id?: string;
		class?: string;
		icon?: Snippet;
		iconRight?: Snippet;
		children?: Snippet;
		[key: string]: any;
	}

	let {
		value = $bindable(''),
		type = 'text',
		placeholder = '',
		label = '',
		error = '',
		disabled = false,
		required = false,
		id = '',
		class: customClass = '',
		icon,
		iconRight,
		children,
		...restProps
	}: Props = $props();

	let inputId = $derived(id || `input-${Math.random().toString(36).substring(2, 9)}`);
</script>

<div class="flex flex-col w-full font-mono {customClass}">
	{#if label}
		<label for={inputId} class="text-xs text-text-muted mb-2 tracking-wider">
			{label}
			{#if required}
				<span class="text-red-500 ml-0.5">*</span>
			{/if}
		</label>
	{/if}

	<div class="relative">
		{#if icon}
			<div class="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted flex items-center justify-center pointer-events-none">
				{@render icon()}
			</div>
		{/if}
		<input
			id={inputId}
			{type}
			{placeholder}
			{disabled}
			{required}
			bind:value
			class="w-full bg-brand-surface border text-text-primary placeholder:text-text-muted rounded-xl py-3 text-sm transition-all duration-300 outline-none
				{icon ? 'pl-11' : 'pl-4'}
				{iconRight ? 'pr-11' : 'pr-4'}
				{error
				? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
				: 'border-border-dim focus:border-white focus:ring-1 focus:ring-white/10'}
				disabled:opacity-50 disabled:pointer-events-none"
			{...restProps}
		/>
		{#if iconRight}
			<div class="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
				{@render iconRight()}
			</div>
		{/if}
	</div>

	{#if error}
		<span class="text-[10px] text-red-500 mt-1.5">{error}</span>
	{/if}
</div>
