import { makeModels } from "../utils/llm/models";

export function createChatModel() {
  const { llm } = makeModels();
  return llm;
}
