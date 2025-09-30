import Vue from 'vue'
import Vuex from 'vuex'
import {
	http
} from "@/utils/request/index.js";
Vue.use(Vuex)
const store = new Vuex.Store({
	state: {
		isLogin: false, // 登录状态
		refreshLogin: false, // 是否正在重新登录
		userInfo: {}, //当前登录用户信息
		toPageTime: "", // 进入页面时间
		tokenExpiredTime: 0, // token过期时间
	},
	mutations: {
		setLogin(state, data) {
			state.isLogin = data
		},
		setUserInfo(state, data) {
			state.userInfo = data
		},
		setRefreshLogin(state, data) {
			state.refreshLogin = data
		},
		setToPageTime(state, data) {
			state.toPageTime = data
		},
		setTokenExpiredTime(state, data) {
			state.tokenExpiredTime = data
		},
	},
	actions: {
		async getUserInfo({
			commit,
			state
		}, appStart) {
			console.log("Store: 开始获取用户信息，appStart:", appStart);

			try {
				const res = await http.request({
					url: '/api/tenantsUser/selectById',
					method: 'get',
				});

				console.log("Store: 获取用户信息响应:", res);

				if (res.status === 1) {
					console.log("Store: 用户信息获取成功，更新登录状态");
					commit("setLogin", true);
					commit("setUserInfo", res.data);

					if (appStart) {
						console.log("Store: 应用启动时获取用户信息，刷新页面");
						// 调用页面方法
						let pages = getCurrentPages();
						if (
							pages &&
							Array.isArray(pages) &&
							pages[0]
						) {
							console.log("Store: 刷新当前页面:", pages[0].route);
							pages[0].onLoad(pages[0].options);
							pages[0].onShow();
						}
					}
				} else {
					console.log("Store: 获取用户信息失败，状态码:", res.status, "错误信息:", res.message);
					// 只有在用户确实不存在或token无效时才清除登录状态
					if (res.status === 0 || res.message?.includes("token") || res.message?.includes("登录")) {
						console.log("Store: Token无效，清除登录状态");
						commit("setLogin", false);
						commit("setUserInfo", {});
						// 清除无效的token
						uni.removeStorageSync("token");
					}
				}
			} catch (error) {
				console.error("Store: 获取用户信息异常:", error);

				// 区分网络错误和认证错误
				if (error.statusCode === 401) {
					console.log("Store: 401错误，token已过期");
					// 认证失败，清除登录状态
					commit("setLogin", false);
					commit("setUserInfo", {});
					uni.removeStorageSync("token");
				} else if (error.message && error.message.includes("网络")) {
					console.log("Store: 网络错误，保持当前登录状态");
					// 网络错误，不改变登录状态
					throw new Error("网络连接失败，请检查网络设置");
				} else {
					console.log("Store: 其他错误，清除登录状态");
					// 其他错误，清除登录状态
					commit("setLogin", false);
					commit("setUserInfo", {});
				}
			}
		},

		// 检查并恢复登录状态
		async checkAndRestoreLogin({
			commit,
			dispatch,
			state
		}) {
			console.log("Store: 检查并恢复登录状态");

			const token = uni.getStorageSync("token");
			if (!token) {
				console.log("Store: 没有找到token，用户未登录");
				return false;
			}

			// 检查token是否过期
			if (state.tokenExpiredTime > 0 && Date.now() > state.tokenExpiredTime) {
				console.log("Store: Token已过期，清除登录状态");
				commit("setLogin", false);
				commit("setUserInfo", {});
				commit("setTokenExpiredTime", 0);
				uni.removeStorageSync("token");
				return false;
			}

			try {
				console.log("Store: 找到token，验证用户信息...");
				await dispatch("getUserInfo", true);
				return true;
			} catch (error) {
				console.error("Store: 恢复登录状态失败:", error);
				return false;
			}
		},

		// 设置登录状态和token过期时间
		setLoginWithToken({
			commit
		}, { token, expiresIn = 24 * 60 * 60 * 1000 }) {
			console.log("Store: 设置登录状态和token过期时间");

			// 计算token过期时间（默认24小时）
			const expiredTime = Date.now() + expiresIn;

			commit("setLogin", true);
			commit("setTokenExpiredTime", expiredTime);

			console.log("Store: Token过期时间设置为:", new Date(expiredTime).toLocaleString());
		}
	}
})

export default store
