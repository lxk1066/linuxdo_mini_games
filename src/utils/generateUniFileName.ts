import * as crypto from 'crypto';
import * as path from 'path';

// 生成唯一的文件名
export default function generateUniqueFileName(
  originalFileName: string,
  uid: string,
): string {
  const fileExt = path.extname(originalFileName);
  const timestamp = Date.now().toString(); // 获取当前系统时间
  const randomString = Math.random().toString(36).substring(2, 14); // 生成随机字符串
  const hash = crypto
    .createHash('sha1')
    .update(`${uid}_${originalFileName}_${timestamp}_${randomString}`)
    .digest('hex'); // 使用原始文件名 + 时间戳 + 随机字符串的哈希值来保证唯一性
  const uniqueFileName = `${uid}-${hash}${fileExt}`; // 保留用户ID防止hash碰撞导致冲突
  return uniqueFileName;
}
