<script lang="ts">
	interface Props {
		value?: string;
		placeholder?: string;
		label?: string;
		error?: string;
		rows?: number;
		disabled?: boolean;
		required?: boolean;
		id?: string;
		class?: string;
		[key: string]: any;
	}

	let {
		value = $bindable(''),
		placeholder = '',
		label = '',
		error = '',
		rows = 4,
		disabled = false,
		required = false,
		id = '',
		class: customClass = '',
		...restProps
	}: Props = $props();

	let textareaId = $derived(id || `textarea-${Math.random().toString(36).substring(2, 9)}`);
</script>

<div class="flex flex-col w-full font-mono {customClass}">
	{#if label}
		<label for={textareaId} class="text-xs text-text-muted mb-2 tracking-wider">
			{label}
			{#if required}
				<span class="text-red-500 ml-0.5">*</span>
			{/if}
		</label>
	{/if}

	<div class="relative">
		<textarea
			id={textareaId}
			{placeholder}
			{rows}
			{disabled}
			{required}
			bind:value
			class="w-full bg-brand-surface border text-text-primary placeholder:text-text-muted rounded-xl px-4 py-3 text-sm transition-all duration-300 outline-none resize-y
				{error
				? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
				: 'border-border-dim focus:border-white focus:ring-1 focus:ring-white/10'}
				disabled:opacity-50 disabled:pointer-events-none"
			{...restProps}
		></textarea>
	</div>

	{#if error}
		<span class="text-[10px] text-red-500 mt-1.5">{error}</span>
	{/if}
</div>
