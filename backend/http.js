// HTTP 接口

import {
  FastifySSEPlugin
} from 'fastify-sse-v2';

import {
  SERVER_HOST, SERVER_PORT,
} from './config.js';

import {
  EVENTS_EMITTER,
} from './events.js';

import {
  getUUID,
} from './utils.js';

import fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyFormbody from '@fastify/formbody';

/** @typedef { import('fastify').FastifyInstance } FastifyInstance */
/** @typedef { import('fastify').FastifyReply } FastifyReply */

/** 模块名称 */
const PREFIX = '[HTTP]';

/**
 * @description 发送响应数据（JSON）
 * @param {FastifyReply} reply
 * @param {object}       [opts]
 * @param {boolean}      [opts.success]
 * @param {any}          [opts.data]
 * @param {string}       [opts.message]
 */
function sendResponse(reply, opts = {}) {

  let { data = null, message = '', success = false } = opts;

  // 设置类型和编码
  reply.header('Content-Type', 'application/json; charset=utf-8');

  // 发送响应数据
  return reply.send({
    data,
    message,
    success,
  });

}

/** 启动 HTTP 服务 */
export function startHTTPServer() {

  const server = fastify({
    logger: false,
    bodyLimit: 20971520, // 20MB
  });

  // 处理跨域请求
  server.register(fastifyCors, {
    allowedHeaders: ['Content-Type'],
    methods: ['OPTIONS', 'GET', 'POST'],
    origin: '*',
  });

  // 解析 application/x-www-form-urlencoded 请求体
  server.register(fastifyFormbody);

  // SSE
  server.register(FastifySSEPlugin, {
    retryDelay: 1000,
  });

  // Error
  server.setErrorHandler((error, request, reply) => {
    console.error(PREFIX, '处理请求失败：');
    console.error(error);
    reply.code(500);
    return sendResponse(reply, {
      data: null,
      message: 'Internal Server Error',
      success: false,
    });
  });

  // Not Found
  server.setNotFoundHandler((request, reply) => {
    reply.code(404);
    return sendResponse(reply, {
      data: null,
      message: 'Not Found',
      success: false,
    });
  });

  // 路由 - 默认响应
  server.get('/', (request, reply) => {
    return sendResponse(reply, {
      data: null,
      message: 'OK',
      success: true,
    });
  });

  // 路由 - SSE
  server.get('/sse', function (req, res) {

    res.sse({
      id: Date.now(),
      data: JSON.stringify({
        code: 200,
        msg: 'OK',
      }),
      event: 'sse_init',
    });

    // 只有一个有效
    EVENTS_EMITTER.removeAllListeners('urlium_data');

    // 监听
    EVENTS_EMITTER.on('urlium_data', function (data) {
      res.sse({
        id: getUUID(),
        data: data,
        event: 'urlium_data',
      });
    });

  });

  // 路由 - URLium
  server.post('/urlium', (request, reply) => {

    let data = JSON.stringify(request.body);

    console.log(PREFIX, '[URLium] 接收数据：');
    console.log(JSON.parse(data));

    // 转发数据
    EVENTS_EMITTER.emit('urlium_data', data);

    return sendResponse(reply, {
      data: null,
      message: 'OK',
      success: true,
    });

  });

  return server.listen({
    host: SERVER_HOST,
    port: SERVER_PORT,
  }).then(() => {
    console.info(PREFIX, `服务已启动，地址 ${SERVER_HOST}，端口 ${SERVER_PORT}`);
    return true;
  }).catch((error) => {
    console.error(PREFIX, '服务启动失败：');
    console.error(error);
    return false;
  });

}
