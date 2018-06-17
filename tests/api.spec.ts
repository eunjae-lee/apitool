import Api from "../src/index";

describe("ApiTool", () => {
  it("has extend", () => {
    const api = Api.extend({});
    expect(api).toBeDefined();
  });

  it("merges baseUrl", () => {
    const api = Api.extend({ baseURL: "a" });
    expect(api.config.baseURL).toEqual("a");
  });

  it("extends api", () => {
    const api = Api.extend({ baseURL: "a" });
    const api2 = api.extend({ baseURL: "b" });
    expect(api2.config.baseURL).toEqual("b");
  });

  it("has header", () => {
    const api = Api.extend({
      headers: {
        abc: () => "def"
      }
    });
    expect(api.config.headers["abc"]()).toEqual("def");
  });

  it("overrides header", () => {
    const api = Api.extend({
      headers: {
        abc: () => "def"
      }
    });
    const api2 = api.extend({
      headers: {
        abc: () => "ghi"
      }
    });
    expect(api2.config.headers["abc"]()).toEqual("ghi");
  });

  it("gets headers()", () => {
    const api = Api.extend({
      headers: {
        abc: () => "def"
      }
    });
    expect(api.headers()).toEqual({ abc: "def" });
  });
});
