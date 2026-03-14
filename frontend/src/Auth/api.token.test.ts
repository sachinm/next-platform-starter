/** @vitest-environment jsdom */
/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runGraphQL } from '../../../components/api';

describe('runGraphQL', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
    document.cookie = '';
  });

  it('includes Authorization header when authToken exists in localStorage', async () => {
    localStorage.setItem('authToken', 'test-token');

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ data: {} }),
    });

    // @ts-ignore
    global.fetch = fetchMock;

    await runGraphQL('{ test }');

    expect(fetchMock).toHaveBeenCalled();
    const options = fetchMock.mock.calls[0][1];
    expect(options.headers.Authorization).toBe('Bearer test-token');
  });

  it('includes Authorization header when authToken exists in cookie', async () => {
    // Clear localStorage to ensure it's only pulled from cookie
    localStorage.removeItem('authToken');
    document.cookie = 'authToken=test-cookie-token';

    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ data: {} }),
    });

    // @ts-ignore
    global.fetch = fetchMock;

    await runGraphQL('{ test }');

    const options = fetchMock.mock.calls[0][1];
    expect(options.headers.Authorization).toBe('Bearer test-cookie-token');
  });
});
