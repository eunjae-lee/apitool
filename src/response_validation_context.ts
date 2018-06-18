import { cancelAll as cancelAllRequests } from "./cancel_token_manager";

export enum ResultType {
  NO_ERROR = "",
  ERROR = "error",
  RETRY = "retry",
  CANCEL_ALL = "cancelAll"
}

class ResponseValidationContext {
  resultType: ResultType = ResultType.NO_ERROR;
  resultData?: any;

  error(errorCode?: any) {
    this.setResult(ResultType.ERROR, errorCode);
  }

  retry(retryNum = 1) {
    this.setResult(ResultType.RETRY, retryNum);
  }

  cancelAll() {
    this.setResult(ResultType.CANCEL_ALL);
    cancelAllRequests();
  }

  setResult(resultType: ResultType, resultData?: any) {
    if (this.resultType) {
      throw new Error(`You already invoked ${this.resultType}.`);
    }

    this.resultType = resultType;
    this.resultData = resultData;
  }
}

export default ResponseValidationContext;
