import { v4 as uuidv4 } from 'uuid';

/**
 * @description 获取 UUID（V4）
 * @param {boolean} split 是否包含分隔线
 */
export function getUUID(split = false) {
  try {
    let uuid = uuidv4();
    return split ? uuid : uuid.replace(/-/g, '');
  } catch (error) {
    console.error('生成 UUID 失败：');
    console.error(error);
    return '';
  }
}
