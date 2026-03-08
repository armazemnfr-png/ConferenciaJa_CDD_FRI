import { z } from 'zod';
import { insertConferenceSchema, insertWmsItemSchema, insertMatinalSchema, updateWmsItemSchema, conferences, wmsItems, matinals } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  matinals: {
    list: {
      method: 'GET' as const,
      path: '/api/matinals' as const,
      responses: {
        200: z.array(z.custom<typeof matinals.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/matinals' as const,
      input: insertMatinalSchema,
      responses: {
        201: z.custom<typeof matinals.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
  },
  conferences: {
    list: {
      method: 'GET' as const,
      path: '/api/conferences' as const,
      responses: {
        200: z.array(z.custom<typeof conferences.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/conferences/:mapNumber' as const,
      responses: {
        200: z.custom<typeof conferences.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    start: {
      method: 'POST' as const,
      path: '/api/conferences/start' as const,
      input: z.object({
        driverId: z.string(),
        mapNumber: z.string(),
      }),
      responses: {
        200: z.custom<typeof conferences.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    finish: {
      method: 'POST' as const,
      path: '/api/conferences/:id/finish' as const,
      responses: {
        200: z.custom<typeof conferences.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    dashboard: {
      method: 'GET' as const,
      path: '/api/dashboard/metrics' as const,
      responses: {
        200: z.object({
          totalConferences: z.number(),
          averageTimeMinutes: z.number(),
          divergencePercentage: z.number(),
          damagePercentage: z.number(),
          partialCountPercentage: z.number(),
        }),
      }
    }
  },
  wmsItems: {
    listByMap: {
      method: 'GET' as const,
      path: '/api/wms-items/:mapNumber' as const,
      responses: {
        200: z.array(z.custom<typeof wmsItems.$inferSelect>()),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/wms-items/:id' as const,
      input: updateWmsItemSchema,
      responses: {
        200: z.custom<typeof wmsItems.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/wms-items/upload' as const,
      input: z.object({
        items: z.array(insertWmsItemSchema),
      }),
      responses: {
        201: z.object({ success: z.boolean(), count: z.number() }),
        400: errorSchemas.validation,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
