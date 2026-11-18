import { defineConfig } from 'orval';

import transformSpec from './api/transform-spec';

// npm run api:gen — regenerates src/api/generated from api/openapi.json.
// npm run api:pull — refreshes api/openapi.json from the local API first.
export default defineConfig({
  agronomo: {
    input: {
      target: './api/openapi.json',
      override: { transformer: transformSpec },
    },
    output: {
      mode: 'tags-split',
      target: './src/api/generated/endpoints',
      schemas: './src/api/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      formatter: 'prettier',
      override: {
        mutator: { path: './src/api/http-client.ts', name: 'httpClient' },
        // Hooks return the API envelope itself, not {data, status, headers}.
        fetch: { includeHttpResponseReturnType: false },
        query: { signal: true },
        operations: {
          // Paginated lists used by the app get an infinite-query hook too.
          fieldFindAllByFarmId: { query: { useInfinite: true, useInfiniteQueryParam: 'page' } },
          notificationFindAll: { query: { useInfinite: true, useInfiniteQueryParam: 'page' } },
        },
      },
    },
  },
});
