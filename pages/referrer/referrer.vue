<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">我的推荐人</view></view>

		<view class="card" v-if="referrer && referrer.id">
			<view class="card-label">已绑定推荐人</view>
			<view class="ref-name">{{referrer.name || '推荐人'}}</view>
			<view class="ref-line">推荐人 ID：{{referrer.id || '--'}}</view>
			<view class="ref-line">手机号：{{referrer.phone || '--'}}</view>
		</view>

		<view class="card" v-else>
			<view class="card-label">绑定推荐人</view>
			<input class="input" v-model.trim="form.phone" type="number" maxlength="11" placeholder="输入推荐人手机号" />
			<input class="input" v-model.trim="form.referrerId" placeholder="输入推荐人 ID" />
			<view class="primary" @click="submitBind">确认绑定</view>
		</view>
	</view>
</template>

<script>
import { bindReferrer, getMyReferrer } from '@/common/api.js'

const LOCAL_KEY = 'localReferrer'

export default {
	data() {
		return {
			referrer: null,
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
				this.referrer = uni.getStorageSync(LOCAL_KEY) || null;
			}
		},
		async submitBind() {
			if (!/^1\d{10}$/.test(this.form.phone)) {
				uni.showToast({ title:'请输入正确手机号', icon:'none' });
				return;
			}
			if (!this.form.referrerId) {
				uni.showToast({ title:'请输入推荐人 ID', icon:'none' });
				return;
			}
			try {
				this.referrer = await bindReferrer({ phone: this.form.phone, referrerId: this.form.referrerId });
			} catch (err) {
				this.referrer = { id: this.form.referrerId, phone: this.form.phone, name: '推荐人' };
				uni.setStorageSync(LOCAL_KEY, this.referrer);
			}
			uni.showToast({ title:'绑定成功', icon:'success' });
		},
		goBack() { uni.navigateBack({ fail:()=>uni.switchTab({ url:'/pages/member/member', fail:()=>{} }) }); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; background:#f5f7fa; padding-bottom:40rpx; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; font-weight:700; }
.card { margin:24rpx; padding:30rpx; background:#fff; border:1rpx solid #edf0f4; border-radius:16rpx; }
.card-label { color:#697386; font-size:24rpx; font-weight:700; margin-bottom:16rpx; }
.ref-name { color:#222; font-size:36rpx; font-weight:900; margin-bottom:14rpx; }
.ref-line { color:#596272; font-size:28rpx; line-height:1.7; }
.input { height:82rpx; border-radius:12rpx; background:#f3f6fa; padding:0 18rpx; font-size:27rpx; margin-top:14rpx; box-sizing:border-box; }
.primary { height:80rpx; line-height:80rpx; text-align:center; border-radius:12rpx; margin-top:22rpx; background:#1677ff; color:#fff; font-size:28rpx; font-weight:800; }
</style>
