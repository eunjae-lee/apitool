'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var axios = _interopDefault(require('axios'));
var cloneDeep = _interopDefault(require('lodash.clonedeep'));

function merge(src, dest) {
    return {
        baseURL: dest.baseURL || src.baseURL,
        headers: {
            ...src.headers,
            ...dest.headers
        }
    };
}

const cancelToken = axios.CancelToken;
let sources = [];
function get() {
    const source = cancelToken.source();
    sources.push(source);
    return source;
}
function remove(cancelToken) {
    if (!cancelToken) {
        return;
    }
    const index = sources.findIndex(x => x.token == cancelToken);
    if (index != -1) {
        sources.splice(index, 1);
    }
}
function cancelAll() {
    const copied = sources;
    sources = [];
    copied.forEach(source => {
        try {
            source.cancel();
        }
        catch (e) {
            // ignore
        }
    });
}

var ResultType;
(function (ResultType) {
    ResultType["NO_ERROR"] = "";
    ResultType["ERROR"] = "error";
    ResultType["RETRY"] = "retry";
    ResultType["CANCEL_ALL"] = "cancelAll";
})(ResultType || (ResultType = {}));
class ResponseValidationContext {
    constructor() {
        this.resultType = ResultType.NO_ERROR;
    }
    error(errorCode) {
        this.setResult(ResultType.ERROR, errorCode);
    }
    retry(retryNum = 1) {
        this.setResult(ResultType.RETRY, retryNum);
    }
    cancelAll() {
        this.setResult(ResultType.CANCEL_ALL);
        cancelAll();
    }
    setResult(resultType, resultData) {
        if (this.resultType) {
            throw new Error(`You already invoked ${this.resultType}.`);
        }
        this.resultType = resultType;
        this.resultData = resultData;
    }
}

var ErrorType;
(function (ErrorType) {
    ErrorType[ErrorType["RETRY_DONE_FAILED"] = 0] = "RETRY_DONE_FAILED";
    ErrorType[ErrorType["CANCELED_ALL"] = 1] = "CANCELED_ALL";
    ErrorType[ErrorType["GOT_CANCELED"] = 2] = "GOT_CANCELED";
    ErrorType[ErrorType["EXCEPTION"] = 3] = "EXCEPTION";
    ErrorType[ErrorType["USER_DEFINED_ERROR"] = 4] = "USER_DEFINED_ERROR";
})(ErrorType || (ErrorType = {}));
var ErrorType$1 = ErrorType;

class Api {
    static extend(config) {
        return new Api(config);
    }
    constructor(config) {
        this.config = config || {};
    }
    extend(config) {
        return new Api(merge(this.config, config));
    }
    headers() {
        if (!this.config.headers) {
            return undefined;
        }
        return Object.keys(this.config.headers).reduce((acc, key) => {
            acc[key] = this.config.headers[key]();
            return acc;
        }, {});
    }
    transformData(data) {
        if (!data) {
            return data;
        }
        return (this.config.transformData || []).reduce((acc, fn) => {
            return (acc = fn(acc));
        }, cloneDeep(data));
    }
    transformResponse(response) {
        if (!response) {
            return response;
        }
        return (this.config.transformResponse || []).reduce((acc, fn) => {
            return (acc = fn(acc));
        }, cloneDeep(response));
    }
    buildAxiosConfig(method, url, data) {
        const transformedData = this.transformData(data);
        return {
            url,
            method,
            baseURL: this.config.baseURL,
            params: method == "get" ? transformedData : undefined,
            data: method != "get" ? transformedData : undefined,
            cancelToken: get().token
        };
    }
    executeBefores() {
        (this.config.before || []).forEach(fn => fn());
    }
    executeAfters() {
        (this.config.after || []).forEach(fn => fn());
    }
    executeResponseValidations(response, orgResponse) {
        let type = ResultType.NO_ERROR, data;
        (this.config.responseValidations || []).every(responseValidation => {
            const responseValidationContext = new ResponseValidationContext();
            responseValidation(response, responseValidationContext, orgResponse);
            const result = responseValidationContext.resultType == ResultType.NO_ERROR;
            if (!result) {
                type = responseValidationContext.resultType;
                data = responseValidationContext.resultData;
            }
            return result;
        });
        return { type, data };
    }
    handleException(e) {
        if (axios.isCancel(e)) {
            return {
                error: true,
                errorType: ErrorType$1.GOT_CANCELED
            };
        }
        else {
            return {
                error: true,
                errorType: ErrorType$1.EXCEPTION,
                errorCode: e
            };
        }
    }
    async transformAndValidateResponse(response, method, url, data, retry, retryNum) {
        const transformedResponse = this.transformResponse(response.data);
        const validationResult = this.executeResponseValidations(transformedResponse, response);
        const validationResultType = validationResult.type;
        const validationResultData = validationResult.data;
        let result;
        if (validationResultType == ResultType.RETRY) {
            if (!retry || (retry && retryNum > 0)) {
                const num = retry ? retryNum : validationResultData;
                result = await this.requestInternal(method, url, data, true, num - 1);
            }
            else {
                result = {
                    error: true,
                    errorType: ErrorType$1.RETRY_DONE_FAILED,
                    errorCode: undefined,
                    response: transformedResponse,
                    orgResponse: response
                };
            }
        }
        else if (validationResultType == ResultType.CANCEL_ALL) {
            result = {
                error: true,
                errorType: ErrorType$1.CANCELED_ALL,
                errorCode: undefined,
                response: transformedResponse,
                orgResponse: response
            };
        }
        else if (validationResultType == ResultType.ERROR) {
            result = {
                error: true,
                errorType: ErrorType$1.USER_DEFINED_ERROR,
                errorCode: validationResultData,
                response: transformedResponse,
                orgResponse: response
            };
        }
        else if (validationResultType == ResultType.NO_ERROR) {
            result = {
                error: false,
                response: transformedResponse,
                orgResponse: response
            };
        }
        else {
            throw new Error(`validationResultType is ${validationResultType}.`);
        }
        return result;
    }
    async requestInternal(method, url, data, retry = false, retryNum = 0) {
        if (!retry) {
            this.executeBefores();
        }
        const config = this.buildAxiosConfig(method, url, data);
        let response = undefined;
        let ret = undefined;
        try {
            response = await axios.request(config);
        }
        catch (e) {
            ret = this.handleException(e);
        }
        finally {
            remove(config.cancelToken);
        }
        if (!ret) {
            ret = await this.transformAndValidateResponse(response, method, url, data, retry, retryNum);
        }
        if (!retry) {
            this.executeAfters();
        }
        return ret;
    }
    async request(method, url, data) {
        return await this.requestInternal(method, url, data);
    }
}

module.exports = Api;
