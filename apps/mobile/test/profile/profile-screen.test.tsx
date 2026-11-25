import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import type { ProfileSnapshot } from '../../src/features/profile/domain/profile-snapshot';
import type {
  RegisterRestrictionsInput,
  RegisterRestrictionsResult,
} from '../../src/features/profile/domain/register-restrictions';
import type {
  RevokeRestrictionInput,
  RevokeRestrictionResult,
} from '../../src/features/profile/domain/revoke-restriction';
import type { SavePreferencesResult } from '../../src/features/profile/domain/save-culinary-preferences';
import { ProfileScreen } from '../../src/features/profile/ui/ProfileScreen';
import { SCOPE_BANNER_TEXT } from '../../src/shared/ui/allergen/copy';

const CONSENT_AT = new Date(2026, 10, 23, 14, 5);
const FR = { id: 'c-fr', name: 'Francesa' };
const TH = { id: 'c-th', name: 'Tailandesa' };
const OFFLINE_RETRY = { operation: {} as never };

/**
 * In-memory profile: `revoke`/`register` change it only when their scripted answer confirms,
 * mirroring ADR-008 Stage 1 (local copy changes after the server).
 */
function fakeProfile(initial: Partial<ProfileSnapshot> = {}) {
  let state: ProfileSnapshot = {
    restrictions: [],
    consentAt: null,
    preferences: [],
    lastSyncAt: null,
    ...initial,
  };
  const revokeReplies: RevokeRestrictionResult['status'][] = [];
  const registerReplies: RegisterRestrictionsResult['status'][] = [];
  const preferenceReplies: SavePreferencesResult[] = [];

  const revokeRestriction = jest.fn(
    async ({ code }: RevokeRestrictionInput): Promise<RevokeRestrictionResult> => {
      const status = revokeReplies.shift() ?? 'removed';
      if (status === 'unavailable') return { status, retry: OFFLINE_RETRY };
      if (status === 'rejected') return { status };
      const restrictions = state.restrictions.filter((item) => item !== code);
      state = { ...state, restrictions, consentAt: restrictions.length ? state.consentAt : null };
      return { status };
    },
  );

  const registerRestrictions = jest.fn(
    async ({
      codes,
      consented,
    }: RegisterRestrictionsInput): Promise<RegisterRestrictionsResult> => {
      if (!consented) return { status: 'consent-required' };
      const status = registerReplies.shift() ?? 'saved';
      if (status === 'unavailable') {
        return { status, retry: { consentAt: '', confirmed: [], pending: {} } };
      }
      if (status !== 'saved') return { status } as RegisterRestrictionsResult;
      state = {
        ...state,
        restrictions: [...state.restrictions, ...codes].sort(),
        consentAt: state.consentAt ?? CONSENT_AT,
      };
      return { status: 'saved' };
    },
  );

  const savePreferences = jest.fn(async (ids: readonly string[]) => {
    const reply = preferenceReplies.shift() ?? 'saved';
    if (reply === 'saved') state = { ...state, preferences: ids };
    return reply;
  });

  return {
    props: {
      readProfile: jest.fn(async () => state),
      listCuisines: jest.fn(async () => [FR, TH]),
      registerRestrictions,
      revokeRestriction,
      savePreferences,
    },
    revokeReplies,
    registerReplies,
    preferenceReplies,
  };
}

const withPeanut = { restrictions: ['amendoim'], consentAt: CONSENT_AT };

describe('ProfileScreen (US09, RN09, RN10, #78)', () => {
  it('lists restrictions with the consent date and the RN16 banner', async () => {
    const { props } = fakeProfile({
      restrictions: ['amendoim', 'soja'],
      consentAt: CONSENT_AT,
      lastSyncAt: new Date(2026, 10, 24, 14, 32),
    });
    render(<ProfileScreen {...props} />);

    expect(await screen.findByText('Amendoim')).toBeTruthy();
    expect(screen.getByText('Soja')).toBeTruthy();
    expect(screen.getByText('Protegidas · consentimento em 23/11/2026 às 14:05')).toBeTruthy();
    expect(screen.getByText(SCOPE_BANNER_TEXT)).toBeTruthy();
    expect(screen.getByText('Disponível offline · atualizado em 24/11 às 14:32')).toBeTruthy();
    // The removed placeholder's technical details stay out (#78).
    expect(screen.queryByText(/Servidor/)).toBeNull();
  });

  it('shows the empty state without the RN16 banner', async () => {
    const { props } = fakeProfile();
    render(<ProfileScreen {...props} />);

    expect(
      await screen.findByText(
        'Alguém tem alergia ou intolerância? Adicione para filtrarmos as sugestões.',
      ),
    ).toBeTruthy();
    expect(screen.queryByText(SCOPE_BANNER_TEXT)).toBeNull();
    expect(screen.getByRole('button', { name: 'Adicionar restrição' })).toBeTruthy();
  });

  it('warns that removing the last restriction withdraws the consent, then shows the empty state', async () => {
    const { props } = fakeProfile(withPeanut);
    render(<ProfileScreen {...props} />);

    fireEvent.press(await screen.findByRole('button', { name: 'Remover Amendoim' }));
    const sheet = screen.getByTestId('remove-restriction-sheet');
    expect(within(sheet).getByText('Remover Amendoim?')).toBeTruthy();
    expect(
      within(sheet).getByText(
        'Pratos com amendoim podem voltar às sugestões. Seu consentimento também será retirado.',
      ),
    ).toBeTruthy();

    fireEvent.press(within(sheet).getByRole('button', { name: 'Remover' }));

    expect(
      await screen.findByText(
        'Alguém tem alergia ou intolerância? Adicione para filtrarmos as sugestões.',
      ),
    ).toBeTruthy();
    expect(props.revokeRestriction).toHaveBeenCalledWith({ code: 'amendoim', retry: undefined });
    expect(screen.queryByText(/consentimento em/)).toBeNull();
  });

  it('does not mention consent when other restrictions remain', async () => {
    const { props } = fakeProfile({ restrictions: ['amendoim', 'soja'], consentAt: CONSENT_AT });
    render(<ProfileScreen {...props} />);

    fireEvent.press(await screen.findByRole('button', { name: 'Remover Soja' }));

    expect(
      within(screen.getByTestId('remove-restriction-sheet')).getByText(
        'Pratos com soja podem voltar às sugestões.',
      ),
    ).toBeTruthy();
  });

  it('keeps the chip when offline and retries with the same operation', async () => {
    const { props, revokeReplies } = fakeProfile(withPeanut);
    revokeReplies.push('unavailable');
    render(<ProfileScreen {...props} />);

    fireEvent.press(await screen.findByRole('button', { name: 'Remover Amendoim' }));
    fireEvent.press(screen.getByRole('button', { name: 'Remover' }));

    expect(await screen.findByText('Sem conexão. Nada foi alterado.')).toBeTruthy();
    expect(screen.getByTestId('restriction-amendoim')).toBeTruthy();

    fireEvent.press(screen.getByRole('button', { name: 'Tentar novamente' }));

    await waitFor(() => expect(screen.queryByTestId('restriction-amendoim')).toBeNull());
    expect(props.revokeRestriction).toHaveBeenLastCalledWith({
      code: 'amendoim',
      retry: OFFLINE_RETRY,
    });
  });

  it('asks for consent again when adding after the last restriction was revoked', async () => {
    const { props } = fakeProfile();
    render(<ProfileScreen {...props} />);

    fireEvent.press(await screen.findByRole('button', { name: 'Adicionar restrição' }));
    const sheet = screen.getByTestId('add-restriction-sheet');
    fireEvent.press(within(sheet).getByRole('checkbox', { name: 'Ovos' }));
    expect(within(sheet).getByTestId('consent-card')).toBeTruthy();

    fireEvent.press(within(sheet).getByRole('button', { name: 'Salvar' }));
    expect(await within(sheet).findByText('Marque o consentimento para salvar.')).toBeTruthy();
    expect(props.registerRestrictions).not.toHaveBeenCalled();

    fireEvent.press(within(sheet).getByRole('checkbox', { name: /Concordo/ }));
    fireEvent.press(within(sheet).getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByTestId('restriction-ovo')).toBeTruthy();
  });

  it('adds without asking again while consent is on record, hiding active codes', async () => {
    const { props } = fakeProfile(withPeanut);
    render(<ProfileScreen {...props} />);

    fireEvent.press(await screen.findByRole('button', { name: 'Adicionar' }));
    const sheet = screen.getByTestId('add-restriction-sheet');
    expect(within(sheet).queryByRole('checkbox', { name: 'Amendoim' })).toBeNull();

    fireEvent.press(within(sheet).getByRole('checkbox', { name: 'Ovos' }));
    expect(within(sheet).queryByTestId('consent-card')).toBeNull();
    fireEvent.press(within(sheet).getByRole('button', { name: 'Salvar' }));

    expect(await screen.findByTestId('restriction-ovo')).toBeTruthy();
    expect(props.registerRestrictions).toHaveBeenCalledWith({
      codes: ['ovo'],
      consented: true,
      retry: undefined,
    });
  });

  it('saves a cuisine and rolls it back when offline', async () => {
    const { props, preferenceReplies } = fakeProfile({ preferences: [FR.id] });
    render(<ProfileScreen {...props} />);

    const thai = await screen.findByTestId(`cuisine-${TH.id}`);
    preferenceReplies.push('unavailable');
    fireEvent.press(thai);

    expect(await screen.findByText('Sem conexão. Nada foi alterado.')).toBeTruthy();
    expect(screen.getByTestId(`cuisine-${TH.id}`)).not.toBeChecked();
    expect(props.savePreferences).toHaveBeenCalledWith([FR.id, TH.id]);
  });

  it('does not bring back a restriction removed while a cuisine save was pending', async () => {
    const { props } = fakeProfile({ ...withPeanut, preferences: [FR.id] });
    let answerSave: (reply: SavePreferencesResult) => void = () => {};
    props.savePreferences.mockImplementationOnce(
      () => new Promise<SavePreferencesResult>((resolve) => (answerSave = resolve)),
    );
    render(<ProfileScreen {...props} />);

    fireEvent.press(await screen.findByTestId(`cuisine-${TH.id}`));
    fireEvent.press(screen.getByRole('button', { name: 'Remover Amendoim' }));
    fireEvent.press(screen.getByRole('button', { name: 'Remover' }));
    await waitFor(() => expect(screen.queryByTestId('restriction-amendoim')).toBeNull());

    answerSave('unavailable');

    expect(await screen.findByText('Sem conexão. Nada foi alterado.')).toBeTruthy();
    expect(screen.queryByTestId('restriction-amendoim')).toBeNull();
    expect(screen.getByTestId(`cuisine-${TH.id}`)).not.toBeChecked();
  });

  it('sends an empty list when the last cuisine is unchecked (RN10)', async () => {
    const { props } = fakeProfile({ preferences: [FR.id] });
    render(<ProfileScreen {...props} />);

    fireEvent.press(await screen.findByTestId(`cuisine-${FR.id}`));

    await waitFor(() => expect(props.savePreferences).toHaveBeenCalledWith([]));
    expect(screen.getByTestId(`cuisine-${FR.id}`)).not.toBeChecked();
  });
});
