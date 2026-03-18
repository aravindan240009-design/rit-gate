"use strict";
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
exports.SettingsScreen = void 0;
var react_1 = require("react");
var react_native_1 = require("react-native");
var api_service_1 = require("../../services/api.service");
var SettingsScreen = function () {
    var _a = (0, react_1.useState)(''), currentURL = _a[0], setCurrentURL = _a[1];
    var _b = (0, react_1.useState)(''), manualIP = _b[0], setManualIP = _b[1];
    var _c = (0, react_1.useState)(false), isLoading = _c[0], setIsLoading = _c[1];
    var _d = (0, react_1.useState)(false), isTesting = _d[0], setIsTesting = _d[1];
    (0, react_1.useEffect)(function () {
        loadCurrentSettings();
    }, []);
    var loadCurrentSettings = function () { return __awaiter(void 0, void 0, void 0, function () {
        var url, match;
        return __generator(this, function (_a) {
            try {
                url = api_service_1.apiService.getCurrentBackendUrl();
                setCurrentURL(url);
                match = url.match(/http:\/\/([^:]+):/);
                if (match) {
                    setManualIP(match[1]);
                }
            }
            catch (error) {
                console.error('Error loading settings:', error);
            }
            return [2 /*return*/];
        });
    }); };
    var handleTestConnection = function () { return __awaiter(void 0, void 0, void 0, function () {
        var isAvailable, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsTesting(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, api_service_1.apiService.checkBackendStatus()];
                case 2:
                    isAvailable = _a.sent();
                    if (isAvailable) {
                        react_native_1.Alert.alert('Success', 'Backend is reachable!');
                    }
                    else {
                        react_native_1.Alert.alert('Error', 'Cannot reach backend at current URL');
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_1 = _a.sent();
                    react_native_1.Alert.alert('Error', 'Failed to test connection');
                    return [3 /*break*/, 5];
                case 4:
                    setIsTesting(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    var handleSetManualIP = function () { return __awaiter(void 0, void 0, void 0, function () {
        var ipRegex, success, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!manualIP.trim()) {
                        react_native_1.Alert.alert('Error', 'Please enter an IP address');
                        return [2 /*return*/];
                    }
                    ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
                    if (!ipRegex.test(manualIP.trim())) {
                        react_native_1.Alert.alert('Error', 'Invalid IP address format. Example: 192.168.1.100');
                        return [2 /*return*/];
                    }
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, api_service_1.apiService.setManualIP(manualIP.trim())];
                case 2:
                    success = _a.sent();
                    if (!success) return [3 /*break*/, 4];
                    react_native_1.Alert.alert('Success', "Backend URL set to http://".concat(manualIP.trim(), ":8080/api"));
                    return [4 /*yield*/, loadCurrentSettings()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    react_native_1.Alert.alert('Error', 'Cannot reach backend at this IP address. Please check:\n\n' +
                        '1. Backend is running\n' +
                        '2. Both devices on same WiFi\n' +
                        '3. Firewall is disabled\n' +
                        '4. IP address is correct');
                    _a.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6:
                    error_2 = _a.sent();
                    react_native_1.Alert.alert('Error', 'Failed to set manual IP');
                    return [3 /*break*/, 8];
                case 7:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handleAutoDiscover = function () { return __awaiter(void 0, void 0, void 0, function () {
        var success, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setIsLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, api_service_1.apiService.rediscoverBackend()];
                case 2:
                    success = _a.sent();
                    if (!success) return [3 /*break*/, 4];
                    react_native_1.Alert.alert('Success', 'Backend URL auto-discovered!');
                    return [4 /*yield*/, loadCurrentSettings()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 4:
                    react_native_1.Alert.alert('Error', 'Could not auto-discover backend. Please set IP manually.');
                    _a.label = 5;
                case 5: return [3 /*break*/, 8];
                case 6:
                    error_3 = _a.sent();
                    react_native_1.Alert.alert('Error', 'Failed to auto-discover backend');
                    return [3 /*break*/, 8];
                case 7:
                    setIsLoading(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handleClearManualIP = function () { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            react_native_1.Alert.alert('Clear Manual IP', 'This will clear the manual IP and try to auto-discover the backend. Continue?', [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: function () { return __awaiter(void 0, void 0, void 0, function () {
                        var error_4;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    setIsLoading(true);
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 4, 5, 6]);
                                    return [4 /*yield*/, api_service_1.apiService.clearManualIP()];
                                case 2:
                                    _a.sent();
                                    react_native_1.Alert.alert('Success', 'Manual IP cleared. Auto-discovery enabled.');
                                    return [4 /*yield*/, loadCurrentSettings()];
                                case 3:
                                    _a.sent();
                                    return [3 /*break*/, 6];
                                case 4:
                                    error_4 = _a.sent();
                                    react_native_1.Alert.alert('Error', 'Failed to clear manual IP');
                                    return [3 /*break*/, 6];
                                case 5:
                                    setIsLoading(false);
                                    return [7 /*endfinally*/];
                                case 6: return [2 /*return*/];
                            }
                        });
                    }); },
                },
            ]);
            return [2 /*return*/];
        });
    }); };
    var handleGetCurrentIP = function () { return __awaiter(void 0, void 0, void 0, function () {
        var Constants, ip;
        var _a;
        return __generator(this, function (_b) {
            try {
                Constants = require('expo-constants').default;
                if ((_a = Constants.expoConfig) === null || _a === void 0 ? void 0 : _a.hostUri) {
                    ip = Constants.expoConfig.hostUri.split(':')[0];
                    setManualIP(ip);
                    react_native_1.Alert.alert('Auto-detected IP', "Found IP from Expo: ".concat(ip, "\n\nTap \"Set Manual IP\" to use this."));
                }
                else {
                    react_native_1.Alert.alert('Info', 'Could not auto-detect IP. Please enter manually.\n\n' +
                        'To find your laptop IP:\n' +
                        '• Mac/Linux: ifconfig | grep "inet "\n' +
                        '• Windows: ipconfig');
                }
            }
            catch (error) {
                react_native_1.Alert.alert('Error', 'Failed to get current IP');
            }
            return [2 /*return*/];
        });
    }); };
    return (<react_native_1.ScrollView style={styles.container}>
      <react_native_1.View style={styles.content}>
        <react_native_1.Text style={styles.title}>Backend Settings</react_native_1.Text>
        
        {/* Current URL */}
        <react_native_1.View style={styles.section}>
          <react_native_1.Text style={styles.sectionTitle}>Current Backend URL</react_native_1.Text>
          <react_native_1.View style={styles.urlBox}>
            <react_native_1.Text style={styles.urlText}>{currentURL}</react_native_1.Text>
          </react_native_1.View>
          
          <react_native_1.TouchableOpacity style={[styles.button, styles.testButton]} onPress={handleTestConnection} disabled={isTesting}>
            {isTesting ? (<react_native_1.ActivityIndicator color="#FFFFFF"/>) : (<react_native_1.Text style={styles.buttonText}>Test Connection</react_native_1.Text>)}
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        {/* Manual IP Input */}
        <react_native_1.View style={styles.section}>
          <react_native_1.Text style={styles.sectionTitle}>Set Manual IP Address</react_native_1.Text>
          <react_native_1.Text style={styles.helpText}>
            Enter your laptop's WiFi IP address (e.g., 192.168.1.100)
          </react_native_1.Text>
          
          <react_native_1.View style={styles.inputRow}>
            <react_native_1.TextInput style={styles.input} value={manualIP} onChangeText={setManualIP} placeholder="192.168.1.100" keyboardType="numeric" autoCapitalize="none" autoCorrect={false}/>
            <react_native_1.TouchableOpacity style={styles.detectButton} onPress={handleGetCurrentIP}>
              <react_native_1.Text style={styles.detectButtonText}>Auto-detect</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          <react_native_1.TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSetManualIP} disabled={isLoading}>
            {isLoading ? (<react_native_1.ActivityIndicator color="#FFFFFF"/>) : (<react_native_1.Text style={styles.buttonText}>Set Manual IP</react_native_1.Text>)}
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        {/* Auto-discover */}
        <react_native_1.View style={styles.section}>
          <react_native_1.Text style={styles.sectionTitle}>Auto-Discovery</react_native_1.Text>
          <react_native_1.Text style={styles.helpText}>
            Automatically find the backend by testing common URLs
          </react_native_1.Text>
          
          <react_native_1.TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleAutoDiscover} disabled={isLoading}>
            {isLoading ? (<react_native_1.ActivityIndicator color="#06B6D4"/>) : (<react_native_1.Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Auto-Discover Backend
              </react_native_1.Text>)}
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        {/* Clear Manual IP */}
        <react_native_1.View style={styles.section}>
          <react_native_1.TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleClearManualIP} disabled={isLoading}>
            <react_native_1.Text style={styles.buttonText}>Clear Manual IP</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.View>

        {/* Help Text */}
        <react_native_1.View style={styles.helpSection}>
          <react_native_1.Text style={styles.helpTitle}>How to find your laptop IP:</react_native_1.Text>
          <react_native_1.Text style={styles.helpText}>
            • Mac/Linux: Open Terminal and run: ifconfig | grep "inet "{'\n'}
            • Windows: Open Command Prompt and run: ipconfig{'\n\n'}
            Look for the IP address starting with 192.168.x.x or 10.x.x.x
          </react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.ScrollView>);
};
exports.SettingsScreen = SettingsScreen;
var styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 20,
    },
    section: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 8,
    },
    urlBox: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    urlText: {
        fontSize: 14,
        color: '#4B5563',
        fontFamily: 'monospace',
    },
    inputRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
    },
    input: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#1F2937',
    },
    detectButton: {
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 16,
        justifyContent: 'center',
    },
    detectButtonText: {
        fontSize: 14,
        color: '#06B6D4',
        fontWeight: '600',
    },
    button: {
        borderRadius: 8,
        padding: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 48,
    },
    primaryButton: {
        backgroundColor: '#06B6D4',
    },
    secondaryButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#06B6D4',
    },
    testButton: {
        backgroundColor: '#10B981',
    },
    dangerButton: {
        backgroundColor: '#EF4444',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    secondaryButtonText: {
        color: '#06B6D4',
    },
    helpSection: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
    },
    helpTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400E',
        marginBottom: 8,
    },
    helpText: {
        fontSize: 13,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 8,
    },
});
