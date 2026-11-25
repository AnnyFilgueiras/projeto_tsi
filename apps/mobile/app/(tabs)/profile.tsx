import { useDependencies } from '../../src/app/composition/dependencies-context';
import { ProfileScreen } from '../../src/features/profile/ui/ProfileScreen';

export default function ProfileRoute() {
  const { profile } = useDependencies();
  return (
    <ProfileScreen
      readProfile={profile.readProfile}
      listCuisines={profile.listCuisines}
      registerRestrictions={profile.registerRestrictions}
      revokeRestriction={profile.revokeRestriction}
      savePreferences={profile.savePreferences}
    />
  );
}
