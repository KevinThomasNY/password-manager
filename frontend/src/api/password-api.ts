import { get, post, patch, del, ApiResponse } from "./axios-instance";

export interface Password {
  id: number;
  name: string;
  password: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddPasswordInput {
  name: string;
  password: string;
  image?: string;
  questions?: {
    question: string;
    answer: string;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export interface GeneratePasswordRequest {
  length: number;
  includeUppercase: boolean;
  includeLowercase: boolean;
  includeNumbers: boolean;
  includeSymbols: boolean;
}

export type GeneratePasswordResponse = string;

export const getPasswords = async (
  page: number,
  pageSize: number,
  search?: string
): Promise<PaginatedResponse<Password>> => {
  try {
    const response = await get<ApiResponse<PaginatedResponse<Password>>>(
      `/passwords?page=${page}&pageSize=${pageSize}&search=${search || ""}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching passwords", error);
    throw new Error("Failed to fetch passwords");
  }
};

export const addPassword = async (
  formData: FormData
): Promise<ApiResponse<Password>> => {
  try {
    const response = await post<ApiResponse<Password>>("/passwords", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response;
  } catch (error) {
    console.error("Error adding password", error);
    throw new Error("Failed to add password");
  }
};

export const deletePassword = async (
  id: number
): Promise<ApiResponse<Password>> => {
  try {
    const response = await del<ApiResponse<Password>>(`/passwords/${id}`);
    return response;
  } catch (error) {
    console.error("Error deleting password", error);
    throw new Error("Failed to delete password");
  }
};

export const generatePassword = async (
  data: GeneratePasswordRequest
): Promise<ApiResponse<GeneratePasswordResponse>> => {
  try {
    const response = await post<ApiResponse<GeneratePasswordResponse>>(
      "/passwords/generate-password",
      data
    );
    return response;
  } catch (error) {
    console.error("Error generating password", error);
    throw new Error("Failed to generate password");
  }
};

export const getSecurityQuestions = async (
  id: number
): Promise<{ question: string; answer: string }[]> => {
  try {
    const response = await get<
      ApiResponse<{ question: string; answer: string }[]>
    >(`/passwords/${id}/questions`);
    return response.data;
  } catch (error) {
    console.error("Error fetching security questions", error);
    throw new Error("Failed to fetch security questions");
  }
};

export const editPassword = async (
  id: number,
  formData: FormData
): Promise<ApiResponse<Password>> => {
  try {
    const response = await patch<ApiResponse<Password>>(
      `/passwords/${id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response;
  } catch (error) {
    console.error("Error editing password", error);
    throw new Error("Failed to edit password");
  }
};
