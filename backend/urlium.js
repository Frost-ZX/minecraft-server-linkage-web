import { isObject } from '@frost-utils/javascript/common/index.js';
import { EVENTS_EMITTER } from './events.js';
import { rconSendDataWait } from './rcon.js';

/**
 * @description 获取方块信息
 * - 示例：`minecraft:redstonr_lamp[lit=true]`
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {string} world
 */
function _getBlockInfo(x = 0, y = 0, z = 0, world = '') {
  if (
    typeof x === 'number' &&
    typeof y === 'number' &&
    typeof z === 'number' &&
    typeof world === 'string'
  ) {
    return rconSendDataWait(`ugetblock ${x} ${y} ${z} ${world}`);
  } else {
    return Promise.resolve(null);
  }
}

/**
 * @description 设置方块信息
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {string} world
 * @param {string} block
 * - 示例：`minecraft:redstonr_lamp[lit=true]`
 */
function _setBlockInfo(x, y, z, world, block) {

  if (
    typeof x !== 'number' ||
    typeof y !== 'number' ||
    typeof z !== 'number' ||
    typeof world !== 'string' ||
    typeof block !== 'string'
  ) {
    return Promise.resolve(false);
  }

  let cmd = `usetblock ${x} ${y} ${z} ${world} ${block} replace`;

  return rconSendDataWait(cmd).then((resData) => {
    // 注：若成功，无返回内容
    return (resData === '');
  });

}

/**
 * @description 将目标位置的方块在红石块和铁块直接变换
 * @param {object} options
 * @param {number} options.x
 * @param {number} options.y
 * @param {number} options.z
 * @param {string} options.world
 * @returns 空字符串：操作失败，on：红石块，off：铁块
 */
function toggleRedstoneBlock(options) {

  if (!isObject(options)) {
    return Promise.resolve('');
  }

  let { x, y, z, world } = options;

  return _getBlockInfo(x, y, z, world).then((blockInfo) => {

    let block = '';

    switch (blockInfo) {
      case 'minecraft:iron_block':
        block = 'minecraft:redstone_block';
        return _setBlockInfo(x, y, z, world, block).then((success) => {
          return success ? 'on' : '';
        });
      case 'minecraft:redstone_block':
        block = 'minecraft:iron_block';
        return _setBlockInfo(x, y, z, world, block).then((success) => {
          return success ? 'off' : '';
        });
      default:
        return Promise.resolve('');
    }

  });

}

/** 监听 URLium 数据 */
export function watchUrliumData() {

  EVENTS_EMITTER.on('urlium_data', function (data) {
    try {

      let parsed0 = JSON.parse(data);
      let parsed1 = null;

      if (parsed0 && parsed0.device === 'message') {
        parsed1 = JSON.parse(parsed0.message);
      } else {
        return;
      }

      let info = null;
      let type = '';

      if (parsed1.function) {
        info = parsed1.function;
        type = 'function'
      } else {
        return;
      }

      if (type === 'function') {

        let { cmd, params } = info;

        if (cmd === 'toggleRedstoneBlock') {
          toggleRedstoneBlock(params).then((result) => {
            EVENTS_EMITTER.emit('web_data', JSON.stringify({
              cmd,
              params,
              result,
            }));
          });
        }

      }

    } catch (error) {
      console.error(error);
    }
  });

}
