import { RCON_HOST, RCON_PASSWORD, RCON_PORT } from './config.js';

import Rcon from 'rcon';

/** 模块名称 */
const PREFIX = '[RCON]';

/** @type {Rcon} */
let connection = null;

/** 发送数据 */
export function rconSendData(data = '') {
  if (connection) {
    connection.send(data);
  } else {
    console.error(PREFIX, '发送失败：未连接');
  }
}

/**
 * @description 发送数据，等待回复
 * @returns {Promise<string | null>}
 */
export function rconSendDataWait(sendData = '') {
  return new Promise((resolve) => {

    if (!connection) {
      console.error(PREFIX, '发送失败：未连接');
      return resolve(null);
    }

    // 处理响应
    let fn = function (resData) {

      // 停止处理超时
      clearTimeout(timer);

      // 停止监听数据
      connection.off('response', fn);

      // 返回数据
      resolve(resData);

    };

    // 处理超时
    let timer = setTimeout(() => {

      console.error(PREFIX, '发送失败：响应超时');

      // 停止监听数据
      connection.off('response', fn);

      // 返回数据
      resolve(null);

    }, 2000);

    // 开始监听数据
    connection.on('response', fn);

    // 发送数据
    connection.send(sendData);

  });

}

/** 开启 RCON 客户端 */
export function startRconClient() {

  let rcon = new Rcon(RCON_HOST, RCON_PORT, RCON_PASSWORD);

  rcon.on('auth', function () {

    // You must wait until this event is fired before sending any commands,
    // otherwise those commands will fail.

    rcon.send('say RCON Connected');
    connection = rcon;

  }).on('response', function (data) {
    if (data) {
      console.log(PREFIX, '收到数据：');
      console.log(data);
    }
  }).on('error', function (error) {

    console.error(PREFIX, '发生错误：');
    console.error(error);

  }).on('end', function () {

    console.log(PREFIX, '连接已关闭');
    connection = null;

  });

  // 连接
  rcon.connect();

}
