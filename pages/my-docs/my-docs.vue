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

		<view v-else>
			<view class="section" v-if="lectureDocs.length">
				<view class="section-title">讲义及学习资料</view>
				<view class="doc-card" v-for="doc in lectureDocs" :key="doc.id">
					<view class="doc-icon">{{doc.fileType || 'DOC'}}</view>
					<view class="doc-info">
						<view class="doc-title">{{doc.title}}</view>
						<view class="doc-meta">{{doc.size || '未知大小'}}</view>
						<view class="doc-time">上传时间：{{formatDateTime(doc.uploadTime || doc.createdAt || doc.updatedAt)}}</view>
					</view>
					<view class="doc-actions">
						<view class="download" @click="downloadDoc(doc)">文件下载</view>
						<view class="doc-open" @click="openDoc(doc)">打开</view>
					</view>
				</view>
			</view>

			<view class="section" v-if="paperDocs.length">
				<view class="section-title">线下试卷</view>
				<view class="paper-card" v-for="doc in paperDocs" :key="doc.id">
					<view class="paper-main">
						<view class="doc-icon">{{doc.fileType || 'PDF'}}</view>
						<view class="doc-info">
							<view class="doc-title">{{doc.title}}</view>
							<view class="doc-meta">{{doc.size || '未知大小'}}</view>
							<view class="doc-time">更新日期：{{formatDateTime(doc.uploadTime || doc.createdAt || doc.updatedAt)}}</view>
						</view>
						<view class="doc-actions">
							<view class="download" @click="downloadDoc(doc)">文件下载</view>
							<view class="doc-open" @click="openDoc(doc)">打开</view>
						</view>
					</view>

					<view class="paper-review">
						<view class="upload-btn" @click="choosePaperImages(doc)">试卷照片上传</view>
						<view class="review-box">
							<view class="review-title">试卷自评：</view>
							<view class="score-line">
								<text>总分：</text>
								<input class="score-input" type="number" v-model="doc.totalScore" />
								<text>分</text>
								<text class="score-gap">得分：</text>
								<input class="score-input" type="number" v-model="doc.score" />
								<text>分</text>
								<text class="score-gap">错题：</text>
								<input class="score-input small" type="number" v-model="doc.wrongCount" />
								<text>道</text>
							</view>
						</view>
						<view class="save-review" @click="savePaperReview(doc)">保存细节</view>
					</view>
					<view class="paper-note">线下试卷在学生自评后记录，记录可在【学习报告】的练习统计中同步统计。</view>
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
import { getMyDocs, isLoggedIn } from '@/common/api.js'

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
	data() { return { kw:'', courseId:'', list:[], showLogin:false } },
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
		if (opts.kw) this.kw = decodeURIComponent(opts.kw);
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
				const docs = await getMyDocs(this.kw);
				const withFallbackPapers = this.ensurePaperDocs(docs || []);
				this.list = this.filterDocs(withFallbackPapers).map(doc => ({ ...doc }));
			} catch (err) {
				console.warn('文档接口不可用，使用本地文档', err);
				this.list = this.filterLocalDocs();
			}
		},
		filterLocalDocs() {
			const key = this.kw.trim().toLowerCase();
			return this.filterDocs(LOCAL_DOCS, key).map(doc => ({ ...doc }));
		},
		filterDocs(docs = [], normalizedKey = '') {
			const key = normalizedKey || this.kw.trim().toLowerCase();
			return docs.filter(doc => {
				const matchCourse = !this.courseId || !doc.courseId || doc.courseId === this.courseId;
				const matchKeyword = !key || (doc.title || '').toLowerCase().includes(key);
				return matchCourse && matchKeyword;
			});
		},
		ensurePaperDocs(docs = []) {
			const hasPaper = docs.some(doc => this.isPaper(doc));
			const list = docs.length ? docs : this.filterLocalDocs();
			if (hasPaper) return list;
			return list.concat(this.filterDocs(LOCAL_DOCS.filter(doc => doc.category === 'paper')));
		},
		isPaper(doc = {}) {
			return doc.category === 'paper' || /试卷|测试卷|线下/i.test(doc.title || '');
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
			uni.chooseImage({
				count: 3,
				success: res => {
					doc.images = (res.tempFilePaths || []).slice(0, 3);
					uni.showToast({ title:`已上传${doc.images.length}张`, icon:'none' });
				}
			});
		},
		savePaperReview(doc) {
			const score = Number(doc.score);
			const totalScore = Number(doc.totalScore);
			const wrongCount = Number(doc.wrongCount);
			if (!totalScore || Number.isNaN(score) || Number.isNaN(wrongCount)) {
				uni.showToast({ title:'请填写总分、得分和错题数', icon:'none' });
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
page { background:#fff; }
.page { min-height:100vh; background:#fff; padding-bottom:50rpx; }
.nav { position:relative; height:90rpx; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; font-weight:300; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; color:#222; font-weight:800; }
.search { display:flex; align-items:center; margin:24rpx; background:#f3f6fa; border-radius:12rpx; padding:0 20rpx; height:78rpx; border:1rpx solid #e8edf3; }
.search-box { flex:1; display:flex; align-items:center; }
.s-ico { font-size:30rpx; color:#9aa1a9; margin-right:14rpx; }
.s-input { flex:1; height:80rpx; font-size:28rpx; color:#222; background:transparent; }
.s-ph { color:#aab1b9; }
.s-divider { width:2rpx; height:36rpx; background:#dfe2e6; margin:0 20rpx; }
.s-btn { color:#3aa3f5; font-size:28rpx; cursor:pointer; }
.section { margin-top:20rpx; }
.section-title { margin:28rpx 24rpx 14rpx; color:#1f2933; font-size:32rpx; font-weight:900; }
.doc-card, .paper-card { margin:0 24rpx 18rpx; background:#fff; border:1rpx solid #e5eaf1; border-radius:8rpx; box-shadow:0 3rpx 10rpx rgba(16,24,40,.03); overflow:hidden; }
.doc-card, .paper-main { display:flex; align-items:center; min-height:132rpx; padding:20rpx 22rpx; box-sizing:border-box; }
.doc-icon { width:86rpx; height:86rpx; border-radius:4rpx; background:#edf7ff; color:#1684e8; display:flex; align-items:center; justify-content:center; font-size:22rpx; font-weight:900; flex-shrink:0; }
.doc-info { flex:1; min-width:0; margin-left:20rpx; }
.doc-title { color:#1f2933; font-size:28rpx; font-weight:900; line-height:1.35; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.doc-meta, .doc-time { margin-top:8rpx; color:#697386; font-size:24rpx; }
.doc-time { color:#6a5aa8; }
.doc-actions { display:flex; align-items:center; gap:18rpx; margin-left:18rpx; flex-shrink:0; }
.download, .doc-open { min-height:52rpx; padding:0 14rpx; display:flex; align-items:center; justify-content:center; border-radius:8rpx; background:#eef6ff; color:#2563eb; font-size:24rpx; white-space:nowrap; cursor:pointer; }
.doc-open { color:#0f766e; background:#ecfdf5; }
.paper-review { display:flex; align-items:center; padding:0 22rpx 20rpx 128rpx; gap:18rpx; flex-wrap:wrap; }
.upload-btn { min-width:160rpx; height:58rpx; line-height:58rpx; text-align:center; border:2rpx solid #314ba0; color:#314ba0; font-size:24rpx; background:#fff; }
.review-box { min-width:360rpx; border:1rpx solid #5e6b9c; padding:10rpx 14rpx; color:#333b7a; }
.review-title { font-size:24rpx; margin-bottom:8rpx; }
.score-line { display:flex; align-items:center; flex-wrap:wrap; color:#333b7a; font-size:24rpx; }
.score-input { width:74rpx; height:42rpx; margin:0 8rpx; border-bottom:1rpx solid #9aa3af; text-align:center; font-size:24rpx; color:#222; }
.score-input.small { width:58rpx; }
.score-gap { margin-left:22rpx; }
.save-review { min-width:112rpx; height:56rpx; line-height:56rpx; text-align:center; border-radius:8rpx; background:#3aa3f5; color:#fff; font-size:24rpx; font-weight:800; }
.paper-note { padding:0 22rpx 22rpx 128rpx; color:#667085; font-size:23rpx; line-height:1.6; }
@media screen and (max-width: 420px) {
	.doc-card, .paper-main { align-items:flex-start; }
	.doc-actions { flex-direction:column; gap:10rpx; margin-left:12rpx; }
	.paper-review, .paper-note { padding-left:22rpx; }
	.review-box { min-width:0; width:100%; box-sizing:border-box; }
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
