import katex from 'katex'

const TOKEN_PATTERN = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^\$\n]+?\$)/g

function escapeHtml(value = '') {
	return String(value)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;')
}

function textHtml(value = '') {
	return escapeHtml(value).replace(/\r?\n/g, '<br>')
}

function parseToken(token = '') {
	if (token.startsWith('$$') && token.endsWith('$$')) {
		return { latex: token.slice(2, -2), displayMode: true }
	}
	if (token.startsWith('\\[') && token.endsWith('\\]')) {
		return { latex: token.slice(2, -2), displayMode: true }
	}
	if (token.startsWith('\\(') && token.endsWith('\\)')) {
		return { latex: token.slice(2, -2), displayMode: false }
	}
	if (token.startsWith('$') && token.endsWith('$')) {
		return { latex: token.slice(1, -1), displayMode: false }
	}
	return null
}

export function renderMath(value = '', fallback = '') {
	const source = String(value || fallback || '')
	if (!source) return ''

	let html = ''
	let lastIndex = 0
	source.replace(TOKEN_PATTERN, (token, _match, offset) => {
		html += textHtml(source.slice(lastIndex, offset))
		const parsed = parseToken(token)
		if (!parsed) {
			html += textHtml(token)
		} else {
			try {
				html += katex.renderToString(parsed.latex, {
					displayMode: parsed.displayMode,
					throwOnError: false,
					strict: 'ignore',
					trust: false,
					output: 'html'
				})
			} catch (error) {
				html += textHtml(token)
			}
		}
		lastIndex = offset + token.length
		return token
	})
	html += textHtml(source.slice(lastIndex))
	return html
}
