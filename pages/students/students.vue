<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">我的学生</view></view>
		<view class="panel">
			<view class="panel-title">绑定学生</view>
			<input class="input" v-model.trim="form.phone" type="number" maxlength="11" placeholder="输入学生注册手机号" />
			<input class="input" v-model="form.password" type="password" placeholder="输入学生登录密码" />
			<view class="code-row">
				<input class="input code-input" v-model.trim="form.smsCode" type="number" maxlength="6" placeholder="或输入短信验证码" />
				<view class="code-btn" @click="getCode">获取验证码</view>
			</view>
			<view class="primary" @click="submitBind">绑定学生</view>
		</view>
		<view class="panel">
			<view class="panel-title">学生列表</view>
			<view class="empty" v-if="!students.length">暂无绑定学生</view>
			<view class="student" v-for="item in students" :key="item.id + item.name">
				<view>
					<view class="student-name">{{item.name || '学生'}}</view>
					<view class="student-sub">ID:{{item.id || '--'}}　{{item.grade || ''}}　{{item.region || ''}}</view>
				</view>
				<view class="student-stat" v-if="item.learning">课程{{item.learning.courseCount || 0}}｜均分{{item.learning.averageScore || 0}}</view>
			</view>
		</view>
	</view>
</template>

<script>
import { bindStudent, getMyStudents, sendSmsCode } from '@/common/api.js'

export default {
	data() {
		return {
			students: [],
			form: { phone: '', password: '', smsCode: '' }
		}
	},
	onShow() {
		this.loadData();
	},
	methods: {
		async loadData() {
			try {
				this.students = await getMyStudents();
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon:'none' });
			}
		},
		async getCode() {
			if (!/^1\d{10}$/.test(this.form.phone)) {
				uni.showToast({ title:'请输入正确手机号', icon:'none' });
				return;
			}
			try {
				const res = await sendSmsCode(this.form.phone);
				if (res.code) this.form.smsCode = res.code;
				uni.showToast({ title: res.message || '验证码已发送', icon:'none' });
			} catch (err) {
				uni.showToast({ title: err.message || '发送失败', icon:'none' });
			}
		},
		async submitBind() {
			if (!this.form.phone || (!this.form.password && !this.form.smsCode)) {
				uni.showToast({ title:'请输入手机号和密码或验证码', icon:'none' });
				return;
			}
			try {
				await bindStudent({ ...this.form });
				uni.showToast({ title:'绑定成功', icon:'success' });
				this.form.password = '';
				this.form.smsCode = '';
				await this.loadData();
			} catch (err) {
				uni.showToast({ title: err.message || '绑定失败', icon:'none' });
			}
		},
		goBack() { uni.navigateBack({ fail:()=>{} }); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; background:#f5f7fa; padding-bottom:40rpx; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; font-weight:700; }
.panel { margin:24rpx; padding:26rpx; background:#fff; border-radius:16rpx; border:1rpx solid #edf0f4; }
.panel-title { font-size:30rpx; font-weight:800; color:#222; margin-bottom:18rpx; }
.input { height:78rpx; border-radius:12rpx; background:#f3f6fa; padding:0 18rpx; font-size:27rpx; margin-top:14rpx; box-sizing:border-box; }
.code-row { display:flex; gap:14rpx; align-items:center; }
.code-input { flex:1; min-width:0; }
.code-btn { flex-shrink:0; height:78rpx; line-height:78rpx; margin-top:14rpx; padding:0 18rpx; border-radius:12rpx; background:#eef6ff; color:#1677ff; font-size:25rpx; font-weight:700; }
.primary { height:78rpx; line-height:78rpx; text-align:center; border-radius:12rpx; margin-top:18rpx; background:#1677ff; color:#fff; font-size:28rpx; font-weight:800; }
.empty { color:#8a94a3; font-size:26rpx; padding:24rpx 0; }
.student { display:flex; align-items:center; justify-content:space-between; padding:20rpx 0; border-bottom:1rpx solid #eef0f3; }
.student:last-child { border-bottom:0; }
.student-name { color:#222; font-size:28rpx; font-weight:800; }
.student-sub { margin-top:8rpx; color:#8a94a3; font-size:23rpx; }
.student-stat { flex-shrink:0; color:#1677ff; font-size:24rpx; font-weight:700; }
</style>
