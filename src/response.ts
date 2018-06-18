import { AxiosResponse } from "axios";
import ErrorType from "./error_type";

interface Response {
  error: boolean;
  errorType?: ErrorType;
  errorCode?: any;
  response?: any;
  orgResponse?: AxiosResponse;
}

export default Response;
