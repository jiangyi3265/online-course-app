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
</style>
