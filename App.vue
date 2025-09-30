<script>
	import {
		mapMutations,
		mapActions
	} from "vuex"
	export default {
		methods: {

		},
		onLaunch: function() {
			console.log("应用启动，开始检查登录状态...");
			this.checkLoginStatus();
		},
		onShow: function() {
			// 检查新版本是否存在
			const updateManager = uni.getUpdateManager();
			updateManager.onCheckForUpdate(function(res) {
				if (res.hasUpdate) {
					updateManager.onUpdateReady(function(res) {
						uni.showModal({
							title: '更新提示',
							content: '新版本已经准备好，是否重启应用？',
							showCancel: false,
							success(res) {
								if (res.confirm) {
									// 新的版本已经下载好，重启应用
									updateManager.applyUpdate();
								}
							}
						});

					});

					updateManager.onUpdateFailed(function(res) {
						// console.log('新的版本下载失败了');
					});
				}
			});
		},
		onHide: function() {},
		methods: {
			...mapActions(['getUserInfo']),

			// 检查登录状态
			async checkLoginStatus() {
				console.log("=== 开始检查登录状态 ===");

				try {
					const token = uni.getStorageSync("token");
					console.log("获取到token:", token ? "存在" : "不存在");

					if (token) {
						console.log("发现token，开始验证用户信息...");
						// 显示检查状态的提示
						uni.showLoading({
							title: "正在验证登录状态...",
							mask: true
						});

						try {
							// 验证token有效性并获取用户信息
							await this.getUserInfo(true);
							console.log("✅ 用户信息验证完成");
							uni.hideLoading();
						} catch (error) {
							uni.hideLoading();
							throw error;
						}
					} else {
						console.log("❌ 未发现token，用户未登录");
						// 确保登录状态为false
						this.setLogin(false);
						this.setUserInfo({});
					}
				} catch (error) {
					console.error("❌ 检查登录状态失败:", error);

					// 如果是网络错误，可以尝试重试
					if (error.message && error.message.includes("网络")) {
						console.log("🔄 网络错误，2秒后重试...");
						uni.showToast({
							title: "网络连接失败，正在重试...",
							icon: "none",
							duration: 2000
						});
						setTimeout(() => {
							this.checkLoginStatus();
						}, 2000);
					} else {
						// 其他错误，清除登录状态
						this.clearLoginState();
						uni.showToast({
							title: "登录状态已过期，请重新登录",
							icon: "none",
							duration: 3000
						});
					}
				}
			},

			// 清除登录状态
			clearLoginState() {
				console.log("🗑️ 清除登录状态");
				uni.removeStorageSync("token");
				this.setLogin(false);
				this.setUserInfo({});
				this.setTokenExpiredTime(0);
			},

			...mapMutations(['setLogin', 'setUserInfo', 'setTokenExpiredTime'])
		}
	}
</script>

<style lang="scss">
	// uview-ui公共
	@import "@/uni_modules/uview-ui/index.scss";

	// uview-ui自定义样式

	.u-empty {
		height: 100%;
		position: relative;
		width: 100%;
		left: 0;
		top: 0;
	}

	/*每个页面公共css */
	page {
		background-color: #f6f6f6;
		// height: 100%;
	}

	body,
	p,
	ul,
	ol,
	dl,
	dd,
	h1,
	h2,
	h3,
	h4,
	h5,
	h6,
	td,
	input,
	textarea,
	select,
	option {
		margin: 0;
		padding: 0;
	}

	body {
		/* font-family: "微软雅黑"; */
		/* background: #ffffff; */
		background: #f7f8fa;
	}

	ul,
	ol,
	li {
		list-style: none;
	}

	a {
		text-decoration: none;
	}

	img {
		border: none;
	}

	.like-btn {
		// transition: opacity .1s;
	}

	.like-btn-hover {
		opacity: 0.8;
	}

	.dfc {
		display: flex !important;
		flex-direction: column;
	}

	.df {
		display: flex;
	}

	.jsb {
		justify-content: space-between;
	}

	.jsa {
		justify-content: space-around;
	}

	.aic {
		align-items: center;
	}

	.jce {
		justify-content: flex-end;
	}

	.jcc {
		justify-content: center;
	}


	.tac {
		text-align: center;
	}


	.mb0 {
		margin-bottom: 0;
	}

	.mb5 {
		margin-bottom: 5rpx;
	}

	.mb10 {
		margin-bottom: 10rpx;
	}

	.mb20 {
		margin-bottom: 20rpx;
	}

	.mr0 {
		margin-right: 0;
	}

	.mr5 {
		margin-right: 5rpx;
	}

	.mr10 {
		margin-right: 10rpx;
	}

	.mr20 {
		margin-right: 20rpx;
	}

	.ml0 {
		margin-left: 0;
	}

	.ml5 {
		margin-left: 5rpx;
	}

	.ml10 {
		margin-left: 10rpx;
	}

	.ml20 {
		margin-left: 20rpx;
	}

	.mt5 {
		margin-top: 5rpx;
	}

	.mt10 {
		margin-top: 10rpx;
	}

	.mt20 {
		margin-top: 20rpx;
	}

	.w100 {
		width: 100% !important;
	}

	.cup {
		cursor: pointer;
	}
</style>
