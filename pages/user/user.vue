<template>
	<view class="page-view">
		<view class="user-info-bg">
		</view>
		<view class="user-info-view">
			<view class="user-avatar">
				<view class="user-avatar-placeholder">
					<text class="user-avatar-text">{{userInfo.name ? userInfo.name.charAt(0).toUpperCase() : 'U'}}</text>
				</view>
			</view>
			<view class="user-name" v-if="isLogin">{{userInfo.name}}</view>
			<view class="user-name" @click="toLogin" v-if="!isLogin">点击登录</view>
			<view class="user-signature" v-show="userInfo.remark && isLogin">
				{{userInfo.remark || ''}}
			</view>

			<u-cell-group>
				<u-cell isLink icon="setting" title="个人设置" @click="showInfoSetting"></u-cell>
				<u-cell isLink icon="warning" title="报修记录" @click="toPath('/house_pages/house/maintenanceList')">
				</u-cell>
				<u-cell isLink icon="star" title="我的收藏" @click="toPath('/house_pages/house/star')"></u-cell>
				<u-cell isLink icon="clock" title="租房历史" @click="toPath('/house_pages/house/history')"></u-cell>
			</u-cell-group>
		</view>
		<u-button type="error" v-if="isLogin" @click="logout" circle text="退出登录"></u-button>
		<u-popup :show="infoPopupShow" :round="20" mode="bottom" @close="infoPopupShow = false">
			<view class="info-popup-head">
				<u--text type="info" text="取消" @click="infoPopupShow = false"></u--text>
				<text>修改个人信息</text>
				<u--text type="primary" align="right" text="确认" @click="saveUserInfo"></u--text>
			</view>
			<u--form labelWidth='80' labelPosition="left" labelAlign="right" :model="userInfoData" ref="userInfoForm">
				<u-form-item label="姓名：" prop="name" borderBottom>
					<u--input v-model="userInfoData.name" placeholder="请输入" :maxlength="20" clearable>
					</u--input>
				</u-form-item>
				<u-form-item label="头像：" borderBottom>
					<view class="avatar-upload-placeholder">
						<view class="avatar-upload-icon">📷</view>
						<text class="avatar-upload-text">点击上传头像</text>
					</view>
				</u-form-item>
				<u-form-item label="宣言：" prop="remark" borderBottom>
					<u--input v-model="userInfoData.remark" placeholder="请输入" :maxlength="100" clearable>
					</u--input>
				</u-form-item>
			</u--form>
		</u-popup>
	</view>
</template>

<script>
		import {
		mapState,
		mapMutations,
		mapActions
	} from "vuex"
	export default {
		data() {
			return {
				avatarUrl: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
				infoPopupShow: false,
				userInfoData: {
					name: "",
					remark: "",
					headImg: []
				},
			}
		},
		computed: {
			...mapState(['isLogin', 'userInfo']),
			formRules() {
				return {
					name: [{
							required: true,
							message: '此项为必填',
							// blur和change事件触发检验
							trigger: ['blur', 'change'],
						},
						{
							min: 0,
							max: 20,
							message: '文字长度在20个字符以内'
						},
					],
				}
			}
		},
		onReady() {
			//如果需要兼容微信小程序，并且校验规则中含有方法等，只能通过setRules方法设置规则。
			this.$refs.userInfoForm.setRules(this.formRules)
		},
		onShow() {
			if (this.isLogin) {
				this.getUserInfo()
			}
		},
		methods: {
			...mapMutations(["setLogin", "setUserInfo"]),
			...mapActions(["getUserInfo"]),
			login() {
				uni.navigateTo({
					url: "/pages/login/login"
				})
			},
			logout() {
				uni.showModal({
					title: "提示",
					content: "是否退出登录？",
					success: (res) => {
						if (res.confirm) {
							this.setLogin(false)
							this.setUserInfo({})
							uni.removeStorage({
								key: "token",
							});
						}
					}
				})

			},
			toLogin() {
				uni.navigateTo({
					url: "/pages/login/login"
				})
			},
			requestSubscribeMessage() {
				uni.requestSubscribeMessage({
					tmplIds: ['4g2brsgOcsiXpw0url5F8_1_uq8eypuuEfcg99Yt6zM'],
					success: (res) => {
						console.log(res);

					}
				})
			},
			showInfoSetting() {
				if (this.isLogin) {
					this.infoPopupShow = true
					this.userInfoData.name = this.userInfo.name
					this.userInfoData.remark = this.userInfo.remark
					if (this.userInfo.headImg) {
						this.userInfoData.headImg = [{
							url: this.userInfo.headImg
						}]
					}
				} else {
					this.toLogin()
				}

			},
			toPath(url) {
				if (this.isLogin) {
					uni.navigateTo({
						url
					})
				} else {
					this.toLogin()
				}
			},
			headImgAfterRead(event) {
				let fileList = event.file
				this.userInfoData.headImg = [{
					...fileList,
					status: 'uploading',
					message: '上传中'
				}]
				this.uploadImg(fileList.url)
			},
			headImgDeletePic(event) {
				this.userInfoData.headImg.splice(event.index, 1)
			},
			uploadImg(filePath) {
				//上传
				let token = uni.getStorageSync('token')
				uni.uploadFile({
					url: `${this.$baseUrl}/api/file/upload`,
					header: {
						'Authorization': token,
						'content-type': 'application/x-www-form-urlencggoded;charset=UTF-8'
					},
					filePath,
					name: "file",
					success: ({
						statusCode,
						data
					}) => {
						data = JSON.parse(data)
						if (data.status === 1 && statusCode === 200) {
							this.userInfoData.headImg = this.userInfoData.headImg.map((item, ind) => {
								item = data.data
								item.status = 'success'
								return item
							})
						} else {
							this.userInfoData.headImg = this.userInfoData.headImg.map((item, ind) => {
								item.status = 'failed'
								item.message = '上传失败'
								return item
							})
						}
					},
					fail: (err) => {
						this.userInfoData.headImg = this.userInfoData.headImg.map((item, ind) => {
							item.status = 'failed'
							item.message = '上传失败'
							return item
						})
					},
					complete: (e) => {}
				});
			},
			saveUserInfo() {
				let data = {}
				data.name = this.userInfoData.name
				data.remark = this.userInfoData.remark
				if (
					this.userInfoData.headImg &&
					Array.isArray(this.userInfoData.headImg) &&
					this.userInfoData.headImg.length > 0 &&
					this.userInfoData.headImg.every(item => item.status === 'success')
				) {
					data.headImg = this.userInfoData.headImg[0].url
				}
				this.$http.request({
					url: "/api/tenantsUser/update",
					method: "post",
					data
				}).then(({
					status,
					data
				}) => {
					if (status === 1) {
						this.setUserInfo({
							...this.userInfo,
							...data
						})
						this.infoPopupShow = false
						uni.showToast({
							icon: "success",
							title: "修改成功！"
						})
					}
				})
			}
		}
	}
</script>

<style scoped lang="scss">
	.page-view {
		.user-info-bg {
			height: 500rpx;
			background-image: linear-gradient(#FFA92F, #FFDC2F);
		}

		.user-info-view {
			width: 680rpx;
			border-radius: 20rpx;
			background-color: #fff;
			margin: -150rpx auto 0;
			padding: 138rpx 32rpx 32rpx;
			box-sizing: border-box;
			position: relative;

			.user-avatar {
				width: 220rpx;
				height: 220rpx;
				border-radius: 50%;
				border: 10rpx solid #fff;
				position: absolute;
				top: -110rpx;
				left: 0;
				right: 0;
				margin: 0 auto;

				.user-avatar-placeholder {
					width: 100%;
					height: 100%;
					border-radius: 50%;
					background: linear-gradient(135deg, #FFA92F, #FFDC2F);
					display: flex;
					align-items: center;
					justify-content: center;

					.user-avatar-text {
						font-size: 80rpx;
						font-weight: bold;
						color: #fff;
						text-shadow: 0 2rpx 4rpx rgba(0,0,0,0.2);
					}
				}
			}

			.user-name {
				color: #FFA92F;
				text-align: center;
				font-weight: bold;
				font-size: 40rpx;
				margin-bottom: 20rpx;
			}

			.user-signature {
				font-size: 28rpx;
				color: #666;
				margin: 0 0 40rpx;
				text-align: center;
			}
		}

		::v-deep .u-button {
			width: 400rpx;
			margin: 20px auto;
		}
	}

	.info-popup-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: 100rpx;
		border-bottom: solid 1px #eee;
		padding: 0 60rpx;
	}

	.avatar-upload-placeholder {
		width: 120rpx;
		height: 120rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #FFA92F, #FFDC2F);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		border: 2rpx dashed #fff;
		cursor: pointer;
		transition: all 0.3s ease;

		&:hover {
			transform: scale(1.05);
			box-shadow: 0 4rpx 12rpx rgba(255, 169, 47, 0.3);
		}

		.avatar-upload-icon {
			font-size: 40rpx;
			margin-bottom: 4rpx;
		}

		.avatar-upload-text {
			font-size: 20rpx;
			color: #fff;
			text-align: center;
			line-height: 1.2;
		}
	}
</style>