<script lang="ts">
	import Prism from 'prismjs';
	import 'prismjs/themes/prism-tomorrow.css';

	interface Props {
		content: string;
		lang: string;
		title: string;
	}

	let { content = '', lang = 'plaintext', title = '' }: Props = $props();

	function getLanguageGrammar(l: string) {
		if (l === 'svelte') return Prism.languages.html || Prism.languages.markup;
		if (l === 'dockerfile') return Prism.languages.docker || Prism.languages.plaintext;
		return Prism.languages[l] || Prism.languages.plaintext;
	}

	let highlightedCode = $derived.by(() => {
		const grammar = getLanguageGrammar(lang);
		return Prism.highlight(content, grammar, lang);
	});

	let lineNumbers = $derived(
		content.split('\n').map((_, i) => i + 1)
	);
</script>

<div class="bg-brand-surface border border-border-dim rounded-3xl overflow-hidden shadow-glass">
	<!-- Viewer Topbar -->
	<div class="flex items-center justify-between px-5 py-3 border-b border-border-dim bg-brand-bg/60">
		<div class="flex items-center gap-2">
			<span class="w-2.5 h-2.5 rounded-full bg-[#ff5f57]"></span>
			<span class="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]"></span>
			<span class="w-2.5 h-2.5 rounded-full bg-[#28c840]"></span>
		</div>
		<span class="font-mono text-[10px] text-text-muted">
			{title}.{lang}
		</span>
		<span class="font-mono text-[10px] text-text-muted">
			{lineNumbers.length} lines
		</span>
	</div>

	<!-- Code with line numbers -->
	<div class="flex overflow-x-auto no-scrollbar">
		<!-- Line numbers column -->
		<div
			class="bg-brand-bg/30 border-r border-border-dim px-4 pt-5 pb-5 flex flex-col items-end min-w-[52px] select-none pointer-events-none sticky left-0"
		>
			{#each lineNumbers as n}
				<span class="font-mono text-[10px] text-text-muted leading-6">{n}</span>
			{/each}
		</div>

		<!-- Code display -->
		<pre class="flex-1 font-mono text-sm text-text-primary px-5 py-5 leading-6 overflow-x-auto whitespace-pre"><code class="language-{lang}">{@html highlightedCode}</code></pre>
	</div>
</div>

<style>
	:global(code[class*="language-"]),
	:global(pre[class*="language-"]) {
		background: transparent !important;
		text-shadow: none !important;
		padding: 0 !important;
		margin: 0 !important;
		font-family: inherit !important;
		line-height: inherit !important;
	}
</style>
