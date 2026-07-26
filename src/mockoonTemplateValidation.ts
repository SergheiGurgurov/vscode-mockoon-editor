import type { Environment, ProcessedDatabucket } from '@mockoon/commons';
import { defaultEnvironmentVariablesPrefix } from '@mockoon/commons/dist/esm/constants/common.constants';
import { TemplateParser } from '@mockoon/commons-server/dist/esm/libs/template-parser';
import type { MockoonEnvironment, MockoonResponse } from './types';

interface ValidateTemplateBodyOptions {
  body: string;
  environment: MockoonEnvironment;
  expectJson: boolean;
  response: MockoonResponse;
}

export function validateTemplateBody({ body, environment, expectJson, response }: ValidateTemplateBodyOptions): { ok: boolean; message: string } {
  if (response.disableTemplating) {
    return { ok: false, message: 'Templating is disabled for this response.' };
  }

  try {
    const processedDatabuckets = buildProcessedDatabuckets(environment);
    const renderedBody = parseTemplate(body, environment, processedDatabuckets);

    if (expectJson) {
      JSON.parse(renderedBody || 'null');
      return { ok: true, message: 'Template is valid. Rendered body is valid JSON.' };
    }

    return { ok: true, message: 'Template is valid.' };
  } catch (error) {
    return { ok: false, message: `Template validation failed: ${formatError(error)}.` };
  }
}

function buildProcessedDatabuckets(environment: MockoonEnvironment): ProcessedDatabucket[] {
  const processedDatabuckets: ProcessedDatabucket[] = [];

  for (const databucket of environment.data ?? []) {
    let parsedContent: string | undefined;

    try {
      parsedContent = parseTemplate(databucket.value, environment, processedDatabuckets);
      processedDatabuckets.push({
        uuid: databucket.uuid,
        id: databucket.id,
        name: databucket.name,
        value: JSON.parse(parsedContent),
        parsed: true,
        validJson: true
      });
    } catch (error) {
      processedDatabuckets.push({
        uuid: databucket.uuid,
        id: databucket.id,
        name: databucket.name,
        value: error instanceof SyntaxError ? parsedContent : formatError(error),
        parsed: true,
        validJson: false
      });
    }
  }

  return processedDatabuckets;
}

function parseTemplate(content: string, environment: MockoonEnvironment, processedDatabuckets: ProcessedDatabucket[]): string {
  return TemplateParser({
    shouldOmitDataHelper: false,
    content: content || '',
    environment: environment as Environment,
    processedDatabuckets,
    globalVariables: {},
    envVarsPrefix: defaultEnvironmentVariablesPrefix
  });
}

function formatError(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown parser error';
}