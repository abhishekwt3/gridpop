import { useLoaderData, useSubmit } from "@remix-run/react";
import { Page, Layout, Card, Select, Button, Text, ButtonGroup, InlineStack, TextField, Grid, RadioButton, ColorPicker, RangeSlider, BlockStack } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState, useCallback } from "react";
import { PopupPreview } from "../components/PopupPreview";

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  
  if (!admin || !session) {
    throw new Response("Unauthorized", { status: 401 });
  }
  
  const shop = session.shop;

  const response = await admin.graphql(
    `#graphql
    query {
      shop {
        id
        url
        metafield(namespace: "exitPopup", key: "settings") {
          value
        }
      }
    }`
  );

  const { data } = await response.json();
  const shopId = data?.shop?.id;
  const shopUrl = data?.shop?.url || shop;

  if (!shopId || !shopUrl) {
    throw new Error("Shop ID or URL not found");
  }

  let settings = {};
  if (data?.shop?.metafield?.value) {
    try {
      settings = JSON.parse(data.shop.metafield.value);
    } catch (err) {
      console.error("Error parsing metafield JSON:", err);
    }
  }

  return { shopId, shopUrl, settings };
};

export const action = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);
    
    if (!admin || !session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await request.formData();
    const shopId = formData.get("shopId");
    const shopUrl = formData.get("shopUrl");
    const selectedTemplate = formData.get("popup_template") || "discount";
    const popupFrequency = formData.get("popup_frequency") || "2";
    const displayType = formData.get("display_type") || "popup";
    const timerDuration = formData.get("timer_duration") || "15";
    const backgroundColor = formData.get("background_color") || "#ffffff";
    const textColor = formData.get("text_color") || "#333333";
    const buttonColor = formData.get("button_color") || "#4CAF50";

    if (!shopId || !shopUrl) {
      throw new Error("Missing shop ID or URL");
    }

    const metafieldResponse = await admin.graphql(
      `#graphql
      mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields {
            id
            key
            namespace
            value
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          metafields: [
            {
              key: "settings",
              namespace: "exitPopup",
              ownerId: shopId,
              type: "json",
              value: JSON.stringify({ 
                popupTemplate: selectedTemplate, 
                popupFrequency,
                displayType,
                timerDuration,
                backgroundColor,
                textColor,
                buttonColor
              })
            }
          ]
        }
      }
    );

    const metafieldData = await metafieldResponse.json();
    if (metafieldData.data.metafieldsSet.userErrors.length > 0) {
      throw new Error(metafieldData.data.metafieldsSet.userErrors[0].message);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      settings: { 
        popupTemplate: selectedTemplate, 
        popupFrequency,
        displayType,
        timerDuration,
        backgroundColor,
        textColor,
        buttonColor
      } 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Action Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

export default function Settings() {
  const submit = useSubmit();
  const { shopId, shopUrl, settings } = useLoaderData();
  const [popupTemplate, setPopupTemplate] = useState(settings?.popupTemplate || "discount");
  const [popupFrequency, setPopupFrequency] = useState(settings?.popupFrequency || "1");
  const [displayType, setDisplayType] = useState(settings?.displayType || "popup");
  const [timerDuration, setTimerDuration] = useState(settings?.timerDuration || "15");
  const [backgroundColor, setBackgroundColor] = useState(settings?.backgroundColor || "#ffffff");
  const [textColor, setTextColor] = useState(settings?.textColor || "#333333");
  const [buttonColor, setButtonColor] = useState(settings?.buttonColor || "#4CAF50");

  const templateOptions = [
    { label: "Discount Offer", value: "discount" },
    { label: "Newsletter Signup", value: "newsletter" },
    { label: "Quick Survey", value: "survey" }
  ];

  const [selectedTab, setSelectedTab] = useState(0);

  const handleSubmit = (event) => {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    formData.set("popup_template", popupTemplate);
    formData.set("popup_frequency", popupFrequency);
    formData.set("display_type", displayType);
    formData.set("timer_duration", timerDuration);
    formData.set("background_color", backgroundColor);
    formData.set("text_color", textColor);
    formData.set("button_color", buttonColor);
    
    submit(formData, { method: "post" });
  };

  const handleDisplayTypeChange = useCallback((value) => setDisplayType(value), []);
  const handleTimerRangeChange = useCallback((value) => setTimerDuration(value), []);

  const tabs = [
    { id: 0, label: "Templates", content: "Select and customize your popup template" },
    { id: 1, label: "Appearance", content: "Customize colors and display options" },
    { id: 2, label: "Behaviour", content: "Configure when and how the popup appears" }
  ];

  return (
    <Page title="Exit Popup Settings">
      <Layout>
        <Layout.Section>
          <InlineStack wrap={false} gap="200">
            <ButtonGroup segmented>
              {tabs.map(tab => (
                <Button 
                  key={tab.id}
                  pressed={selectedTab === tab.id} 
                  onClick={() => setSelectedTab(tab.id)}
                >
                  {tab.label}
                </Button>
              ))}
            </ButtonGroup>
          </InlineStack>

          <Text variant="bodyMd" as="p" color="subdued" fontWeight="regular">
            {tabs[selectedTab].content}
          </Text>

          {/* Templates Tab */}
          {selectedTab === 0 && (
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <Card sectioned>
                  <form
                    method="post"
                    encType="application/x-www-form-urlencoded"
                    onSubmit={handleSubmit}
                  >
                    <input type="hidden" name="shopId" value={shopId} />
                    <input type="hidden" name="shopUrl" value={shopUrl} />

                    <Select
                      label="Choose Popup Template"
                      options={templateOptions}
                      name="popup_template"
                      value={popupTemplate}
                      onChange={setPopupTemplate}
                    />
                    
                    <BlockStack vertical spacing="loose">
                      <BlockStack.Item>
                        <Text variant="headingMd" as="h3" fontWeight="semibold">
                          Display Type
                        </Text>
                      </BlockStack.Item>
                      <BlockStack.Item>
                        <RadioButton
                          label="Modal Popup"
                          helpText="A popup that appears in the center of the screen"
                          checked={displayType === "popup"}
                          id="popup"
                          name="display_type"
                          value="popup"
                          onChange={() => handleDisplayTypeChange("popup")}
                        />
                      </BlockStack.Item>
                      <BlockStack.Item>
                        <RadioButton
                          label="Discount Bar"
                          helpText="A bar that appears at the top of the screen with a countdown timer"
                          checked={displayType === "discount-bar"}
                          id="discount-bar"
                          name="display_type"
                          value="discount-bar"
                          onChange={() => handleDisplayTypeChange("discount-bar")}
                        />
                      </BlockStack.Item>
                    </BlockStack>

                    {displayType === "discount-bar" && (
                      <TextField
                        label="Timer Duration (minutes)"
                        type="number"
                        value={timerDuration}
                        onChange={setTimerDuration}
                        min="1"
                        max="60"
                        name="timer_duration"
                        helpText="How long the discount bar will display a countdown timer"
                      />
                    )}
                    
                    <Button submit primary style={{ marginTop: '20px' }}>Save Settings</Button>
                  </form>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <Card sectioned title="Preview">
                  <Text variant="bodyMd" as="p">
                    This is how your {displayType === "popup" ? "popup" : "discount bar"} will appear to customers
                  </Text>
                  <div style={{ margin: '20px 0', backgroundColor: '#f4f6f8', padding: '20px', borderRadius: '4px' }}>
                    <PopupPreview 
                      template={popupTemplate} 
                      displayType={displayType}
                      timerDuration={timerDuration}
                      bgColor={backgroundColor}
                      textColor={textColor}
                      buttonColor={buttonColor}
                    />
                  </div>
                </Card>
              </Grid.Cell>
            </Grid>
          )}
          
          {/* Appearance Tab */}
          {selectedTab === 1 && (
            <Grid>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <Card sectioned>
                  <form
                    method="post"
                    encType="application/x-www-form-urlencoded"
                    onSubmit={handleSubmit}
                  >
                    <input type="hidden" name="shopId" value={shopId} />
                    <input type="hidden" name="shopUrl" value={shopUrl} />
                    
                    <Stack vertical spacing="loose">
                      <Stack.Item>
                        <Text variant="headingMd" as="h3" fontWeight="semibold">
                          Background Color
                        </Text>
                        <div style={{ marginTop: '10px' }}>
                          <input 
                            type="color" 
                            value={backgroundColor} 
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            name="background_color"
                          />
                          <Text variant="bodyMd" as="span" color="subdued" style={{ marginLeft: '10px' }}>
                            {backgroundColor}
                          </Text>
                        </div>
                      </Stack.Item>
                      
                      <Stack.Item>
                        <Text variant="headingMd" as="h3" fontWeight="semibold">
                          Text Color
                        </Text>
                        <div style={{ marginTop: '10px' }}>
                          <input 
                            type="color" 
                            value={textColor} 
                            onChange={(e) => setTextColor(e.target.value)}
                            name="text_color"
                          />
                          <Text variant="bodyMd" as="span" color="subdued" style={{ marginLeft: '10px' }}>
                            {textColor}
                          </Text>
                        </div>
                      </Stack.Item>
                      
                      <Stack.Item>
                        <Text variant="headingMd" as="h3" fontWeight="semibold">
                          Button Color
                        </Text>
                        <div style={{ marginTop: '10px' }}>
                          <input 
                            type="color" 
                            value={buttonColor} 
                            onChange={(e) => setButtonColor(e.target.value)}
                            name="button_color"
                          />
                          <Text variant="bodyMd" as="span" color="subdued" style={{ marginLeft: '10px' }}>
                            {buttonColor}
                          </Text>
                        </div>
                      </Stack.Item>
                    </Stack>
                    
                    <Button submit primary style={{ marginTop: '20px' }}>Save Settings</Button>
                  </form>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <Card sectioned title="Preview">
                  <Text variant="bodyMd" as="p">
                    This is how your {displayType === "popup" ? "popup" : "discount bar"} will appear with the selected colors
                  </Text>
                  <div style={{ margin: '20px 0', backgroundColor: '#f4f6f8', padding: '20px', borderRadius: '4px' }}>
                    <PopupPreview 
                      template={popupTemplate} 
                      displayType={displayType}
                      timerDuration={timerDuration}
                      bgColor={backgroundColor}
                      textColor={textColor}
                      buttonColor={buttonColor}
                    />
                  </div>
                </Card>
              </Grid.Cell>
            </Grid>
          )}

          {/* Behaviour Tab */}
          {selectedTab === 2 && (
            <Card sectioned>
              <form
                method="post"
                encType="application/x-www-form-urlencoded"
                onSubmit={handleSubmit}
              >
                <input type="hidden" name="shopId" value={shopId} />
                <input type="hidden" name="shopUrl" value={shopUrl} />
                
                <TextField
                  label="Number of Times to Display"
                  value={popupFrequency}
                  onChange={setPopupFrequency}
                  name="popup_frequency"
                  type="number"
                  min="1"
                  max="10"
                  helpText="How many times the popup or discount bar will appear for each user in a single session."
                />
                
                {displayType === "discount-bar" && (
                  <div style={{ marginTop: '20px' }}>
                    <Text variant="headingMd" as="h3" fontWeight="semibold">
                      Timer Duration: {timerDuration} minutes
                    </Text>
                    <RangeSlider
                      label="Countdown Timer"
                      value={parseInt(timerDuration)}
                      onChange={handleTimerRangeChange}
                      min={1}
                      max={60}
                      output
                      helpText="How long the countdown timer will run before the discount bar disappears."
                    />
                  </div>
                )}
                
                <Button submit primary style={{ marginTop: '20px' }}>Save Behaviour</Button>
              </form>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}