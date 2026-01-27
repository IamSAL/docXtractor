/* eslint-disable react-hooks/rules-of-hooks */
import { RequestHeaders, TQueryOption, IError, PageRequest, TInfiniteQueryOption } from '@/types/common';
import type {
  QueryKey,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
} from '@tanstack/react-query';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { showErrorModal, parseErrorMessage } from './utils';




export const useFetch = <T>(
  key: QueryKey,
  queryFn: () => Promise<T>,
  options?: Omit<Omit<UseQueryOptions<T>, 'queryFn'>, 'queryKey'>
) => {
  return useQuery({
    queryKey: key,
    queryFn,
    ...options,
  });
};
export const useMutate = <TData, TResponse>(
  createFn: (data: TData) => Promise<TResponse>,
  options?: Omit<
    UseMutationOptions<TResponse, Error, TData, unknown>,
    'mutationFn'
  >
): UseMutationResult<TResponse, Error, TData, unknown> & {
  res: (data: TData) => Promise<void>;
} => {
  const mutation = useMutation({
    mutationFn: createFn,
    ...options,
  });

  const res = async (data: TData) => {
    await mutation.mutateAsync(data);
  };

  return {
    ...mutation,
    res,
  };
};

export const createQuery = <Req, Res, H = RequestHeaders>(endpoint: string) => {
  return (
    target: (url: string, params: Req, headers?: H) => Promise<{ data: Res }>
  ) => {
    type Params = Parameters<typeof target>[1];
    type Headers = Parameters<typeof target>[2];

    const decorated = Object.assign(
      (params: Params, headers?: Headers) =>
        target(endpoint, params, headers).then(res => res.data),
      {
        query: (
          params: Params,
          options?: TQueryOption<Res> & { headers?: Headers } & {
            onSuccess?: (data: Res) => void;
            onError?: (error: IError) => void;
          }
        ) => {
          const { headers, ...queryOptions } = options || {};
          return useQuery({
            queryKey: options?.queryKey || [
              endpoint,
              ...Object.values(params as object),
            ],
            queryFn: () =>
              target(endpoint, params, headers)
                .then(res => {
                  options?.onSuccess?.(res.data);
                  return res.data;
                })
                .catch(err => {
                  if (options?.onError) {
                    options?.onError?.(err as IError);
                  } else {
                    showErrorModal({
                      message: parseErrorMessage(err as IError),
                    });
                  }
                  throw err;
                }),
            ...queryOptions,
          });
        },
        getQueryKey: (params: Params) => {
          return [endpoint, ...Object.values(params as object)];
        },
        prefetch: (
          params: Params,
          options?: { headers?: Headers; staleTime?: number } & {
            onSuccess?: (data: Res) => void;
            onError?: (error: IError) => void;
          }
        ) => {
          const queryClient = useQueryClient();
          return queryClient.prefetchQuery({
            queryKey: [endpoint, ...Object.values(params as object)],
            queryFn: () =>
              target(endpoint, params, options?.headers)
                .then(res => {
                  options?.onSuccess?.(res.data);
                  return res.data;
                })
                .catch(err => {
                  if (options?.onError) {
                    options?.onError?.(err as IError);
                  }
                  throw err;
                }),
            ...options,
          });
        },
      }
    );

    return decorated;
  };
};

export const createInfiniteQuery = <Req, Res, H = RequestHeaders>(
  endpoint: string
) => {
  return (
    target: (url: string, params: Req, headers?: H) => Promise<{ data: Res }>
  ) => {
    type Params = Parameters<typeof target>[1];
    type Headers = Parameters<typeof target>[2];

    const decorated = Object.assign(
      (params: Params, headers?: Headers) =>
        target(endpoint, params, headers).then(res => res.data),
      {
        infiniteQuery: (
          params: Params & {
            pageRequest?: PageRequest;
          },
          options?: TInfiniteQueryOption<Res> & { headers?: Headers } & {
            onError?: (error: IError) => void;
          }
        ) => {
          const { headers, ...queryOptions } = options || {};
          return useInfiniteQuery({
            queryKey: options?.queryKey || [
              endpoint,
              ...Object.values(params as object),
            ],
            queryFn: ({ pageParam = 0 }) =>
              target(
                endpoint,
                {
                  ...params,
                  pageRequest: {
                    page: pageParam as number,
                    pageSize: 10,
                    ...(params.pageRequest as any),
                  },
                },
                headers
              )
                .then(res => {
                  return res.data;
                })
                .catch(err => {
                  if (options?.onError) {
                    options?.onError?.(err as IError);
                  } else {
                    showErrorModal({
                      message: parseErrorMessage(err as IError),
                    });
                  }
                  throw err;
                }),
            getNextPageParam: (lastPage: any) => {
              if (lastPage?.pageResponse) {
                const currentPage = lastPage.pageResponse.page;
                const { totalPages } = lastPage.pageResponse;
                return currentPage < totalPages - 1
                  ? currentPage + 1
                  : undefined;
              }
              return undefined;
            },
            initialPageParam: 0,
            ...queryOptions,
          });
        },
      }
    );

    return decorated;
  };
};

export const createMutation = <Req, Res, H = RequestHeaders>(
  endpoint: string
) => {
  return (
    target: (url: string, params: Req, headers?: H) => Promise<{ data: Res }>
  ) => {
    const decorated = Object.assign(
      (params: Req, headers?: H) =>
        target(endpoint, params, headers).then(res => res.data),
      {
        mutation: (
          options?: Omit<
            UseMutationOptions<Res, IError, Req, unknown>,
            'mutationFn'
          > & { headers?: H }
        ) => {
          const { headers, ...mutationOptions } = options || {};
          return useMutation({
            mutationFn: (params: Req) => {
              return target(endpoint, params, headers)
                .then(res => {
                  return res.data;
                })
                .catch(err => {
                  // handle  error
                  if (!options?.onError) {
                    showErrorModal({
                      message: parseErrorMessage(err as IError),
                    });
                  }
                  throw err;
                });
            },
            ...mutationOptions,
          });
        },
      }
    );

    return decorated;
  };
};
