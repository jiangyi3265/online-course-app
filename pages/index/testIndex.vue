<template>
	<view class="page">
		<view class="tabs">
			<view v-for="(t,i) in tabs" :key="i" class="tab-item" :class="{active: activeTab===i}" @click="activeTab=i">{{t}}</view>
		</view>

		<scroll-view v-if="loadState === 'success' && currentList.length" scroll-y class="list">
			<view class="row" v-for="it in currentList" :key="it.renderKey || it.id" @click="goDetail(it)">
				<view class="cover">
					<image v-if="it.cover && !it.coverError" class="cover-img" :src="it.cover" mode="aspectFit" @error="markCoverError(it)" />
					<view v-else class="cover-fallback">{{coverFallbackText(it)}}</view>
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
			<view class="list-spacer"></view>
		</scroll-view>
		<app-data-state v-else-if="loadState === 'loading'" type="loading" />
		<app-data-state
			v-else-if="loadState === 'error'"
			type="error"
			title="课程分类暂时无法加载"
			description="请检查网络后重新加载。"
			@retry="loadTabs"
		/>
		<app-data-state v-else type="empty" title="该分类暂无课程" description="课程发布后会显示在这里。" />

		<tab-bar active="home" />
	</view>
</template>

<script>
import TabBar from '@/components/tab-bar.vue'
import AppDataState from '@/components/app-data-state.vue'
import { stripCourseYear } from '@/common/course-data.js'
import { getCourses, resolveMediaUrl, isUsableMediaUrl } from '@/common/api.js'
export default {
	components: { TabBar, AppDataState },
	data() {
		return {
			activeTab: 0,
			tabs: ['中考试听','中考课程','高考试听','高考课程'],
			loadState: 'loading',
			data: { 0: [], 1: [], 2: [], 3: [] }
		}
	},
	computed: { currentList() { return this.data[this.activeTab] || []; } },
	onLoad(opts) {
		if (opts && opts.tab) this.activeTab = Math.max(0, Math.min(3, parseInt(opts.tab)-1));
		this.loadTabs();
	},
	methods: {
		async loadTabs() {
			this.loadState = 'loading';
			try {
				const tabs = await Promise.all([0, 1, 2, 3].map(tab => getCourses({ tab })));
				tabs.forEach((list, tab) => {
					this.data[tab] = (list || []).map(item => {
						const cover = this.safeMediaUrl(item.cover);
						return {
						id: item.id,
						full: stripCourseYear(item.full),
						suffix: item.isTry ? '试听课' : '',
						sub: stripCourseYear(item.sub),
						intro: stripCourseYear(item.introduction || item.intro || item.description || ''),
						cover,
						coverError: false,
						renderKey: `${item.id || item.full}-${cover}-${item.updatedAt || item.version || 'current'}`,
						isTry: item.isTry,
						available: !!(item.available || item.activated || item.hasAccess),
						subject: item.subject,
						kind: item.kind
						};
					});
				});
				this.loadState = 'success';
			} catch (err) {
				console.warn('课程分类接口不可用', err);
				this.data = { 0: [], 1: [], 2: [], 3: [] };
				this.loadState = 'error';
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
			const title = stripCourseYear(`《${it.full || ''}》${it.suffix || ''}`)
				.replace(/[《》\s]/g, '')
				.replace(/试…/g, '试听课');
			const isDuplicate = value => stripCourseYear(value || '')
				.replace(/[《》\s]/g, '')
				.replace(/试…/g, '试听课') === title;
			const intro = stripCourseYear(it.intro || '');
			const sub = stripCourseYear(it.sub || '');
			if (intro && !isDuplicate(intro)) return intro;
			return sub && !isDuplicate(sub) ? sub : '';
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

<style lang="scss" scoped>
page { background:#f5f7fa; }
.page { min-height:100vh; padding-bottom:130rpx; background:#f5f7fa; display:flex; flex-direction:column; overflow-x:hidden; }
.tabs { width:100%; box-sizing:border-box; display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); align-items:center; padding:30rpx 18rpx 20rpx; background:#fff; }
.tab-item { min-width:0; margin:0; text-align:center; font-size:28rpx; color:#b6b9c0; font-weight:500; padding:8rpx 4rpx; cursor:pointer; white-space:nowrap; }
.tab-item.active { color: rgba(0,0,0,0.9); font-size:30rpx; font-weight:700; }
.list { width:100%; box-sizing:border-box; flex:1; padding:10rpx 24rpx; }
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

@media screen and (min-width: 600px) {
	.page {
		padding-bottom:78px;
	}
	.tabs {
		padding:20px 16px 14px;
	}
	.tab-item {
		padding:7px 4px;
		font-size:16px;
	}
	.tab-item.active {
		font-size:17px;
	}
	.list {
		padding:10px 16px;
	}
	.row {
		padding:14px;
		margin-bottom:14px;
		border-radius:12px;
	}
	.cover {
		width:150px;
		height:110px;
		border-radius:9px;
	}
	.cover-fallback {
		font-size:22px;
	}
	.info {
		margin-left:16px;
	}
	.title {
		font-size:17px;
	}
	.sub {
		margin-top:4px;
		font-size:14px;
		line-height:1.35;
	}
	.bottom {
		padding-right:10px;
	}
	.access {
		min-width:100px;
	}
	.access-title {
		font-size:15px;
	}
	.access-sub {
		margin-top:3px;
		font-size:13px;
	}
	.go-btn {
		min-width:84px;
		padding:8px 18px;
		border-radius:22px;
		font-size:14px;
	}
	.end-tip {
		padding:32px 0 16px;
		font-size:14px;
	}
}

@media screen and (min-width: 900px) and (max-width: 1366px) {
	.tabs {
		padding-left:28px;
		padding-right:28px;
	}
	.list {
		display:block;
		padding:16px 24px 24px;
	}
	.list :deep(.uni-scroll-view) {
		width:100%;
	}
	.list :deep(.uni-scroll-view-content) {
		display:grid;
		grid-template-columns:repeat(2, minmax(0, 1fr));
		gap:18px;
		align-content:start;
	}
	.row {
		min-height:164px;
		margin:0;
	}
	.cover {
		width:160px;
		height:132px;
	}
	.end-tip,
	.list-spacer {
		grid-column:1 / -1;
	}
	.list-spacer {
		height:76px;
	}
}
</style>
