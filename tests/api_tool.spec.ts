import Apitool from "../src/index";

describe("ApiTool", () => {
  it("has extend", () => {
    const api = Apitool.extend({});
    expect(api).toBeDefined();
  });

  it("merges baseUrl", () => {
    const api = Apitool.extend({ baseURL: "aa" });
    expect(api.config.baseURL).toEqual("aa");
  });
});
