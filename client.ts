import http, { IncomingMessage, ClientRequest, IncomingHttpHeaders } from 'http';
import WebSocket from 'ws';

const httpClient = (path: string) => {

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: 'GET',
    headers: {
      'Cookie': 'sessionid=123;'
    }
  };

  const req: ClientRequest = http.request(options, (res: IncomingMessage) => {
      let data = '';

      res.on('data', (chunk: any) => {
          data += chunk;
      });

      res.on('end', () => {
          console.log(data);
      });
  });

  req.on('error', (error: Error) => {
      console.error(`Problem with request: ${error.message}`);
  });

  req.end();
}


const WSClient = (id: string) => {
  const url = 'ws://localhost:3000';
  const connection = new WebSocket(url);

  connection.onopen = () => {
    connection.send(id);
  };

  connection.onerror = (error) => {
    console.log(`WebSocket error: ${error}`);
  };

  connection.onmessage = (e) => {
    console.log(e.data);
  };
}
console.log(process.argv);
if(process.argv[2] == 'ws') WSClient(process.argv[3])
if(process.argv[2] == 'http') httpClient(process.argv[3])
// httpClient()
// WSClient()