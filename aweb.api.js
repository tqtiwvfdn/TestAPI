define(["jquery"], function($) {
	app.performance = function() {
		var Performance = function() {},
			vendors = ["webkit", "moz"],
			requestAnimationFrame = window.requestAnimationFrame,
			cancelAnimationFrame = cancelAnimationFrame,
			setTimeout = window.setTimeout,
			clearTimeout = window.clearTimeout;
		for (var x = 0; x < vendors.length && !requestAnimationFrame; ++x) {
			requestAnimationFrame = window[vendors[x] + "RequestAnimationFrame"];
			cancelAnimationFrame = window[vendors[x] + "CancelAnimationFrame"] || window[vendors[x] + "CancelRequestAnimationFrame"]
		}
		if (!requestAnimationFrame) {
			requestAnimationFrame = setTimeout
		}
		if (!cancelAnimationFrame) {
			cancelAnimationFrame = clearTimeout
		}
		Performance.prototype = {
			constructor: Performance,
			id: "performanceDelayId",
			timeout: 220,
			frequency: 16.7,
			longDelay: function(callback) {
				var id;
				if ($.isFunction(callback)) {
					if (id = callback[this.id]) {
						clearTimeout(id);
						cancelAnimationFrame(id)
					}
					callback[this.id] = setTimeout(callback, this.timeout)
				}
			},
			shortDelay: function(callback) {
				var id;
				if ($.isFunction(callback)) {
					if (id = callback[this.id]) {
						clearTimeout(id);
						cancelAnimationFrame(id)
					}
					callback[this.id] = requestAnimationFrame(callback, this.frequency)
				}
			},
			setTimeout: function(timeout) {
				this.timeout = timeout
			},
			getTimeout: function() {
				return this.timeout
			},
			setFrequency: function(frequency) {
				this.frequency = frequency
			},
			getFrequency: function() {
				return this.frequency
			}
		};
		return new Performance
	}();
	app.page = function() {
		var actions = {
			refresh: function() {
				var _router, _handler;
				if (_router = app.router) {
					if (_router.getCurrentHandler && (_handler = _router.getCurrentHandler())) {
						_handler.stepTo(0)
					}
				}
			},
			close: function() {
				var _router, _tab;
				if ((_router = app.router) && (_tab = _router.tab) && _tab.close) {
					_tab.close()
				}
			},
			closeAll: function(tips) {
				var _router, _tab, _stack, i, domID;
				tips && app.shelter.show(tips);
				if ((_router = app.router) && (_tab = _router.tab) && (_stack = _tab.stack) && _stack.length) {
					try {
						for (i = -1; domID = _stack[++i];) {
							try {
								_tab.close(domID, true)
							} catch (e) {
								console.error(e)
							}
						}
					} catch (e) {
						console.error(e)
					} finally {
						_tab.stack = [];
						_router.cache = {}
					}
				}
				tips && app.shelter.hide()
			},
			updateCurrentInterval: function(uniqueId, option) {
				var _router, _handler;
				if (_router = app.router) {
					if (_router.getCurrentHandler && (_handler = _router.getCurrentHandler())) {
						_handler.updateInterval(uniqueId, option)
					}
				}
			},
			fullscreen: function(fullscreen) {
				var _router, _tab;
				if ((_router = app.router) && (_tab = _router.tab) && _tab.fullscreen) {
					_tab.fullscreen(fullscreen)
				}
			},
			isFullScreen: function() {
				var _router, _tab;
				if ((_router = app.router) && (_tab = _router.tab) && _tab.isFullScreen) {
					return _tab.isFullScreen()
				}
			},
			displayNav: function(show) {
				var _router, _tab;
				if ((_router = app.router) && (_tab = _router.tab) && _tab.displayNav) {
					_tab.displayNav(show)
				}
			},
			isDisplayNav: function() {
				var _router, _tab;
				if ((_router = app.router) && (_tab = _router.tab) && _tab.isDisplayNav) {
					return _tab.isDisplayNav()
				}
			}
		};
		return actions
	}();
	app.queryString = function(key) {
		var hash = window.location.hash || document.location.hash,
			search = window.location.search || document.location.search || "",
			decoder = window.decodeURI || window.decodeURIComponent,
			rKey = new RegExp("\\b" + key + "=([^$&]+)"),
			value;
		if (hash && !search) {
			search = hash.split("?")[1]
		}
		value = search.match(rKey);
		value = value && value[1];
		return value ? decoder(value) : ""
	};
	app.setData = function(name, value, toCookie, expireDays) {
		function setCookie(name, value, expireDays) {
			var temp = "_name_=_value_;path=" + document.location.hostname + ";expires=_expireDays_;max-age=_maxAge_",
				expireDate = new Date;
			expireDays = expireDays ? expireDays : 100;
			expireDate.setDate(expireDate.getDate() + expireDays);
			document.cookie = temp.replace(/_name_/, name).replace(/_value_/, value).replace(/_expireDays_/, expireDate.toUTCString()).replace(/_maxAge__/, 3600 * 24 * expireDays);
			return document.cookie
		}
		var encoder = window.encodeURI || window.encodeURIComponent || window.escape,
			result = true;
		if (value || !~expireDays) {
			if (typeof value !== "string") {
				value = app.stringify(value)
			}
			value = encoder(value);
			if (toCookie) {
				result = !!setCookie(name, value, expireDays)
			} else {
				try {
					window.localStorage.setItem(name, value)
				} catch (e) {
					result = !!setCookie(name, value, expireDays)
				}
			}
		} else {
			result = false
		}
		return result
	};
	app.getData = function(name, fromCookie) {
		function getCookie(name) {
			var value = document.cookie.match(new RegExp(name + "=([^;]+)"));
			return value && value.length ? value[1] : ""
		}
		var value, decoder = window.decodeURI || window.decodeURIComponent || window.unescape;
		if (fromCookie) {
			value = getCookie(name)
		} else {
			try {
				value = window.localStorage.getItem(name);
				if (!value) value = getCookie(name)
			} catch (e) {
				value = getCookie(name)
			}
		}
		return decoder(value)
	};
	app.removeData = function(name, fromCookie) {
		var result = true;
		if (fromCookie) {
			result = app.setData(name, "", true, -1)
		} else {
			try {
				window.localStorage.removeItem(name)
			} catch (e) {
				result = app.setData(name, "", true, -1)
			}
		}
		return result
	};
	app.domain = function() {
		var domain = {
			session: {},
			scope: {},
			exports: function(namespace, data) {
				var cache;
				if (aweb.debug) {
					var handler = app.router && app.router.getCurrentHandler();
					if (data && handler) {
						console.log(["页面模型：", handler.path, " 设置跨页缓存，命名空间为:", namespace, "，数据为"].join(""));
						console.log(data)
					}
				}
				domain.clearScope(namespace);
				if (!domain.scope[namespace]) {
					domain.scope[namespace] = {}
				}
				cache = domain.scope[namespace];
				if (data) {
					for (var name in data) {
						if (typeof data[name] === "string") {
							cache[name] = "" + data[name]
						} else if ($.isArray(data[name])) {
							cache[name] = [].concat(data[name])
						} else if (typeof data[name] === "object") {
							if (data[name] === null) {
								cache[name] = null
							} else {
								cache[name] = $.extend(true, {}, data[name])
							}
						} else {
							cache[name] = data[name]
						}
					}
				}
			},
			clearScope: function(namespace) {
				if (domain.scope[namespace]) {
					if (aweb.debug) {
						var handler = app.router && app.router.getCurrentHandler();
						if (handler) {
							console.log(["页面模型：", handler.path, " 清除跨页缓存，命名空间为:", namespace].join(""))
						}
					}
					delete domain.scope[namespace]
				}
			},
			get: function(namespace, name) {
				var cache;
				if (domain.scope[namespace]) {
					cache = name === undefined ? domain.scope[namespace] : domain.scope[namespace][name];
					if (aweb.debug) {
						var handler = app.router && app.router.getCurrentHandler();
						if (handler) {
							console.log(["页面模型：", handler.path, " 获取跨页缓存，命名空间为:", namespace, "，数据为"].join(""));
							console.log(cache)
						}
					}
					return cache
				}
			}
		};
		return domain
	}();
	app.validate = function() {
		var setting = {
			TYPE: {
				require: /^[^$]{1,}$/,
				integer: /^-?\d+$/,
				"float": /^(?:-?\d+\.)(?:\d+)?$/,
				number: /^\d+?$/,
				letter: /^[a-zA-Z]+$/,
				uppercaseLetter: /^[A-Z]+$/,
				lowercaseLetter: /^[a-z]+$/,
				account: /^[a-zA-Z]+(?:[a-zA-Z0-9_]+)?$/,
				id: /^(?!\d+$)[\da-zA-Z]*$/,
				email: /^(?:[\w-]+(?:\.[\w-]+)*)@[\w-]+(?:\.[\w-]+)+$/,
				zipCode: /^[1-9]\d{5}$/,
				mobile: /^(?:(?:\(?:\d{2,3}\))|(?:\d{3}\-))?1\d{10}$/,
				port: /^(?:[0-9]|[1-9]\d|[1-9]\d{2}|[1-9]\d{3}|[1-5]\d{4}|6[0-4]\d{3}|65[0-4]\d{2}|655[0-2]\d|6553[0-5])$/,
				host: /^(?:(?:(?:2(?:5[0-5]|[0-4][0-9]))|(?:1[0-9]{2})|(?:[1-9][0-9])|[0-9])\.){3}(?:(?:2(?:5[0-5]|[0-4][0-9]))|(?:1[0-9]{2})|(?:[1-9][0-9])|[0-9])$/
			},
			MESSAGE: {
				require: "请输入内容",
				integer: "请输入整型",
				"float": "请输入浮点数",
				number: "请输入数字",
				letter: "请输入字母",
				uppercaseLetter: "请输入大写字母",
				lowercaseLetter: "请输入小写字母",
				account: "请输入正确的账号格式",
				email: "请输入正确的邮件格式",
				zipCode: "请输入正确的邮编",
				mobile: "请输入正确的手机格式",
				port: "请输入正确的端口格式",
				host: "请输入正确的主机格式",
				_default: "请输入正确格式"
			},
			SUCCESS_CALLBACK: function($elem) {},
			ERROR_CALLBACK: function($elem, msg) {
				app.alert(msg, app.alert.ERROR)
			},
			CLEAN_CALLBACK: function(focusEvent) {}
		};
		var _type = setting.TYPE,
			_message = setting.MESSAGE,
			_success = setting.SUCCESS_CALLBACK,
			_error = setting.ERROR_CALLBACK,
			_clean = setting.CLEAN_CALLBACK;
		var validate = function(data, success, error, clean, isContinue, isValidate) {
			var list = [],
				result = true,
				singleResult, i, item, info, $elem, value, exp, msg;
			success = $.isFunction(success) ? success : _success;
			error = $.isFunction(error) ? error : _error;
			clean = $.isFunction(clean) ? clean : _clean;
			if ($.isFunction(data)) {
				data = data()
			}
			if ($.isArray(data)) {
				for (i = -1; item = data[++i];) {
					singleResult = true;
					info = item.validate || {};
					msg = info.errorMsg;
					if (info.id) {
						$elem = $(info.id, info.context);
						if (!$elem.length) {
							$elem = null
						}
					} else {
						$elem = null
					}
					value = item.value !== undefined ? item.value : $elem ? $elem.val() : "";
					if (isValidate) {
						try {
							if (info.require === "true" && (value === undefined || value === "")) {
								singleResult = false;
								msg = item.desp + "必填"
							} else if (value) {
								if (info.maxLength) {
									if (info.hasChineseCharacter === "true" && value.replace(/[^\x00-\xff]/g, "**").length > parseInt(info.maxLength, 10) || value.length > parseInt(info.maxLength, 10)) {
										singleResult = false;
										msg = item.desp + "的最大长度不能大于" + info.maxLength
									}
								}
								if (singleResult && info.minLength) {
									if (info.hasChineseCharacter === "true" && value.replace(/[^\x00-\xff]/g, "**").length < parseInt(info.minLength, 10) || value.length < parseInt(info.minLength, 10)) {
										singleResult = false;
										msg = item.desp + "的最小长度不能小于" + info.minLength
									}
								}
								if (singleResult) {
									if ($.isFunction(info.validateHandler)) {
										singleResult = info.validateHandler(value);
										if ($.isPlainObject(singleResult)) {
											msg = singleResult.errorMsg;
											value = singleResult.value;
											singleResult = singleResult.result
										} else {
											singleResult = true
										}
									} else if (info.regex) {
										exp = _type[info.regex] || new RegExp(info.regex.replace(/\\\\/g, "\\"));
										singleResult = $.isFunction(exp) ? exp(value) : exp.test(value);
										msg = msg ? msg : _message[info.regex]
									}
								}
							}
						} catch (e) {
							msg = e.message;
							singleResult = false
						}
					}
					if (singleResult) {
						list.push({
							name: item.name,
							value: value,
							queryString: item.queryString,
							urlExternal: item.urlExternal
						});
						$elem && success($elem)
					} else {
						list.push({
							name: item.name,
							value: value,
							queryString: item.queryString,
							urlExternal: item.urlExternal,
							errorMsg: msg
						});
						if ($elem) {
							error($elem, msg);
							$elem.one("focus.validate", clean)
						} else {
							error($(), msg)
						}
						result = result && singleResult;
						if (!isContinue) break
					}
				}
			} else {
				list = data
			}
			return {
				data: list,
				result: result
			}
		};
		$.extend(validate, setting);
		return validate
	}();
	app.title = function(title) {
		var doc = window.top && window.top.document || document;
		if (typeof title === "string") {
			doc.title = title
		}
		return doc.title
	};
	app.getQueryStringMap = function() {
		var hash = window.location.hash || document.location.hash,
			search = window.location.search || document.location.search || "",
			decoder = window.decodeURI || window.decodeURIComponent,
			matcher, i, length, params, result = {};
		if (hash && !search) {
			search = "?" + hash.split("?")[1]
		}
		matcher = search.match(/[\?\&][^\?\&]+=[^\?\&]+/g);
		if (matcher) {
			for (i = 0, length = matcher.length; i < length; i++) {
				params = (matcher[i] || "").substring(1).split("=");
				result[params[0]] = decoder(params[1])
			}
		}
		return result
	};
	app.getNewQueryStringURL = function(params) {
		var map = $.extend(this.getQueryStringMap(), params),
			encoder = window.encodeURI || window.encodeURIComponent,
			prop, ret = [];
		for (prop in map) {
			if (map.hasOwnProperty(prop)) {
				ret.push(prop + "=" + encoder(map[prop]))
			}
		}
		return ret.join("&")
	};
	app.alert = function() {
		var SHOW_TYPE = {
				SUCCESS: "success",
				success: "fa fa-check-circle alert-success ",
				_DEFAULT: "info",
				info: "fa fa-info-circle alert-info",
				ERROR: "error",
				error: "fa fa-warning alert-pink",
				WARNING: "warning",
				warning: "fa fa-info-circle alert-warning",
				PINK: "pink",
				pink: "alert-pink",
				MESSAGE: "message"
			},
			alertCtnTemp = '<ul id="alertList" data-role="alertList" class="alert-list unstyled" style="z-index: 8;"></ul>',
			alertCttTemp = '<li data-alert-id="_id_"><i class="iconfont icon-topbar-close alert-btn" title="关闭" data-role="close"></i><i class="fa fa-angle-down alert-btn" data-role="more" title="更多"></i><i class="alert-icon _showType_"></i><div class="alert-content" title="_title_">_content_</div></li>',
			alertQueueLength = Math.max(Math.ceil($(window).height() / 100), 3),
			alertQueue = [],
			alertList = [],
			type, event, stopClose = false,
			$alert = $("#alertList"),
			messageDialog = function() {
				var queue = [],
					clickHandler = function() {
						var msg, result = true;
						queue.shift();
						if (queue.length) {
							msg = queue[0];
							while (queue.length && !msg) {
								queue.shift();
								msg = queue[0]
							}
							if (msg) {
								$(this).find("[data-role=message]").empty().append(msg.toString().replace(/\n/g, "<br/>"));
								result = false
							}
						}
						return result
					};
				return function(msg) {
					var modal;
					queue.push(msg);
					if (queue.length === 1 && (msg = queue[0])) {
						modal = app.modal || window.app && window.app.modal || function(option) {
							app.alert(option.content);
							clickHandler()
						};
						modal({
							title: "信息提示",
							btnCancel: "关闭",
							confirmHandler: clickHandler,
							cancelHandler: clickHandler,
							content: '<div class="aui-ide-modal-content"><i class="iconfont icon-round_warming"></i><p data-role="message">' + msg.toString().replace(/\n/g, "<br/>") + "</p></div>",
							isDialog: true,
							isLargeModal: false,
							init: function() {
								var $body = $(this);
								setTimeout(function() {
									$body.prev().find(".close").off().remove()
								}, 100)
							}
						})
					}
				}
			}(),
			addToQueue = function(args) {
				var i, item, id, result = false;
				if (id = args[2]) {
					for (i = -1; item = alertQueue[++i];) {
						if (result = item[2] === id) {
							break
						}
					}
				}
				if (!result) {
					alertQueue.push(args)
				}
			},
			delFormQueue = function() {
				return alertQueue.shift()
			},
			execAlert = function(msg, type, id) {
				var $item = null,
					args;
				type = type || SHOW_TYPE._DEFAULT;
				if (type === SHOW_TYPE.MESSAGE) {
					messageDialog(msg + "");
					console.info(msg)
				} else {
					msg += "";
					if ($alert.children().length < alertQueueLength) {
						if (!id || !$alert.children('[data-alert-id="' + id + '"]').length) {
							args = JSON.parse(JSON.stringify(arguments));
							if (!args[2]) {
								args[2] = "undefined"
							}
							alertList.push(args);
							type = SHOW_TYPE[type] || SHOW_TYPE.info;
							$item = $alert.append(alertCttTemp.replace(/_id_/, id).replace(/_showType_/, type).replace(/_content_/, msg).replace(/_title_/, msg)).children(":last");
							$item.attr("title", $item.text());
							setTimeout(function() {
								$item.addClass("out")
							}, 50 + Math.random() * 50);
							setTimeout(function() {
								if (!stopClose) {
									$item.removeClass("out");
									execNextAlert($item)
								}
							}, 1e4 + Math.random() * 1e3)
						}
					} else {
						addToQueue(arguments)
					}
				}
			},
			execNextAlert = function($lastElem) {
				setTimeout(function() {
					if ($lastElem) {
						$lastElem.remove();
						$lastElem = null;
						alertList.shift()
					}
					if (alertQueue.length) {
						execAlert.apply(this, delFormQueue())
					}
				}, 500)
			},
			alertFunc = function(msg, showType, id) {
				event && event.trigger("alert.app", arguments);
				if (msg instanceof Array) {
					for (var i = -1, alt; alt = msg[++i];) {
						if (alt instanceof Array) {
							execAlert(alt[0], alt[1], alt[2])
						} else {
							execAlert(alt, showType, id)
						}
					}
				} else {
					execAlert(msg, showType, id)
				}
			};
		if (!$alert.length) {
			$alert = $(alertCtnTemp);
			$alert.appendTo("body")
		}
		for (type in SHOW_TYPE) {
			if (SHOW_TYPE.hasOwnProperty(type)) {
				alertFunc[type] = SHOW_TYPE[type]
			}
		}
		alertFunc.closeAll = function() {
			alertQueue = [];
			alertList = [];
			$alert.empty()
		};
		alertFunc.close = function(option) {
			var id, item, len;
			if (!(option instanceof Object)) {
				console.error("入参必须为对象");
				return
			}
			id = option.id;
			if (id) {
				for (len = alertQueue.length; item = alertQueue[--len];) {
					if (item.length && ~Array.prototype.indexOf.call(item, id) || item) {
						alertQueue.splice(len, 1);
						break
					}
				}
				if ($alert.children("[data-alert-id=" + id + "]").length) {
					$("[data-alert-id=" + id + "]", $alert).remove()
				}
			} else {
				console.error("id的值不能为'undefined'")
			}
		};
		alertFunc.getAlertList = function() {
			return alertList.concat(alertQueue)
		};
		alertFunc.listener = function(callback) {
			!event && (event = app.dispatcher());
			event.on("alert.app", function() {
				callback && callback(arguments[1])
			})
		};
		window.alert = messageDialog;
		$alert.off().on("click", function(e) {
			var $e = $(e.target || window.event.srcElement),
				$ctt, role = $e.attr("data-role");
			switch (role) {
				case "close":
					$e.parent().removeClass("out");
					execNextAlert($e.parent());
					stopClose = false;
					break;
				case "more":
					$ctt = $e.siblings(".alert-content");
					if ($e.hasClass("more")) {
						stopClose = false;
						$ctt.removeClass("more")
					} else {
						stopClose = true;
						$ctt.addClass("more")
					}
					$e.toggleClass("more");
					break
			}
		});
		return alertFunc
	}();
	app.behavior = function() {
		var _b = function(input1, input2, condition, callback) {
			var _input2, result;
			input2 = decodeURIComponent(input2);
			_input2 = input2;
			try {
				input2 = JSON.parse(input2)
			} catch (e) {
				input2 = _input2
			}
			switch (condition) {
				case "lt":
					result = input1 < input2;
					break;
				case "eq":
					result = input1 === input2;
					break;
				case "gt":
					result = input1 > input2;
					break;
				case "not":
					result = input1 !== input2;
					break;
				case "includes":
				case "notIncludes":
					if (input2 instanceof Array) {
						result = $.inArray(input1, input2) !== -1
					} else if (input2 instanceof Object) {
						result = input1 in input2
					} else {
						result = input2 && input2.toString().indexOf(input1) !== -1
					}
					if (condition === "notIncludes") {
						result = !result
					}
					break;
				case "startsWith":
					result = input2 && input2.toString().indexOf(input1) === 0;
					break
			}
			callback && callback(result, input1, input2, condition)
		};
		_b.LESS_THAN = "lt";
		_b.EQUAL = "eq";
		_b.GREAT_THAN = "gt";
		_b.NOT = "not";
		_b.INCLUDES = "inclues";
		_b.NOT_INCLUDES = "notInclues";
		_b.STARTS_WITH = "startsWith";
		return _b
	}();
	app.deepClone = function(obj) {
		function _clone(obj) {
			var newObj;
			if (typeof obj === "string") {
				newObj = "" + obj
			} else if ($.isArray(obj)) {
				newObj = $.map(obj, function(elem) {
					return _clone(elem)
				})
			} else if (typeof obj === "object") {
				newObj = {};
				for (var name in obj) {
					if (obj[name] instanceof Function) {
						newObj[name] = obj[name]
					} else {
						newObj[name] = _clone(obj[name])
					}
				}
			} else {
				newObj = obj
			}
			return newObj
		}
		return _clone(obj)
	};
	app.eval = function(str) {
		var func;
		eval("func=" + str.replace("_parseFunction_", ""));
		return func
	};
	app.getUID = function() {
		var sId = "",
			i = 24;
		for (; i--;) {
			sId += Math.floor(Math.random() * 16).toString(16).toUpperCase();
			if (i == 4) {
				sId += "-"
			}
		}
		return sId
	};
	app.stringify = function(config) {
		function functionStringify(obj) {
			if (obj !== undefined && typeof obj === "object") {
				var newObj = obj instanceof Array ? [] : {},
					i = 0;
				for (var name in obj) {
					i++;
					if (obj[name] instanceof Function) {
						newObj[name] = "_parseFunction_" + obj[name].toString().replace(/(\/\/[^\n\r]+)/g, "").replace(/[\n\r\t]/g, "").replace(/(\s)+/g, " ").replace(/\\([ntrs\-\_])/g, "\\\\$1").replace(/(?:\/{2,}.*?[\r\n])|(?:\/\*.*?\*\/)/g, "")
					} else {
						newObj[name] = obj[name] && functionStringify(obj[name])
					}
				}
				if (!i) {
					newObj = obj
				}
				return newObj
			} else {
				return obj
			}
		}
		return config ? JSON.stringify(functionStringify(config)) : ""
	};
	app.parseJSObject = function(JSONString) {
		function parseFunc(obj) {
			for (var name in obj) {
				if (typeof obj[name] === "string") {
					if (obj[name].indexOf("_parseObject_") === 0) {
						obj[name] = JSON.parse(obj[name].replace(/_parseObject_/, ""))
					} else if (obj[name].indexOf("_parseFunction_") === 0) {
						obj[name] = eval("(" + obj[name].replace(/_parseFunction_/, "") + ")")
					}
				} else if (typeof obj[name] === "object") {
					obj[name] = parseFunc(obj[name])
				}
			}
			return obj
		}
		return JSONString ? parseFunc(JSON.parse(JSONString)) : null
	};
	app.position = function(event, $container, $content, fixTop, fixLeft) {
		return {
			top: Math.max(($container.height() > $content.height() + event.clientY ? event.clientY : event.clientY - $content.height()) - (fixTop || 0), 0),
			left: Math.max(($container.width() > $content.width() + event.clientX ? event.clientX : event.clientX - $content.width()) - (fixLeft || 0), 0)
		}
	};
	app.reset = function($form, auiCtx) {
		var $inputs = $("[id]", $form),
			i, item, domId, ins, variables = auiCtx && auiCtx.variables,
			$item, $checkedItem, $inputItem;
		if (variables && (i = $inputs.length)) {
			for (; item = $inputs[--i];) {
				ins = variables[item.id];
				if (ins && $.isFunction(ins.resetValue)) {
					ins.resetValue()
				}
			}
		} else if ($inputs.length) {
			for (i = -1; item = $inputs[++i];) {
				$item = $(":input,img,.text-div,.wangEditor-txt", item).not(":button, :submit, :reset,:disabled");
				$inputItem = $(":input", item).not(":radio,:checkbox");
				$checkedItem = $(":checked", item).not(":disabled");
				$inputItem.length && $inputItem.val("").removeAttr("selected");
				$checkedItem.length && $checkedItem.removeAttr("checked")
			}
		}
	};
	app.screen = function() {
		var full = {},
			resizeHandlerList = {},
			globalResizeHandlerList = {},
			resizeTimeout;

		function resize() {
			window.clearTimeout(resizeTimeout);
			resizeTimeout = window.setTimeout(function() {
				var uid, _app = window.app || app;
				for (uid in globalResizeHandlerList) {
					if (globalResizeHandlerList[uid].timeout) {
						window.setTimeout(globalResizeHandlerList[uid].callback, globalResizeHandlerList[uid].timeout)
					} else {
						globalResizeHandlerList[uid].callback && globalResizeHandlerList[uid].callback()
					}
				}
				_app.router && _app.router.getCurrentHandler && (uid = _app.router.getCurrentHandler()) && (uid = uid.uid);
				if (uid && (uid = resizeHandlerList[uid])) {
					if (uid.timeout) {
						window.setTimeout(uid.callback)
					} else {
						uid.callback && uid.callback()
					}
				}
				uid = null
			}, 100)
		}
		full.addResizeHandler = function(options) {
			if (options && options.uid && options.callback) {
				if (options.isGlobal) {
					globalResizeHandlerList[options.uid] = {
						callback: options.callback,
						timeout: options.timeout || 0
					}
				} else {
					resizeHandlerList[options.uid] = {
						callback: options.callback,
						timeout: options.timeout || 0
					}
				}
			}
		};
		full.removeResizeHandler = function(uid, isGlobal) {
			if (uid) {
				if (isGlobal) {
					globalResizeHandlerList[uid] = null;
					delete globalResizeHandlerList[uid]
				} else {
					resizeHandlerList[uid] = null;
					delete resizeHandlerList[uid]
				}
			}
		};
		full.triggerResizeHandler = function(uid, isGlobal) {
			if (uid) {
				if (isGlobal) {
					if (uid = globalResizeHandlerList[uid]) {
						uid.callback && uid.callback()
					}
				} else if (uid = resizeHandlerList[uid]) {
					uid.callback && uid.callback()
				}
			}
		};
		$(window).resize(resize);
		return full
	}();
	app.scrollTop = function($container, $content, speed, marginTop) {
		var cttOffset = $content.offset(),
			ctnOffset = $container.offset();
		if (ctnOffset && cttOffset) {
			marginTop = marginTop ? parseInt(marginTop) : 0;
			$container.animate({
				scrollTop: cttOffset.top + $container.scrollTop() - ctnOffset.top - marginTop
			}, speed || 200)
		}
	};
	app.hsla = function() {
		var css = function(opt, random) {
			var $elem = $("<div>"),
				targetCSS = "background-color",
				css;
			opt = $.extend(opt, this.defaltOptions);
			$elem.css(targetCSS, "hsl(" + [random ? Math.floor(Math.random() * 361) : opt.h, opt.s, opt.l].join(",") + ")");
			css = $elem.css(targetCSS).toString();
			if (jQuery.support.opacity) {
				return css.replace("rgb", "rgba").replace(")", "," + opt.a + ")")
			}
			return css
		};
		css._default = {
			h: Math.floor(Math.random() * 361),
			s: "50%",
			l: "50%",
			a: 1
		};
		return css
	}();
	app.shelter = function() {
		var Shelter = function() {
			var context = this;
			context.maskList = [];
			context.zIndexList = [];
			context._zIndexList = [];
			context.$mask = $(context.MASK_TEMP);
			context.$shelter = $(context.SHELTER_TEMP);
			context.$title = context.$shelter.children(".maskTitle");
			context.$alert = $("#alertList");
			$("body").append(context.$mask).append(context.$shelter);
			context.timeoutHandler = null;
			$(window).on({
				"keyup.shelter": function(e) {
					var key = e.which || window.event.keyCode;
					if (key === 27) {
						context.hideAll()
					}
				},
				"error.shelter": function(e) {
					context.hideAll()
				}
			})
		};
		Shelter.prototype = {
			SHELTER_TEMP: '<div id="shelter" class="mask hide"><div class="maskTitle"></div><div class="maskPic"></div></div>',
			MASK_TEMP: '<div id="mask" class="hide"/>',
			ALERT_INDEX: 15e3,
			ALERT_TOP: 5,
			MASK_INDEX: 1052,
			DEFAULT_TITLE: "请稍后…",
			DEFAULT_TIMEOUT: 6e4,
			show: function(title, timeout) {
				this.maskList.push(arguments);
				this._upper(true, this.ALERT_INDEX + 1);
				this._showShelter(title, timeout)
			},
			hide: function() {
				this._hide()
			},
			hideAll: function() {
				this.maskList = [];
				this._zIndexList = [];
				this._lower(true);
				this._display(false)
			},
			upperZIndex: function(alertZIndex, maskZIndex, alertTop) {
				this._upper(false, alertZIndex, maskZIndex, alertTop)
			},
			lowerZIndex: function() {
				this._lower()
			},
			_showShelter: function(title, timeout) {
				var context = this;
				this._setTitle(title);
				this._display(true);
				try {
					timeout = parseInt(timeout, 10) || this.DEFAULT_TIMEOUT
				} catch (e) {
					timeout = this.DEFAULT_TIMEOUT
				} finally {
					clearTimeout(this.timeoutHandler);
					this.timeoutHandler = setTimeout(function() {
						context._hide()
					}, timeout)
				}
			},
			_hide: function() {
				var maskList = this.maskList,
					args;
				maskList.pop();
				this._lower(true);
				if (maskList.length) {
					args = maskList[maskList.length - 1];
					this._showShelter.apply(this, args)
				} else {
					this._display(false)
				}
			},
			_setTitle: function(title) {
				this.$title.empty().append(title || this.DEFAULT_TITLE)
			},
			_display: function(display) {
				if (!!display) {
					this.$shelter.removeClass("hide")
				} else {
					this.$shelter.addClass("hide")
				}
			},
			_upper: function(inner, alertZIndex, maskZIndex, alertTop) {
				var $mask = inner ? this.$shelter : this.$mask,
					$alert = this.$alert,
					zIndexList = inner ? this._zIndexList : this.zIndexList;
				alertZIndex = alertZIndex === false ? "" : alertZIndex && parseInt(alertZIndex, 10) || this.ALERT_INDEX;
				maskZIndex = maskZIndex && parseInt(maskZIndex, 10) || this.MASK_INDEX;
				zIndexList.push({
					alertZIndex: this.ALERT_INDEX,
					maskZIndex: $mask.css("zIndex")
				});
				if (maskZIndex !== -1) {
					$mask.addClass("mask").css({
						"z-index": maskZIndex
					})
				}
				$alert.css({
					"z-index": alertZIndex,
					top: alertTop === false ? "" : alertTop || this.ALERT_TOP
				})
			},
			_lower: function(inner) {
				var $mask = inner ? this.$shelter : this.$mask,
					$alert = this.$alert,
					zIndexList = inner ? this._zIndexList : this.zIndexList,
					lastZIndex = zIndexList.length ? zIndexList.pop() : {
						maskZIndex: this.MASK_INDEX,
						alertZIndex: this.ALERT_INDEX
					};
				if (!parseInt(lastZIndex.maskZIndex, 10)) {
					$mask.removeClass("mask");
					$alert.css("top", "")
				}
				$mask.css("z-index", lastZIndex.maskZIndex || "");
				$alert.css("z-index", lastZIndex.alertZIndex || "")
			}
		};
		return new Shelter
	}();
	app.collapse = function() {
		if (!($ && $.fn && $.fn.collapse)) {
			! function($) {
				"use strict";
				var Collapse = function(element, options) {
					this.$element = $(element);
					this.options = $.extend({}, $.fn.collapse.defaults, options);
					if (this.options.parent) {
						this.$parent = $(this.options.parent)
					} else {
						var parentID = this.$element.attr("data-parent");
						if (parentID) {
							this.$parent = this.$element.closest(parentID);
							if (!this.$parent.length) {
								this.$parent = undefined
							}
						}
					}
					this.options.toggle && this.toggle()
				};
				Collapse.prototype = {
					constructor: Collapse,
					dimension: function() {
						var hasWidth = this.$element.hasClass("width");
						return hasWidth ? "width" : "height"
					},
					show: function() {
						var dimension, scroll, actives, hasData;
						if (this.transitioning || this.$element.hasClass("in")) return;
						dimension = this.dimension();
						scroll = $.camelCase(["scroll", dimension].join("-"));
						if (this.$parent && !this.$parent.hasClass("aui-aside-menu-ctn")) {
							actives = this.$parent && this.$parent.find(".aui-accordion-group > .in");
							if (actives && actives.length) {
								hasData = actives.data("collapse");
								if (hasData && hasData.transitioning) return;
								actives.collapse("hide");
								actives.prev().children("a").addClass("collapsed");
								hasData || actives.data("collapse", null)
							}
						}
						this.$element[dimension](0);
						this.transition("addClass", $.Event("show"), "shown");
						$.support.transition && this.$element[dimension](this.$element[0][scroll])
					},
					hide: function() {
						var dimension;
						if (this.transitioning || !this.$element.hasClass("in")) return;
						dimension = this.dimension();
						this.reset(this.$element[dimension]());
						this.transition("removeClass", $.Event("hide"), "hidden");
						this.$element[dimension](0)
					},
					reset: function(size) {
						var dimension = this.dimension();
						this.$element.removeClass("collapse")[dimension](size || "auto")[0].offsetWidth;
						this.$element[size !== null ? "addClass" : "removeClass"]("collapse");
						var $aside;
						if (($aside = this.$element.closest("#auiAside")).length) {
							$aside = $aside.find(".aside-menu:first");
							app && app.scrollTop($aside, this.$element, 500, this.$element.prev().height())
						}
						return this
					},
					transition: function(method, startEvent, completeEvent) {
						var that = this,
							complete = function() {
								if (startEvent.type == "show") that.reset();
								that.transitioning = 0;
								that.$element.trigger(completeEvent)
							};
						this.$element.trigger(startEvent);
						if (startEvent.isDefaultPrevented()) return;
						this.transitioning = 1;
						this.$element[method]("in");
						$.support.transition && this.$element.hasClass("collapse") ? this.$element.one($.support.transition.end, complete) : complete()
					},
					toggle: function() {
						this[this.$element.hasClass("in") ? "hide" : "show"]()
					}
				};
				var old = $.fn.collapse;
				$.fn.collapse = function(option) {
					return this.each(function() {
						var $this = $(this),
							data = $this.data("collapse"),
							options = $.extend({}, $.fn.collapse.defaults, $this.data(), typeof option == "object" && option);
						if (!data) $this.data("collapse", data = new Collapse(this, options));
						if (typeof option == "string") data[option]()
					})
				};
				$.fn.collapse.defaults = {
					toggle: true
				};
				$.fn.collapse.Constructor = Collapse;
				$.fn.collapse.noConflict = function() {
					$.fn.collapse = old;
					return this
				};
				$(document).on("click.collapse.data-api", "[data-toggle=collapse]", function(e) {
					var $this = $(this),
						href, target = $this.attr("data-target") || e.preventDefault() || (href = $this.attr("href")) && href.replace(/.*(?=#[^\s]+$)/, ""),
						option = $(target).data("collapse") ? "toggle" : $this.data();
					$this[$(target).hasClass("in") ? "addClass" : "removeClass"]("collapsed");
					$(target).collapse(option)
				})
			}(window.jQuery)
		}
	}();
	app.modal = function() {
		var setModalLgSize, modal;
		! function($) {
			"use strict";
			var Modal = function(element, options) {
					this.options = options;
					this.$element = $(element).delegate('[data-dismiss="modal"]', "click.dismiss.modal", $.proxy(this.hide, this));
					this.options.remote && this.$element.find(".modal-body").load(this.options.remote)
				},
				$window = $(window);
			Modal.prototype = {
				constructor: Modal,
				toggle: function() {
					return this[!this.isShown ? "show" : "hide"]()
				},
				show: function() {
					app.shelter.upperZIndex();
					var that = this,
						e = $.Event("show"),
						options = this.options,
						$modal = this.$element,
						modalUUID, resizeHandler, theme;
					this.$element.trigger(e);
					this.$element.removeClass("hide");
					if (this.isShown || e.isDefaultPrevented()) return;
					this.isShown = true;
					this.escape();
					this.backdrop(function() {
						var transition = $.support.transition && that.$element.hasClass("fade");
						if (!that.$element.parent().length) {
							that.$element.appendTo(document.body)
						}
						that.$element.show();
						if (transition) {
							that.$element[0].offsetWidth
						}
						that.$element.addClass("in").attr("aria-hidden", false);
						that.enforceFocus();
						transition ? that.$element.one($.support.transition.end, function() {
							that.$element.focus().trigger("shown")
						}) : that.$element.focus().trigger("shown")
					});
					if (options.noFooter) {
						$modal.children(".modal-footer").remove()
					}
					if (options.isLargeModal && (options.width || options.height)) {
						$modal.addClass("modal-lg");
						modalUUID = app.getUID();
						resizeHandler = function() {
							var modalHeight, modalWidth, windowHeight, windowWidth, modalCss = {},
								modalBodyCss, modalBodyHeight;
							if (options.width) {
								windowWidth = $window.width();
								if (options.width.indexOf("%") !== -1) {
									modalWidth = (parseInt(options.width, 10) / 100 || .8) * windowWidth
								} else {
									modalWidth = parseInt(options.width, 10) || windowWidth * .8
								}
								modalWidth = Math.min(modalWidth, windowWidth);
								modalWidth = Math.max(modalWidth, 0);
								modalCss.width = modalWidth;
								modalCss.left = windowWidth - modalWidth !== 0 ? Math.max(0, (windowWidth - modalWidth) / 2) : 0;
								modalCss.marginLeft = 0
							}
							if (options.height) {
								windowHeight = $window.height();
								if (options.height.indexOf("%") !== -1) {
									modalHeight = (parseInt(options.height, 10) / 100 || .7) * windowHeight
								} else {
									modalHeight = parseInt(options.height, 10) || windowHeight * .7
								}
								modalHeight = Math.min(modalHeight, windowHeight);
								modalBodyHeight = modalHeight - $modal.children(".modal-footer").height() * 3 - 10;
								modalCss.height = modalBodyHeight;
								modalCss.marginTop = 0;
								setTimeout(function() {
									$modal.css("top", windowHeight - modalHeight !== 0 ? (windowHeight - modalHeight) / 3 : 0)
								}, 300);
								modalBodyCss = {
									maxHeight: modalBodyHeight,
									minHeight: modalBodyHeight
								}
							}
							if (options.noHeader) {
								$modal.find(".modal-header>h4").text("")
							}
							if (options.noFooter) {
								modalCss.paddingBottom = ".8em"
							}
							$modal.css(modalCss);
							if (modalBodyCss) {
								$modal.children(".modal-body").css(modalBodyCss)
							}
						};
						$window.on("resize." + modalUUID, resizeHandler);
						resizeHandler();
						this.uuid = modalUUID;
						this.resizeHandler = resizeHandler
					}
					if (theme = window.$AW && window.$AW.ctn && window.$AW.ctn.modalCtn && $AW.ctn.modalCtn.theme) {
						theme(this.$element)
					}
				},
				hide: function(e) {
					app.shelter.lowerZIndex();
					e && e.preventDefault();
					var that = this;
					this.$element.css({
						top: ""
					});
					e = $.Event("hide");
					this.$element.trigger(e);
					if (this.uuid) {
						$window.off("resize." + this.uuid);
						this.resizeHandler = null
					}
					if (!this.isShown || e.isDefaultPrevented()) return;
					this.isShown = false;
					this.escape();
					$(document).off("focusin.modal");
					this.$element.removeClass("in").attr("aria-hidden", true);
					$.support.transition && this.$element.hasClass("fade") ? this.hideWithTransition() : this.hideModal()
				},
				enforceFocus: function() {},
				escape: function() {
					var that = this;
					if (this.isShown && this.options.keyboard) {
						this.$element.on("keyup.dismiss.modal", function(e) {
							e.which == 27 && that.hide()
						})
					} else if (!this.isShown) {
						this.$element.off("keyup.dismiss.modal")
					}
				},
				hideWithTransition: function() {
					var that = this,
						timeout = setTimeout(function() {
							that.$element.off($.support.transition.end);
							that.hideModal()
						}, 500);
					this.$element.one($.support.transition.end, function() {
						clearTimeout(timeout);
						that.hideModal()
					})
				},
				hideModal: function() {
					var that = this;
					this.$element.hide();
					this.backdrop(function() {
						that.removeBackdrop();
						that.$element.trigger("hidden")
					})
				},
				removeBackdrop: function() {
					this.$backdrop && this.$backdrop.remove();
					this.$backdrop = null
				},
				backdrop: function(callback) {
					var that = this,
						animate = this.$element.hasClass("fade") ? "fade" : "";
					if (this.isShown && this.options.backdrop) {
						var doAnimate = $.support.transition && animate;
						this.$backdrop = $('<div class="modal-backdrop ' + animate + '" />').appendTo(document.body);
						this.$backdrop.click(this.options.backdrop == "static" ? $.proxy(this.$element[0].focus, this.$element[0]) : $.proxy(this.hide, this));
						if (doAnimate) this.$backdrop[0].offsetWidth;
						this.$backdrop.addClass("in");
						if (!callback) return;
						doAnimate ? this.$backdrop.one($.support.transition.end, callback) : callback()
					} else if (!this.isShown && this.$backdrop) {
						this.$backdrop.removeClass("in");
						$.support.transition && this.$element.hasClass("fade") ? this.$backdrop.one($.support.transition.end, callback) : callback()
					} else if (callback) {
						callback()
					}
				}
			};
			var old = $.fn.modal;
			$.fn.modal = function(option) {
				return this.each(function() {
					var $this = $(this),
						data = $this.data("modal"),
						options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == "object" && option);
					if (!data) $this.data("modal", data = new Modal(this, options));
					if (typeof option == "string") data[option]();
					else if (options.show) data.show()
				})
			};
			$.fn.modal.defaults = {
				backdrop: true,
				keyboard: true,
				show: true
			};
			$.fn.modal.Constructor = Modal;
			$.fn.modal.noConflict = function() {
				$.fn.modal = old;
				return this
			};
			$(document).on("click.modal.data-api", '[data-toggle="modal"]', function(e) {
				var $this = $(this),
					href = $this.attr("href"),
					$target = $($this.attr("data-target") || href && href.replace(/.*(?=#[^\s]+$)/, "")),
					option = $target.data("modal") ? "toggle" : $.extend({
						remote: !/#/.test(href) && href
					}, $target.data(), $this.data());
				e.preventDefault();
				$target.modal(option).one("hide", function() {
					$this.focus()
				})
			})
		}(window.jQuery);
		modal = function() {
			var $body = $("body");
			var modalFooterTemp = '<div class="modal-footer">' + '<button type="button" data-role="confirm" class="btn btn-focus">_positive_</button>' + '<button type="button" data-role="ignore" class="btn btn-custom">_ignore_</button>' + '<button type="button" data-role="cancel" class="btn btn-normal">_negative_</button>' + "</div>",
				modalTemp = '<div class="modal hide fade">' + '<div class="modal-header"><h4>_title_</h4></div>' + '<div class="modal-body">_content_</div>' + modalFooterTemp + "</div>";
			var MODAL_LANG = {
					TITLE: "弹窗",
					CONTENT: "弹窗内容"
				},
				COMMON_LANG = {
					CONFIRM: "确定",
					CANCEL: "取消"
				},
				_default = {
					title: MODAL_LANG.TITLE,
					content: MODAL_LANG.CONTENT,
					btnConfirm: COMMON_LANG.CONFIRM,
					btnCancel: COMMON_LANG.CANCEL,
					btnIgnore: null,
					init: null,
					confirmHandler: function() {},
					cancelHandler: function() {},
					ignoreHandler: null,
					args: [],
					isLargeModal: true,
					height: "80%",
					width: "80%",
					isDialog: true,
					backdrop: "static",
					noFooter: false,
					noHeader: false
				};

			function modal(options) {
				var $modal, $header, $close, $full, html, context;
				options = $.extend({}, _default, options);
				if ($.isFunction(options.content)) {
					$modal = options.content();
					if (options.reset) {
						app.reset($modal)
					}
				} else {
					html = modalTemp.replace(/_title_/, options.title).replace(/_content_/, $.isFunction(options.content) ? "_content_" : options.content).replace(/_positive_/, options.btnConfirm).replace(/_ignore_/, options.btnIgnore).replace(/_negative_/, options.btnCancel);
					$modal = $(html);
					if (!options.btnIgnore || !options.ignoreHandler) {
						$modal.find('[data-role="ignore"]').remove()
					}
					if (options.isLargeModal) $modal.addClass("modal-lg");
					if (!options.isDialog) $modal.addClass("modal-config-mode");
					$modal.appendTo($body)
				}
				$modal.find('[data-role="confirm"]')[options.btnConfirm === false || options.btnConfirm === "false" ? "addClass" : "removeClass"]("hide");
				$modal.find('[data-role="cancel"]')[options.btnCancel === false || options.btnCancel === "false" ? "addClass" : "removeClass"]("hide");
				context = $modal.children(".modal-body").get(0);
				if ($.isFunction(options.init)) {
					options.init.apply(context, options.args)
				}
				$header = $modal.children(".modal-header");
				if ($header.length && !$header.find(".close").length) {
					$close = $('<button title="关闭" type="button" class="close alert-close">&times;</button>');
					$header.prepend($close);
					$close.on("click.aweb4ModalCtn", function() {
						var $modal = $(this).parent().parent(".modal");
						if ($modal.length) {
							$modal.modal("hide")
						}
					})
				}
				if (options.isLargeModal && $header.length && !$header.find(".full").length) {
					$full = $('<button title="全屏切换" type="button" class="full fa fa-expand"></button>');
					$header.prepend($full);
					$full.on("click.aweb4ModalCtn", function() {
						var $modal = $(this).parent().parent(".modal");
						if ($modal.length) {
							$modal.toggleClass("full");
							$full.toggleClass("fa-compress")
						}
					})
				}
				try {
					$modal.modal({
						backdrop: options.backdrop,
						keyboard: false,
						show: true,
						isLargeModal: options.isLargeModal,
						height: options.height,
						width: options.width,
						noFooter: options.noFooter,
						noHeader: options.noHeader
					})
				} catch (e) {}
				if (options.backdrop) {
					$modal.before('<div class="mask" style="z-index:' + parseInt($modal.css("zIndex") || 1052, 10) + '"/>')
				}
				if (!$modal.attr("data-wrap")) {
					$modal.one("hidden", function() {
						if (options.backdrop) {
							$modal.prev(".modal-backdrop").remove();
							$modal.prev(".mask").remove()
						}
						$modal.off("click", "button").remove();
						$modal = null
					});
					if (!options.noFooter) {
						$modal.on("click", ".modal-footer>button", function(e) {
							var _$modal = $(e.target || event.srcElement).closest(".modal");
							if (_$modal.is($modal)) {
								var handler, result;
								switch ($(this).attr("data-role")) {
									case "confirm":
										handler = options.confirmHandler;
										break;
									case "ignore":
										handler = options.ignoreHandler;
										break;
									default:
										handler = options.cancelHandler
								}
								result = handler && handler.apply(context, options.args);
								if (result !== false) {
									_$modal && _$modal.modal("hide")
								}
								return false
							}
						})
					}
				} else {
					$modal.one("hidden", function() {
						if (options.backdrop) {
							$modal.prev(".mask").remove()
						}
						$modal = null;
						return false
					})
				}
			}
			modal.warp = function($modalBody, options) {
				var $modal;
				options = $.extend({}, _default, options);
				$modalBody.wrap('<div data-wrap="true" class="modal hide fade" style="position: fixed"></div>');
				$modal = $modalBody.parent().attr("id", $modalBody.attr("id"));
				$modal.addClass($modalBody.attr("class"));
				$modalBody.removeAttr("id class").addClass("modal-body");
				$modal.prepend('<div class="modal-header"><h4>' + options.title + "</h4></div>");
				$modal.append(modalFooterTemp.replace(/_positive_/, options.btnConfirm).replace(/_ignore_/, options.btnIgnore).replace(/_negative_/, options.btnCancel));
				if (!options.btnIgnore) {
					$modal.find('[data-role="ignore"]').remove()
				}
				$modal.find('[data-role="confirm"]')[options.btnCancel === false || options.btnCancel === "false" ? "addClass" : "removeClass"]("hide");
				$modal.find('[data-role="cancel"]')[options.btnCancel === false || options.btnCancel === "false" ? "addClass" : "removeClass"]("hide");
				if (options.isLargeModal) $modal.addClass("modal-lg");
				if (!options.isDialog) $modal.addClass("modal-config-mode");
				$modal = null
			};
			return modal
		}();
		setModalLgSize = function() {
			var $modalStyle, $window = $(window),
				paddingStr = "padding:45px 0 80px;",
				headerStr = ".modal-lg>.modal-header{position:absolute;top:0;left:0;right:0;height:21px;overflow:hidden;}",
				footerStr = ".modal-lg>.modal-footer{position:absolute;bottom:18px;left:0;right:2px;height:32px;overflow:hidden;}";
			return function() {
				var modal = {},
					modalStyle, modalBodyHeight, maxHeight, windowHeight = $window.height();
				modal.h = windowHeight * .7;
				modal.w = $window.width() * .8;
				modal.l = -(modal.w * .5);
				modal.t = -(modal.h * .5);
				modalStyle = "width:" + modal.w + "px ;" + "height:" + modal.h + "px;" + "margin-left:" + modal.l + "px ;" + "margin-top:" + modal.t + "px ;" + "left:50%;top:-100%;" + paddingStr;
				maxHeight = modal.h - 10;
				modalBodyHeight = "max-height:" + maxHeight + "px;min-height:" + maxHeight + "px;padding:5px;";
				if ($modalStyle) {
					$modalStyle.remove()
				}
				$modalStyle = $('<style type="text/css">' + (".modal-lg.fade{" + modalStyle + "}" + ".modal-lg .modal-body{" + modalBodyHeight + "}" + headerStr + footerStr + ".modal-lg.fade.in{top:" + (windowHeight - modal.h !== 0 ? (windowHeight - modal.h) / 3 : 0) + "px;}") + "</style>");
				$modalStyle.appendTo("body")
			}
		}();
		app.screen.addResizeHandler({
			isGlobal: true,
			callback: setModalLgSize,
			uid: app.getUID()
		});
		setModalLgSize();
		return modal
	}();
	app.select = function(options, undefined) {
		var _default = $.extend(true, {
				context: undefined,
				button: undefined,
				container: undefined,
				checkbox: "checkbox",
				isDataTable: false,
				isSelectChildren: false,
				operationButtons: null,
				setNodeMethod: function(list, elem) {
					list[elem.id] = {
						node: elem,
						status: $(elem).attr("data-status")
					};
					return list
				},
				getIdMethod: function(elem) {
					return elem.id
				},
				getStatusMethod: null
			}, options),
			__list = {},
			__checkboxSelector = _default.checkbox,
			__isDataTable = _default.isDataTable,
			__isBCheckState = _default.bCheckState,
			__isSelectChildren = _default.isSelectChildren,
			__operationButtons = _default.operationButtons,
			__allCheck = "",
			__allData = _default.allData,
			__$context = $(_default.context),
			__$ctn = $(_default.container, __$context),
			__$btn = $(_default.button, __$context),
			_setNode = _default.setNodeMethod,
			_getId = _default.getIdMethod,
			_getStatus = _default.getStatusMethod,
			_removeNode = function(list, elem) {
				var id = _getId(elem);
				list[id] = null;
				delete list[id]
			},
			_selectChangeFunc = function() {
				if (__allCheck === "allcheck") {
					$.each(__list, function(index, item) {
						$("#" + index, __$ctn).prop("checked", true)
					})
				} else if (__allCheck === "unAllcheck") {
					_clear()
				} else {
					$.each(__list, function(index, item) {
						$("#" + index, __$ctn).prop("checked", true)
					})
				}
			},
			_searchChangeFunc = function() {
				var i;
				if (__allCheck === "allcheck") {
					if (__allData[0]) {
						for (i = 0; i < __allData.length; i++) {
							_setNode(__list, $(__allData[i][0]).children(0)[0])
						}
					}
				}
				$.each(__list, function(index, item) {
					$("#" + index, __$ctn).prop("checked", true)
				})
			},
			_updateStyle = function() {
				var $checkbox = $(__checkboxSelector, __$ctn),
					checkedLength = $checkbox.filter(":checked").length,
					enableButton, checkLen = 0;
				if (!__isBCheckState) {
					switch (checkedLength) {
						case 0:
							__$btn.prop("indeterminate", false).removeAttr("checked").removeClass("tables-indeterminate");
							break;
						case $checkbox.length:
							__$btn.prop("indeterminate", false).attr("checked", "checked").removeClass("tables-indeterminate");
							break;
						default:
							__$btn.prop("indeterminate", true).removeAttr("checked").addClass("tables-indeterminate")
					}
				} else {
					$.each(__list, function() {
						checkLen++
					});
					switch (checkLen) {
						case 0:
							__$btn.prop("indeterminate", false).removeAttr("checked").prop("checked", false).removeClass("tables-indeterminate");
							break;
						case __allData.length:
							__$btn.prop("indeterminate", false).attr("checked", "checked").prop("checked", true).removeClass("tables-indeterminate");
							break;
						default:
							__$btn.prop("indeterminate", true).removeAttr("checked").addClass("tables-indeterminate")
					}
				}
				if (__operationButtons && __operationButtons.list && __operationButtons.status) {
					$(__operationButtons.list, __$context).attr("disabled", "disabled");
					if (checkedLength) {
						if (enableButton = __operationButtons.status[_getStatus(__list, _default)]) {
							enableButton = enableButton[checkedLength === 1 ? 0 : 1];
							if (enableButton) {
								$(enableButton, __$context).removeAttr("disabled")
							}
						}
					}
				}
			},
			_children = function(elem, checked) {
				var $elem = $(elem),
					execMethod = checked ? "attr" : "removeAttr";
				if (!checked) $elem.removeAttr("checked");
				$('[data-prefix^="' + $elem.attr("data-prefix") + '"]', __$ctn).not($elem)[execMethod]("disabled", "disabled")[execMethod]("checked", "checked")
			},
			_clear = function() {
				__$btn.removeAttr("checked");
				$(__checkboxSelector, __$context).removeAttr("checked");
				for (var p in __list) {
					__list[p] = null;
					delete __list[p]
				}
				__allCheck = "unAllcheck";
				__list = {};
				_updateStyle()
			};
		if (__operationButtons && __operationButtons.list) {
			$(__operationButtons.list, __$context).attr("disabled", "disabled")
		}
		__$btn.off(".appSelect").on("click.appSelect", function() {
			var checked = this.checked,
				checkedMethod = !checked ? "removeAttr" : "attr",
				execMethod = checked ? _setNode : _removeNode,
				i;
			if (__$btn.is(":checkbox") || __$btn.is(":radio") && !checked) {
				if (__isSelectChildren) {
					$(__checkboxSelector, __$ctn)[checkedMethod]("checked", "checked").each(function() {
						execMethod(__list, this);
						_children(this, checked)
					})
				} else {
					if (__isBCheckState) {
						if (__allCheck === "allcheck") {
							__allCheck = "unAllcheck";
							$.each(__list, function(index, item) {
								$("#" + index, __$ctn).prop("checked", true)
							});
							_clear()
						} else {
							__allCheck = "allcheck";
							if (__allData[0]) {
								for (i = 0; i < __allData.length; i++) {
									_setNode(__list, $(__allData[i][0]).children(0)[0])
								}
							}
							$.each(__list, function(index, item) {
								$("#" + index, __$ctn).prop("checked", true)
							})
						}
					} else {
						$(__checkboxSelector, __$ctn)[checkedMethod]("checked", "checked").each(function() {
							execMethod(__list, this)
						})
					}
				}
			}
			_updateStyle()
		});
		__$ctn.off(".appSelect").on("click.appSelect", function(ev) {
			var e = ev.target || window.event.srcElement,
				$e = $(e),
				checkLen = 0,
				timer = null;
			if ($e.is(_default.checkbox) && !ev.isTrigger) {
				if ($e.is(":radio")) {
					_clear();
					$e.attr("checked", true);
					_setNode(__list, e)
				} else {
					e.checked ? _setNode(__list, e) : _removeNode(__list, e);
					if (__isBCheckState) {
						$.each(__list, function(index, item) {
							checkLen++;
							$("#" + index, __$ctn).prop("checked", true)
						});
						if ($.isEmptyObject(__list)) {
							__allCheck = "unAllcheck"
						} else if (checkLen === __allData.length) {
							__allCheck = "allcheck"
						} else {
							__allCheck = "indeterminate"
						}
					}
				}
				if (__isSelectChildren) {
					_children(e, e.checked)
				}
				_updateStyle()
			}
		});
		if (__isDataTable) {
			$(".dataTables_paginate", __$context).click(function(e) {
				var $e = $(e.target || window.event.srcElement),
					checked, checkedMethod, item;
				if (__$btn[0]) {
					checked = __$btn[0].checked
				}
				checkedMethod = !checked ? "removeAttr" : "attr";
				$(".paginate_button.current").attr("data-dt-idx");
				if ($e.hasClass("paginate_button") || $e.parent().hasClass("paginate_button")) {
					if (!__isBCheckState) {
						_clear()
					}
					if (__allCheck === "allcheck") {
						$(__checkboxSelector, __$ctn)[checkedMethod]("checked", "checked").each(function() {
							_setNode(__list, this)
						});
						$.each(__list, function(index, item) {
							$("#" + index, __$ctn).prop("checked", true)
						})
					} else if (__allCheck === "unAllcheck") {
						for (item in __list) {
							$("#" + item, __$ctn).removeAttr("checked")
						}
						_clear()
					} else {
						for (item in __list) {
							$("#" + item, __$ctn).attr("checked", "checked").prop("checked", true)
						}
					}
					_updateStyle()
				}
			});
			if (!__isBCheckState) {
				$(".dataTables_filter", __$context).find(":input").keyup(_clear);
				$(".dataTables_length", __$context).find("select").change(_clear)
			} else {
				$(".dataTables_filter", __$context).find(":input").keyup(_searchChangeFunc);
				$(".dataTables_length", __$context).find("select").change(_selectChangeFunc)
			}
		}
		return {
			nodes: function() {
				return $.extend(true, {}, __list)
			},
			check: function(list) {
				var $e, e, $input = $('<input type = "checkbox"/>'),
					firstPage = 0;
				_clear();
				__allCheck = "";
				$.each(list, function(index, value) {
					$e = $("#" + value, __$ctn);
					$input.attr("id", value);
					firstPage++;
					if ($e.length && $e.is(_default.checkbox)) {
						e = $e[0];
						e.checked = true;
						if (!$(".dataTables_length", __$context).length || firstPage <= parseInt($(".dataTables_length", __$context).find("select").val())) {
							_setNode(__list, e)
						}
						if (__isSelectChildren) {
							_children(e, e.checked)
						}
					} else {
						$input.attr("id", value).attr("checked", "checked");
						_setNode(__list, $input[0]);
						if (__isSelectChildren) {
							_children(e, e.checked)
						}
					}
				});
				_updateStyle()
			},
			list: function(empty) {
				var list = [],
					p;
				for (p in __list) {
					list.push(p)
				}
				if (empty) {
                _clear();
            }
				return list
			},
			clear: _clear,
			size: function() {
				var size = 0,
					p;
				for (p in __list) size++;
				return size
			},
			dispose: function() {
				this.list(true);
				for (var p in _default) {
					_default[p] = null;
					delete _default[p]
				}
				if (__isDataTable) {
					$(".dataTables_paginate", __$context).off();
					$(".dataTables_filter", __$context).find(":input").off();
					$(".dataTables_length", __$context).find("select").off()
				}
				__$btn.off(), __$btn = null;
				__$ctn.off(), __$ctn = null;
				__$context = null
			}
		}
	};
	app.dispatcher = function(timeout) {
		var Event = function(timeout) {
			this.timeout = timeout;
			this.cache = {};
			this.delayHandler = {}
		};
		Event.prototype = {
			constructor: Event,
			on: function() {
				var context, method = {
					1: function(obj) {
						var k, v, p;
						for (k in obj) {
							if (obj.hasOwnProperty(k)) {
								v = obj[k];
								p = k.split(".");
								method["3"](p[0], p.slice(1, p.length).join("."), v)
							}
						}
					},
					2: function(type, callback) {
						var types = type.split(","),
							i, p;
						for (i = types.length; type = types[--i];) {
							p = type.split(".");
							method["3"](p[0], p.slice(1, p.length).join("."), callback)
						}
					},
					3: function(type, namespace, callback) {
						var event;
						event = context.cache[type] || (context.cache[type] = []);
						namespace = namespace || "";
						if ($.isFunction(callback)) {
							event.push({
								callback: callback,
								namespace: namespace || ""
							})
						}
					}
				};
				return function() {
					context = this;
					method[arguments.length].apply(this, arguments)
				}
			}(),
			off: function(type) {
				var types, p, i, namespace, events, j, event;
				if (type) {
					types = type.split(",");
					for (i = types.length; type = types[--i];) {
						p = type.split(".");
						namespace = p.slice(1, p.length).join(".") || "";
						type = p[0];
						if (namespace) {
							events = this.cache[type];
							for (j = events.length; event = events[--j];) {
								if (event.namespace.indexOf(namespace) !== -1) {
									events.splice(j, 1);
									break
								}
							}
						} else {
							delete this.cache[type]
						}
					}
				} else {
					this.cache = {}
				}
			},
			dispatchEvent: function(type) {
				var types, i, props, namespaces, namespace, k, matchNamespace, events, event, j, args = arguments;
				if (type) {
					types = type.split(",");
					for (i = types.length; type = types[--i];) {
						props = type.split(".");
						namespaces = props.slice(1, props.length) || [];
						type = props[0];
						events = this.cache[type] || [];
						if (namespaces.length) {
							for (j = events.length; event = events[--j];) {
								matchNamespace = true;
								for (k = namespaces.length; namespace = namespaces[--k];) {
									if (event.namespace.indexOf(namespaces) === -1) {
										matchNamespace = false;
										break
									}
								}
								if (matchNamespace) {
									event.callback.apply(event, args)
								}
							}
						} else {
							for (j = events.length; event = events[--j];) {
								event.callback.apply(event, args)
							}
						}
					}
				}
			},
			trigger: function(type) {
				var context = this,
					args = arguments;
				if (this.timeout) {
					window.clearTimeout(this.delayHandler[type]);
					this.delayHandler[type] = window.setTimeout(function() {
						context.dispatchEvent.apply(context, args)
					}, this.timeout)
				} else {
					context.dispatchEvent.apply(context, args)
				}
			}
		};
		return function(timeout) {
			return new Event(timeout)
		}
	}();
	app.popover = function() {
		var popover; + function($) {
			"use strict";
			var Tooltip = function(element, options) {
				this.type = null;
				this.options = null;
				this.enabled = null;
				this.timeout = null;
				this.hoverState = null;
				this.$element = null;
				this.inState = null;
				this.init("tooltip", element, options)
			};
			var $window = $(window);
			Tooltip.VERSION = "3.3.7";
			Tooltip.TRANSITION_DURATION = 150;
			Tooltip.DEFAULTS = {
				animation: true,
				placement: "top",
				selector: false,
				template: '<div class="tooltip" role="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>',
				trigger: "hover focus",
				title: "",
				delay: 0,
				html: false,
				container: false,
				viewport: {
					selector: "body",
					padding: 0
				}
			};
			Tooltip.prototype.init = function(type, element, options) {
				this.enabled = true;
				this.type = type;
				this.$element = $(element);
				this.options = this.getOptions(options);
				this.$viewport = this.options.viewport && $($.isFunction(this.options.viewport) ? this.options.viewport.call(this, this.$element) : this.options.viewport.selector || this.options.viewport);
				this.inState = {
					click: false,
					hover: false,
					focus: false
				};
				if (this.$element[0] instanceof document.constructor && !this.options.selector) {
					throw new Error("`selector` option must be specified when initializing " + this.type + " on the window.document object!")
				}
				var triggers = this.options.trigger.split(" ");
				for (var i = triggers.length; i--;) {
					var trigger = triggers[i];
					if (trigger == "click") {
						this.$element.on("click." + this.type, this.options.selector, $.proxy(this.toggle, this))
					} else if (trigger != "manual") {
						var eventIn = trigger == "hover" ? "mouseenter" : "focusin";
						var eventOut = trigger == "hover" ? "mouseleave" : "focusout";
						this.$element.on(eventIn + "." + this.type, this.options.selector, $.proxy(this.enter, this));
						this.$element.on(eventOut + "." + this.type, this.options.selector, $.proxy(this.leave, this))
					}
				}
				this.options.selector ? this._options = $.extend({}, this.options, {
					trigger: "manual",
					selector: ""
				}) : this.fixTitle()
			};
			Tooltip.prototype.getDefaults = function() {
				return Tooltip.DEFAULTS
			};
			Tooltip.prototype.getOptions = function(options) {
				options = $.extend({}, this.getDefaults(), this.$element.data(), options);
				if (options.delay && typeof options.delay == "number") {
					options.delay = {
						show: options.delay,
						hide: options.delay
					}
				}
				return options
			};
			Tooltip.prototype.getDelegateOptions = function() {
				var options = {};
				var defaults = this.getDefaults();
				this._options && $.each(this._options, function(key, value) {
					if (defaults[key] != value) options[key] = value
				});
				return options
			};
			Tooltip.prototype.enter = function(obj) {
				var self = obj instanceof this.constructor ? obj : $(obj.currentTarget).data("bs." + this.type);
				if (!self) {
					self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
					$(obj.currentTarget).data("bs." + this.type, self)
				}
				if (obj instanceof $.Event) {
					self.inState[obj.type == "focusin" ? "focus" : "hover"] = true
				}
				if (self.tip().hasClass("in") || self.hoverState == "in") {
					self.hoverState = "in";
					return
				}
				clearTimeout(self.timeout);
				self.hoverState = "in";
				if (!self.options.delay || !self.options.delay.show) return self.show();
				self.timeout = setTimeout(function() {
					if (self.hoverState == "in") self.show()
				}, self.options.delay.show)
			};
			Tooltip.prototype.isInStateTrue = function() {
				for (var key in this.inState) {
					if (this.inState[key]) return true
				}
				return false
			};
			Tooltip.prototype.leave = function(obj) {
				var self = obj instanceof this.constructor ? obj : $(obj.currentTarget).data("bs." + this.type);
				if (!self) {
					self = new this.constructor(obj.currentTarget, this.getDelegateOptions());
					$(obj.currentTarget).data("bs." + this.type, self)
				}
				if (obj instanceof $.Event) {
					self.inState[obj.type == "focusout" ? "focus" : "hover"] = false
				}
				if (self.isInStateTrue()) return;
				clearTimeout(self.timeout);
				self.hoverState = "out";
				if (!self.options.delay || !self.options.delay.hide) return self.hide();
				self.timeout = setTimeout(function() {
					if (self.hoverState == "out") self.hide()
				}, self.options.delay.hide)
			};
			Tooltip.prototype.show = function() {
				app.shelter.upperZIndex();
				var e = $.Event("show.bs." + this.type);
				if (this.hasContent() && this.enabled) {
					this.$element.trigger(e);
					var $tooltip = this.$element,
						tooltipUUID, resizeHandler, optionWidth = this.options.width,
						optionHeight = this.options.height;
					var inDom = $.contains(this.$element[0].ownerDocument.documentElement, this.$element[0]);
					if (e.isDefaultPrevented() || !inDom) return;
					var that = this;
					var $tip = this.tip();
					var tipId = this.getUID(this.type);
					this.setContent();
					$tip.attr("id", tipId);
					this.$element.attr("aria-describedby", tipId);
					if (this.options.animation) $tip.addClass("fade");
					var placement = typeof this.options.placement == "function" ? this.options.placement.call(this, $tip[0], this.$element[0]) : this.options.placement;
					var autoToken = /\s?auto?\s?/i;
					var autoPlace = autoToken.test(placement);
					if (autoPlace) placement = placement.replace(autoToken, "") || "top";
					$tip.detach().css({
						display: "block"
					}).addClass(placement).data("bs." + this.type, this);
					this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element);
					if (optionWidth || optionHeight) {
						tooltipUUID = app.getUID();
						resizeHandler = function() {
							var tooltipHeight, tooltipWidth, windowHeight, windowWidth, tooltipCss = {},
								tooltipBodyCss, tooltipBodyHeight, placement, pos, actualWidth, actualHeight, calculatedOffset;
							if (optionWidth) {
								windowWidth = $window.width();
								if (optionWidth.indexOf("%") !== -1) {
									tooltipWidth = (parseInt(optionWidth, 10) / 100 || .8) * windowWidth
								} else {
									tooltipWidth = parseInt(optionWidth, 10) || windowWidth * .8
								}
								tooltipWidth = Math.min(tooltipWidth, windowWidth);
								tooltipWidth = Math.max(tooltipWidth, 0);
								tooltipCss.width = tooltipWidth;
								tooltipCss.marginLeft = 0
							}
							if (optionHeight) {
								windowHeight = $window.height();
								if (optionHeight.indexOf("%") !== -1) {
									tooltipHeight = (parseInt(optionHeight, 10) / 100 || .7) * windowHeight
								} else {
									tooltipHeight = parseInt(optionHeight, 10) || windowHeight * .7
								}
								tooltipHeight = Math.min(tooltipHeight, windowHeight);
								tooltipBodyHeight = tooltipHeight - $tip.children(".aweb-popover-header").height();
								tooltipCss.height = tooltipHeight;
								tooltipCss.marginTop = 0;
								tooltipBodyCss = {
									maxHeight: tooltipBodyHeight,
									minHeight: tooltipBodyHeight
								}
							}
							$tip.css(tooltipCss);
							if (tooltipBodyCss) {
								$tip.children(".aweb-popover-body").css(tooltipBodyCss)
							}
							placement = that.options.placement;
							pos = that.getPosition();
							actualWidth = $tip[0].offsetWidth;
							actualHeight = $tip[0].offsetHeight;
							calculatedOffset = that.getCalculatedOffset(placement, pos, actualWidth, actualHeight);
							that.applyPlacement(calculatedOffset, placement)
						};
						$window.on("resize." + tooltipUUID, resizeHandler);
						resizeHandler();
						this.uuid = tooltipUUID;
						this.resizeHandler = resizeHandler
					}
					this.$element.trigger("inserted.bs." + this.type);
					var pos = this.getPosition(),
						actualWidth = $tip[0].offsetWidth,
						actualHeight = $tip[0].offsetHeight,
						calculatedOffset, fixWidth, fixHeight, originFixWidth, originFixHeight, popoverHeaderHeight, popoverBodyHeight;
					if (autoPlace) {
						var orgPlacement = placement;
						var viewportDim = this.getPosition(this.$viewport);
						placement = placement == "bottom" && pos.bottom + actualHeight > viewportDim.bottom ? "top" : placement == "top" && pos.top - actualHeight < viewportDim.top ? "bottom" : placement == "right" && pos.right + actualWidth > viewportDim.width ? "left" : placement == "left" && pos.left - actualWidth < viewportDim.left ? "right" : placement;
						calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight);
						if (orgPlacement !== placement) {
							switch (placement) {
								case "left":
									originFixWidth = viewportDim.width - pos.right;
									if (calculatedOffset.left < 0) {
										fixWidth = actualWidth + calculatedOffset.left;
										if (fixWidth < originFixWidth) {
											fixWidth = originFixWidth;
											placement = orgPlacement;
											$tip.css({
												width: fixWidth + "px"
											})
										}
									}
									break;
								case "top":
									originFixHeight = viewportDim.height - pos.bottom;
									if (calculatedOffset.top < 0) {
										fixHeight = actualHeight + calculatedOffset.top;
										if (fixHeight < originFixHeight) {
											fixHeight = originFixHeight - 10;
											placement = orgPlacement;
											popoverHeaderHeight = $tip.children(".aweb-popover-header").height();
											popoverBodyHeight = fixHeight - popoverHeaderHeight;
											$tip.css({
												height: fixHeight + "px"
											});
											$tip.find(".aweb-popover-body").css({
												"min-height": popoverBodyHeight + "px",
												"max-height": popoverBodyHeight + "px"
											})
										}
									}
									break
							}
						}
						$tip.removeClass(orgPlacement).addClass(placement)
					}
					calculatedOffset = this.getCalculatedOffset(placement, pos, actualWidth, actualHeight);
					switch (placement) {
						case "left":
						case "right":
							if (calculatedOffset.left < 0) {
								fixWidth = actualWidth + calculatedOffset.left;
								$tip.css({
									width: fixWidth + "px"
								});
								calculatedOffset.left = 0
							}
							break;
						case "top":
						case "bottm":
							if (calculatedOffset.top < 0) {
								fixHeight = actualHeight + calculatedOffset.top;
								popoverHeaderHeight = $tip.children(".aweb-popover-header").height();
								popoverBodyHeight = fixHeight - popoverHeaderHeight;
								$tip.css({
									height: fixHeight + "px"
								});
								$tip.find(".aweb-popover-body").css({
									"min-height": popoverBodyHeight + "px",
									"max-height": popoverBodyHeight + "px"
								});
								calculatedOffset.top = 0
							}
							break
					}
					this.applyPlacement(calculatedOffset, placement);
					var complete = function() {
						var prevHoverState = that.hoverState;
						that.$element.trigger("shown.bs." + that.type);
						that.hoverState = null;
						if (prevHoverState == "out") that.leave(that)
					};
					$.support.transition && this.$tip.hasClass("fade") ? $tip.one("bsTransitionEnd", complete).emulateTransitionEnd(Tooltip.TRANSITION_DURATION) : complete()
				}
			};
			Tooltip.prototype.applyPlacement = function(offset, placement) {
				var $tip = this.tip();
				var width = $tip[0].offsetWidth;
				var height = $tip[0].offsetHeight;
				var marginTop = parseInt($tip.css("margin-top"), 10);
				var marginLeft = parseInt($tip.css("margin-left"), 10);
				if (isNaN(marginTop)) marginTop = 0;
				if (isNaN(marginLeft)) marginLeft = 0;
				offset.top += marginTop;
				offset.left += marginLeft;
				$.offset.setOffset($tip[0], $.extend({
					using: function(props) {
						$tip.css({
							top: Math.round(props.top),
							left: Math.round(props.left)
						})
					}
				}, offset), 0);
				$tip.addClass("in");
				var actualWidth = $tip[0].offsetWidth;
				var actualHeight = $tip[0].offsetHeight;
				if (placement == "top" && actualHeight != height) {
					offset.top = offset.top + height - actualHeight
				}
				var delta = this.getViewportAdjustedDelta(placement, offset, actualWidth, actualHeight);
				if (delta.left) offset.left += delta.left;
				else offset.top += delta.top;
				var isVertical = /top|bottom/.test(placement);
				var arrowDelta = isVertical ? delta.left * 2 - width + actualWidth : delta.top * 2 - height + actualHeight;
				var arrowOffsetPosition = isVertical ? "offsetWidth" : "offsetHeight";
				$tip.offset(offset);
				this.replaceArrow(arrowDelta, $tip[0][arrowOffsetPosition], isVertical)
			};
			Tooltip.prototype.replaceArrow = function(delta, dimension, isVertical) {
				this.arrow().css(isVertical ? "left" : "top", 50 * (1 - delta / dimension) + "%").css(isVertical ? "top" : "left", "")
			};
			Tooltip.prototype.setContent = function() {
				var $tip = this.tip();
				var title = this.getTitle();
				$tip.find(".tooltip-inner")[this.options.html ? "html" : "text"](title);
				$tip.removeClass("fade in top bottom left right")
			};
			Tooltip.prototype.hide = function(callback) {
				app.shelter.lowerZIndex();
				var that = this;
				var $tip = $(this.$tip);
				var e = $.Event("hide.bs." + this.type);

				function complete() {
					if (that.hoverState != "in") $tip.detach();
					if (that.$element) {
						that.$element.removeAttr("aria-describedby").trigger("hidden.bs." + that.type)
					}
					callback && callback()
				}
				this.$element.trigger(e);
				if (this.uuid) {
					$window.off("resize." + this.uuid);
					this.resizeHandler = null
				}
				if (e.isDefaultPrevented()) return;
				$tip.removeClass("in");
				$.support.transition && $tip.hasClass("fade") ? $tip.one("bsTransitionEnd", complete).emulateTransitionEnd(Tooltip.TRANSITION_DURATION) : complete();
				this.hoverState = null;
				return this
			};
			Tooltip.prototype.fixTitle = function() {
				var $e = this.$element;
				if ($e.attr("title") || typeof $e.attr("data-original-title") != "string") {
					$e.attr("data-original-title", $e.attr("title") || "").attr("title", "")
				}
			};
			Tooltip.prototype.hasContent = function() {
				return this.getTitle()
			};
			Tooltip.prototype.getPosition = function($element) {
				$element = $element || this.$element;
				var el = $element[0];
				var isBody = el.tagName == "BODY";
				var elRect = el.getBoundingClientRect();
				if (elRect.width == null) {
					elRect = $.extend({}, elRect, {
						width: elRect.right - elRect.left,
						height: elRect.bottom - elRect.top
					})
				}
				var isSvg = window.SVGElement && el instanceof window.SVGElement;
				var elOffset = isBody ? {
					top: 0,
					left: 0
				} : isSvg ? null : $element.offset();
				var scroll = {
					scroll: isBody ? document.documentElement.scrollTop || document.body.scrollTop : $element.scrollTop()
				};
				var outerDims = isBody ? {
					width: $(window).width(),
					height: $(window).height()
				} : null;
				return $.extend({}, elRect, scroll, outerDims, elOffset)
			};
			Tooltip.prototype.getCalculatedOffset = function(placement, pos, actualWidth, actualHeight) {
				return placement == "bottom" ? {
					top: pos.top + pos.height,
					left: pos.left + pos.width / 2 - actualWidth / 2
				} : placement == "top" ? {
					top: pos.top - actualHeight,
					left: pos.left + pos.width / 2 - actualWidth / 2
				} : placement == "left" ? {
					top: pos.top + pos.height / 2 - actualHeight / 2,
					left: pos.left - actualWidth
				} : {
					top: pos.top + pos.height / 2 - actualHeight / 2,
					left: pos.left + pos.width
				}
			};
			Tooltip.prototype.getViewportAdjustedDelta = function(placement, pos, actualWidth, actualHeight) {
				var delta = {
					top: 0,
					left: 0
				};
				if (!this.$viewport) return delta;
				var viewportPadding = this.options.viewport && this.options.viewport.padding || 0;
				var viewportDimensions = this.getPosition(this.$viewport);
				if (/right|left/.test(placement)) {
					var topEdgeOffset = pos.top - viewportPadding - viewportDimensions.scroll;
					var bottomEdgeOffset = pos.top + viewportPadding - viewportDimensions.scroll + actualHeight;
					if (topEdgeOffset < viewportDimensions.top) {
						delta.top = viewportDimensions.top - topEdgeOffset
					} else if (bottomEdgeOffset > viewportDimensions.top + viewportDimensions.height) {
						delta.top = viewportDimensions.top + viewportDimensions.height - bottomEdgeOffset
					}
				} else {
					var leftEdgeOffset = pos.left - viewportPadding;
					var rightEdgeOffset = pos.left + viewportPadding + actualWidth;
					if (leftEdgeOffset < viewportDimensions.left) {
						delta.left = viewportDimensions.left - leftEdgeOffset
					} else if (rightEdgeOffset > viewportDimensions.right) {
						delta.left = viewportDimensions.left + viewportDimensions.width - rightEdgeOffset
					}
				}
				return delta
			};
			Tooltip.prototype.getTitle = function() {
				var title;
				var $e = this.$element;
				var o = this.options;
				title = (typeof o.title == "function" ? o.title.call($e[0]) : o.title) || $e.attr("data-original-title");
				return title
			};
			Tooltip.prototype.getUID = function(prefix) {
				do prefix += ~~(Math.random() * 1e6); while (document.getElementById(prefix));
				return prefix
			};
			Tooltip.prototype.tip = function() {
				if (!this.$tip) {
					this.$tip = $(this.options.template);
					if (this.$tip.length != 1) {
						throw new Error(this.type + " `template` option must consist of exactly 1 top-level element!")
					}
				}
				return this.$tip
			};
			Tooltip.prototype.arrow = function() {
				return this.$arrow = this.$arrow || this.tip().find(".tooltip-arrow")
			};
			Tooltip.prototype.enable = function() {
				this.enabled = true
			};
			Tooltip.prototype.disable = function() {
				this.enabled = false
			};
			Tooltip.prototype.toggleEnabled = function() {
				this.enabled = !this.enabled
			};
			Tooltip.prototype.toggle = function(e) {
				var self = this;
				if (e) {
					self = $(e.currentTarget).data("bs." + this.type);
					if (!self) {
						self = new this.constructor(e.currentTarget, this.getDelegateOptions());
						$(e.currentTarget).data("bs." + this.type, self)
					}
				}
				if (e) {
					self.inState.click = !self.inState.click;
					if (self.isInStateTrue()) self.enter(self);
					else self.leave(self)
				} else {
					self.tip().hasClass("in") ? self.leave(self) : self.enter(self)
				}
			};
			Tooltip.prototype.destroy = function() {
				var that = this;
				clearTimeout(this.timeout);
				this.hide(function() {
					that.$element.off("." + that.type).removeData("bs." + that.type);
					if (that.$tip) {
						that.$tip.detach()
					}
					that.$tip = null;
					that.$arrow = null;
					that.$viewport = null;
					that.$element = null
				})
			};

			function Plugin(option) {
				return this.each(function() {
					var $this = $(this);
					var data = $this.data("bs.tooltip");
					var options = typeof option == "object" && option;
					if (!data && /destroy|hide/.test(option)) return;
					if (!data) $this.data("bs.tooltip", data = new Tooltip(this, options));
					if (typeof option == "string") data[option]()
				})
			}
			var old = $.fn.tooltip;
			$.fn.tooltip = Plugin;
			$.fn.tooltip.Constructor = Tooltip;
			$.fn.tooltip.noConflict = function() {
				$.fn.tooltip = old;
				return this
			}
		}(jQuery); + function($) {
			"use strict";
			var Popover = function(element, options) {
				this.init("popover", element, options)
			};
			if (!$.fn.tooltip) throw new Error("Popover requires tooltip.js");
			Popover.VERSION = "3.3.7";
			Popover.DEFAULTS = $.extend({}, $.fn.tooltip.Constructor.DEFAULTS, {
				placement: "right",
				trigger: "click",
				content: "",
				template: '<div class="aweb-popover" role="tooltip"><div class="arrow"></div><h3 class="aweb-popover-title"></h3><div class="aweb-popover-content"></div></div>'
			});
			Popover.prototype = $.extend({}, $.fn.tooltip.Constructor.prototype);
			Popover.prototype.constructor = Popover;
			Popover.prototype.getDefaults = function() {
				return Popover.DEFAULTS
			};
			Popover.prototype.setContent = function() {
				var $tip = this.tip();
				var title = this.getTitle();
				var content = this.getContent();
				$tip.find(".aweb-popover-title")[this.options.html ? "html" : "text"](title);
				$tip.find(".aweb-popover-content").children().detach().end()[this.options.html ? typeof content == "string" ? "html" : "append" : "text"](content);
				$tip.removeClass("fade top bottom left right in");
				if (!$tip.find(".aweb-popover-title").html()) $tip.find(".aweb-popover-title").hide()
			};
			Popover.prototype.hasContent = function() {
				return this.getTitle() || this.getContent()
			};
			Popover.prototype.getContent = function() {
				var $e = this.$element;
				var o = this.options;
				return $e.attr("data-content") || (typeof o.content == "function" ? o.content.call($e[0]) : o.content)
			};
			Popover.prototype.arrow = function() {
				return this.$arrow = this.$arrow || this.tip().find(".arrow")
			};

			function Plugin(option) {
				return this.each(function() {
					var $this = $(this);
					var data = $this.data("bs.popover");
					var options = typeof option == "object" && option;
					if (!data && /destroy|hide/.test(option)) return;
					if (!data) $this.data("bs.popover", data = new Popover(this, options));
					if (typeof option == "string") data[option]()
				})
			}
			var old = $.fn.popover;
			$.fn.popover = Plugin;
			$.fn.popover.Constructor = Popover;
			$.fn.popover.noConflict = function() {
				$.fn.popover = old;
				return this
			}
		}(jQuery);
		popover = function() {
			function popover(options) {
				var CONST = {
						POPOVER_LANG: {
							TITLE: "气泡",
							CONTENT: "气泡内容",
							DEFAULT_BTN: '<button title="全屏切换" type="button" data-role="toggleSize"><i class="aweb-popover-header-icon aui aui-quanping fa fa-expand"></i></button><button title="关闭" type="button" data-role="close"><i class="aweb-popover-header-icon aui aui-guanbi iconfont icon-topbar-close"></i></button>'
						},
						POPOVER_NAMESPACE: ".pop"
					},
					_default = {
						title: CONST.POPOVER_LANG.TITLE,
						content: CONST.POPOVER_LANG.CONTENT,
						init: null,
						confirmHandler: function() {},
						args: [],
						html: true,
						container: "body",
						height: "50%",
						width: "80%",
						placement: "auto right",
						template: '<div class="aweb-popover"  tabindex="0" role="tooltip"><div class="arrow"></div><div class="aweb-popover-header"><h4 class="aweb-popover-title"></h4><div class="btn-group">' + CONST.POPOVER_LANG.DEFAULT_BTN + '</div></div><div class="aweb-popover-body"><div class="aweb-popover-content"></div></div></div>'
					};
				var Pop = function(options) {
					this.options = $.extend({}, _default, options);
					this.init();
					this.on(this.events)
				};
				Pop.fn = Pop.prototype = {
					Constructor: Pop,
					events: {
						toggleSize: function(e, context) {
							var popoverBodyHeight, popoverBodyCss;
							context.$tip.toggleClass("popover-lg");
							popoverBodyHeight = context.$tip.height() - context.$tip.children(".aweb-popover-header").height();
							popoverBodyCss = {
								maxHeight: popoverBodyHeight,
								minHeight: popoverBodyHeight
							};
							if (popoverBodyCss) {
								context.$tip.children(".aweb-popover-body").css(popoverBodyCss)
							}
							context.trigger("screenChange")
						},
						close: function(e, context) {
							context.$element && context.$element.popover("destroy");
							if (context.isShow) {
								var handler = context.options.confirmHandler;
								$.isFunction(handler) && handler.apply(context, context.options.args);
								context.isShow = false;
								context.popInstance.destroy()
							}
						}
					},
					init: function() {
						var listen = {},
							i, k, item, $newBtn, that = this,
							onList = this.options.on,
							$buttons, $button, btnClass, iconNamespace;
						this.isShow = true;
						this.options.args = [this].concat(this.options.args);
						if (!this.options.hasHeader) {
							this.options.template = '<div class="aweb-popover"  tabindex="0" role="tooltip"><div class="arrow"></div><div class="aweb-popover-body"><div class="aweb-popover-content"></div></div></div>'
						}
						for (i in onList) {
							if (onList[i].btnName && onList[i].callback) {
								listen[onList[i].btnName] = onList[i].callback
							}
						}
						this.events = $.extend({}, this.events, listen);
						for (k in this.events) {
							this.events[k + CONST.POPOVER_NAMESPACE] = this.events[k];
							delete this.events[k]
						}
						if ($.isFunction(this.options.$elem)) {
							this.options.$elem = this.options.$elem()
						}
						this.$element = $(this.options.$elem).closest("button").length !== 0 ? $(this.options.$elem).closest("button") : $(this.options.$elem).closest("span").length !== 0 ? $(this.options.$elem).closest("span") : $(this.options.$elem);
						if ($.isFunction(this.options.content)) {
							this.options.content = this.options.content()
						}
						this.$element.popover({
							title: this.options.title,
							content: this.options.content,
							html: this.options.html,
							container: this.options.container,
							height: this.options.height,
							width: this.options.width,
							placement: this.options.placement,
							template: this.options.template,
							animation: false
						}).popover("show");
						if (this.options.fixClick) {
							this.$element.data("bs.popover").inState.click = true
						}
						this.popInstance = this.$element.data("bs.popover");
						this.$tip = this.$element.data("bs.popover").tip();
						this.$btnCtn = this.$tip.find(".aweb-popover-header > .btn-group").html(CONST.POPOVER_LANG.DEFAULT_BTN);
						$buttons = this.$btnCtn.find("button i");
						if ($.isFunction(this.options.init)) {
							this.options.init.apply(this.$tip, this.options.args)
						}
						if (window.auiApp && window.auiApp.mode !== "virtualizer") {
							$buttons.each(function(index, item) {
								$button = $(item);
								btnClass = item.className.split(" ");
								$.each(btnClass, function(index, item) {
									if (item !== "aweb-popover-header-icon" && item.indexOf("aui") < 0) {
										$button.removeClass(item)
									}
								})
							})
						} else {
							$buttons.each(function(index, item) {
								$(item).removeClass("aui")
							})
						}
						for (i in onList) {
							if (onList[i].btnName && onList[i].icon && onList[i].title) {
								iconNamespace = onList[i].icon.match(/([a-z]+)-([a-z]+)/)[1];
								$newBtn = '<button title="' + onList[i].title + '" type="button" data-role="' + onList[i].btnName + '"><i class="aweb-popover-header-icon ' + iconNamespace + " " + onList[i].icon + '"></i></button>';
								this.$btnCtn.prepend($newBtn)
							}
						}
						this.$tip.on("click" + CONST.POPOVER_NAMESPACE, ".aweb-popover-header button", function(e) {
							that.$tip.trigger($(this).attr("data-role") + CONST.POPOVER_NAMESPACE, that)
						});
						this.$tip.focus();
						this.$tip.on("focusout" + CONST.POPOVER_NAMESPACE, function(e) {
							if ($(e.relatedTarget).closest(".aweb-popover").is(that.$tip)) {
								return false
							}
							if (that.isShow) {
								if ((that.$tip.is($(e.target)) || that.$tip.is($(e.target).closest(".aweb-popover"))) && (!e.relatedTarget || $(e.relatedTarget).closest(".aweb-popover").length === 0)) {
									if (that.options.focusable !== false) {
										that.close()
									}
								} else {
									return false
								}
							}
						});
						this.$element.one("hide.bs.popover", function() {
							that.isShow = false;
							var handler = that.options.confirmHandler;
							$.isFunction(handler) && handler.apply(that, that.options.args)
						});
						this.$element.one("hidden.bs.popover", function() {
							that.destroy()
						})
					},
					on: function() {
						this.$tip.on.apply(this.$tip, arguments)
					},
					off: function() {
						this.$tip.off.apply(this.$tip, arguments)
					},
					trigger: function() {
						this.$tip.trigger.apply(this.$tip, arguments)
					},
					destroy: function() {
						this.off();
						this.$element = null;
						this.$btnCtn = null;
						this.$tip = null;
						this.options = null
					},
					close: function() {
						this.$tip && this.$tip.trigger("close", this)
					},
					toggleSize: function() {
						this.$tip && this.$tip.trigger("toggleSize", this)
					},
					setCache: function(key, value) {
						if (!this.cache) {
							this.cache = {}
						}
						this.cache[key] = value
					},
					getCache: function(key) {
						if (this.cache) {
							return this.cache[key]
						}
					}
				};
				return new Pop(options)
			}
			return popover
		}();
		return popover
	}();
	app.alertAction = function() {
		var alertAction = {
			close: app.alert.close,
			closeAll: app.alert.closeAll,
			getAlertList: app.alert.getAlertList,
			listener: app.alert.listener
		};
		return alertAction
	}();
	app.getUA = function() {
		var TYPE = {
				WEIXIN_IPAD: "weixin iPad",
				WEIXIN_IPHONE: "weixin iPhone",
				WEIXIN_ANDROID_PHONE: "weixin androidPhone",
				WEIXIN_ANDROID_PAD: "weixin androidPad",
				ALIPAY_IPAD: "Alipay iPad",
				ALIPAY_IPHONE: "Alipay iPhone",
				ALIPAY_ANDROID_PHONE: "Alipay androidPhone",
				ALIPAY_ANDROID_PAD: "Alipay androidPad",
				IPHONE: "iPhone",
				IPAD: "iPad",
				ANDROID_PHONE: "androidPhone",
				ANDROID_PAD: "androidPad",
				MSIE: "IE6~10" || "Ionic IE6~10",
				IE11: "IE11" || "Ionic IE11",
				MICROSOFT_EDGE: "Edge" || "Ionic Edge",
				PC_NOT_IE: "PC" || "Ionic",
				IONIC_IPAD: "Ionic iPad",
				IONIC_IPHONE: "Ionic iPhone",
				IONIC_ANDROID_PHONE: "Ionic androidPhone",
				IONIC_ANDROID_PAD: "Ionic androidPad",
				CORDOVA_IPAD: "Cordova iPad",
				CORDOVA_IPHONE: "Cordova iPhone",
				CORDOVA_ANDROID_PHONE: "Cordova androidPhone",
				CORDOVA_ANDROID_PAD: "Cordova androidPad"
			},
			config = [{
				name: "Cordova",
				reg: /^file/i
			}, {
				name: "Ionic",
				reg: /^http:\/\/localhost:8080/i
			}, {
				name: "weixin",
				reg: /MicroMessenger/i
			}, {
				name: "Alipay",
				reg: /Alipay/i
			}, {
				name: "androidPhone",
				reg: /^(?=.*(Android))(?=.*(Mobile)).+$/i
			}, {
				name: "androidPad",
				reg: /^(?=.*(Android))(?!.*(Mobile)).+$/i
			}, {
				name: "iPad",
				reg: /iPad/i
			}, {
				name: "iPhone",
				reg: /iPhone/i
			}, {
				name: "IE6~10",
				reg: /MSIE/i
			}, {
				name: "IE11",
				reg: /Trident\/7\.0/i
			}, {
				name: "Edge",
				reg: /Edge/i
			}],
			len = config.length,
			getUAFunc = function() {
				var UA = navigator.userAgent,
					url = document.URL,
					result = [],
					item, reg, k;
				if (UA && url) {
					for (k = 0; k < len; k++) {
						if ((item = config[k]) && (reg = item.reg) && reg.test(UA)) {
							result.push(item.name)
						}
					}
				}
				result = result.length ? result.join(" ") : TYPE.PC_NOT_IE;
				return result
			};
		getUAFunc.TYPE = TYPE;
		return getUAFunc
	}();
	app.ajax = function() {
		var _ajax = $.ajax;
		$.ajax = window.auiApp ? function(option) {
			var validateResult, queryString = {},
				data = {},
				formData, i, item, items;
			option = $.extend(true, {
				type: "post",
				contentType: "application/x-www-form-urlencoded;charset=utf-8",
				dataType: "json",
				traditional: true,
				shelter: false,
				success: function() {},
				validate: true
			}, option);
			validateResult = app.validate(option.data, option.validateSuccessCallback, option.validateErrorCallback, option.validateCleanCallback, option.validateContinue, option.validate);
			option.data = validateResult.data;
			if ($.isArray(option.data)) {
				for (items = option.data, i = items.length; item = items[--i];) {
					if (item.queryString) {
						queryString[item.name] = item.value
					} else {
						data[item.name] = item.value
					}
				}
				option.data = data;
				if (!$.isEmptyObject(queryString)) {
					option.url += "?" + $.param(queryString)
				}
			}
			if (option.ajaxProcessData === false) {
				try {
					data = option.data;
					formData = new FormData;
					for (i in data) {
						if (data.hasOwnProperty(i)) {
							formData.append(i, data[i])
						}
					}
					option.data = formData;
					option.processData = false;
					option.contentType = false
				} catch (e) {
					if (window.aweb.error) {
						app.alert("系统错误 0x03：网络请求失败！", app.alert.ERROR, "0x03")
					}
					if (window.aweb.log) {
						console.error(e)
					}
				}
			} else if (option.contentType.indexOf("application/json") !== -1) {
				option.data = JSON.stringify(option.data)
			}
			if (validateResult.result) {
				console && console.log(validateResult.result)
			} else {
				console.table(validateResult.data)
			}
			if (option.ajaxNoBlobData === false) {
				app.alert("模拟下载文件…", app.alert.SUCCESS)
			} else {
				requestAnimationFrame(function() {
					option.success({
						status: true,
						content: {
							result: "auiAjaxTest"
						}
					});
					if ($.isFunction(option.complete)) {
						option.complete({}, "", "", "")
					}
				})
			}
		} : function(option) {
			var validateResult, url, _error, _success, queryString = {},
				urlExternal = [],
				urlDivider, data = {},
				formData, i, item, items, html, $iframe, $form, ctoken, handler, server;
			if (!(option && (url = option.url) && !!~url.indexOf("##"))) {
				option = $.extend(true, {
					type: "post",
					contentType: "application/x-www-form-urlencoded;charset=utf-8",
					dataType: "json",
					traditional: true,
					shelter: false,
					urlDivider: "/",
					success: function() {}
				}, option);
				urlDivider = option.urlDivider;
				validateResult = app.validate(option.data, option.validateSuccessCallback, option.validateErrorCallback, option.validateCleanCallback, option.validateContinue, option.validate);
				if (validateResult.result) {
					option.data = validateResult.data;
					option.timeout = $.isNumeric(option.timeout) ? option.timeout : 3e4;
					if (option.shelter !== false && option.shelter !== "false") {
						app.shelter.show(option.shelter === true ? null : option.shelter, option.timeout)
					}
					if ($.isArray(option.data)) {
						for (items = option.data, i = items.length; item = items[--i];) {
							if (item.queryString) {
								queryString[item.name] = item.value
							} else if (item.urlExternal) {
								urlExternal.push(item.value)
							} else {
								data[item.name] = item.value
							}
						}
						option.data = data
					}
					ctoken = app.getData("ctoken") || window.ctoken;
					if (ctoken) {
						option.data = option.data || {};
						option.data.ctoken = ctoken
					}
					if (option.ajaxProcessData === false) {
						try {
							data = option.data;
							formData = new FormData;
							for (i in data) {
								if (data.hasOwnProperty(i)) {
									formData.append(i, data[i])
								}
							}
							option.data = formData;
							option.processData = false;
							option.contentType = false
						} catch (e) {
							if (window.aweb.error) {
								app.alert("系统错误 0x03：请求数据格式有误！", "0x03")
							}
							if (window.aweb.log) {
								console.error(e)
							}
						}
					} else if (option.contentType.indexOf("application/json") !== -1) {
						option.data = JSON.stringify(option.data)
					}
					if (urlExternal.length) {
						urlExternal = urlDivider + urlExternal.join(urlDivider);
						if (url[url.length - 1] === "?") {
							url[url.length - 1] = "/"
						}
						url += urlExternal
					}
					if (!$.isEmptyObject(queryString)) {
						url += (url.indexOf("?") !== -1 ? "" : "?") + $.param(queryString)
					}
					if (!option.server) {
						handler = app.router && app.router.getCurrentHandler();
						server = handler && handler.server;
						if (server) {
							option.server = server;
							option.url = server + url
						} else {
							option.url = url
						}
					} else {
						option.url = url
					}
					if (option.ajaxNoBlobData === false) {
						if (option.ajaxProcessData !== false) {
							var iframeName = app.getUID();
							$iframe = $('<iframe src="about:blank" name="' + iframeName + '" style="display: none"/>');
							$form = $("<form/>");
							html = [];
							data = option.data;
							$form.attr({
								method: option.type,
								action: option.url,
								target: iframeName
							});
							for (i in data) {
								if (data.hasOwnProperty(i)) {
									if ($.isArray(data[i])) {
										for (items = data[i], i = items.length; item = items[--i];) {
											html.push('<input  name="' + i + '" value="' + item + '"/>')
										}
									} else {
										html.push('<input  name="' + i + '" value="' + data[i] + '"/>')
									}
								}
							}
							$form.append(html.join(""));
							$iframe.appendTo("body");
							$form.appendTo($iframe);
							$form.submit();
							$iframe.on("load", function(e) {
								var response;
								try {
									response = e.currentTarget.contentWindow.document.body.innerText;
									response = JSON.parse(response)
								} catch (e) {
									response = {
										status: false,
										errorMsg: e.message,
										content: null
									}
								}
								option.success(response);
								$iframe && $iframe.remove()
							});
							option.shelter && app.shelter.hide()
						} else {
							app.alert("系统错误 0x09：不能同时使用传输返回数据文件流！", app.alert.ERROR, "0x09")
						}
					} else {
						_error = option.error;
						_success = option.success;
						option.success = function(response) {
							if (option.shelter !== false && option.shelter !== "false") {
								app.shelter.hide()
							}
							if (response) {
								if (response.status) {
									_success(response)
								} else {
									switch (response.errorCode) {
										case "100001":
											app.modal({
												title: "提示框",
												content: "会话超时，请重新登录",
												isLargeModal: false,
												confirmHandler: function() {
													window.location.reload()
												},
												cancelHandler: function() {
													window.location.reload()
												}
											});
											break;
										case "100002":
											app.alert("系统错误 0x06：" + response.errorMsg || "字段校验失败！", app.alert.ERROR, "0x06");
											if (aweb && aweb.error) {
												console.log(response.errorMsg)
											}
											break;
										default:
											_success(response)
									}
								}
							} else {
								app.alert("系统错误 0x08：后台服务报错！", app.alert.ERROR, "0x08")
							}
						};
						option.error = function(XMLHttpRequest, textStatus, errorThrown) {
							var oErr;
							if (option.shelter !== false && option.shelter !== "false") {
								app.shelter.hide()
							}
							if (option.ajaxNoBlobData !== false && !option.preventError) {
								oErr = XMLHttpRequest.response || XMLHttpRequest.responseText;
								try {
									oErr = eval("(" + oErr + ")")
								} catch (e) {
									oErr = {
										errorMsg: e.message
									}
								} finally {
									app.alert("系统错误 0x08：后台服务报错！", app.alert.ERROR, "0x08");
									_error && _error(XMLHttpRequest, textStatus, errorThrown);
									console.error(oErr)
								}
							}
						};
						return _ajax(option)
					}
				}
			}
		};
		return $.ajax
	}();
	app.Controller = function() {
		"use strict";
		var getTextURL = function(mvvmConfPath, server) {
				return "text!./" + (server || "") + mvvmConfPath + "?timestamp=" + (new Date).getTime()
			},
			getJavascriptURL = function(mvvmConfPath, server) {
				return (server || "") + mvvmConfPath + "?timestamp=" + (new Date).getTime()
			},
			validateModule = function(module) {
				var error = [],
					flows = module.flows,
					views = module.views,
					i, flow;
				if (!views) {
					error.push("views必需定义！")
				}
				if (flows && flows.length) {
					for (i = -1; flow = flows[++i];) {
						if (!flow.id) {
							error.push("flows中位置为" + i + "的流程需包含关联view的id！")
						} else {
							if (views && !views[flow.id]) {
								error.push("flows中位置为" + i + "的流程id关联的view未在views中定义！")
							}
						}
					}
				} else {
					error.push("flows必需为长度大于0的数组！")
				}
				return error
			};
		var View = function(options, controller) {
				var _default = this._default,
					context = this,
					$left, $right, $contextMenu, $tabCtn, queryString, windowId, windowOptions;
				$.extend(true, context, _default, options);
				context.controller = controller;
				context.$ctn = $(context.ctn).addClass("hidden");
				context.$contextMenu = $contextMenu = $(context.contextMenuTemp);
				context.$ctn.prepend($contextMenu);
				context.$tabs = $(context.tabs, context.$ctn);
				context.$left = $left = $(context.leftBtnTemp);
				context.$right = $right = $(context.rightBtnTemp);
				context.$moveBtns = context.$left.add(context.$right);
				context.$tabs.wrap(context.tabCtnTemp);
				context.$tabCtn = $tabCtn = context.$tabs.parent();
				$tabCtn.prepend($left);
				$tabCtn.append($right);
				context.$ctt = $(context.ctt, context.$ctn);
				context.$tabs.on({
					"click.view": function(e) {
						var $target = $(e.target || window.event.srcElement),
							$item = $target.closest("[data-dom-id]"),
							domID = $item.attr("data-dom-id");
						if (domID) {
							if ($target.attr("data-role") === "close") {
								context.close(domID)
							} else {
								context.switchView(domID)
							}
							return false
						}
					}
				});
				if (context.contextMenuOption) {
					context.$tabs.on({
						"contextmenu.view": function(e) {
							var $li = $(e.target || event.srcElement).closest("[data-dom-id]"),
								$tabs = $li.parent(),
								$contextMenu = context.$contextMenu,
								contextMenuOption = context.contextMenuOption,
								contextMenuCallback = context.contextMenuCallback,
								html = "",
								lineTemp, index, menuList, menu, length;
							if ($li.length) {
								length = $tabs.children().length;
								lineTemp = contextMenuOption.lineTemp;
								index = $li.index();
								if ($li.hasClass("active")) {
									menuList = [].concat(contextMenuOption.CURRENT).reverse()
								} else {
									switch (index) {
										case 0:
											if (length === 1) {
												menuList = contextMenuOption.ONLY
											} else {
												menuList = contextMenuOption.FIRST
											}
											break;
										case length - 1:
											menuList = contextMenuOption.LAST;
											break;
										default:
											menuList = contextMenuOption._DEFAULT
									}
									menuList = [].concat(menuList).reverse()
								}
								for (length = menuList.length; menu = contextMenuOption[menuList[--length]];) {
									html += lineTemp.replace("_action_", menu.action).replace("_filter_", menu.filter).replace("_name_", menu.name)
								}
								$contextMenu.empty().append(html.replace(/_index_/g, index)).css(app.position(e, $(window), $contextMenu), -15, 0).removeClass("hide").off(".viewContextMenu").one({
									"click.viewContextMenu": function(e) {
										var $target = $(e.target || event.srcElement),
											action = $target.attr("data-action");
										if (action && action !== "undefined") {
											contextMenuCallback.doAction.call(context, $li, action)
										} else {
											contextMenuCallback.closeTab.call(context, $target.attr("data-filter"))
										}
										$contextMenu.addClass("hide")
									},
									"mouseleave.viewContextMenu": function() {
										$contextMenu.addClass("hide")
									}
								});
								$tabs.off(".viewContextMenu").one("mouseleave.viewContextMenu", function(e) {
									if (!$(e.relatedTarget).closest("ul").hasClass("aweb-tab-content-menu")) {
										$contextMenu.addClass("hide")
									}
								})
							}
							return false
						}
					})
				}
				context.$moveBtns.on({
					"click.view": function() {
						context.focusTab(undefined, $(this))
					}
				});
				app.screen.addResizeHandler({
					uid: app.getUID(),
					isGlobal: options.isGlobal,
					timeout: 500,
					callback: function() {
						context.focusTab(context.$tabs.children(".active"))
					}
				});
				queryString = app.getQueryStringMap();
				if ((windowId = queryString[this.windowKey]) && (windowOptions = app.getData(windowId))) {
					windowOptions = JSON.parse(windowOptions);
					windowOptions.type = this.TYPE.BLANK;
					this.controller.open(windowOptions)
				}
			},
			Model = function(options, controller) {
				$.extend(true, this, options, {
					currentStep: -1,
					intervals: {},
					timeouts: {},
					_data: {
						scope: {}
					}
				});
				this.controller = controller;
				this.uid = this.pageId = this.cacheId = this.domID
			},
			Controller = function(options) {
				var context = this,
					_default = this._default,
					eventController;
				$.extend(true, this, _default, options);
				options.view.controller = this;
				this.context = this;
				this.event = app.dispatcher();
				this.Model = this.Model || Model;
				this.tab = new(options.View || View)(options.view, this);
				this.pages = {}
			};
		View.prototype = {
			version: "AWOS 4.4_20171127",
			constructor: View,
			_default: {
				ctn: "[data-role=container]",
				tabs: "#tabs",
				ctt: "#spa-page-main",
				count: {},
				stack: [],
				contextMenuTemp: '<ul class="aweb-tab-content-menu hide"></ul>',
				tabCtnTemp: '<div class="aweb-tabs-container"></div>',
				tabTemp: '<li class="active" data-dom-id="_domID_" data-tab-id="_id_" data-href="_href_" title="_title_"><a>_title_</a>_button_</li>',
				leftBtnTemp: '<button type="button" title="左移标签" class="btn aweb-tabs-left hidden" data-role="left"><i class="fa fa-chevron-left"></i>',
				rightBtnTemp: '<button type="button" title="右移标签" class="btn aweb-tabs-right hidden" data-role="right"><i class="fa fa-chevron-right"></i></button>',
				closeButtonTemp: '<button type="button" data-role="close" class="close">&times;</button>',
				untitled: "未定义",
				cttTemp: '<div id="_domID_" />',
				ctnFullClassName: "aweb-spa-ctn-full",
				cttFullClassName: "aweb-spa-ctt-full",
				hideNavClass: "hide",
				pathKeyInURL: "page",
				fullscreenKeyInURL: "fullscreen",
				displayNavKeyInURL: "displayNav",
				windowKey: "windowId",
				toUpdateTitle: true
			},
			TYPE: {
				BLANK: "BLANK",
				SUB: "SUB",
				SELF: "SELF",
				WINDOW: "WINDOW",
				POPOVER: "POPOVER"
			},
			popOption: {
				popSwitch: false
			},
			open: function(options) {
				var TYPE = this.TYPE,
					ret = false,
					title = options.title || this.untitled,
					id = options.id,
					fixed = options.fixed,
					domID, href = $.camelCase(options.sections.join("-")),
					handler, $tabs = this.$tabs.children(),
					$tab, $renderTo;
				if (!this.stack.length && options.type === TYPE.SELF) {
					options.type = TYPE.BLANK
				}
				if (!options.type || options.type === TYPE.BLANK) {
					$tab = id ? $tabs.filter('[data-tab-id="' + id + '"][data-href="' + href + '"]') : $tabs.filter('[data-href="' + href + '"]');
					if ($tab.length) {
						domID = $tab.attr("data-dom-id");
						this.switchView(domID, !$tab.length)
					} else {
						if (this.stack.length > 1 && (handler = this.controller.getCacheHandler(this.stack[this.stack.length - 1])) && (handler.type === TYPE.SUB || handler.type === TYPE.POPOVER)) {
							switch (handler.type) {
								case TYPE.SUB:
									app.alert("系统错误 0x01：子页面下不能打开新页面！", app.alert.ERROR, "0x01");
									break;
								case TYPE.POPOVER:
									app.alert("系统错误 0x01：气泡页面下不能打开新页面！", app.alert.ERROR, "0x01");
									break
							}
						} else {
							domID = this.getUID(id || href);
							this.$tabs.append(this.tabTemp.replace(/_domID_/, domID).replace(/_id_/, id).replace(/_href_/, href).replace(/_title_/g, title).replace(/_button_/, fixed ? "" : this.closeButtonTemp));
							$renderTo = $(this.cttTemp.replace(/_domID_/, domID));
							this.$ctt.append($renderTo);
							ret = {
								domID: domID,
								$renderTo: $renderTo,
								type: TYPE.BLANK
							}
						}
					}
				} else {
					switch (options.type) {
						case TYPE.SELF:
							if (this.stack.length > 1 && (handler = this.controller.getCacheHandler(this.stack[this.stack.length - 1])) && handler.type === TYPE.POPOVER) {
								app.alert("系统错误 0x01：气泡页面下不能打开自身页面！", app.alert.ERROR, "0x01")
							} else {
								handler = this.controller.getCurrentHandler();
								this.controller.unload(handler.domID, true);
								domID = this.getUID(id || href);
								$renderTo = handler.$renderTo = this.updateTitleAndID(handler.type, handler.domID, domID, title, id, href, handler.$renderTo);
								ret = {
									$renderTo: handler.$renderTo,
									domID: domID,
									type: handler.type
								}
							}
							break;
						case TYPE.SUB:
							if (this.stack.length > 1 && (handler = this.controller.getCacheHandler(this.stack[this.stack.length - 1])) && handler.type === TYPE.POPOVER) {
								app.alert("系统错误 0x01：气泡页面下不能打开子页面！", app.alert.ERROR, "0x01")
							} else {
								domID = this.getUID(id || href);
								$renderTo = $(this.cttTemp.replace(/_domID_/, domID));
								ret = {
									$renderTo: $renderTo,
									domID: domID,
									type: TYPE.SUB
								};
								app.modal({
									title: title,
									content: "",
									btnConfirm: options.btnConfirm || "关闭",
									btnCancel: options.btnCancel || "取消",
									init: function(controller) {
										var $body = $(this),
											$close = $('<button title="关闭子页面" type="button" class="close alert-close">&times;</button>');
										$body.prev().prepend($close);
										$body.append($renderTo);
										$close.one("click", function() {
											controller.unload();
											$(this).closest(".modal").modal("hide");
											controller.tab.resumeView()
										})
									},
									confirmHandler: function(controller) {
										controller.unload();
										$(this).closest(".modal").modal("hide");
										controller.tab.resumeView()
									},
									cancelHandler: function(controller) {
										controller.unload();
										$(this).closest(".modal").modal("hide");
										controller.tab.resumeView()
									},
									width: options.width,
									height: options.height,
									args: [this.controller],
									isLargeModal: true,
									isDialog: true,
									backdrop: "static",
									noFooter: !options.hasFooter,
									noHeader: !options.title
								})
							}
							break;
						case TYPE.POPOVER:
							if (this.stack.length > 1 && (handler = this.controller.getCacheHandler(this.stack[this.stack.length - 1])) && handler.type === TYPE.POPOVER) {
								app.alert("系统错误 0x01：气泡页面下不能打开新气泡页面！", app.alert.ERROR, "0x01")
							} else {
								domID = this.getUID(id || href);
								$renderTo = $(this.cttTemp.replace(/_domID_/, domID));
								ret = {
									$renderTo: $renderTo,
									domID: domID,
									type: TYPE.POPOVER
								};
								app.popover({
									$elem: options.$elem,
									title: title,
									content: "",
									placement: "auto left",
									init: function(popIns, controller) {
										var $body = $(this).find(".aweb-popover-content");
										$body.append($renderTo)
									},
									confirmHandler: function(popIns, controller, popOption) {
										if (!popIns.popInstance.inState.click) {
											popOption.popSwitch = !popOption.popSwitch
										}
										controller.unload();
										controller.tab.resumeView()
									},
									width: options.width,
									height: options.height,
									args: [this.controller, this.popOption]
								})
							}
							break
					}
				}
				if (typeof options.fullscreen === "boolean") {
					this.fullscreen(options.fullscreen)
				}
				if (typeof options.displayNav === "boolean") {
					this.displayNav(options.displayNav)
				}
				return ret
			},
			openWindow: function(options) {
				var optionStr = JSON.stringify(options || {}),
					windowId = app.getUID(),
					location = window.location || document.location,
					url = (location.origin || "") + location.pathname,
					a = document.createElement("a");
				app.setData(windowId, optionStr);
				window.open(url + "?" + app.getNewQueryStringURL({
					windowId: windowId
				}))
			},
			close: function(domID, _doNotResume) {
				var handler, controller = this.controller,
					currentViewID = this.getCurrentView();
				handler = controller.getCacheHandler(domID) || controller.getCurrentHandler();
				domID = domID || currentViewID;
				if (handler) {
					if (handler.type === this.TYPE.SUB) {
						controller.unload(domID, true);
						handler.$renderTo.closest(".modal").modal("hide")
					} else {
						controller.unload(domID);
						this.$tabs.children('[data-dom-id="' + domID + '"]').remove();
						this.$ctt.children("#" + domID).remove()
					}
					if (!_doNotResume && domID === currentViewID) {
						this.resumeView()
					}
				}
				return this
			},
			getUID: function(domID) {
				if (this.count[domID]) {
					domID += ++this.count[domID]
				} else {
					this.count[domID] = 1
				}
				return domID
			},
			updateTitleAndID: function(type, oldID, newID, title, id, href, $renderTo) {
				var TYPE = this.TYPE;
				title = title || this.untitled;
				switch (type) {
					case TYPE.SUB:
						$renderTo.closest(".modal").children(".modal-header").children(":not(button)").text(title);
						break;
					case TYPE.POPOVER:
						$renderTo.closest(".aweb-popover").children(".aweb-popover-header").children(".aweb-popover-title").text(title);
						break;
					default:
						this.$tabs.children('[data-dom-id="' + oldID + '"]').attr({
							title: title,
							"data-dom-id": newID,
							"data-tab-id": id,
							"data-href": href
						}).children("a").text(title);
						break
				}
				return $renderTo.attr("id", newID)
			},
			setTitle: function(uid, newTitle) {
				var TYPE = this.TYPE,
					model = this.controller.getCacheHandler(uid),
					$view;
				if (model && ($view = model.$renderTo)) {
					newTitle = newTitle || this.untitled;
					switch (model.type) {
						case TYPE.SUB:
							$view.closest(".modal").children(".modal-header").children(":not(button)").text(newTitle);
							break;
						default:
							this.$tabs.children('[data-dom-id="' + uid + '"]').attr({
								title: newTitle
							}).children("a").text(newTitle);
							break
					}
				}
			},
			setCurrentView: function(domID) {
				if (domID) {
					var stack = [],
						_stack = this.stack,
						i, id;
					for (i = _stack.length; id = _stack[--i];) {
						if (domID !== id) {
							stack.push(id)
						}
					}
					this.stack = stack.reverse();
					this.stack.push(domID);
					this.$ctn.removeClass("hidden")
				}
			},
			getCurrentView: function() {
				return this.stack[this.stack.length - 1] + ""
			},
			removeView: function(domID) {
				if (domID) {
					var stack = [],
						_stack = this.stack,
						i, id;
					for (i = _stack.length; id = _stack[--i];) {
						if (domID !== id) {
							stack.push(id)
						}
					}
					this.stack = stack.reverse();
					if (!stack.length) {
						this.$ctn.addClass("hidden");
						this.fullscreen(false);
						this.displayNav(true)
					}
				}
			},
			switchView: function(domID, isLoad) {
				var lastDomID = this.getCurrentView(),
					$tab, $ctt, $page, model;
				if (isLoad || lastDomID !== domID) {
					model = this.controller.getCacheHandler(domID);
					if (model) {
						this.controller.pause();
						if (model.type !== this.TYPE.SUB && model.type !== this.TYPE.POPOVER) {
							$tab = this.$tabs.children().removeClass("active").filter('[data-dom-id="' + domID + '"]').addClass("active");
							$ctt = this.$ctt;
							$page = $ctt.children("#" + lastDomID);
							$page.attr("data-scroll-top", $page.parent().scrollTop()).addClass("hide");
							$page = $ctt.children("#" + domID);
							$page.removeClass("hide");
							$page.parent().scrollTop($page.attr("data-scroll-top") || 0)
						} else {
							$ctt = this.$ctt;
							$page = $ctt.children("#" + lastDomID);
							$page.attr("data-scroll-top", $page.parent().scrollTop());
							$page = model.$renderTo;
							$page.removeClass("hide")
						}!isLoad && this.controller.resume(domID);
						this.setCurrentView(domID);
						this.focusTab($tab)
					}
				}
			},
			resumeView: function() {
				var TYPE = this.TYPE,
					lastDomID = this.getCurrentView(),
					handler = this.controller.getCurrentHandler(),
					domID, $tab, $ctt, $page, model;
				if (handler) {
					domID = handler.domID;
					model = this.controller.getCacheHandler(domID);
					if (model.type !== this.TYPE.SUB && model.type !== this.TYPE.POPOVER) {
						$tab = this.$tabs.children().removeClass("active").filter('[data-dom-id="' + domID + '"]').addClass("active");
						$ctt = this.$ctt;
						$page = $ctt.children("#" + lastDomID);
						$page.attr("data-scroll-top", $page.parent().scrollTop()).addClass("hide");
						$page = $ctt.children("#" + domID);
						$page.removeClass("hide");
						$page.parent().scrollTop($page.attr("data-scroll-top") || 0)
					}
					this.controller.resume(domID);
					this.focusTab($tab)
				}
			},
			focusTab: function() {
				var _focusTab = function($tab, $btn) {
						var widths = 0,
							totalWidths = 0,
							$tabCtn = this.$tabCtn,
							$tabs = this.$tabs,
							$lis = $tabs.children($tab ? ":lt(" + ($tab.index() + 1) + ")" : undefined),
							$tabBtn = $btn || this.$left,
							marginLeft, tabsContainerWidth = $tabCtn.innerWidth() - $tabBtn.outerWidth() * 4.2,
							tabsOffsetLeft = parseInt($tabs.css("left"), 10);
						$lis.each(function(index, elem) {
							widths += $(elem).outerWidth()
						});
						if (!$tab) {
							totalWidths = widths
						} else {
							$tabs.children().each(function(index, elem) {
								totalWidths += $(elem).outerWidth()
							})
						}
						this.$moveBtns[totalWidths < tabsContainerWidth ? "addClass" : "removeClass"]("hidden");
						if ($btn) {
							if ($btn.attr("data-role") === "left") {
								tabsOffsetLeft += tabsContainerWidth
							} else {
								tabsOffsetLeft -= tabsContainerWidth
							}
						} else {
							tabsOffsetLeft = tabsContainerWidth - widths
						}
						if (tabsContainerWidth - widths > tabsOffsetLeft) {
							tabsOffsetLeft = tabsContainerWidth - widths
						} else if (tabsOffsetLeft > 0) {
							marginLeft = totalWidths < tabsContainerWidth ? 0 : $tabBtn.outerWidth();
							tabsOffsetLeft = tabsOffsetLeft > marginLeft ? marginLeft : tabsOffsetLeft
						}
						$tabs.animate({
							left: tabsOffsetLeft + "px"
						}, 500)
					},
					focusTabHandler = null;
				return function($tab, $btn) {
					var context = this;
					if (focusTabHandler) {
						clearTimeout(focusTabHandler);
						focusTabHandler = null
					}
					focusTabHandler = setTimeout(function() {
						_focusTab.call(context, $tab, $btn)
					}, 200)
				}
			}(),
			fullscreen: function(fullscreen) {
				this.$ctn[fullscreen ? "addClass" : "removeClass"](this.ctnFullClassName);
				app.shelter[fullscreen ? "upperZIndex" : "lowerZIndex"]();
				this.focusTab()
			},
			isFullScreen: function() {
				return this.$ctn.hasClass(this.ctnFullClassName)
			},
			displayNav: function(show) {
				this.$tabCtn[show ? "removeClass" : "addClass"](this.hideNavClass);
				this.$ctt[show ? "removeClass" : "addClass"](this.cttFullClassName);
				this.focusTab()
			},
			isDisplayNav: function() {
				return !this.$tabCtn.hasClass(this.hideNavClass)
			}
		};
		Model.prototype = {
			version: "AWOS 4.4_20171127",
			constructor: Model,
			load: function() {
				return this.stepTo(0)
			},
			pause: function() {
				var data = this._data;
				try {
					if (data && data.bootstrap && data.bootstrap.pause) {
						this.controller.trigger(this.controller.STATUS.BEFORE_PAUSE, this);
						data.bootstrap.pause.call(this, data.$el, data.scope, this);
						this.controller.trigger(this.controller.STATUS.AFTER_PAUSE, this)
					}
				} catch (e) {
					if (window.aweb.error) {
						app.alert(e.message, app.alert.ERROR)
					}
					if (window.aweb.log) {
						console.error(e)
					}
				}
				this.stopAsyncEvent();
				return this
			},
			resume: function() {
				var data = this._data;
				try {
					if (data && data.bootstrap && data.bootstrap.resume) {
						this.controller.trigger(this.controller.STATUS.BEFORE_RESUME, this);
						data.bootstrap.resume.call(this, data.$el, data.scope, this);
						this.controller.trigger(this.controller.STATUS.AFTER_RESUME, this)
					}
				} catch (e) {
					if (window.aweb.error) {
						app.alert(e.message, app.alert.ERROR)
					}
					if (window.aweb.log) {
						console.error(e)
					}
				}
				this.startAsyncEvent();
				return this
			},
			unload: function(keepDom) {
				if (this.currentStep !== -1) {
					var data = this._data;
					try {
						if (data && data.bootstrap && data.bootstrap.unload) {
							this.controller.trigger(this.controller.STATUS.BEFORE_UNLOAD, this);
							data.bootstrap.unload.call(this, data.$el, data.scope, this);
							this.controller.trigger(this.controller.STATUS.AFTER_UNLOAD, this)
						}
					} catch (e) {
						if (window.aweb.error) {
							app.alert(e.message, app.alert.ERROR)
						}
						if (window.aweb.log) {
							console.error(e)
						}
					} finally {
						this.undelegateEvents();
						this.stopAsyncEvent(true);
						if (!keepDom) {
							data.$el.remove();
							delete this._data.$el;
							if (window.$AW) {
								delete window.$AW._css[this.domID]
							}
						} else {
							data.$el.empty()
						}
						delete this.timeouts;
						delete this.intervals;
						this.timeouts = {};
						this.intervals = {}
					}
				}
				return this
			},
			stepTo: function(step) {
				var handler = this,
					cache = handler._data && handler._data.scope,
					module = handler.conf,
					modulePath = handler.path,
					oFlow = module.flows[step],
					oView = module.views[oFlow.id],
					dtd = $.Deferred();
				if (cache && !$.isEmptyObject(cache)) {
					app.domain.exports("page", cache)
				}
				this.unload(true);
				require([getTextURL(modulePath + oView.template, handler.server), getJavascriptURL(modulePath + oView.js, handler.server)], function(template, bootstrap) {
					var data = handler._data,
						$div = $("<div/>"),
						$el;
					handler.$renderTo.empty().append($div);
					template && $div.append(template);
					$el = data.$el = handler.$renderTo;
					data.bootstrap = bootstrap;
					try {
						if (data && data.bootstrap && data.bootstrap.load) {
							bootstrap.load.call(handler, $el, data.scope, handler)
						}
						handler.currentStep = step;
						handler.controller.trigger(handler.controller.STATUS.AFTER_LOAD, handler);
						if (window.aweb.log) {
							console.log((new Date).toTimeString() + "：加载" + handler.path + "完毕，唯一ID（domID）：" + handler.domID + "，页面ID（id）：" + handler.id + "，当前步数（currentStep）：" + step + "")
						}
					} catch (e) {
						if (window.aweb.error) {
							app.alert(e.message, app.alert.ERROR)
						}
						if (window.aweb.log) {
							console.error(e)
						}
					} finally {
						dtd.resolve()
					}
				});
				return dtd.promise()
			},
			setTimeout: function(option) {
				var handler = this;
				if (option.immediate) {
					option.callback ? option.callback() : option.func()
				}
				option.clock = option.clock || 0;
				option.uniqueId = option.uniqueId || app.getUID();
				option.windowId = window.setTimeout(function() {
					option.callback ? option.callback() : option.func();
					handler.removeAsyncEvent(handler.timeouts, option.uniqueId)
				}, option.clock);
				handler.timeouts[option.uniqueId] = option;
				return option.uniqueId
			},
			clearTimeout: function(uniqueId) {
				var e = this.timeouts[uniqueId];
				if (e) {
					window.clearTimeout(e.windowId);
					this.removeAsyncEvent(this.timeouts, e.uniqueId);
				}
			},
			setInterval: function(option) {
				var handler = this;
				if (option.immediate) {
					option.callback ? option.callback() : option.func()
				}
				option.clock = option.clock || 0;
				option.uniqueId = option.uniqueId || app.getUID();
				option.windowId = window.setInterval(option.times ? function() {
					if (option.times) {
						option.times--;
						option.callback ? option.callback() : option.func()
					} else {
						handler.removeAsyncEvent(handler.timeouts, option.uniqueId)
					}
				} : option.callback || option.func, option.clock);
				handler.intervals[option.uniqueId] = option;
				return option.uniqueId
			},
			clearInterval: function(uniqueId) {
				var e = this.intervals[uniqueId];
				if (e) {
					window.clearInterval(e.windowId);
					this.removeAsyncEvent(this.intervals, e.uniqueId)
				}
			},
			updateInterval: function(uniqueId, option) {
				var handler = this,
					e = handler.intervals[uniqueId];
				if (e) {
					this.clearInterval(e.uniqueId);
					return this.setInterval($.extend(true, e, option))
				}
			},
			startAsyncEvent: function() {
				var i, map, item, handler = this;
				map = this.intervals;
				for (i in map) {
					if ((item = map[i]) && item.isPause) {
						item.windowId = window.setInterval(item.times ? function(item, handler) {
							return function() {
								if (item.times) {
									item.times--;
									item.callback ? item.callback() : item.func()
								} else {
									handler.removeAsyncEvent(handler.timeouts, item.uniqueId)
								}
							}
						}(item, handler) : item.callback || item.func, item.clock)
					}
				}
				map = this.timeouts;
				for (i in map) {
					if ((item = map[i]) && item.isPause) {
						item.windowId = window.setTimeout(function(item, handler) {
							return function() {
								item.callback ? item.callback() : item.func();
								handler.removeAsyncEvent(handler.timeouts, item.uniqueId)
							}
						}(item, handler), item.clock)
					}
				}
				i = null, item = null, map = null
			},
			stopAsyncEvent: function(isUnload) {
				var i, map, item;
				map = this.intervals;
				for (i in map) {
					if ((item = map[i]) && (isUnload || item.isPause)) {
						window.clearInterval(map[i].windowId)
					}
				}
				map = this.timeouts;
				for (i in map) {
					if ((item = map[i]) && (isUnload || item.isPause)) {
						window.clearTimeout(map[i].windowId)
					}
				}
			},
			removeAsyncEvent: function(arr, uniqueId) {
				if (arr[uniqueId]) {
					arr[uniqueId] = null;
					delete arr[uniqueId]
				}
			},
			delegateEvents: function(events) {
				var context = this,
					$el = context._data.$el || context.$renderTo,
					method, match, eventName, selector, $selector, key, touchName, map = {},
					intercept, $ = jQuery;
				this.undelegateEvents();
				for (key in events) {
					if (events.hasOwnProperty(key)) {
						method = events[key];
						if (!this.isFunction(method)) method = this[events[key]];
						if (!method) continue;
						match = key.match(this.delegateEventSplitter);
						eventName = match[1];
						selector = match[2];
						eventName += ".previewEvents";
						if (selector === "") {
							$el.on(eventName, method)
						} else {
							$selector = $(selector, $el);
							if ($selector.length) {
								$selector.on(eventName, method).attr("data-aweb-event", true)
							}
							if (!map[eventName]) {
								map[eventName] = {};
								$el.on(eventName, {
									eventName: eventName
								}, function(e) {
									var $e = $(e.target || window.event.srcElement),
										$selector, selector, items = map[e.data.eventName];
									for (selector in items) {
										if (items.hasOwnProperty(selector)) {
											$selector = $e.closest($(selector, $el));
											if ($selector.attr("data-aweb-event")) {
												break
											} else if ($selector.length) {
												return items[selector].apply($e[0], arguments)
											}
										}
									}
								})
							}
							map[eventName][selector] = method
						}
					}
				}
				if (window.aweb && window.aweb.headless && window.aweb.headless.on) {
					intercept = function(e) {
						var $target = $(e.target || event.srcElement);
						console.log((new Date).toString() + ":" + context.path + "触发了" + e.type + "，元素是:" + $target)
					};
					$el.on({
						"click.debug": intercept,
						"focus.debug": intercept,
						"keydown.debug": intercept
					})
				}
			},
			undelegateEvents: function() {
				this._data.$el && this._data.$el.off()
			},
			isFunction: function(obj) {
				return typeof obj === "function" || false
			},
			delegateEventSplitter: /^(\S+)\s*(.*)$/,
			getController: function() {
				return this.controller
			}
		};
		Controller.prototype = {
			version: "AWOS 4.4_20171127",
			constructor: Controller,
			_default: {
				conf: {},
				cache: {},
				modulesPath: "module",
				separator: "/",
				mvvmConfName: "mvvm.json",
				modulePath404: "module/error/404/"
			},
			STATUS: {
				AFTER_LOAD: "afterLoad",
				BEFORE_PAUSE: "beforePause",
				AFTER_PAUSE: "afterPause",
				BEFORE_RESUME: "beforeResume",
				AFTER_RESUME: "afterResume",
				BEFORE_UNLOAD: "beforeUnload",
				AFTER_UNLOAD: "afterUnload"
			},
			getDefaultModulesPath: function() {
				return this.modulesPath
			},
			getDefaultMVVMConfName: function() {
				return this.mvvmConfName
			},
			getDefaultSeparator: function() {
				return this.separator
			},
			getCurrentHandler: function() {
				return this.cache[this.tab.getCurrentView()]
			},
			getMVVM404: function() {
				return {
					path: this.modulePath404,
					conf: this.conf[this.modulePath404]
				}
			},
			getCacheHandler: function(domID) {
				return this.cache[domID]
			},
			addCacheHandler: function(handler) {
				this.cache[handler.domID] = handler
			},
			removeCacheHandler: function(domID) {
				if (this.cache[domID]) {
					delete this.cache[domID];
					this.tab.removeView(domID)
				}
			},
			load: function(options) {
				var modulePath = this.getDefaultModulesPath() + this.getDefaultSeparator(),
					$renderTo, id, domID, result, type, handler, context = this,
					sections = [];
				if (options.sections instanceof Array) {
					sections = sections.concat(options.sections)
				}
				if (sections.length) {
					modulePath += sections.join(this.getDefaultSeparator()) + this.getDefaultSeparator();
					id = options.id;
					if (options.type !== View.prototype.TYPE.WINDOW) {
						app.shelter.show("正在加载页面，请稍候…");
						require([getTextURL(modulePath + this.getDefaultMVVMConfName(), options.server)], function(mvvmConf) {
							try {
								var error;
								if (!mvvmConf) {
									app.alert("系统错误 0x05：获取页面失败！", app.alert.ERROR, "0x05")
								} else {
									mvvmConf = JSON.parse(mvvmConf);
									if ((error = validateModule(mvvmConf)).length) {
										app.alert(error, app.alert.ERROR)
									} else {
										if (result = context.tab.open(options)) {
											domID = result.domID;
											$renderTo = result.$renderTo;
											type = result.type;
											context.pages[domID] = options;
											try {
												handler = new context.Model({
													conf: mvvmConf,
													path: modulePath,
													$renderTo: $renderTo,
													id: id,
													domID: domID,
													controller: context,
													type: type,
													server: options.server,
													option: options
												}, context)
											} catch (e) {
												error = context.getMVVM404();
												handler = new context.Model({
													conf: error.conf,
													path: error.path,
													$renderTo: $renderTo,
													id: id,
													domID: domID,
													controller: context,
													type: type,
													errorMsg: e.message,
													server: options.server,
													option: options
												}, context)
											} finally {
												context.addCacheHandler(handler);
												if (options.type === context.tab.TYPE.SELF) {
													context.tab.setCurrentView(handler.domID)
												} else {
													context.tab.switchView(handler.domID, true)
												}
												$.when(handler.load()).done(function() {
													app.shelter.hide()
												})
											}
										} else {
											app.shelter.hide()
										}
									}
								}
							} catch (e) {
								if (window.aweb.log) {
									console.error(e)
								}
								if (window.aweb.error) {
									app.alert("系统错误 0x04：内容运行报错，详情见控制台！", app.alert.ERROR, "0x04")
								}
								app.shelter.hide()
							}
						})
					} else {
						this.tab.openWindow(options)
					}
				} else {
					if (window.aweb.error) {
						app.alert("系统错误 0x01：页面路径为空！", app.alert.ERROR, "0x01")
					}
				}
			},
			pause: function() {
				var handler = this.getCurrentHandler();
				if (handler) {
					handler.pause()
				}
			},
			resume: function(domID) {
				if (!domID) {
					debugger
				}
				var handler = this.getCacheHandler(domID);
				if (handler) {
					handler.resume()
				}
			},
			unload: function(domID, keepDom) {
				var handler = domID ? this.getCacheHandler(domID) : this.getCurrentHandler();
				if (handler) {
					handler.unload(keepDom);
					this.removeCacheHandler(handler.domID)
				}
			},
			open: function(options) {
				if (options.status) {
					app.domain.exports("page", options.content);
					options.sections = options.page.split("#");
					this.load(options)
				} else if (options.errorMsg) {
					app.alert(options.errorMsg, app.alert.ERROR)
				}
			},
			getView: function() {
				return this.tab
			},
			on: function() {
				this.event.on.apply(this.event, arguments)
			},
			off: function() {
				this.event.off.apply(this.event, arguments)
			},
			trigger: function() {
				this.event.trigger.apply(this.event, arguments)
			}
		};
		Controller.View = View;
		Controller.Model = Model;
		return Controller
	}();
	return
});