import { Redirect } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, typography } from '../../src/shared/theme';
import {
  AllergenScopeBanner,
  AllergenSeal,
  AllergenTag,
  BadgeIcon,
  Button,
  type ButtonVariant,
  Chip,
  DishThumb,
  EmptyState,
  FailClosedAlert,
  FieldLabel,
  ICONS,
  Icon,
  IconButton,
  type IconName,
  IngredientRow,
  LastSync,
  Notice,
  OfflineBar,
  Pill,
  ProgressBar,
  SearchField,
  SegmentedControl,
  Skeleton,
  Star,
  StepItem,
  Stepper,
  SwapButton,
  TabBar,
  TextArea,
  TextLink,
  Toast,
  Topbar,
} from '../../src/shared/ui';

const noop = () => undefined;
const BUTTON_VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'unlock', 'danger'];
const SAMPLE_SYNC = new Date(2026, 10, 23, 9, 10);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

/** Every shared/ui component and variant, for visual review against the Figma page (dev only). */
export default function UiCatalogRoute() {
  const [chips, setChips] = useState<Record<string, boolean>>({ Ovos: true });
  const [segment, setSegment] = useState('ingredients');
  const [rating, setRating] = useState(4.5);
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState('');

  if (!__DEV__) return <Redirect href="/" />;

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <Topbar title="Catálogo de componentes" />

        <Section title="Navegação">
          <Topbar title="Título" leading="back" onLeadingPress={noop} />
          <Topbar
            title="Título"
            leading="close"
            onLeadingPress={noop}
            trailing={<Pill type="offline" label="Offline" />}
          />
          <TabBar
            items={[
              { key: 'd', label: 'Descobrir', icon: 'tab-discover', active: true, onPress: noop },
              {
                key: 'k',
                label: 'Cozinha',
                icon: 'tab-kitchen',
                active: false,
                hasNews: true,
                onPress: noop,
              },
              { key: 'c', label: 'Coleção', icon: 'tab-collection', active: false, onPress: noop },
              { key: 'p', label: 'Perfil', icon: 'tab-profile', active: false, onPress: noop },
            ]}
          />
          <Row>
            <IconButton icon="back" accessibilityLabel="Voltar" onPress={noop} />
            <IconButton icon="close" accessibilityLabel="Fechar" onPress={noop} />
            <IconButton icon="plus" accessibilityLabel="Desabilitado" onPress={noop} disabled />
          </Row>
        </Section>

        <Section title="Ações">
          {BUTTON_VARIANTS.map((variant) => (
            <Row key={variant}>
              <Button label={variant} variant={variant} onPress={noop} />
              <Button label={variant} variant={variant} size="lg" onPress={noop} />
              <Button label={variant} variant={variant} onPress={noop} disabled />
            </Row>
          ))}
          <Row>
            <Button label="Salvar" loadingLabel="Salvando…" onPress={noop} />
            <Button label="Quero cozinhar" icon="plus" onPress={noop} />
          </Row>
          <Row>
            <TextLink label="Ver" onPress={noop} />
            <TextLink label="Ver" tone="unlock" onPress={noop} />
            <View style={styles.dark}>
              <TextLink label="Ver" tone="onDark" onPress={noop} />
            </View>
          </Row>
        </Section>

        <Section title="Seleção">
          <Row>
            {['Leite', 'Ovos', 'Soja'].map((label) => (
              <Chip
                key={label}
                label={label}
                selected={chips[label] ?? false}
                onPress={() => setChips((prev) => ({ ...prev, [label]: !prev[label] }))}
              />
            ))}
          </Row>
          <SegmentedControl
            options={[
              { key: 'ingredients', label: 'Ingredientes' },
              { key: 'steps', label: 'Modo de preparo' },
            ]}
            selectedKey={segment}
            onChange={setSegment}
          />
          <Row>
            <Pill type="offline" label="Offline" />
            <Pill type="unlock" label="Evolução" />
            <Pill type="soon" label="Em breve" />
          </Row>
        </Section>

        <Section title="Segurança alimentar">
          <Row>
            <AllergenSeal state="verified" />
            <AllergenSeal state="verified" compact />
            <AllergenSeal state="source_declared" />
            <AllergenSeal state="unverified" />
          </Row>
          <AllergenScopeBanner />
          <AllergenScopeBanner size="compact" />
          <FailClosedAlert reasons={['allergen_match']} matchedAllergens={['amendoim']} />
          <FailClosedAlert reasons={['source_declared_unconfirmed']} size="compact" />
          <AllergenTag />
        </Section>

        <Section title="Estados e rede">
          <OfflineBar />
          <Notice type="info" message="Mensagem de aviso." />
          <Notice type="offline" message="Mensagem de aviso." />
          <Notice
            type="error"
            title="Sem conexão agora."
            message="Para salvar sua avaliação, precisamos de internet. Nada foi perdido."
            onRetry={noop}
          />
          <Toast message="Adicionado à sua cozinha" actionLabel="Ver" onAction={noop} />
          <LastSync syncedAt={SAMPLE_SYNC} />
          <Skeleton height={20} />
          <Skeleton height={72} width={72} radius="md" />
          <EmptyState
            title="Sua coleção começa no primeiro prato"
            message="Avalie um prato para ele aparecer aqui."
            actionLabel="Descobrir pratos"
            onAction={noop}
          />
        </Section>

        <Section title="Conteúdo">
          <ProgressBar value={0.33} accessibilityLabel="Progresso de exemplo" />
          <Row>
            <DishThumb accessibilityLabel="Prato sem foto" />
          </Row>
          <DishThumb variant="cover" accessibilityLabel="Capa sem foto" />
          <IngredientRow
            name="Berinjela"
            quantity="1 média"
            trailing={<SwapButton onPress={noop} accessibilityLabel="Ver trocas para Berinjela" />}
          />
          <IngredientRow
            name="Queijo"
            quantity="100 g"
            restricted
            trailing={<SwapButton onPress={noop} accessibilityLabel="Ver trocas para Queijo" />}
          />
          <StepItem number={1} text="Separe e prepare todos os ingredientes." state="done" />
          <StepItem number={2} text="Separe e prepare todos os ingredientes." state="current" />
          <StepItem number={3} text="Separe e prepare todos os ingredientes." state="next" />
          <StepItem number={4} text="Separe e prepare todos os ingredientes." />
        </Section>

        <Section title="Formulários e avaliação">
          <FieldLabel label="Sua nota" hint="obrigatória" />
          <Row>
            <Star fill="empty" />
            <Star fill="half" />
            <Star fill="full" />
          </Row>
          <Stepper
            value={rating}
            onDecrease={() => setRating((v) => Math.max(0.5, v - 0.5))}
            onIncrease={() => setRating((v) => Math.min(5, v + 0.5))}
            min={0.5}
          />
          <SearchField
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar alérgeno (ex.: leite, castanha)"
          />
          <FieldLabel label="Relato pessoal" hint="opcional" />
          <TextArea
            value={notes}
            onChangeText={setNotes}
            placeholder="Como foi?"
            accessibilityLabel="Relato pessoal"
          />
          <Row>
            <BadgeIcon state="earned" accessibilityLabel="Conquista obtida" />
            <BadgeIcon state="locked" accessibilityLabel="Conquista ainda não obtida" />
          </Row>
        </Section>

        <Section title="Ícones">
          <Row>
            {(Object.keys(ICONS) as IconName[]).map((name) => (
              <Icon key={name} name={name} accessibilityLabel={name} />
            ))}
          </Row>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  section: { gap: spacing.md, paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  sectionTitle: { ...typography.overline, color: colors.textSecondary },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  dark: { backgroundColor: colors.textPrimary, paddingHorizontal: spacing.sm },
});
