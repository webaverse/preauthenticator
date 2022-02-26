const _getKey = k => window.parent.location.origin + ':' + k;

const messageChannel = new MessageChannel();
const port = messageChannel.port1;
port.addEventListener('message', e => {
  console.log('frame got message', e);
  const {method, data} = e.data;
  
  const _respond = res => {
    port.postMessage(res);
  };
  
  switch (method) {
    case 'get': {
      const {key} = data;
      const k = _getKey(key);
      const value = localStorage.getItem(k);
      _respond({
        value,
      });
      break;
    }
    case 'set': {
      const {key, value} = data;
      const k = _getKey(key);
      localStorage.setItem(k, value);
      _respond({
        ok: true,
      });
      break;
    }
    case 'delete': {
      const {key} = data;
      const k = _getKey(key);
      const deleted = localStorage.removeItem(k);
      _respond({
        deleted,
      });
      break;
    }
    default: {
      _respond({
        error: 'unknown method: ' + method,
      });
      break;
    }
  }
});

globalThis.parent.postMessage({
  kvsInit: true,
  port: messageChannel.port2,
}, '*', [messageChannel.port2]);
port.start();