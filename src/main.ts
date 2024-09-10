import { Node } from 'unist';
import * as core from '@actions/core';
import * as github from '@actions/github';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { unified } from 'unified';
import { commentMarker } from 'mdast-comment-marker';
import { visit } from 'unist-util-visit';

/**
 * The main function for the action
 */
export async function run(): Promise<void> {
  try {
    const commentBody = github.context.payload.comment?.body;

    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(StructuredDataPlugin)
      .process(commentBody);

    core.setOutput('data', result.result as Record<string, unknown>);
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message);
  }
}

function StructuredDataPlugin(): void {
  const compilerFn = (tree: Node): Record<string, unknown> => {
    const DATA_TAG = 'data';
    const foundData = {} as Record<string, unknown>;

    visit(tree, 'html', (node) => {
      const marker = commentMarker(node);

      if (!marker || marker.name !== DATA_TAG) {
        return;
      }

      const key = String(marker.parameters.key);
      foundData[key] = marker.parameters.value || '';
    });

    return foundData;
  };

  Object.assign(this, { Compiler: compilerFn });
}
