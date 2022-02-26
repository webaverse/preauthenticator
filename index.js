const parentUrl = document.referrer;
const _getKey = k => parentUrl + ':' + k;

const messageChannel = new MessageChannel();
const port = messageChannel.port1;
port.addEventListener('message', async e => {
  const {method, data} = e.data;
  
  const _jsonParse = s => {
    try {
      return JSON.parse(s);
    } catch (err) {
      return null;
    }
  };
  const _respond = res => {
    port.postMessage(res);
  };
  
  switch (method) {
    case 'callAuthenticatedApi': {
      const {name, query} = data;
      const k = _getKey(name);
      const s = localStorage.getItem(k);
      const o = _jsonParse(s);
      if (o) {
        const res = await fetch(o.url, {
          method: 'POST',
          headers: {
            'Authorization': o.authorization,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(query),
        });
        const j = await res.json();
        _respond(j);
      } else {
        console.warn('no registered api', name);
      }
      break;
    }
    case 'setAuthenticatedApi': {
      const {name, url, authorization} = data;
      const k = _getKey(name);
      localStorage.setItem(k, JSON.stringify({
        url,
        authorization,
      }));
      _respond({
        ok: true,
      });
      break;
    }
    case 'hasAuthenticatedApi': {
      const {name} = data;
      const k = _getKey(name);
      const value = localStorage.getItem(k);
      const has = value !== null;
      _respond({
        has,
      });
      break;
    }
    case 'deleteAuthentictedApi': {
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