const endpointUrl = 'https://local.webaverse.com/preauthenticator/';

export const connect = async () => {
  const iframe = document.createElement('iframe');
  // const messageChannel = new MessageChannel();
  const p = new Promise((accept, reject) => {
    iframe.addEventListener('load', () => {
      // console.log('iframe loaded');
      
      const message = e => {
        const {kvsInit} = e.data;
        // console.log('got message data', e.data);
        if (kvsInit) {
          const {port} = e.data;
          accept(port);
          
          window.removeEventListener('message', message);
        }
      };
      window.addEventListener('message', message);
    });
    /* iframe.contentWindow.addEventListener('message', e => {
      console.log('pre load message', e.data);
    }); */
    iframe.addEventListener('error', err => {
      reject(err);
    });
    iframe.src = endpointUrl;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  });
  const port = await p;
  // console.log('got port', port);
  port.request = function(req) {
    return new Promise((accept, reject) => {
      port.addEventListener('message', e => {
        // console.log('got respone', e);
        accept(e.data);
      }, {once: true});
      // console.log('post req', req);
      port.postMessage(req);
    });
  };
  port.callAuthenticatedApi = async (name, query) => {
    const res = await port.request({
      method: 'callAuthenticatedApi',
      data: {
        name,
        query,
      },
    });
    return res;
  };
  port.setAuthenticatedApi = async (name, url, authorization) => {
    const res = await port.request({
      method: 'setAuthenticatedApi',
      data: {
        name,
        url,
        authorization,
      },
    });
    const {ok} = res;
    return ok;
  };
  port.hasAuthenticatedApi = async name => {
    const res = await port.request({
      method: 'hasAuthenticatedApi',
      data: {
        name,
      },
    });
    const {has} = res;
    return has;
  };
  port.deleteAuthenticatedApi = async key => {
    const res = await port.request({
      method: 'delete',
      data: {
        key,
      },
    });
    const {deleted} = res;
    return deleted;
  };
  port.start();

  /* const req = {
    method: 'set',
    data: {
      key: 'lol',
      value: 'zol',
    }
  };
  const res = await port.request(req);
  console.log('got response', req, res); */
  return port;
};