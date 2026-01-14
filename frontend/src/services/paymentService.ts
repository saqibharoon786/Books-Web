// services/paymentService.ts
import api from './api';

export interface PaymentData {
  bookId: string;
  paymentMethod: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export const PaymentService = {
  createPayment: async (bookId: string, paymentMethod: string = 'safepay'): Promise<ApiResponse<{
    paymentUrl: string;
    tracker: string;
    redirectUrl: string;
    paymentId: string;
    transactionRef: string;
  }>> => {
    const response = await api.post<ApiResponse>(`/payments/create`, {
      bookId,
      paymentMethod
    });
    return response.data;
  },

  verifyPayment: async (paymentId: string): Promise<ApiResponse<{
    status: string;
    amount: number;
    transactionRef: string;
  }>> => {
    const response = await api.get<ApiResponse>(`/payments/verify/${paymentId}`);
    return response.data;
  }
};