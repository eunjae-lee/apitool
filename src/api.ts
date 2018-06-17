import Config from "./config";
import mergeConfig from "./config/merge";

class Api {
  config: Config;

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
}

export default Api;
