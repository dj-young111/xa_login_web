
import nmCryptokit from './nmCryptoKit'
var browser = BrowserInfo();
var CryptoKit = new nmCryptokit(browser.name);
function doLogin() {
    loginName = $('[name=loginName]').val()
    password = $('[name=password]').val()
    if (!loginName || !password) {
        alert("请输入密码");
        return;
    }
    getUkeyInfo().then(ukeyInfo => {
        console.log(ukeyInfo)
        var signSource = loginName + password + ukeyInfo.uscc;
        console.log(signSource)
        CryptoKit.signMsgPKCS7(signSource, "SHA-256", true)
            .then(res => {
                var sign = res.result
                $.ajax({
                    url: "sso/doLogin",
                    type: "post",
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify({
                        "loginName": loginName,
                        "password": password,
                        "uscc": ukeyInfo.uscc,
                        "subject": ukeyInfo.subject,
                        "company": ukeyInfo.company,
                        "cfcaKeyId": ukeyInfo.cfcaKeyId,
                        "sign": sign
                    }),
                    dataType: 'json',
                    success: function (res) {
                        if (res.status == 1) {
                            location.reload();
                        } else {
                            alert(res.message)
                        }
                    },
                })
            })
    });
}

// var CryptoKit;
// checkBrowserUkeyCert()
//检查浏览器 插件 U盾 证书  后 初始化CryptoKit
//return true|false
export function checkBrowserUkeyCert() {
    try {
        // var browser = BrowserInfo();
        //检查是否是支持的浏览器
        if ("Chrome" != browser.name || parseInt(browser.version) <= 59) {
            alert("不支持当前浏览器，请在Chrome浏览器上访问本网站");
            return
        }
        // var CryptoKit = new nmCryptokit(browser.name);
        CryptoKit.init()
            .then(function () {
                return CryptoKit.getExtensionVersion();
            })
            .then(function (response) {
                console.log("extension version: " + response.result);
                return CryptoKit.getHostVersion();
            })
            .then(function (response) {
                console.log("host version: " + response.result);
                return CryptoKit.selectCertificate("", "", "", "");
            })
            .then(function (response) {
            })
            .catch(function (response) {
                if (typeof response.result == "boolean") {
                    if (response.function == "SelectCertificate") {
                        console.log("未检测到有效证书");
                    }
                }
                if (typeof response.result == "string") {
                    if (response.result.startsWith("Extension does not exist")) {
                        console.log("请先参照文档安装Chrome浏览器Key盾插件!")
                    }
                }
                console.log(response.result);
            });
    } catch (e) {
        console.log(e)
    }
}

export function getUkeyInfo() {
    var ukeyInfo = {
        cfcaKeyId: "",
        subject: "",
        uscc: "",
        company: ""
    }
   
    return CryptoKit.selectCertificate("", "", "", "")
        .then((respnse) => {
            return CryptoKit.getSignCertInfo("SubjectDN")
        })
        .then(function (res) {
            ukeyInfo.subject = res.result;
            var arr = ukeyInfo.subject.split("@");
            ukeyInfo.company = arr[1];
            ukeyInfo.uscc = arr[2];
            return CryptoKit.getSignCertInfo("SerialNumber")
        })
        .then(function (res) {
            ukeyInfo.cfcaKeyId = res.result;
            return ukeyInfo
        })
        .catch(function (res) {
            if (typeof res.result == "boolean") {
                if (res.function == "SelectCertificate") {
                    alert("未检测到有效证书");
                }
            }
            // alert(res.result)
        });
}

function OnUnLoad() {
    try {
        CryptoKit.uninit().then(function () {
        });
    } catch (e) {
        console.log(e);
        return;
    }
}

function BrowserInfo() {
    var res = {
        name: "",
        version: "",
    };
    var reg;
    var userAgent = self.navigator.userAgent;
    if (reg = /edge\/([\d\.]+)/i.exec(userAgent)) {
        res.name = "Edge";
        res.version = reg[1];
    } else if (/msie/i.test(userAgent)) {
        res.name = "Internet Explorer";
        res.version = /msie ([\d\.]+)/i.exec(userAgent)[1];
    } else if (/Trident/i.test(userAgent)) {
        res.name = "Internet Explorer";
        res.version = /rv:([\d\.]+)/i.exec(userAgent)[1];
    } else if (/chrome/i.test(userAgent)) {
        res.name = "Chrome";
        res.version = /chrome\/([\d\.]+)/i.exec(userAgent)[1];
    } else if (/safari/i.test(userAgent)) {
        res.name = "Safari";
        res.version = /version\/([\d\.]+)/i.exec(userAgent)[1];
    } else if (/firefox/i.test(userAgent)) {
        res.name = "Firefox";
        res.version = /firefox\/([\d\.]+)/i.exec(userAgent)[1];
    }
    return res;
}



