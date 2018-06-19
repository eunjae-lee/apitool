import { mergeConfigs } from "../src/index";

describe("Config", () => {
  it("merge all configs", () => {
    const config1 = {
      baseURL: "a",
      headers: {
        Abc: "abc"
      },
      before: [
        () => {} //do nothing,
      ],
      after: [
        () => {} //do nothing,
      ],
      transformData: [
        () => {} //do nothing,
      ],
      transformResponse: [
        () => {} // do nothing
      ],
      responseValidations: [
        () => {} //do nothing,
      ]
    };
    const config2 = {
      baseURL: "b",
      headers: {
        Abc: "def"
      },
      before: [
        () => {} //do nothing,
      ],
      after: [
        () => {} //do nothing,
      ],
      transformData: [
        () => {} //do nothing,
      ],
      transformResponse: [
        () => {} // do nothing
      ],
      responseValidations: [
        () => {} //do nothing,
      ]
    };
    const config3 = {
      baseURL: "c",
      headers: {
        Abc: "ghi"
      },
      before: [
        () => {} //do nothing,
      ],
      after: [
        () => {} //do nothing,
      ],
      transformData: [
        () => {} //do nothing,
      ],
      transformResponse: [
        () => {} // do nothing
      ],
      responseValidations: [
        () => {} //do nothing,
      ]
    };

    const config = mergeConfigs(config1, config2, config3);
    expect(config.baseURL).toEqual("c");
    expect(config.headers.Abc).toEqual("ghi");
    expect(config.before).toHaveLength(3);
    expect(config.after).toHaveLength(3);
    expect(config.transformData).toHaveLength(3);
    expect(config.transformResponse).toHaveLength(3);
    expect(config.responseValidations).toHaveLength(3);
  });
});
