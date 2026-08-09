<template>
	<view class="field-icon" :class="`field-icon--${type}`" aria-hidden="true">
		<view class="field-icon-shape"></view>
		<view class="field-icon-detail"></view>
	</view>
</template>

<script>
export default {
	name: 'AppFieldIcon',
	props: {
		type: {
			type: String,
			default: 'user'
		}
	}
}
</script>

<style lang="scss" scoped>
.field-icon {
	position:relative;
	width:44rpx;
	height:44rpx;
	flex:0 0 44rpx;
	color:inherit;
	box-sizing:border-box;
}
.field-icon-shape,
.field-icon-detail,
.field-icon-shape::before,
.field-icon-shape::after {
	position:absolute;
	box-sizing:border-box;
}
.field-icon--phone .field-icon-shape {
	left:12rpx;
	top:4rpx;
	width:20rpx;
	height:36rpx;
	border:3rpx solid currentColor;
	border-radius:6rpx;
}
.field-icon--phone .field-icon-shape::after {
	content:'';
	left:50%;
	bottom:3rpx;
	width:6rpx;
	height:2rpx;
	border-radius:2rpx;
	background:currentColor;
	transform:translateX(-50%);
}
.field-icon--user .field-icon-shape::before {
	content:'';
	left:15rpx;
	top:3rpx;
	width:14rpx;
	height:14rpx;
	border:3rpx solid currentColor;
	border-radius:50%;
}
.field-icon--user .field-icon-shape::after {
	content:'';
	left:7rpx;
	top:23rpx;
	width:30rpx;
	height:17rpx;
	border:3rpx solid currentColor;
	border-bottom:0;
	border-radius:18rpx 18rpx 4rpx 4rpx;
}
.field-icon--code .field-icon-shape {
	left:3rpx;
	top:4rpx;
	width:17rpx;
	height:17rpx;
	border:3rpx solid currentColor;
	border-radius:50%;
}
.field-icon--code .field-icon-shape::after {
	content:'';
	left:13rpx;
	top:15rpx;
	width:27rpx;
	height:3rpx;
	border-radius:3rpx;
	background:currentColor;
	transform:rotate(45deg);
	transform-origin:left center;
}
.field-icon--code .field-icon-detail {
	left:29rpx;
	top:27rpx;
	width:3rpx;
	height:9rpx;
	background:currentColor;
	box-shadow:7rpx 0 0 currentColor;
	transform:rotate(45deg);
}
.field-icon--lock .field-icon-shape {
	left:8rpx;
	top:19rpx;
	width:28rpx;
	height:22rpx;
	border:3rpx solid currentColor;
	border-radius:5rpx;
}
.field-icon--lock .field-icon-shape::before {
	content:'';
	left:4rpx;
	top:-17rpx;
	width:14rpx;
	height:16rpx;
	border:3rpx solid currentColor;
	border-bottom:0;
	border-radius:10rpx 10rpx 0 0;
}
.field-icon--check .field-icon-shape {
	left:8rpx;
	top:8rpx;
	width:25rpx;
	height:15rpx;
	border-left:3rpx solid currentColor;
	border-bottom:3rpx solid currentColor;
	transform:rotate(-45deg);
}

/* rpx 会随宽屏视口继续放大，旧款平板上会把表单线性图标撑成大图。
 * 宽屏统一使用固定的 22px 图标，手机端仍保留 rpx 自适应。 */
@media screen and (min-width: 600px) {
	.field-icon {
		width:22px;
		height:22px;
		flex-basis:22px;
	}
	.field-icon--phone .field-icon-shape {
		left:6px;
		top:2px;
		width:10px;
		height:18px;
		border-width:1.5px;
		border-radius:3px;
	}
	.field-icon--phone .field-icon-shape::after {
		bottom:1.5px;
		width:3px;
		height:1px;
	}
	.field-icon--user .field-icon-shape::before {
		left:7.5px;
		top:1.5px;
		width:7px;
		height:7px;
		border-width:1.5px;
	}
	.field-icon--user .field-icon-shape::after {
		left:3.5px;
		top:11.5px;
		width:15px;
		height:8.5px;
		border-width:1.5px;
		border-bottom:0;
		border-radius:9px 9px 2px 2px;
	}
	.field-icon--code .field-icon-shape {
		left:1.5px;
		top:2px;
		width:8.5px;
		height:8.5px;
		border-width:1.5px;
	}
	.field-icon--code .field-icon-shape::after {
		left:6.5px;
		top:7.5px;
		width:13.5px;
		height:1.5px;
	}
	.field-icon--code .field-icon-detail {
		left:14.5px;
		top:13.5px;
		width:1.5px;
		height:4.5px;
		box-shadow:3.5px 0 0 currentColor;
	}
	.field-icon--lock .field-icon-shape {
		left:4px;
		top:9.5px;
		width:14px;
		height:11px;
		border-width:1.5px;
		border-radius:2.5px;
	}
	.field-icon--lock .field-icon-shape::before {
		left:2px;
		top:-8.5px;
		width:7px;
		height:8px;
		border-width:1.5px;
		border-bottom:0;
		border-radius:5px 5px 0 0;
	}
	.field-icon--check .field-icon-shape {
		left:4px;
		top:4px;
		width:12.5px;
		height:7.5px;
		border-left-width:1.5px;
		border-bottom-width:1.5px;
	}
}
</style>
