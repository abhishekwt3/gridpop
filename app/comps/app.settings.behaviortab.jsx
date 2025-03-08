import { Card, TextField, Text, BlockStack } from "@shopify/polaris";

const BehaviorTab = ({ maxTriggers, setMaxTriggers }) => {
  return (
    <Card sectioned>
      <BlockStack vertical gap="4">
        <Text variant="bodyMd" as="p" color="subdued">
          Configure how the popup behaves
        </Text>
        <TextField
          label="Maximum Displays Per Session"
          type="number"
          name="max_triggers"
          value={maxTriggers}
          onChange={setMaxTriggers}
          helpText="How many times should the popup appear per user session"
          min={1}
          max={10}
        />
      </BlockStack>
    </Card>
  );
};

export default BehaviorTab;
