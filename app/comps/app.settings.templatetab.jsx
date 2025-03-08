import { Card, Select, Text, BlockStack } from "@shopify/polaris";

const TemplateTab = ({ popupTemplate, setPopupTemplate }) => {
  const templateOptions = [
    { label: "Discount Offer", value: "discount" },
    { label: "Newsletter Signup", value: "newsletter" },
    { label: "Quick Survey", value: "survey" }
  ];

  return (
    <Card sectioned>
      <BlockStack vertical gap="4">
        <Text variant="bodyMd" as="p" color="subdued">
          Choose the type of popup to display to your customers
        </Text>
        <Select
          label="Popup Template"
          options={templateOptions}
          name="popup_template"
          value={popupTemplate}
          onChange={setPopupTemplate}
          helpText="Select the template that best suits your needs"
        />
      </BlockStack>
    </Card>
  );
};

export default TemplateTab;
