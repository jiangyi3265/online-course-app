<template>
	<view class="page">
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">我的课程文档</view>
		</view>

		<view class="search">
			<view class="search-box">
				<text class="s-ico">🔍</text>
				<input class="s-input" v-model="kw" placeholder="请输入文档名称搜索" placeholder-class="s-ph" />
			</view>
			<view class="s-divider"></view>
			<view class="s-btn" @click="search">搜索</view>
		</view>

		<view class="empty" v-if="list.length===0">
			<image class="empty-img" src="/static/empty-doc.png" mode="widthFix" />
			<view class="empty-text">暂无文档</view>
		</view>

		<view v-else class="doc-sections">
			<view class="doc-section">
				<view class="section-head" @click="toggleSection('lecture')">
					<view class="section-main">
						<view class="section-title">
							<text class="section-icon">资</text>
							<text>资料</text>
							<text class="section-count">{{lectureDocs.length}}份</text>
						</view>
						<view class="section-sub">讲义、学习资料、学案统一放在这里</view>
					</view>
					<view class="section-caret" :class="{open: expandedSections.lecture}">⌄</view>
				</view>
				<view class="section-body" v-if="expandedSections.lecture">
					<view class="doc-card" v-for="doc in lectureDocs" :key="doc.id">
						<view class="doc-icon">{{doc.fileType || 'DOC'}}</view>
						<view class="doc-info">
							<view class="doc-title">{{doc.title}}</view>
							<view class="doc-meta">{{doc.size || '未知大小'}}</view>
							<view class="doc-time">上传时间：{{formatDateTime(doc.uploadTime || doc.createdAt || doc.updatedAt)}}</view>
						</view>
						<view class="doc-actions">
							<view class="favorite" :class="{active:isFavorite(doc)}" @click="toggleDocFavorite(doc)">{{isFavorite(doc) ? '已收藏' : '收藏'}}</view>
							<view class="download" @click="downloadDoc(doc)">文件下载</view>
							<view class="doc-open" @click="openDoc(doc)">打开</view>
						</view>
					</view>
					<view class="section-empty" v-if="!lectureDocs.length">暂无资料</view>
				</view>
			</view>

			<view class="doc-section">
				<view class="section-head paper" @click="toggleSection('paper')">
					<view class="section-main">
						<view class="section-title">
							<text class="section-icon paper">卷</text>
							<text>试卷</text>
							<text class="section-count">{{paperDocs.length}}份</text>
						</view>
						<view class="section-sub">线下试卷可上传照片并记录自评分数</view>
					</view>
					<view class="section-caret" :class="{open: expandedSections.paper}">⌄</view>
				</view>
				<view class="section-body" v-if="expandedSections.paper">
					<view class="paper-card" v-for="doc in paperDocs" :key="doc.id">
					<view class="paper-main">
						<view class="doc-icon">{{doc.fileType || 'PDF'}}</view>
						<view class="doc-info">
							<view class="doc-title">{{doc.title}}</view>
							<view class="doc-meta">{{doc.size || '未知大小'}}</view>
							<view class="doc-time">更新日期：{{formatDateTime(doc.uploadTime || doc.createdAt || doc.updatedAt)}}</view>
						</view>
						<view class="doc-actions">
							<view class="favorite" :class="{active:isFavorite(doc)}" @click="toggleDocFavorite(doc)">{{isFavorite(doc) ? '已收藏' : '收藏'}}</view>
							<view class="download" @click="downloadDoc(doc)">文件下载</view>
							<view class="doc-open" @click="openDoc(doc)">打开</view>
						</view>
					</view>

					<view class="paper-review">
						<view class="review-top">
							<view class="upload-btn" :class="{active: doc.reviewExpanded}" @click="choosePaperImages(doc)">上传试卷照片</view>
							<view class="image-count">{{(doc.images || []).length}}/3 张</view>
						</view>
						<!-- 试卷自评默认折叠，点击「上传试卷照片」后展开 -->
						<view class="review-collapse" v-if="doc.reviewExpanded">
							<view class="review-box">
								<view class="review-title">试卷自评：</view>
								<view class="score-line">
									<view class="score-field">
										<text>总分</text>
										<input class="score-input" type="number" v-model="doc.totalScore" />
										<text class="score-unit">分</text>
									</view>
									<view class="score-field">
										<text>得分</text>
										<input class="score-input" type="number" v-model="doc.score" />
										<text class="score-unit">分</text>
									</view>
									<view class="score-field">
										<text>错题</text>
										<input class="score-input small" type="number" v-model="doc.wrongCount" />
										<text class="score-unit">道</text>
									</view>
								</view>
							</view>
							<view class="save-review" @click="savePaperReview(doc)">保存记录</view>
						</view>
					</view>
					<view class="paper-note">线下试卷在学生自评后记录，记录可在【学习报告】的练习统计中同步统计。</view>
				</view>
					<view class="section-empty" v-if="!paperDocs.length">暂无试卷</view>
			</view>
		</view>
		</view>

		<view class="mask" v-if="showLogin">
			<view class="modal">
				<view class="m-title">提示</view>
				<view class="m-body">您还未登录，是否登录？</view>
				<view class="m-actions">
					<view class="m-btn cancel" @click="showLogin=false">取消</view>
					<view class="m-divider"></view>
					<view class="m-btn ok" @click="goLogin">登录</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { getFavorites, getMyDocs, isLoggedIn, toggleFavorite } from '@/common/api.js'

const REVIEW_KEY = 'offlineExamReviews';
const LOCAL_DOCS = [
	{ id:'local-doc-1', courseId:'gk-math-full', category:'lecture', title:'高考数学集合逻辑讲义.pdf', fileUrl:'#', fileType:'PDF', size:'1.2MB', uploadTime:'2026-05-26T10:11:00', visible:true },
	{ id:'local-doc-2', courseId:'gk-math-full', category:'lecture', title:'导数极值专题学案.pdf', fileUrl:'#', fileType:'PDF', size:'2.4MB', uploadTime:'2026-05-26T10:11:00', visible:true },
	{ id:'local-doc-3', courseId:'zk-yingyu-full', category:'lecture', title:'中考英语核心词汇表.xlsx', fileUrl:'#', fileType:'XLSX', size:'640KB', uploadTime:'2026-05-26T10:11:00', visible:true },
	{ id:'local-paper-1', courseId:'gk-math-full', category:'paper', title:'高考数学集合逻辑测试卷.pdf', fileUrl:'#', fileType:'PDF', size:'1.2MB', uploadTime:'2026-05-26T10:15:00', visible:true },
	{ id:'local-paper-2', courseId:'gk-math-full', category:'paper', title:'导数极值专题测试卷.pdf', fileUrl:'#', fileType:'PDF', size:'2.4MB', uploadTime:'2026-05-26T10:15:00', visible:true },
	{ id:'local-paper-3', courseId:'zk-yingyu-full', category:'paper', title:'中考英语核心词汇测试卷.xlsx', fileUrl:'#', fileType:'XLSX', size:'640KB', uploadTime:'2026-05-26T10:15:00', visible:true }
];

export default {
	data() {
		return {
			kw:'',
			courseTitle:'',
			courseId:'',
			list:[],
			favoriteMap: {},
			showLogin:false,
			expandedSections: { lecture:true, paper:true }
		}
	},
	computed: {
		lectureDocs() {
			return this.list.filter(doc => !this.isPaper(doc));
		},
		paperDocs() {
			return this.list.filter(doc => this.isPaper(doc));
		}
	},
	onLoad(opts = {}) {
		this.courseId = opts.courseId || '';
		if (opts.kw) {
			this.courseTitle = decodeURIComponent(opts.kw);
			this.kw = this.courseTitle;
		}
	},
	onShow() {
		if (!isLoggedIn()) {
			this.showLogin = true;
			this.list = this.filterLocalDocs();
			return;
		}
		this.loadDocs();
	},
	methods: {
		async loadDocs() {
			try {
				const docs = await getMyDocs(this.activeKeyword(), this.courseId);
				const withFallbackDocs = this.ensureCategoryDocs(docs || []);
				this.list = this.filterDocs(withFallbackDocs, this.activeKeyword().toLowerCase()).map(doc => ({ ...doc, reviewExpanded:false }));
				await this.syncDocFavorites();
			} catch (err) {
				console.warn('文档接口不可用，使用本地文档', err);
				this.list = this.filterLocalDocs();
				await this.syncDocFavorites();
			}
		},
		filterLocalDocs() {
			const key = this.activeKeyword().toLowerCase();
			const matched = this.filterDocs(LOCAL_DOCS, key);
			const list = matched.length ? matched : this.filterDocs(this.createCourseFallbackDocs(), key);
			return list.map(doc => ({ ...doc, reviewExpanded:false }));
		},
		activeKeyword() {
			const keyword = this.kw.trim();
			return keyword && keyword === this.courseTitle.trim() ? '' : keyword;
		},
		filterDocs(docs = [], normalizedKey = null) {
			const key = normalizedKey === null ? this.activeKeyword().toLowerCase() : normalizedKey;
			return docs.filter(doc => {
				const matchCourse = !this.courseId || this.docCourseId(doc) === this.courseId;
				const matchKeyword = !key || (doc.title || '').toLowerCase().includes(key);
				return matchCourse && matchKeyword;
			});
		},
		docCourseId(doc = {}) {
			return doc.courseId || 'gk-math-full';
		},
		ensureCategoryDocs(docs = []) {
			const list = docs.length ? docs : this.filterLocalDocs();
			const fallback = this.createCourseFallbackDocs();
			let result = list.slice();
			if (!result.some(doc => !this.isPaper(doc))) {
				result = result.concat(fallback.filter(doc => doc.category === 'lecture'));
			}
			if (!result.some(doc => this.isPaper(doc))) {
				result = result.concat(fallback.filter(doc => doc.category === 'paper'));
			}
			return result;
		},
		isPaper(doc = {}) {
			return doc.category === 'paper' || /试卷|测试卷|线下/i.test(doc.title || '');
		},
		createCourseFallbackDocs() {
			const title = this.resolveCourseTitle();
			const courseId = this.courseId || `local-${title}`;
			return [
				{ id:`fallback-lecture-${courseId}`, courseId, category:'lecture', title:`${title}讲义及学习资料.pdf`, fileUrl:'#', fileType:'PDF', size:'1.2MB', uploadTime:'2026-05-26T10:11:00', visible:true },
				{ id:`fallback-paper-${courseId}`, courseId, category:'paper', title:`${title}线下测试卷.pdf`, fileUrl:'#', fileType:'PDF', size:'1.2MB', uploadTime:'2026-05-26T10:15:00', visible:true }
			];
		},
		resolveCourseTitle() {
			const key = (this.courseTitle || this.kw).replace(/[《》]/g, '').trim();
			if (key) return key;
			if (/yingyu|english/i.test(this.courseId)) return '英语';
			if (/yuwen|chinese/i.test(this.courseId)) return '语文';
			if (/wuli|physics/i.test(this.courseId)) return '物理';
			if (/huaxue|chemistry/i.test(this.courseId)) return '化学';
			if (/shengwu|biology/i.test(this.courseId)) return '生物';
			if (/lishi|history/i.test(this.courseId)) return '历史';
			if (/zhengzhi|politics/i.test(this.courseId)) return '政治';
			if (/dili|geography/i.test(this.courseId)) return '地理';
			if (/math|shuxue/i.test(this.courseId)) return '数学';
			return '课程';
		},
		toggleSection(type) {
			this.expandedSections[type] = !this.expandedSections[type];
		},
		async syncDocFavorites() {
			if (!isLoggedIn()) return;
			try {
				const data = await getFavorites();
				const favorites = []
					.concat(data.docs || [])
					.concat(data.papers || [])
					.concat(data.documents || []);
				const map = {};
				favorites.forEach(item => {
					const id = this.favoriteKey(item);
					if (id) map[id] = true;
				});
				this.favoriteMap = map;
			} catch (err) {
				console.warn('收藏状态加载失败', err);
			}
		},
		favoriteKey(doc = {}) {
			return String(doc.targetId || doc.id || '').trim();
		},
		isFavorite(doc = {}) {
			return !!this.favoriteMap[this.favoriteKey(doc)];
		},
		async toggleDocFavorite(doc = {}) {
			if (!isLoggedIn()) {
				this.showLogin = true;
				return;
			}
			const targetId = this.favoriteKey(doc);
			if (!targetId) return;
			try {
				const result = await toggleFavorite({
					type: 'doc',
					targetId,
					action: this.isFavorite(doc) ? 'remove' : 'add',
					title: doc.title,
					courseId: doc.courseId || this.courseId,
					category: this.isPaper(doc) ? 'paper' : 'lecture',
					fileUrl: doc.fileUrl || '',
					fileType: doc.fileType || '',
					size: doc.size || ''
				});
				this.favoriteMap = { ...this.favoriteMap, [targetId]: !!result.favorited };
				if (!result.favorited) {
					const next = { ...this.favoriteMap };
					delete next[targetId];
					this.favoriteMap = next;
				}
				uni.showToast({ title: result.favorited ? '已收藏' : '已取消收藏', icon:'success' });
			} catch (err) {
				uni.showToast({ title: err.message || '收藏失败', icon:'none' });
			}
		},
		goBack() { uni.navigateBack({ fail:()=>{} }); },
		search() { this.loadDocs(); },
		openDoc(doc) {
			if (doc.fileUrl && doc.fileUrl !== '#' && typeof window !== 'undefined') {
				window.open(doc.fileUrl, '_blank');
				return;
			}
			uni.showToast({ title: doc.title, icon:'none' });
		},
		downloadDoc(doc) {
			if (doc.fileUrl && doc.fileUrl !== '#' && typeof window !== 'undefined') {
				window.open(doc.fileUrl, '_blank');
				return;
			}
			uni.showToast({ title:'文件下载已准备', icon:'none' });
		},
		choosePaperImages(doc) {
			// 点击「上传试卷照片」展开试卷自评区域
			doc.reviewExpanded = true;
			uni.chooseImage({
				count: 3,
				success: res => {
					doc.images = (res.tempFilePaths || []).slice(0, 3);
					uni.showToast({ title:`已上传${doc.images.length}张`, icon:'none' });
				}
			});
		},
		savePaperReview(doc) {
			const totalText = String(doc.totalScore === undefined || doc.totalScore === null ? '' : doc.totalScore).trim();
			const scoreText = String(doc.score === undefined || doc.score === null ? '' : doc.score).trim();
			const wrongText = String(doc.wrongCount === undefined || doc.wrongCount === null ? '' : doc.wrongCount).trim();
			if (!totalText || !scoreText || !wrongText) {
				uni.showToast({ title:'请填写总分、得分和错题数', icon:'none' });
				return;
			}
			const score = Number(scoreText);
			const totalScore = Number(totalText);
			const wrongCount = Number(wrongText);
			if (!totalScore || Number.isNaN(score) || Number.isNaN(wrongCount)) {
				uni.showToast({ title:'请填写有效的分数和错题数', icon:'none' });
				return;
			}
			const record = {
				id: `offline-${Date.now()}`,
				docId: doc.id,
				courseId: doc.courseId || 'gk-math-full',
				title: doc.title,
				totalScore,
				score,
				wrongCount,
				imageCount: (doc.images || []).length,
				images: doc.images || [],
				createdAt: new Date().toISOString(),
				type: 'offline-paper'
			};
			const records = uni.getStorageSync(REVIEW_KEY) || [];
			records.unshift(record);
			uni.setStorageSync(REVIEW_KEY, records);
			uni.showToast({ title:'试卷自评已保存', icon:'success' });
		},
		formatDateTime(value) {
			const raw = value ? String(value) : '2026-05-26T10:11:00';
			const match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2}))?/);
			if (!match) return raw;
			const date = `${match[1]}年${match[2].padStart(2, '0')}月${match[3].padStart(2, '0')}日`;
			return match[4] ? `${date} ${match[4].padStart(2, '0')}：${match[5].padStart(2, '0')}` : date;
		},
		goLogin() { this.showLogin=false; uni.navigateTo({ url:'/pages/login/login' }); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; background:#f5f7fa; padding-bottom:50rpx; }
.nav { position:relative; height:90rpx; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; font-weight:300; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; color:#222; font-weight:800; }
.search { display:flex; align-items:center; margin:24rpx; background:#fff; border-radius:14rpx; padding:0 20rpx; height:82rpx; border:1rpx solid #e8edf3; box-shadow:0 4rpx 14rpx rgba(16,24,40,.04); }
.search-box { flex:1; display:flex; align-items:center; }
.s-ico { font-size:30rpx; color:#9aa1a9; margin-right:14rpx; }
.s-input { flex:1; height:80rpx; font-size:28rpx; color:#222; background:transparent; }
.s-ph { color:#aab1b9; }
.s-divider { width:2rpx; height:36rpx; background:#dfe2e6; margin:0 20rpx; }
.s-btn { color:#3aa3f5; font-size:28rpx; cursor:pointer; }
.doc-sections { padding:0 24rpx; }
.doc-section { margin-bottom:26rpx; }
.section-head {
	min-height:98rpx;
	display:flex;
	align-items:center;
	justify-content:space-between;
	padding:18rpx 20rpx;
	border-radius:14rpx;
	background:#fff;
	border:1rpx solid #e5edf5;
	box-shadow:0 4rpx 14rpx rgba(16,24,40,.04);
	cursor:pointer;
}
.section-head.paper { border-color:#e1efe8; }
.section-main { min-width:0; }
.section-title { display:flex; align-items:center; color:#1f2933; font-size:31rpx; font-weight:900; }
.section-icon {
	width:44rpx;
	height:44rpx;
	margin-right:14rpx;
	border-radius:10rpx;
	background:#eaf4ff;
	color:#1677ff;
	display:flex;
	align-items:center;
	justify-content:center;
	font-size:23rpx;
	font-weight:900;
}
.section-icon.paper { background:#ecfdf5; color:#0f766e; }
.section-count {
	margin-left:12rpx;
	padding:4rpx 10rpx;
	border-radius:999rpx;
	background:#f1f5f9;
	color:#64748b;
	font-size:21rpx;
	font-weight:800;
}
.section-sub { margin-top:8rpx; color:#8a94a3; font-size:23rpx; line-height:1.4; }
.section-caret {
	width:50rpx;
	height:50rpx;
	display:flex;
	align-items:center;
	justify-content:center;
	color:#94a3b8;
	font-size:34rpx;
	transform:rotate(-90deg);
	transition:transform .18s ease-out;
}
.section-caret.open { transform:rotate(0deg); }
.section-body { padding-top:16rpx; }
.section-empty { padding:32rpx 0; text-align:center; color:#94a3b8; font-size:25rpx; }
.doc-card, .paper-card { margin:0 0 18rpx; background:#fff; border:1rpx solid #e5eaf1; border-radius:12rpx; box-shadow:0 3rpx 10rpx rgba(16,24,40,.03); overflow:hidden; }
.doc-card, .paper-main { display:flex; align-items:center; min-height:132rpx; padding:20rpx 22rpx; box-sizing:border-box; }
.doc-icon { width:86rpx; height:86rpx; border-radius:8rpx; background:#edf7ff; color:#1684e8; display:flex; align-items:center; justify-content:center; font-size:22rpx; font-weight:900; flex-shrink:0; }
.doc-info { flex:1; min-width:0; margin-left:20rpx; }
.doc-title { color:#1f2933; font-size:28rpx; font-weight:900; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.doc-meta, .doc-time { margin-top:8rpx; color:#697386; font-size:24rpx; }
.doc-time { color:#6a5aa8; }
.doc-actions { display:flex; align-items:center; gap:18rpx; margin-left:18rpx; flex-shrink:0; }
.favorite, .download, .doc-open { min-height:52rpx; padding:0 14rpx; display:flex; align-items:center; justify-content:center; border-radius:8rpx; background:#eef6ff; color:#2563eb; font-size:24rpx; white-space:nowrap; cursor:pointer; }
.favorite { background:#fff7ed; color:#ea580c; }
.favorite.active { background:#fde7d6; color:#c2410c; font-weight:900; }
.doc-open { color:#0f766e; background:#ecfdf5; }
.paper-review { margin:0 22rpx 18rpx; padding:18rpx; border-radius:12rpx; background:#f8fafc; border:1rpx solid #e9eef5; }
.review-top { display:flex; align-items:center; justify-content:space-between; gap:16rpx; margin-bottom:16rpx; }
.upload-btn { min-width:180rpx; height:58rpx; line-height:58rpx; text-align:center; border-radius:10rpx; color:#1d4ed8; font-size:24rpx; font-weight:800; background:#eef6ff; border:1rpx solid #cfe1ff; cursor:pointer; }
.upload-btn.active { background:#1d4ed8; color:#fff; border-color:#1d4ed8; }
.image-count { color:#94a3b8; font-size:23rpx; }
.review-box { color:#334155; }
.review-title { font-size:24rpx; font-weight:900; margin-bottom:12rpx; }
.score-line { display:grid; grid-template-columns:repeat(3, 1fr); gap:12rpx; }
.score-field {
	min-width:0;
	display:flex;
	align-items:center;
	height:66rpx;
	padding:0 12rpx;
	border-radius:10rpx;
	background:#fff;
	border:1rpx solid #dfe7f0;
	color:#64748b;
	font-size:23rpx;
}
.score-field text { flex-shrink:0; }
.score-unit { color:#94a3b8; }
.score-input { flex:1; min-width:0; height:58rpx; margin:0 8rpx; text-align:center; font-size:25rpx; color:#1f2933; font-weight:800; }
.score-input.small { width:auto; }
.save-review { margin-top:16rpx; height:62rpx; line-height:62rpx; text-align:center; border-radius:10rpx; background:#3aa3f5; color:#fff; font-size:25rpx; font-weight:900; }
.paper-note { padding:0 22rpx 22rpx; color:#667085; font-size:23rpx; line-height:1.6; }
@media screen and (max-width: 420px) {
	.doc-card, .paper-main { align-items:flex-start; }
	.doc-actions { flex-direction:column; gap:10rpx; margin-left:12rpx; }
	.score-line { grid-template-columns:1fr; }
}
.empty { display:flex; flex-direction:column; align-items:center; padding-top:200rpx; }
.empty-img { width:520rpx; }
.empty-text { margin-top:30rpx; font-size:30rpx; color:#222; font-weight:700; }
.mask { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:200; }
.modal { width:560rpx; background:#fff; border-radius:14rpx; overflow:hidden; }
.m-title { text-align:center; padding:36rpx 0 16rpx; font-size:34rpx; color:#000; }
.m-body { text-align:center; padding:0 30rpx 36rpx; color:#888; font-size:28rpx; }
.m-actions { display:flex; border-top:1rpx solid #ececec; }
.m-btn { flex:1; height:96rpx; line-height:96rpx; text-align:center; font-size:32rpx; cursor:pointer; }
.m-btn.cancel { color:#000; }
.m-btn.ok { color:#007aff; }
.m-divider { width:1rpx; background:#ececec; }
</style>
