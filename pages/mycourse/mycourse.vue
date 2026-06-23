<template>
	<view class="page">
		<view class="course-list" v-if="logined">
			<view class="course-card" v-for="(c,i) in courses" :key="i">
				<view class="course-cover">
					<image v-if="c.cover && !c.coverError" class="course-cover-img" :src="c.cover" mode="aspectFill" @error="markCourseCoverError(c)" />
					<view v-else class="course-cover-fallback">{{courseInitial(c)}}</view>
				</view>
				<view class="course-info">
					<view class="course-title">{{c.title}}</view>
					<view class="course-sub">{{c.sub}}</view>
					<view class="expiry">有效期至：{{c.expiry}}</view>
					<view class="actions">
						<view class="learn-btn" @click="openCourse(c)">点击学习</view>
						<view class="report-btn" @click="openReport(c)">学习报告</view>
					</view>
				</view>
			</view>
			<view style="height:140rpx"></view>
		</view>

		<view class="empty" v-else>
			<image class="ill-img" src="/static/empty-noLogin.png" mode="widthFix" />
			<view class="tip">{{ logined ? '暂无课程授权记录' : '您还未登录~' }}</view>
		</view>

		<!-- 登录提示弹窗 -->
		<view class="mask" v-if="showModal">
			<view class="modal">
				<view class="m-title">提示</view>
				<view class="m-body">您还未登录，是否登录？</view>
				<view class="m-actions">
					<view class="m-btn cancel" @click="showModal=false">取消</view>
					<view class="m-divider"></view>
					<view class="m-btn ok" @click="goLogin">登录</view>
				</view>
			</view>
		</view>

		<tab-bar active="course" />
	</view>
</template>

<script>
import TabBar from '@/components/tab-bar.vue'
import { AUTHORIZED_COURSES, stripCourseYear } from '@/common/course-data.js'
import { getMyCourses, isLoggedIn, resolveMediaUrl } from '@/common/api.js'
export default {
	components: { TabBar },
	data() { return { logined:false, showModal:false, courses: AUTHORIZED_COURSES } },
	async onShow() {
		this.logined = isLoggedIn();
		if (!this.logined) this.showModal = true;
		else await this.loadCourses();
	},
	methods: {
		async loadCourses() {
			try {
				const list = await getMyCourses();
				this.courses = list.map(item => ({
					id: item.id,
					title: stripCourseYear(item.courseName || item.sub || `《${item.full}》`),
					sub: stripCourseYear(item.sub),
					expiry: item.expiry,
					cover: resolveMediaUrl(item.cover),
					coverError: false,
					subject: item.subject,
					kind: item.kind
				}));
			} catch (err) {
				console.warn('我的课程接口不可用，使用本地授权课程', err);
			}
		},
		goLogin() {
			this.showModal = false;
			uni.navigateTo({ url:'/pages/login/login' });
		},
		openCourse(c) {
			if (c.id || c.subject === 'gaokao-math') {
				const idPart = c.id ? `id=${encodeURIComponent(c.id)}&` : '';
				const title = c.title || c.sub || '课程';
				uni.navigateTo({ url:`/pages/course-full/course-full?${idPart}title=${encodeURIComponent(title)}&subject=${c.subject || 'gaokao-math'}&kind=${c.kind || 'full'}` });
				return;
			}
			this.toast('点击学习');
		},
		openReport(c) {
			uni.navigateTo({ url:`/pages/study-report/study-report?courseId=${encodeURIComponent(c.id || 'gk-math-full')}` });
		},
		markCourseCoverError(course) {
			course.coverError = true;
		},
		courseInitial(course = {}) {
			const name = String(course.title || course.sub || '课').replace(/[《》]/g, '').trim();
			return name.slice(0, 2) || '课程';
		},
		toast(title) {
			uni.showToast({ title, icon:'none' });
		}
	}
}
</script>

<style lang="scss">
page { background:#fff; }
.page { min-height:100vh; background:#fff; }
.empty {
	padding-top:200rpx;
	display:flex; flex-direction:column; align-items:center;
}
.course-list {
	padding: 24rpx 24rpx 0;
	background:#f5f7fa;
	min-height:100vh;
	box-sizing:border-box;
}
.course-card {
	background:#fff;
	border-radius:16rpx;
	padding:20rpx;
	margin-bottom:22rpx;
	display:flex;
	box-shadow:0 4rpx 12rpx rgba(0,0,0,.04);
}
.course-cover {
	display:flex;
	align-items:center;
	justify-content:center;
	width:220rpx;
	height:154rpx;
	border-radius:12rpx;
	overflow:hidden;
	flex-shrink:0;
	background:linear-gradient(135deg,#e8f3ff,#f8fafc);
	color:#1677ff;
	font-size:30rpx;
	font-weight:900;
}
.course-cover-img {
	width:100%;
	height:100%;
	display:block;
}
.course-cover-fallback {
	padding:0 18rpx;
	text-align:center;
	line-height:1.2;
}
.course-info {
	flex:1;
	min-width:0;
	margin-left:22rpx;
}
.course-title {
	font-size:28rpx;
	color:#222;
	font-weight:800;
	white-space:nowrap;
	overflow:hidden;
	text-overflow:ellipsis;
}
.course-sub {
	font-size:24rpx;
	color:#666;
	margin-top:8rpx;
	white-space:nowrap;
	overflow:hidden;
	text-overflow:ellipsis;
}
.expiry {
	font-size:22rpx;
	color:#999;
	margin-top:12rpx;
}
.actions {
	display:flex;
	align-items:center;
	margin-top:16rpx;
}
.learn-btn, .report-btn {
	font-size:24rpx;
	color:#fff;
	padding:8rpx 22rpx;
	border-radius:28rpx;
	cursor:pointer;
}
.learn-btn { background:#3aa3f5; }
.report-btn { background:#2bb673; margin-left:14rpx; }
.ill-img { width:460rpx; }
.ill { position:relative; width:400rpx; height:340rpx; }
.bubble {
	position:absolute; left:50%; top:0; transform:translateX(-50%);
	width:120rpx; height:140rpx; border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;
	background:#d9a83a;
	color:#fff; font-size:70rpx; font-weight:800;
	display:flex; align-items:center; justify-content:center;
}
.bubble::after {
	content:''; position:absolute; left:50%; bottom:-20rpx; transform:translateX(-50%);
	border:14rpx solid transparent; border-top-color:#d9a83a;
}
.cloud { position:absolute; height:14rpx; background:#d6d9dd; border-radius:8rpx; }
.c1 { width:140rpx; left:0; top:120rpx; }
.c2 { width:120rpx; right:0; top:160rpx; }
.boat { position:absolute; left:50%; bottom:0; transform:translateX(-50%); width:240rpx; height:120rpx; }
.hull {
	position:absolute; bottom:0; left:0; right:0; height:60rpx;
	background:#1c5da8;
	border-radius:0 0 120rpx 120rpx / 0 0 60rpx 60rpx;
	clip-path: polygon(0 0, 100% 0, 85% 100%, 15% 100%);
}
.head { position:absolute; bottom:50rpx; width:50rpx; height:60rpx; background:#9ad6ee; border-radius:50% 50% 40% 40% / 60% 60% 30% 30%; }
.h1 { left:30rpx; }
.h2 { left:90rpx; height:70rpx; bottom:50rpx; }
.h3 { left:150rpx; }
.paddle { position:absolute; right:0; bottom:80rpx; width:80rpx; height:6rpx; background:#9ad6ee; transform:rotate(30deg); }
.star { position:absolute; color:#d9a83a; font-size:24rpx; }
.s1 { left:120rpx; top:170rpx; }
.s2 { left:200rpx; top:200rpx; font-size:18rpx; }
.s3 { left:160rpx; top:230rpx; font-size:20rpx; }
.tip { margin-top:30rpx; color: rgba(0,0,0,0.9); font-size:32rpx; font-weight:400; }

/* Modal */
.mask {
	position:fixed; inset:0;
	background:rgba(0,0,0,0.5);
	display:flex; align-items:center; justify-content:center;
	z-index:200;
}
.modal {
	width:560rpx;
	background:#fff;
	border-radius:14rpx;
	overflow:hidden;
}
.m-title { text-align:center; padding:36rpx 0 16rpx; font-size:34rpx; color:#000; }
.m-body { text-align:center; padding:0 30rpx 36rpx; color:#888; font-size:28rpx; }
.m-actions { display:flex; border-top:1rpx solid #ececec; }
.m-btn {
	flex:1; height:96rpx; line-height:96rpx; text-align:center;
	font-size:32rpx; cursor:pointer;
}
.m-btn.cancel { color:#000; }
.m-btn.ok { color:#007aff; }
.m-divider { width:1rpx; background:#ececec; }
</style>
