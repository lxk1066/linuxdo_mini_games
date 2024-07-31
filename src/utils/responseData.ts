// 对响应对象(json)进行统一包装

interface ResponseData<T = any> {
  data: T;
  message: string;
  code: number;
}

export function ResponseData<T = any>(
  code: number,
  message: string,
  data: T,
): ResponseData {
  return {
    data,
    message,
    code,
  };
}
