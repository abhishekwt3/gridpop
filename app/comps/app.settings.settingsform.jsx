import { Card, Button, Tabs, BlockStack } from "@shopify/polaris";
import TemplateTab from "./templatetab.jsx";
import BehaviorTab from "./behaviortab.jsx";
import { useState, useCallback } from "react";

const SettingsForm = ({
  shopId,
  shopUrl,
  initialSettings,
  onSubmit
}) => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [popupTemplate, setPopupTemplate] = useState(
    initialSettings?.popupTemplate || "discount"
  );
  const [maxTriggers, setMaxTriggers] = useState(
    initialSettings?.maxTriggers?.toString() || "2"
  );

  const handleTabChange = useCallback((selectedTabIndex) => {
    setSelectedTab(selectedTabIndex);
  }, []);

  const tabs = [
    {
      id: 'template',
      content: 'Template',
      accessibilityLabel: 'Template',
      panelID: 'template-content',
    },
    {
      id: 'behavior',
      content: 'Behavior',
      accessibilityLabel: 'Behavior',
      panelID: 'behavior-content',
    },
  ];

  return (
    <Card>
      <Tabs tabs={tabs} selected={selectedTab} onSelect={handleTabChange}>
        <Card.Section>
          <form
            method="post"
            encType="application/x-www-form-urlencoded"
            onSubmit={(event) => {
              event.preventDefault();
              onSubmit(event.target);
            }}
          >
            <input type="hidden" name="shopId" value={shopId} />
            <input type="hidden" name="shopUrl" value={shopUrl} />

            <BlockStack vertical gap="4">
              {selectedTab === 0 ? (
                <TemplateTab
                  popupTemplate={popupTemplate}
                  setPopupTemplate={setPopupTemplate}
                />
              ) : (
                <BehaviorTab
                  maxTriggers={maxTriggers}
                  setMaxTriggers={setMaxTriggers}
                />
              )}

              <div>
                <Button submit primary>
                  Save Settings
                </Button>
              </div>
            </BlockStack>
          </form>
        </Card.Section>
      </Tabs>
    </Card>
  );
};

export default SettingsForm;
