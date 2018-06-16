import fetch from 'whatwg-fetch';
import urlJoin from 'url-join';
import qs from 'querystring';

const proxy = 'https://cors-proxy.now.sh';

const toUpperCase = (str = '') => str.toUpperCase();

export default function http(url, options = {}) {
  const method = toUpperCase(options.method) || 'GET';
  let headers = options.headers || [];
  headers = Object.keys(headers).map(name =>`${name}|${headers[name]}`);

  url = urlJoin(proxy, `?${ qs.stringify({ method, header: headers, url }) }`);
  return fetch(url).then(resp => resp.text());
}
