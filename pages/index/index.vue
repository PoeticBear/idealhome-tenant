<template>
	<view class="page-veiw">
		<u-navbar v-if="houseList.length>1" bgColor="transparent" leftIconColor="#fff" @leftClick="chooseHouse"
			leftIconSize="30px" leftIcon="list-dot">
		</u-navbar>
		<view class="house-info-view">
			<!-- 房屋基本信息卡片 -->
			<view class="info-card house-basic-card">
				<view class="house-title-view">
					<view class="house-name">
						{{houseInfo.name || '无名'}}
					</view>
					<view class="house-status" :class="houseStatus.class">
						{{houseStatus.text}}
					</view>
				</view>
				<view class="house-price-view">
					<view class="house-info-text">
						<view>房租：{{houseInfo.price || ''}}</view>
						<view>房东：{{houseInfo.landlordUser.name || ''}}</view>
						<view>入住时间：{{houseInfo.checkInTime || ''}}</view>
						<view>合同到期：{{contractEndDate}}</view>
					</view>
					<view class="house-check-in-number">
						<text class="house-check-in-title">已入住</text>
						<u-count-to color="#fff" :bold="true" fontSize="80rpx" :startVal="0"
							:endVal="houseInfo.checkInDays || 0"></u-count-to>
						<text class="house-check-in-unit">天</text>
					</view>
				</view>
				<view class="btn-view">
					<u-button type="warning" color='#FFA92F' @click="makePhone" text="联系房东"></u-button>
					<u-button type="primary" text="房间报修" @click="toMaintenance"></u-button>
				</view>
			</view>

			<!-- 费用信息卡片 -->
			<view class="info-card fee-card">
				<view class="card-header">
					<u-icon name="rmb-circle" color="#FFA92F" size="40rpx"></u-icon>
					<text class="card-title">费用信息</text>
				</view>
				<view class="fee-info">
					<view class="fee-item">
						<text class="fee-label">本月房租</text>
						<text class="fee-amount">{{feeInfo.rent}}</text>
					</view>
					<view class="fee-item">
						<text class="fee-label">水电费</text>
						<text class="fee-amount">{{feeInfo.utilities}}</text>
					</view>
					<view class="fee-item">
						<text class="fee-label">待缴费</text>
						<text class="fee-amount pending">{{feeInfo.pending}}</text>
					</view>
				</view>
				<view class="card-footer">
					<u-button type="info" size="mini" text="缴费记录" @click="viewPaymentHistory"></u-button>
					<u-button type="primary" size="mini" text="立即缴费" @click="makePayment"></u-button>
				</view>
			</view>

			<!-- 报修进度卡片 -->
			<view class="info-card repair-card">
				<view class="card-header">
					<u-icon name="tools" color="#FFA92F" size="40rpx"></u-icon>
					<text class="card-title">报修进度</text>
				</view>
				<view class="repair-info">
					<view class="repair-status">
						<text class="status-label">当前状态：</text>
						<text class="status-text" :class="repairInfo.statusClass">{{repairInfo.status}}</text>
					</view>
					<view class="repair-progress" v-if="repairInfo.hasRepair">
						<u-line-progress :percentage="repairInfo.progress" activeColor="#FFA92F"></u-line-progress>
						<text class="repair-desc">{{repairInfo.description}}</text>
					</view>
				</view>
				<view class="card-footer">
					<u-button type="info" size="mini" text="报修记录" @click="viewRepairHistory"></u-button>
					<u-button type="primary" size="mini" text="新的报修" @click="toMaintenance"></u-button>
				</view>
			</view>

			<!-- 房东信息卡片 -->
			<view class="info-card landlord-card">
				<view class="card-header">
					<u-icon name="account" color="#FFA92F" size="40rpx"></u-icon>
					<text class="card-title">房东信息</text>
				</view>
				<view class="landlord-info">
					<view class="landlord-detail">
						<text class="landlord-name">{{houseInfo.landlordUser.name || ''}}</text>
						<view class="landlord-rating">
							<u-rate v-model="landlordInfo.rating" readonly></u-rate>
							<text class="rating-text">{{landlordInfo.rating}}分</text>
						</view>
					</view>
					<view class="landlord-contacts">
						<view class="contact-item">
							<u-icon name="phone" color="#666" size="24rpx"></u-icon>
							<text class="contact-text">{{landlordInfo.phone}}</text>
						</view>
						<view class="contact-item">
							<u-icon name="chat" color="#666" size="24rpx"></u-icon>
							<text class="contact-text">{{landlordInfo.wechat}}</text>
						</view>
					</view>
				</view>
			</view>

			<!-- 实用提醒卡片 -->
			<view class="info-card reminder-card">
				<view class="card-header">
					<u-icon name="bell" color="#FFA92F" size="40rpx"></u-icon>
					<text class="card-title">实用提醒</text>
				</view>
				<view class="reminder-list">
					<view class="reminder-item" v-for="(reminder, index) in reminderList" :key="index">
						<u-icon :name="reminder.icon" :color="reminder.color" size="24rpx"></u-icon>
						<text class="reminder-text">{{reminder.text}}</text>
						<text class="reminder-time">{{reminder.time}}</text>
					</view>
				</view>
			</view>
		</view>
		<u-loading-page color="#FFA92F" loading-color="#FFA92F" :icon-size="loadingSize" :image="loadingImg"
			:loading-text="loadingText" loading-mode="circle" :loading="pageLoading"></u-loading-page>
	</view>
</template>

<script>
	import {
		mapState
	} from "vuex"
	export default {
		data() {
			return {
				houseList: [],
				houseInfo: {},
				pageLoading: false,
				loadingSize: 50,
				loadingImg: "",
				loadingText: '加载中...',
				// 房屋状态
				houseStatus: {
					text: '正常居住',
					class: 'status-normal'
				},
				// 合同到期日期
				contractEndDate: '2024-12-31',
				// 费用信息
				feeInfo: {
					rent: '¥2,500',
					utilities: '¥180',
					pending: '¥0'
				},
				// 报修信息
				repairInfo: {
					status: '无报修',
					statusClass: 'status-normal',
					hasRepair: false,
					progress: 0,
					description: ''
				},
				// 房东信息
				landlordInfo: {
					rating: 4.5,
					phone: '138****8888',
					wechat: 'landlord_wx001'
				},
				// 提醒列表
				reminderList: [
					{
						icon: 'clock',
						color: '#FFA92F',
						text: '距离下次缴费还有7天',
						time: '7天后'
					},
					{
						icon: 'calendar',
						color: '#19be6b',
						text: '租赁合同将于90天后到期',
						time: '90天后'
					},
					{
						icon: 'info-circle',
						color: '#2979ff',
						text: '物业通知：停水维护通知',
						time: '明天'
					}
				]
			}
		},
		onLoad() {
			this.pageLoading = true
		},
		onShow() {
			if (this.isLogin) {
				this.getHouseList()
			} else {
				this.loadingImg = '/static/image/nohouse.png'
				this.loadingSize = 200
				this.loadingText = "登陆后查看"
			}
		},
		computed: {
			...mapState(['isLogin']),
		},
		methods: {
			getHouseList() {
				return this.$http.request({
					url: "/api/tenantsUser/getHouseByTenantId",
					method: "get",
				}).then(({
					status,
					data
				}) => {
					if (status === 1) {
						this.houseList = data
						if (
							data &&
							Array.isArray(data) &&
							data.length > 0
						) {
							this.switchHouseInfo(data[0])
							this.pageLoading = false
						} else {
							this.loadingImg = '/static/image/nohouse.png'
							this.loadingSize = 200
							this.loadingText = "暂无租房"
							this.pageLoading = true
						}
					}
				})
			},
			switchHouseInfo(data) {
				this.houseInfo = JSON.parse(JSON.stringify(data))
			},
			chooseHouse() {
				uni.showActionSheet({
					title: "选择房屋",
					itemList: this.houseList.map(item => item.name),
					success: ({
						tapIndex
					}) => {
						this.switchHouseInfo(this.houseList[tapIndex])
					},
					fail: function(res) {
						console.log(res.errMsg);
					}
				});
			},
			makePhone() {
				uni.showModal({
					title: '将要拨打电话',
					content: this.houseInfo.landlordUser.phone,
					success: (res) => {
						if (res.confirm) {
							uni.makePhoneCall({
								phoneNumber: this.houseInfo.landlordUser.phone
							})
						}
					}
				})
			},
			toMaintenance() {
				uni.navigateTo({
					url: "/house_pages/house/maintenance?houseId=" + this.houseInfo.id
				})
			},
			closeHousue() {
				uni.showModal({
					title: "提示",
					content: "是否确认退租？",
					success: (res) => {
						if (res.confirm) {
							let data = {
								landlordId: this.houseInfo.landlordUser.id,
								houseId: this.houseInfo.id
							}
							return this.$http.request({
								url: "/api/house/houseOut",
								method: "post",
								data
							}).then(({
								status
							}) => {
								if (status === 1) {
									this.getHouseList()
								}
							})
						}
					}
				})
			},
			// 查看缴费记录
			viewPaymentHistory() {
				uni.showToast({
					title: '缴费记录功能开发中',
					icon: 'none'
				})
			},
			// 立即缴费
			makePayment() {
				if (this.feeInfo.pending === '¥0') {
					uni.showToast({
						title: '暂无待缴费项目',
						icon: 'none'
					})
					return
				}
				uni.showToast({
					title: '缴费功能开发中',
					icon: 'none'
				})
			},
			// 查看报修记录
			viewRepairHistory() {
				uni.navigateTo({
					url: '/house_pages/house/maintenanceList'
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.page-veiw {
		width: 100%;
		height: 100vh;
		overflow: hidden;
		position: relative;
		background-color: #f5f5f5;

		.house-info-view {
			width: 100%;
			margin-top: 100rpx;
			padding: 32rpx;
			box-sizing: border-box;
			display: flex;
			flex-direction: column;
			gap: 20rpx;

			// 通用卡片样式
			.info-card {
				background-color: #fff;
				border-radius: 20rpx;
				padding: 24rpx;
				box-shadow: 0 4rpx 20rpx 0 rgba(218, 218, 218, 0.25);

				.card-header {
					display: flex;
					align-items: center;
					margin-bottom: 16rpx;
					padding-bottom: 12rpx;
					border-bottom: 1rpx solid #f0f0f0;

					.card-title {
						font-size: 32rpx;
						font-weight: bold;
						color: #333;
						margin-left: 12rpx;
					}
				}

				.card-footer {
					display: flex;
					justify-content: flex-end;
					gap: 16rpx;
					margin-top: 16rpx;
					padding-top: 12rpx;
					border-top: 1rpx solid #f0f0f0;
				}
			}

			.house-title-view {
				width: 100%;
				margin-bottom: 20rpx;
				padding-bottom: 10rpx;
				border-bottom: dashed 2rpx #FFA92F;
				display: flex;
				align-items: center;
				justify-content: space-between;

				.house-name {
					width: 100%;
					color: #FFA92F;
					font-size: 40rpx;
					line-height: 60rpx;
					white-space: nowrap;
					text-overflow: ellipsis;
					overflow: hidden;
					margin-right: 20rpx;
				}

				.house-close {
					height: 60rpx;
					width: 60rpx;
					flex-shrink: 0;
					display: flex;
					align-items: center;
					justify-content: center;
				}
			}


			.house-price-view {
				width: 100%;
				display: flex;
				justify-content: space-between;

				.house-info-text {
					width: 80%;

					& view {
						color: #999;
						font-size: 28rpx;
						margin-bottom: 10rpx;
					}

					.house-out {
						color: #fa3534;
						font-size: 32rpx;
					}
				}

				.house-check-in-number {
					flex-shrink: 0;
					width: 200rpx;
					height: 200rpx;
					// background-color: #FFA92F;
					background-image: linear-gradient(#FFA92F, #FFDC2F);
					border-radius: 10rpx;
					position: relative;

					.house-check-in-title {
						font-size: 32rpx;
						color: #fff;
						font-weight: bold;
						position: absolute;
						top: 10rpx;
						left: 0;
						right: 0;
						margin: 0 auto;
						text-align: center;
					}

					.house-check-in-unit {
						font-size: 24rpx;
						color: #fff;
						position: absolute;
						bottom: 10rpx;
						right: 10rpx;
					}

					::v-deep .u-count-num {
						display: block;
						position: absolute;
						margin: auto;
						left: 0;
						top: 0;
						bottom: 0;
						right: 0;
						text-align: center;
						line-height: 200rpx;
					}
				}
			}

			// 房屋基本信息卡片样式
			.house-basic-card {
				.house-title-view {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 20rpx;
					padding-bottom: 10rpx;
					border-bottom: dashed 2rpx #FFA92F;

					.house-name {
						color: #FFA92F;
						font-size: 40rpx;
						font-weight: bold;
						flex: 1;
					}

					.house-status {
						padding: 6rpx 16rpx;
						border-radius: 20rpx;
						font-size: 24rpx;
						font-weight: bold;

						&.status-normal {
							background-color: #19be6b;
							color: #fff;
						}

						&.status-warning {
							background-color: #ff9900;
							color: #fff;
						}

						&.status-danger {
							background-color: #fa3534;
							color: #fff;
						}
					}
				}

				.house-price-view {
					display: flex;
					justify-content: space-between;
					margin-bottom: 20rpx;

					.house-info-text {
						width: 60%;

						view {
							color: #666;
							font-size: 28rpx;
							margin-bottom: 8rpx;
						}
					}

					.house-check-in-number {
						width: 160rpx;
						height: 160rpx;
						background-image: linear-gradient(#FFA92F, #FFDC2F);
						border-radius: 10rpx;
						position: relative;

						.house-check-in-title {
							font-size: 24rpx;
							color: #fff;
							font-weight: bold;
							position: absolute;
							top: 8rpx;
							left: 0;
							right: 0;
							text-align: center;
						}

						.house-check-in-unit {
							font-size: 20rpx;
							color: #fff;
							position: absolute;
							bottom: 8rpx;
							right: 8rpx;
						}

						::v-deep .u-count-num {
							display: block;
							position: absolute;
							margin: auto;
							left: 0;
							top: 0;
							bottom: 0;
							right: 0;
							text-align: center;
							line-height: 160rpx;
						}
					}
				}

				.btn-view {
					display: flex;
					gap: 20rpx;

					::v-deep .u-button {
						flex: 1;
						border-radius: 40rpx;
					}
				}
			}

			// 费用信息卡片样式
			.fee-card {
				.fee-info {
					.fee-item {
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-bottom: 12rpx;

						.fee-label {
							font-size: 28rpx;
							color: #666;
						}

						.fee-amount {
							font-size: 32rpx;
							font-weight: bold;
							color: #333;

							&.pending {
								color: #fa3534;
							}
						}
					}
				}
			}

			// 报修进度卡片样式
			.repair-card {
				.repair-info {
					.repair-status {
						display: flex;
						align-items: center;
						margin-bottom: 12rpx;

						.status-label {
							font-size: 28rpx;
							color: #666;
						}

						.status-text {
							font-size: 28rpx;
							font-weight: bold;

							&.status-normal {
								color: #19be6b;
							}

							&.status-warning {
								color: #ff9900;
							}

							&.status-danger {
								color: #fa3534;
							}
						}
					}

					.repair-progress {
						margin-top: 16rpx;

						.repair-desc {
							font-size: 24rpx;
							color: #999;
							margin-top: 8rpx;
							text-align: center;
						}
					}
				}
			}

			// 房东信息卡片样式
			.landlord-card {
				.landlord-info {
					.landlord-detail {
						margin-bottom: 16rpx;

						.landlord-name {
							font-size: 32rpx;
							font-weight: bold;
							color: #333;
							margin-bottom: 8rpx;
						}

						.landlord-rating {
							display: flex;
							align-items: center;
							gap: 8rpx;

							.rating-text {
								font-size: 24rpx;
								color: #666;
							}
						}
					}

					.landlord-contacts {
						.contact-item {
							display: flex;
							align-items: center;
							margin-bottom: 8rpx;

							.contact-text {
								font-size: 26rpx;
								color: #666;
								margin-left: 8rpx;
							}
						}
					}
				}
			}

			// 实用提醒卡片样式
			.reminder-card {
				.reminder-list {
					.reminder-item {
						display: flex;
						align-items: center;
						margin-bottom: 12rpx;
						padding: 12rpx;
						background-color: #f8f8f8;
						border-radius: 12rpx;

						.reminder-text {
							flex: 1;
							font-size: 26rpx;
							color: #333;
							margin-left: 8rpx;
						}

						.reminder-time {
							font-size: 22rpx;
							color: #999;
						}
					}
				}
			}
		}
	}
</style>