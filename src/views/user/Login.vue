<template>
  <div class="main">
    <a-form
      id="formLogin"
      class="user-layout-login"
      ref="formLogin"
      :form="form"
      @submit="handleSubmit"
    >
      <a-tabs
        :activeKey="customActiveKey"
        :tabBarStyle="{ textAlign: 'center', borderBottom: 'unset' }"
        @change="handleTabClick"
      >
        <a-tab-pane key="tab1" :tab="'账户密码登录'">
          <a-form-item>
            <a-input size="large" type="text" :placeholder="'手机号'" v-decorator="['mobile', {rules: [{ required: true, pattern: /^1[34578]\d{9}$/, message: $t('user.login.mobile.placeholder') }], validateTrigger: 'change'}]">
              <a-icon slot="prefix" type="mobile" :style="{ color: 'rgba(0,0,0,.25)' }"/>
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
              <a-icon slot="prefix" type="lock" :style="{ color: 'rgba(0,0,0,.25)' }"/>
            </a-input-password>
          </a-form-item>
          <a-form-item>
            <a-input
              size="large"
              :placeholder="UObject ? 'U盾检测成功': 'U盾状态'"
              disabled
            >
            </a-input>
          </a-form-item>
        </a-tab-pane>
        <a-tab-pane key="tab2" :tab="'手机号登录'">
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
      </a-tabs>

      <div id='captcha'></div>
      <a-form-item style="margin-top:24px">
        <a-button
          size="large"
          type="primary"
          htmlType="submit"
          class="login-button"
          :loading="state.loginBtn"
          :disabled="state.loginBtn"
        >登录</a-button>
      </a-form-item>
    </a-form>

    <two-step-captcha
      v-if="requiredTwoStepCaptcha"
      :visible="stepCaptchaVisible"
      @success="stepCaptchaSuccess"
      @cancel="stepCaptchaCancel"
    ></two-step-captcha>
  </div>
</template>

<script>
// import md5 from 'md5'
import { Modal } from 'ant-design-vue'
import TwoStepCaptcha from '@/components/tools/TwoStepCaptcha'
import { mapActions } from 'vuex'
import { timeFix } from '@/utils/util'
import { getSmsCaptcha, get2step, checkIsLogin, checkCfcaKey } from '@/api/login'

let gt
export default {
  components: {
    TwoStepCaptcha
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
        loginBtn: false,
        // login type: 0 email, 1 username, 2 telephone
        loginType: 0,
        smsSendBtn: false
      },
      UObject: ''
    }
  },
  created () {
    get2step({ })
      .then(res => {
        this.requiredTwoStepCaptcha = res.result.stepCode
      })
      .catch(() => {
        this.requiredTwoStepCaptcha = false
      })
    // this.requiredTwoStepCaptcha = true
    initGeetest4({
      captchaId: '6bd3a0e254936eec9549f95c1d45fde9',
      product: 'bind'
    }, (captcha) => {
      gt = captcha
      captcha.onSuccess(() => {
      var result = captcha.getValidate();
      console.log(result)
      const { form: { validateFields }, state } = this
      state.smsSendBtn = true
      const interval = window.setInterval(() => {
        if (state.time-- <= 0) {
          state.time = 60
          state.smsSendBtn = false
          window.clearInterval(interval)
        }
      }, 1000)
      const hide = this.$message.loading('验证码发送中..', 0)
       validateFields(['mobile'], { force: true }, (err, values) => {
        getSmsCaptcha({ mobile: values.mobile, lotNumber: result.lot_number, captchaOutput: result.captcha_output, passToken: result.pass_token, genTime: result.gen_time  }).then(res => {
          setTimeout(hide, 2500)
        }).catch(err => {
          setTimeout(hide, 1)
          clearInterval(interval)
          state.time = 60
          state.smsSendBtn = false
          this.requestFailed(err)
        })
       })
      
    });
    })
  },
  mounted () {
    this.checkUStatus()
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

      const validateFieldsKey = customActiveKey === 'tab1' ? ['mobile', 'password'] : ['mobile', 'captcha']

      validateFields(validateFieldsKey, { force: true }, (err, values) => {
        if (!err) {
          console.log('login form', values)
          const loginParams = { ...values }
          // delete loginParams.username
          // loginParams[!state.loginType ? 'email' : 'username'] = values.username
          loginParams.password = (values.password)
          console.log(loginParams)
          loginParams.subject = this.UObject.subject
          loginParams.cfcaKeyId = this.UObject.cfcaKeyId
          loginParams.sign = this.UObject.sign
          checkCfcaKey(loginParams.mobile).then(result => {
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
      Login(loginParams)
      .then((res) => {
        this.loginSuccess(res)
      })
      .catch(err => {
        this.$notification['error']({
          message: '错误',
          description: ((err.response || {}).data || {}).message || '账号验证失败',
          duration: 4
        })
      }
      )
      .finally(() => {
        state.loginBtn = false
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
        subject: '',
        cfcaKeyId: '',
        sign: ''
      }
    }
  }
}
</script>

<style lang="less" scoped>
.user-layout-login {
  label {
    font-size: 14px;
  }

  .getCaptcha {
    display: block;
    width: 100%;
    height: 40px;
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
