import request from '@/utils/request'

/**
 * login func
 * parameter: {
 *     username: '',
 *     password: '',
 *     remember_me: true,
 *     captcha: '12345'
 * }
 * @param parameter
 * @returns {*}
 */

export function getClients () {
  return request({
    url: '/sso/clients',
    method: 'get'
  })
}

export function putModifyPassword (data) {
    return request({
      url: '/user/password',
      method: 'put',
      data
    })
}

export function putModifyPhone (data) {
    return request({
      url: '/user/mobile',
      method: 'put',
      data
    })
}