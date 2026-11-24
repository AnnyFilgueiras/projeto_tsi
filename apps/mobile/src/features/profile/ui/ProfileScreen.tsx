import { PACKAGE_VERSION } from '@panelada/allergen-rules/rules';
import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { PlaceholderScreen } from '../../../shared/ui/PlaceholderScreen';
import { colors, typography } from '../../../shared/theme';

export interface ProfileScreenProps {
  /** Resolves true when `GET /v1/health` answers; injected by the route (A8). */
  readonly checkApi: () => Promise<boolean>;
}

type ApiStatus = 'checking' | 'online' | 'offline';

const API_STATUS_LABEL: Record<ApiStatus, string> = {
  checking: 'verificando…',
  online: 'conectado',
  offline: 'sem conexão',
};

/**
 * Profile tab shell. Shows the allergen rules version (proves the `rules` entrypoint bundles under
 * Metro, ADR-014 H) and API reachability while the real profile UI (UX-01H) is pending.
 */
export function ProfileScreen({ checkApi }: ProfileScreenProps) {
  const [apiStatus, setApiStatus] = useState<ApiStatus>('checking');

  useEffect(() => {
    let active = true;
    checkApi()
      .then((online) => active && setApiStatus(online ? 'online' : 'offline'))
      .catch(() => active && setApiStatus('offline'));
    return () => {
      active = false;
    };
  }, [checkApi]);

  return (
    <PlaceholderScreen title="Perfil" description="Suas restrições e preferências aparecerão aqui.">
      <Text style={styles.meta}>Versão das regras de alérgenos: {PACKAGE_VERSION}</Text>
      <Text style={styles.meta}>Servidor: {API_STATUS_LABEL[apiStatus]}</Text>
    </PlaceholderScreen>
  );
}

const styles = StyleSheet.create({
  meta: { ...typography.caption, color: colors.textMuted },
});
