import ResponseValidationContext from "./response_validation_context";
import { AxiosResponse } from "axios";

type HeaderFunction = () => string;

interface HeaderTree {
  [key: string]: HeaderFunction | string;
}

type TransformDataFunction = (data: any) => any;

type TransformResponseFunction = (data: any) => any;

export type ResponseValidation = (
  response: any,
  context: ResponseValidationContext,
  orgResponse: AxiosResponse<any>
) => void;

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
