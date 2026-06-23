<template>
	<view class="page">
		<view class="nav"><view class="back" @click="goBack">‹</view><view class="nav-title">我的学生</view></view>

		<view class="hero">
			<view>
				<view class="hero-title">学生学情查看</view>
				<view class="hero-sub">被推荐人绑定你为推荐人后，会自动同步到这里。此页面只开放查看权限。</view>
			</view>
			<view class="hero-mark">🎓</view>
		</view>

		<view class="panel">
			<view class="panel-title">手动绑定学生账号</view>
			<view class="panel-sub standalone">用于学生主动授权账号时添加，推荐绑定无需在这里重复绑定。</view>
			<input class="input" v-model.trim="form.phone" type="number" maxlength="11" placeholder="输入学生注册手机号" />
			<input class="input" v-model="form.password" type="password" placeholder="输入学生登录密码" />
			<view class="code-row">
				<input class="input code-input" v-model.trim="form.smsCode" type="number" maxlength="6" placeholder="或输入短信验证码" />
				<view class="code-btn" @click="getCode">获取验证码</view>
			</view>
			<view class="bind-actions">
				<view class="primary" @click="submitBind">绑定学生</view>
			</view>
		</view>

		<view class="panel">
			<view class="panel-head">
				<view>
					<view class="panel-title">学生列表</view>
					<view class="panel-sub list-sub">一名学生只显示一条记录，可查看学情统计，不可编辑或代填学习打卡。</view>
				</view>
				<view class="refresh" @click="loadData">{{loading ? '加载中' : '刷新'}}</view>
			</view>
			<view class="empty" v-if="!students.length">{{loadError || '暂无学生记录'}}</view>
			<view class="student-card" v-for="item in students" :key="item.id + item.name">
				<view class="student-top">
					<view class="student-main">
						<view class="student-avatar">{{studentInitial(item)}}</view>
						<view>
							<view class="student-name">{{item.name || '学生'}}</view>
							<view class="student-id">ID：{{item.id || '--'}}</view>
						</view>
					</view>
					<view class="source-tag" :class="sourceClass(item)">{{item.bindingSource || '账号绑定'}}</view>
				</view>
				<view class="student-meta">
					<view class="meta-item"><text>年级</text><strong>{{item.grade || '--'}}</strong></view>
					<view class="meta-item"><text>地区</text><strong>{{item.region || '--'}}</strong></view>
					<view class="meta-item meta-permission"><text>权限</text><strong>{{item.permissionText || '只读查看学情'}}</strong></view>
					<view class="meta-item meta-date"><text>绑定时间</text><strong>{{formatDate(item.bindingCreatedAt || item.createdAt)}}</strong></view>
				</view>
				<view class="metric-row">
					<view class="metric"><text>{{learningValue(item, 'courseCount')}}</text><small>开通课程</small></view>
					<view class="metric"><text>{{learningValue(item, 'attemptCount')}}</text><small>练习记录</small></view>
					<view class="metric"><text>{{learningValue(item, 'averageScore')}}</text><small>平均得分</small></view>
				</view>
				<view class="course-line">开通课程：{{studentCoursesText(item)}}</view>
				<view class="action-row">
					<view class="link-btn" @click="viewAnalysis(item)">查看【学情统计】</view>
					<view class="link-btn warn" v-if="canUnbind(item)" @click="removeBinding(item)">解除绑定</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
import { bindStudent, getMyStudents, sendSmsCode, unbindStudent } from '@/common/api.js'
import { safeNavigateBack } from '@/common/navigation.js'

export default {
	data() {
		return {
			students: [],
			loading: false,
			loadError: '',
			form: { phone: '', password: '', smsCode: '' }
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
				const data = await getMyStudents();
				this.students = this.normalizeStudents(data || []);
			} catch (err) {
				this.students = [];
				this.loadError = err.message || '学生记录加载失败';
				uni.showToast({ title: this.loadError, icon:'none' });
			} finally {
				this.loading = false;
			}
		},
		async getCode() {
			if (!/^1\d{10}$/.test(this.form.phone)) {
				uni.showToast({ title:'请输入正确手机号', icon:'none' });
				return;
			}
			try {
				const res = await sendSmsCode(this.form.phone);
				if (res.code) this.form.smsCode = res.code;
				uni.showToast({ title: res.message || '验证码已发送', icon:'none' });
			} catch (err) {
				uni.showToast({ title: err.message || '发送失败', icon:'none' });
			}
		},
		async submitBind() {
			if (!this.form.phone || (!this.form.password && !this.form.smsCode)) {
				uni.showToast({ title:'请输入手机号和密码或验证码', icon:'none' });
				return;
			}
			try {
				await bindStudent({ ...this.form });
				uni.showToast({ title:'绑定成功', icon:'success' });
				this.form.phone = '';
				this.form.password = '';
				this.form.smsCode = '';
				await this.loadData();
			} catch (err) {
				uni.showToast({ title: err.message || '绑定失败', icon:'none' });
			}
		},
		studentCoursesText(item) {
			const courses = item.courses || item.openCourses || [];
			if (courses.length) return courses.map(course => course.title || course.courseName || course.name).filter(Boolean).join('、');
			if (item.learning && item.learning.courseCount) return `${item.learning.courseCount}门课程`;
			return '--';
		},
		normalizeStudents(list = []) {
			const map = {};
			list.forEach(item => {
				const id = item.id || item.userId || item.studentUserId || '';
				if (!id) return;
				const bindingId = String(item.bindingId || '');
				const bindingSource = item.bindingSource || (bindingId.indexOf('referrer-') === 0 ? '推荐绑定' : (bindingId ? '账号绑定' : '授权记录'));
				const relationType = item.relationType || (bindingSource === '推荐绑定' ? 'referrer' : (bindingSource === '账号绑定' ? 'account' : 'authorization'));
				const normalized = {
					...item,
					id,
					bindingSource,
					relationType,
					permissionText: item.permissionText || '只读查看学情',
					canEditLearning: false,
					canUnbind: relationType === 'account' ? item.canUnbind !== false : false,
					bindingCreatedAt: item.bindingCreatedAt || item.createdAt || ''
				};
				if (!map[id] || normalized.relationType === 'account') {
					map[id] = normalized;
				}
			});
			return Object.values(map);
		},
		canUnbind(item = {}) {
			return item.canUnbind === true && item.relationType === 'account';
		},
		sourceClass(item = {}) {
			return {
				referrer: item.relationType === 'referrer' || item.bindingSource === '推荐绑定',
				auth: item.relationType === 'authorization' || item.bindingSource === '授权记录'
			};
		},
		studentInitial(item = {}) {
			return String(item.name || item.phone || '学').trim().slice(0, 1);
		},
		learningValue(item = {}, key) {
			const value = item.learning && item.learning[key];
			if (value === undefined || value === null || value === '') return key === 'averageScore' ? '0' : '0';
			return String(value);
		},
		formatDate(value) {
			if (!value) return '--';
			const raw = String(value);
			const match = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{1,2}))?/);
			if (!match) return raw;
			const date = `${match[1]}年${match[2].padStart(2, '0')}月${match[3].padStart(2, '0')}日`;
			return match[4] ? `${date} ${match[4].padStart(2, '0')}:${match[5].padStart(2, '0')}` : date;
		},
		primaryCourseId(item = {}) {
			const courses = item.courses || item.openCourses || [];
			return item.primaryCourseId || (courses[0] && (courses[0].id || courses[0].courseId)) || 'gk-math-full';
		},
		viewAnalysis(item) {
			const url = `/pages/study-analysis/study-analysis?studentId=${encodeURIComponent(item.id || '')}&studentName=${encodeURIComponent(item.name || '学生')}&courseId=${encodeURIComponent(this.primaryCourseId(item))}&readonly=1`;
			uni.navigateTo({ url });
		},
		removeBinding(item) {
			if (!this.canUnbind(item)) {
				uni.showToast({ title:'授权记录不能在这里解除', icon:'none' });
				return;
			}
			uni.showModal({
				title:'解除绑定',
				content:`确认解除与 ${item.name || '该学生'} 的绑定？`,
				success: async res => {
					if (!res.confirm) return;
					try {
						await unbindStudent(item.id);
						this.students = this.students.filter(student => student.id !== item.id);
						uni.showToast({ title:'已解除绑定', icon:'success' });
					} catch (err) {
						uni.showToast({ title: err.message || '解除失败', icon:'none' });
					}
				}
			});
		},
		goBack() { safeNavigateBack('/pages/member/member'); }
	}
}
</script>

<style lang="scss">
page { background:#f6f8fb; }
.page { min-height:100vh; background:#f6f8fb; padding-bottom:40rpx; }
.nav { position:relative; height:90rpx; background:#fff; display:flex; align-items:center; justify-content:center; border-bottom:1rpx solid #eef0f3; }
.back { position:absolute; left:24rpx; font-size:46rpx; color:#222; cursor:pointer; }
.nav-title { font-size:30rpx; font-weight:800; color:#1f2933; }
.hero { margin:24rpx; padding:30rpx; border-radius:16rpx; background:linear-gradient(135deg,#eef7ff 0%, #f7fbff 100%); border:1rpx solid #dcecff; display:flex; align-items:center; justify-content:space-between; gap:24rpx; box-sizing:border-box; }
.hero-title { color:#1f2933; font-size:34rpx; font-weight:900; line-height:1.25; }
.hero-sub { margin-top:10rpx; color:#526071; font-size:24rpx; line-height:1.45; }
.hero-mark { width:86rpx; height:86rpx; border-radius:18rpx; display:flex; align-items:center; justify-content:center; background:#fff; font-size:46rpx; flex-shrink:0; box-shadow:0 8rpx 18rpx rgba(22,119,255,.08); }
.panel { margin:0 24rpx 24rpx; padding:26rpx; background:#fff; border-radius:16rpx; border:1rpx solid #e8edf3; box-shadow:0 8rpx 22rpx rgba(16,24,40,.04); box-sizing:border-box; }
.panel-title { font-size:30rpx; font-weight:900; color:#1f2933; margin-bottom:18rpx; }
.panel-head { display:flex; align-items:flex-start; justify-content:space-between; gap:18rpx; margin-bottom:18rpx; }
.panel-head .panel-title { margin-bottom:6rpx; }
.panel-sub { color:#667085; font-size:23rpx; line-height:1.45; }
.panel-sub.standalone { margin-top:-8rpx; margin-bottom:18rpx; }
.refresh { flex-shrink:0; min-width:86rpx; height:52rpx; line-height:52rpx; text-align:center; border-radius:10rpx; background:#eef6ff; color:#1677ff; font-size:24rpx; font-weight:800; }
.input { height:80rpx; border-radius:12rpx; background:#f5f7fa; border:1rpx solid #edf1f6; padding:0 18rpx; font-size:27rpx; margin-top:14rpx; box-sizing:border-box; }
.code-row { display:flex; gap:14rpx; align-items:center; }
.code-input { flex:1; min-width:0; }
.code-btn { flex-shrink:0; height:78rpx; line-height:78rpx; margin-top:14rpx; padding:0 18rpx; border-radius:12rpx; background:#eef6ff; color:#1677ff; font-size:25rpx; font-weight:700; }
.bind-actions { display:flex; gap:14rpx; margin-top:18rpx; }
.primary, .secondary { flex:1; height:78rpx; line-height:78rpx; text-align:center; border-radius:12rpx; font-size:27rpx; font-weight:800; }
.primary { background:#1677ff; color:#fff; }
.secondary { background:#ecfdf3; color:#0f9f6e; }
.empty { color:#8a94a3; font-size:26rpx; padding:24rpx 0; }
.student-card { padding:24rpx 0; border-bottom:1rpx solid #eef0f3; }
.student-card:last-child { border-bottom:0; }
.student-top { display:flex; align-items:flex-start; justify-content:space-between; gap:16rpx; }
.student-main { display:flex; align-items:center; gap:16rpx; min-width:0; }
.student-avatar { width:66rpx; height:66rpx; border-radius:16rpx; display:flex; align-items:center; justify-content:center; background:#eef6ff; color:#1677ff; font-size:28rpx; font-weight:900; flex-shrink:0; }
.student-name { color:#1f2933; font-size:30rpx; font-weight:900; }
.student-id { margin-top:6rpx; color:#697386; font-size:23rpx; }
.source-tag { flex-shrink:0; padding:8rpx 14rpx; border-radius:999rpx; background:#ecfdf3; color:#0f9f6e; font-size:22rpx; font-weight:800; }
.source-tag.referrer { background:#eef6ff; color:#1677ff; }
.source-tag.auth { background:#f4f3ff; color:#635bff; }
.student-meta { display:grid; grid-template-columns:1fr 1fr; gap:8rpx 16rpx; margin-top:18rpx; color:#596272; font-size:25rpx; line-height:1.5; }
.metric-row { display:grid; grid-template-columns:repeat(3, 1fr); gap:12rpx; margin-top:18rpx; }
.metric { min-height:76rpx; padding:12rpx 8rpx; border-radius:10rpx; background:#f8fafc; border:1rpx solid #edf1f6; text-align:center; box-sizing:border-box; }
.metric text { display:block; color:#1f2933; font-size:28rpx; font-weight:900; line-height:1.2; }
.metric small { display:block; margin-top:6rpx; color:#8a94a3; font-size:21rpx; }
.course-line { margin-top:14rpx; color:#475467; font-size:26rpx; line-height:1.55; }
.action-row { display:flex; flex-wrap:wrap; gap:14rpx; margin-top:12rpx; }
.link-btn { color:#1677ff; background:#eef6ff; border-radius:10rpx; padding:14rpx 18rpx; font-size:25rpx; font-weight:800; }
.link-btn.warn { color:#e5484d; background:#fff1f1; }
.link-btn.full { color:#0f9f6e; background:#ecfdf3; }

/* PC H5 polish */
page { background:#eef3f7; }
.page {
	background:linear-gradient(180deg, #f9fbfd 0%, #eef3f7 380rpx, #eef3f7 100%);
	padding-bottom:56rpx;
	color:#17212f;
}
.nav {
	position:sticky;
	top:0;
	z-index:20;
	height:92rpx;
	background:rgba(251,253,255,.96);
	backdrop-filter:saturate(140%) blur(10px);
	border-bottom:1rpx solid #e4eaf1;
}
.hero {
	display:none;
}
.panel {
	margin:18rpx 24rpx 24rpx;
	padding:28rpx;
	border-radius:20rpx;
	border-color:#dfe7f0;
	box-shadow:0 12rpx 28rpx rgba(31,41,51,.045);
}
.panel-title {
	margin-bottom:8rpx;
	font-size:31rpx;
	color:#111827;
}
.panel-sub {
	color:#66758a;
	line-height:1.55;
}
.list-sub {
	display:none;
}
.panel-sub.standalone {
	margin-top:0;
	margin-bottom:20rpx;
}
.input {
	height:82rpx;
	border-radius:14rpx;
	background:#f3f6fa;
	border-color:#e5ecf4;
}
.code-row {
	gap:12rpx;
}
.code-btn {
	min-width:132rpx;
	text-align:center;
	border-radius:14rpx;
	background:#eef5ff;
	border:1rpx solid #cfe0ff;
	box-sizing:border-box;
}
.primary {
	height:82rpx;
	line-height:82rpx;
	border-radius:14rpx;
	background:#1769ff;
	box-shadow:0 10rpx 22rpx rgba(23,105,255,.16);
}
.panel-head {
	align-items:center;
	padding-bottom:6rpx;
	margin-bottom:12rpx;
	border-bottom:0;
}
.refresh {
	height:58rpx;
	line-height:58rpx;
	border-radius:999rpx;
	background:#eef5ff;
	border:1rpx solid #cfe0ff;
}
.student-card {
	padding:22rpx;
	margin-top:16rpx;
	border:1rpx solid #e2eaf3;
	border-radius:18rpx;
	background:#fbfdff;
	box-shadow:0 8rpx 20rpx rgba(31,41,51,.035);
}
.student-card:last-child {
	border-bottom:1rpx solid #e2eaf3;
}
.student-top {
	align-items:center;
}
.student-avatar {
	width:74rpx;
	height:74rpx;
	border-radius:18rpx;
	background:#eaf3ff;
	box-shadow:inset 0 0 0 1rpx #d7e8ff;
}
.student-name {
	font-size:31rpx;
	color:#111827;
}
.student-id {
	color:#5d6b7c;
}
.source-tag {
	padding:9rpx 16rpx;
	border-radius:999rpx;
}
.student-meta {
	grid-template-columns:repeat(2, minmax(0, 1fr));
	gap:12rpx;
	margin-top:20rpx;
	padding:18rpx;
	border-radius:14rpx;
	background:#f6f9fd;
	color:#405066;
}
.meta-item {
	min-height:64rpx;
	padding:12rpx 14rpx;
	border-radius:12rpx;
	background:#fff;
	border:1rpx solid #e7edf5;
	box-sizing:border-box;
}
.meta-item text {
	display:block;
	color:#7b8797;
	font-size:21rpx;
	line-height:1.2;
}
.meta-item strong {
	display:block;
	margin-top:6rpx;
	color:#233044;
	font-size:24rpx;
	font-weight:800;
	line-height:1.35;
	word-break:break-word;
}
.meta-date,
.meta-permission {
	grid-column:1 / -1;
}
.meta-date {
	display:flex;
	align-items:center;
	justify-content:space-between;
	gap:18rpx;
}
.meta-date text,
.meta-date strong {
	margin-top:0;
}
.meta-date strong {
	text-align:right;
	white-space:nowrap;
}
.metric-row {
	gap:14rpx;
	margin-top:16rpx;
}
.metric {
	min-height:86rpx;
	border-radius:14rpx;
	background:#fff;
	border-color:#e7edf5;
}
.metric text {
	color:#111827;
}
.course-line {
	margin-top:16rpx;
	padding:16rpx 18rpx;
	border-radius:14rpx;
	background:#fff;
	border:1rpx solid #e7edf5;
	color:#405066;
}
.action-row {
	margin-top:16rpx;
	gap:12rpx;
}
.link-btn {
	min-height:58rpx;
	display:flex;
	align-items:center;
	justify-content:center;
	padding:0 18rpx;
	border-radius:12rpx;
	border:1rpx solid #cfe0ff;
	box-sizing:border-box;
}
.link-btn.warn {
	border-color:#ffd2d2;
}
.empty {
	margin-top:14rpx;
	padding:54rpx 20rpx;
	text-align:center;
	background:#f8fafc;
	border:1rpx dashed #cbd6e2;
	border-radius:16rpx;
	line-height:1.6;
}
@media screen and (max-width: 430px) {
	.panel {
		margin-left:20rpx;
		margin-right:20rpx;
		padding:24rpx;
	}
	.code-row {
		display:grid;
		grid-template-columns:1fr;
	}
	.code-btn {
		margin-top:0;
	}
	.student-meta {
		grid-template-columns:1fr;
	}
	.metric-row {
		grid-template-columns:repeat(3, minmax(0, 1fr));
		gap:8rpx;
	}
	.metric {
		min-height:74rpx;
		padding:10rpx 4rpx;
		border-radius:12rpx;
	}
	.metric text {
		font-size:26rpx;
	}
	.metric small {
		margin-top:4rpx;
		font-size:20rpx;
		white-space:nowrap;
	}
	.meta-date {
		display:block;
	}
	.meta-date strong {
		margin-top:6rpx;
		text-align:left;
		white-space:normal;
	}
	.action-row {
		display:grid;
		grid-template-columns:1fr;
	}
}
</style>
