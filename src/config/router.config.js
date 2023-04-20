// eslint-disable-next-line
import { UserLayout, BasicLayout, BlankLayout } from '@/layouts'
import { bxAnaalyse } from '@/core/icons'

const RouteView = {
  name: 'RouteView',
  render: h => h('router-view')
}

export const asyncRouterMap = [
  // {
  //   path: '/',
  //   name: 'index',
  //   component: BasicLayout,
  //   meta: { title: 'menu.home' },
  //   redirect: '/dashboard/workplace',
  //   children: [
  //     // dashboard
  //     {
  //       path: '/dashboard',
  //       name: 'dashboard',
  //       redirect: '/dashboard/workplace',
  //       component: RouteView,
  //       meta: { title: 'menu.dashboard', keepAlive: true, icon: bxAnaalyse, permission: ['dashboard'] },
  //       children: [
  //         {
  //           path: '/dashboard/analysis/:pageNo([1-9]\\d*)?',
  //           name: 'Analysis',
  //           component: () => import('@/views/dashboard/Analysis'),
  //           meta: { title: 'menu.dashboard.analysis', keepAlive: false, permission: ['dashboard'] }
  //         },
  //         // 外部链接
  //         {
  //           path: 'https://www.baidu.com/',
  //           name: 'Monitor',
  //           meta: { title: 'menu.dashboard.monitor', target: '_blank' }
  //         },
  //         {
  //           path: '/dashboard/workplace',
  //           name: 'Workplace',
  //           component: () => import('@/views/dashboard/Workplace'),
  //           meta: { title: 'menu.dashboard.workplace', keepAlive: true, permission: ['dashboard'] }
  //         }
  //       ]
  //     },
  //     // Exception
  //     {
  //       path: '/exception',
  //       name: 'exception',
  //       component: RouteView,
  //       redirect: '/exception/403',
  //       meta: { title: 'menu.exception', icon: 'warning', permission: ['exception'] },
  //       children: [
  //         {
  //           path: '/exception/403',
  //           name: 'Exception403',
  //           component: () => import(/* webpackChunkName: "fail" */ '@/views/exception/403'),
  //           meta: { title: 'menu.exception.not-permission', permission: ['exception'] }
  //         },
  //         {
  //           path: '/exception/404',
  //           name: 'Exception404',
  //           component: () => import(/* webpackChunkName: "fail" */ '@/views/exception/404'),
  //           meta: { title: 'menu.exception.not-find', permission: ['exception'] }
  //         },
  //         {
  //           path: '/exception/500',
  //           name: 'Exception500',
  //           component: () => import(/* webpackChunkName: "fail" */ '@/views/exception/500'),
  //           meta: { title: 'menu.exception.server-error', permission: ['exception'] }
  //         }
  //       ]
  //     }
  //   ]
  // },
  {
    path: '*',
    redirect: '/404',
    hidden: true
  }
]

/**
 * 基础路由
 * @type { *[] }
 */
export const constantRouterMap = [
  {
    path: '/',
    name: 'index',
    component: BasicLayout,
    meta: { title: 'menu.home' },
    redirect: '/index',
    children: [
      // Exception
      {
        path: '/clients',
        name: 'clients',
        component: RouteView,
        redirect: '/index',
        meta: { title: '个人中心', icon: 'table' },
        children: [
          {
            path: '/index',
            name: 'index',
            component: () => import(/* webpackChunkName: "fail" */ '@/views/clients/TableList'),
            meta: { title: '客户端列表' }
          },
          {
            path: '/mobile',
            name: 'mobile',
            component: () => import(/* webpackChunkName: "fail" */ '@/views/user/modifyPhone'),
            meta: { title: '修改手机号' }
          },
          {
            path: '/pwd',
            name: 'pwd',
            component: () => import(/* webpackChunkName: "fail" */ '@/views/user/modifyPassword'),
            meta: { title: '修改密码' }
          }
        ]
      }
    ]
  },
  {
    path: '/user',
    component: UserLayout,
    redirect: '/login',
    hidden: true,
    children: [
      {
        path: '/login',
        name: 'login',
        component: () => import(/* webpackChunkName: "user" */ '@/views/user/Login')
      },
      {
        path: '/expertlogin',
        name: 'expertlogin',
        component: () => import(/* webpackChunkName: "user" */ '@/views/user/expertlogin.vue')
      },
      {
        path: '/forgot',
        name: 'forgot',
        component: () => import(/* webpackChunkName: "user" */ '@/views/user/Register')
      }
      // {
      //   path: 'register-result',
      //   name: 'registerResult',
      //   component: () => import(/* webpackChunkName: "user" */ '@/views/user/RegisterResult')
      // },
      // {
      //   path: 'recover',
      //   name: 'recover',
      //   component: undefined
      // }
    ]
  },
  {
    path: '/404',
    component: () => import(/* webpackChunkName: "fail" */ '@/views/exception/404')
  }
]
