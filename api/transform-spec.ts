/**
 * Fixes the springdoc spec (api/openapi.json) before Orval generates code.
 * The API repository is read-only for this project, so every adjustment the
 * generator needs lives here, applied to all endpoints at once.
 */
import { defineTransformer } from 'orval';

type Schema = {
  $ref?: string;
  type?: string | string[];
  oneOf?: Schema[];
  properties?: Record<string, Schema>;
  required?: string[];
  [key: string]: unknown;
};

type Parameter = { name: string; in: string; required?: boolean; schema?: Schema };

type Operation = {
  operationId?: string;
  tags?: string[];
  parameters?: Parameter[];
  responses?: Record<string, { content?: Record<string, { schema?: Schema }> }>;
};

type Spec = {
  paths: Record<string, Record<string, Operation>>;
  components: { schemas: Record<string, Schema> };
  servers?: unknown;
};

const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete']);

function operations(spec: Spec): Operation[] {
  return Object.values(spec.paths).flatMap((item) =>
    Object.entries(item)
      .filter(([method]) => HTTP_METHODS.has(method))
      .map(([, operation]) => operation),
  );
}

/** 'AI Chat' -> 'aiChat', 'public-health-controller' -> 'publicHealthController'. */
function camelCase(text: string): string {
  const words = text.split(/[^A-Za-z0-9]+/).filter(Boolean);
  return words
    .map((word, index) => {
      if (index === 0) {
        return word === word.toUpperCase()
          ? word.toLowerCase()
          : word[0]!.toLowerCase() + word.slice(1);
      }
      return word[0]!.toUpperCase() + word.slice(1);
    })
    .join('');
}

/**
 * Spring names operations after the Kotlin method, so they repeat across
 * controllers and springdoc dedupes with suffixes (findById, findById_1, ...).
 * Rename to tag + method: Field.findById -> fieldFindById (hook: useFieldFindById).
 */
function renameOperations(spec: Spec): void {
  const seen = new Set<string>();
  for (const operation of operations(spec)) {
    const tag = operation.tags?.[0];
    const method = operation.operationId?.replace(/_\d+$/, '');
    if (!tag || !method) continue;
    const id = camelCase(tag) + method[0]!.toUpperCase() + method.slice(1);
    if (seen.has(id)) throw new Error(`transform-spec: duplicated operationId ${id}`);
    seen.add(id);
    operation.operationId = id;
  }
}

/**
 * Spring's Pageable is declared as a single required query object
 * ("pageable"), which a client would send as pageable=[object Object].
 * Spring actually reads page, size and sort as separate query params.
 */
function expandPageable(spec: Spec): void {
  for (const operation of operations(spec)) {
    const index = operation.parameters?.findIndex((p) => p.name === 'pageable' && p.in === 'query');
    if (index === undefined || index < 0) continue;
    operation.parameters!.splice(
      index,
      1,
      { name: 'page', in: 'query', required: false, schema: { type: 'integer', minimum: 0 } },
      { name: 'size', in: 'query', required: false, schema: { type: 'integer', minimum: 1 } },
      {
        name: 'sort',
        in: 'query',
        required: false,
        schema: { type: 'array', items: { type: 'string' } },
      },
    );
  }
}

// Responses are declared with the wildcard content type "*/*" but the API
// always answers JSON.
function jsonResponses(spec: Spec): void {
  for (const operation of operations(spec)) {
    for (const response of Object.values(operation.responses ?? {})) {
      const content = response.content;
      if (content?.['*/*']) {
        content['application/json'] = content['*/*'];
        delete content['*/*'];
      }
    }
  }
}

function withoutNull(schema: Schema): Schema {
  if (schema.oneOf) {
    const rest = schema.oneOf.filter((s) => s.type !== 'null');
    return rest.length === 1 ? rest[0]! : { ...schema, oneOf: rest };
  }
  if (Array.isArray(schema.type)) {
    const types = schema.type.filter((t) => t !== 'null');
    return { ...schema, type: types.length === 1 ? types[0] : types };
  }
  return schema;
}

/**
 * Every endpoint answers the envelope {data, status, errors, totalPages,
 * totalElements}; springdoc marks data and status as optional and nullable.
 * The http-client only returns responses whose status is "success" (it throws
 * ApiError otherwise), and on success the API always fills data, so the
 * generated types can treat both as present.
 */
function requireEnvelopeFields(spec: Spec): void {
  for (const [name, schema] of Object.entries(spec.components.schemas)) {
    const props = schema.properties;
    if (!name.startsWith('Response') || !props?.status || !('data' in props)) continue;
    props.status = withoutNull(props.status);
    props.data = withoutNull(props.data!);
    schema.required = [...new Set([...(schema.required ?? []), 'status', 'data'])];
  }
}

export default defineTransformer((input) => {
  const spec = structuredClone(input) as unknown as Spec;
  // Base URL comes from the app config (dev/hml/prd), not from the spec.
  delete spec.servers;
  renameOperations(spec);
  expandPageable(spec);
  jsonResponses(spec);
  requireEnvelopeFields(spec);
  return spec as unknown as typeof input;
});
