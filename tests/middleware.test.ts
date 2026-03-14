import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Import the middleware function directly
import { middleware } from '../middleware';

const SECRET = 'this-is-a-very-long-secret-key-for-testing-12345';

describe('Next.js middleware auth guard', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = SECRET;
  });

  it('redirects to /signin when no token cookie is present', async () => {
    const request = new NextRequest('http://localhost/dashboard');
    const response = await middleware(request);

    expect(response.status).toBe(307);
    const location = response.headers.get('location');
    expect(location).toBeTruthy();
    // Next.js middleware may return an absolute URL (e.g. http://localhost/signin)
    expect(new URL(location!).pathname).toBe('/signin');
  });

  it('allows request when a valid token cookie is present', async () => {
    const token = jwt.sign({ sub: 'user1', role: 'user' }, SECRET, { expiresIn: '1h' });
    const request = new NextRequest('http://localhost/dashboard', {
      headers: { cookie: `authToken=${token}` },
    });

    const response = await middleware(request);

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBe(null);
  });
});
