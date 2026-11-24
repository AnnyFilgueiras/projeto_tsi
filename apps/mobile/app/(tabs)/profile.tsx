import { useDependencies } from '../../src/app/composition/dependencies-context';
import { ProfileScreen } from '../../src/features/profile/ui/ProfileScreen';

export default function ProfileRoute() {
  const { checkApi } = useDependencies();
  return <ProfileScreen checkApi={checkApi} />;
}
