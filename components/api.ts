const GRAPHQL_ENDPOINT = '/.netlify/functions/graphql';

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function runGraphQL<T = any>(query: string, variables?: Record<string, any>): Promise<{ data?: T; errors?: any[] }> {
  const token = localStorage.getItem('authToken') || getCookie('authToken');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  return result;
}

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
}

function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
}

function setAuth(token: string, user: string) {
  localStorage.setItem('authToken', token);
  localStorage.setItem('astroUser', user);
  setCookie('authToken', token);
}

const LOGIN_MUTATION = `
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      success
      message
      token
      user
      role
    }
  }
`;

const SIGNUP_MUTATION = `
  mutation Signup($input: SignUpInput!) {
    signup(input: $input) {
      success
      message
      token
      user
      role
    }
  }
`;

export interface LoginResult {
  success: boolean;
  user?: string;
  message?: string;
}

export interface SignUpInput {
  username: string;
  password: string;
  email: string;
  date_of_birth: string;
  place_of_birth?: string | null;
  time_of_birth?: string | null;
  gender?: string | null;
}

export interface SignUpResult {
  success: boolean;
  user?: string;
  message?: string;
}

export async function login(
  username: string,
  password: string
): Promise<LoginResult> {
  try {
    const { data, errors } = await runGraphQL<{
      login?: {
        success: boolean;
        message?: string;
        token?: string;
        user?: string;
        role?: string;
      };
    }>(LOGIN_MUTATION, { username, password });

    if (errors?.length) {
      return { success: false, message: errors[0].message || 'Login failed' };
    }

    const result = data?.login;
    if (result?.success && result?.token && result?.user) {
      setAuth(result.token, result.user);
      return { success: true, user: result.user };
    }
    return { success: false, message: result?.message || 'Login failed' };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Login failed',
    };
  }
}

export async function signup(userData: SignUpInput): Promise<SignUpResult> {
  try {
    const input = {
      username: userData.username,
      password: userData.password,
      email: userData.email,
      date_of_birth: userData.date_of_birth,
      place_of_birth: userData.place_of_birth ?? null,
      time_of_birth: userData.time_of_birth ?? null,
      gender: userData.gender ?? null,
    };

    const { data, errors } = await runGraphQL<{
      signup?: {
        success: boolean;
        message?: string;
        token?: string;
        user?: string;
        role?: string;
      };
    }>(SIGNUP_MUTATION, { input });

    if (errors?.length) {
      return { success: false, message: errors[0].message || 'Signup failed' };
    }

    const result = data?.signup;
    if (result?.success && result?.token && result?.user) {
      setAuth(result.token, result.user);
      return { success: true, user: result.user };
    }
    return { success: false, message: result?.message || 'Signup failed' };
  } catch (error) {
    console.error('Signup error:', error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Signup failed',
    };
  }
}
