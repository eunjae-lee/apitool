import ResponseValidationContext from "./response_validation_context";

type Header = () => string;

interface HeaderTree {
  [key: string]: Header;
}

type TransformDataFunction = (data: any) => any;

type TransformResponseFunction = (data: any) => any;

type ResponseValidation = (
  response: any,
  context: ResponseValidationContext
) => any;

interface Config {
  baseURL?: string;
  headers?: HeaderTree;
  transformData?: Array<TransformDataFunction>;
  transformResponse?: Array<TransformResponseFunction>;
  before?: Array<Function>;
  after?: Array<Function>;
  responseValidations?: Array<ResponseValidation>;
}

export default Config;
