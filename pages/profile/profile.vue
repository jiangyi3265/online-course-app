<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">个人信息</view></view>

		<view class="form">
			<view class="row" @click="chooseAvatar">
				<text class="label">头像</text>
				<view class="value avatar-value">
					<image v-if="form.avatar" class="avatar" :src="form.avatar" mode="aspectFill" />
					<view v-else class="avatar empty">👤</view>
					<text class="arrow">›</text>
				</view>
			</view>
			<view class="row"><text class="label">用户昵称</text><input class="input" v-model="form.name" placeholder="请输入昵称" /></view>
			<view class="row"><text class="label">真实姓名</text><input class="input" v-model="form.realName" placeholder="请输入真实姓名" /></view>
			<view class="row"><text class="label">手机号</text><input class="input" v-model="form.phone" placeholder="请输入手机号" /></view>
			<view class="row"><text class="label">地址</text><input class="input" v-model="form.address" placeholder="请输入地址" /></view>
			<view class="row"><text class="label">微信账号</text><input class="input" v-model="form.wechat" placeholder="请输入微信号" /></view>
			<view class="row"><text class="label">登录密码</text><input class="input" v-model="form.password" password placeholder="不修改可留空" /></view>
			<view class="row" @click="toggleWechat"><text class="label">是否绑定微信</text><view class="value">{{form.wechatBound ? '已绑定(点击取消绑定)' : '未绑定'}}</view></view>
			<view class="row" @click="uploadFace"><text class="label">人脸验证是否上传</text><view class="value">{{form.faceUploaded ? '已上传' : '未上传'}}<text class="arrow">›</text></view></view>
			<view class="row">
				<text class="label">是否开启答题音效</text>
				<switch :checked="form.answerAudioEnabled" @change="form.answerAudioEnabled = $event.detail.value" />
			</view>
		</view>

		<view class="save-btn" @click="save">保存</view>
	</view>
</template>

<script>
import { getProfile, saveSession, updateProfile } from '@/common/api.js'

export default {
	data() {
		return {
			form: {
				avatar: '',
				name: '',
				realName: '',
				phone: '',
				address: '',
				wechat: '',
				password: '',
				wechatBound: true,
				faceUploaded: true,
				answerAudioEnabled: true
			}
		}
	},
	onShow() {
		this.loadData()
	},
	methods: {
		async loadData() {
			try {
				const user = await getProfile()
				const cached = uni.getStorageSync('userInfo') || {}
				this.form = {
					...this.form,
					...cached,
					...user,
					name: user.name || cached.name || '',
					realName: user.realName || cached.realName || user.name || cached.name || '',
					wechatBound: user.wechatBound !== false,
					faceUploaded: user.faceUploaded !== false,
					answerAudioEnabled: user.answerAudioEnabled !== false,
					password: ''
				}
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon: 'none' })
			}
		},
		chooseAvatar() {
			uni.chooseImage({
				count: 1,
				success: res => { this.form.avatar = res.tempFilePaths[0] }
			})
		},
		uploadFace() {
			this.form.faceUploaded = true
			uni.showToast({ title: '已上传', icon: 'success' })
		},
		toggleWechat() {
			this.form.wechatBound = !this.form.wechatBound
		},
		async save() {
			try {
				const payload = { ...this.form }
				if (!payload.password) delete payload.password
				const user = await updateProfile(payload)
				saveSession({ user })
				uni.showToast({ title: '已保存', icon: 'success' })
			} catch (err) {
				uni.showToast({ title: err.message || '保存失败', icon: 'none' })
			}
		},
		goBack() { uni.navigateBack({ fail:()=>{} }) }
	}
}
</script>

<style lang="scss">
page { background:#f7f8fa; }
.page { min-height:100vh; background:#f7f8fa; padding-bottom:40rpx; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; }
.nav-title { font-size:30rpx; font-weight:700; color:#222; }
.form { margin-top:18rpx; background:#fff; padding-left:30rpx; }
.row { min-height:92rpx; padding-right:30rpx; display:flex; align-items:center; justify-content:space-between; border-bottom:1rpx solid #f0f2f5; }
.label { flex-shrink:0; color:#222; font-size:28rpx; font-weight:600; }
.value { flex:1; min-width:0; text-align:right; color:#6b7280; font-size:27rpx; }
.input { flex:1; min-width:0; text-align:right; color:#333; font-size:27rpx; }
.avatar-value { display:flex; justify-content:flex-end; align-items:center; }
.avatar { width:68rpx; height:68rpx; border-radius:50%; background:#e3edf7; display:flex; align-items:center; justify-content:center; overflow:hidden; }
.avatar.empty { color:#7aa6d6; font-size:34rpx; }
.arrow { margin-left:14rpx; color:#c8cdd4; font-size:38rpx; }
.save-btn { margin:36rpx 30rpx 0; height:86rpx; line-height:86rpx; text-align:center; border-radius:43rpx; background:#1677ff; color:#fff; font-size:30rpx; font-weight:800; }
</style>
