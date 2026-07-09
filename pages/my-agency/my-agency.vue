<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">我的校区</view></view>

		<view class="hero">
			<view>
				<view class="hero-title">{{agencyName}}</view>
				<view class="hero-sub">ID：{{agencyId || '--'}}</view>
			</view>
			<view class="hero-badge">分校区</view>
		</view>

		<view class="stat-grid">
			<view class="stat-card" :class="{active: item.status && detailStatus === item.status}" v-for="item in statCards" :key="item.label" @click="selectStatus(item.status)">
				<text>{{item.label}}</text>
				<strong>{{item.value}}</strong>
			</view>
		</view>

		<view class="panel">
			<view class="panel-head">
				<view>
					<view class="panel-title">{{detailTitle}}</view>
					<view class="panel-sub">{{filteredCodes.length}} 条记录</view>
				</view>
				<view class="head-actions">
					<view class="ghost-btn" @click="copyVisibleCodes">复制当前</view>
					<view class="refresh" @click="loadData">{{loading ? '加载中' : '刷新'}}</view>
				</view>
			</view>

			<view class="empty" v-if="!filteredCodes.length">{{loadError || '暂无激活码记录'}}</view>
			<view class="code-card" v-for="item in filteredCodes" :key="item.id || item.code">
				<view class="code-top">
					<view class="code-text">{{item.code || '-'}}</view>
					<view class="copy-btn" @click="copyCode(item.code)">复制</view>
				</view>
				<view class="course-name">{{item.courseTitle || item.subject || '未选择课程'}}</view>
				<view class="meta-grid">
					<view><text>类型</text><strong>{{item.cardTypeText || item.durationText || '--'}}</strong></view>
					<view><text>状态</text><strong :class="statusClass(item)">{{statusText(item)}}</strong></view>
					<view><text>激活人</text><strong>{{item.studentName || '--'}}</strong></view>
					<view><text>分数</text><strong>{{item.recentExamScore || '--'}}</strong></view>
					<view><text>学校</text><strong>{{item.schoolName || '--'}}</strong></view>
					<view><text>地区</text><strong>{{item.region || '--'}}</strong></view>
					<view><text>激活日期</text><strong>{{formatDate(item.activatedAt)}}</strong></view>
					<view><text>到期时间</text><strong>{{formatDate(item.expiresAt)}}</strong></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getMyAgency } from '@/common/api.js'
import { safeNavigateBack } from '@/common/navigation.js'

export default {
	data() {
		return {
			summary: {},
			detailStatus: 'all',
			loading: false,
			loadError: ''
		}
	},
	computed: {
		agency() {
			return this.summary.agency || {};
		},
		agencyName() {
			return this.agency.organizationName || this.agency.name || '我的校区';
		},
		agencyId() {
			return this.agency.id || '';
		},
		statCards() {
			return [
				{ label:'激活码总数', value:this.summary.totalCodes || 0, status:'all' },
				{ label:'未使用', value:this.summary.unusedCount || 0, status:'unused' },
				{ label:'已使用', value:this.summary.activatedCount || 0, status:'used' },
				{ label:'开课人数', value:this.summary.openPeopleCount || this.summary.userCount || 0, status:'' }
			];
		},
		detailTitle() {
			if (this.detailStatus === 'used') return '已使用激活码明细';
			if (this.detailStatus === 'unused') return '未使用激活码明细';
			return '激活码总数明细';
		},
		filteredCodes() {
			const rows = Array.isArray(this.summary.codes) ? this.summary.codes : [];
			return rows
				.filter(item => {
					if (this.detailStatus === 'used') return item.status === 'used';
					if (this.detailStatus === 'unused') return item.status !== 'used';
					return true;
				})
				.map(item => ({
					...item,
					courseTitle: item.courseTitle || item.subject || item.courseId || '',
					cardTypeText: item.cardTypeText || item.durationText || ''
				}));
		}
	},
	onShow() {
		this.loadData();
	},
	methods: {
		async loadData() {
			this.loading = true;
			this.loadError = '';
			try {
				this.summary = await getMyAgency();
			} catch (err) {
				this.summary = {};
				this.loadError = err.message || '校区数据加载失败';
				uni.showToast({ title:this.loadError, icon:'none' });
			} finally {
				this.loading = false;
			}
		},
		selectStatus(status) {
			if (!status) return;
			this.detailStatus = status || 'all';
		},
		statusText(item = {}) {
			if (item.authorizationClosed) return '已关闭';
			if (item.status === 'used') return '已使用';
			if (item.locked || item.status === 'disabled') return '已锁定';
			return '未使用';
		},
		statusClass(item = {}) {
			if (item.authorizationClosed || item.locked || item.status === 'disabled') return 'danger';
			return item.status === 'used' ? 'success' : 'muted';
		},
		formatDate(value) {
			if (!value) return '--';
			const raw = String(value).replace('T', ' ');
			const match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s(\d{1,2}):(\d{1,2}))?/);
			if (!match) return raw;
			const date = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
			return match[4] ? `${date} ${match[4].padStart(2, '0')}:${match[5].padStart(2, '0')}` : date;
		},
		copyVisibleCodes() {
			this.copyCode(this.filteredCodes.map(item => item.code).filter(Boolean).join('\n'));
		},
		copyCode(code = '') {
			const text = String(code || '').trim();
			if (!text) {
				uni.showToast({ title:'暂无激活码可复制', icon:'none' });
				return;
			}
			uni.setClipboardData({
				data:text,
				success:() => uni.showToast({ title:'已复制', icon:'success' }),
				fail:() => uni.showToast({ title:'复制失败', icon:'none' })
			});
		},
		goBack() { safeNavigateBack('/pages/member/member'); }
	}
}
</script>

<style lang="scss">
page { background:#f6f8fb; }
.page { min-height:100vh; background:#f6f8fb; padding-bottom:42rpx; box-sizing:border-box; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; font-weight:900; color:#111827; }
.hero { margin:18rpx 20rpx; padding:22rpx 24rpx; border-radius:16rpx; background:#fff; border:1rpx solid #e3ebf5; display:flex; align-items:center; justify-content:space-between; gap:18rpx; box-shadow:0 8rpx 22rpx rgba(16,24,40,.04); }
.hero-title { color:#111827; font-size:34rpx; font-weight:900; line-height:1.25; }
.hero-sub { margin-top:8rpx; color:#667085; font-size:24rpx; }
.hero-badge { flex-shrink:0; padding:12rpx 20rpx; border-radius:999rpx; background:#eef6ff; color:#1677ff; font-size:24rpx; font-weight:900; }
.stat-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:10rpx; padding:0 20rpx; }
.stat-card { min-height:86rpx; padding:14rpx 16rpx; border-radius:14rpx; background:#fff; border:1rpx solid #e7edf5; box-shadow:0 8rpx 18rpx rgba(16,24,40,.035); box-sizing:border-box; }
.stat-card.active { border-color:#1677ff; background:#f0f7ff; }
.stat-card text { display:block; color:#667085; font-size:23rpx; font-weight:700; }
.stat-card strong { display:block; margin-top:8rpx; color:#111827; font-size:32rpx; font-weight:900; line-height:1; }
.panel { margin:18rpx 20rpx; padding:20rpx; border-radius:16rpx; background:#fff; border:1rpx solid #e3ebf5; box-shadow:0 8rpx 22rpx rgba(16,24,40,.04); box-sizing:border-box; }
.panel-head { display:flex; align-items:center; justify-content:space-between; gap:14rpx; margin-bottom:14rpx; }
.panel-title { color:#111827; font-size:31rpx; font-weight:900; line-height:1.25; }
.panel-sub { margin-top:8rpx; color:#8a94a3; font-size:23rpx; }
.head-actions { display:flex; flex-direction:row; align-items:center; gap:10rpx; flex-shrink:0; }
.ghost-btn,
.refresh { min-width:100rpx; height:52rpx; line-height:52rpx; text-align:center; border-radius:999rpx; font-size:22rpx; font-weight:900; }
.ghost-btn { background:#eef6ff; color:#1677ff; }
.refresh { background:#f3f6fa; color:#475467; }
.empty { color:#8a94a3; font-size:26rpx; padding:26rpx 0; }
.code-card { padding:14rpx 0; border-bottom:1rpx solid #eef0f3; }
.code-card:last-child { border-bottom:0; padding-bottom:0; }
.code-top { display:flex; align-items:center; justify-content:space-between; gap:16rpx; }
.code-text { min-width:0; color:#111827; font-size:28rpx; font-weight:900; font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.copy-btn { flex-shrink:0; color:#1677ff; background:#eef6ff; border-radius:999rpx; padding:10rpx 18rpx; font-size:23rpx; font-weight:900; }
.course-name { margin-top:6rpx; color:#344054; font-size:25rpx; font-weight:800; line-height:1.35; }
.meta-grid { display:grid; grid-template-columns:1fr 1fr; gap:8rpx; margin-top:10rpx; }
.meta-grid view { min-width:0; min-height:58rpx; padding:10rpx 12rpx; border-radius:10rpx; background:#f8fafc; border:1rpx solid #edf1f6; box-sizing:border-box; display:flex; align-items:center; justify-content:space-between; gap:10rpx; }
.meta-grid text { flex-shrink:0; color:#8a94a3; font-size:20rpx; }
.meta-grid strong { min-width:0; color:#1f2933; font-size:22rpx; line-height:1.25; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; text-align:right; }
.meta-grid strong.success { color:#16a36b; }
.meta-grid strong.danger { color:#e5484d; }
.meta-grid strong.muted { color:#667085; }
@media screen and (max-width: 420px) {
	.stat-grid { grid-template-columns:repeat(2, minmax(0, 1fr)); }
	.panel-head { align-items:flex-start; }
	.head-actions { flex-direction:column; align-items:flex-end; gap:8rpx; }
}
</style>
