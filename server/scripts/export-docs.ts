import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getFilteredSwaggerDocument, resolveDocsAudience } from "../src/docs/swagger.js";
import { env } from "../src/env.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRootDir = path.resolve(__dirname, "..");
const appDir = path.resolve(serverRootDir, "..");
const workspaceRootDir = path.resolve(appDir, "..");

const audience = resolveDocsAudience(env.NODE_ENV, process.env.AUDIENCE || process.env.DOCS_AUDIENCE);
const activeSwaggerDoc = getFilteredSwaggerDocument(audience);

console.log(`[DOCS] Generating API documentation with audience: ${audience}`);

// 1. Write swagger.json (in server src/docs)
const swaggerJsonPath = path.join(serverRootDir, "src", "docs", "swagger.json");
fs.writeFileSync(swaggerJsonPath, JSON.stringify(activeSwaggerDoc, null, 2), "utf-8");
console.log(`[DOCS] Generated ${swaggerJsonPath}`);

// 2. Generate Postman Collection v2.1.0 format
interface PostmanItem {
  name: string;
  request: {
    method: string;
    header: Array<{ key: string; value: string; type?: string; description?: string }>;
    url: {
      raw: string;
      host: string[];
      path: string[];
      query?: Array<{ key: string; value: string; description?: string }>;
    };
    description?: string;
    body?: {
      mode: "raw";
      raw: string;
      options?: { raw: { language: "json" } };
    };
  };
}

interface PostmanFolder {
  name: string;
  item: PostmanItem[];
  description?: string;
}

const foldersMap = new Map<string, PostmanItem[]>();

// Initialize folders matching tags
activeSwaggerDoc.tags.forEach((tag) => {
  foldersMap.set(tag.name, []);
});

for (const [pathStr, pathItem] of Object.entries(activeSwaggerDoc.paths)) {
  for (const [methodStr, op] of Object.entries(pathItem as Record<string, any>)) {
    const operation = op as {
      tags?: string[];
      summary?: string;
      description?: string;
      parameters?: Array<{ name: string; in: string; schema?: any; required?: boolean }>;
      requestBody?: any;
      security?: any[];
    };

    const tag = operation.tags?.[0] || "General";
    if (!foldersMap.has(tag)) {
      foldersMap.set(tag, []);
    }

    const headers: Array<{ key: string; value: string; description?: string }> = [
      { key: "Content-Type", value: "application/json" },
    ];

    if (operation.security?.some((s) => "bearerAuth" in s)) {
      headers.push({
        key: "Authorization",
        value: "Bearer {{access_token}}",
        description: "Student JWT Access Token",
      });
    }

    if (operation.security?.some((s) => "hubbleSecret" in s)) {
      headers.push({
        key: "X-Hubble-Secret",
        value: "{{hubble_secret}}",
        description: "Hubble Webhook / Callback Secret",
      });
    }

    if (operation.security?.some((s) => "idempotencyKey" in s)) {
      headers.push({
        key: "Idempotency-Key",
        value: "idem_{{$guid}}",
        description: "Idempotency UUID",
      });
    }

    const queryParams: Array<{ key: string; value: string; description?: string }> = [];
    if (operation.parameters) {
      operation.parameters.forEach((param) => {
        if (param.in === "query") {
          queryParams.push({
            key: param.name,
            value: "",
            description: `${param.name} (${param.required ? "required" : "optional"})`,
          });
        }
      });
    }

    let bodyPayload: { mode: "raw"; raw: string; options: { raw: { language: "json" } } } | undefined;

    if (operation.requestBody?.content?.["application/json"]?.schema) {
      const schema = operation.requestBody.content["application/json"].schema;
      let sampleObj: Record<string, any> = {};

      let resolvedSchema = schema;
      if (schema.$ref) {
        const refName = schema.$ref.replace("#/components/schemas/", "");
        resolvedSchema = (activeSwaggerDoc.components.schemas as Record<string, any>)[refName] || {};
      }

      if (resolvedSchema.properties) {
        for (const [propKey, propVal] of Object.entries(resolvedSchema.properties as Record<string, any>)) {
          sampleObj[propKey] = propVal.example !== undefined ? propVal.example : propVal.default || "";
        }
      }

      bodyPayload = {
        mode: "raw",
        raw: JSON.stringify(sampleObj, null, 2),
        options: { raw: { language: "json" } },
      };
    }

    const cleanPathParts = pathStr.replace(/^\//, "").split("/");

    const postmanItem: PostmanItem = {
      name: operation.summary || `${methodStr.toUpperCase()} ${pathStr}`,
      request: {
        method: methodStr.toUpperCase(),
        header: headers,
        url: {
          raw: `{{base_url}}${pathStr}${
            queryParams.length ? "?" + queryParams.map((q) => `${q.key}=${q.value}`).join("&") : ""
          }`,
          host: ["{{base_url}}"],
          path: cleanPathParts,
          query: queryParams.length ? queryParams : undefined,
        },
        description: operation.description,
        body: bodyPayload,
      },
    };

    foldersMap.get(tag)!.push(postmanItem);
  }
}

const postmanCollection = {
  info: {
    _postman_id: "aptech-tbx-api-v1",
    name: `AP-Tech (TBX) Banking & Card Platform API${audience === "student_production" ? " (Student View)" : " (Internal Full)"}`,
    description: activeSwaggerDoc.info.description,
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "base_url", value: "http://localhost:8000/api/v1", type: "string" },
    { key: "access_token", value: "", type: "string" },
    { key: "hubble_secret", value: "test-hubble-secret", type: "string" },
  ],
  item: Array.from(foldersMap.entries())
    .filter(([_, items]) => items.length > 0)
    .map(([folderName, items]): PostmanFolder => ({
      name: folderName,
      item: items,
    })),
};

// Write Postman Collection to repository root directory
const postmanOutputPath = path.join(workspaceRootDir, "AP-Tech.postman_collection.json");
fs.writeFileSync(postmanOutputPath, JSON.stringify(postmanCollection, null, 2), "utf-8");
console.log(`[DOCS] Generated Postman Collection at repository root: ${postmanOutputPath}`);

// Clean up duplicates from App and App/server if they exist
const appDuplicatePath = path.join(appDir, "AP-Tech.postman_collection.json");
if (fs.existsSync(appDuplicatePath)) {
  fs.unlinkSync(appDuplicatePath);
  console.log(`[DOCS] Cleaned up duplicate collection file at: ${appDuplicatePath}`);
}

const serverDuplicatePath = path.join(serverRootDir, "AP-Tech.postman_collection.json");
if (fs.existsSync(serverDuplicatePath)) {
  fs.unlinkSync(serverDuplicatePath);
  console.log(`[DOCS] Cleaned up duplicate collection file at: ${serverDuplicatePath}`);
}
