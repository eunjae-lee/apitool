import axios, { CancelTokenSource, CancelToken } from "axios";
const cancelToken = axios.CancelToken;
let sources: Array<CancelTokenSource> = [];

export function get() {
  const source = cancelToken.source();
  sources.push(source);
  return source;
}

export function remove(cancelToken?: CancelToken) {
  if (!cancelToken) {
    return;
  }
  const index = sources.findIndex(x => x.token == cancelToken);
  if (index != -1) {
    sources.splice(index, 1);
  }
}

export function cancelAll() {
  const copied = sources;
  sources = [];
  copied.forEach(source => {
    try {
      source.cancel();
    } catch (e) {
      // ignore
    }
  });
}
