<template>
  <div class="main">
    <div class="name">统一登录平台</div>
    <a-form
      id="formLogin"
      class="user-layout-login"
      ref="formLogin"
      :form="form"
      @submit="handleSubmit"
    >
      <!-- <a-tabs
        :activeKey="customActiveKey"
        :tabBarStyle="{ textAlign: 'center', borderBottom: 'unset' }"
        @change="handleTabClick"
      > -->
        <!-- <a-tab-pane key="tab1" :tab="'密码登录'"> -->
          <a-form-item>
            <a-input size="large" type="text" :placeholder="'登录名'" v-decorator="['loginName', {rules: [{ required: true, message: '请输入登录名'}], validateTrigger: 'blur'}]">
              <a-icon slot="prefix" type="user" :style="{ color: '#A1A1A1' }"/>
            </a-input>
          </a-form-item>

          <a-form-item>
            <a-input-password
              size="large"
              placeholder="密码"
              v-decorator="[
                'password',
                {rules: [{ required: true, message: $t('user.password.required') }], validateTrigger: 'blur'}
              ]"
            >
              <a-icon slot="prefix" type="lock" :style="{ color: '#A1A1A1' }"/>
            </a-input-password>
          </a-form-item>
          <!-- <a-form-item>
            <a-input size="large" type="text" :placeholder="'uscc'" v-decorator="['uscc', {rules: [{ required: true, message: '请输入uscc'}], validateTrigger: 'blur'}]">
            </a-input>
          </a-form-item> -->
        <!-- </a-tab-pane> -->
        <!-- <a-tab-pane key="tab2" :tab="'验证码登录'">
          <a-form-item>
            <a-input size="large" type="text" :placeholder="'手机号'" v-decorator="['mobile', {rules: [{ required: true, pattern: /^1[34578]\d{9}$/, message: $t('user.login.mobile.placeholder') }], validateTrigger: 'change'}]">
              <a-icon slot="prefix" type="mobile" :style="{ color: 'rgba(0,0,0,.25)' }"/>
            </a-input>
          </a-form-item>

          <a-row :gutter="16">
            <a-col class="gutter-row" :span="16">
              <a-form-item>
                <a-input size="large" type="text" :placeholder="'验证码'" v-decorator="['captcha', {rules: [{ required: true, message: $t('user.verification-code.required') }], validateTrigger: 'blur'}]">
                  <a-icon slot="prefix" type="mail" :style="{ color: 'rgba(0,0,0,.25)' }"/>
                </a-input>
              </a-form-item>
            </a-col>
            <a-col class="gutter-row" :span="8">
              <a-button
                class="getCaptcha"
                tabindex="-1"
                :disabled="state.smsSendBtn"
                @click.stop.prevent="getCaptcha"
                v-text="!state.smsSendBtn && '获取验证码' || (state.time+' s')"
              ></a-button>
            </a-col>
          </a-row>
        </a-tab-pane>
      </a-tabs> -->
       <a-form-item>
            <a-input
              size="large"
              :placeholder="UObject.cfcaKeyId ? 'U盾检测成功': 'U盾检测中'"
              disabled
            >
            </a-input>
          </a-form-item>
      <div id='captcha'></div>
      <div v-if="UObject.cfcaKeyId" class="text">
        U盾ID：{{UObject.cfcaKeyId}}
      </div>
      <div v-if="UObject.cfcaKeyId" class="text">
        企业名称：{{UObject.company}}
      </div>
      <div v-if="UObject.cfcaKeyId" class="text">
        企业信用代码编号：{{UObject.uscc}}
      </div>
      <a-form-item>
        <a href="https://ssoserver-1306199973.cos.ap-beijing.myqcloud.com/CFCA%20.pdf" target="_blank">Cfca Key盾使用手册</a>
        <router-link
          :to="{ name: 'forgot' }"
          class="forge-password"
          style="float: right;"
        >忘记密码</router-link>
      </a-form-item>
      <a-form-item style="margin-top:24px">
        <a-button
          size="large"
          type="primary"
          htmlType="submit"
          class="login-button"
          
          :disabled="state.loginBtn"
        >登录</a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script>
// import md5 from 'md5'
import { Modal } from 'ant-design-vue'
import { mapActions } from 'vuex'
import { timeFix } from '@/utils/util'
import { getSmsCaptcha, get2step, checkIsLogin, checkCfcaKey } from '@/api/login'
import {checkBrowserUkeyCert, getUkeyInfo, BrowserInfo} from '@/utils/checkBrowserUkeyCert'
import nmCryptokit from '@/utils/nmCryptoKit'
import storage from 'store'
import { login, getInfo, logout } from '@/api/login'
import { ACCESS_TOKEN } from '@/store/mutation-types'


let gt
export default {
  components: {
  },
  data () {
    return {
      customActiveKey: 'tab1',
      loginBtn: false,
      // login type: 0 email, 1 username, 2 telephone
      loginType: 0,
      isLoginError: false,
      requiredTwoStepCaptcha: false,
      stepCaptchaVisible: false,
      form: this.$form.createForm(this),
      state: {
        time: 60,
        loginBtn: true,
        // login type: 0 email, 1 username, 2 telephone
        loginType: 0,
        smsSendBtn: false
      },
      UObject: {}
    }
  },
  created () {
    // initGeetest4({
    //   captchaId: '6bd3a0e254936eec9549f95c1d45fde9',
    //   product: 'bind'
    // }, (captcha) => {
    //   gt = captcha
    //   captcha.onSuccess(() => {
    //   var result = captcha.getValidate();
    //   console.log(result)
    //   const { form: { validateFields }, state } = this
    //   state.smsSendBtn = true
    //   const interval = window.setInterval(() => {
    //     if (state.time-- <= 0) {
    //       state.time = 60
    //       state.smsSendBtn = false
    //       window.clearInterval(interval)
    //     }
    //   }, 1000)
    //   const hide = this.$message.loading('验证码发送中..', 0)
    //    validateFields(['mobile'], { force: true }, (err, values) => {
    //     getSmsCaptcha({ mobile: values.mobile, lotNumber: result.lot_number, captchaOutput: result.captcha_output, passToken: result.pass_token, genTime: result.gen_time  }).then(res => {
    //       setTimeout(hide, 2500)
    //     }).catch(err => {
    //       setTimeout(hide, 1)
    //       clearInterval(interval)
    //       state.time = 60
    //       state.smsSendBtn = false
    //       this.requestFailed(err)
    //     })
    //    })
      
    // });
    // })
  },
  mounted () {
    // this.checkUStatus()
    // console.log(nmCryptokit)
    checkBrowserUkeyCert()

    setTimeout(() => {
      getUkeyInfo().then(ukeyInfo => {
        if (ukeyInfo) {
          ukeyInfo.uscc = ukeyInfo.uscc.substr(1)
          this.UObject = ukeyInfo
          this.state.loginBtn = false
        } else {
          this.UObject = {}
          this.state.loginBtn = true
        }
        
      })
    }, 3000)
  },
  methods: {
    ...mapActions(['Login', 'Logout']),
    handleTabClick (key) {
      this.customActiveKey = key
      // this.form.resetFields()
    },
    handleSubmit (e) {
      e.preventDefault()
      const {
        form: { validateFields },
        state,
        customActiveKey,
        Login
      } = this
      

      state.loginBtn = true

      const validateFieldsKey = ['loginName', 'password', 'uscc']

      validateFields(validateFieldsKey, { force: true }, (err, values) => {
        
        if (!err) {
          console.log('login form', values)
          const loginParams = { ...values }
         
          loginParams.password = (values.password)
          console.log(loginParams)
          getUkeyInfo().then(ukeyInfo => {
            console.log(ukeyInfo)
            ukeyInfo.uscc = ukeyInfo.uscc.substr(1)
            this.UObject = ukeyInfo
            var signSource = loginParams.loginName + loginParams.password + ukeyInfo.uscc;
            console.log(signSource)
            var browser = BrowserInfo();
            var CryptoKit = new nmCryptokit(browser.name);
            CryptoKit.signMsgPKCS7(signSource, "SHA-256", true).then(res => {
              var sign = res.result
              loginParams.subject = this.UObject.subject
              loginParams.cfcaKeyId = this.UObject.cfcaKeyId
              loginParams.sign = sign
            checkCfcaKey(loginParams.loginName,  this.UObject.uscc).then(result => {
              if (result.data === 1) {
                this.goLogin(loginParams)
              } else {
                Modal.confirm({
                  title: '信息',
                  content: '确认绑定U盾并登录吗',
                  okText: '确认',
                  cancelText: '取消',
                  onOk: () => {
                    this.goLogin(loginParams)
                  },
                  onCancel () {
                    state.loginBtn = false
                  }
                })
              }
            })
              })
            })
          // loginParams.uscc = this.UObject.uscc
          
         
        } else {
          setTimeout(() => {
            state.loginBtn = false
          }, 600)
        }
      })
    },
    goLogin(loginParams) {
      const {
        form: { validateFields },
        state,
        customActiveKey,
        Login
      } = this
      // Login(loginParams)
      // .then((res) => {
      //   this.loginSuccess(res)
      // })
      // .catch(err => {
      //   this.$notification['error']({
      //     message: '错误',
      //     description: ((err.response || {}).data || {}).message || '账号验证失败',
      //     duration: 4
      //   })
      // }
      // )
      // .finally(() => {
      //   state.loginBtn = false
      // })
      login(loginParams).then(response => {
          if (response.status === -1) {
            this.$notification['error']({
              message: '错误',
              description: response.message || '请求出现错误，请稍后再试',
              duration: 4
            })
            this.state.loginBtn = false
          } else {
            const result = response.data
            storage.set(ACCESS_TOKEN, result.token, new Date().getTime() + 7 * 24 * 60 * 60 * 1000)
            this.$store.commit('SET_TOKEN', result.token)
            storage.set('name', result.mobile)
            storage.set('loginName', result.loginName)
            this.loginSuccess()
          }
        }).catch(error => {
          // reject(error)
        })

    },
    getCaptcha (e) {
      e.preventDefault()
      const { form: { validateFields }, state } = this
      
      validateFields(['mobile'], { force: true }, (err, values) => {
        if (!err) {
          gt.showCaptcha();
          
        }
      })
    },
    stepCaptchaSuccess () {
      this.loginSuccess()
    },
    stepCaptchaCancel () {
      this.Logout().then(() => {
        this.loginBtn = false
        this.stepCaptchaVisible = false
      })
    },
    loginSuccess (res) {
      if (this.$route.query.redirect) {
        checkIsLogin({redirect: this.$route.query.redirect}).then(res => {
          console.log(res)
          if (res.data) {
            location.href = decodeURIComponent(res.data)
          } else {
            this.$message.error({
              message: res.msg,
            })
          }
        })
      } else {
        this.$router.push({ path: '/' })
      // 延迟 1 秒显示欢迎信息
      setTimeout(() => {
        this.$notification.success({
          message: '欢迎',
          description: `${timeFix()}，欢迎回来`
        })
      }, 1000)
      this.isLoginError = false
      }
      
    },
    requestFailed (err) {
      this.isLoginError = true
      this.$notification['error']({
        message: '错误',
        description: ((err.response || {}).data || {}).message || '请求出现错误，请稍后再试',
        duration: 4
      })
    },
    // 检测u盾状态
    checkUStatus() {
      this.UObject = {
        uscc: '',
        subject: '',
        cfcaKeyId: '',
        sign: ''
      }
    }
  }
}
</script>

<style lang="less" scoped>
.main {
  // min-height: 100vh;
}
.name {
  font-size: 18px;
  font-family: MiSans-Demibold, MiSans;
  font-weight: 600;
  color: #003AB0;
  text-align: center;
  margin-bottom: 20px;
}
.user-layout-login {
  label {
    font-size: 14px;
  }

  .getCaptcha {
    display: block;
    width: 100%;
    height: 40px;
  }

  .text {
    font-size: 14px;
  }
  .forge-password {
    font-size: 14px;
  }

  button.login-button {
    padding: 0 15px;
    font-size: 16px;
    height: 40px;
    width: 100%;
  }

  .user-login-other {
    text-align: left;
    margin-top: 24px;
    line-height: 22px;

    .item-icon {
      font-size: 24px;
      color: rgba(0, 0, 0, 0.2);
      margin-left: 16px;
      vertical-align: middle;
      cursor: pointer;
      transition: color 0.3s;

      &:hover {
        color: #1890ff;
      }
    }

    .register {
      float: right;
    }
  }
}
</style>
