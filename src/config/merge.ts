import Config from "../config";

function merge(src: Config, dest: Config): Config {
  return {
    baseURL: dest.baseURL || src.baseURL,
    headers: {
      ...src.headers,
      ...dest.headers
    }
  };
}

export default merge;
