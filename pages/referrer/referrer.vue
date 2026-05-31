<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">我的推荐人</view></view>

		<view class="hero">
			<view>
				<view class="hero-title">推荐人绑定</view>
				<view class="hero-sub">绑定成功后，你会自动出现在推荐人的【我的学生】里。</view>
			</view>
			<view class="hero-mark">👥</view>
		</view>

		<view class="card bound-card" v-if="referrer && referrer.id">
			<view class="card-label">已绑定推荐人</view>
			<view class="ref-name">{{referrer.name || '推荐人'}}</view>
			<view class="info-row"><text>推荐人 ID</text><strong>{{referrer.id || '--'}}</strong></view>
			<view class="info-row"><text>手机号</text><strong>{{referrer.phone || '--'}}</strong></view>
			<view class="permission-box">
				<view class="permission-title">权限说明</view>
				<view class="permission-line">推荐人可在【我的学生】查看你的学情统计。</view>
				<view class="permission-line">推荐人不能编辑打卡、错题、文档或你的个人资料。</view>
			</view>
		</view>

		<view class="card" v-else>
			<view class="card-label">填写推荐人信息</view>
			<input class="input" v-model.trim="form.phone" type="number" maxlength="11" placeholder="输入推荐人手机号" />
			<input class="input" v-model.trim="form.referrerId" placeholder="输入推荐人 ID" />
			<view class="hint">绑定后推荐人只拥有查看权限，不会获得编辑、解除或代填学习打卡的权限。</view>
			<view class="primary" :class="{disabled: loading}" @click="submitBind">{{loading ? '绑定中...' : '确认绑定'}}</view>
		</view>
	</view>
</template>

<script>
import { bindReferrer, getMyReferrer } from '@/common/api.js'

export default {
	data() {
		return {
			referrer: null,
			loading: false,
			form: { phone: '', referrerId: '' }
		}
	},
	onShow() {
		this.loadData();
	},
	methods: {
		async loadData() {
			try {
				this.referrer = await getMyReferrer();
			} catch (err) {
				this.referrer = null;
			}
		},
		async submitBind() {
			if (this.loading) return;
			if (!/^1\d{10}$/.test(this.form.phone)) {
				uni.showToast({ title:'请输入正确手机号', icon:'none' });
				return;
			}
			if (!this.form.referrerId) {
				uni.showToast({ title:'请输入推荐人 ID', icon:'none' });
				return;
			}
			this.loading = true;
			try {
				this.referrer = await bindReferrer({ phone: this.form.phone, referrerId: this.form.referrerId });
				uni.showToast({ title:'绑定成功', icon:'success' });
			} catch (err) {
				uni.showToast({ title: err.message || '绑定失败', icon:'none' });
			} finally {
				this.loading = false;
			}
		},
		goBack() { uni.navigateBack({ fail:()=>uni.switchTab({ url:'/pages/member/member', fail:()=>{} }) }); }
	}
}
</script>

<style lang="scss">
page { background:#f6f8fb; }
.page { min-height:100vh; background:#f6f8fb; padding-bottom:40rpx; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; font-weight:800; color:#1f2933; }
.hero { margin:24rpx; padding:30rpx; border-radius:16rpx; background:linear-gradient(135deg,#eef7ff 0%, #f7fbff 100%); border:1rpx solid #dcecff; display:flex; align-items:center; justify-content:space-between; gap:24rpx; box-sizing:border-box; }
.hero-title { color:#1f2933; font-size:34rpx; font-weight:900; line-height:1.25; }
.hero-sub { margin-top:10rpx; color:#526071; font-size:24rpx; line-height:1.45; }
.hero-mark { width:86rpx; height:86rpx; border-radius:18rpx; display:flex; align-items:center; justify-content:center; background:#fff; font-size:46rpx; flex-shrink:0; box-shadow:0 8rpx 18rpx rgba(22,119,255,.08); }
.card { margin:0 24rpx 24rpx; padding:30rpx; background:#fff; border:1rpx solid #e8edf3; border-radius:16rpx; box-shadow:0 8rpx 22rpx rgba(16,24,40,.04); box-sizing:border-box; }
.card-label { color:#667085; font-size:24rpx; font-weight:800; margin-bottom:16rpx; }
.ref-name { color:#1f2933; font-size:36rpx; font-weight:900; margin-bottom:20rpx; }
.info-row { min-height:70rpx; display:flex; align-items:center; justify-content:space-between; gap:18rpx; border-top:1rpx solid #eef2f7; color:#667085; font-size:25rpx; }
.info-row strong { color:#1f2933; font-size:26rpx; font-weight:900; }
.permission-box { margin-top:22rpx; padding:22rpx; border-radius:12rpx; background:#f8fafc; border:1rpx solid #edf1f6; }
.permission-title { color:#1f2933; font-size:26rpx; font-weight:900; margin-bottom:10rpx; }
.permission-line { color:#667085; font-size:24rpx; line-height:1.55; }
.input { height:84rpx; border-radius:12rpx; background:#f5f7fa; border:1rpx solid #edf1f6; padding:0 20rpx; font-size:27rpx; margin-top:14rpx; box-sizing:border-box; }
.hint { margin-top:18rpx; color:#667085; font-size:24rpx; line-height:1.55; }
.primary { height:84rpx; line-height:84rpx; text-align:center; border-radius:12rpx; margin-top:24rpx; background:#1677ff; color:#fff; font-size:28rpx; font-weight:900; }
.primary.disabled { background:#9dbff5; }

/* Desktop referrer information polish */
page { background:#eef3f7; }
.page {
	background:linear-gradient(180deg, #f9fbfd 0%, #eef3f7 340rpx, #eef3f7 100%);
	color:#17212f;
}
.nav {
	position:sticky;
	top:0;
	z-index:20;
	height:92rpx;
	background:rgba(251,253,255,.96);
	backdrop-filter:saturate(140%) blur(10px);
	border-bottom:1rpx solid #e4eaf1;
}
.hero {
	display:none;
}
.card {
	margin:22rpx 24rpx 24rpx;
	padding:0;
	border-radius:20rpx;
	border-color:#dfe7f0;
	overflow:hidden;
	box-shadow:0 12rpx 28rpx rgba(31,41,51,.045);
}
.card-label {
	margin:0;
	padding:20rpx 28rpx;
	background:#f8fafc;
	border-bottom:1rpx solid #edf2f7;
	color:#64748b;
	text-align:center;
	font-size:22rpx;
}
.ref-name {
	margin:0;
	padding:30rpx 30rpx 10rpx;
	color:#111827;
	font-size:34rpx;
}
.info-row {
	min-height:88rpx;
	padding:0 30rpx;
	border-top:1rpx solid #edf2f7;
	color:#1f2937;
	font-size:27rpx;
}
.info-row strong {
	color:#667085;
	font-size:27rpx;
	font-weight:700;
}
.permission-box {
	margin:26rpx 30rpx 30rpx;
	border-radius:16rpx;
	background:#f6f9fd;
	border-color:#e5ecf4;
}
.input {
	margin:16rpx 30rpx 0;
	width:auto;
	border-radius:14rpx;
}
.hint {
	margin:20rpx 30rpx 0;
}
.primary {
	margin:24rpx 30rpx 30rpx;
	border-radius:14rpx;
	background:#1769ff;
	box-shadow:0 10rpx 22rpx rgba(23,105,255,.16);
}
</style>
