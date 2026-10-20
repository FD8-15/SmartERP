import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerSpec from '../config/swagger.js';

const projectRoot = process.cwd();
const docsDir = path.join(projectRoot, 'docs');
const templatePath = path.join(projectRoot, 'docs-portal', 'template.html');
const specPath = path.join(docsDir, 'openapi.json');
const outputPath = path.join(docsDir, 'portal.html');

try {
  if (!swaggerSpec || typeof swaggerSpec !== 'object' || !swaggerSpec.openapi) {
    throw new Error('The Swagger configuration did not produce a valid OpenAPI specification.');
  }

  mkdirSync(docsDir, { recursive: true });
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(specPath, `${JSON.stringify(swaggerSpec, null, 2)}\n`, 'utf8');

  const template = readFileSync(templatePath, 'utf8');
  if (!template.includes('__OPENAPI_SPEC_JSON__')) {
    throw new Error(`Template placeholder __OPENAPI_SPEC_JSON__ was not found in ${templatePath}`);
  }

  // Prevent an endpoint description containing </script> from ending the embedded JSON script early.
  const safeSpec = JSON.stringify(swaggerSpec).replace(/<\/script/gi, '<\\/script');
  const html = template.replace('__OPENAPI_SPEC_JSON__', safeSpec);
  writeFileSync(outputPath, html, 'utf8');

  const operationCount = Object.values(swaggerSpec.paths || {}).reduce((sum, pathItem) => {
    return sum + Object.keys(pathItem || {}).filter(method => ['get','post','put','patch','delete','options','head','trace'].includes(method.toLowerCase())).length;
  }, 0);

  console.log('SmartERP documentation portal built successfully.');
  console.log(`OpenAPI JSON: ${path.relative(projectRoot, specPath)}`);
  console.log(`HTML portal:  ${path.relative(projectRoot, outputPath)}`);
  console.log(`Documented operations: ${operationCount}`);
  console.log('Open docs/portal.html in your browser.');
} catch (error) {
  console.error('\nFailed to build SmartERP documentation portal.');
  console.error(error?.stack || error);
  process.exitCode = 1;
}
