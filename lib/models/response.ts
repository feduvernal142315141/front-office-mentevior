import {AxiosResponse} from "axios";

export type ResponseEntity<T> = {
    code?: string;
    message?: string;
    details?: string;
} & T;

export type ServiceResponse<T> = Promise<AxiosResponse<ResponseEntity<T>>>;