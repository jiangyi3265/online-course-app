<template>
	<view class="page">
		<!-- Hero Banner (real asset) -->
		<view class="banner">
			<image class="banner-img" src="/static/home-banner.png" mode="widthFix" />
		</view>

		<!-- 4 categories -->
		<view class="cats">
			<view class="cat" v-for="(c,i) in cats" :key="i" @click="goTab(i)">
				<image class="cat-img" :src="c.icon" mode="aspectFit" />
				<text class="cat-text">{{c.text}}</text>
			</view>
		</view>

		<view class="tool-strip">
			<view class="tool-card" @click="goVocabulary">
				<view class="tool-mark">Aa</view>
				<view class="tool-info">
					<view class="tool-title">外语词汇</view>
					<view class="tool-sub">英语单词工具</view>
				</view>
				<view class="tool-arrow">›</view>
			</view>
		</view>

		<!-- 课程网格 -->
		<view class="grid">
			<view class="card" v-for="(it,i) in list" :key="i" @click="goDetail(it)">
				<view class="cover">
					<image class="cover-img" :src="it.cover" mode="aspectFill" />
					<text class="course-tag">视频+考练</text>
				</view>
				<view class="info">
					<view class="title">《{{it.full}}》试听课</view>
					<view class="sub">《{{it.full}}》试听课</view>
					<view class="learn">{{it.learn}}人学习</view>
					<view class="access-row">
						<text class="access-chip">{{accessLabel(it)}}</text>
						<text class="access-note">{{accessNote(it)}}</text>
					</view>
				</view>
			</view>
		</view>

		<view style="height:140rpx"></view>

		<tab-bar active="home" />
	</view>
</template>

<script>
import TabBar from '@/components/tab-bar.vue'
import { GAOKAO_MATH_TRIAL, stripCourseYear } from '@/common/course-data.js'
import { getCourses } from '@/common/api.js'
export default {
	components: { TabBar },
	data() {
		return {
			cats: [
				{ icon:'/static/cats/1.png', text:'中考试听' },
				{ icon:'/static/cats/2.png', text:'中考课程' },
				{ icon:'/static/cats/3.png', text:'高考试听' },
				{ icon:'/static/cats/4.png', text:'高考课程' }
			],
			list: [
				{ full:'中考语文', learn:1086, cover:'/static/courses/zk-yuwen.jpg', kind:'trial', isTry:true },
				{ full:'中考数学', learn:1456, cover:'/static/courses/zk-shuxue.jpg', kind:'trial', isTry:true },
				{ full:'中考英语', learn:1289, cover:'/static/courses/zk-yingyu.jpg', kind:'trial', isTry:true },
				{ full:'中考物理', learn:1176, cover:'/static/courses/zk-wuli.jpg', kind:'trial', isTry:true },
				{ full:'中考化学', learn:1237, cover:'/static/courses/zk-huaxue.jpg', kind:'trial', isTry:true },
				{ full:'高考语文', learn:1078, cover:'/static/courses/gk-yuwen.jpg', kind:'trial', isTry:true },
				{ full:'高考数学', learn:GAOKAO_MATH_TRIAL.studyCount, cover:GAOKAO_MATH_TRIAL.cover, subject:'gaokao-math', kind:'trial', isTry:true },
				{ full:'高考英语', learn:1360, cover:'/static/courses/gk-yingyu.jpg', kind:'trial', isTry:true },
				{ full:'高考物理', learn:1121, cover:'/static/courses/gk-wuli.jpg', kind:'trial', isTry:true },
				{ full:'高考化学', learn:980,  cover:'/static/courses/gk-huaxue.jpg', kind:'trial', isTry:true }
			]
		}
	},
	onLoad() {
		this.loadCourses();
	},
	methods: {
		async loadCourses() {
			try {
				const courses = await getCourses({ kind: 'trial' });
				if (!courses || !courses.length) return;
				this.list = courses.map(item => ({
					id: item.id,
					full: stripCourseYear(item.full),
					learn: item.studyCount || item.learn || 0,
					cover: item.cover,
					subject: item.subject,
					kind: item.kind,
					isTry: item.isTry
				}));
			} catch (err) {
				console.warn('课程接口不可用，使用本地课程数据', err);
			}
		},
		accessLabel(it) {
			return it.kind === 'full' || it.isTry === false ? '激活课程' : '试听免费';
		},
		accessNote(it) {
			return it.kind === 'full' || it.isTry === false ? '验证后学习' : '直接体验';
		},
		goVocabulary() { uni.navigateTo({ url:'/pages/vocabulary/vocabulary' }); },
		goTab(i) { uni.navigateTo({ url:`/pages/index/testIndex?tab=${i+1}` }); },
		goDetail(it) {
			const idPart = it.id ? `id=${encodeURIComponent(it.id)}&` : '';
			const extra = it.subject ? `&subject=${it.subject}&kind=${it.kind || 'trial'}` : '';
			uni.navigateTo({ url:`/pages/course-detail/course-detail?${idPart}title=${encodeURIComponent(stripCourseYear(it.full))}&cover=${encodeURIComponent(it.cover)}${extra}` });
		}
	}
}
</script>

<style lang="scss">
page { background:#f7f8fa; }
.page { padding-bottom:130rpx; background:#f7f8fa; min-height:100vh; }

.banner { padding: 20rpx 24rpx 8rpx; }
.banner-img { width:100%; display:block; border-radius:14rpx; }

.cats { display:flex; justify-content:space-around; padding:24rpx 0 14rpx; background:#f7f8fa; }
.cat { display:flex; flex-direction:column; align-items:center; cursor:pointer; }
.cat-img { width:96rpx; height:96rpx; margin-bottom:14rpx; }
.cat-text { font-size:30rpx; color:rgba(0,0,0,0.9); font-weight:700; }
.tool-strip { padding:12rpx 20rpx 0; }
.tool-card { min-height:118rpx; background:#fff; border:1rpx solid #edf0f4; border-radius:16rpx; display:flex; align-items:center; padding:0 24rpx; box-shadow:0 4rpx 12rpx rgba(0,0,0,0.04); cursor:pointer; }
.tool-mark { width:74rpx; height:74rpx; border-radius:16rpx; background:#eaf4ff; color:#0d7cfe; display:flex; align-items:center; justify-content:center; font-size:28rpx; font-weight:900; margin-right:18rpx; }
.tool-info { flex:1; min-width:0; }
.tool-title { color:#222; font-size:30rpx; font-weight:800; }
.tool-sub { margin-top:6rpx; color:#697386; font-size:24rpx; }
.tool-arrow { color:#b5bdc8; font-size:42rpx; }

.grid { display:flex; flex-wrap:wrap; justify-content:space-between; padding:20rpx; }
.card { width:48.5%; background:#fff; border-radius:16rpx; margin-bottom:24rpx; overflow:hidden; box-shadow:0 4rpx 12rpx rgba(0,0,0,0.04); cursor:pointer; }
.cover { width:100%; height:200rpx; overflow:hidden; position:relative; }
.cover-img { width:100%; height:100%; display:block; }
.course-tag { position:absolute; left:0; bottom:0; background:rgba(0,0,0,.5); color:#fff; font-size:22rpx; padding:8rpx 14rpx; border-top-right-radius:8rpx; }
.info { padding:16rpx 18rpx 22rpx; }
.title { font-size:26rpx; color:rgba(0,0,0,0.9); font-weight:700; }
.sub { font-size:24rpx; color:#666; margin-top:6rpx; }
.learn { display:inline-block; font-size:22rpx; color:#0d7cfe; background:#eaf0ff; padding:4rpx 14rpx; border-radius:6rpx; margin-top:14rpx; }
.access-row { margin-top:14rpx; display:flex; align-items:center; flex-wrap:wrap; gap:10rpx; }
.access-chip { color:#0d7cfe; background:#eaf4ff; font-weight:700; font-size:24rpx; padding:6rpx 14rpx; border-radius:8rpx; }
.access-note { color:#8a94a3; font-size:22rpx; }
</style>
