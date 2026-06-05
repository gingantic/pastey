<script lang="ts">
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
		<input
			id={inputId}
			{type}
			{placeholder}
			{disabled}
			{required}
			bind:value
			class="w-full bg-brand-surface border text-text-primary placeholder:text-text-muted rounded-xl px-4 py-3 text-sm transition-all duration-300 outline-none
				{error
				? 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
				: 'border-border-dim focus:border-white focus:ring-1 focus:ring-white/10'}
				disabled:opacity-50 disabled:pointer-events-none"
			{...restProps}
		/>
	</div>

	{#if error}
		<span class="text-[10px] text-red-500 mt-1.5">{error}</span>
	{/if}
</div>
