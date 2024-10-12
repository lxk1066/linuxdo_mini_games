import * as os from 'os';

export default function getMemoryUsage() {
  // 获取总内存，单位是字节
  const totalMemory = os.totalmem();

  // 获取可用内存，单位是字节
  const freeMemory = os.freemem();

  // 计算已使用内存
  const usedMemory = totalMemory - freeMemory;

  // 计算内存使用率（乘以 100 得到百分比形式）
  const memoryUsagePercentage = (usedMemory / totalMemory) * 100;

  // 返回内存使用率及其他内存信息
  return {
    totalMemory: (totalMemory / (1024 * 1024)).toFixed(2), // MB
    freeMemory: (freeMemory / (1024 * 1024)).toFixed(2), // MB
    usedMemory: (usedMemory / (1024 * 1024)).toFixed(2), // MB
    memoryUsage: memoryUsagePercentage.toFixed(2), // 百分比
  };
}
