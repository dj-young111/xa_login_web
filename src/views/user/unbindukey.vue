<template>
  <div class='main user-layout-register'>
    <h3><span>解绑U盾</span></h3>
    <a-form ref='formRegister' :form='form' id='formRegister'>
      <a-form-item>
        <a-input
          size='large'
          type='text'
          :placeholder="'登录名'"
          v-decorator="['loginName', {rules: [{ required: true, message: '请输入登录名'}], validateTrigger: 'blur'}]"
        ></a-input>
      </a-form-item>
      <a-form-item>
        <a-input
          size='large'
          :placeholder="UObject.cfcaKeyId ? 'U盾检测成功': 'U盾检测中'"
          disabled
        >
        </a-input>
      </a-form-item>

      <a-form-item>
        <a-input-password
          size='large'
          placeholder='密码'
          v-decorator="[
            'password',
            {rules: [{ required: true, message: $t('user.password.required') }], validateTrigger: 'blur'}
          ]"
        >
          <a-icon slot='prefix' type='lock' :style="{ color: '#A1A1A1' }" />
        </a-input-password>
      </a-form-item>
      <a-form-item>
        <a-input size='large' :placeholder="$t('user.login.mobile.placeholder')" v-model='phone' disabled>
        </a-input>
      </a-form-item>

      <a-row :gutter='16'>
        <a-col class='gutter-row' :span='16'>
          <a-form-item>
            <a-input size='large' type='text' :placeholder="$t('user.login.mobile.verification-code.placeholder')"
                     v-decorator="['captcha', {rules: [{ required: true, message: '请输入验证码' }], validateTrigger: 'blur'}]">
              <a-icon slot='prefix' type='mail' :style="{ color: 'rgba(0,0,0,.25)' }" />
            </a-input>
          </a-form-item>
        </a-col>
        <a-col class='gutter-row' :span='8'>
          <a-button
            class='getCaptcha'
            size='large'
            :disabled='state.smsSendBtn'
            @click.stop.prevent='getCaptcha'
            v-text="!state.smsSendBtn && $t('user.register.get-verification-code')||(state.time+' s')"></a-button>
        </a-col>
      </a-row>

      <a-form-item>
        <div class='btns'>
          <a-button
            size='large'
            type='primary'
            htmlType='submit'
            class='register-button'
            :loading='registerBtn'
            @click.stop.prevent='handleSubmit'
            :disabled='registerBtn'>确定
          </a-button>
          <a-button
            size='large'
            class='register-button'
            @click='gologin'
          >取消
          </a-button>
        </div>

      </a-form-item>

    </a-form>
  </div>
</template>

<script>
import { getSmsCaptcha } from '@/api/login'
import { deviceMixin } from '@/store/device-mixin'
import { checkBrowserUkeyCert, getUkeyInfo, BrowserInfo } from '@/utils/checkBrowserUkeyCert'
import nmCryptokit from '@/utils/nmCryptoKit'
import { putUnBindUkey } from '@/api/clients'
let gt
export default {
  name: 'unbindukey',
  components: {},
  mixins: [deviceMixin],
  data() {
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
  created() {
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

            const uscc = this.UObject.uscc
            getSmsCaptcha({
              loginName: values.loginName,
              uscc: uscc,
              lotNumber: result.lot_number,
              captchaOutput: result.captcha_output,
              passToken: result.pass_token,
              genTime: result.gen_time
            }).then(res => {
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
  mounted() {
    checkBrowserUkeyCert()

    setTimeout(() => {
      getUkeyInfo().then(ukeyInfo => {
        if (ukeyInfo) {
          this.UObject = ukeyInfo
        } else {
          this.UObject = {}
        }
      })
    }, 200)
  },
  methods: {
    gologin() {
      this.$router.push({ name: 'login' })
    },
    handlePasswordCheck(rule, value, callback) {
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
    handleSubmit() {
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
            putUnBindUkey({
              loginName: values.loginName,
              password: values.password,
              captcha: values.captcha,
              uscc,
              cfcaKeyId,
              sign
            }).then(res => {
              if (res.status === 1) {
                this.$message.success('解绑U盾成功', 0)
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

    getCaptcha(e) {
      e.preventDefault()
      const { form: { validateFields }, state, $message, $notification } = this

      validateFields(['loginName'], { force: true },
        (err, values) => {
          if (!err) {
            gt.showCaptcha()
          }
        }
      )
    },
    requestFailed(err) {
      this.$notification['error']({
        message: '错误',
        description: ((err.response || {}).data || {}).message || '请求出现错误，请稍后再试',
        duration: 4
      })
      this.registerBtn = false
    }
  },
  watch: {
    'state.passwordLevel'(val) {
      console.log(val)
    }
  }
}
</script>
<style lang='less'>
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
<style lang='less' scoped>
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
  }

  .login {
    float: right;
    line-height: 40px;
  }
}
</style>
