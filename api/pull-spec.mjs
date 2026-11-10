// Downloads the OpenAPI spec from a running agronomo-api (SWAGGER_ENABLED=true)
// into api/openapi.json. Usage: npm run api:pull [-- <api-docs url>]
import { writeFile } from 'node:fs/promises';

const url = process.argv[2] ?? 'http://localhost:8081/v3/api-docs';
const response = await fetch(url);
if (!response.ok) {
  console.error(`GET ${url} -> ${response.status}. Is the API running with SWAGGER_ENABLED=true?`);
  process.exit(1);
}
const spec = await response.json();
await writeFile(new URL('./openapi.json', import.meta.url), JSON.stringify(spec, null, 2) + '\n');
console.log(`api/openapi.json updated from ${url}`);
