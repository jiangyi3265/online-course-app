<template>
	<view class="page">
		<!-- Hero Banner -->
		<view class="banner">
			<swiper class="banner-swiper" circular autoplay interval="3500" duration="450" indicator-dots indicator-color="rgba(255,255,255,.65)" indicator-active-color="#1677ff">
				<swiper-item v-for="item in homeBanners" :key="item.id || item.imageUrl">
					<image class="banner-img" :src="item.imageUrl" mode="aspectFill" @click="openBanner(item)" @error.stop="onBannerError(item)" />
				</swiper-item>
			</swiper>
		</view>

		<!-- 4 categories -->
		<view class="cats">
			<view class="cat" v-for="(c,i) in cats" :key="i" @click="goTab(i)">
				<view class="cat-icon" :class="'cat-tone-' + (i + 1)">
					<text class="cat-icon-letter">{{catSymbol(c, i)}}</text>
				</view>
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
					<image v-if="it.cover && !it.coverError" class="cover-img" :src="it.cover" mode="aspectFill" @error.stop="onCourseCoverError(it)" />
					<view v-else class="cover-fallback">{{coverFallbackText(it)}}</view>
					<text class="course-tag">视频+考练</text>
				</view>
				<view class="info">
					<view class="title">《{{it.full}}》试听课</view>
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
import { getCourses, getFrontendSettings, resolveMediaList } from '@/common/api.js'
export default {
	components: { TabBar },
	data() {
		return {
			cats: [
				{ icon:'', iconError:true, symbol:'听', text:'中考试听' },
				{ icon:'', iconError:true, symbol:'课', text:'中考课程' },
				{ icon:'', iconError:true, symbol:'听', text:'高考试听' },
				{ icon:'', iconError:true, symbol:'课', text:'高考课程' }
			],
			homeBanners: [
				{ id:'default', imageUrl:'/static/home-banner.png', linkUrl:'' }
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
		this.syncBrowserTitle();
		this.loadFrontendSettings();
		this.loadCourses();
	},
	onShow() {
		this.syncBrowserTitle();
	},
	methods: {
		syncBrowserTitle() {
			if (typeof uni !== 'undefined' && uni.setNavigationBarTitle) {
				uni.setNavigationBarTitle({ title: '元知智学' });
			}
			if (typeof document !== 'undefined') document.title = '元知智学';
		},
		async loadFrontendSettings() {
			try {
				const settings = await getFrontendSettings();
				const banners = this.bannerItems(settings && settings.homeBanners);
				const usableBanners = banners
					.map((item, index) => ({
						...item,
						id: item.id || `banner-${index}`,
						imageUrl: this.firstMediaUrl([item.imageUrl, item.url, item.image, item.src, item.cover]),
						imageError: false
					}))
					.filter(item => item.imageUrl);
				if (usableBanners.length) this.homeBanners = usableBanners;
				else this.homeBanners = [{ id:'default', imageUrl:'/static/home-banner.png', linkUrl:'' }];
			} catch (err) {
				console.warn('前端配置接口不可用，使用默认首页图', err);
			}
		},
		async loadCourses() {
			try {
				const courses = await getCourses({ kind: 'trial' });
				if (!courses || !courses.length) return;
				this.list = courses.map(item => ({
					id: item.id,
					full: stripCourseYear(item.full),
					learn: item.studyCount || item.learn || 0,
					cover: this.firstMediaUrl([item.cover, item.coverUrl, item.imageUrl, item.image, item.thumbnail]),
					coverError: false,
					subject: item.subject,
					kind: item.kind,
					isTry: item.isTry
				}));
			} catch (err) {
				console.warn('课程接口不可用，使用本地课程数据', err);
			}
		},
		openBanner(item = {}) {
			const url = String(item.linkUrl || '').trim();
			if (!url) return;
			if (/^https?:\/\//i.test(url)) {
				if (typeof window !== 'undefined') window.location.href = url;
				return;
			}
			uni.navigateTo({ url, fail: () => uni.switchTab({ url, fail: () => uni.redirectTo({ url }) }) });
		},
		onBannerError(item = {}) {
			item.imageUrl = '/static/home-banner.png';
			item.imageError = true;
		},
		firstMediaUrl(values = [], fallback = '') {
			return resolveMediaList(values)[0] || fallback;
		},
		bannerItems(value) {
			if (Array.isArray(value)) return value.map(item => typeof item === 'string' ? { imageUrl: item } : item).filter(Boolean);
			if (!value) return [];
			if (typeof value === 'object') return [value];
			try {
				const parsed = JSON.parse(String(value));
				return this.bannerItems(parsed);
			} catch (err) {
				return [{ imageUrl: value }];
			}
		},
		onCatIconError(item = {}) {
			if (this.$set) this.$set(item, 'iconError', true);
			else item.iconError = true;
		},
		catIconSrc(item = {}) {
			return resolveMediaUrl(item.icon || '');
		},
		onCourseCoverError(item = {}) {
			if (this.$set) this.$set(item, 'coverError', true);
			else item.coverError = true;
		},
		catFallbackText(item = {}) {
			const text = String(item.text || '');
			if (text.includes('中考')) return '中';
			if (text.includes('高考')) return '高';
			return text.slice(0, 1) || '课';
		},
		catSymbol(item = {}, index = 0) {
			return item.symbol || this.catFallbackText(item) || String(index + 1);
		},
		coverFallbackText(item = {}) {
			const text = String(item.full || item.title || '').replace(/[《》]/g, '');
			if (text.includes('中考')) return '中考';
			if (text.includes('高考')) return '高考';
			return text.slice(0, 2) || '课程';
		},
		accessLabel(it) {
			return it.kind === 'full' || it.isTry === false ? '激活课程' : '试听免费';
		},
		accessNote(it) {
			return it.kind === 'full' || it.isTry === false ? '验证后学习' : '直接体验';
		},
		goVocabulary() { uni.navigateTo({ url:'/pages/vocabulary/vocabulary' }); },
		goTab(i) {
			const url = `/pages/index/testIndex?tab=${i + 1}`;
			uni.navigateTo({
				url,
				fail: () => {
					if (typeof window !== 'undefined') window.location.hash = `#${url}`;
					else uni.redirectTo({ url });
				}
			});
		},
		goDetail(it) {
			const idPart = it.id ? `id=${encodeURIComponent(it.id)}&` : '';
			const extra = it.subject ? `&subject=${it.subject}&kind=${it.kind || 'trial'}` : '';
			uni.navigateTo({ url:`/pages/course-detail/course-detail?${idPart}title=${encodeURIComponent(stripCourseYear(it.full))}&cover=${encodeURIComponent(it.cover || '')}${extra}` });
		}
	}
}
</script>

<style lang="scss">
page { background:#f7f8fa; color-scheme:light; }
.page { padding-bottom:130rpx; background:#f7f8fa; min-height:100vh; color:#111827; }

.banner { padding: 20rpx 24rpx 8rpx; }
.banner-swiper { width:100%; height:220rpx; border-radius:14rpx; overflow:hidden; background:#eef2f7; }
.banner-img { width:100%; height:100%; display:block; border-radius:14rpx; object-fit:cover; background:#eef2f7; }
.banner-img :deep(div) { background-size:cover !important; background-repeat:no-repeat !important; background-position:center center !important; }

.cats { display:flex; justify-content:space-around; padding:24rpx 0 14rpx; background:#f7f8fa; }
.cat { min-width:0; min-height:142rpx; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; }
.cat-icon { width:96rpx; height:96rpx; flex:0 0 96rpx; margin-bottom:14rpx; border-radius:28rpx; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; box-shadow:0 10rpx 24rpx rgba(15,23,42,0.08); }
.cat-tone-1 { background:linear-gradient(135deg,#eaf7ff,#dff1ff); color:#1677ff; }
.cat-tone-2 { background:linear-gradient(135deg,#eefcf5,#dcf9ec); color:#16a36a; }
.cat-tone-3 { background:linear-gradient(135deg,#fff3e7,#ffe6cc); color:#ff7a00; }
.cat-tone-4 { background:linear-gradient(135deg,#f1edff,#e5dcff); color:#7c3aed; }
.cat-img { width:74rpx; height:74rpx; display:block; position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); z-index:0; opacity:.18; }
.cat-icon-letter { position:relative; z-index:1; font-size:30rpx; line-height:1; font-weight:900; opacity:1; transition:opacity .18s ease; }
.cat-img + .cat-icon-letter { position:relative; opacity:1; }
.cat-icon.is-fallback .cat-icon-letter { position:relative; opacity:1; }
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
.cover { width:100%; height:auto; aspect-ratio:4 / 3; overflow:hidden; position:relative; }
.cover-img { width:100%; height:100%; display:block; object-fit:cover; background:#f8fafc; }
.cover-img :deep(div) { background-size:cover !important; background-repeat:no-repeat !important; background-position:center center !important; }
.cover-fallback { width:100%; height:100%; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#edf5ff,#f8fbff); color:#1677ff; font-size:32rpx; font-weight:900; letter-spacing:2rpx; }
.course-tag { position:absolute; left:0; bottom:0; background:rgba(0,0,0,.5); color:#fff; font-size:22rpx; padding:8rpx 14rpx; border-top-right-radius:8rpx; }
.info { padding:16rpx 18rpx 22rpx; }
.title { font-size:26rpx; color:rgba(0,0,0,0.9); font-weight:700; }
.learn { display:inline-block; font-size:22rpx; color:#0d7cfe; background:#eaf0ff; padding:4rpx 14rpx; border-radius:6rpx; margin-top:14rpx; }
.access-row { margin-top:14rpx; display:flex; align-items:center; flex-wrap:wrap; gap:10rpx; }
.access-chip { color:#0d7cfe; background:#eaf4ff; font-weight:700; font-size:24rpx; padding:6rpx 14rpx; border-radius:8rpx; }
.access-note { color:#8a94a3; font-size:22rpx; }
</style>
