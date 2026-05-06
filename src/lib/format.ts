/**
 * 大数格式化函数
 * - 千分位格式化
 * - ≥1M 显示 "380 万"/"1.96 亿"
 */
export function formatLargeNumber(num: number): string {
  if (num >= 100000000) {
    // 亿级
    const yi = num / 100000000;
    return `${yi.toFixed(2)} 亿`;
  } else if (num >= 10000) {
    // 万级
    const wan = num / 10000;
    return `${wan.toFixed(wan % 1 === 0 ? 0 : 2)} 万`;
  } else if (num >= 1000) {
    // 千分位
    return num.toLocaleString('zh-CN');
  } else {
    return num.toString();
  }
}

/**
 * 货币格式化
 */
export function formatCurrency(num: number, currency: string = '¥'): string {
  return `${currency}${num.toLocaleString('zh-CN')}`;
}

/**
 * 日期格式化
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * 数字格式化（千分位）
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}
