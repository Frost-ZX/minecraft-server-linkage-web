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
  return rconSendDataWait(`ugetblock ${x} ${y} ${z} ${world}`);
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
function _setBlockInfo(x = 0, y = 0, z = 0, world = '', block = '') {

  let cmd = `usetblock ${x} ${y} ${z} ${world} ${block} replace`;

  return rconSendDataWait(cmd).then((resData) => {
    // 注：若成功，无返回内容
    return (resData === '');
  });

}

/**
 * @description 将方块变为红石块或铁块
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {string} world
 */
function toggleRedstoneBlock(x, y, z, world) {

  if (
    typeof x === 'undefined' ||
    typeof y === 'undefined' ||
    typeof z === 'undefined' ||
    typeof world === 'undefined'
  ) {
    return Promise.resolve();
  }

  return _getBlockInfo(x, y, z, world).then((blockInfo) => {
    switch (blockInfo) {
      case 'minecraft:iron_block':
        _setBlockInfo(x, y, z, world, 'minecraft:redstone_block');
        break;
      case 'minecraft:redstone_block':
        _setBlockInfo(x, y, z, world, 'minecraft:iron_block');
        break;
      default:
        break;
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

      let type = parsed1.type;

      if (type === 'function') {

        let fnName = parsed1.name;
        let params = parsed1.params;

        if (fnName === 'toggleRedstoneBlock') {
          toggleRedstoneBlock.apply(null, params);
        }

      }

    } catch (error) {
      console.error(error);
    }
  });

}
