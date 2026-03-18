"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiService = void 0;
var api_config_1 = require("../config/api.config");
var ApiService = /** @class */ (function () {
    function ApiService() {
        this.isBackendAvailable = false;
        this.healthCheckInProgress = false;
        this.discoveredURL = null;
        // Start with config URL (auto-detected from Expo)
        this.baseURL = api_config_1.API_CONFIG.BASE_URL;
        console.log('🚀 ApiService initialized');
        console.log('📍 Initial URL:', this.baseURL);
        // Try to load saved/manual IP, then auto-discover
        this.initializeBackendURL();
    }
    // Initialize backend URL with smart discovery
    ApiService.prototype.initializeBackendURL = function () {
        return __awaiter(this, void 0, void 0, function () {
            var AsyncStorage, manualIP, lastWorkingURL, workingURL, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        AsyncStorage = require('@react-native-async-storage/async-storage').default;
                        return [4 /*yield*/, AsyncStorage.getItem('@mygate_manual_ip')];
                    case 1:
                        manualIP = _a.sent();
                        if (manualIP) {
                            this.baseURL = "http://".concat(manualIP, ":8080/api");
                            console.log('🔧 Using manual IP:', this.baseURL);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, AsyncStorage.getItem('@mygate_last_working_url')];
                    case 2:
                        lastWorkingURL = _a.sent();
                        if (!lastWorkingURL) return [3 /*break*/, 4];
                        console.log('🔄 Trying last working URL:', lastWorkingURL);
                        return [4 /*yield*/, this.testURL(lastWorkingURL)];
                    case 3:
                        if (_a.sent()) {
                            this.baseURL = lastWorkingURL;
                            console.log('✅ Last working URL is still valid');
                            return [2 /*return*/];
                        }
                        _a.label = 4;
                    case 4:
                        // Priority 3: Auto-discover from possible URLs
                        console.log('🔍 Auto-discovering backend URL...');
                        return [4 /*yield*/, this.discoverBackendURL()];
                    case 5:
                        workingURL = _a.sent();
                        if (!workingURL) return [3 /*break*/, 7];
                        this.baseURL = workingURL;
                        this.discoveredURL = workingURL;
                        return [4 /*yield*/, AsyncStorage.setItem('@mygate_last_working_url', workingURL)];
                    case 6:
                        _a.sent();
                        console.log('✅ Auto-discovered URL:', workingURL);
                        return [3 /*break*/, 8];
                    case 7:
                        console.log('⚠️  Could not auto-discover backend, using default:', this.baseURL);
                        _a.label = 8;
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        error_1 = _a.sent();
                        console.log('⚠️  Error initializing backend URL:', error_1);
                        return [3 /*break*/, 10];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    // Test if a URL is reachable
    ApiService.prototype.testURL = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            var controller_1, timeoutId, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        controller_1 = new AbortController();
                        timeoutId = setTimeout(function () { return controller_1.abort(); }, 5000);
                        return [4 /*yield*/, fetch("".concat(url.replace('/api', ''), "/api/health"), {
                                method: 'GET',
                                signal: controller_1.signal,
                                headers: { 'Accept': 'application/json' },
                            })];
                    case 1:
                        response = _a.sent();
                        clearTimeout(timeoutId);
                        return [2 /*return*/, response.ok];
                    case 2:
                        error_2 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Discover backend URL from multiple sources
    ApiService.prototype.discoverBackendURL = function () {
        return __awaiter(this, void 0, void 0, function () {
            var possibleURLs, Constants, ip, _i, possibleURLs_1, url;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        possibleURLs = [];
                        // Add URL from Expo Constants
                        try {
                            Constants = require('expo-constants').default;
                            if ((_a = Constants.expoConfig) === null || _a === void 0 ? void 0 : _a.hostUri) {
                                ip = Constants.expoConfig.hostUri.split(':')[0];
                                possibleURLs.push("http://".concat(ip, ":8080/api"));
                            }
                        }
                        catch (error) {
                            // Ignore
                        }
                        // Add URLs from config
                        possibleURLs.push.apply(possibleURLs, api_config_1.API_CONFIG.POSSIBLE_URLS);
                        // Add current baseURL
                        if (!possibleURLs.includes(this.baseURL)) {
                            possibleURLs.unshift(this.baseURL);
                        }
                        console.log('🔍 Testing URLs:', possibleURLs);
                        _i = 0, possibleURLs_1 = possibleURLs;
                        _b.label = 1;
                    case 1:
                        if (!(_i < possibleURLs_1.length)) return [3 /*break*/, 4];
                        url = possibleURLs_1[_i];
                        console.log('   Testing:', url);
                        return [4 /*yield*/, this.testURL(url)];
                    case 2:
                        if (_b.sent()) {
                            console.log('   ✅ Found working URL:', url);
                            return [2 /*return*/, url];
                        }
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, null];
                }
            });
        });
    };
    // Set manual IP (call this from UI)
    ApiService.prototype.setManualIP = function (ip) {
        return __awaiter(this, void 0, void 0, function () {
            var AsyncStorage, newURL, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        AsyncStorage = require('@react-native-async-storage/async-storage').default;
                        newURL = "http://".concat(ip, ":8080/api");
                        // Test the URL first
                        console.log('🧪 Testing manual IP:', newURL);
                        return [4 /*yield*/, this.testURL(newURL)];
                    case 1:
                        if (!_a.sent()) return [3 /*break*/, 4];
                        return [4 /*yield*/, AsyncStorage.setItem('@mygate_manual_ip', ip)];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, AsyncStorage.setItem('@mygate_last_working_url', newURL)];
                    case 3:
                        _a.sent();
                        this.baseURL = newURL;
                        this.isBackendAvailable = true;
                        console.log('✅ Manual IP set and verified:', newURL);
                        return [2 /*return*/, true];
                    case 4:
                        console.error('❌ Manual IP is not reachable:', newURL);
                        return [2 /*return*/, false];
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_3 = _a.sent();
                        console.error('❌ Failed to set manual IP:', error_3);
                        return [2 /*return*/, false];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    // Clear manual IP and rediscover
    ApiService.prototype.clearManualIP = function () {
        return __awaiter(this, void 0, void 0, function () {
            var AsyncStorage, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        AsyncStorage = require('@react-native-async-storage/async-storage').default;
                        return [4 /*yield*/, AsyncStorage.removeItem('@mygate_manual_ip')];
                    case 1:
                        _a.sent();
                        console.log('🔄 Manual IP cleared, rediscovering...');
                        return [4 /*yield*/, this.initializeBackendURL()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                    case 3:
                        error_4 = _a.sent();
                        console.error('❌ Failed to clear manual IP:', error_4);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // Force rediscovery of backend URL
    ApiService.prototype.rediscoverBackend = function () {
        return __awaiter(this, void 0, void 0, function () {
            var workingURL, AsyncStorage, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔄 Force rediscovering backend...');
                        return [4 /*yield*/, this.discoverBackendURL()];
                    case 1:
                        workingURL = _a.sent();
                        if (!workingURL) return [3 /*break*/, 6];
                        this.baseURL = workingURL;
                        this.discoveredURL = workingURL;
                        this.isBackendAvailable = true;
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        AsyncStorage = require('@react-native-async-storage/async-storage').default;
                        return [4 /*yield*/, AsyncStorage.setItem('@mygate_last_working_url', workingURL)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_5 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5:
                        console.log('✅ Rediscovered URL:', workingURL);
                        return [2 /*return*/, true];
                    case 6:
                        console.log('❌ Could not rediscover backend');
                        return [2 /*return*/, false];
                }
            });
        });
    };
    // Helper function to normalize boolean values from backend
    ApiService.prototype.normalizeBoolean = function (value) {
        if (typeof value === 'boolean')
            return value;
        if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
        }
        if (typeof value === 'number')
            return value === 1;
        return false;
    };
    // Helper function to normalize user data (fix boolean fields)
    ApiService.prototype.normalizeUserData = function (user) {
        if (!user)
            return user;
        // Create a copy to avoid mutating original
        var normalized = __assign({}, user);
        // Normalize common boolean fields
        if ('isActive' in normalized) {
            normalized.isActive = this.normalizeBoolean(normalized.isActive);
        }
        if ('is_active' in normalized) {
            normalized.is_active = this.normalizeBoolean(normalized.is_active);
        }
        if ('enabled' in normalized) {
            normalized.enabled = this.normalizeBoolean(normalized.enabled);
        }
        return normalized;
    };
    // Find working backend URL
    ApiService.prototype.findWorkingBackend = function () {
        return __awaiter(this, void 0, void 0, function () {
            var controller_2, timeoutId, response, data, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.healthCheckInProgress) {
                            console.log('⏳ Health check already in progress...');
                            return [2 /*return*/, null];
                        }
                        this.healthCheckInProgress = true;
                        console.log('🔍 Testing backend connection...');
                        console.log('📍 Backend URL:', this.baseURL);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        controller_2 = new AbortController();
                        timeoutId = setTimeout(function () { return controller_2.abort(); }, 15000);
                        return [4 /*yield*/, fetch("".concat(this.baseURL.replace('/api', ''), "/api/health"), {
                                method: 'GET',
                                signal: controller_2.signal,
                                headers: {
                                    'Accept': 'application/json',
                                    'Cache-Control': 'no-cache',
                                },
                            })];
                    case 2:
                        response = _a.sent();
                        clearTimeout(timeoutId);
                        if (!response.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, response.json()];
                    case 3:
                        data = _a.sent();
                        console.log('✅ Backend is reachable:', data.message);
                        this.isBackendAvailable = true;
                        this.healthCheckInProgress = false;
                        return [2 /*return*/, this.baseURL];
                    case 4:
                        console.log('❌ Backend returned error status:', response.status);
                        _a.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_6 = _a.sent();
                        console.log('❌ Backend connection failed:', error_6.message);
                        console.log('❌ Error name:', error_6.name);
                        console.log('❌ Error stack:', error_6.stack);
                        // Provide helpful error messages
                        if (error_6.name === 'AbortError') {
                            console.log('⏱️  Connection timeout (15s) - Possible causes:');
                            console.log('   1. Backend is down');
                            console.log('   2. AP Isolation enabled on router');
                            console.log('   3. Firewall blocking connection');
                            console.log('   4. Phone and laptop on different networks');
                        }
                        else if (error_6.message.includes('Network request failed')) {
                            console.log('🌐 Network error - Possible causes:');
                            console.log('   1. WiFi connection unstable');
                            console.log('   2. Router blocking device-to-device communication');
                            console.log('   3. Backend not listening on 0.0.0.0');
                        }
                        return [3 /*break*/, 7];
                    case 7:
                        this.isBackendAvailable = false;
                        this.healthCheckInProgress = false;
                        return [2 /*return*/, null];
                }
            });
        });
    };
    // Check backend status
    ApiService.prototype.checkBackendStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var workingUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isBackendAvailable)
                            return [2 /*return*/, true];
                        return [4 /*yield*/, this.findWorkingBackend()];
                    case 1:
                        workingUrl = _a.sent();
                        return [2 /*return*/, workingUrl !== null];
                }
            });
        });
    };
    // Get current backend URL
    ApiService.prototype.getCurrentBackendUrl = function () {
        return this.baseURL;
    };
    // Make HTTP request with improved error handling
    ApiService.prototype.makeRequest = function (url, options) {
        return __awaiter(this, void 0, void 0, function () {
            var lastError, _loop_1, attempt, state_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Skip health check for now - browser test shows backend is reachable
                        // The issue is with React Native fetch, not the backend
                        console.log('🚀 API Request:', options.method || 'GET', url);
                        lastError = null;
                        _loop_1 = function (attempt) {
                            var controller_3, timeoutId, response, errorText, data, error_7;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 5, , 8]);
                                        console.log("\uD83D\uDCE1 Attempt ".concat(attempt, "/").concat(api_config_1.API_CONFIG.RETRY_ATTEMPTS, ": ").concat(url));
                                        controller_3 = new AbortController();
                                        timeoutId = setTimeout(function () { return controller_3.abort(); }, api_config_1.API_CONFIG.TIMEOUT);
                                        return [4 /*yield*/, fetch(url, __assign(__assign({}, options), { signal: controller_3.signal, headers: __assign({ 'Content-Type': 'application/json', 'Accept': 'application/json', 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }, options.headers) }))];
                                    case 1:
                                        response = _b.sent();
                                        clearTimeout(timeoutId);
                                        console.log("\u2705 Response received: ".concat(response.status, " ").concat(response.statusText));
                                        if (!!response.ok) return [3 /*break*/, 3];
                                        return [4 /*yield*/, response.text()];
                                    case 2:
                                        errorText = _b.sent();
                                        console.error("\u274C HTTP Error ".concat(response.status, ":"), errorText);
                                        throw new Error("HTTP ".concat(response.status, ": ").concat(errorText));
                                    case 3: return [4 /*yield*/, response.json()];
                                    case 4:
                                        data = _b.sent();
                                        console.log('✅ Request successful');
                                        return [2 /*return*/, { value: data }];
                                    case 5:
                                        error_7 = _b.sent();
                                        lastError = error_7;
                                        // Log detailed error information
                                        console.error("\u274C Request failed (attempt ".concat(attempt, "/").concat(api_config_1.API_CONFIG.RETRY_ATTEMPTS, ")"));
                                        console.error('   Error name:', error_7.name);
                                        console.error('   Error message:', error_7.message);
                                        if (error_7.name === 'AbortError') {
                                            console.error("   \u23F1\uFE0F  Request timeout after ".concat(api_config_1.API_CONFIG.TIMEOUT, "ms"));
                                        }
                                        else if (error_7.message.includes('Network request failed')) {
                                            console.error('   🌐 Network request failed - possible causes:');
                                            console.error('      1. React Native networking issue');
                                            console.error('      2. SSL/TLS certificate issue');
                                            console.error('      3. Expo network configuration');
                                        }
                                        else if (error_7.message.includes('Failed to fetch')) {
                                            console.error('   🔌 Fetch failed - possible causes:');
                                            console.error('      1. CORS issue (but browser works, so unlikely)');
                                            console.error('      2. React Native fetch polyfill issue');
                                            console.error('      3. Network adapter issue');
                                        }
                                        if (!(attempt < api_config_1.API_CONFIG.RETRY_ATTEMPTS)) return [3 /*break*/, 7];
                                        console.log("\uD83D\uDD04 Retrying in ".concat(api_config_1.API_CONFIG.RETRY_DELAY, "ms..."));
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, api_config_1.API_CONFIG.RETRY_DELAY); })];
                                    case 6:
                                        _b.sent();
                                        _b.label = 7;
                                    case 7: return [3 /*break*/, 8];
                                    case 8: return [2 /*return*/];
                                }
                            });
                        };
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= api_config_1.API_CONFIG.RETRY_ATTEMPTS)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4:
                        // All retries failed
                        console.error('❌ All retry attempts failed');
                        console.error('💡 Browser test worked, so backend is reachable');
                        console.error('💡 This is a React Native networking issue');
                        throw lastError || new Error('Request failed after multiple attempts');
                }
            });
        });
    };
    // ============================================
    // AUTHENTICATION ENDPOINTS
    // ============================================
    // Send OTP to Student
    ApiService.prototype.sendStudentOTP = function (regNo) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/auth/student/send-otp"), {
                                method: 'POST',
                                body: JSON.stringify({ regNo: regNo }),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_8 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_8.message || 'Failed to send OTP',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Verify Student OTP
    ApiService.prototype.verifyStudentOTP = function (regNo, otp) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/auth/student/verify-otp"), {
                                method: 'POST',
                                body: JSON.stringify({ regNo: regNo, otp: otp }),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, {
                                success: data.success,
                                message: data.message,
                                user: this.normalizeUserData(data.student),
                                role: 'STUDENT',
                            }];
                    case 2:
                        error_9 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_9.message || 'Failed to verify OTP',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Send OTP to Staff
    ApiService.prototype.sendStaffOTP = function (staffCode) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/auth/staff/send-otp"), {
                                method: 'POST',
                                body: JSON.stringify({ staffCode: staffCode }),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_10 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_10.message || 'Failed to send OTP',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Verify Staff OTP
    ApiService.prototype.verifyStaffOTP = function (staffCode, otp) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/auth/staff/verify-otp"), {
                                method: 'POST',
                                body: JSON.stringify({ staffCode: staffCode, otp: otp }),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, {
                                success: data.success,
                                message: data.message,
                                user: this.normalizeUserData(data.staff),
                                role: 'STAFF',
                            }];
                    case 2:
                        error_11 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_11.message || 'Failed to verify OTP',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Send OTP to HOD
    ApiService.prototype.sendHODOTP = function (hodCode) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/auth/hod/send-otp"), {
                                method: 'POST',
                                body: JSON.stringify({ hodCode: hodCode }),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_12 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_12.message || 'Failed to send OTP',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Verify HOD OTP
    ApiService.prototype.verifyHODOTP = function (hodCode, otp) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/auth/hod/verify-otp"), {
                                method: 'POST',
                                body: JSON.stringify({ hodCode: hodCode, otp: otp }),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, {
                                success: data.success,
                                message: data.message,
                                user: this.normalizeUserData(data.hod),
                                role: 'HOD',
                            }];
                    case 2:
                        error_13 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_13.message || 'Failed to verify OTP',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Send OTP to Security Personnel
    ApiService.prototype.sendSecurityOTP = function (securityId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_14;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/auth/login/security-id"), {
                                method: 'POST',
                                body: JSON.stringify({ securityId: securityId }),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_14 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_14.message || 'Failed to send OTP',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Verify Security OTP
    ApiService.prototype.verifySecurityOTP = function (securityId, otp) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_15;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/auth/verify-otp"), {
                                method: 'POST',
                                body: JSON.stringify({ securityId: securityId, otp: otp }),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, {
                                success: data.success,
                                message: data.message,
                                user: this.normalizeUserData(data.security),
                                role: 'SECURITY',
                            }];
                    case 2:
                        error_15 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_15.message || 'Failed to verify OTP',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================
    // GATE PASS ENDPOINTS
    // ============================================
    // Submit Student Gate Pass Request
    ApiService.prototype.submitGatePassRequest = function (requestData) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_16;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/gate-pass/student/submit"), {
                                method: 'POST',
                                body: JSON.stringify(requestData),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_16 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_16.message || 'Failed to submit gate pass request',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Submit Staff Gate Pass Request
    ApiService.prototype.submitStaffGatePassRequest = function (requestData) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_17;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/gate-pass/staff/submit"), {
                                method: 'POST',
                                body: JSON.stringify(requestData),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_17 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_17.message || 'Failed to submit gate pass request',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get Student Gate Pass Requests
    ApiService.prototype.getStudentGatePassRequests = function (regNo) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_18;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/gate-pass/student/").concat(regNo), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        // Backend returns { success, requests: [...] }
                        return [2 /*return*/, {
                                success: data.success || true,
                                message: data.message || 'Requests fetched successfully',
                                requests: data.requests || [],
                                data: data.requests || [],
                            }];
                    case 2:
                        error_18 = _a.sent();
                        console.error('❌ Error fetching student gate pass requests for:', regNo, error_18);
                        return [2 /*return*/, {
                                success: false,
                                message: error_18.message || 'Failed to fetch gate pass requests',
                                requests: [],
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get User Entry History
    ApiService.prototype.getUserEntryHistory = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_19;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/entry-exit/history/").concat(userId), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        // Backend returns { success, data: [...] }
                        return [2 /*return*/, data.data || data.history || []];
                    case 2:
                        error_19 = _a.sent();
                        console.error('❌ Error getting user entry history for:', userId, error_19);
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get Staff Pending Requests
    ApiService.prototype.getStaffPendingRequests = function (staffCode) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_20;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/gate-pass/staff/").concat(staffCode, "/pending"), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_20 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_20.message || 'Failed to fetch pending requests',
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Approve Gate Pass by Staff
    ApiService.prototype.approveGatePassByStaff = function (staffCode, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_21;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/gate-pass/staff/").concat(staffCode, "/approve/").concat(requestId), {
                                method: 'POST',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_21 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_21.message || 'Failed to approve gate pass',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Reject Gate Pass by Staff
    ApiService.prototype.rejectGatePassByStaff = function (staffCode, requestId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_22;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/gate-pass/staff/").concat(staffCode, "/reject/").concat(requestId), {
                                method: 'POST',
                                body: JSON.stringify({ reason: reason }),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_22 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_22.message || 'Failed to reject gate pass',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get Staff Own Gate Pass Requests
    ApiService.prototype.getStaffOwnGatePassRequests = function (staffCode) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_23;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/gate-pass/staff/").concat(staffCode, "/own"), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, {
                                success: data.success || true,
                                message: data.message || 'Requests fetched successfully',
                                requests: data.requests || [],
                                data: data.requests || [],
                            }];
                    case 2:
                        error_23 = _a.sent();
                        console.error('❌ Error fetching staff own gate pass requests for:', staffCode, error_23);
                        return [2 /*return*/, {
                                success: false,
                                message: error_23.message || 'Failed to fetch own gate pass requests',
                                requests: [],
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get All Staff Requests (for approval)
    ApiService.prototype.getAllStaffRequests = function (staffCode) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_24;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/gate-pass/staff/").concat(staffCode, "/all"), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, {
                                success: data.success || true,
                                message: data.message || 'Requests fetched successfully',
                                requests: data.requests || [],
                                data: data.requests || [],
                            }];
                    case 2:
                        error_24 = _a.sent();
                        console.error('❌ Error fetching staff requests for:', staffCode, error_24);
                        return [2 /*return*/, {
                                success: false,
                                message: error_24.message || 'Failed to fetch staff requests',
                                requests: [],
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get All HOD Requests
    ApiService.prototype.getAllHODRequests = function (hodCode) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_25;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/gate-pass/hod/").concat(hodCode, "/all"), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, {
                                success: data.success || true,
                                message: data.message || 'Requests fetched successfully',
                                requests: data.requests || [],
                                data: data.requests || [],
                            }];
                    case 2:
                        error_25 = _a.sent();
                        console.error('❌ Error fetching HOD requests for:', hodCode, error_25);
                        return [2 /*return*/, {
                                success: false,
                                message: error_25.message || 'Failed to fetch HOD requests',
                                requests: [],
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Approve Gate Pass by HOD
    ApiService.prototype.approveGatePassByHOD = function (hodCode, requestId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_26;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/gate-pass/hod/").concat(hodCode, "/approve/").concat(requestId), {
                                method: 'POST',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_26 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_26.message || 'Failed to approve gate pass',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Reject Gate Pass by HOD
    ApiService.prototype.rejectGatePassByHOD = function (hodCode, requestId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_27;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/gate-pass/hod/").concat(hodCode, "/reject/").concat(requestId), {
                                method: 'POST',
                                body: JSON.stringify({ reason: reason }),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_27 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_27.message || 'Failed to reject gate pass',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get Gate Pass QR Code
    ApiService.prototype.getGatePassQRCode = function (requestId_1, userCode_1) {
        return __awaiter(this, arguments, void 0, function (requestId, userCode, isStaff) {
            var endpoint, data, error_28;
            if (isStaff === void 0) { isStaff = false; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        endpoint = isStaff
                            ? "".concat(this.baseURL, "/gate-pass/staff/").concat(userCode, "/qr/").concat(requestId)
                            : "".concat(this.baseURL, "/gate-pass/student/qr/").concat(requestId);
                        return [4 /*yield*/, this.makeRequest(endpoint, {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_28 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_28.message || 'Failed to fetch QR code',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================
    // GROUP/BULK PASS ENDPOINTS
    // ============================================
    // Create Bulk Gate Pass
    ApiService.prototype.createBulkGatePass = function (requestData) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_29;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/staff/bulk-gatepass/create"), {
                                method: 'POST',
                                body: JSON.stringify(requestData),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_29 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_29.message || 'Failed to create bulk gate pass',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get Students by Staff Department
    ApiService.prototype.getStudentsByStaffDepartment = function (staffCode) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_30;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/staff/").concat(staffCode, "/students"), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_30 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_30.message || 'Failed to fetch students',
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================
    // SECURITY SCAN ENDPOINTS
    // ============================================
    // Scan QR Code
    ApiService.prototype.scanQRCode = function (qrData, scannedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_31;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/scan-qr"), {
                                method: 'POST',
                                body: JSON.stringify({ qrData: qrData, scannedBy: scannedBy }),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_31 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_31.message || 'Failed to scan QR code',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get Scan History
    ApiService.prototype.getScanHistory = function (securityId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_32;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/scan-history"), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        // Backend returns array directly, wrap it
                        return [2 /*return*/, {
                                success: true,
                                data: Array.isArray(data) ? data : [],
                                message: 'Scan history fetched successfully',
                            }];
                    case 2:
                        error_32 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_32.message || 'Failed to fetch scan history',
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================
    // NOTIFICATIONS
    // ============================================
    // Get Notifications
    ApiService.prototype.getNotifications = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_33;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/notifications/").concat(userId), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                notifications: data,
                                data: data,
                            }];
                    case 2:
                        error_33 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_33.message || 'Failed to fetch notifications',
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Mark Notification as Read
    ApiService.prototype.markNotificationAsRead = function (notificationId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_34;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/notification/").concat(notificationId, "/mark-read"), {
                                method: 'POST',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                message: 'Notification marked as read',
                            }];
                    case 2:
                        error_34 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_34.message || 'Failed to mark notification as read',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Mark All Notifications as Read
    ApiService.prototype.markAllNotificationsAsRead = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_35;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/notifications/").concat(userId, "/mark-all-read"), {
                                method: 'POST',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                message: 'All notifications marked as read',
                            }];
                    case 2:
                        error_35 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_35.message || 'Failed to mark all notifications as read',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Clear All Notifications
    ApiService.prototype.clearAllNotifications = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_36;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/notifications/").concat(userId, "/mark-all-read"), {
                                method: 'POST',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, {
                                success: true,
                                message: 'All notifications cleared',
                            }];
                    case 2:
                        error_36 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_36.message || 'Failed to clear all notifications',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================
    // ACTIVE PERSONS (Security Dashboard)
    // ============================================
    // Get Active Persons
    ApiService.prototype.getActivePersons = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_37;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/active-persons"), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_37 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_37.message || 'Failed to fetch active persons',
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Record Manual Exit
    ApiService.prototype.recordManualExit = function (exitData) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_38;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/record-scan"), {
                                method: 'POST',
                                body: JSON.stringify(exitData),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_38 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_38.message || 'Failed to record manual exit',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================
    // VISITOR REGISTRATION
    // ============================================
    // Register Visitor
    ApiService.prototype.registerVisitor = function (visitorData) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_39;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/visitors"), {
                                method: 'POST',
                                body: JSON.stringify(visitorData),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_39 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_39.message || 'Failed to register visitor',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get Departments
    ApiService.prototype.getDepartments = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_40;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/departments"), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        // Backend returns array directly, wrap it in success response
                        return [2 /*return*/, {
                                success: true,
                                data: Array.isArray(data) ? data : [],
                                message: 'Departments fetched successfully',
                            }];
                    case 2:
                        error_40 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_40.message || 'Failed to fetch departments',
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get Staff by Department
    ApiService.prototype.getStaffByDepartment = function (deptCode) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_41;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/staff-and-hods/department/").concat(deptCode), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        // Backend returns array directly, wrap it in success response
                        return [2 /*return*/, {
                                success: true,
                                data: Array.isArray(data) ? data : [],
                                message: 'Staff members fetched successfully',
                            }];
                    case 2:
                        error_41 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_41.message || 'Failed to fetch staff members',
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================
    // HOD CONTACTS
    // ============================================
    // Get HOD Contacts
    ApiService.prototype.getHODContacts = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_42;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/hods"), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        // Backend returns array directly, wrap it in success response
                        return [2 /*return*/, {
                                success: true,
                                data: Array.isArray(data) ? data : [],
                                message: 'HOD contacts fetched successfully',
                            }];
                    case 2:
                        error_42 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_42.message || 'Failed to fetch HOD contacts',
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================
    // SCAN HISTORY (Enhanced)
    // ============================================
    // Get Complete Scan History
    ApiService.prototype.getCompleteScanHistory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_43;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/scan-history"), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_43 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_43.message || 'Failed to fetch scan history',
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Clear Scan History
    ApiService.prototype.clearScanHistory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_44;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/scan-history"), {
                                method: 'DELETE',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_44 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_44.message || 'Failed to clear scan history',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Delete Scan Record
    ApiService.prototype.deleteScanRecord = function (scanId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_45;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/scan-history/").concat(scanId), {
                                method: 'DELETE',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_45 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_45.message || 'Failed to delete scan record',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================
    // VEHICLE MANAGEMENT (Enhanced)
    // ============================================
    // Register Vehicle
    ApiService.prototype.registerVehicle = function (vehicleData) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_46;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/vehicles"), {
                                method: 'POST',
                                body: JSON.stringify(vehicleData),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_46 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_46.message || 'Failed to register vehicle',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get Vehicle History
    ApiService.prototype.getVehicleHistory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_47;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/vehicles"), {
                                method: 'GET',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_47 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_47.message || 'Failed to fetch vehicle history',
                                data: [],
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Clear Vehicle History
    ApiService.prototype.clearVehicleHistory = function () {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_48;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/vehicles"), {
                                method: 'DELETE',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_48 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_48.message || 'Failed to clear vehicle history',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Delete Vehicle Record
    ApiService.prototype.deleteVehicleRecord = function (vehicleId) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_49;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/vehicles/").concat(vehicleId), {
                                method: 'DELETE',
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_49 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_49.message || 'Failed to delete vehicle record',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // ============================================
    // GROUP PASS SCANNING
    // ============================================
    // Scan Group Pass
    ApiService.prototype.scanGroupPass = function (qrData, scannedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var data, error_50;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.makeRequest("".concat(this.baseURL, "/security/scan-group-pass"), {
                                method: 'POST',
                                body: JSON.stringify({ qrData: qrData, scannedBy: scannedBy }),
                            })];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, data];
                    case 2:
                        error_50 = _a.sent();
                        return [2 /*return*/, {
                                success: false,
                                message: error_50.message || 'Failed to scan group pass',
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return ApiService;
}());
exports.apiService = new ApiService();
