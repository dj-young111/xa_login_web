<template>
  <page-header-wrapper>
    <a-card :bordered="false">
      <div class="table-page-search-wrapper">
      </div>

      <a-table
        size="default"
        rowKey="key"
        :columns="columns"
        :dataSource="data"
        :pagination='false'
      >
        <span slot="clientName" :class="record.isRedirect ? 'true': 'false'" slot-scope="text, record"  @click="goRedirect(record.website, record)" >
          {{ text }}
        </span>
        <span slot="website" slot-scope="text, record">
          <a  @click="goRedirect(text, record)"><img :src="record.icon" alt="" class="img"></a>
        </span>
      </a-table>
    </a-card>
  </page-header-wrapper>
</template>

<script>
import { STable } from '@/components'
import { getClients } from '@/api/clients'
import {checkIsLogin} from '@/api/login'
const columns = [
  // {
  //   title: '#',
  //   scopedSlots: { customRender: 'serial' }
  // },
  {
    title: '客户端名称',
    dataIndex: 'clientName',
    scopedSlots: { customRender: 'clientName' }
  },
  // {
  //   title: '客户端编码',
  //   dataIndex: 'clientCode',
  //   scopedSlots: { customRender: 'description' }
  // },
  // {
  //   title: '私钥',
  //   dataIndex: 'secretKey'
  // },
  {
    title: '网址',
    dataIndex: 'website',
     scopedSlots: { customRender: 'website' }
  }
]

export default {
  name: 'TableList',
  components: {
    STable
  },
  data () {
    this.columns = columns
    return {
      data: []
    }
  },
  filters: {
  },
  created () {
  },
  mounted () {
    getClients().then(res => {
      console.log(res)
      this.data = res.data
    })
  },
  computed: {
    rowSelection () {
      return {
        selectedRowKeys: this.selectedRowKeys,
        onChange: this.onSelectChange
      }
    }
  },
   methods: {
    goRedirect(text, record) {
      if(!record.isRedirect) {
        return
      }
      checkIsLogin({redirect:text}).then(res => {
          console.log(res)
          if (res.data) {
            location.href = decodeURIComponent(res.data)
          } else {
            this.$message.error({
              message: res.msg,
            })
          }
        })
    }
  },
}
</script>
<style lang="less" scoped>
.img {
  width: 160px;
  height: 60px;
}
.false {
  color: rgb(205, 200, 200);
  
}
.true {
  cursor: pointer;
}
</style>