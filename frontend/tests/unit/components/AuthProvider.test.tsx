import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, User } from '../../../../components/AuthProvider';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component that uses the auth context
const TestComponent = () => {
  const { user, isAuthenticated, handleSignIn, handleSignUp, handleLogout } = useAuth();

  return (
    <div>
      <div data-testid="user">{user ? user.name : 'No user'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'true' : 'false'}</div>
      <button onClick={() => handleSignIn()}>Sign In</button>
      <button onClick={() => handleSignUp({
        name: 'Test User',
        email: 'test@example.com',
        age: 25,
        dateOfBirth: '1999-01-01',
        placeOfBirth: 'Test City',
        timeOfBirth: '12:00:00'
      })}>Sign Up</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
    localStorageMock.removeItem.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <AuthProvider>
        <div>Test Child</div>
      </AuthProvider>
    );

    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should provide default auth state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('should load user from localStorage on mount', () => {
    const savedUser: User = {
      name: 'Saved User',
      email: 'saved@example.com',
      age: 30,
      dateOfBirth: '1994-01-01',
      placeOfBirth: 'Saved City',
      timeOfBirth: '10:00:00'
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedUser));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user')).toHaveTextContent('Saved User');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });

  it('should handle sign in with user data', async () => {
    const userData: User = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 28,
      dateOfBirth: '1996-01-01',
      placeOfBirth: 'New York',
      timeOfBirth: '14:30:00'
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('astroUser', JSON.stringify(userData));
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });

  it('should handle sign in without user data (using saved data)', async () => {
    const savedUser: User = {
      name: 'Existing User',
      email: 'existing@example.com',
      age: 35,
      dateOfBirth: '1989-01-01',
      placeOfBirth: 'Existing City',
      timeOfBirth: '09:00:00'
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedUser));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign In'));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('Existing User');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });

  it('should handle sign up', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('astroUser', expect.any(String));
      expect(localStorageMock.setItem).toHaveBeenCalledWith('isAuthenticated', 'true');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('Test User');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
  });

  it('should handle logout', async () => {
    // First sign in a user
    const userData: User = {
      name: 'Test User',
      email: 'test@example.com',
      age: 25,
      dateOfBirth: '1999-01-01',
      placeOfBirth: 'Test City',
      timeOfBirth: '12:00:00'
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Sign up first
    fireEvent.click(screen.getByText('Sign Up'));

    await waitFor(() => {
      expect(screen.getByTestId('authenticated')).toHaveTextContent('true');
    });

    // Now logout
    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('astroUser');
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    expect(screen.getByTestId('user')).toHaveTextContent('No user');
    expect(screen.getByTestId('authenticated')).toHaveTextContent('false');
  });

  it('should throw error when useAuth is used outside provider', () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });
});