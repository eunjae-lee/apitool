import { AxiosResponse } from "axios";
import ErrorType from "./error_type";

interface Response<T> {
  error: boolean;
  errorType?: ErrorType;
  errorCode?: any;
  response?: T | undefined;
  orgResponse?: AxiosResponse;
}

export default Response;
