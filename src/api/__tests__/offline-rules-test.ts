import { shouldPersistMutation, shouldPersistQuery } from '../offline-rules';

const success = { status: 'success' };

describe('shouldPersistQuery', () => {
  it.each([
    [['/farm-member']],
    [['/field/farm/17', { size: 20 }]],
    [['infinite', '/field/farm/17', { size: 20 }]],
    [['infinite', '/occurrence/farm/17', { size: 20 }]],
    [['/occurrence/5']],
    [['/occurrence/5/media']],
  ])('saves %j', (queryKey) => {
    expect(shouldPersistQuery({ queryKey, state: success })).toBe(true);
  });

  it.each([[['/notification']], [['infinite', '/notification', {}]], [['/user/19']], [['local']]])(
    'keeps %j off the disk',
    (queryKey) => {
      expect(shouldPersistQuery({ queryKey, state: success })).toBe(false);
    },
  );

  it('does not save a query without data', () => {
    const queryKey = ['/farm-member'];
    expect(shouldPersistQuery({ queryKey, state: { status: 'error' } })).toBe(false);
    expect(shouldPersistQuery({ queryKey, state: { status: 'pending' } })).toBe(false);
  });
});

describe('shouldPersistMutation', () => {
  it('saves a paused mutation that opted in', () => {
    const mutation = { options: { meta: { offlineQueue: true } }, state: { isPaused: true } };
    expect(shouldPersistMutation(mutation)).toBe(true);
  });

  it('does not save one that is already running', () => {
    const mutation = { options: { meta: { offlineQueue: true } }, state: { isPaused: false } };
    expect(shouldPersistMutation(mutation)).toBe(false);
  });

  it('never saves other paused mutations, such as a login', () => {
    expect(shouldPersistMutation({ options: {}, state: { isPaused: true } })).toBe(false);
  });
});
