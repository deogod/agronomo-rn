import { useFarmMemberFindAllByUserId } from '@/api/generated/endpoints/farm-member/farm-member';

/**
 * The places (farms or homes) the user belongs to, with their role.
 * Flutter: FindAllFarmMembersUseCase in HomeBloc.
 *
 * `select` turns the API envelope into what the screen needs. The cache keeps
 * the full response; select runs on top of it for each hook that uses it.
 */
export function useMyFarms() {
  return useFarmMemberFindAllByUserId({
    query: { select: (response) => response.data },
  });
}

/**
 * One place, read from the same cached list: same query key, so opening a
 * farm from the home makes no new request (Flutter passed the entity in the
 * route arguments; here the route only carries the id).
 */
export function useMyFarm(farmId: number) {
  return useFarmMemberFindAllByUserId({
    query: {
      select: (response) => response.data.find((member) => member.farm.id === farmId) ?? null,
    },
  });
}
