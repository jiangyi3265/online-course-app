<template>
	<view class="page">
		<view class="tabs">
			<view v-for="(t,i) in tabs" :key="i" class="tab-item" :class="{active: activeTab===i}" @click="activeTab=i">{{t}}</view>
		</view>

		<scroll-view scroll-y class="list">
			<view class="row" v-for="(it,i) in currentList" :key="i" @click="goDetail(it)">
				<view class="cover" :class="{'clean-cover': !it.isTry}">
					<image v-if="it.cover && !it.coverError" class="cover-img" :src="it.cover" mode="aspectFit" @error="markCoverError(it)" />
					<view v-else class="cover-fallback">{{coverFallbackText(it)}}</view>
					<text class="course-tag">视频+考练</text>
					<view class="cover-clean-patch" v-if="!it.isTry"></view>
				</view>
				<view class="info">
					<view class="title">《{{it.full}}》{{it.suffix}}</view>
					<view class="sub" v-if="courseIntro(it)">{{courseIntro(it)}}</view>
					<view class="bottom">
						<view class="access" :class="{full: !it.isTry}">
							<text class="access-title">{{openLabel(it)}}</text>
							<text class="access-sub">{{openHint(it)}}</text>
						</view>
						<view class="go-btn" :class="goButtonClass(it)">{{goButtonText(it)}}</view>
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
import { GAOKAO_MATH_TRIAL, GAOKAO_MATH_FULL, stripCourseYear } from '@/common/course-data.js'
import { getCourses, resolveMediaUrl, isUsableMediaUrl } from '@/common/api.js'
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
					{ full:'中考语文', suffix:'试…', sub:'《中考语文》试听课', cover: ZK.yuwen, isTry:true },
					{ full:'中考数学', suffix:'试…', sub:'《中考数学》试听课', cover: ZK.shuxue, isTry:true },
					{ full:'中考英语', suffix:'试…', sub:'《中考英语》试听课', cover: ZK.yingyu, isTry:true },
					{ full:'中考物理', suffix:'试…', sub:'《中考物理》试听课', cover: ZK.wuli,   isTry:true },
					{ full:'中考化学', suffix:'试…', sub:'《中考化学》试听课', cover: ZK.huaxue, isTry:true }
				],
				1: [
					{ full:'中考语文', suffix:'', sub:'《中考语文》', cover: ZK.yuwen },
					{ full:'中考数学', suffix:'', sub:'《中考数学》', cover: ZK.shuxue },
					{ full:'中考英语', suffix:'', sub:'《中考英语》', cover: ZK.yingyu },
					{ full:'中考物理', suffix:'', sub:'《中考物理》', cover: ZK.wuli },
					{ full:'中考化学', suffix:'', sub:'《中考化学》', cover: ZK.huaxue }
				],
				2: [
					{ full:'高考语文', suffix:'试…', sub:'《高考语文》试听课', cover: GK.yuwen, isTry:true },
					{ full:'高考数学', suffix:'试…', sub:GAOKAO_MATH_TRIAL.courseName, cover: GAOKAO_MATH_TRIAL.cover, isTry:true, subject:'gaokao-math', kind:'trial' },
					{ full:'高考英语', suffix:'试…', sub:'《高考英语》试听课', cover: GK.yingyu, isTry:true },
					{ full:'高考物理', suffix:'试…', sub:'《高考物理》试听课', cover: GK.wuli, isTry:true },
					{ full:'高考化学', suffix:'试…', sub:'《高考化学》试听课', cover: GK.huaxue, isTry:true }
				],
				3: [
					{ full:'高考语文', suffix:'', sub:'《高考语文》', cover: GK.yuwen },
					{ full:'高考数学', suffix:'', sub:GAOKAO_MATH_FULL.introduction, cover: GAOKAO_MATH_FULL.cover, subject:'gaokao-math', kind:'full' },
					{ full:'高考英语', suffix:'', sub:'《高考英语》', cover: GK.yingyu },
					{ full:'高考物理', suffix:'', sub:'《高考物理》', cover: GK.wuli },
					{ full:'高考化学', suffix:'', sub:'《高考化学》', cover: GK.huaxue },
					{ full:'高考生物', suffix:'', sub:'《高考生物》', cover: GK.shengwu },
					{ full:'高考历史', suffix:'', sub:'《高考历史》', cover: GK.lishi },
					{ full:'高考政治', suffix:'', sub:'《高考政治》', cover: GK.zhengzhi },
					{ full:'高考地理', suffix:'', sub:'《高考地理》', cover: GK.dili }
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
						full: stripCourseYear(item.full),
						suffix: item.isTry ? '试听课' : '',
						sub: stripCourseYear(item.sub),
						intro: stripCourseYear(item.introduction || item.intro || item.description || ''),
						cover: this.safeMediaUrl(item.cover),
						coverError: false,
						isTry: item.isTry,
						available: !!(item.available || item.activated || item.hasAccess),
						subject: item.subject,
						kind: item.kind
					}));
				});
			} catch (err) {
				console.warn('课程分类接口不可用，使用本地课程数据', err);
			}
		},
		openLabel(it) {
			if (!it.isTry && it.available) return '已激活';
			return it.isTry ? '试听免费' : '激活课程';
		},
		openHint(it) {
			if (!it.isTry && it.available) return '可直接学习';
			return it.isTry ? '直接体验' : '验证后学习';
		},
		courseIntro(it = {}) {
			const intro = stripCourseYear(it.intro || '');
			const sub = stripCourseYear(it.sub || '');
			if (intro && intro !== `《${stripCourseYear(it.full || '')}》`) return intro;
			return sub;
		},
		markCoverError(item = {}) {
			this.$set ? this.$set(item, 'coverError', true) : (item.coverError = true);
		},
		safeMediaUrl(url = '', fallback = '') {
			const resolved = resolveMediaUrl(url);
			return isUsableMediaUrl(resolved) ? resolved : fallback;
		},
		coverFallbackText(it = {}) {
			return stripCourseYear(it.full || it.sub || '课程').replace(/[《》]/g, '').slice(0, 4) || '课程';
		},
		goButtonText(it) {
			if (it.isTry) return '去体验';
			return it.available ? '去学习' : '去开通';
		},
		goButtonClass(it) {
			if (it.isTry) return 'trial';
			return it.available ? 'active' : 'locked';
		},
		goDetail(it) {
			const idPart = it.id ? `id=${encodeURIComponent(it.id)}&` : '';
			const extra = it.subject ? `&subject=${it.subject}&kind=${it.kind || (it.isTry ? 'trial' : 'full')}` : '';
			const url = it.isTry
				? `/pages/course-detail/course-detail?${idPart}title=${encodeURIComponent(stripCourseYear(it.full))}&cover=${encodeURIComponent(it.cover || '')}${extra}`
				: `/pages/course-full/course-full?${idPart}title=${encodeURIComponent(stripCourseYear(it.full))}&cover=${encodeURIComponent(it.cover || '')}${extra}`;
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
.cover-img { width:100%; height:100%; display:block; object-fit:contain; background:#f8fafc; }
.cover-img :deep(div) { background-size:contain !important; background-repeat:no-repeat !important; background-position:center center !important; }
.cover-fallback {
	width:100%;
	height:100%;
	display:flex;
	align-items:center;
	justify-content:center;
	background:linear-gradient(135deg,#e8f3ff,#f8fafc);
	color:#1677ff;
	font-size:30rpx;
	font-weight:900;
	text-align:center;
	line-height:1.2;
}
.course-tag { position:absolute; left:0; bottom:0; background:rgba(0,0,0,.5); color:#fff; font-size:20rpx; padding:6rpx 12rpx; border-top-right-radius:8rpx; }
.cover-clean-patch {
	position:absolute;
	top:0;
	right:0;
	width:92rpx;
	height:44rpx;
	background:linear-gradient(135deg, rgba(255,255,255,.78), rgba(255,255,255,.18));
	border-bottom-left-radius:18rpx;
	backdrop-filter: blur(2rpx);
}
.info { flex:1; margin-left:24rpx; display:flex; flex-direction:column; justify-content:space-between; min-width:0; }
.title { font-size:26rpx; font-weight:700; color:rgba(0,0,0,0.9); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sub { font-size:24rpx; color:#666; margin-top:6rpx; }
.bottom { display:flex; align-items:center; justify-content:space-between; margin-top:auto; padding-right:32rpx; }
.access { display:flex; flex-direction:column; justify-content:center; min-width:128rpx; }
.access-title { color:#0d7cfe; font-weight:700; font-size:25rpx; line-height:1.2; }
.access.full .access-title { color:#2bb673; }
.access-sub { color:#8a94a3; font-size:21rpx; margin-top:5rpx; }
.go-btn { flex-shrink:0; min-width:112rpx; box-sizing:border-box; text-align:center; background:#1890e1; color:#fff; font-size:24rpx; padding:10rpx 28rpx; border-radius:30rpx; box-shadow:0 4rpx 10rpx rgba(24,144,225,0.35); cursor:pointer; }
.go-btn.active { background:#18a66a; box-shadow:0 4rpx 10rpx rgba(24,166,106,0.28); }
.go-btn.locked { background:#f59e0b; box-shadow:0 4rpx 10rpx rgba(245,158,11,0.28); }
.go-btn.trial { background:#1890e1; }
.end-tip { text-align:center; color:#bcc1c8; font-size:24rpx; padding:50rpx 0 20rpx; }
</style>
