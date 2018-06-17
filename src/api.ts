import Config from "./config";
import mergeConfig from "./config/merge";

class Api {
  config: Config;

  static extend(config: Config) {
    return new Api(config);
  }

  constructor(config: Config) {
    this.config = config;
  }

  extend(config: Config) {
    return new Api(mergeConfig(this.config, config));
  }
}

export default Api;
