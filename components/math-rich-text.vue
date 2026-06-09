<template>
	<rich-text class="math-rich-text" :nodes="html"></rich-text>
</template>

<script>
import { renderMath } from '@/common/math-render.js'

export default {
	name: 'MathRichText',
	props: {
		text: {
			type: [String, Number],
			default: ''
		},
		fallback: {
			type: String,
			default: ''
		}
	},
	computed: {
		html() {
			return renderMath(this.text, this.fallback)
		}
	}
}
</script>

<style lang="scss">
.math-rich-text {
	display: block;
	min-width: 0;
	word-break: break-word;
}

.math-rich-text .katex {
	font-size: 1em;
	line-height: 1.35;
	white-space: normal;
}

.math-rich-text .katex-display {
	margin: 12rpx 0;
	overflow-x: auto;
	overflow-y: hidden;
}

.math-rich-text u {
	text-underline-offset: 5rpx;
	text-decoration-thickness: 2rpx;
}
</style>
