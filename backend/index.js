import { startHTTPServer } from './http.js';
import { startRconClient } from './rcon.js';
import { watchUrliumData } from './urlium.js';

const PREFIX = '[process]';

console.clear();

startHTTPServer();
startRconClient();
watchUrliumData();

// 监听输入指令
process.stdin.addListener('data', function (data) {

  let command = String(data).replace(/[\r\n]/g, '');

  console.log(PREFIX, '收到指令 ->', command);

  switch (command) {
    case 'q':
      console.warn(PREFIX, '退出程序');
      process.exit(0);
    default:
      console.error(PREFIX, '指令不存在');
      break;
  }

});
