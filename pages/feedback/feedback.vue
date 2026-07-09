<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">意见反馈</view></view>
		<view class="top-space"></view>
		<view class="panel">
			<view class="title">意见反馈</view>
			<view class="sub">感谢您宝贵的建议</view>

			<view class="field-label">手机号</view>
			<input class="field" v-model="form.phone" placeholder="请输入手机号" />

			<view class="field-label">微信号</view>
			<input class="field" v-model="form.wechat" placeholder="请输入微信号" />

			<view class="field-label required">反馈内容</view>
			<textarea class="textarea" v-model="form.content" placeholder="请输入反馈内容" />

			<view class="field-label">图片</view>
			<view class="images">
				<view class="upload" @click="chooseImage">
					<view class="camera">▣</view>
					<view>上传图片</view>
				</view>
				<image class="preview" v-for="(img,index) in form.images" :key="img" :src="mediaUrl(img)" mode="aspectFill" @click="removeImage(index)" />
			</view>
		</view>

		<view class="submit" @click="submit">提交</view>
	</view>
</template>

<script>
import { getProfile, isUsableMediaUrl, resolveMediaUrl, submitFeedback, uploadAnswerImage, uploadAnswerImageFile } from '@/common/api.js'
import { safeNavigateBack } from '@/common/navigation.js'

export default {
	data() {
		return {
			form: { phone: '', wechat: '', content: '', images: [] }
		}
	},
	onShow() {
		this.loadProfile()
	},
	methods: {
		async loadProfile() {
			try {
				const user = await getProfile()
				this.form.phone = user.phone || this.form.phone
				this.form.wechat = user.wechat || this.form.wechat
			} catch (err) {}
		},
		mediaUrl(value) {
			const url = resolveMediaUrl(value)
			return url && isUsableMediaUrl(url) ? url : ''
		},
		async normalizeChosenImages(res) {
			const files = res.tempFiles || []
			const paths = res.tempFilePaths || []
			const uploaded = []
			for (let index = 0; index < Math.max(files.length, paths.length); index += 1) {
				try {
					const file = files[index]
					const path = paths[index] || (file && file.path) || ''
					const url = file ? await uploadAnswerImageFile(file) : await uploadAnswerImage(path)
					if (url) uploaded.push(resolveMediaUrl(url))
				} catch (err) {}
			}
			return uploaded
		},
		chooseImage() {
			uni.chooseImage({
				count: Math.max(1, 3 - this.form.images.length),
				success: async res => {
					uni.showLoading({ title: '上传中' })
					try {
						const images = await this.normalizeChosenImages(res)
						this.form.images = this.form.images.concat(images).slice(0, 3)
						if (!images.length) uni.showToast({ title: '图片上传失败', icon: 'none' })
					} finally {
						uni.hideLoading()
					}
				}
			})
		},
		removeImage(index) {
			this.form.images.splice(index, 1)
		},
		async submit() {
			if (!this.form.content.trim()) {
				uni.showToast({ title: '请输入反馈内容', icon: 'none' })
				return
			}
			try {
				await submitFeedback({
					...this.form,
					images: this.form.images.map(item => resolveMediaUrl(item)).filter(Boolean)
						.filter(item => isUsableMediaUrl(item))
				})
				uni.showToast({ title: '提交成功', icon: 'success' })
				this.form.content = ''
				this.form.images = []
				setTimeout(() => this.goBack(), 600)
			} catch (err) {
				uni.showToast({ title: err.message || '提交失败', icon: 'none' })
			}
		},
		goBack() { safeNavigateBack('/pages/member/member') }
	}
}
</script>

<style lang="scss">
page { background:#f3f4f6; }
.page { min-height:100vh; background:#f3f4f6; padding-bottom:42rpx; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; }
.nav-title { font-size:32rpx; font-weight:800; color:#222; }
.top-space { height:220rpx; background:#777; }
.panel { margin-top:-2rpx; padding:34rpx 30rpx 26rpx; background:#fff; border-radius:22rpx 22rpx 0 0; }
.title { color:#111827; font-size:34rpx; font-weight:900; }
.sub { margin-top:10rpx; color:#9aa3af; font-size:24rpx; }
.field-label { margin-top:38rpx; color:#111827; font-size:27rpx; font-weight:800; }
.field-label.required::after { content:' *'; color:#e5484d; }
.field { margin-top:16rpx; height:76rpx; padding:0 24rpx; border-radius:10rpx; background:#f6f7f9; color:#333; font-size:26rpx; }
.textarea { margin-top:16rpx; width:100%; height:170rpx; padding:20rpx 24rpx; box-sizing:border-box; border-radius:10rpx; background:#f6f7f9; color:#333; font-size:26rpx; }
.images { display:flex; flex-wrap:wrap; gap:18rpx; margin-top:16rpx; }
.upload, .preview { width:150rpx; height:150rpx; border-radius:8rpx; background:#f3f5f8; }
.upload { display:flex; flex-direction:column; align-items:center; justify-content:center; color:#8b95a1; font-size:24rpx; }
.camera { font-size:44rpx; line-height:1; margin-bottom:10rpx; color:#9aa3af; }
.preview { display:block; }
.submit { margin:36rpx 30rpx 0; height:86rpx; line-height:86rpx; text-align:center; border-radius:43rpx; color:#fff; background:#4b8df7; font-size:30rpx; font-weight:800; }
</style>
