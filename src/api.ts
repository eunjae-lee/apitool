import Config from "./config";
import mergeConfig from "./config/merge";
import axios, { AxiosResponse } from "axios";

class Api {
  config: Config;
  lastResponse?: AxiosResponse<any>;

  static extend(config: Config) {
    return new Api(config);
  }

  constructor(config: Config) {
    if (!config) {
      throw new Error(`config is ${config}`);
    }
    this.config = config;
  }

  extend(config: Config) {
    return new Api(mergeConfig(this.config, config));
  }

  headers(): any {
    if (!this.config.headers) {
      return undefined;
    }
    return Object.keys(this.config.headers!).reduce((acc: any, key: string) => {
      acc[key] = this.config.headers![key]();
      return acc;
    }, {});
  }

  async request(method: string, url: string, data?: any) {
    const response = await axios({
      url,
      method,
      baseURL: this.config.baseURL,
      transformRequest: this.config.transformData,
      transformResponse: this.config.transformResponse
    });
    this.lastResponse = response;
    return response.data;
  }
}

export default Api;
