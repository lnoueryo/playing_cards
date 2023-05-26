class WebsocketConnector {

    private id: number;
    private handler: (e: MessageEvent<any>) => void;
    private url: string;
    private connection: WebSocket = null;
    private reconnectInterval: NodeJS.Timer | null;

    constructor(id: number, handler: (e: MessageEvent<any>) => void, url: string = `ws://${location.host}`) {
        this.id = id;
        this.handler = handler
        this.url = url;
        this.reconnectInterval = null;
    }

    connectWebsocket = () => {

      // 既存の再接続処理がある場合はクリア
      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval)
        this.reconnectInterval = null;
      }
      this.connection = new WebSocket(this.url);
      this.connection.onopen = () => {
        this.connection.send(String(this.id));
        // 再接続処理のインターバルをクリア
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      };

      this.connection.onerror = (error) => {
        console.log(`WebSocket error: ${error}`);
        this.tryReconnect();
      };

      this.connection.onclose = () => {
        console.log("WebSocket connection closed");
        this.tryReconnect();
      };

      this.connection.onmessage = (e) => {
        this.handler(e)
      };
    }
    tryReconnect = () => {
      // サーバーが停止している場合等、すぐに再接続が成功しない場合があるため、一定間隔で再接続を試みる
      if (!this.reconnectInterval) {
        this.reconnectInterval = setInterval(() => {
          console.log("Reconnecting WebSocket...");
          this.connectWebsocket();
        }, 5000); // ここでは5秒ごとに再接続を試みていますが、適宜調整してください。
      }
    }
}

export { WebsocketConnector }