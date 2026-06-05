<script lang="ts">
	import Prism from 'prismjs';
	import 'prismjs/themes/prism-tomorrow.css';

	// Prism Language Components
	import 'prismjs/components/prism-go';
	import 'prismjs/components/prism-typescript';
	import 'prismjs/components/prism-javascript';
	import 'prismjs/components/prism-python';
	import 'prismjs/components/prism-rust';
	import 'prismjs/components/prism-sql';
	import 'prismjs/components/prism-yaml';
	import 'prismjs/components/prism-json';
	import 'prismjs/components/prism-bash';
	import 'prismjs/components/prism-nginx';
	import 'prismjs/components/prism-docker';

	interface Props {
		value: string;
		lang: string;
		placeholder?: string;
	}

	let {
		value = $bindable(''),
		lang = 'plaintext',
		placeholder = '// Paste your code here...'
	}: Props = $props();

	let editorScrollTop = $state(0);
	let editorPreElement: HTMLPreElement | undefined = $state();

	function syncEditorScroll(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		editorScrollTop = target.scrollTop;
		if (editorPreElement) {
			editorPreElement.scrollTop = target.scrollTop;
			editorPreElement.scrollLeft = target.scrollLeft;
		}
	}

	function getLanguageGrammar(l: string) {
		if (l === 'svelte') return Prism.languages.html || Prism.languages.markup;
		if (l === 'dockerfile') return Prism.languages.docker || Prism.languages.plaintext;
		return Prism.languages[l] || Prism.languages.plaintext;
	}

	let highlightedEditorCode = $derived.by(() => {
		const grammar = getLanguageGrammar(lang);
		const code = value + (value.endsWith('\n') ? ' ' : '');
		return Prism.highlight(code, grammar, lang);
	});

	let lineNumbers = $derived(
		(value || '\n').split('\n').map((_, i) => i + 1)
	);
</script>

<div class="flex border border-border-dim bg-brand-surface rounded-3xl overflow-hidden">
	<!-- Line numbers -->
	<div class="bg-brand-bg/20 border-r border-border-dim px-3 pt-4 pb-4 flex flex-col items-end min-w-[48px] select-none pointer-events-none overflow-hidden relative h-[480px]">
		<div style="transform: translateY(-{editorScrollTop}px)">
			{#each lineNumbers as n}
				<span class="font-mono text-[10px] text-text-muted leading-6 block">{n}</span>
			{/each}
		</div>
	</div>

	<!-- Editor Workspace Container -->
	<div class="flex-1 relative h-[480px] overflow-hidden">
		<!-- Background Highlighted Code -->
		<pre
			bind:this={editorPreElement}
			class="absolute inset-0 pointer-events-none px-4 py-4 m-0 overflow-hidden font-mono text-sm leading-6 whitespace-pre text-transparent select-none code-editor-pre"
		><code class="language-{lang}">{@html highlightedEditorCode}</code></pre>

		<!-- Foreground Invisible Textarea -->
		<textarea
			id="pastey-content"
			bind:value
			onscroll={syncEditorScroll}
			{placeholder}
			spellcheck={false}
			class="absolute inset-0 w-full h-full bg-transparent px-4 py-4 font-mono text-sm leading-6 resize-none outline-none overflow-auto code-editor-textarea text-transparent caret-white"
		></textarea>
	</div>
</div>

<style>
	.code-editor-textarea,
	.code-editor-pre,
	.code-editor-pre code {
		font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
		font-size: 14px !important;
		line-height: 24px !important;
		letter-spacing: normal !important;
		word-spacing: normal !important;
		font-feature-settings: normal !important;
		text-transform: none !important;
	}

	.code-editor-textarea,
	.code-editor-pre {
		white-space: pre !important;
		word-wrap: normal !important;
		overflow-wrap: normal !important;
		margin: 0 !important;
		border: 0 !important;
		padding: 1rem !important;
		box-sizing: border-box !important;
	}

	.code-editor-textarea {
		color: transparent !important;
		caret-color: #ffffff !important;
	}

	.code-editor-textarea::placeholder {
		color: var(--color-text-muted) !important;
	}

	.code-editor-pre code {
		color: var(--color-text-primary) !important;
	}

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
