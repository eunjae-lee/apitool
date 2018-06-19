import Api from "../src/index";

describe("Api", () => {
  it("has extend", () => {
    const api = new Api();
    expect(api).toBeDefined();
  });

  it("merges baseUrl", () => {
    const api = new Api({ baseURL: "a" });
    expect(api.config.baseURL).toEqual("a");
  });

  it("extends api", () => {
    const api = new Api({ baseURL: "a" });
    const api2 = api.extend({ baseURL: "b" });
    expect(api2.config.baseURL).toEqual("b");
  });

  it("has header", () => {
    const api = new Api({
      headers: {
        abc: () => "def"
      }
    });
    expect((api.config.headers["abc"] as Function)()).toEqual("def");
  });

  it("overrides header", () => {
    const api = new Api({
      headers: {
        abc: () => "def"
      }
    });
    const api2 = api.extend({
      headers: {
        abc: () => "ghi"
      }
    });
    expect((api2.config.headers["abc"] as Function)()).toEqual("ghi");
  });

  it("gets headers()", () => {
    const api = new Api({
      headers: {
        abc: () => "def"
      }
    });
    expect(api.headers()).toEqual({ abc: "def" });
  });
});
