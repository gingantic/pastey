<script lang="ts">
	import { ChevronDown } from '@lucide/svelte';
	import type { Component } from 'svelte';

	interface Option {
		value: string;
		label: string;
		icon?: Component;
	}

	interface Props {
		label: string;
		value: string;
		options: (string | Option)[];
		open: boolean;
		onSelect?: (val: string) => void;
		class?: string;
		disabled?: boolean;
	}

	let {
		label,
		value = $bindable(),
		options = [],
		open = $bindable(false),
		onSelect,
		class: customClass = '',
		disabled = false
	}: Props = $props();

	// Standardize options to always be Option objects
	let parsedOptions = $derived(
		options.map(opt => typeof opt === 'string' ? { value: opt, label: opt } : opt)
	);

	let selectedLabel = $derived(
		parsedOptions.find(o => o.value === value)?.label ?? value
	);

	let selectedIcon = $derived(
		parsedOptions.find(o => o.value === value)?.icon
	);
</script>

<div class="relative {customClass}">
	<button
		type="button"
		class="w-full flex items-center justify-between gap-3 bg-brand-surface border border-border-dim rounded-2xl px-5 py-4 font-mono text-xs text-text-primary hover:border-border-light transition-colors disabled:opacity-50 disabled:pointer-events-none"
		{disabled}
		onclick={() => open = !open}
	>
		<div class="flex items-center gap-3">
			{#if selectedIcon}
				{@const Icon = selectedIcon}
				<Icon size={14} class="text-text-muted" />
			{/if}
			<div class="flex flex-col items-start gap-0.5">
				<span class="text-[10px] text-text-muted uppercase tracking-widest">{label}</span>
				<span class="text-white py-1">{selectedLabel}</span>
			</div>
		</div>
		<ChevronDown
			size={14}
			class="text-text-muted transition-transform duration-200 {open ? 'rotate-180' : ''}"
		/>
	</button>
	{#if open}
		<div
			class="absolute left-0 right-0 top-[calc(100%+6px)] z-20 bg-brand-surface border border-border-light rounded-2xl shadow-glass overflow-y-auto max-h-[216px] animate-slide-down"
		>
			{#each parsedOptions as option}
				<button
					type="button"
					class="w-full text-left px-5 py-2.5 font-mono text-xs transition-colors flex items-center justify-between
						{value === option.value
							? 'bg-white/5 text-white'
							: 'text-text-muted hover:bg-brand-accent hover:text-white'}"
					onclick={() => {
						value = option.value;
						open = false;
						if (onSelect) onSelect(option.value);
					}}
				>
					<div class="flex items-center gap-2">
						{#if option.icon}
							{@const OptionIcon = option.icon}
							<OptionIcon size={14} />
						{/if}
						<span>{option.label}</span>
					</div>
					{#if value === option.value}
						<span class="w-1.5 h-1.5 rounded-full bg-white"></span>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.animate-slide-down {
		animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
		transform-origin: top;
	}
</style>
