/**
 * Response Utilities
 * Helper functions for sending consistent API responses
 */

import { Response } from 'express';
import { HTTP_STATUS } from '../../config/constants';

interface SuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface PaginatedResponse<T = any> {
  success: true;
  message?: string;
  data: T[];
  meta: PaginationMeta;
}

/** Send a success response */
export const sendSuccess = <T = any>(
  res: Response,
  statusCode: number = HTTP_STATUS.OK,
  message?: string,
  data?: T
): void => {
  const response: SuccessResponse<T> = {
    success: true,
  };

  if (message) {
    response.message = message;
  }

  if (data !== undefined) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};

/** Send a paginated success response */
export const sendPaginatedSuccess = <T = any>(
  res: Response,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message?: string
): void => {
  const totalPages = Math.ceil(total / limit);

  const response: PaginatedResponse<T> = {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  };

  if (message) {
    response.message = message;
  }

  res.status(HTTP_STATUS.OK).json(response);
};

/** Send a created response (201) */
export const sendCreated = <T = any>(
  res: Response,
  message?: string,
  data?: T
): void => {
  sendSuccess(res, HTTP_STATUS.CREATED, message, data);
};

/** Send a no content response (204) */
export const sendNoContent = (res: Response): void => {
  res.status(HTTP_STATUS.NO_CONTENT).send();
};
