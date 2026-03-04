import { UseQueryOptions, UseInfiniteQueryOptions } from "@tanstack/react-query";
import type { RawAxiosRequestHeaders } from 'axios';
export type ErrorModalProps = {
  title?: string;
  message?: string;
  onConfirm?: (modal?: any) => void;
  buttonText?: string;
  dismiss?: boolean;
};



export interface DefaultResponse {
  code: string;
  description: string;
}



export interface PageRequest {
  page?: number; // Paging Index (0~1000, Optional, Default = 0)
  pageSize?: number; // Paging size (0~10000, Optional, Default = 10)
}
export interface IError<ResT = { response: DefaultResponse }> {
  data?: {
    reason: string;
    message: string;
    devMessage: string;
  } & Partial<ResT>;
}

export type RequestHeaders = Partial<RawAxiosRequestHeaders> & {
  [x: string]: any;
};

export type TQueryOption<T> = Omit<
  Omit<UseQueryOptions<T, IError>, 'queryFn'>,
  'queryKey'
> & {
  queryKey?: UseQueryOptions<T>['queryKey'];
};

export type TInfiniteQueryOption<T> = Omit<
  Omit<
    Omit<Omit<UseInfiniteQueryOptions<T, IError>, 'queryFn'>, 'queryKey'>,
    'initialPageParam'
  >,
  'getNextPageParam'
> & {
  queryKey?: UseInfiniteQueryOptions<T>['queryKey'];
  initialPageParam?: UseInfiniteQueryOptions<T>['initialPageParam'];
  getNextPageParam?: UseInfiniteQueryOptions<T>['getNextPageParam'];
};