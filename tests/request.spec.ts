import Api, { ErrorType, Context } from "../src/index";
import _nock from "nock";
import { AxiosResponse } from "axios";

const DUMMY_HOST = "http://unknown.com";

const nock = () => {
  return _nock(DUMMY_HOST).defaultReplyHeaders({
    "access-control-allow-origin": "*"
  });
};

// https://medium.com/@srph/axios-easily-test-requests-f04caf49e057
describe("Request", () => {
  it("requests", async () => {
    const api = new Api();
    nock()
      .get("/")
      .reply(200, "a");
    const { response } = await api.request("get", DUMMY_HOST);
    expect(response).toEqual("a");
  });

  it("transforms data", async () => {
    const api = new Api({
      transformData: [
        data => {
          data["a"] = "c";
          return data;
        }
      ]
    });
    const data = {
      a: "b"
    };
    expect(api.transformData(data)).toEqual({ a: "c" });
  });

  it("transforms response", async () => {
    const api = new Api({
      transformResponse: [
        response => {
          response["a"] = "c";
          return response;
        }
      ]
    });
    const response = {
      a: "b"
    };
    expect(api.transformResponse(response)).toEqual({ a: "c" });
  });

  it("executes `before`", async () => {
    const callback = jest.fn();
    const api = new Api({
      before: [callback]
    });
    nock()
      .get("/")
      .reply(200);
    await api.request("get", DUMMY_HOST);
    expect(callback.mock.calls.length).toEqual(1);
  });

  it("executes `after`", async () => {
    const callback = jest.fn();
    const api = new Api({
      after: [callback]
    });
    nock()
      .get("/")
      .reply(200);
    await api.request("get", DUMMY_HOST);
    expect(callback.mock.calls.length).toEqual(1);
  });

  it("executes `before` and `after`", async () => {
    let foo;
    const api = new Api({
      before: [() => (foo = 1)],
      after: [() => (foo = 2)]
    });
    nock()
      .get("/")
      .reply(200);
    await api.request("get", DUMMY_HOST);
    expect(foo).toEqual(2);
  });

  it("executes `error()` during validating response", async () => {
    const api = new Api({
      responseValidations: [
        (response: AxiosResponse, context: Context) => {
          context.error("code1");
        }
      ]
    });
    nock()
      .get("/")
      .reply(200);
    const { error, errorCode, errorType } = await api.request(
      "get",
      DUMMY_HOST
    );
    expect(error).toBeTruthy();
    expect(errorCode).toEqual("code1");
    expect(errorType).toEqual(ErrorType.USER_DEFINED_ERROR);
  });

  it("executes `retry` during validating response", async () => {
    const api = new Api({
      responseValidations: [
        (response: AxiosResponse, context: Context) => {
          context.retry(10);
        }
      ]
    });
    nock()
      .get("/")
      .times(11)
      .reply(200);
    const { error, errorType } = await api.request("get", DUMMY_HOST);
    expect(error).toBeTruthy();
    expect(errorType).toEqual(ErrorType.RETRY_DONE_FAILED);
  });

  it("executes `cancelAll` during validating response", async done => {
    nock()
      .get("/a")
      .delay(100)
      .reply(200)
      .get("/b")
      .reply(200);
    const api1 = new Api();
    const promise1 = api1.request("get", `${DUMMY_HOST}/a`);
    const api2 = new Api({
      responseValidations: [
        (response: AxiosResponse, context: Context) => {
          context.cancelAll();
        }
      ]
    });
    const promise2 = api2.request("get", `${DUMMY_HOST}/b`);

    Promise.all([promise1, promise2]).then(results => {
      expect(results[0].error).toBeTruthy();
      expect(results[0].errorType).toEqual(ErrorType.GOT_CANCELED);
      expect(results[1].error).toBeTruthy();
      expect(results[1].errorType).toEqual(ErrorType.CANCELED_ALL);
      done();
    });
  });
});
