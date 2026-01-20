/**
 * Export utilities for data export functionality
 */

// 导出为 CSV 格式
export const exportToCSV = (data: any[], filename: string, headers?: Record<string, string>) => {
  if (!data || data.length === 0) {
    throw new Error('没有数据可导出');
  }

  // 获取所有字段
  const allKeys = Array.from(new Set(data.flatMap(item => Object.keys(item))));
  
  // 生成 CSV 头部
  const csvHeaders = allKeys.map(key => headers?.[key] || key).join(',');
  
  // 生成 CSV 数据行
  const csvRows = data.map(item => 
    allKeys.map(key => {
      const value = item[key];
      // 处理包含逗号、换行符或引号的值
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',')
  );

  // 组合完整的 CSV 内容
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  
  // 添加 BOM 以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // 创建下载链接
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 导出为 Excel 格式（简化版，使用 CSV 格式但 .xlsx 扩展名）
export const exportToExcel = (data: any[], filename: string, headers?: Record<string, string>) => {
  if (!data || data.length === 0) {
    throw new Error('没有数据可导出');
  }

  // 获取所有字段
  const allKeys = Array.from(new Set(data.flatMap(item => Object.keys(item))));
  
  // 生成表格数据
  const tableData = [
    allKeys.map(key => headers?.[key] || key), // 头部
    ...data.map(item => allKeys.map(key => item[key] || '')) // 数据行
  ];

  // 转换为 CSV 格式
  const csvContent = tableData.map(row => 
    row.map(cell => {
      const value = String(cell);
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  ).join('\n');

  // 添加 BOM 以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  
  // 创建下载链接
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 导出为 JSON 格式
export const exportToJSON = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    throw new Error('没有数据可导出');
  }

  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 通用导出函数
export const exportData = (
  data: any[], 
  filename: string, 
  format: 'csv' | 'excel' | 'json' = 'excel',
  headers?: Record<string, string>
) => {
  try {
    switch (format) {
      case 'csv':
        exportToCSV(data, filename, headers);
        break;
      case 'excel':
        exportToExcel(data, filename, headers);
        break;
      case 'json':
        exportToJSON(data, filename);
        break;
      default:
        throw new Error('不支持的导出格式');
    }
    return true;
  } catch (error) {
    console.error('导出失败:', error);
    throw error;
  }
};