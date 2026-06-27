<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
			this.syncH5Title()
		},
		onShow: function() {
			console.log('App Show')
			this.syncH5Title()
		},
		onHide: function() {
			console.log('App Hide')
		},
		methods: {
			syncH5Title() {
				if (typeof document !== 'undefined') document.title = '元知智学'
			}
		}
	}
</script>

<style>
	@import 'katex/dist/katex.min.css';

	html,
	body {
		background: #eef2f6;
	}

	#app {
		position: relative;
		min-height: 100%;
		background: #f7f8fa;
	}

	/* #ifdef H5 */
	:root {
		--wk-app-width: min(430px, 100vw);
		--wk-page-bg: #f7f8fa;
		--wk-desktop-bg: #edf1f6;
	}

	@media screen and (min-width: 768px) {
		:root {
			--wk-app-width: min(430px, 100vw);
		}

		* {
			box-sizing: border-box;
		}

		html,
		body {
			min-height: 100%;
			overflow-x: hidden;
			background-color: var(--wk-desktop-bg);
			background-image:
				linear-gradient(90deg, rgba(49, 64, 84, 0.04) 1px, transparent 1px),
				linear-gradient(180deg, rgba(49, 64, 84, 0.035) 1px, transparent 1px);
			background-size: 40px 40px;
		}

		body {
			margin: 0;
		}

		html,
		body,
		#app,
		uni-app,
		uni-page,
		uni-page-wrapper,
		uni-page-body,
		page {
			scrollbar-width: none;
			-ms-overflow-style: none;
		}

		html::-webkit-scrollbar,
		body::-webkit-scrollbar,
		#app::-webkit-scrollbar,
		uni-app::-webkit-scrollbar,
		uni-page::-webkit-scrollbar,
		uni-page-wrapper::-webkit-scrollbar,
		uni-page-body::-webkit-scrollbar,
		page::-webkit-scrollbar {
			width: 0;
			height: 0;
			display: none;
		}

		#app {
			position: relative;
			z-index: 1;
			width: var(--wk-app-width);
			max-width: 100vw;
			min-height: 100vh;
			margin: 0 auto;
			overflow-x: hidden;
			background: var(--wk-page-bg);
			box-shadow:
				0 0 0 1px rgba(15, 23, 42, 0.08),
				0 18px 52px rgba(15, 23, 42, 0.16);
		}

		uni-app,
		uni-page,
		uni-page-wrapper,
		uni-page-body,
		page {
			width: 100%;
			max-width: var(--wk-app-width);
			margin-left: auto;
			margin-right: auto;
			background: var(--wk-page-bg);
		}

		uni-page-head {
			width: 100%;
			max-width: var(--wk-app-width);
			margin-left: auto;
			margin-right: auto;
		}

		.uni-page-head {
			left: 50% !important;
			right: auto !important;
			width: var(--wk-app-width) !important;
			max-width: 100vw;
			transform: translateX(-50%);
			box-sizing: border-box;
			background: rgba(248, 250, 252, 0.96) !important;
			box-shadow: 0 1px 0 rgba(15, 23, 42, 0.06);
			backdrop-filter: blur(12px);
		}

		.uni-page-head,
		.tabbar,
		.footer,
		.input-bar,
		.bottom-bar,
		.bottom-action,
		.action-bar,
		.safe-footer {
			left: 50% !important;
			right: auto !important;
			width: var(--wk-app-width) !important;
			max-width: 100vw;
			transform: translateX(-50%);
			box-sizing: border-box;
		}

		.tabbar {
			box-shadow: 0 -10px 28px rgba(15, 23, 42, 0.08);
		}

		.mask,
		.auth-mask,
		.invite-mask {
			left: 50% !important;
			right: auto !important;
			width: var(--wk-app-width) !important;
			max-width: 100vw;
			transform: translateX(-50%);
			box-sizing: border-box;
		}

		uni-modal,
		uni-toast {
			max-width: var(--wk-app-width);
			margin-left: auto;
			margin-right: auto;
		}

		uni-page-body > .page,
		uni-page-body > view,
		uni-page-body > uni-view {
			width: 100%;
			max-width: var(--wk-app-width);
			margin-left: auto;
			margin-right: auto;
		}
	}
	/* #endif */
	/*每个页面公共css */
</style>
