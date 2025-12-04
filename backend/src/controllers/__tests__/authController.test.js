import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const mockFindOne = jest.fn();
const mockCreate = jest.fn();

jest.unstable_mockModule('../../models/userModel.js', () => ({
  __esModule: true,
  default: {
    findOne: mockFindOne,
    create: mockCreate,
  },
}));

const { registerUser } = await import('../authController.js');

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('registerUser', () => {
  beforeEach(() => {
    mockFindOne.mockReset();
    mockCreate.mockReset();
  });

  test('returns 400 when user already exists', async () => {
    mockFindOne.mockResolvedValue({ _id: 'u1', email: 'test@example.com' });

    const req = {
      headers: {},
      body: {
        email: 'test@example.com',
        password: 'password123',
      },
    };
    const res = createMockRes();

    await registerUser(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: 'User already exists' });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  test('creates a new user and returns 201 when data is valid and user does not exist', async () => {
    mockFindOne.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ _id: 'u2', email: 'new@example.com' });

    const req = {
      headers: {},
      body: {
        email: 'new@example.com',
        password: 'password123',
      },
    };
    const res = createMockRes();

    await registerUser(req, res);

    expect(mockFindOne).toHaveBeenCalledWith({ email: 'new@example.com' });
    expect(mockCreate).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
    expect(res.body).toMatchObject({
      message: 'User registered successfully',
      _id: 'u2',
      email: 'new@example.com',
    });
  });

  test('returns 500 when the database lookup fails', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    mockFindOne.mockRejectedValue(new Error('DB down'));

    const req = {
      headers: {},
      body: {
        email: 'error@example.com',
        password: 'password123',
      },
    };
    const res = createMockRes();

    await registerUser(req, res);

    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ message: 'Server Error' });

    consoleSpy.mockRestore();
  });
});
