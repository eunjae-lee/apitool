import Config from "./config";

class Apitool {
  config: Config;

  static extend(config: Config) {
    const api = new Apitool();
    api.extend(config);
    return api;
  }

  constructor() {
    this.config = {};
  }

  extend(config: Config) {}
}

export default Apitool;
