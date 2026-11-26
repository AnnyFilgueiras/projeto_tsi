import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  colors,
  elevation,
  radius,
  spacing,
  touchTarget,
  typography,
} from '../../../../shared/theme';
import { Icon, type IconName } from '../../../../shared/ui';
import type { EvolutionChain, EvolutionNode } from '../../domain/progress-model';
import { COLLECTION_COPY } from './copy';

export interface EvolutionsViewProps {
  readonly chains: readonly EvolutionChain[];
  readonly onOpenRecipe: (dishId: string) => void;
}

const NODE_ICON_SIZE = 40;
const CONNECTOR_WIDTH = 2;

/** US15 / RN02: one card per chain, levels stacked top to bottom (the order shows the level). */
export function EvolutionsView({ chains, onOpenRecipe }: EvolutionsViewProps) {
  return (
    <View style={styles.list}>
      {chains.map((chain) => (
        <View key={chain.rootDishId} style={styles.card} testID={`chain-${chain.rootDishId}`}>
          {chain.nodes.map((node, index) => (
            <Fragment key={node.dishId}>
              {index > 0 ? <View style={styles.connector} /> : null}
              <EvolutionNodeRow node={node} onOpenRecipe={onOpenRecipe} />
            </Fragment>
          ))}
        </View>
      ))}
    </View>
  );
}

const LOOK: Readonly<
  Record<EvolutionNode['status'], { icon: IconName; tint: string; bg: string }>
> = {
  completed: { icon: 'check', tint: colors.primary, bg: colors.primarySoft },
  unlocked: { icon: 'dish-placeholder', tint: colors.successUnlock, bg: colors.successUnlockSoft },
  // A locked node is a mystery (#86, format C): a question mark, never the dish name.
  locked: { icon: 'question', tint: colors.textSecondary, bg: colors.surfaceAlt },
};

function EvolutionNodeRow({
  node,
  onOpenRecipe,
}: {
  node: EvolutionNode;
  onOpenRecipe: (dishId: string) => void;
}) {
  const look = LOOK[node.status];
  const content = (
    <>
      <View style={[styles.nodeIcon, { backgroundColor: look.bg }]}>
        <Icon name={look.icon} size={20} color={look.tint} />
      </View>
      <View style={styles.nodeText}>
        <Text style={[styles.nodeName, node.name === null && styles.mystery]}>
          {node.name ?? COLLECTION_COPY.mysteryDish}
        </Text>
        <NodeStatus node={node} />
      </View>
    </>
  );

  // Completed nodes are a record, not a call to action; the other two lead somewhere (RN02):
  // the dish itself when unlocked, the base dish that reveals it when locked. A mystery whose
  // base is a mystery too has nothing to open yet: the node above is the next step.
  const target =
    node.status === 'unlocked'
      ? node.dishId
      : node.status === 'locked' && node.baseDish?.name
        ? node.baseDish.dishId
        : null;
  if (!target) {
    return (
      <View style={styles.node} testID={`node-${node.dishId}`}>
        {content}
      </View>
    );
  }
  return (
    <Pressable
      onPress={() => onOpenRecipe(target)}
      accessibilityRole="button"
      accessibilityLabel={
        node.status === 'locked' && node.baseDish?.name
          ? COLLECTION_COPY.lockedA11y(node.baseDish.name)
          : `${node.name ?? COLLECTION_COPY.mysteryDish}. ${COLLECTION_COPY.readyToCook}`
      }
      style={styles.node}
      testID={`node-${node.dishId}`}
    >
      {content}
      {/* `back` is the only chevron glyph; turned around it reads as "open". */}
      <View style={styles.chevron}>
        <Icon name="back" size={16} color={colors.textSecondary} />
      </View>
    </Pressable>
  );
}

function NodeStatus({ node }: { node: EvolutionNode }) {
  if (node.status === 'completed') {
    return <Text style={[styles.status, styles.done]}>{COLLECTION_COPY.completed}</Text>;
  }
  if (node.status === 'unlocked') {
    return <Text style={[styles.status, styles.ready]}>{COLLECTION_COPY.readyToCook}</Text>;
  }
  if (!node.baseDish) return null;
  if (node.baseDish.name === null) {
    return <Text style={styles.status}>{COLLECTION_COPY.revealAboveFirst}</Text>;
  }
  return (
    <Text style={styles.status}>
      {COLLECTION_COPY.lockedPrefix}
      <Text style={styles.base}>{node.baseDish.name}</Text>
      {COLLECTION_COPY.lockedSuffix}
    </Text>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    ...elevation.card,
  },
  node: {
    minHeight: touchTarget.min,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nodeIcon: {
    width: NODE_ICON_SIZE,
    height: NODE_ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  connector: {
    width: CONNECTOR_WIDTH,
    height: spacing.md,
    marginLeft: (NODE_ICON_SIZE - CONNECTOR_WIDTH) / 2,
    backgroundColor: colors.border,
  },
  nodeText: { flex: 1, gap: spacing.xxs },
  nodeName: {
    ...typography.body,
    fontWeight: typography.subtitle.fontWeight,
    color: colors.textPrimary,
  },
  mystery: { color: colors.textSecondary },
  status: { ...typography.caption, color: colors.textSecondary },
  done: { color: colors.primary },
  ready: { color: colors.successUnlock },
  chevron: { transform: [{ rotate: '180deg' }] },
  base: { fontWeight: typography.button.fontWeight, color: colors.textPrimary },
});
