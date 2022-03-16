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
      const {name, url, query} = data;
      const k = _getKey(name);
      const s = localStorage.getItem(k);
      const o = _jsonParse(s);
      if (o) {
        const storedOrigin = o.origin;
        const requestUrl = new URL(url);
        if (storedOrigin === requestUrl.origin) {
          const res = await fetch(requestUrl, {
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
          _respond({
            error: 'origin mismatch: ' + storedOrigin + ' != ' + requestUrl.origin,
          });
        }
      } else {
        console.warn('no registered api', name);
      }
      break;
    }
    case 'setAuthenticatedApi': {
      const {name, origin, authorization} = data;
      const k = _getKey(name);
      localStorage.setItem(k, JSON.stringify({
        origin,
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
    case 'deleteAuthenticatedApi': {
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
