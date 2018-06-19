import Config from "../config";

function mergeArray(
  arr1: Array<any> | undefined,
  arr2: Array<any> | undefined
) {
  return [...(arr1 || []), ...(arr2 || [])];
}

function mergeObject(obj1: any | undefined, obj2: any | undefined) {
  return {
    ...obj1,
    ...obj2
  };
}

function merge(src: Config, dest: Config): Config {
  return {
    baseURL: dest.baseURL || src.baseURL,
    headers: mergeObject(src.headers, dest.headers),
    transformData: mergeArray(src.transformData, dest.transformData),
    transformResponse: mergeArray(
      src.transformResponse,
      dest.transformResponse
    ),
    before: mergeArray(src.before, dest.before),
    after: mergeArray(src.after, dest.after),
    responseValidations: mergeArray(
      src.responseValidations,
      dest.responseValidations
    )
  };
}

export default merge;
