<template>
	<view class="page">
		<view class="tabs">
			<view v-for="(t,i) in tabs" :key="i" class="tab-item" :class="{active: activeTab===i}" @click="activeTab=i">{{t}}</view>
		</view>

		<scroll-view scroll-y class="list">
			<view class="row" v-for="(it,i) in currentList" :key="i" @click="goDetail(it)">
				<view class="cover">
					<image class="cover-img" :src="it.cover" mode="aspectFill" />
					<text class="course-tag">视频+考练</text>
				</view>
				<view class="info">
					<view class="title">《{{it.full}}》{{it.suffix}}</view>
					<view class="sub">{{it.sub}}</view>
					<view class="bottom">
						<view class="access" :class="{full: !it.isTry}">
							<text class="access-title">{{openLabel(it)}}</text>
							<text class="access-sub">{{openHint(it)}}</text>
						</view>
						<view class="go-btn">{{it.isTry ? '去体验' : '去开通'}}</view>
					</view>
				</view>
			</view>
			<view class="end-tip">—暂无更多课程—</view>
			<view style="height:140rpx"></view>
		</scroll-view>

		<tab-bar active="home" />
	</view>
</template>

<script>
import TabBar from '@/components/tab-bar.vue'
import { GAOKAO_MATH_TRIAL, GAOKAO_MATH_FULL } from '@/common/course-data.js'
import { getCourses } from '@/common/api.js'
const ZK = {
	yuwen:'/static/courses/zk-yuwen.jpg', shuxue:'/static/courses/zk-shuxue.jpg',
	yingyu:'/static/courses/zk-yingyu.jpg', wuli:'/static/courses/zk-wuli.jpg',
	huaxue:'/static/courses/zk-huaxue.jpg'
};
const GK = {
	yuwen:'/static/courses/gk-yuwen.jpg', shuxue:'/static/courses/gk-shuxue.jpg',
	yingyu:'/static/courses/gk-yingyu.jpg', wuli:'/static/courses/gk-wuli.jpg',
	huaxue:'/static/courses/gk-huaxue.jpg', shengwu:'/static/courses/gk-huaxue.jpg',
	lishi:'/static/courses/gk-dili-full.jpg', zhengzhi:'/static/courses/gk-dili-full.jpg',
	dili:'/static/courses/gk-dili-full.jpg'
};
export default {
	components: { TabBar },
	data() {
		return {
			activeTab: 0,
			tabs: ['中考试听','中考课程','高考试听','高考课程'],
			data: {
				0: [
					{ full:'中考语文2026', suffix:'试…', sub:'《中考语文2026》试听课', cover: ZK.yuwen, isTry:true },
					{ full:'中考数学2026', suffix:'试…', sub:'《中考数学2026》试听课', cover: ZK.shuxue, isTry:true },
					{ full:'中考英语2026', suffix:'试…', sub:'《中考英语2026》试听课', cover: ZK.yingyu, isTry:true },
					{ full:'中考物理2026', suffix:'试…', sub:'《中考物理2026》试听课', cover: ZK.wuli,   isTry:true },
					{ full:'中考化学2026', suffix:'试…', sub:'《中考化学2026》试听课', cover: ZK.huaxue, isTry:true }
				],
				1: [
					{ full:'中考语文2026', suffix:'', sub:'《中考语文》2026', cover: ZK.yuwen },
					{ full:'中考数学2026', suffix:'', sub:'《中考数学》2026', cover: ZK.shuxue },
					{ full:'中考英语2026', suffix:'', sub:'《中考英语》2026', cover: ZK.yingyu },
					{ full:'中考物理2026', suffix:'', sub:'《中考物理》2026', cover: ZK.wuli },
					{ full:'中考化学2026', suffix:'', sub:'《中考化学》2026', cover: ZK.huaxue }
				],
				2: [
					{ full:'高考语文2026', suffix:'试…', sub:'《高考语文2026》试听课', cover: GK.yuwen, isTry:true },
					{ full:'高考数学2026', suffix:'试…', sub:GAOKAO_MATH_TRIAL.courseName, cover: GAOKAO_MATH_TRIAL.cover, isTry:true, subject:'gaokao-math', kind:'trial' },
					{ full:'高考英语2026', suffix:'试…', sub:'《高考英语2026》试听课', cover: GK.yingyu, isTry:true },
					{ full:'高考物理2026', suffix:'试…', sub:'《高考物理2026》试听课', cover: GK.wuli, isTry:true },
					{ full:'高考化学2026', suffix:'试…', sub:'《高考化学2026》试听课', cover: GK.huaxue, isTry:true }
				],
				3: [
					{ full:'高考语文2026', suffix:'', sub:'《高考语文》2026', cover: GK.yuwen },
					{ full:'高考数学2026', suffix:'', sub:GAOKAO_MATH_FULL.introduction, cover: GAOKAO_MATH_FULL.cover, subject:'gaokao-math', kind:'full' },
					{ full:'高考英语2026', suffix:'', sub:'《高考英语》2026', cover: GK.yingyu },
					{ full:'高考物理2026', suffix:'', sub:'《高考物理》2026', cover: GK.wuli },
					{ full:'高考化学2026', suffix:'', sub:'《高考化学》2026', cover: GK.huaxue },
					{ full:'高考生物2026', suffix:'', sub:'《高考生物》2026', cover: GK.shengwu },
					{ full:'高考历史2026', suffix:'', sub:'《高考历史》2026', cover: GK.lishi },
					{ full:'高考政治2026', suffix:'', sub:'《高考政治》2026', cover: GK.zhengzhi },
					{ full:'高考地理2026', suffix:'', sub:'《高考地理》2026', cover: GK.dili }
				]
			}
		}
	},
	computed: { currentList() { return this.data[this.activeTab] || []; } },
	onLoad(opts) {
		if (opts && opts.tab) this.activeTab = Math.max(0, Math.min(3, parseInt(opts.tab)-1));
		this.loadTabs();
	},
	methods: {
		async loadTabs() {
			try {
				const tabs = await Promise.all([0, 1, 2, 3].map(tab => getCourses({ tab })));
				tabs.forEach((list, tab) => {
					this.data[tab] = list.map(item => ({
						id: item.id,
						full: item.full,
						suffix: item.isTry ? '试听课' : '',
						sub: item.sub,
						cover: item.cover,
						isTry: item.isTry,
						subject: item.subject,
						kind: item.kind
					}));
				});
			} catch (err) {
				console.warn('课程分类接口不可用，使用本地课程数据', err);
			}
		},
		openLabel(it) {
			return it.isTry ? '试听免费' : '激活课程';
		},
		openHint(it) {
			return it.isTry ? '直接体验' : '验证后学习';
		},
		goDetail(it) {
			const idPart = it.id ? `id=${encodeURIComponent(it.id)}&` : '';
			const extra = it.subject ? `&subject=${it.subject}&kind=${it.kind || (it.isTry ? 'trial' : 'full')}` : '';
			const url = it.isTry
				? `/pages/course-detail/course-detail?${idPart}title=${encodeURIComponent(it.full.replace('2026',''))}&cover=${encodeURIComponent(it.cover)}${extra}`
				: `/pages/course-full/course-full?${idPart}title=${encodeURIComponent(it.full.replace('2026',''))}&cover=${encodeURIComponent(it.cover)}${extra}`;
			uni.navigateTo({ url });
		}
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; padding-bottom:130rpx; background:#f5f7fa; display:flex; flex-direction:column; }
.tabs { display:flex; padding: 30rpx 30rpx 20rpx; background:#fff; }
.tab-item { margin-right:50rpx; font-size:28rpx; color:#b6b9c0; font-weight:500; padding:8rpx 0; cursor:pointer; }
.tab-item.active { color: rgba(0,0,0,0.9); font-size:30rpx; font-weight:700; }
.list { flex:1; padding: 10rpx 24rpx; }
.row { display:flex; background:#fff; border-radius:16rpx; padding:20rpx; margin-bottom:24rpx; box-shadow:0 4rpx 12rpx rgba(0,0,0,0.04); cursor:pointer; }
.cover { width:220rpx; height:160rpx; border-radius:12rpx; overflow:hidden; flex-shrink:0; position:relative; }
.cover-img { width:100%; height:100%; display:block; }
.course-tag { position:absolute; left:0; bottom:0; background:rgba(0,0,0,.5); color:#fff; font-size:20rpx; padding:6rpx 12rpx; border-top-right-radius:8rpx; }
.info { flex:1; margin-left:24rpx; display:flex; flex-direction:column; justify-content:space-between; min-width:0; }
.title { font-size:26rpx; font-weight:700; color:rgba(0,0,0,0.9); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sub { font-size:24rpx; color:#666; margin-top:6rpx; }
.bottom { display:flex; align-items:center; justify-content:space-between; margin-top:auto; padding-right:32rpx; }
.access { display:flex; flex-direction:column; justify-content:center; min-width:128rpx; }
.access-title { color:#0d7cfe; font-weight:700; font-size:25rpx; line-height:1.2; }
.access.full .access-title { color:#2bb673; }
.access-sub { color:#8a94a3; font-size:21rpx; margin-top:5rpx; }
.go-btn { flex-shrink:0; min-width:112rpx; box-sizing:border-box; text-align:center; background:#1890e1; color:#fff; font-size:24rpx; padding:10rpx 28rpx; border-radius:30rpx; box-shadow:0 4rpx 10rpx rgba(24,144,225,0.35); cursor:pointer; }
.end-tip { text-align:center; color:#bcc1c8; font-size:24rpx; padding:50rpx 0 20rpx; }
</style>
