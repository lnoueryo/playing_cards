// AxiosResponse型をインポートします
import { WebsocketConnector } from './websocket';
import { AxiosResponse } from 'axios';

// Promise<any>を返す非同期関数を表す型を定義します
type AsyncFunction = () => Promise<any>;
export const handleAsync = async(handler: AsyncFunction): Promise<any | AxiosResponse<any> | undefined> => {
  try {
    return await handler();
  } catch (error: any) {
    return error.response
  }
}

export { WebsocketConnector }