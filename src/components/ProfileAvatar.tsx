import type { AuthUser } from '../types/auth';
import { cn } from '../lib/utils';

export type ProfilePlantAvatarId =
  | 'copihue'
  | 'boldo'
  | 'matico'
  | 'quillay'
  | 'chilco'
  | 'nalca'
  | 'arrayan'
  | 'chagual'
  | 'peumo';

export type ProfilePlantAvatar = {
  id: ProfilePlantAvatarId;
  name: string;
  grid: [number, number];
};

export const PROFILE_PLANT_AVATAR_ATLAS = '/profile-plant-atlas.png';

export const PROFILE_PLANT_AVATARS: ProfilePlantAvatar[] = [
  { id: 'copihue', name: 'Copihue', grid: [0, 0] },
  { id: 'boldo', name: 'Boldo', grid: [1, 0] },
  { id: 'matico', name: 'Matico', grid: [2, 0] },
  { id: 'quillay', name: 'Quillay', grid: [0, 1] },
  { id: 'chilco', name: 'Chilco', grid: [1, 1] },
  { id: 'nalca', name: 'Nalca', grid: [2, 1] },
  { id: 'arrayan', name: 'Arrayan', grid: [0, 2] },
  { id: 'chagual', name: 'Chagual', grid: [1, 2] },
  { id: 'peumo', name: 'Peumo', grid: [2, 2] },
];

function getInitials(name: string | null | undefined) {
  if (!name) return 'U';
  return name.charAt(0).toUpperCase();
}

export function getProfilePlantAvatar(id: string | null | undefined) {
  return PROFILE_PLANT_AVATARS.find((avatar) => avatar.id === id);
}

export function ProfilePlantAvatarImage({
  avatarId,
  className,
  title,
}: {
  avatarId: string | null | undefined;
  className?: string;
  title?: string;
}) {
  const avatar = getProfilePlantAvatar(avatarId) || PROFILE_PLANT_AVATARS[0];
  const [col, row] = avatar.grid;

  return (
    <div
      role="img"
      aria-label={title || avatar.name}
      className={cn('shrink-0 rounded-full bg-[#f7f1e6] bg-no-repeat shadow-sm', className)}
      style={{
        backgroundImage: `url(${PROFILE_PLANT_AVATAR_ATLAS})`,
        backgroundSize: '300% 300%',
        backgroundPosition: `${col * 50}% ${row * 50}%`,
      }}
    />
  );
}

export function ProfileAvatar({
  user,
  className,
  fallbackClassName,
  imageClassName,
  alt = 'Avatar',
}: {
  user: AuthUser | null;
  className?: string;
  fallbackClassName?: string;
  imageClassName?: string;
  alt?: string;
}) {
  const sharedClassName = cn('shrink-0 rounded-full', className);

  if (user?.profileAvatarId) {
    return <ProfilePlantAvatarImage avatarId={user.profileAvatarId} className={cn(sharedClassName, imageClassName)} />;
  }

  if (user?.photoURL) {
    return <img src={user.photoURL} alt={alt} className={cn(sharedClassName, 'object-cover shadow-sm', imageClassName)} />;
  }

  return (
    <div className={cn(sharedClassName, 'flex items-center justify-center bg-[#4a3696] text-white', fallbackClassName)}>
      {getInitials(user?.displayName)}
    </div>
  );
}
