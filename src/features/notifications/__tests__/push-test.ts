import { getPushPermission, requestPushPermission } from '../permission';
import { getPushToken, getPushTokenWithin, registerPushToken } from '../push';

// jest-expo runs as iOS by default, so these cover the iOS branches.
const mockGetToken = jest.fn();
const mockHasPermission = jest.fn();
const mockRequestPermission = jest.fn();
const mockRegisterDevice = jest.fn(async () => ({}));

jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: () => ({}),
  getToken: () => mockGetToken(),
  hasPermission: () => mockHasPermission(),
  requestPermission: () => mockRequestPermission(),
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    EPHEMERAL: 3,
  },
}));

jest.mock('@/api/generated/endpoints/user/user', () => ({
  userRegisterDevice: (...args: unknown[]) => mockRegisterDevice(...(args as [])),
}));

beforeEach(() => jest.clearAllMocks());

describe('push token', () => {
  it('is null instead of an error when the device has none (iOS simulator)', async () => {
    mockGetToken.mockRejectedValue(new Error('No APNS token'));
    await expect(getPushToken()).resolves.toBeNull();
  });

  it('gives up after the timeout on logout', async () => {
    jest.useFakeTimers();
    mockGetToken.mockReturnValue(new Promise(() => undefined)); // never resolves
    const result = getPushTokenWithin(3000);
    jest.advanceTimersByTime(3000);
    await expect(result).resolves.toBeNull();
    jest.useRealTimers();
  });

  it('registers the token with the platform', async () => {
    mockGetToken.mockResolvedValue('fcm-token');
    await registerPushToken(42);
    expect(mockRegisterDevice).toHaveBeenCalledWith(42, { fcmToken: 'fcm-token', platform: 'IOS' });
  });

  it('shares one request between concurrent registrations of the same token', async () => {
    await Promise.all([registerPushToken(42, 'same'), registerPushToken(42, 'same')]);
    expect(mockRegisterDevice).toHaveBeenCalledTimes(1);

    // Once finished, a later registration goes out again (e.g. next app start).
    await registerPushToken(42, 'same');
    expect(mockRegisterDevice).toHaveBeenCalledTimes(2);
  });

  it('uses a refreshed token as given and skips when there is none', async () => {
    await registerPushToken(42, 'new-token');
    expect(mockRegisterDevice).toHaveBeenCalledWith(42, { fcmToken: 'new-token', platform: 'IOS' });

    mockRegisterDevice.mockClear();
    mockGetToken.mockResolvedValue(null);
    await registerPushToken(42);
    expect(mockRegisterDevice).not.toHaveBeenCalled();
  });
});

describe('push permission (iOS)', () => {
  it.each([
    [-1, 'undetermined'],
    [0, 'blocked'], // iOS asks only once
    [1, 'granted'],
    [2, 'granted'], // provisional counts, as in the Flutter app
  ])('status %p -> %p', async (status, expected) => {
    mockHasPermission.mockResolvedValue(status);
    mockRequestPermission.mockResolvedValue(status);
    await expect(getPushPermission()).resolves.toBe(expected);
    await expect(requestPushPermission()).resolves.toBe(expected);
  });
});
