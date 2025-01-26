import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

// Create the Axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

export const get = async <T>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const response: AxiosResponse<T> = await axiosInstance.get<T>(url, config);
  return response.data;
};

export const post = async <T>(
  url: string,
  data?: unknown,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const response: AxiosResponse<T> = await axiosInstance.post<T>(
    url,
    data,
    config
  );
  return response.data;
};

export const patch = async <T>(
  url: string,
  data?: unknown,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const response: AxiosResponse<T> = await axiosInstance.patch<T>(
    url,
    data,
    config
  );
  return response.data;
};

export const del = async <T>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const response: AxiosResponse<T> = await axiosInstance.delete<T>(url, config);
  return response.data;
};

export default axiosInstance;
