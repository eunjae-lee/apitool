import Api from "../src/index";
import sinon from "sinon";

// https://medium.com/@srph/axios-easily-test-requests-f04caf49e057
describe("Request", () => {
  let sandbox;
  let server;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    server = sandbox.useFakeServer();
  });
  afterEach(() => {
    server.restore();
    sandbox.restore();
  });
  const fakeResponse = (code, responseHeader, responseBody) => {
    setTimeout(() => server.respond([code, responseHeader, responseBody]), 0);
  };

  it("requests", async () => {
    const api = new Api({});
    fakeResponse(200, {}, "a");
    const response = await api.request("get", "http://unknown.com/api");
    expect(response).toEqual("a");
  });
});
