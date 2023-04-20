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
      <!-- <a-tab-pane key="tab1" :tab="'密码登录'"> -->
      <a-form-item>
        <a-input
          size="large"
          type="text"
          :placeholder="'登录名'"
          v-decorator="['loginName', {rules: [{ required: true, message: '请输入登录名'}], validateTrigger: 'blur'}]">
          <a-icon slot="prefix" type="user" :style="{ color: '#A1A1A1' }" />
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
          <a-icon slot="prefix" type="lock" :style="{ color: '#A1A1A1' }" />
        </a-input-password>
      </a-form-item>
      <a-form-item style="margin-top:24px">
        <a-button
          size="large"
          type="primary"
          htmlType="submit"
          class="login-button"
        >专家登录
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script>
// import md5 from 'md5'
import { Modal } from 'ant-design-vue'
import { mapActions } from 'vuex'
import { timeFix } from '@/utils/util'
import nmCryptokit from '@/utils/nmCryptoKit'
import storage from 'store'
import { expertLogin, checkIsLogin, getInfo, logout } from '@/api/login'
import { ACCESS_TOKEN } from '@/store/mutation-types'

let gt
export default {
  components: {},
  data () {
    return {
      customActiveKey: 'tab1',
      // login type: 0 email, 1 username, 2 telephone
      loginType: 0,
      isLoginError: false,
      requiredTwoStepCaptcha: false,
      stepCaptchaVisible: false,
      form: this.$form.createForm(this),
      state: {
        time: 60,
        // login type: 0 email, 1 username, 2 telephone
        loginType: 0,
        smsSendBtn: false
      },
      UObject: {}
    }
  },
  mounted () {
  },
  methods: {
    ...mapActions(['ExpertLogin', 'Logout']),
    handleTabClick (key) {
      this.customActiveKey = key
    },
    handleSubmit (e) {
      e.preventDefault()
      const {
        form: { validateFields },
        state,
        customActiveKey,
        Login
      } = this
      const validateFieldsKey = ['loginName', 'password']

      validateFields(validateFieldsKey, { force: true }, (err, values) => {
        if (!err) {
          const loginParams = { ...values }
          loginParams.password = (values.password)
          this.goLogin(loginParams)
        }
      })
    },
    goLogin (loginParams) {
      const {
        form: { validateFields },
        state,
        customActiveKey,
        Login
      } = this
      expertLogin(loginParams).then(response => {
        if (response.status === -1) {
          this.$notification['error']({
            message: '错误',
            description: response.message || '请求出现错误，请稍后再试',
            duration: 4
          })
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
          gt.showCaptcha()
        }
      })
    },
    stepCaptchaSuccess () {
      this.loginSuccess()
    },
    stepCaptchaCancel () {
      this.Logout().then(() => {
        this.stepCaptchaVisible = false
      })
    },
    loginSuccess (res) {
      console.log(this.$route.query.redirect)
      if (this.$route.query.redirect) {
        checkIsLogin({ redirect: this.$route.query.redirect }).then(res => {
          if (res.data) {
            location.href = decodeURIComponent(res.data)
          } else {
            this.$message.error({
              message: res.msg
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
    }
  }
}
</script>

<style lang='less' scoped>
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
