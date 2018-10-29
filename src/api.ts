import Config, { ResponseValidation } from "./config";
import mergeConfig from "./config/merge";
import axios, { AxiosResponse, AxiosRequestConfig } from "axios";
import cloneDeep from "lodash.clonedeep";
import ResponseValidationContext, {
  ResultType
} from "./response_validation_context";
import Response from "./response";
import ErrorType from "./error_type";
import {
  get as getCancelToken,
  remove as removeCancelToken
} from "./cancel_token_manager";
import { asyncForEach } from "./util";

interface ValidationResult {
  type: ResultType;
  data: any;
}

class Api {
  config: Config;

  constructor(config?: Config) {
    this.config = config || {};
  }

  extend(config: Config) {
    return new Api(mergeConfig(this.config, config));
  }

  headers(method: string): any {
    if (!this.config.headers) {
      return undefined;
    }
    return Object.keys(this.config.headers!).reduce((acc: any, key: string) => {
      const headerValue = this.config.headers![key];
      if (headerValue instanceof Function) {
        acc[key] = headerValue(method);
      } else {
        acc[key] = headerValue;
      }
      return acc;
    }, {});
  }

  transformData(data?: any) {
    if (!data) {
      return data;
    }
    return (this.config.transformData || []).reduce((acc, fn) => {
      return (acc = fn(acc));
    }, cloneDeep(data));
  }

  transformResponse(response?: any) {
    if (!response) {
      return response;
    }
    return (this.config.transformResponse || []).reduce((acc, fn) => {
      return (acc = fn(acc));
    }, cloneDeep(response));
  }

  buildAxiosConfig(
    method: string,
    url: string,
    data?: any
  ): AxiosRequestConfig {
    const transformedData = this.transformData(data);
    return {
      url,
      method,
      headers: this.headers(method),
      baseURL: this.config.baseURL,
      params: method == "get" ? transformedData : undefined,
      data: method != "get" ? transformedData : undefined,
      cancelToken: getCancelToken().token
    };
  }

  executeBefores() {
    (this.config.before || []).forEach(fn => fn());
  }

  executeAfters() {
    (this.config.after || []).forEach(fn => fn());
  }

  async executeResponseValidations(
    response: any,
    orgResponse: AxiosResponse
  ): Promise<ValidationResult> {
    let type = ResultType.NO_ERROR,
      data;

    const validations = this.config.responseValidations || [];
    await asyncForEach(
      validations,
      async (responseValidation: ResponseValidation) => {
        if (type != ResultType.NO_ERROR) {
          return;
        }
        const context = new ResponseValidationContext();
        await responseValidation(response, context, orgResponse);
        if (context.resultType != ResultType.NO_ERROR) {
          type = context.resultType;
          data = context.resultData;
        }
      }
    );
    return { type, data };
  }

  handleException<T>(e: any): Response<T> {
    if (axios.isCancel(e)) {
      return {
        error: true,
        errorType: ErrorType.GOT_CANCELED
      };
    } else {
      return {
        error: true,
        errorType: ErrorType.EXCEPTION,
        errorCode: e
      };
    }
  }

  async transformAndValidateResponse<T>(
    response: AxiosResponse,
    method: string,
    url: string,
    data: any,
    retry: boolean,
    retryNum: number
  ): Promise<Response<T>> {
    const transformedResponse = this.transformResponse(response.data);
    const validationResult = await this.executeResponseValidations(
      transformedResponse,
      response
    );
    const validationResultType = validationResult.type;
    const validationResultData = validationResult.data;
    let result: Response<T>;
    if (validationResultType == ResultType.RETRY) {
      if (!retry || (retry && retryNum > 0)) {
        const num = retry ? retryNum : validationResultData;
        result = await this.requestInternal<T>(
          method,
          url,
          data,
          true,
          num - 1
        );
      } else {
        result = {
          error: true,
          errorType: ErrorType.RETRY_DONE_FAILED,
          errorCode: undefined,
          response: transformedResponse,
          orgResponse: response
        };
      }
    } else if (validationResultType == ResultType.CANCEL_ALL) {
      result = {
        error: true,
        errorType: ErrorType.CANCELED_ALL,
        errorCode: undefined,
        response: transformedResponse,
        orgResponse: response
      };
    } else if (validationResultType == ResultType.ERROR) {
      result = {
        error: true,
        errorType: ErrorType.USER_DEFINED_ERROR,
        errorCode: validationResultData,
        response: transformedResponse,
        orgResponse: response
      };
    } else if (validationResultType == ResultType.NO_ERROR) {
      result = {
        error: false,
        response: transformedResponse,
        orgResponse: response
      };
    } else {
      throw new Error(`validationResultType is ${validationResultType}.`);
    }
    return result;
  }

  async requestInternal<T>(
    method: string,
    url: string,
    data: any,
    retry = false,
    retryNum = 0
  ): Promise<Response<T>> {
    if (!retry) {
      this.executeBefores();
    }
    const config: AxiosRequestConfig = this.buildAxiosConfig(method, url, data);
    let response: AxiosResponse | undefined = undefined;
    let ret: Response<T> | undefined = undefined;
    try {
      response = await axios.request(config);
    } catch (e) {
      ret = this.handleException<T>(e);
    } finally {
      removeCancelToken(config.cancelToken);
    }
    if (!ret) {
      ret = await this.transformAndValidateResponse<T>(
        response!,
        method,
        url,
        data,
        retry,
        retryNum
      );
    }
    if (!retry) {
      this.executeAfters();
    }
    return ret!;
  }

  async request<T = any>(
    method: string,
    url: string,
    data?: any
  ): Promise<Response<T>> {
    return await this.requestInternal<T>(method, url, data);
  }

  async get<T = any>(url: string, data?: any): Promise<Response<T>> {
    return await this.request<T>("get", url, data);
  }

  async post<T = any>(url: string, data?: any): Promise<Response<T>> {
    return await this.request<T>("post", url, data);
  }

  async put<T = any>(url: string, data?: any): Promise<Response<T>> {
    return await this.request<T>("put", url, data);
  }

  async delete<T = any>(url: string, data?: any): Promise<Response<T>> {
    return await this.request<T>("delete", url, data);
  }
}

export default Api;
