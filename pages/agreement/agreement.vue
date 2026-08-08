<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">{{ pageTitle }}</view>
			<view class="nav-spacer"></view>
		</view>

		<AppDataState
			v-if="state !== 'success'"
			:state="state"
			:title="stateTitle"
			:description="stateDescription"
			@retry="loadDoc"
		/>

		<view v-else class="content">
			<view class="doc-card">
				<view class="doc-title">{{ doc.title }}</view>
				<view class="doc-time" v-if="doc.updatedAt">更新时间：{{ formatTime(doc.updatedAt) }}</view>
				<rich-text class="doc-body" :nodes="docContentHtml"></rich-text>
			</view>
		</view>
	</view>
</template>

<script>
import AppDataState from '@/components/app-data-state.vue'
import { getFrontendSettings } from '@/common/api.js'

export default {
	components: { AppDataState },
	data() {
		return {
			type: 'privacy',
			state: 'loading',
			doc: null
		}
	},
	onLoad(opts = {}) {
		this.type = opts.type === 'user' ? 'user' : 'privacy'
		this.loadDoc()
	},
	computed: {
		pageTitle() {
			return this.type === 'user' ? '用户协议' : '隐私政策'
		},
		stateTitle() {
			if (this.state === 'error') return '协议内容加载失败'
			if (this.state === 'empty') return '协议内容暂未发布'
			return '正在加载协议内容'
		},
		stateDescription() {
			if (this.state === 'error') return '请检查网络后重试，如仍无法加载请联系管理员。'
			if (this.state === 'empty') return '管理员发布后即可查看。'
			return '请稍候…'
		},
		docContentHtml() {
			return this.toRichText(this.doc && this.doc.content)
		}
	},
	methods: {
		async loadDoc() {
			this.state = 'loading'
			this.doc = null
			try {
				const settings = await getFrontendSettings()
				const agreements = settings && settings.agreements ? settings.agreements : {}
				const remoteDoc = this.type === 'user' ? agreements.user : agreements.privacy
				if (!remoteDoc || !String(remoteDoc.content || '').trim()) {
					this.state = 'empty'
					return
				}
				this.doc = {
					title: String(remoteDoc.title || this.pageTitle),
					content: String(remoteDoc.content),
					updatedAt: remoteDoc.updatedAt || ''
				}
				this.state = 'success'
			} catch (err) {
				console.warn('协议配置读取失败', err)
				this.state = 'error'
			}
		},
		goBack() {
			uni.navigateBack({
				fail: () => uni.switchTab({
					url: '/pages/member/member',
					fail: () => uni.redirectTo({ url: '/pages/member/member' })
				})
			})
		},
		formatTime(value) {
			if (!value) return ''
			return String(value).replace('T', ' ').slice(0, 16)
		},
		toRichText(value = '') {
			const content = String(value || '')
			if (/<[a-z][\s\S]*>/i.test(content)) return content
			return this.escapeHtml(content).replace(/\r?\n/g, '<br/>')
		},
		escapeHtml(value = '') {
			return String(value)
				.replace(/&/g, '&amp;')
				.replace(/</g, '&lt;')
				.replace(/>/g, '&gt;')
				.replace(/"/g, '&quot;')
				.replace(/'/g, '&#39;')
		}
	}
}
</script>

<style lang="scss">
page { background:#f6f8fb; }
.page { min-height:100vh; background:#f6f8fb; }
.nav {
	position:sticky;
	top:0;
	z-index:1000;
	height:88rpx;
	padding:0 24rpx;
	display:flex;
	align-items:center;
	justify-content:space-between;
	background:#fff;
	border-bottom:1rpx solid #edf1f6;
	box-sizing:border-box;
}
.back,
.nav-spacer {
	width:64rpx;
	height:64rpx;
	display:flex;
	align-items:center;
	justify-content:center;
}
.back {
	color:#111827;
	font-size:52rpx;
	line-height:1;
	cursor:pointer;
}
.nav-title {
	flex:1;
	min-width:0;
	text-align:center;
	color:#111827;
	font-size:34rpx;
	font-weight:900;
	overflow:hidden;
	text-overflow:ellipsis;
	white-space:nowrap;
}
.content {
	padding:24rpx;
	box-sizing:border-box;
}
.doc-card {
	padding:34rpx 30rpx 40rpx;
	background:#fff;
	border:1rpx solid #e7edf4;
	border-radius:18rpx;
	box-shadow:0 8rpx 22rpx rgba(16,24,40,.04);
}
.doc-title {
	color:#111827;
	font-size:38rpx;
	font-weight:900;
	line-height:1.3;
}
.doc-time {
	margin-top:12rpx;
	color:#8a96a8;
	font-size:24rpx;
}
.doc-body {
	display:block;
	margin-top:28rpx;
	color:#344054;
	font-size:29rpx;
	line-height:1.78;
	white-space:pre-wrap;
	word-break:break-word;
}
</style>
