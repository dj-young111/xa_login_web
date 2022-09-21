<template>
  <global-footer class="footer custom-render">
    <template v-slot:links>
       Copyright &copy; 2022 雄安新区财政支付中心
    </template>
  </global-footer>
</template>

<script>
import { GlobalFooter } from '@ant-design-vue/pro-layout'

export default {
  name: 'ProGlobalFooter',
  components: {
    GlobalFooter
  }
}
</script>
