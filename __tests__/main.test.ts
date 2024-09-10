import { jest } from '@jest/globals';
import * as github from '@actions/github';
import * as core from '../__fixtures__/core.js';

// Mock the @actions/toolkit packages used by main.ts
jest.unstable_mockModule('@actions/core', () => core);

// Imports must be done dynamically to allow the mocks to be applied
// See: https://jestjs.io/docs/ecmascript-modules#module-mocking-in-esm
const main = await import('../src/main.js');

describe('main.ts', () => {
  const mockCommentBody = (commentBody: string): void => {
    Object.defineProperty(github.context, 'payload', {
      value: { comment: { id: 1, body: commentBody } },
    });
  };

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('parses structured data within issue comments', async () => {
    mockCommentBody('<!-- data key="name" value="Foobar" -->');
    await main.run();
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'data', {
      name: 'Foobar',
    });
  });

  it('parses structured data with no value', async () => {
    mockCommentBody('<!-- data key="name" -->');
    await main.run();
    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'data', { name: '' });
  });

  it('sets the output to the last discovered value', async () => {
    mockCommentBody(`
<!-- data key="name" value="Foo" -->
<!-- data key="name" value="Bar" -->
    `);

    await main.run();

    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'data', { name: 'Bar' });
  });

  it('outputs nothing when comments contains no structured data', async () => {
    mockCommentBody(`
# Header
## Subheader

This is a comment with no structured data.
<!-- This is a plain comment that should be ignore -->
    `);

    await main.run();

    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'data', {});
  });

  it('returns nothing when the comment body does not exist', async () => {
    Object.defineProperty(github.context, 'payload', {
      value: { comment: {} },
    });

    await main.run();

    expect(core.setOutput).toHaveBeenNthCalledWith(1, 'data', {});
  });
});
