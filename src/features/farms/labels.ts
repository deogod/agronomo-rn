import type {
  FarmDtoActivitiesItem,
  FarmDtoType,
  FarmMemberDto,
  FarmMemberDtoRole,
} from '@/api/generated/model';

// Record<Enum, string>: adding a value to the API enum breaks the build here
// until it gets a label (Flutter: switch over the enum with no default).
export const farmTypeLabel: Record<FarmDtoType, string> = {
  FARM: 'Fazenda',
  HOME: 'Casa',
};

export const roleLabel: Record<FarmMemberDtoRole, string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Admin',
  MEMBER: 'Membro',
};

export const activityLabel: Record<FarmDtoActivitiesItem, string> = {
  CROP: 'Lavoura',
  CATTLE: 'Pecuária',
};

export function locationLabel({ farm }: Pick<FarmMemberDto, 'farm'>): string | null {
  if (!farm.city) return null;
  return farm.state ? `${farm.city}, ${farm.state}` : farm.city;
}

const hectares = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export function areaLabel(areaHa: number | null | undefined): string | null {
  return areaHa == null ? null : `${hectares.format(areaHa)} ha`;
}
