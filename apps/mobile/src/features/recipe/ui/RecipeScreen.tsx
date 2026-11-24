import { PlaceholderScreen } from '../../../shared/ui/PlaceholderScreen';

export interface RecipeScreenProps {
  readonly dishId: string;
}

export function RecipeScreen({ dishId }: RecipeScreenProps) {
  return (
    <PlaceholderScreen
      title="Receita"
      description={`A receita offline do prato ${dishId} aparecerá aqui.`}
    />
  );
}
