<template>
	<view class="page">
		<!-- 导航 -->
		<view class="nav">
			<view class="back" @click="goBack">‹</view>
			<view class="nav-title">{{displayCourseName}}</view>
		</view>

		<!-- 封面 -->
		<view class="cover" :class="coverClass">
			<image v-if="cover" class="cover-img" :src="cover" :mode="coverMode" @load="onCoverLoad" @error="onCoverError" />
			<view v-else class="cover-fallback" :style="{background: bg}">
				<view class="cover-title">{{title}}</view>
			</view>
		</view>

		<!-- 信息块 -->
		<view class="info-block">
			<view class="info-top">
				<view class="info-title">{{displayCourseName}}</view>
				<view class="update-meta">
					<text class="update-label">最近更新</text>
					<text class="update-date">{{displayUpdateDate}}</text>
				</view>
			</view>
			<view class="info-meta">共计{{total}}节，课程时长：{{duration}}</view>
			<view class="version-stats" v-if="versionSummaries.length">
				<view class="version-stat" v-for="item in versionSummaries" :key="item.label">
					<text class="version-stat-name">{{item.label}}</text>
					<text v-if="item.total">共{{item.total}}节</text>
					<text>课程时长：{{item.duration}}</text>
				</view>
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

		<view class="course-actions-area" @click="collapseCheckinPanel">
			<!-- Tabs -->
			<view class="tabs">
				<view class="tab" v-for="(t,i) in projectTabs" :key="t" :class="{active: tab===i}" @click="setTab(i)">{{t}}</view>
			</view>

			<!-- 技巧干货 -->
			<block v-if="tab===0">
				<view class="chip-row">
					<view class="chip" v-for="(v,i) in visibleVersions" :key="v.name || v" :class="{active: versionIndex===i}" @click="setVersion(i)">{{versionLabel(v, i)}}</view>
				</view>

				<view class="chap-list">
					<view class="chap" v-for="(c,i) in chapters" :key="i">
						<view class="chap-head" @click.stop="toggle(i)">
							<text class="chap-title">{{c.title}}</text>
							<view class="chap-right">
								<text class="lock" v-if="locked">🔒</text>
								<text class="caret" :class="{open: c.open}">{{c.open ? '⌄' : '›'}}</text>
							</view>
						</view>
						<view class="chap-sub" v-if="c.open">
							<view class="sub-row" v-for="(s,j) in c.items" :key="j">
								<view class="sub-head" @click.stop="toggleLesson(i, j)">
									<text class="sub-title">{{ lessonHeader(i, j, s) }}</text>
									<view class="sub-right">
										<text class="lock" v-if="locked">🔒</text>
										<text class="caret" :class="{open: s.open}">{{s.open ? '⌄' : '›'}}</text>
									</view>
								</view>
								<view class="lesson-children" v-if="s.open && s.children && s.children.length">
									<view class="lesson-child" v-for="(child,k) in s.children" :key="k">
										<view class="child-left">
											<view class="child-mark" :class="{practice:child.type===2}">{{child.type===2 ? '练' : '学'}}</view>
											<view>
												<view class="child-name">{{childName(child, c, s, j)}}</view>
												<view class="child-progress">已学习：{{progressText(child)}}</view>
											</view>
										</view>
										<view class="child-actions">
											<view class="child-btn go" :class="{locked: childLessonLocked(child, s)}" @click.stop="goLesson(c, s, child, j, i)">{{ childLessonLocked(child, s) ? '🔒未解锁' : (child.type===2 ? '去练习' : '去学习') }}</view>
											<view class="child-btn ai" @click.stop="goAi(s.title || s)">AI问答</view>
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
					<view class="quiz" v-for="(q,i) in visibleQuizzes" :key="i">
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
						<view class="reinforce-sub">共{{knowledgeChapters.length ? countChapters(knowledgeChapters) : (reinforceList.length || 17)}}个知识点</view>
					</view>
					<view class="reinforce-time">共xx小时xx分钟</view>
				</view>
				<view class="chap-list knowledge-chapter-list" v-if="knowledgeChapters.length">
					<view class="chap" v-for="(c,i) in knowledgeChapters" :key="i">
						<view class="chap-head" @click.stop="toggleKnowledge(i)">
							<text class="chap-title">{{c.title}}</text>
							<view class="chap-right">
								<text class="lock" v-if="locked">🔒</text>
								<text class="caret" :class="{open: c.open}">{{c.open ? '⌄' : '›'}}</text>
							</view>
						</view>
						<view class="chap-sub" v-if="c.open">
							<view class="sub-row" v-for="(s,j) in c.items" :key="j">
								<view class="sub-head" @click.stop="toggleKnowledgeLesson(i, j)">
									<text class="sub-title">{{s.title || s}}</text>
									<view class="sub-right">
										<text class="lock" v-if="locked">🔒</text>
										<text class="caret" :class="{open: s.open}">{{s.open ? '⌄' : '›'}}</text>
									</view>
								</view>
								<view class="lesson-children" v-if="s.open && s.children && s.children.length">
									<view class="lesson-child" v-for="(child,k) in s.children" :key="k">
										<view class="child-left">
											<view class="child-mark" :class="{practice:child.type===2}">{{child.type===2 ? '练' : '学'}}</view>
											<view>
												<view class="child-name">{{knowledgeChildName(child, s)}}</view>
												<view class="child-progress">已学习：{{progressText(child)}}</view>
											</view>
										</view>
										<view class="child-actions">
											<view class="child-btn go" @click.stop="goKnowledgeChild(c, s, child, j)">{{child.type===2 ? '去练习' : '去学习'}}</view>
											<view class="child-btn ai" @click.stop="goAi(s.title || s)">AI问答</view>
										</view>
									</view>
								</view>
							</view>
						</view>
					</view>
				</view>
				<block v-else>
					<view class="reinforce-empty" v-if="!reinforceList.length">暂无复习加强内容</view>
					<view class="reinforce-row" v-for="item in reinforceList" :key="item.id">
						<view class="point-badge">知</view>
						<view class="point-main">
							<view class="point-title">{{item.title}}</view>
							<view class="point-status">{{item.status || '未学'}}-添加日期：{{formatDateTime(item.createdAt)}}</view>
						</view>
						<view class="point-btn" @click="startReinforce(item)">去学习</view>
					</view>
				</block>
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
import { getCourse, getLessonLocks, getReinforce, resolveMediaUrl } from '@/common/api.js'
import { safeNavigateBack } from '@/common/navigation.js'
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
				{ name:'技巧绝招', chapters: [] }
			],
			locked: true,
			showFooter: true,
			showAuth: false,
			lockEnabled: false,
			lockVideos: [],
			lockPractices: [],
			wechatId: 'DYR7314',
			courseId: 'gk-math-full',
			reinforceList: [],
			reinforceLoaded: false,
			knowledgeChapters: [],
			chapters: [],
			quizzes: []
		}
	},
	computed: {
		coverClass() {
			return this.isPosterCover ? 'cover-poster' : 'cover-banner';
		},
		coverMode() {
			return this.isPosterCover ? 'aspectFit' : 'aspectFill';
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
		visibleVersions() {
			return this.versions.slice(0, 2);
		},
		versionSummaries() {
			return this.visibleVersions.map((version, index) => {
				const title = index === 0 ? '复习加强' : '技巧绝招';
				const chapters = (version && version.chapters) || [];
				const rawChapters = (version && version.rawChapters) || chapters;
				const declaredTotal = this.countDeclaredChapters(rawChapters);
				return {
					label: title,
					total: declaredTotal || this.countChapters(chapters) || (index === 0 ? this.total : Number(version.totalLessons || version.lessonCount || 0)),
					duration: this.versionDuration(version, index)
				};
			}).filter(item => item.total || item.duration);
		},
		visibleQuizzes() {
			return (this.quizzes || []).filter(item => this.isVisible(item) && this.hasPracticeQuestions(item));
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
	onShow() {
		// 每次进入/返回都刷新解锁状态（看完上一节后下一节自动解锁）
		this.loadLessonLocks();
	},
	methods: {
		async loadLessonLocks() {
			try {
				const data = await getLessonLocks(this.courseId);
				this.lockEnabled = !!(data && data.enabled);
				this.lockVideos = (data && data.lockedVideos) || [];
				this.lockPractices = (data && data.lockedPractices) || [];
			} catch (e) {
				this.lockEnabled = false;
				this.lockVideos = [];
				this.lockPractices = [];
			}
		},
		childLessonLocked(child, lesson) {
			if (!this.lockEnabled) return false;
			const title = (lesson && lesson.title) || '';
			if (!title) return false;
			return Number(child.type) === 2 ? this.lockPractices.includes(title) : this.lockVideos.includes(title);
		},
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
			this.total = stats.totalLessons;
			this.duration = stats.totalDuration || '00小时00分';
			this.realDuration = course.practiceDuration || this.realDuration;
			this.progress = course.progress || 0;
			this.learntCount = course.readStudyCount || 0;
			this.learntDuration = course.readDuration || '00小时00分';
			this.versions = this.normalizeVersions(course, Array.isArray(course.chapters) ? course.chapters : []);
			this.knowledgeChapters = (this.versions[2] && this.versions[2].chapters) || [];
			this.quizzes = Array.isArray(course.quizzes) ? course.quizzes : [];
			this.applyCourseAccess(course);
			this.setVersion(0);
			this.loadLessonLocks();
		},
		applyCourseAccess(course = {}) {
			const unlocked = this.hasCourseAccess(course);
			this.locked = !unlocked;
			this.showFooter = !unlocked;
		},
		hasCourseAccess(course = {}) {
			if (course.kind && course.kind !== 'full') return true;
			return ['available', 'activated', 'authorized', 'enrolled', 'hasAccess'].some(key => {
				const value = course[key];
				return value === true || value === 'true' || value === 1 || value === '1';
			});
		},
		goBack() { safeNavigateBack('/pages/mycourse/mycourse'); },
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
		collapseCheckinPanel() {
			if (this.showCheckinPanel) this.showCheckinPanel = false;
		},
		toggle(i) {
			this.collapseCheckinPanel();
			this.chapters[i].open = !this.chapters[i].open;
		},
		toggleLesson(chapterIndex, lessonIndex) {
			this.toggleLessonIn(this.chapters, chapterIndex, lessonIndex);
		},
		toggleKnowledge(i) {
			this.collapseCheckinPanel();
			this.knowledgeChapters[i].open = !this.knowledgeChapters[i].open;
		},
		toggleKnowledgeLesson(chapterIndex, lessonIndex) {
			this.toggleLessonIn(this.knowledgeChapters, chapterIndex, lessonIndex);
		},
		toggleLessonIn(chapters, chapterIndex, lessonIndex) {
			this.collapseCheckinPanel();
			const chapter = chapters && chapters[chapterIndex];
			const items = chapter && (chapter.items || chapter.children);
			const lesson = items && items[lessonIndex];
			if (!lesson) return;
			if (this.$set) this.$set(lesson, 'open', !lesson.open);
			else lesson.open = !lesson.open;
		},
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
			this.total = stats.totalLessons;
			this.duration = stats.totalDuration || course.totalDuration || '00小时00分';
			this.realDuration = course.practiceDuration;
			this.progress = course.progress;
			this.learntCount = course.readStudyCount;
			this.learntDuration = course.readDuration;
			this.versions = this.normalizeVersions(course, course.chapters || this.chapters);
			this.knowledgeChapters = (this.versions[2] && this.versions[2].chapters) || [];
			this.quizzes = course.quizzes;
			this.locked = true;
			this.showFooter = true;
			this.setVersion(0);
			this.loadLessonLocks();
		},
		setVersion(i) {
			this.collapseCheckinPanel();
			this.versionIndex = i;
			const version = this.versions[i];
			this.chapters = version && Array.isArray(version.chapters) ? version.chapters : [];
		},
		normalizeVersions(course = {}, fallbackChapters = []) {
			const baseChapters = Array.isArray(course.chapters) ? course.chapters : (Array.isArray(fallbackChapters) ? fallbackChapters : []);
			const source = Array.isArray(course.versions) && course.versions.length ? course.versions : [];
			const normalized = source.length
				? source.map((item, index) => ({
					...(typeof item === 'object' ? item : { name: item }),
					name: index === 0 ? '复习加强课' : (index === 1 ? '技巧绝招' : '知识巩固'),
					chapters: item && Array.isArray(item.chapters) ? item.chapters : []
				}))
				: [{ name: '复习加强课', chapters: baseChapters }];
			while (normalized.length < 3) {
				normalized.push({
					name: normalized.length === 0 ? '复习加强课' : (normalized.length === 1 ? '技巧绝招' : '知识巩固'),
					chapters: []
				});
			}
			normalized[0].name = '复习加强课';
			normalized[1].name = '技巧绝招';
			normalized[2].name = '知识巩固';
			return normalized.slice(0, 3).map((version, index) => ({
				...version,
				rawChapters: version.chapters || [],
				chapters: this.visibleCourseChapters(version.chapters || [], index)
			}));
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
			this.collapseCheckinPanel();
			this.tab = i;
			if (i === 3 && !this.knowledgeChapters.length) this.loadReinforce();
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
			const totalLessons = this.countCourseLessons(course) || Number(course.totalLessons || 0);
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
				if (!this.isVisible(chapter)) return total;
				const items = chapter.items || chapter.children || [];
				return total + items.reduce((sum, item) => {
					if (!this.isVisible(item)) return sum;
					if (item.children && item.children.length) {
						return sum + item.children.filter(child => this.isVisible(child) && Number(child.type) !== 2 && this.hasVideoContent(child, item)).length;
					}
					return sum + (Number(item.type) === 2 || !this.hasVideoContent(item, item) ? 0 : 1);
				}, 0);
			}, 0);
		},
		countDeclaredChapters(chapters = []) {
			return chapters.reduce((total, chapter) => {
				if (!this.isVisible(chapter)) return total;
				const items = chapter.items || chapter.children || [];
				return total + items.reduce((sum, item) => {
					if (!this.isVisible(item)) return sum;
					if (item.children && item.children.length) {
						const videoCount = item.children.filter(child => this.isVisible(child) && Number(child.type) !== 2).length;
						return sum + (videoCount || 1);
					}
					return sum + (Number(item.type) === 2 ? 0 : 1);
				}, 0);
			}, 0);
		},
		versionDuration(version = {}, index = 0) {
			return version.duration || version.totalDuration || version.courseDuration || (index === 0 ? this.duration : this.realDuration) || '00小时00分';
		},
		progressText(item) {
			if (item.type === 2) return `${item.read || 0}/${item.total || 0}`;
			return `${Math.round(((item.read || 0) / (item.total || 1)) * 100)}%`;
		},
		versionLabel(version, index) {
			return (version && version.name) || (index === 0 ? '复习加强课' : '技巧绝招');
		},
		lessonCategoryTitle(index = this.versionIndex) {
			if (index === 2) return '知识巩固';
			return this.versionLabel(this.versions[index], index);
		},
		ensureUnlocked() {
			if (!this.locked) return true;
			this.showFooter = true;
			uni.showToast({ title:'课程权限未开通或已关闭', icon:'none' });
			return false;
		},
		cleanLessonName(value) {
			// 去掉后台名字开头的连续编号（如「12.」），避免和自动编号重复；占位名视为空
			const raw = String((value && value.title) || value || '').trim();
			const stripped = raw.replace(/^\s*\d+\s*[.．、]\s*/, '').trim();
			if (!stripped || /^章节内容\d+$/.test(stripped)) return '';
			return stripped;
		},
		lessonSeq(chapterIndex, lessonIndex) {
			// 小节序号跨章节连续累加（按当前版本的章节顺序）
			const chapters = this.chapters || [];
			let count = 0;
			for (let k = 0; k < chapterIndex && k < chapters.length; k++) {
				const items = (chapters[k] && (chapters[k].items || chapters[k].children)) || [];
				count += items.length;
			}
			return count + (Number(lessonIndex) || 0) + 1;
		},
		lessonHeader(chapterIndex, lessonIndex, lesson) {
			return `${this.lessonSeq(chapterIndex, lessonIndex)}.${this.cleanLessonName(lesson)}`;
		},
		childName(child, chapter, lesson, lessonIndex) {
			if (this.versionIndex === 0) {
				return Number(child.type) === 2 ? '复习测试' : '复习加强';
			}
			// 技巧绝招：练习库统一「真题讲练」，视频统一「技巧绝招」
			return Number(child.type) === 2 ? '真题讲练' : '技巧绝招';
		},
		reinforceLessonName(chapter, lesson, child = {}, lessonIndex = 0) {
			return '复习加强';
		},
		knowledgeChildName(child, lesson = {}) {
			if (Number(child.type) === 2) return this.practiceBankName(child, lesson) || '巩固练习';
			return child.name || lesson.title || '视频课程';
		},
		reinforceTestName(chapter, lesson, lessonIndex, child = {}) {
			return '复习测试';
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
		visibleCourseChapters(chapters = [], versionIndex = 0) {
			return (chapters || [])
				.map((chapter, chapterIndex) => {
					if (!this.isVisible(chapter)) return null;
					const items = (chapter.items || chapter.children || [])
						.map((lesson, lessonIndex) => this.visibleLesson(lesson, versionIndex, lessonIndex))
						.filter(Boolean);
					const title = String(chapter.title || '').trim();
					if (!items.length) return null;
					if (!title && !items.some(item => this.hasVisibleChildren(item))) return null;
					return { ...chapter, title: title || `章节${chapterIndex + 1}`, items };
				})
				.filter(Boolean);
		},
		visibleLesson(lesson = {}, versionIndex = 0, lessonIndex = 0) {
			const source = typeof lesson === 'object' ? lesson : { title: lesson };
			if (!this.isVisible(source)) return null;
			const children = Array.isArray(source.children) ? source.children : [];
			const visibleChildren = children.filter(child => this.isVisibleChild(child, source, versionIndex));
			const hasDirectVideo = this.hasVideoContent(source, source) && Number(source.type || 1) !== 2;
			const hasDirectPractice = Number(source.type) === 2 && this.hasPracticeQuestions(source);
			if (!visibleChildren.length && !hasDirectVideo && !hasDirectPractice) return null;
			return {
				...source,
				title: this.meaningfulLessonTitle(source.title) || (visibleChildren.length ? `章节内容${lessonIndex + 1}` : source.title),
				children: visibleChildren
			};
		},
		hasVisibleChildren(lesson = {}) {
			return Array.isArray(lesson.children) && lesson.children.length > 0;
		},
		isVisibleChild(child = {}, lesson = {}, versionIndex = 0) {
			if (!this.isVisible(child) || !this.isVisible(lesson)) return false;
			if (Number(child.type) === 2) {
				return !!this.practiceBankName(child, lesson) && this.hasPracticeQuestions(child, lesson);
			}
			return this.hasVideoContent(child, lesson) && (!!this.meaningfulLessonTitle(lesson.title) || !!this.meaningfulLessonTitle(child.name) || versionIndex !== 2);
		},
		isVisible(item = {}) {
			return item && item.visible !== false;
		},
		hasVideoContent(child = {}, lesson = {}) {
			return !!String(child.videoUrl || lesson.videoUrl || child.fileUrl || child.url || '').trim();
		},
		hasPracticeQuestions(child = {}, lesson = {}) {
			const ids = Array.isArray(child.questionIds) && child.questionIds.length ? child.questionIds : (Array.isArray(lesson.questionIds) ? lesson.questionIds : []);
			return ids.length > 0 || Number(child.total || lesson.total || 0) > 0;
		},
		practiceBankName(child = {}, lesson = {}) {
			return String(child.questionBankName || lesson.questionBankName || '').trim();
		},
		meaningfulLessonTitle(value = '') {
			const text = String(value || '').trim();
			if (!text || /^章节内容\d+$/.test(text)) return '';
			return text;
		},
		lessonDisplayName(lesson = {}, child = {}, chapter = {}, lessonIndex = 0) {
			return this.meaningfulLessonTitle(lesson.title)
				|| this.meaningfulLessonTitle(child.name)
				|| this.chapterShortName(chapter)
				|| `章节${lessonIndex + 1}`;
		},
		goDocs() {
			this.collapseCheckinPanel();
			if (!this.ensureUnlocked()) return;
			uni.navigateTo({ url:`/pages/my-docs/my-docs?courseId=${encodeURIComponent(this.courseId)}&kw=${encodeURIComponent(this.displayCourseName.replace(/[《》]/g, ''))}` });
		},
		goPlan() {
			if (!this.ensureUnlocked()) return;
			this.showCheckinPanel = !this.showCheckinPanel;
			if (this.showCheckinPanel) this.tab = 0;
		},
		goReport() {
			this.collapseCheckinPanel();
			if (!this.ensureUnlocked()) return;
			uni.navigateTo({ url:`/pages/study-report/study-report?courseId=${encodeURIComponent(this.courseId)}` });
		},
		goAi(context) {
			this.collapseCheckinPanel();
			if (!this.ensureUnlocked()) return;
			uni.navigateTo({ url:`/pages/ai-chat/ai-chat?context=${encodeURIComponent(context || this.courseName)}` });
		},
		goQuiz(q) {
			this.collapseCheckinPanel();
			if (!this.ensureUnlocked()) return;
			const ids = Array.isArray(q.questionIds) ? q.questionIds.join(',') : '';
			uni.navigateTo({ url:`/pages/practice/practice?type=quiz&quizId=${encodeURIComponent(q.name)}&title=${encodeURIComponent(q.name)}&courseId=${encodeURIComponent(this.courseId)}&questionIds=${encodeURIComponent(ids)}` });
		},
		goWrongBook() {
			this.collapseCheckinPanel();
			if (!this.ensureUnlocked()) return;
			uni.navigateTo({ url:`/pages/wrongbook/wrongbook?courseId=${encodeURIComponent(this.courseId)}&title=${encodeURIComponent(this.displayCourseName)}` });
		},
		goReinforce() {
			this.collapseCheckinPanel();
			if (!this.ensureUnlocked()) return;
			uni.navigateTo({ url:`/pages/reinforce/reinforce?courseId=${encodeURIComponent(this.courseId)}` });
		},
		startReinforce(item) {
			this.collapseCheckinPanel();
			if (!this.ensureUnlocked()) return;
			uni.navigateTo({ url:`/pages/lesson/lesson?title=${encodeURIComponent(item.title)}&courseId=${encodeURIComponent(this.courseId)}&courseTitle=${encodeURIComponent(this.displayCourseName)}&chapterTitle=${encodeURIComponent('复习加强')}&categoryTitle=${encodeURIComponent('复习加强课')}` });
		},
		goKnowledgeChild(chapter, lesson, child, lessonIndex) {
			this.collapseCheckinPanel();
			if (!this.ensureUnlocked()) return;
			if (child.type === 2) {
				const title = this.practiceBankName(child, lesson) || child.name || `知识巩固${this.lessonNo(lesson, lessonIndex)}`;
				const questionIds = Array.isArray(child.questionIds) && child.questionIds.length
					? child.questionIds
					: (Array.isArray(lesson.questionIds) ? lesson.questionIds : []);
				uni.navigateTo({ url:`/pages/practice/practice?type=reinforce&modeTitle=${encodeURIComponent('知识点巩固')}&title=${encodeURIComponent(title)}&practiceTitle=${encodeURIComponent(lesson.title || title)}&courseId=${encodeURIComponent(this.courseId)}&questionIds=${encodeURIComponent(questionIds.join(','))}` });
				return;
			}
			uni.navigateTo({ url:`/pages/lesson/lesson?title=${encodeURIComponent(lesson.title || lesson)}&courseId=${encodeURIComponent(this.courseId)}&courseTitle=${encodeURIComponent(this.displayCourseName)}&chapterTitle=${encodeURIComponent(chapter.title || '知识巩固')}&categoryTitle=${encodeURIComponent('知识巩固')}` });
		},
		goActivate() {
			this.collapseCheckinPanel();
			uni.navigateTo({ url:`/pages/activate/activate?courseId=${encodeURIComponent(this.courseId)}` });
		},
		showApplyAuth() {
			this.collapseCheckinPanel();
			this.showAuth = true;
		},
		copyWechat() {
			uni.setClipboardData({
				data: this.wechatId,
				success: () => uni.showToast({ title:'微信号已复制', icon:'success' })
			});
		},
		goLesson(chapter, lesson, child, lessonIndex, chapterIndex) {
			this.collapseCheckinPanel();
			if (!this.ensureUnlocked()) return;
			if (this.childLessonLocked(child, lesson)) {
				this.toast(Number(child.type) === 2 ? '请先将本节课视频观看至95%，再做配套练习' : '请按课程顺序学习：完成上一节视频（达95%）及其配套练习后解锁本节');
				return;
			}
			const rawTitle = lesson.title || lesson;              // 进度/解锁/完成 的稳定 key（不可变）
			const seq = this.lessonSeq(chapterIndex, lessonIndex);
			const name = this.cleanLessonName(lesson);
			const recordLabel = suffix => `【${seq}.${name}】${suffix}`;
			if (child.type === 2) {
				const isReinforce = this.versionIndex === 0;
				const type = isReinforce ? 'reinforce' : 'practice';
				// 复习加强课记录定位为「【序号.小节名】复习测试」；技巧绝招保留题库标题以便正确取题
				const title = isReinforce ? recordLabel('复习测试') : (this.practiceBankName(child, lesson) || rawTitle);
				const questionIds = Array.isArray(child.questionIds) && child.questionIds.length
					? child.questionIds
					: (Array.isArray(lesson.questionIds) ? lesson.questionIds : []);
				const modeTitle = isReinforce ? '知识点巩固' : '';
				uni.navigateTo({ url:`/pages/practice/practice?type=${type}&modeTitle=${encodeURIComponent(modeTitle)}&title=${encodeURIComponent(title)}&practiceTitle=${encodeURIComponent(rawTitle)}&courseId=${encodeURIComponent(this.courseId)}&questionIds=${encodeURIComponent(questionIds.join(','))}` });
				return;
			}
			const videoLabel = this.versionIndex === 0 ? '复习加强' : '技巧绝招';
			uni.navigateTo({ url:`/pages/lesson/lesson?title=${encodeURIComponent(recordLabel(videoLabel))}&lessonId=${encodeURIComponent(rawTitle)}&courseId=${encodeURIComponent(this.courseId)}&courseTitle=${encodeURIComponent(this.displayCourseName)}&chapterTitle=${encodeURIComponent(chapter.title || '')}&categoryTitle=${encodeURIComponent(this.lessonCategoryTitle(this.versionIndex))}` });
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
.info-top { display:flex; justify-content:flex-start; align-items:center; gap:16rpx; flex-wrap:wrap; }
.info-title { font-size:32rpx; font-weight:800; color:#222; }
.info-meta { font-size:24rpx; color:#888; margin-top:14rpx; }
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
.update-label {
	color:#8a94a3;
	font-weight:700;
}
.update-date {
	color:#c2410c;
	font-weight:900;
}
.version-stats {
	display:grid;
	gap:8rpx;
	margin-top:14rpx;
}
.version-stat {
	display:flex;
	flex-wrap:wrap;
	align-items:center;
	gap:12rpx 18rpx;
	color:#64748b;
	font-size:23rpx;
	line-height:1.45;
}
.version-stat-name {
	color:#0f172a;
	font-weight:800;
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
.course-actions-area, .chap-list, .chap, .chap-head, .sub-row, .lesson-children { overflow-anchor:none; }
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
	padding: 18rpx 30rpx;
	margin-bottom: 12rpx;
	box-shadow: 0 2rpx 6rpx rgba(0,0,0,0.03);
}
.sub-head {
	display:flex;
	justify-content:space-between;
	align-items:center;
	width:100%;
	cursor:pointer;
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
.child-btn.go.locked { background:#c2c8d0; }
.child-btn.ai { background:#2bb673; }
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

/* Desktop course cover polish */
.cover {
	margin:0;
	border-radius:0;
	border:1rpx solid #e2e8f0;
	border-left:0;
	border-right:0;
	border-bottom:0;
	box-shadow:0 10rpx 24rpx rgba(31,41,51,.045);
	background:#f8fafc;
}
.cover-banner,
.cover-poster {
	height:264rpx;
}
.cover-img {
	object-fit:cover;
	background:#f8fafc;
}
.info-block {
	margin:0;
	border-left:0;
	border-right:0;
}
@media screen and (max-width: 420px) {
	.cover {
		margin:0;
		border-radius:0;
	}
	.cover-banner,
	.cover-poster {
		height:226rpx;
	}
	.info-block {
		margin:0;
	}
}
</style>
