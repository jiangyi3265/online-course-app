<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">{{doc.title}}</view>
			<view class="nav-spacer"></view>
		</view>

		<view class="content">
			<view class="doc-card">
				<view class="doc-title">{{doc.title}}</view>
				<view class="doc-time" v-if="doc.updatedAt">更新时间：{{formatTime(doc.updatedAt)}}</view>
				<text class="doc-body">{{doc.content || '暂无内容'}}</text>
			</view>
		</view>
	</view>
</template>

<script>
import { getFrontendSettings } from '@/common/api.js'

export default {
	data() {
		return {
			type: 'privacy',
			doc: {
				title: '隐私政策',
				content: '暂无内容',
				updatedAt: ''
			}
		}
	},
	onLoad(opts = {}) {
		this.type = opts.type === 'user' ? 'user' : 'privacy'
		this.doc = this.fallbackDoc()
		this.loadDoc()
	},
	methods: {
		fallbackDoc() {
			return this.type === 'user'
				? { title: '用户协议', content: '暂无内容', updatedAt: '' }
				: { title: '隐私政策', content: '暂无内容', updatedAt: '' }
		},
		async loadDoc() {
			try {
				const settings = await getFrontendSettings()
				const agreements = settings && settings.agreements ? settings.agreements : {}
				const remoteDoc = this.type === 'user' ? agreements.user : agreements.privacy
				if (remoteDoc && (remoteDoc.title || remoteDoc.content)) {
					this.doc = {
						...this.fallbackDoc(),
						...remoteDoc
					}
				}
			} catch (err) {
				console.warn('协议配置读取失败，使用默认内容', err)
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
		}
	}
}
</script>

<style lang="scss">
page { background:#f6f8fb; }
.page { min-height:100vh; background:#f6f8fb; }
.nav {
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
