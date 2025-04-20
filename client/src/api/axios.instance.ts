import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

// Define the queue item interface
interface QueueItem {
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

// Flag to prevent multiple refresh token requests
let isRefreshing = false;
// Queue of failed requests to retry after token refresh
let failedQueue: QueueItem[] = [];

// Process the queue of failed requests
const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Add type for requests that can be retried
interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// Response interceptor
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest;

    // If the error is not 401 or the request was already retried, reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // If a refresh is already in progress, queue this request
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return axiosInstance(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Call your refresh token endpoint
      await axiosInstance.post("/auth/refresh-token");

      // Token refresh succeeded, process the queue and retry the original request
      processQueue(null);
      isRefreshing = false;
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      // Token refresh failed, process the queue with error and reject
      processQueue(refreshError as AxiosError);
      isRefreshing = false;

      // Handle authentication failure (e.g., redirect to login)
      if (typeof window !== "undefined") {
        // You can dispatch an action to your store or redirect to login page
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    }
  }
);
