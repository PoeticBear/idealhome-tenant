<template>
	<view class="content">
		<view class="imgback">
			<view class="log-box">
				<image src="/static/logo.png" mode="scaleToFill"></image>
				<text class="text">欢迎来到理想窝</text>
			</view>

			<!-- 登录方式切换 -->
			<view class="login-type-switch">
				<view
					class="switch-item"
					:class="{ active: loginType === 'wechat' }"
					@click="switchLoginType('wechat')"
				>
					微信登录
				</view>
				<view
					class="switch-item"
					:class="{ active: loginType === 'account' }"
					@click="switchLoginType('account')"
				>
					账号登录
				</view>
			</view>

			<!-- 微信登录 -->
			<view v-if="loginType === 'wechat'" class="btn-box">
				<button class="btn" type="default" open-type="getPhoneNumber" @getphonenumber="getPhoneNumber">微信快速登录</button>
			</view>

			<!-- 账号密码登录 -->
			<view v-if="loginType === 'account'" class="account-login-box">
				<view class="input-group">
					<input
						class="input"
						type="number"
						v-model="phone"
						placeholder="请输入手机号"
						placeholder-class="placeholder"
						maxlength="11"
					/>
				</view>
				<view class="input-group">
					<input
						class="input"
						type="password"
						v-model="password"
						placeholder="请输入密码"
						placeholder-class="placeholder"
						@confirm="handleAccountLogin"
					/>
				</view>
				<button class="btn account-btn" @click="handleAccountLogin" :disabled="isLogining">
					{{ isLogining ? '登录中...' : '登录' }}
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		mapMutations,
		mapActions
	} from "vuex"
	export default {
		data() {
			return {
				jsCode: "",
				loginType: "wechat", // 登录方式：wechat-微信登录，account-账号登录
				phone: "", // 手机号
				password: "", // 密码
				isLogining: false // 是否正在登录中
			}
		},
		onLoad() {
			uni.login({
				success: (res) => {
					this.jsCode = res.code
				}
			})
		},
		methods: {
			...mapMutations(["setLogin", "setUserInfo"]),
			...mapActions(["setLoginWithToken"]),
			// 切换登录方式
			switchLoginType(type) {
				this.loginType = type;
			},

			// 账号密码登录
			async handleAccountLogin() {
				if (this.isLogining) {
					return; // 防止重复提交
				}

				if (!this.validateAccountLogin()) {
					return;
				}

				this.isLogining = true;
				console.log("开始账号密码登录...");

				try {
					const loginRes = await this.$http.request({
						url: "/api/tenantsUser/login",
						method: "post",
						data: {
							phone: this.phone,
							password: this.password
						}
					});

					console.log("登录接口响应:", loginRes);

					if (loginRes.status === 1) {
						// 保存token
						const token = `Bearer ${loginRes.data}`;
						await uni.setStorageSync("token", token);
						console.log("Token保存成功");

						// 设置token过期时间（24小时）
						this.setLoginWithToken({
							token: token,
							expiresIn: 24 * 60 * 60 * 1000
						});

						// 显示登录成功提示
						uni.showToast({
							title: "登录成功",
							icon: "success"
						});

						// 获取用户信息
						await this.getUserInfo();
					} else {
						throw new Error(loginRes.message || "登录失败");
					}
				} catch (error) {
					console.error("登录失败:", error);
					uni.showToast({
						title: error.message || "登录失败，请检查手机号和密码",
						icon: "none"
					});
				} finally {
					this.isLogining = false;
				}
			},

			// 验证账号密码登录
			validateAccountLogin() {
				if (!this.phone.trim()) {
					uni.showToast({
						title: "请输入手机号",
						icon: "none"
					});
					return false;
				}

				// 验证手机号格式
				const phoneRegex = /^1[3-9]\d{9}$/;
				if (!phoneRegex.test(this.phone)) {
					uni.showToast({
						title: "请输入正确的手机号格式",
						icon: "none"
					});
					return false;
				}

				if (!this.password) {
					uni.showToast({
						title: "请输入密码",
						icon: "none"
					});
					return false;
				}

				return true;
			},

			getPhoneNumber(res) {
				if (res.detail.errMsg != "getPhoneNumber:ok") {
					uni.showToast({
						title: "请授权！",
						icon: "none"
					})
					return
				} else {
					this.$http.request({
						url: "/api/tenantsUser/loginByWx",
						methods: "get",
						params: {
							code: res.detail.code,
							userType: 1,
							jsCode: this.jsCode
						}
					}).then(async (res) => {
						if (res.status === 1) {
							await uni.setStorageSync("token", `Bearer ${res.data}`)

							await this.getUserInfo()
						}
					})
				}

			},
			async getUserInfo() {
				console.log("开始获取用户信息...");

				try {
					const userInfoRes = await this.$http.request({
						url: "/api/tenantsUser/selectById",
						method: "get",
					});

					console.log("获取用户信息响应:", userInfoRes);

					if (userInfoRes.status === 1) {
						console.log("用户信息获取成功:", userInfoRes.data);

						// 更新登录状态和用户信息
						this.setLogin(true);
						this.setUserInfo(userInfoRes.data);

						// 延迟一下跳转，让用户看到成功提示
						setTimeout(() => {
							this.navigateAfterLogin();
						}, 1000);
					} else {
						console.error("获取用户信息失败:", userInfoRes.message);
						this.setLogin(false);
						uni.showToast({
							title: "获取用户信息失败",
							icon: "none"
						});
					}
				} catch (error) {
					console.error("获取用户信息异常:", error);
					this.setLogin(false);
					uni.showToast({
						title: "获取用户信息失败，请重试",
						icon: "none"
					});
				}
			},

			// 登录成功后的页面跳转
			navigateAfterLogin() {
				console.log("开始登录后跳转...");

				let pages = getCurrentPages(); // 当前页面
				console.log("当前页面栈:", pages);

				if (pages.length > 1) {
					// 如果有上一页，返回上一页
					let beforePage = pages[pages.length - 2];
					console.log("返回上一页:", beforePage.route);

					uni.navigateBack({
						success: function() {
							console.log("返回上一页成功，刷新页面数据");
							// 执行前一个页面的onLoad方法
							if (beforePage && beforePage.onLoad) {
								beforePage.onLoad(beforePage.options);
							}
						},
						fail: function(e) {
							console.log("返回上一页失败，跳转到首页:", e);
							// 如果返回失败，跳转到首页
							uni.switchTab({
								url: '/pages/index/index',
								success: () => {
									console.log("跳转到首页成功");
								},
								fail: (e) => {
									console.log("跳转到首页失败，尝试reLaunch:", e);
									// 如果switchTab失败，使用reLaunch
									uni.reLaunch({
										url: '/pages/index/index'
									});
								}
							});
						}
					});
				} else {
					// 如果没有上一页，直接跳转到首页
					console.log("没有上一页，直接跳转到首页");
					uni.switchTab({
						url: '/pages/index/index',
						success: () => {
							console.log("跳转到首页成功");
						},
						fail: (e) => {
							console.log("跳转到首页失败，尝试reLaunch:", e);
							// 如果switchTab失败，使用reLaunch
							uni.reLaunch({
								url: '/pages/index/index'
							});
						}
					});
				}
			}

		}
	}
</script>

<style lang="scss" scoped>
	.content {
		width: 100%;

		.imgback {
			width: 750rpx;
			height: 100vh;
			// background: #4261ef;
			background-image: linear-gradient(135deg, #FFA92F, #FFDC2F);
			// background: url("https://manybox.oss-cn-shanghai.aliyuncs.com/wechat/20210319161003793_logback.png") no-repeat;
			background-size: cover;
			overflow: hidden;

			.log-box {
				width: 100%;
				height: 349rpx;
				display: flex;
				align-items: center;
				flex-direction: column;
				margin-top: 202rpx;

				image {
					margin-bottom: 30rpx;
					width: 200rpx;
					height: 200rpx;
				}

				.text {
					height: 40rpx;
					font-size: 32rpx;
					font-weight: 600;
					color: #FFFFFF;
					line-height: 40rpx;
					text-align: center;
				}
			}

			// 登录方式切换
			.login-type-switch {
				display: flex;
				justify-content: center;
				margin-top: 40rpx;
				margin-bottom: 40rpx;

				.switch-item {
					padding: 20rpx 40rpx;
					font-size: 28rpx;
					color: rgba(255, 255, 255, 0.7);
					border-bottom: 4rpx solid transparent;
					transition: all 0.3s ease;

					&.active {
						color: #FFFFFF;
						border-bottom-color: #FFFFFF;
						font-weight: 600;
					}
				}
			}

			.btn-box {
				margin-top: 572rpx;
				position: fixed;
				left: 112rpx;
				bottom: 120rpx;

				.btn {
					width: 526rpx;
					height: 88rpx;
					line-height: 88rpx;
					background: #ffffff;
					text-align: center;
					border-radius: 48rpx;
					font-size: 26rpx;
					font-weight: 600;
					color: #FFA92F;
				}
			}

			// 账号密码登录
			.account-login-box {
				margin-top: 60rpx;
				padding: 0 112rpx;

				.input-group {
					margin-bottom: 30rpx;

					.input {
						width: 100%;
						height: 88rpx;
						background: rgba(255, 255, 255, 0.9);
						border-radius: 44rpx;
						padding: 0 30rpx;
						font-size: 28rpx;
						color: #333;

						&.placeholder {
							color: rgba(0, 0, 0, 0.3);
						}
					}
				}

				.account-btn {
					width: 100%;
					height: 88rpx;
					line-height: 88rpx;
					background: #ffffff;
					text-align: center;
					border-radius: 48rpx;
					font-size: 26rpx;
					font-weight: 600;
					color: #FFA92F;
					border: none;
					margin-top: 20rpx;
				}
			}
		}
	}
</style>