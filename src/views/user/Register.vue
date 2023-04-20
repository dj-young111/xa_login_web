<template>
  <div class="main user-layout-register">
    <h3><span>忘记密码</span></h3>
    <a-form ref="formRegister" :form="form" id="formRegister">
      <a-form-item>
        <a-input
          size="large"
          type="text"
          :placeholder="'登录名'"
          v-decorator="['loginName', {rules: [{ required: true, message: '请输入登录名'}], validateTrigger: 'blur'}]"
        ></a-input>
      </a-form-item>
      <a-form-item>
        <a-input
          size="large"
          :placeholder="UObject.cfcaKeyId ? 'U盾检测成功': 'U盾检测中'"
          disabled
        >
        </a-input>
      </a-form-item>
      <a-popover
        placement="rightTop"
        :trigger="['focus']"
        :getPopupContainer="(trigger) => trigger.parentElement"
        v-model="state.passwordLevelChecked">
        <template slot="content">
          <div :style="{ width: '240px' }" >
            <div :class="['user-register', passwordLevelClass]">{{ $t(passwordLevelName) }}</div>
            <a-progress :percent="state.percent" :showInfo="false" :strokeColor=" passwordLevelColor " />
            <div style="margin-top: 10px;">
              <span>{{ $t('user.register.password.popover-message') }}
              </span>
            </div>
          </div>
        </template>
        <a-form-item>
          <a-input-password
            size="large"
            @click="handlePasswordInputClick"
            :placeholder="$t('user.register.password.placeholder')"
            v-decorator="['password', {rules: [{ required: true, message: $t('user.password.required') }, { validator: this.handlePasswordLevel }], validateTrigger: ['change', 'blur']}]"
          ></a-input-password>
        </a-form-item>
      </a-popover>

      <a-form-item>
        <a-input-password
          size="large"
          :placeholder="$t('user.register.confirm-password.placeholder')"
          v-decorator="['password2', {rules: [{ required: true, message: $t('user.password.required') }, { validator: this.handlePasswordCheck }], validateTrigger: ['change', 'blur']}]"
        ></a-input-password>
      </a-form-item>

      <a-form-item>
        <a-input size="large" :placeholder="$t('user.login.mobile.placeholder')" v-model="phone" disabled>
        </a-input>
      </a-form-item>
      <!--<a-input-group size="large" compact>
            <a-select style="width: 20%" size="large" defaultValue="+86">
              <a-select-option value="+86">+86</a-select-option>
              <a-select-option value="+87">+87</a-select-option>
            </a-select>
            <a-input style="width: 80%" size="large" placeholder="11 位手机号"></a-input>
          </a-input-group>-->

      <a-row :gutter="16">
        <a-col class="gutter-row" :span="16">
          <a-form-item>
            <a-input size="large" type="text" :placeholder="$t('user.login.mobile.verification-code.placeholder')" v-decorator="['captcha', {rules: [{ required: true, message: '请输入验证码' }], validateTrigger: 'blur'}]">
              <a-icon slot="prefix" type="mail" :style="{ color: 'rgba(0,0,0,.25)' }"/>
            </a-input>
          </a-form-item>
        </a-col>
        <a-col class="gutter-row" :span="8">
          <a-button
            class="getCaptcha"
            size="large"
            :disabled="state.smsSendBtn"
            @click.stop.prevent="getCaptcha"
            v-text="!state.smsSendBtn && $t('user.register.get-verification-code')||(state.time+' s')"></a-button>
        </a-col>
      </a-row>

      <a-form-item>
        <div class="btns">
          <a-button
            size="large"
            type="primary"
            htmlType="submit"
            class="register-button"
            :loading="registerBtn"
            @click.stop.prevent="handleSubmit"
            :disabled="registerBtn">确定
          </a-button>
          <a-button
            size="large"
            class="register-button"
            @click="gologin"
          >取消
          </a-button>
        </div>

        <!-- <router-link class="login" :to="{ name: 'login' }">取消</router-link> -->
      </a-form-item>

    </a-form>
  </div>
</template>

<script>
import { getSmsCaptcha } from '@/api/login'
import { deviceMixin } from '@/store/device-mixin'
import { scorePassword } from '@/utils/util'
import { checkBrowserUkeyCert, getUkeyInfo, BrowserInfo } from '@/utils/checkBrowserUkeyCert'
import nmCryptokit from '@/utils/nmCryptoKit'
import { putResetPwd } from '@/api/clients'

const levelNames = {
  0: 'user.password.strength.short',
  1: 'user.password.strength.low',
  2: 'user.password.strength.medium',
  3: 'user.password.strength.strong'
}
const levelClass = {
  0: 'error',
  1: 'error',
  2: 'warning',
  3: 'success'
}
const levelColor = {
  0: '#ff0000',
  1: '#ff0000',
  2: '#ff7e05',
  3: '#52c41a'
}
let gt
export default {
  name: 'Register',
  components: {
  },
  mixins: [deviceMixin],
  data () {
    return {
      form: this.$form.createForm(this),

      state: {
        time: 60,
        level: 0,
        smsSendBtn: false,
        passwordLevel: 0,
        passwordLevelChecked: false,
        percent: 10,
        progressColor: '#FF0000'
      },
      registerBtn: false,
      UObject: {},
      phone: ''
    }
  },
  computed: {
    passwordLevelClass () {
      return levelClass[this.state.passwordLevel]
    },
    passwordLevelName () {
      return levelNames[this.state.passwordLevel]
    },
    passwordLevelColor () {
      return levelColor[this.state.passwordLevel]
    }
  },
   created () {
    initGeetest4({
      captchaId: '6bd3a0e254936eec9549f95c1d45fde9',
      product: 'bind'
    }, (captchaObj) => {
      gt = captchaObj
      captchaObj.onSuccess(() => {
        var result = captchaObj.getValidate()
        console.log(result)
        this.captchaResult = result
        const { form: { validateFields }, state, $message } = this
        validateFields(['loginName'], { force: true },
        (err, values) => {
           state.smsSendBtn = true
            const interval = window.setInterval(() => {
              if (state.time-- <= 0) {
                state.time = 60
                state.smsSendBtn = false
                window.clearInterval(interval)
              }
            }, 1000)
            const hide = $message.loading('验证码发送中..', 0)
            getSmsCaptcha({ loginName: values.loginName, uscc: this.UObject.uscc, lotNumber: result.lot_number, captchaOutput: result.captcha_output, passToken: result.pass_token, genTime: result.gen_time }).then(res => {
              setTimeout(hide, 2500)
              if (res.status === 1) {
                this.phone = res.data
              } else {
                this.$message.error(res.message, 1)
              }
            }).catch(err => {
              console.log(err)
              setTimeout(hide, 1)
              clearInterval(interval)
              state.time = 60
              state.smsSendBtn = false
            })
        })
      })
    })
  },
  mounted () {
    // this.checkUStatus()
    // console.log(nmCryptokit)
    checkBrowserUkeyCert()

    setTimeout(() => {
      getUkeyInfo().then(ukeyInfo => {
        if (ukeyInfo) {
          this.UObject = ukeyInfo
        } else {
          this.UObject = {}
        }
      })
    }, 3000)
  },
  methods: {
    gologin () {
      this.$router.push({ name: 'login' })
    },
    handlePasswordLevel (rule, value, callback) {
      if (!value) {
       return callback()
      }
      console.log('scorePassword ; ', scorePassword(value))
      if (value.length >= 6) {
        if (scorePassword(value) >= 30) {
          this.state.level = 1
        }
        if (scorePassword(value) >= 60) {
        this.state.level = 2
        }
        if (scorePassword(value) >= 80) {
        this.state.level = 3
        }
      } else {
        this.state.level = 0
        callback(new Error(this.$t('user.password.strength.msg')))
      }
      this.state.passwordLevel = this.state.level
      this.state.percent = this.state.level * 33

      callback()
    },

    handlePasswordCheck (rule, value, callback) {
      const password = this.form.getFieldValue('password')
      // console.log('value', value)
      if (value === undefined) {
        callback(new Error(this.$t('user.password.required')))
      }
      if (value && password && value.trim() !== password.trim()) {
        callback(new Error(this.$t('user.password.twice.msg')))
      }
      callback()
    },

    handlePhoneCheck (rule, value, callback) {
      console.log('handlePhoneCheck, rule:', rule)
      console.log('handlePhoneCheck, value', value)
      console.log('handlePhoneCheck, callback', callback)

      callback()
    },

    handlePasswordInputClick () {
      if (!this.isMobile) {
        this.state.passwordLevelChecked = true
        return
      }
      this.state.passwordLevelChecked = false
    },

    handleSubmit () {
      const { form: { validateFields }, state, $router } = this
      validateFields({ force: true }, (err, values) => {
        if (!err) {
          state.passwordLevelChecked = false
          const uscc = this.UObject.uscc
          const cfcaKeyId = this.UObject.cfcaKeyId
          const signSource = values.loginName + uscc + cfcaKeyId + values.password + values.captcha
          var browser = BrowserInfo()
          var CryptoKit = new nmCryptokit(browser.name)
           CryptoKit.signMsgPKCS7(signSource, 'SHA-256', true).then(res => {
              var sign = res.result
              putResetPwd({ loginName: values.loginName, newPassword: values.password, captcha: values.captcha, uscc, cfcaKeyId, sign }).then(res => {
                if (res.status === 1) {
                  this.$message.success('重置密码成功', 0)
                  $router.push({ name: 'login' })
                } else {
                  this.$message.error(res.message, 0)
                }
              })
          })

          //
        }
      })
    },

    getCaptcha (e) {
      e.preventDefault()
      const { form: { validateFields }, state, $message, $notification } = this

      validateFields(['loginName'], { force: true },
        (err, values) => {
          if (!err) {
            gt.showCaptcha()
            // state.smsSendBtn = true

            // const interval = window.setInterval(() => {
            //   if (state.time-- <= 0) {
            //     state.time = 60
            //     state.smsSendBtn = false
            //     window.clearInterval(interval)
            //   }
            // }, 1000)

            // const hide = $message.loading('验证码发送中..', 0)

            // getSmsCaptcha({ mobile: values.mobile }).then(res => {
            //   setTimeout(hide, 2500)
            //   $notification['success']({
            //     message: '提示',
            //     description: '验证码获取成功，您的验证码为：' + res.result.captcha,
            //     duration: 8
            //   })
            // }).catch(err => {
            //   setTimeout(hide, 1)
            //   clearInterval(interval)
            //   state.time = 60
            //   state.smsSendBtn = false
            //   this.requestFailed(err)
            // })
          }
        }
      )
    },
    requestFailed (err) {
      this.$notification['error']({
        message: '错误',
        description: ((err.response || {}).data || {}).message || '请求出现错误，请稍后再试',
        duration: 4
      })
      this.registerBtn = false
    }
  },
  watch: {
    'state.passwordLevel' (val) {
      console.log(val)
    }
  }
}
</script>
<style lang="less">
  .user-register {

    &.error {
      color: #ff0000;
    }

    &.warning {
      color: #ff7e05;
    }

    &.success {
      color: #52c41a;
    }

  }

  .user-layout-register {
    .ant-input-group-addon:first-child {
      background-color: #fff;
    }
  }
</style>
<style lang="less" scoped>
  .user-layout-register {

    & > h3 {
      font-size: 16px;
      margin-bottom: 20px;
    }

    .getCaptcha {
      display: block;
      width: 100%;
      height: 40px;
    }
    .btns {
      display: flex;
      justify-content: space-between;
    }
    .register-button {
      width: 40%;
      // margin-left: 30px;
    }

    .login {
      float: right;
      line-height: 40px;
    }
  }
</style>
