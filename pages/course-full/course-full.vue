<template>
	<view class="page">
		<!-- 导航 -->
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">{{displayCourseName}}</view>
		</view>

		<!-- 封面 -->
		<view class="cover" :class="coverClass">
			<image v-if="cover" class="cover-img" :src="cover" :mode="coverMode" @load="onCoverLoad" />
			<view v-else class="cover-fallback" :style="{background: bg}">
				<view class="cover-title">{{title}}</view>
			</view>
		</view>

		<!-- 信息块 -->
		<view class="info-block">
			<view class="info-top">
				<view class="info-title">{{displayCourseName}}</view>
				<view class="star">☆</view>
			</view>
			<view class="info-meta">共计{{total}}节，课程时长：{{duration}}</view>
			<view class="update-meta">
				<text class="update-label">最近更新</text>
				<text class="update-date">{{displayUpdateDate}}</text>
			</view>
			<view class="progress-row">
				<text class="p-label">学习进度：</text>
				<view class="bar"><view class="bar-inner" :style="{width: progress+'%'}"></view></view>
				<text class="p-num">{{progress}}%</text>
				<text class="p-extra">已学课程节数{{learntCount}}节，已学时长：{{learntDuration}}</text>
			</view>
		</view>

		<!-- 三功能 -->
		<view class="funcs">
			<view class="func" @click="goDocs"><view class="f-ico blue">📄</view><text class="f-text">我的文档</text></view>
			<view class="func" @click="goPlan"><view class="f-ico pink">📋</view><text class="f-text">学习打卡</text></view>
			<view class="func" @click="goReport"><view class="f-ico green">📊</view><text class="f-text">学习报告</text></view>
		</view>

		<study-checkin-card v-if="showCheckinPanel" :course-id="courseId" />

		<!-- Tabs -->
		<view class="tabs">
			<view class="tab" v-for="(t,i) in projectTabs" :key="t" :class="{active: tab===i}" @click="setTab(i)">{{t}}</view>
		</view>

		<!-- 技巧干货 -->
		<block v-if="tab===0">
			<view class="chip-row">
				<view class="chip" v-for="(v,i) in versions" :key="v.name || v" :class="{active: versionIndex===i}" @click="setVersion(i)">{{versionLabel(v, i)}}</view>
			</view>

			<view class="chap-list">
				<view class="chap" v-for="(c,i) in chapters" :key="i">
					<view class="chap-head" @click="toggle(i)">
						<text class="chap-title">{{c.title}}</text>
						<view class="chap-right">
							<text class="lock" v-if="locked">🔒</text>
							<text class="caret" :class="{open: c.open}">{{c.open ? '⌄' : '›'}}</text>
						</view>
					</view>
					<view class="chap-sub" v-if="c.open">
						<view class="sub-row" v-for="(s,j) in c.items" :key="j">
							<text class="sub-title">{{s.title || s}}</text>
							<view class="sub-right">
								<text class="lock" v-if="locked">🔒</text>
								<text class="caret">›</text>
							</view>
							<view class="lesson-children" v-if="s.children && s.children.length">
								<view class="lesson-child" v-for="(child,k) in s.children" :key="k">
									<view class="child-left">
										<view class="child-mark" :class="{practice:child.type===2}">{{child.type===2 ? '练' : '学'}}</view>
										<view>
											<view class="child-name">{{childName(child, c, s, j)}}</view>
											<view class="child-progress">已学习：{{progressText(child)}}</view>
										</view>
									</view>
									<view class="child-actions">
										<view class="child-btn go" @click.stop="goLesson(c, s, child, j)">{{child.type===2 ? '去练习' : '去学习'}}</view>
										<view class="child-btn ai" @click.stop="goAi(s.title || s)">AI问答</view>
									</view>
									<view class="knowledge-panel" v-if="isKnowledgeChild(child)">
										<view class="knowledge-item" @click.stop="goLesson(c, s, child, j)">
											<text class="knowledge-type video">视频</text>
											<text class="knowledge-name">视频课程</text>
										</view>
										<view class="knowledge-item" @click.stop="goDocs">
											<text class="knowledge-type doc">讲义</text>
											<text class="knowledge-name">文字讲义</text>
										</view>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
			</view>
		</block>

		<!-- 章节扫雷 -->
		<block v-if="tab===1">
			<view class="quiz-list">
				<view class="quiz" v-for="(q,i) in quizzes" :key="i">
					<view class="quiz-left">
							<view class="q-mark">测</view>
							<view>
								<view class="q-name">{{q.name}}</view>
								<view class="q-status">{{q.status || '未学习'}}</view>
							</view>
						</view>
					<view class="quiz-right">
						<view class="download" @click="goDocs">下载</view>
						<view class="q-btn" @click="goQuiz(q)">{{q.action || '去测评'}}</view>
					</view>
				</view>
			</view>
		</block>

		<view class="minor-panel" v-if="tab===2">
			<view class="minor-title">错题与巩固</view>
			<view class="minor-text">当前课程错题共25道，可继续巩固薄弱题型。</view>
			<view class="minor-btn" @click="goWrongBook">进入错题与巩固</view>
		</view>

		<view class="reinforce-section" v-if="tab===3">
			<view class="reinforce-head">
				<view>
					<view class="reinforce-title">{{displayCourseName}}</view>
					<view class="reinforce-sub">共{{reinforceList.length || 17}}个知识点</view>
				</view>
				<view class="reinforce-time">共xx小时xx分钟</view>
			</view>
			<view class="reinforce-empty" v-if="!reinforceList.length">暂无复习加强内容</view>
			<view class="reinforce-row" v-for="item in reinforceList" :key="item.id">
				<view class="point-badge">知</view>
				<view class="point-main">
					<view class="point-title">{{item.title}}</view>
					<view class="point-status">{{item.status || '未学'}}-添加日期：{{formatDateTime(item.createdAt)}}</view>
				</view>
				<view class="point-btn" @click="startReinforce(item)">去学习</view>
			</view>
		</view>

		<view style="height:160rpx"></view>

		<!-- 底部开通栏 -->
		<view class="footer" v-if="showFooter">
			<view class="apply" @click="showApplyAuth">
				<view class="apply-ico">📦</view>
				<text class="apply-text">申请授权</text>
			</view>
			<view class="active" @click="goActivate">激活课程</view>
		</view>

		<view class="auth-mask" v-if="showAuth">
			<view class="auth-modal">
				<view class="auth-title">请联系下方微信申请</view>
				<view class="auth-wechat">微信号：<text>{{wechatId}}</text></view>
				<view class="auth-copy" @click="copyWechat">一键复制微信号</view>
				<view class="auth-close" @click="showAuth=false">关闭</view>
			</view>
		</view>
	</view>
</template>

<script>
import { cleanCourseDisplayName, getGaokaoMathCourse, isGaokaoMath, stripCourseYear } from '@/common/course-data.js'
import { getCourse, getReinforce } from '@/common/api.js'
import StudyCheckinCard from '@/components/study-checkin-card.vue'
export default {
	components: { StudyCheckinCard },
	data() {
		return {
			title: '中考语文',
			courseName: '《中考语文》',
			updatedAt: '2026-05-26T10:15:00',
			bg: 'linear-gradient(135deg,#c94f7c 0%,#7e3a6b 100%)',
			total: 105,
			duration: '20小时37分',
			realDuration: '02小时23分',
			progress: 0,
			learntCount: 0,
			learntDuration: '00小时00分',
			cover: '',
			coverRatio: 0,
			tab: 0,
			showCheckinPanel: false,
			projectTabs: ['技巧干货','章节扫雷','错题与巩固','知识巩固'],
			versionIndex: 0,
			versions: [
				{ name:'复习加强课', chapters: [] },
				{ name:'技巧绝招课', chapters: [] }
			],
			locked: true,
			showFooter: true,
			showAuth: false,
			wechatId: 'DYR7314',
			courseId: 'gk-math-full',
			reinforceList: [],
			reinforceLoaded: false,
			chapters: [
				{ title:'一、基础运用提升系列', open:true, items:[
					'巧辨字音字形','词语理解运用','病句辨析解题技巧','文学文化常识突破','句子的连贯得体',
					'拟写、仿写解题技巧','图文转换技巧','标点符号辨析','书法类考点突破','修辞手法答题技巧','对联题解题技巧'
				]},
				{ title:'二、现代文阅读提升系列', open:false, items:[] },
				{ title:'三、古诗文提升系列', open:false, items:[] },
				{ title:'四、作文提升系列', open:false, items:[] }
			],
			quizzes: [
				{ name:'入门测' },
				{ name:'第一章 汉字' },
				{ name:'第二章 词汇' },
				{ name:'第三章 句子' },
				{ name:'第四章 文学文化常识' },
				{ name:'第五章 名篇名句默写' },
				{ name:'第六章 语言表达的要求' },
				{ name:'第七章 语言表达的应用' },
				{ name:'第八章 文言文阅读' }
			]
		}
	},
	computed: {
		coverClass() {
			return this.isPosterCover ? 'cover-poster' : 'cover-banner';
		},
		coverMode() {
			return 'aspectFit';
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
		}
	},
	async onLoad(opts) {
		if (opts && opts.title) {
			this.title = stripCourseYear(decodeURIComponent(opts.title));
			this.courseName = `《${this.title}》`;
			this.courseId = this.resolveCourseId(this.title, 'full');
		}
		if (opts && opts.bg) this.bg = decodeURIComponent(opts.bg);
		if (opts && opts.cover) this.setCover(decodeURIComponent(opts.cover));
		if (opts && opts.id) {
			await this.loadCourse(opts.id);
		} else if ((opts && opts.subject === 'gaokao-math') || isGaokaoMath(this.title)) {
			this.applyMathCourse();
		}
		if (!this.versions.some(item => item.chapters && item.chapters.length)) {
			this.versions = this.normalizeVersions({}, this.chapters);
		}
	},
	methods: {
		async loadCourse(id) {
			try {
				const course = await getCourse(id);
				this.applyRemoteCourse(course);
			} catch (err) {
				console.warn('正式课接口不可用，使用本地详情', err);
				if (isGaokaoMath(this.title)) this.applyMathCourse();
			}
		},
		applyRemoteCourse(course) {
			this.courseId = course.id || this.courseId;
			this.reinforceLoaded = false;
			this.reinforceList = [];
			this.title = course.title || this.title;
			this.courseName = stripCourseYear(course.courseName || this.courseName);
			this.updatedAt = course.updatedAt || course.updateTime || course.createdAt || this.updatedAt;
			this.setCover(course.detailCover || course.cover || this.cover);
			const stats = this.resolveCourseStats(course);
			this.total = stats.totalLessons || this.total;
			this.duration = stats.totalDuration || this.duration;
			this.realDuration = course.practiceDuration || this.realDuration;
			this.progress = course.progress || 0;
			this.learntCount = course.readStudyCount || 0;
			this.learntDuration = course.readDuration || '00小时00分';
			this.versions = this.normalizeVersions(course, course.chapters || this.chapters);
			this.quizzes = course.quizzes || this.quizzes;
			this.locked = course.subject === 'gaokao-math' ? false : this.locked;
			this.showFooter = course.subject === 'gaokao-math' ? false : this.showFooter;
			this.setVersion(0);
		},
		goBack() { uni.navigateBack({ fail:()=>{} }); },
		setCover(value) {
			if (value === this.cover) return;
			this.cover = value || '';
			this.coverRatio = 0;
		},
		onCoverLoad(event) {
			const detail = (event && event.detail) || {};
			if (detail.width && detail.height) {
				this.coverRatio = detail.width / detail.height;
			}
		},
		toggle(i) { this.chapters[i].open = !this.chapters[i].open; },
		applyMathCourse() {
			const course = getGaokaoMathCourse('full');
			this.courseId = 'gk-math-full';
			this.reinforceLoaded = false;
			this.reinforceList = [];
			this.title = course.title;
			this.courseName = stripCourseYear(course.courseName);
			this.updatedAt = course.updatedAt || this.updatedAt;
			this.setCover(course.detailCover || course.cover);
			const stats = this.resolveCourseStats(course);
			this.total = stats.totalLessons || course.totalLessons;
			this.duration = stats.totalDuration || course.totalDuration;
			this.realDuration = course.practiceDuration;
			this.progress = course.progress;
			this.learntCount = course.readStudyCount;
			this.learntDuration = course.readDuration;
			this.versions = this.normalizeVersions(course, course.chapters || this.chapters);
			this.quizzes = course.quizzes;
			this.locked = false;
			this.showFooter = false;
			this.setVersion(0);
		},
		setVersion(i) {
			this.versionIndex = i;
			if (this.versions[i] && this.versions[i].chapters && this.versions[i].chapters.length) this.chapters = this.versions[i].chapters;
		},
		normalizeVersions(course = {}, fallbackChapters = []) {
			const baseChapters = course.chapters || fallbackChapters || [];
			const source = Array.isArray(course.versions) && course.versions.length ? course.versions : [];
			const normalized = source.map((item, index) => ({
				...(typeof item === 'object' ? item : { name: item }),
				name: index === 0 ? '复习加强课' : '技巧绝招课',
				chapters: (item && item.chapters) || baseChapters
			}));
			while (normalized.length < 2) {
				normalized.push({
					name: normalized.length === 0 ? '复习加强课' : '技巧绝招课',
					chapters: baseChapters
				});
			}
			return normalized.slice(0, 2);
		},
		resolveCourseId(title = '', kind = 'full') {
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
		setTab(i) {
			this.tab = i;
			if (i === 3) this.loadReinforce();
		},
		async loadReinforce() {
			if (this.reinforceLoaded) return;
			try {
				this.reinforceList = await getReinforce(this.courseId);
				this.reinforceLoaded = true;
			} catch (err) {
				uni.showToast({ title: err.message || '加载失败', icon: 'none' });
			}
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
		progressText(item) {
			if (item.type === 2) return `${item.read || 0}/${item.total || 0}`;
			return `${Math.round(((item.read || 0) / (item.total || 1)) * 100)}%`;
		},
		versionLabel(version, index) {
			return index === 0 ? '复习加强课' : '技巧绝招课';
		},
		childName(child, chapter, lesson, lessonIndex) {
			if (this.versionIndex === 0) {
				return child.type === 2 ? this.reinforceTestName(chapter, lesson, lessonIndex) : '知识点巩固';
			}
			return child.type === 2 ? '真题讲练' : '技巧绝招课';
		},
		isKnowledgeChild(child) {
			return this.versionIndex === 0 && child.type !== 2;
		},
		reinforceTestName(chapter, lesson, lessonIndex) {
			return `复习测试【${this.chapterShortName(chapter)}】${this.lessonNo(lesson, lessonIndex)}`;
		},
		chapterShortName(chapter) {
			const raw = String((chapter && chapter.title) || '');
			return raw.replace(/^\s*[一二三四五六七八九十百千万\d]+[、.．]\s*/, '').trim() || raw || '复习';
		},
		lessonNo(lesson, lessonIndex) {
			const raw = String((lesson && lesson.title) || lesson || '');
			const match = raw.match(/^\s*(\d+)[.．、]/);
			return match ? match[1] : String((lessonIndex || 0) + 1);
		},
		goDocs() { uni.navigateTo({ url:`/pages/my-docs/my-docs?courseId=${encodeURIComponent(this.courseId)}&kw=${encodeURIComponent(this.displayCourseName.replace(/[《》]/g, ''))}` }); },
		goPlan() {
			this.showCheckinPanel = !this.showCheckinPanel;
			if (this.showCheckinPanel) this.tab = 0;
		},
		goReport() { uni.navigateTo({ url:`/pages/study-report/study-report?courseId=${encodeURIComponent(this.courseId)}` }); },
		goAi(context) { uni.navigateTo({ url:`/pages/ai-chat/ai-chat?context=${encodeURIComponent(context || this.courseName)}` }); },
		goQuiz(q) { uni.navigateTo({ url:`/pages/practice/practice?type=quiz&quizId=${encodeURIComponent(q.name)}&title=${encodeURIComponent(q.name)}` }); },
		goWrongBook() { uni.navigateTo({ url:`/pages/wrongbook/wrongbook?courseId=${encodeURIComponent(this.courseId)}&title=${encodeURIComponent(this.displayCourseName)}` }); },
		goReinforce() { uni.navigateTo({ url:`/pages/reinforce/reinforce?courseId=${encodeURIComponent(this.courseId)}` }); },
		startReinforce(item) { uni.navigateTo({ url:`/pages/lesson/lesson?title=${encodeURIComponent(item.title)}&courseId=${encodeURIComponent(this.courseId)}&courseTitle=${encodeURIComponent(this.displayCourseName)}&chapterTitle=${encodeURIComponent('复习加强')}` }); },
		goActivate() { uni.navigateTo({ url:`/pages/activate/activate?courseId=${encodeURIComponent(this.courseId)}` }); },
		showApplyAuth() { this.showAuth = true; },
		copyWechat() {
			uni.setClipboardData({
				data: this.wechatId,
				success: () => uni.showToast({ title:'微信号已复制', icon:'success' })
			});
		},
		goLesson(chapter, lesson, child, lessonIndex) {
			if (child.type === 2) {
				const title = this.versionIndex === 0 ? this.reinforceTestName(chapter, lesson, lessonIndex) : (lesson.title || lesson);
				const type = this.versionIndex === 0 ? 'reinforce' : 'practice';
				const practiceTitle = lesson.title || lesson;
				uni.navigateTo({ url:`/pages/practice/practice?type=${type}&title=${encodeURIComponent(title)}&practiceTitle=${encodeURIComponent(practiceTitle)}&courseId=${encodeURIComponent(this.courseId)}` });
				return;
			}
			uni.navigateTo({ url:`/pages/lesson/lesson?title=${encodeURIComponent(lesson.title || lesson)}&courseId=${encodeURIComponent(this.courseId)}&courseTitle=${encodeURIComponent(this.displayCourseName)}&chapterTitle=${encodeURIComponent(chapter.title || '')}` });
		},
		formatCourseDate(value) {
			const raw = value ? String(value) : '2026-05-26';
			const match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
			if (!match) return raw;
			return `${match[1]}年${match[2].padStart(2, '0')}月${match[3].padStart(2, '0')}日`;
		},
		formatDateTime(value) {
			return value ? String(value).replace('T', ' ').slice(0, 19) : '2026-01-25 19:57:51';
		},
		toast(title) { uni.showToast({ title, icon:'none' }); }
	}
}
</script>

<style lang="scss">
page { background:#f5f7fa; }
.page { min-height:100vh; background:#f5f7fa; }

.nav {
	position:relative; height:90rpx;
	background:#fff;
	display:flex; align-items:center; justify-content:center;
	border-bottom:1rpx solid #eef0f3;
}
.back { position:absolute; left:24rpx; font-size:46rpx; font-weight:300; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; color:#222; font-weight:600; }

.cover { position:relative; overflow:hidden; background:#f3f6fb; }
.cover-banner { height:240rpx; }
.cover-poster { height:562rpx; background:#fff; }
.cover-img { width:100%; height:100%; display:block; }
.cover-fallback { height:100%; display:flex; align-items:center; color:#fff; padding-left:50rpx; }
.cover-title {
	font-size:60rpx; font-weight:800; letter-spacing:6rpx;
}
.wave-deco {
	position:absolute; left:0; right:0; bottom:0; height:120rpx;
	background:
		radial-gradient(120rpx 50rpx at 20% 50%, rgba(255,255,255,0.25), transparent 70%),
		radial-gradient(160rpx 50rpx at 70% 50%, rgba(255,255,255,0.2), transparent 70%);
}

.info-block { background:#fff; padding: 24rpx 30rpx; }
.info-top { display:flex; justify-content:space-between; align-items:center; }
.info-title { font-size:32rpx; font-weight:800; color:#222; }
.star { font-size:42rpx; color:#cfd3da; }
.info-meta { font-size:24rpx; color:#888; margin-top:14rpx; }
.update-meta {
	display:inline-flex;
	align-items:center;
	gap:10rpx;
	margin-top:14rpx;
	padding:8rpx 14rpx;
	border:1rpx solid #f3d8c5;
	border-radius:10rpx;
	color:#9a4b18;
	font-size:24rpx;
	font-weight:700;
	background:#fff8f1;
}
.update-label {
	color:#8a94a3;
	font-weight:700;
}
.update-date {
	color:#c2410c;
	font-weight:900;
}
.progress-row {
	display:flex; align-items:center;
	margin-top: 18rpx;
	flex-wrap:wrap;
}
.p-label { font-size:24rpx; color:#666; }
.bar {
	width:200rpx; height:14rpx;
	background:#e6e8ec; border-radius:7rpx;
	margin: 0 14rpx; overflow:hidden;
}
.bar-inner { height:100%; background:#3aa3f5; }
.p-num { font-size:24rpx; color:#666; margin-right:24rpx; }
.p-extra { font-size:24rpx; color:#888; }

.funcs { background:#fff; display:flex; padding: 26rpx 24rpx 34rpx; border-top:1rpx solid #f1f3f6; gap:18rpx; }
.func {
	flex:1;
	min-height:146rpx;
	display:flex;
	flex-direction:column;
	align-items:center;
	justify-content:center;
	border-radius:14rpx;
	background:#fbfcfe;
	border:1rpx solid #edf1f5;
	cursor:pointer;
}
.f-ico {
	width:90rpx; height:90rpx; border-radius:18rpx;
	display:flex; align-items:center; justify-content:center;
	font-size:46rpx; color:#fff; margin-bottom:14rpx;
}
.f-ico.blue { background:#3aa3f5; }
.f-ico.pink { background:#e7548c; }
.f-ico.green { background:#2bb673; }
.f-text { font-size:24rpx; color:#333; }

/* Tabs */
.tabs {
	background:#fff;
	display:flex;
	padding: 18rpx 24rpx 14rpx;
	border-top:1rpx solid #f1f3f6;
	gap:10rpx;
}
.tab {
	flex:1;
	height:64rpx;
	line-height:64rpx;
	text-align:center;
	font-size:28rpx; color:#555; font-weight:600;
	position:relative;
	padding:0;
	border-radius:8rpx;
	cursor:pointer;
}
.tab.active { background:#eaf8f1; color:#24b873; font-weight:800; }
.tab.active::after {
	content:''; position:absolute;
	left:50%; bottom:-8rpx; transform:translateX(-50%);
	width:72rpx; height:4rpx; border-radius:4rpx; background:#39a8d8;
}

/* Chips */
.chip-row { padding: 22rpx 30rpx 8rpx; display:flex; gap:16rpx; }
.chip {
	min-width:170rpx;
	height:58rpx;
	line-height:58rpx;
	text-align:center;
	font-size:24rpx;
	padding:0 22rpx;
	border-radius:30rpx;
	background:#f0f2f5;
	color:#777;
	font-weight:700;
	box-sizing:border-box;
}
.chip.active {
	background:#3aa3f5;
	color:#fff;
	box-shadow:0 6rpx 14rpx rgba(58,163,245,.18);
}

/* 章节 */
.chap-list { padding: 10rpx 24rpx; }
.chap { margin-bottom: 18rpx; }
.chap-head {
	background:#eef1f5;
	height:90rpx;
	border-radius:14rpx;
	display:flex; justify-content:space-between; align-items:center;
	padding: 0 30rpx;
	cursor:pointer;
}
.chap-title { font-size:30rpx; color:#222; font-weight:700; }
.chap-right, .sub-right { display:flex; align-items:center; }
.lock { font-size:26rpx; color:#9aa1a9; margin-right:18rpx; }
.caret { font-size:32rpx; color:#9aa1a9; }
.caret.open { font-size:30rpx; }

.chap-sub { padding: 10rpx 0 0; }
.sub-row {
	background:#fff;
	min-height:80rpx;
	border-radius:10rpx;
	display:flex; justify-content:space-between; align-items:center;
	flex-wrap:wrap;
	padding: 18rpx 30rpx;
	margin-bottom: 12rpx;
	box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.03);
}
.sub-title { font-size:28rpx; color:#222; font-weight:600; max-width:560rpx; }
.lesson-children { width:100%; padding-top:16rpx; }
.lesson-child {
	display:flex;
	justify-content:space-between;
	align-items:center;
	flex-wrap:wrap;
	padding:14rpx 0;
	border-top:1rpx dashed #edf0f3;
}
.child-left { display:flex; align-items:center; flex:1; min-width:0; margin-right:16rpx; }
.child-mark {
	width:42rpx;
	height:42rpx;
	border-radius:8rpx;
	background:#eafbe6;
	color:#2bb673;
	display:flex;
	align-items:center;
	justify-content:center;
	font-size:22rpx;
	font-weight:700;
	margin-right:14rpx;
	flex-shrink:0;
}
.child-mark.practice { background:#eaf3fc; color:#3aa3f5; }
.child-name { font-size:25rpx; color:#222; font-weight:600; line-height:1.35; word-break:break-all; }
.child-progress { font-size:21rpx; color:#999; margin-top:4rpx; }
.child-actions { display:flex; align-items:center; flex-shrink:0; }
.child-btn {
	color:#fff;
	font-size:22rpx;
	padding:8rpx 18rpx;
	border-radius:28rpx;
	margin-left:10rpx;
	cursor:pointer;
}
.child-btn.go { background:#3aa3f5; }
.child-btn.ai { background:#2bb673; }
.knowledge-panel {
	width:calc(100% - 56rpx);
	margin:14rpx 0 2rpx 56rpx;
	padding:14rpx 16rpx;
	background:#f8fafc;
	border:1rpx solid #edf0f3;
	border-radius:10rpx;
	display:flex;
	gap:14rpx;
}
.knowledge-item {
	flex:1;
	min-width:0;
	height:56rpx;
	padding:0 14rpx;
	border-radius:8rpx;
	background:#fff;
	display:flex;
	align-items:center;
	cursor:pointer;
}
.knowledge-type {
	flex-shrink:0;
	margin-right:10rpx;
	padding:4rpx 8rpx;
	border-radius:6rpx;
	font-size:20rpx;
	font-weight:800;
}
.knowledge-type.video { background:#eaf3fc; color:#3aa3f5; }
.knowledge-type.doc { background:#eafbe6; color:#2bb673; }
.knowledge-name { color:#333; font-size:24rpx; font-weight:700; }

/* 章节扫雷 */
.quiz-list { padding: 16rpx 24rpx; }
.quiz {
	background:#fff;
	border-radius:14rpx;
	padding: 20rpx 24rpx;
	margin-bottom: 18rpx;
	display:flex; justify-content:space-between; align-items:center;
	box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03);
}
.quiz-left { display:flex; align-items:center; flex:1; min-width:0; }
.q-mark {
	width:46rpx; height:46rpx; border-radius:8rpx;
	background:#eaf3fc; color:#3aa3f5;
	display:flex; align-items:center; justify-content:center;
	font-size:24rpx; font-weight:700;
	margin-right:16rpx;
}
.q-name { font-size:28rpx; color:#222; font-weight:600; line-height:1.35; }
.q-status { font-size:22rpx; color:#999; margin-top:4rpx; }
.quiz-right { display:flex; align-items:center; flex-shrink:0; margin-left:14rpx; }
.download {
	color:#3aa3f5;
	font-size:24rpx;
	margin-right:14rpx;
	white-space:nowrap;
	cursor:pointer;
}
.q-btn {
	background:#3aa3f5;
	color:#fff;
	font-size:24rpx;
	padding: 10rpx 26rpx;
	border-radius:30rpx;
	white-space:nowrap;
	cursor:pointer;
}

.minor-panel {
	margin:24rpx;
	background:#fff;
	border-radius:14rpx;
	padding:34rpx 30rpx;
	box-shadow:0 2rpx 8rpx rgba(0,0,0,.03);
}
.minor-title { font-size:32rpx; color:#222; font-weight:800; }
.minor-text { font-size:26rpx; color:#666; margin-top:14rpx; line-height:1.6; }
.minor-btn {
	display:inline-block;
	margin-top:24rpx;
	background:#3aa3f5;
	color:#fff;
	font-size:26rpx;
	padding:12rpx 28rpx;
	border-radius:32rpx;
	cursor:pointer;
}
.reinforce-section { background:#fff; padding:0 24rpx 28rpx; }
.reinforce-head {
	display:flex;
	justify-content:space-between;
	align-items:center;
	padding:24rpx 6rpx 18rpx;
	border-bottom:1rpx solid #edf0f3;
}
.reinforce-title { color:#222; font-size:32rpx; font-weight:900; }
.reinforce-sub, .reinforce-time { color:#8a94a3; font-size:24rpx; margin-top:6rpx; }
.reinforce-empty { padding:80rpx 0; text-align:center; color:#8a94a3; font-size:26rpx; }
.reinforce-row {
	min-height:104rpx;
	display:flex;
	align-items:center;
	border-bottom:1rpx solid #edf0f3;
	gap:18rpx;
}
.point-badge {
	width:34rpx;
	height:34rpx;
	border-radius:6rpx;
	border:1rpx solid #7ccfe0;
	color:#26a3bd;
	display:flex;
	align-items:center;
	justify-content:center;
	font-size:21rpx;
	flex-shrink:0;
}
.point-main { flex:1; min-width:0; }
.point-title { color:#222; font-size:28rpx; font-weight:700; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; }
.point-status { margin-top:8rpx; color:#8a94a3; font-size:22rpx; }
.point-btn {
	flex-shrink:0;
	min-width:110rpx;
	height:58rpx;
	line-height:58rpx;
	text-align:center;
	border-radius:30rpx;
	background:#3aa3f5;
	color:#fff;
	font-size:24rpx;
	font-weight:800;
}

/* Footer */
.footer {
	position:fixed; left:0; right:0; bottom:0;
	height:120rpx;
	background:#fff;
	display:flex; align-items:center;
	border-top:1rpx solid #eef0f3;
}
.apply {
	width:160rpx;
	display:flex; flex-direction:column; align-items:center;
	color:#222;
	cursor:pointer;
}
.apply-ico { font-size:36rpx; }
.apply-text { font-size:24rpx; margin-top:2rpx; font-weight:700; }
.card-open {
	flex:1;
	background:#3aa3f5;
	color:#fff;
	height:100%;
	display:flex; flex-direction:column; align-items:center; justify-content:center;
	cursor:pointer;
}
.card-title { font-size:30rpx; font-weight:800; }
.card-text { font-size:22rpx; margin-top:2rpx; }
.footer .active {
	flex:1;
	background:#2bb673;
	color:#fff;
	height:100%;
	display:flex; align-items:center; justify-content:center;
	font-size:30rpx; font-weight:700;
	cursor:pointer;
}
.auth-mask {
	position:fixed;
	inset:0;
	background:rgba(0,0,0,.45);
	display:flex;
	align-items:center;
	justify-content:center;
	z-index:300;
}
.auth-modal {
	width:560rpx;
	background:#fff;
	border-radius:18rpx;
	overflow:hidden;
	text-align:center;
}
.auth-title {
	padding:42rpx 28rpx 22rpx;
	color:#222;
	font-size:34rpx;
	font-weight:800;
}
.auth-wechat {
	color:#333;
	font-size:30rpx;
}
.auth-wechat text {
	color:#39a8d8;
	text-decoration:underline;
	font-weight:800;
}
.auth-copy, .auth-close {
	height:88rpx;
	line-height:88rpx;
	border-top:1rpx solid #eef0f3;
	font-size:28rpx;
	font-weight:700;
}
.auth-copy { color:#39a8d8; margin-top:34rpx; }
.auth-close { color:#596272; }
</style>
