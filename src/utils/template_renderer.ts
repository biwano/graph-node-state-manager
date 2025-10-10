import vento from "vento";
import { join } from "std/path/mod.ts";

export async function renderWithVento(templateName: string, data: Record<string, unknown>): Promise<string> {
  try {
    const env = vento();
    const templatePath = join("./src/templates", templateName);
    const template = await env.load(templatePath);
    const result = await template(data);
    return result.content;
  } catch (_e) {
    // Bubble up error to let caller decide fallback
    throw _e;
  }
}


