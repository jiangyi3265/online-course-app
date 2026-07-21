<template>
	<view class="page">
		<!-- 自定义导航 -->
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">{{displayCourseName}}</view>
			<view class="nav-spacer"></view>
		</view>
		<!-- 未登录提示弹窗 -->
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
		<view class="auth-mask" v-if="showPermission" @click.self="closePermission">
			<view class="permission-modal">
				<view class="permission-icon">锁</view>
				<view class="permission-title">未获得授权</view>
				<view class="permission-body">试听课程尚未获得“{{permissionFeature}}”授权，请联系老师或校区开通。</view>
				<view class="permission-confirm" @click="closePermission">我知道了</view>
			</view>
		</view>

		<!-- 封面 -->
		<view class="cover" :class="coverClass">
			<image v-if="cover" class="cover-img" :src="cover" :mode="coverMode" @load="onCoverLoad" @error="onCoverError" />
			<template v-else>
				<view class="cover-fallback" :style="{background: bg}">
					<view class="cover-title">{{coverTitle}}</view>
				</view>
			</template>
		</view>

		<!-- 课程信息 -->
		<view class="info-block">
			<view class="info-top">
				<view class="info-title">{{displayCourseName}}</view>
				<view class="update-meta">
					<text class="update-label">最近更新</text>
					<text class="update-date">{{displayUpdateDate}}</text>
				</view>
			</view>
			<view class="course-intro" v-if="courseIntro">{{courseIntro}}</view>
			<view class="version-stats" v-if="versionSummaries.length">
				<view class="version-stat" v-for="item in versionSummaries" :key="item.label">
					<text class="version-stat-name">{{item.label}}</text>
					<text class="version-stat-count" v-if="item.total">共{{item.total}}节</text>
					<text class="version-stat-duration">课程时长：{{item.duration}}</text>
				</view>
			</view>
			<view class="progress-row">
				<text class="p-label">学习进度：</text>
				<view class="bar"><view class="bar-inner" :style="{width: progressBarWidth+'%'}"></view></view>
				<text class="p-num">{{progressLabel}}%</text>
			</view>
			<view class="learnt">已学课程节数{{learntCount}}节，已学时长：{{learntDuration}}</view>
		</view>

		<!-- 三个功能 -->
		<view class="funcs">
			<view class="func locked" @click="goDocs">
				<text class="func-lock">未授权</text>
				<view class="f-ico blue">文</view>
				<text class="f-text">我的文档</text>
			</view>
			<view class="func locked" @click="goPlan">
				<text class="func-lock">未授权</text>
				<view class="f-ico pink">卡</view>
				<text class="f-text">学习打卡</text>
			</view>
			<view class="func locked" @click="goReport">
				<text class="func-lock">未授权</text>
				<view class="f-ico green">报</view>
				<text class="f-text">学习报告</text>
			</view>
		</view>

		<view class="course-actions-area" @click="collapseCheckinPanel">
			<view class="tabs">
				<view class="tab" v-for="(t,i) in detailTabs" :key="t" :class="{active: activeTab===i}" @click="setTab(i)">{{t}}</view>
			</view>

			<block v-if="activeTab===0">
				<view class="version-chips">
					<view class="version-chip" v-for="(item, index) in versionChips" :key="item" :class="{active: versionIndex === index}" @click="setVersion(index)">{{item}}</view>
				</view>

				<view class="chapter" v-for="(c,i) in chapters" :key="i">
					<view class="ch-head" @click.stop="toggle(i)">
						<text class="ch-title">{{c.title}}</text>
						<view class="ch-right">
							<text class="trial" v-if="c.audition !== false">试听</text>
							<text class="caret">{{c.open ? '▾' : '›'}}</text>
						</view>
					</view>
					<block v-if="c.open">
						<view class="ch-body" v-for="(s,j) in c.children" :key="j">
							<view class="ch-left">
								<view class="ch-mark" :class="{practice:s.type===2}">{{s.type===2 ? '练' : '学'}}</view>
								<view>
									<view class="ch-name">{{childName(s, c)}}</view>
									<view class="ch-progress">已学习：{{progressText(s)}}</view>
								</view>
							</view>
								<view class="ch-actions">
									<view class="btn-go locked" @click.stop="goLesson(c, s)">{{s.type===2 ? '去练习' : '去学习'}}</view>
								<view class="btn-ai locked" @click.stop="goAi(c.title)">AI问答</view>
							</view>
						</view>
					</block>
				</view>
			</block>

			<view class="quiz-list" v-else-if="activeTab===1">
				<view class="minor-panel" v-if="isChineseTrial">
					<view class="minor-title">章节扫雷</view>
					<view class="minor-text">权限未开通，请联系授权。</view>
					<view class="minor-btn locked" @click="requestPermission">申请授权</view>
				</view>
				<template v-else>
					<view class="trial-tip">试听课仅开放部分章节扫雷内容，完整测评请开通课程。</view>
					<view class="quiz" v-for="(q,i) in trialQuizzes" :key="i">
					<view class="quiz-left">
						<view class="q-mark">测</view>
						<view>
							<view class="q-name">{{q.name}}</view>
							<view class="q-status">{{q.status}}</view>
						</view>
					</view>
					<view class="q-btn" @click="goQuiz(q)">{{q.action || '去测评'}}</view>
					</view>
				</template>
			</view>

			<view class="minor-panel" v-else-if="activeTab===2">
				<view class="minor-title">错题与巩固</view>
				<view class="minor-text">权限未开通，请联系授权。</view>
				<view class="minor-btn locked" @click="requestPermission">申请授权</view>
			</view>

			<view class="minor-panel" v-else>
				<view class="minor-title">{{displayCourseName}}</view>
				<view class="minor-text">权限未开通，请联系授权。</view>
				<view class="minor-btn locked" @click="requestPermission">申请授权</view>
			</view>

			<view style="height:60rpx"></view>
		</view>
	</view>
</template>

<script>
import { cleanCourseDisplayName, getGaokaoMathCourse, isGaokaoMath, stripCourseYear } from '@/common/course-data.js'
import { getCourse, resolveMediaUrl } from '@/common/api.js'
import { safeNavigateBack } from '@/common/navigation.js'
export default {
	data() {
		return {
			title: '中考语文',
			courseName: '《中考语文》试听课',
			courseIntro: '',
			updatedAt: '2026-05-26T10:11:00',
			coverTitle: '中考语文',
			bg: 'linear-gradient(135deg,#c94f7c 0%,#7e3a6b 100%)',
			totalLessons: 3,
			totalDuration: '01小时29分',
			practiceDuration: '',
			progress: 0,
			learntCount: 0,
			learntDuration: '00小时00分',
			activeTab: 0,
			detailTabs: ['技巧干货','章节扫雷','错题与巩固','知识巩固'],
			versionIndex: 0,
			versionChips: ['复习加强课', '技巧绝招'],
			courseVersions: [],
			chapters: [
				{ title:'选材与加工高分技巧', open:true, audition:true, children:[{ name:'技巧干货', type:1, total:1, read:0 }] },
				{ title:'课外文言文做题技巧', open:true, audition:true, children:[{ name:'技巧干货', type:1, total:1, read:0 }] },
				{ title:'词句的理解与赏析', open:true, audition:true, children:[{ name:'技巧干货', type:1, total:1, read:0 }] }
			],
			quizzes: [],
			showLogin: false,
			showPermission: false,
			permissionFeature: '该功能',
			cover: '',
			coverRatio: 0,
			courseId: 'gk-math-trial'
		}
	},
	computed: {
		coverClass() {
			return this.isPosterCover ? 'cover-poster' : 'cover-banner';
		},
		coverMode() {
			return 'aspectFill';
		},
		isPosterCover() {
			if (!this.cover) return false;
			if (this.coverRatio) return this.coverRatio < 2.2;
			return !/[-_]detail\.(png|jpe?g|webp)$/i.test(this.cover);
		},
		displayCourseName() {
			return cleanCourseDisplayName(this.courseName, this.title);
		},
		displayUpdateDate() {
			return this.formatCourseDate(this.updatedAt);
		},
		progressLabel() {
			return Math.max(0, Math.round(Number(this.progress) || 0));
		},
		progressBarWidth() {
			return Math.min(this.progressLabel, 100);
		},
		trialQuizzes() {
			return (this.quizzes || []).slice(0, 1);
		},
		versionSummaries() {
			return this.courseVersions.slice(0, 2).map((version, index) => {
				const title = index === 0 ? '复习加强' : '技巧绝招';
				const chapters = (version && version.chapters) || [];
				return {
					label: title,
					total: this.countChapters(chapters),
					duration: this.versionDuration(version, index)
				};
			}).filter(item => item.total || item.duration);
		},
		isChineseTrial() {
			return /中考语文|高考语文|初中语文|高中语文/.test(`${this.title}${this.courseName}`);
		}
	},
	async onLoad(opts) {
		if (opts && opts.title) {
			this.title = stripCourseYear(this.decodeRouteText(opts.title));
			this.courseName = `《${this.title}》试听课`;
			this.courseId = this.resolveCourseId(this.title, 'trial');
		}
		if (opts && opts.bg) this.bg = this.decodeRouteText(opts.bg);
		if (opts && opts.cover) this.setCover(this.decodeRouteText(opts.cover));
		if (opts && opts.id) {
			await this.loadCourse(opts.id);
		} else if ((opts && opts.subject === 'gaokao-math') || isGaokaoMath(this.title)) {
			this.applyMathCourse();
		}
		if (!this.courseVersions.length) this.courseVersions = this.normalizeVersions({}, this.chapters);
		this.coverTitle = this.title;
	},
	onReady() {
		this.clearEncodedPageTitle();
	},
	methods: {
		decodeRouteText(value = '') {
			let text = String(value || '');
			for (let index = 0; index < 3; index += 1) {
				try {
					const decoded = decodeURIComponent(text);
					if (decoded === text) break;
					text = decoded;
				} catch (err) {
					break;
				}
			}
			return text;
		},
		async loadCourse(id) {
			try {
				const course = await getCourse(id);
				this.applyRemoteCourse(course);
			} catch (err) {
				console.warn('课程详情接口不可用，使用本地详情', err);
				if (isGaokaoMath(this.title)) this.applyMathCourse();
			}
		},
		applyRemoteCourse(course) {
			this.courseId = course.id || this.courseId;
			this.title = course.title || this.title;
			this.courseName = stripCourseYear(course.courseName || this.courseName);
			this.courseIntro = String(course.introduction || course.intro || course.description || '').trim();
			this.updatedAt = course.updatedAt || course.updateTime || course.createdAt || this.updatedAt;
			this.setCover(course.detailCover || course.cover || this.cover);
			const stats = this.resolveCourseStats(course);
			this.totalLessons = stats.totalLessons || this.totalLessons;
			this.totalDuration = stats.totalDuration || this.totalDuration;
			this.practiceDuration = course.practiceDuration || this.practiceDuration;
			this.progress = course.progress || 0;
			this.learntCount = course.readStudyCount || 0;
			this.learntDuration = course.readDuration || '00小时00分';
			this.courseVersions = this.normalizeVersions(course, course.chapters || this.chapters);
			this.setVersion(0);
			this.quizzes = course.quizzes || [];
		},
		collapseCheckinPanel() {},
		goBack() { safeNavigateBack('/pages/index/index'); },
		goLogin() { this.showLogin=false; uni.navigateTo({ url:'/pages/login/login' }); },
		setCover(value) {
			const next = resolveMediaUrl(value || '');
			if (next === this.cover) return;
			this.cover = next;
			this.coverRatio = 0;
		},
		onCoverLoad(event) {
			const detail = (event && event.detail) || {};
			if (detail.width && detail.height) {
				this.coverRatio = detail.width / detail.height;
			}
		},
		onCoverError() {
			this.cover = '';
			this.coverRatio = 0;
		},
		applyMathCourse() {
			const course = getGaokaoMathCourse('trial');
			this.courseId = 'gk-math-trial';
			this.title = course.title;
			this.courseName = stripCourseYear(course.courseName);
			this.courseIntro = String(course.introduction || course.intro || course.description || '').trim();
			this.updatedAt = course.updatedAt || this.updatedAt;
			this.setCover(course.detailCover || course.cover);
			const stats = this.resolveCourseStats(course);
			this.totalLessons = stats.totalLessons || course.totalLessons;
			this.totalDuration = stats.totalDuration || course.totalDuration;
			this.practiceDuration = course.practiceDuration;
			this.progress = course.progress;
			this.learntCount = course.readStudyCount;
			this.learntDuration = course.readDuration;
			this.courseVersions = this.normalizeVersions(course, course.chapters || this.chapters);
			this.setVersion(0);
			this.quizzes = course.quizzes;
		},
		toggle(i) {
			this.chapters[i].open = !this.chapters[i].open;
		},
		setTab(i) {
			this.activeTab = i;
		},
		setVersion(index) {
			this.collapseCheckinPanel();
			this.versionIndex = index;
			const version = this.courseVersions[index];
			if (version && version.chapters) this.chapters = version.chapters;
		},
		normalizeVersions(course = {}, fallbackChapters = []) {
			const baseChapters = course.chapters || fallbackChapters || [];
			const source = Array.isArray(course.versions) && course.versions.length ? course.versions : [];
			const normalized = source.map((item, index) => ({
				...(typeof item === 'object' ? item : { name: item }),
				name: index === 0 ? '复习加强课' : '技巧绝招',
				chapters: (item && item.chapters) || baseChapters
			}));
			while (normalized.length < 2) {
				normalized.push({
					name: normalized.length === 0 ? '复习加强课' : '技巧绝招',
					chapters: baseChapters
				});
			}
			return normalized.slice(0, 2);
		},
		resolveCourseId(title = '', kind = 'trial') {
			const level = /中考/.test(title) ? 'zk' : 'gk';
			const subjects = [
				['数学', level === 'gk' ? 'math' : 'shuxue'],
				['语文', 'yuwen'],
				['英语', 'yingyu'],
				['物理', 'wuli'],
				['化学', 'huaxue'],
				['生物', 'shengwu'],
				['历史', 'lishi'],
				['政治', 'zhengzhi'],
				['地理', 'dili']
			];
			const found = subjects.find(([name]) => title.includes(name));
			const subject = found ? found[1] : 'course';
			return `${level}-${subject}-${kind}`;
		},
		resolveCourseStats(course = {}) {
			const totalLessons = this.countCourseLessons(course) || course.totalLessons || 0;
			return {
				totalLessons,
				totalDuration: course.totalDuration || ''
			};
		},
		countCourseLessons(course = {}) {
			const version = course.versions && course.versions[0];
			const chapters = version && version.chapters ? version.chapters : (course.chapters || []);
			return this.countChapters(chapters);
		},
		countChapters(chapters = []) {
			return chapters.reduce((total, chapter) => {
				const items = chapter.items || chapter.children || [];
				return total + items.reduce((sum, item) => {
					if (item.children && item.children.length) {
						return sum + item.children.filter(child => child.type !== 2).length;
					}
					return sum + (item.type === 2 ? 0 : 1);
				}, 0);
			}, 0);
		},
		versionDuration(version = {}, index = 0) {
			return version.duration || version.totalDuration || version.courseDuration || (index === 0 ? this.totalDuration : this.practiceDuration) || '00小时00分';
		},
		goDocs() {
			this.collapseCheckinPanel();
			this.requireFullCourseFeature('我的文档');
		},
		goPlan() {
			this.collapseCheckinPanel();
			this.requireFullCourseFeature('学习打卡');
		},
		goReport() {
			this.collapseCheckinPanel();
			this.requireFullCourseFeature('学习报告');
		},
		goAi(context) {
			this.requestPermission('AI问答');
		},
		goQuiz(q) {
			this.requestPermission('章节测评');
		},
		goWrongBook() {
			this.requestPermission('错题与巩固');
		},
		goReinforce() {
			this.requestPermission('知识巩固');
		},
		goLesson(chapter, item) {
			if (item && Number(item.type) === 2) {
				this.requestPermission('练习功能');
				return;
			}
			const lessonId = String((chapter && chapter.title) || (item && item.name) || '').trim();
			if (!lessonId) {
				uni.showToast({ title:'课程视频暂未上传', icon:'none' });
				return;
			}
			uni.navigateTo({
				url:`/pages/lesson/lesson?title=${encodeURIComponent(lessonId)}&lessonId=${encodeURIComponent(lessonId)}&courseId=${encodeURIComponent(this.courseId)}&courseTitle=${encodeURIComponent(this.displayCourseName)}&chapterTitle=${encodeURIComponent(lessonId)}&categoryTitle=${encodeURIComponent(this.lessonCategoryTitle())}`
			});
		},
		clearEncodedPageTitle() {
			if (typeof document === 'undefined') return;
			this.$nextTick(() => {
				document.querySelectorAll('.page[title], [title]').forEach(el => {
					const value = String(el.getAttribute('title') || '');
					if (/%[0-9a-f]{2}/i.test(value)) el.removeAttribute('title');
				});
			});
		},
		formatCourseDate(value) {
			const raw = value ? String(value) : '2026-05-26';
			const match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
			if (!match) return raw;
			return `${match[1]}年${match[2].padStart(2, '0')}月${match[3].padStart(2, '0')}日`;
		},
		progressText(item) {
			if (item.type === 2) return `${item.read || 0}/${item.total || 0}`;
			return `${Math.round(((item.read || 0) / (item.total || 1)) * 100)}%`;
		},
		lessonCategoryTitle(index = this.versionIndex) {
			return this.versionChips[index] || (index === 0 ? '复习加强课' : '技巧绝招');
		},
		childName(item, chapter = {}) {
			if (this.versionIndex === 0) {
				return item.type === 2 ? '复习测试' : '复习加强';
			}
			if (this.versionIndex === 1) return item.type === 2 ? '真题讲练' : '技巧绝招';
			return item.name;
		},
		requireFullCourseFeature(feature = '该功能') {
			this.showPermissionDenied(feature);
		},
		requestPermission(feature = '该功能') {
			this.showPermissionDenied(typeof feature === 'string' ? feature : '该功能');
		},
		showPermissionDenied(feature = '该功能') {
			this.collapseCheckinPanel();
			this.permissionFeature = typeof feature === 'string' && feature.trim() ? feature.trim() : '该功能';
			this.showPermission = true;
		},
		closePermission() {
			this.showPermission = false;
		},
		toast(title) { uni.showToast({ title, icon:'none' }); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page {
	min-height:100vh;
	background:#f5f7fa;
	padding-top:90rpx;
	box-sizing:border-box;
}

.nav {
	position:fixed;
	top:0;
	left:0;
	right:0;
	z-index:120;
	width:100%;
	height:90rpx;
	box-sizing:border-box;
	background:rgba(255,255,255,.97);
	display:grid;
	grid-template-columns:96rpx minmax(0,1fr) 96rpx;
	align-items:center;
	border-bottom:1rpx solid #e8edf3;
	box-shadow:0 6rpx 20rpx rgba(30,58,92,.06);
	backdrop-filter:blur(14rpx);
}
.back {
	width:96rpx;
	height:100%;
	display:flex; align-items:center; justify-content:center;
	font-size:50rpx; color:#222; font-weight:400;
	cursor:pointer;
	transition:background-color .2s ease, transform .2s ease;
}
.back:active { background:#f1f5f9; transform:scale(.96); }
.nav-title { min-width:0; text-align:center; font-size:30rpx; color:#111827; font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.nav-spacer { width:96rpx; height:100%; }

/* 封面 */
.cover {
	position:relative;
	overflow:hidden;
	background:#f3f6fb;
}
.cover-banner { height:240rpx; }
.cover-poster {
	height:562rpx;
	background:#fff;
}
.cover-img { width:100%; height:100%; display:block; }
.cover-fallback {
	height:100%;
	display:flex; align-items:center;
	color:#fff;
	padding-left: 50rpx;
}
.tag {
	position:absolute; top:24rpx; right:24rpx;
	background:rgba(255,255,255,0.3);
	color:#fff; font-size:22rpx;
	padding:6rpx 16rpx; border-radius:6rpx;
}
.cover-title {
	font-size:64rpx; font-weight:800; letter-spacing:6rpx;
}
.wave-deco {
	position:absolute; left:0; right:0; bottom:0; height:120rpx;
	background:
		radial-gradient(120rpx 50rpx at 20% 50%, rgba(255,255,255,0.25), transparent 70%),
		radial-gradient(160rpx 50rpx at 70% 50%, rgba(255,255,255,0.2), transparent 70%);
}

/* 信息块 */
.info-block {
	background:#fff;
	padding:28rpx 30rpx 30rpx;
}
.info-top { display:flex; justify-content:flex-start; align-items:center; gap:16rpx; flex-wrap:wrap; }
.info-title { font-size:32rpx; font-weight:800; color:#222; }
.info-meta { font-size:24rpx; color:#888; margin-top:14rpx; }
.course-intro {
	margin-top:12rpx;
	color:#64748b;
	font-size:24rpx;
	line-height:1.6;
}
.update-meta {
	display:inline-flex;
	align-items:center;
	gap:10rpx;
	padding:8rpx 14rpx;
	border:1rpx solid #f3d8c5;
	border-radius:10rpx;
	color:#9a4b18;
	font-size:24rpx;
	font-weight:700;
	background:#fff8f1;
}
.update-label { color:#8a94a3; font-weight:700; }
.update-date { color:#c2410c; font-weight:900; }
.version-stats {
	display:grid;
	grid-template-columns:repeat(2, minmax(0, 1fr));
	gap:12rpx;
	margin-top:18rpx;
}
.version-stat {
	min-width:0;
	display:flex;
	flex-direction:column;
	align-items:flex-start;
	gap:6rpx;
	padding:16rpx 18rpx;
	border-radius:14rpx;
	background:#f7f9fc;
	border:1rpx solid #e8eef5;
	color:#64748b;
	font-size:20rpx;
	line-height:1.4;
}
.version-stat-name {
	color:#0f172a;
	font-weight:800;
	white-space:nowrap;
}
.version-stat-count { color:#475569; font-weight:700; }
.version-stat-duration { color:#64748b; white-space:normal; }

.progress-row {
	display:flex; align-items:center;
	margin-top: 20rpx;
}
.p-label { font-size:24rpx; color:#666; }
.bar {
	flex:1;
	height:14rpx;
	background:#e6e8ec;
	border-radius:7rpx;
	margin: 0 14rpx;
	overflow:hidden;
}
.bar-inner { height:100%; background:#0d7cfe; }
.p-num { font-size:24rpx; color:#666; }

.learnt {
	margin-top:10rpx;
	font-size:22rpx;
	color:#888;
}

/* 三个功能 */
.funcs {
	background:#fff;
	display:flex;
	padding: 26rpx 24rpx 34rpx;
	border-top:1rpx solid #f1f3f6;
	gap:18rpx;
}
.func {
	flex:1;
	min-height:146rpx;
	position:relative;
	display:flex; flex-direction:column; align-items:center;
	justify-content:center;
	border-radius:14rpx;
	background:#fbfcfe;
	border:1rpx solid #edf1f5;
	cursor:pointer;
	transition:transform .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.func:active { transform:scale(.98); border-color:#cbdcf2; }
.func-lock { position:absolute; top:10rpx; right:10rpx; padding:3rpx 8rpx; border-radius:7rpx; background:#f1f5f9; color:#7c8798; font-size:16rpx; line-height:1.2; }
.f-ico {
	width:90rpx; height:90rpx; border-radius:18rpx;
	display:flex; align-items:center; justify-content:center;
	font-size:46rpx; color:#fff;
	margin-bottom:14rpx;
}
.f-ico.blue { background:#0d7cfe; }
.f-ico.pink { background:#e7548c; }
.f-ico.green { background:#2bb673; }
.f-text { font-size:24rpx; color:#333; }

/* 段标题（带下划线） */
.section-tab {
	background:#fff;
	text-align:center;
	color:#0d7cfe;
	font-size:28rpx;
	padding: 24rpx 0;
	position:relative;
}
.section-tab::after {
	content:'';
	position:absolute;
	left:50%; bottom:14rpx;
	transform:translateX(-50%);
	width:90rpx; height:2rpx; background:#0d7cfe;
}

/* 版本标签 */
.version-chips { display:flex; gap:16rpx; padding: 20rpx 24rpx 8rpx; background:#f5f7fa; }
.version-chip {
	height:58rpx;
	line-height:58rpx;
	padding:0 24rpx;
	border-radius:30rpx;
	background:#eef2f7;
	color:#5d6673;
	font-size:24rpx;
	font-weight:800;
}
.version-chip.active { background:#3aa3f5; color:#fff; }

/* 章节卡片 */
.chapter {
	background:#fff;
	margin: 16rpx 24rpx;
	border-radius:14rpx;
	padding: 24rpx 24rpx;
	box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.03);
}
.ch-head {
	display:flex; justify-content:space-between; align-items:center;
}
.ch-title { font-size:30rpx; font-weight:800; color:#222; }
.ch-right { display:flex; align-items:center; }
.trial {
	color:#0d7cfe; font-size:24rpx;
	text-decoration:underline; margin-right:10rpx;
}
.caret { color:#bbb; font-size:22rpx; }

.ch-body {
	display:flex; align-items:center; justify-content:space-between;
	margin-top: 24rpx;
	padding-top: 20rpx;
	border-top:1rpx dashed #eef0f3;
}
.ch-left { display:flex; align-items:center; }
.ch-mark {
	width:46rpx; height:46rpx; border-radius:8rpx;
	background:#eafbe6; color:#2bb673;
	display:flex; align-items:center; justify-content:center;
	font-size:24rpx; font-weight:700;
	margin-right:18rpx;
}
.ch-mark.practice { background:#eaf3ff; color:#0d7cfe; }
.ch-name { font-size:26rpx; color:#222; font-weight:600; }
.ch-progress { font-size:22rpx; color:#999; margin-top:4rpx; }

.ch-actions { display:flex; align-items:center; gap:10rpx; flex-shrink:0; }
.mask { position:fixed; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:200; }
.modal { width:560rpx; background:#fff; border-radius:14rpx; overflow:hidden; }
.m-title { text-align:center; padding:36rpx 0 16rpx; font-size:34rpx; color:#000; }
.m-body { text-align:center; padding:0 30rpx 36rpx; color:#888; font-size:28rpx; }
.m-actions { display:flex; border-top:1rpx solid #ececec; }
.m-btn { flex:1; height:96rpx; line-height:96rpx; text-align:center; font-size:32rpx; cursor:pointer; }
.m-btn.cancel { color:#000; }
.m-btn.ok { color:#007aff; }
.m-divider { width:1rpx; background:#ececec; }
.auth-mask {
	position:fixed;
	inset:0;
	z-index:220;
	display:flex;
	align-items:center;
	justify-content:center;
	padding:34rpx;
	background:rgba(15,23,42,.48);
	backdrop-filter:blur(8rpx);
}
.permission-modal {
	width:100%;
	max-width:560rpx;
	padding:34rpx 32rpx 28rpx;
	border-radius:24rpx;
	background:#fff;
	box-shadow:0 28rpx 70rpx rgba(15,23,42,.24);
	text-align:center;
}
.permission-icon {
	width:72rpx;
	height:72rpx;
	margin:0 auto 18rpx;
	border-radius:20rpx;
	display:flex;
	align-items:center;
	justify-content:center;
	background:#fff4e8;
	color:#c45f13;
	font-size:26rpx;
	font-weight:900;
}
.permission-title { color:#111827; font-size:34rpx; font-weight:900; letter-spacing:-1rpx; }
.permission-body { margin-top:16rpx; color:#667085; font-size:25rpx; line-height:1.65; }
.permission-confirm {
	height:76rpx;
	margin-top:28rpx;
	border-radius:14rpx;
	dis:flex;
	align-items:center;
	justify-content:center;
	background:#1677ff;
	color:#fff;
	font-size:27rpx;
	font-weight:900;
	cursor:pointer;
	transition:transform .2s ease, background-color .2s ease;
}
.permission-confirm:active { transform:scale(.98); background:#0f67df; }

.btn-go, .btn-ai {
	font-size:24rpx;
	color:#fff;
	padding:10rpx 20rpx;
	border-radius:30rpx;
	margin-left:0;
	transition:transform .2s ease, filter .2s ease;
}
.btn-go { background:#1890e1; box-shadow:0 4rpx 8rpx rgba(24,144,225,0.3); cursor:pointer; }
.btn-ai { background:#22ac38; box-shadow:0 4rpx 8rpx rgba(34,172,56,0.3); cursor:pointer; }
.btn-go:active, .btn-ai:active { transform:scale(.96); filter:brightness(.96); }

.tabs {
	background:#fff;
	display:flex;
	padding: 24rpx 0;
	border-top:1rpx solid #f1f3f6;
}
.tab {
	flex:1;
	text-align:center;
	font-size:26rpx;
	color:#666;
	position:relative;
	padding:8rpx 0;
	cursor:pointer;
}
.tab.active { color:#4fa9f8; font-weight:700; }
.tab.active::after {
	content:'';
	position:absolute;
	left:50%;
	bottom:-6rpx;
	transform:translateX(-50%);
	width:70rpx;
	height:4rpx;
	background:#4fa9f8;
	border-radius:4rpx;
}

.quiz-list { padding: 20rpx 24rpx; }
.trial-tip {
	margin-bottom:18rpx;
	padding:18rpx 22rpx;
	border-radius:12rpx;
	background:#fff7ed;
	color:#b45309;
	font-size:24rpx;
	line-height:1.5;
}
.quiz {
	background:#fff;
	border-radius:14rpx;
	padding:22rpx 24rpx;
	margin-bottom:18rpx;
	display:flex;
	align-items:center;
	justify-content:space-between;
	box-shadow:0 2rpx 8rpx rgba(0,0,0,0.03);
}
.quiz-left { display:flex; align-items:center; min-width:0; }
.q-mark {
	width:46rpx;
	height:46rpx;
	border-radius:8rpx;
	background:#eaf3fc;
	color:#4fa9f8;
	display:flex;
	align-items:center;
	justify-content:center;
	font-size:24rpx;
	font-weight:700;
	margin-right:16rpx;
	flex-shrink:0;
}
.q-name { font-size:28rpx; color:#222; font-weight:600; }
.q-status { font-size:22rpx; color:#999; margin-top:4rpx; }
.q-btn {
	background:#4fa9f8;
	color:#fff;
	font-size:24rpx;
	padding:10rpx 24rpx;
	border-radius:30rpx;
	flex-shrink:0;
	cursor:pointer;
}
.empty-tab {
	margin:70rpx 30rpx;
	text-align:center;
	color:#9aa1a9;
	font-size:28rpx;
}
.minor-panel {
	margin:24rpx;
	padding:28rpx;
	background:#fff;
	border-radius:16rpx;
	border:1rpx solid #edf0f4;
}
.minor-title {
	font-size:32rpx;
	color:#222;
	font-weight:800;
}
.minor-text {
	margin-top:12rpx;
	color:#697386;
	font-size:26rpx;
	line-height:1.5;
}
.minor-btn {
	margin-top:24rpx;
	height:74rpx;
	line-height:74rpx;
	text-align:center;
	border-radius:12rpx;
	background:#4fa9f8;
	color:#fff;
	font-size:28rpx;
	font-weight:700;
}
.minor-btn.locked {
	background:#eef2f7;
	color:#596272;
	cursor:pointer;
}

/* Desktop course cover polish */
.cover {
	margin:18rpx 20rpx 0;
	border-radius:22rpx 22rpx 0 0;
	border:1rpx solid #e2e8f0;
	border-bottom:0;
	background:#f8fafc;
}
.cover-banner { height:auto; aspect-ratio:1476 / 472; }
.cover-poster { height:auto; aspect-ratio:4 / 3; }
.cover-img {
	object-fit:cover;
	background:#f8fafc;
}
.cover-img :deep(div) {
	background-size:cover !important;
	background-repeat:no-repeat !important;
	background-position:center center !important;
}
.info-block {
	margin:0 20rpx 18rpx;
	border:1rpx solid #e2e8f0;
	border-top:0;
	border-radius:0 0 22rpx 22rpx;
	box-shadow:0 14rpx 34rpx rgba(30,58,92,.08);
}
@media screen and (max-width: 420px) {
	.cover {
		margin:14rpx 16rpx 0;
		border-radius:20rpx 20rpx 0 0;
	}
	.info-block {
		margin:0 16rpx 16rpx;
		border-radius:0 0 20rpx 20rpx;
	}
	.version-stats { grid-template-columns:1fr; }
	.func-lock { display:none; }
	.ch-actions { gap:8rpx; }
	.btn-go, .btn-ai { padding:10rpx 16rpx; }
}
@media screen and (min-width: 768px) {
	.nav { left:50%; right:auto; width:var(--wk-app-width, 430px); max-width:100vw; transform:translateX(-50%); }
}
</style>
