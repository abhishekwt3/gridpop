import { useLoaderData, useSubmit } from "@remix-run/react";
import { Page, Layout, Card, Select, Button, Text, ButtonGroup, InlineStack, TextField, Grid, RadioButton, Banner } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState, useCallback, useEffect } from "react";
import { PopupPreview } from "../components/PopupPreview";

export const loader = async ({ request }) => {
  try {
    const { admin, session } = await authenticate.admin(request);

    if (!admin || !session) {
      throw new Response("Unauthorized", { status: 401 });
    }

    const shop = session.shop;
    console.log("Authenticated shop:", shop);

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
    console.log("GraphQL response:", data);

    const shopId = data?.shop?.id;
    const shopUrl = data?.shop?.url || shop;

    if (!shopId || !shopUrl) {
      throw new Error("Shop ID or URL not found");
    }

    let settings = {};
    if (data?.shop?.metafield?.value) {
      try {
        settings = JSON.parse(data.shop.metafield.value);
        console.log("Loaded settings from metafield:", settings);
      } catch (err) {
        console.error("Error parsing metafield JSON:", err);
      }
    } else {
      console.log("No existing metafield found");
    }

    // Default texts for each template type
    const defaultTexts = {
      discount: {
        heading: "Special Offer!",
        subtext: "Get 10% off your first purchase",
        buttonText: "Get Discount"
      },
      newsletter: {
        heading: "Stay Updated!",
        subtext: "Subscribe to our newsletter for exclusive updates",
        buttonText: "Subscribe"
      },
      survey: {
        heading: "Quick Survey",
        subtext: "Help us improve your experience",
        buttonText: "Submit"
      }
    };

    // Set default texts if not already in settings
    if (!settings.templateTexts) {
      settings.templateTexts = defaultTexts;
    }

    return { shopId, shopUrl, settings };
  } catch (error) {
    console.error("Loader Error:", error);
    return {
      shopId: null,
      shopUrl: null,
      settings: {},
      error: error.message
    };
  }
};

export const action = async ({ request }) => {
  try {
    console.log("Action handler started");
    const { admin, session } = await authenticate.admin(request);

    if (!admin || !session) {
      console.error("Authentication failed in action handler");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const formData = await request.formData();
    console.log("Form data received:", Object.fromEntries(formData));

    const shopId = formData.get("shopId");
    const shopUrl = formData.get("shopUrl");

    console.log("Shop ID:", shopId);
    console.log("Shop URL:", shopUrl);

    if (!shopId || !shopUrl) {
      console.error("Missing shop ID or URL in form data");
      throw new Error("Missing shop ID or URL");
    }

    const selectedTemplate = formData.get("popup_template") || "discount";
    const popupFrequency = formData.get("popup_frequency") || "2";
    const displayType = formData.get("display_type") || "popup";
    const timerDuration = formData.get("timer_duration") || "15";
    const backgroundColor = formData.get("background_color") || "#ffffff";
    const textColor = formData.get("text_color") || "#333333";
    const buttonColor = formData.get("button_color") || "#4CAF50";

    // Get template text values
    const templateHeading = formData.get("template_heading") || "";
    const templateSubtext = formData.get("template_subtext") || "";
    const templateButtonText = formData.get("template_button_text") || "";

    // Build the template texts object
    // We need to read the existing metafield first to preserve texts for other templates
    const existingMetafield = await admin.graphql(
      `#graphql
      query {
        shop {
          metafield(namespace: "exitPopup", key: "settings") {
            value
          }
        }
      }`
    );

    const existingData = await existingMetafield.json();
    let templateTexts = {
      discount: {
        heading: "Special Offer!",
        subtext: "Get 10% off your first purchase",
        buttonText: "Get Discount"
      },
      newsletter: {
        heading: "Stay Updated!",
        subtext: "Subscribe to our newsletter for exclusive updates",
        buttonText: "Subscribe"
      },
      survey: {
        heading: "Quick Survey",
        subtext: "Help us improve your experience",
        buttonText: "Submit"
      }
    };

    // If we have existing data, parse it
    if (existingData?.data?.shop?.metafield?.value) {
      try {
        const existingSettings = JSON.parse(existingData.data.shop.metafield.value);
        if (existingSettings.templateTexts) {
          templateTexts = existingSettings.templateTexts;
          console.log("Retrieved existing template texts", templateTexts);
        }
      } catch (err) {
        console.error("Error parsing existing metafield:", err);
      }
    }

    // Update only the current template's texts
    templateTexts[selectedTemplate] = {
      heading: templateHeading,
      subtext: templateSubtext,
      buttonText: templateButtonText
    };

    console.log("Preparing to update metafield with:", {
      popupTemplate: selectedTemplate,
      popupFrequency,
      displayType,
      timerDuration,
      backgroundColor,
      textColor,
      buttonColor,
      templateTexts
    });

    const settingsValue = JSON.stringify({
      popupTemplate: selectedTemplate,
      popupFrequency,
      displayType,
      timerDuration,
      backgroundColor,
      textColor,
      buttonColor,
      templateTexts
    });

    console.log("Metafield value to set:", settingsValue);

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
              value: settingsValue
            }
          ]
        }
      }
    );

    const metafieldData = await metafieldResponse.json();
    console.log("Metafield update response:", metafieldData);

    if (metafieldData.data?.metafieldsSet?.userErrors?.length > 0) {
      const errorMessage = metafieldData.data.metafieldsSet.userErrors[0].message;
      console.error("Metafield update error:", errorMessage);
      throw new Error(errorMessage);
    }

    console.log("Settings saved successfully");

    return new Response(JSON.stringify({
      success: true,
      settings: {
        popupTemplate: selectedTemplate,
        popupFrequency,
        displayType,
        timerDuration,
        backgroundColor,
        textColor,
        buttonColor,
        templateTexts
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
  const loaderData = useLoaderData();
  const { shopId, shopUrl, settings = {}, error: loaderError } = loaderData;

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState(loaderError || "");

  // Ensure templateTexts exists with defaults
  const templateTexts = settings.templateTexts || {
    discount: { heading: "Special Offer!", subtext: "Get 10% off your first purchase", buttonText: "Get Discount" },
    newsletter: { heading: "Stay Updated!", subtext: "Subscribe to our newsletter for exclusive updates", buttonText: "Subscribe" },
    survey: { heading: "Quick Survey", subtext: "Help us improve your experience", buttonText: "Submit" }
  };

  const [popupTemplate, setPopupTemplate] = useState(settings?.popupTemplate || "discount");
  const [popupFrequency, setPopupFrequency] = useState(settings?.popupFrequency || "1");
  const [displayType, setDisplayType] = useState(settings?.displayType || "popup");
  const [timerDuration, setTimerDuration] = useState(settings?.timerDuration || "15");
  const [backgroundColor, setBackgroundColor] = useState(settings?.backgroundColor || "#ffffff");
  const [textColor, setTextColor] = useState(settings?.textColor || "#333333");
  const [buttonColor, setButtonColor] = useState(settings?.buttonColor || "#4CAF50");

  // Template text states with safer access to nested properties
  const [templateHeading, setTemplateHeading] = useState(
    (templateTexts[popupTemplate]?.heading) ||
    (popupTemplate === "discount" ? "Special Offer!" :
     popupTemplate === "newsletter" ? "Stay Updated!" :
     "Quick Survey")
  );

  const [templateSubtext, setTemplateSubtext] = useState(
    (templateTexts[popupTemplate]?.subtext) ||
    (popupTemplate === "discount" ? "Get 10% off your first purchase" :
     popupTemplate === "newsletter" ? "Subscribe to our newsletter for exclusive updates" :
     "Help us improve your experience")
  );

  const [templateButtonText, setTemplateButtonText] = useState(
    (templateTexts[popupTemplate]?.buttonText) ||
    (popupTemplate === "discount" ? "Get Discount" :
     popupTemplate === "newsletter" ? "Subscribe" :
     "Submit")
  );

  const templateOptions = [
    { label: "Discount Offer", value: "discount" },
    { label: "Newsletter Signup", value: "newsletter" },
    { label: "Quick Survey", value: "survey" }
  ];

  const [selectedTab, setSelectedTab] = useState(0);

  // Update text fields when template changes
  useEffect(() => {
    if (settings?.templateTexts && settings.templateTexts[popupTemplate]) {
      const texts = settings.templateTexts[popupTemplate];
      setTemplateHeading(texts.heading);
      setTemplateSubtext(texts.subtext);
      setTemplateButtonText(texts.buttonText);
    } else {
      // Set defaults if no custom texts exist
      if (popupTemplate === "discount") {
        setTemplateHeading("Special Offer!");
        setTemplateSubtext("Get 10% off your first purchase");
        setTemplateButtonText("Get Discount");
      } else if (popupTemplate === "newsletter") {
        setTemplateHeading("Stay Updated!");
        setTemplateSubtext("Subscribe to our newsletter for exclusive updates");
        setTemplateButtonText("Subscribe");
      } else if (popupTemplate === "survey") {
        setTemplateHeading("Quick Survey");
        setTemplateSubtext("Help us improve your experience");
        setTemplateButtonText("Submit");
      }
    }
  }, [popupTemplate, settings]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const form = event.target;
      const formData = new FormData(form);

      // Check if shopId and shopUrl are present
      if (!shopId || !shopUrl) {
        setErrorMessage("Shop ID or URL is missing. Please refresh the page and try again.");
        return;
      }

      formData.set("shopId", shopId);
      formData.set("shopUrl", shopUrl);
      formData.set("popup_template", popupTemplate);
      formData.set("popup_frequency", popupFrequency);
      formData.set("display_type", displayType);
      formData.set("timer_duration", timerDuration);
      formData.set("background_color", backgroundColor);
      formData.set("text_color", textColor);
      formData.set("button_color", buttonColor);
      formData.set("template_heading", templateHeading);
      formData.set("template_subtext", templateSubtext);
      formData.set("template_button_text", templateButtonText);

      console.log("Submitting form data:", Object.fromEntries(formData));

      const response = await submit(formData, {
        method: "post",
        replace: true
      });

      console.log("Form submission response:", response);
      setSuccessMessage("Settings saved successfully!");
    } catch (error) {
      console.error("Form submission error:", error);
      setErrorMessage(`Failed to save settings: ${error.message}`);
    }
  };

  const handleDisplayTypeChange = useCallback((value) => setDisplayType(value), []);
  const handleTimerRangeChange = useCallback((value) => setTimerDuration(value), []);

  const tabs = [
    { id: 0, label: "Templates", content: "Select and customize your popup template" },
    { id: 1, label: "Appearance", content: "Customize colors and display options" },
    { id: 2, label: "Behaviour", content: "Configure when and how the popup appears" }
  ];

  if (!shopId || !shopUrl) {
    return (
      <Page title="Exit Popup Settings">
        <Layout>
          <Layout.Section>
            <Card sectioned>
              <Banner status="critical">
                <p>Authentication error. Please refresh the page and try again.</p>
                <p>Error: {errorMessage || "Unable to authenticate with Shopify"}</p>
              </Banner>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page title="Exit Popup Settings">
      <Layout>
        <Layout.Section>
          {successMessage && (
            <Banner status="success" onDismiss={() => setSuccessMessage("")}>
              {successMessage}
            </Banner>
          )}

          {errorMessage && (
            <Banner status="critical" onDismiss={() => setErrorMessage("")}>
              {errorMessage}
            </Banner>
          )}

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
              <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                <Card sectioned>
                  <form
                    id="settings-form"
                    method="post"
                    encType="application/x-www-form-urlencoded"
                    onSubmit={handleSubmit}
                  >
                    <input type="hidden" name="shopId" value={shopId} />
                    <input type="hidden" name="shopUrl" value={shopUrl} />

                    {/* Display Type Selection */}
                    <div style={{ marginBottom: '20px' }}>
                      <Text variant="headingMd" as="h3" fontWeight="semibold">
                        Choose Display Type
                      </Text>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
                        <div>
                          <RadioButton
                            label="Modal Popup"
                            helpText="A popup that appears in the center of the screen"
                            checked={displayType === "popup"}
                            id="popup"
                            name="display_type"
                            value="popup"
                            onChange={() => handleDisplayTypeChange("popup")}
                          />
                        </div>
                        <div>
                          <RadioButton
                            label="Discount Bar"
                            helpText="A bar that appears at the top of the screen with a countdown timer"
                            checked={displayType === "discount-bar"}
                            id="discount-bar"
                            name="display_type"
                            value="discount-bar"
                            onChange={() => handleDisplayTypeChange("discount-bar")}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Template Selection */}
                    <div style={{ marginBottom: '20px' }}>
                      <Select
                        label="Choose Popup Template"
                        options={templateOptions}
                        name="popup_template"
                        value={popupTemplate}
                        onChange={setPopupTemplate}
                      />
                    </div>

                    {/* Customization Options */}
                    <div style={{ marginTop: '20px' }}>
                      <Text variant="headingMd" as="h3" fontWeight="semibold">
                        Customize Template Text
                      </Text>

                      <div style={{ marginTop: '15px' }}>
                        <TextField
                          label="Heading"
                          value={templateHeading}
                          onChange={setTemplateHeading}
                          name="template_heading"
                        />
                      </div>

                      <div style={{ marginTop: '15px' }}>
                        <TextField
                          label="Subtext"
                          value={templateSubtext}
                          onChange={setTemplateSubtext}
                          name="template_subtext"
                          multiline={2}
                        />
                      </div>

                      <div style={{ marginTop: '15px' }}>
                        <TextField
                          label="Button Text"
                          value={templateButtonText}
                          onChange={setTemplateButtonText}
                          name="template_button_text"
                        />
                      </div>
                    </div>

                    {displayType === "discount-bar" && (
                      <div style={{ marginTop: '20px' }}>
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
                      </div>
                    )}

                    <Button submit primary style={{ marginTop: '20px' }}>Save Settings</Button>
                  </form>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
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
                      templateHeading={templateHeading}
                      templateSubtext={templateSubtext}
                      templateButtonText={templateButtonText}
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
                    <input type="hidden" name="popup_template" value={popupTemplate} />
                    <input type="hidden" name="popup_frequency" value={popupFrequency} />
                    <input type="hidden" name="display_type" value={displayType} />
                    <input type="hidden" name="timer_duration" value={timerDuration} />
                    <input type="hidden" name="template_heading" value={templateHeading} />
                    <input type="hidden" name="template_subtext" value={templateSubtext} />
                    <input type="hidden" name="template_button_text" value={templateButtonText} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div>
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
                      </div>

                      <div>
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
                      </div>

                      <div>
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
                      </div>
                    </div>

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
                      templateHeading={templateHeading}
                      templateSubtext={templateSubtext}
                      templateButtonText={templateButtonText}
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
                <input type="hidden" name="popup_template" value={popupTemplate} />
                <input type="hidden" name="display_type" value={displayType} />
                <input type="hidden" name="background_color" value={backgroundColor} />
                <input type="hidden" name="text_color" value={textColor} />
                <input type="hidden" name="button_color" value={buttonColor} />
                <input type="hidden" name="template_heading" value={templateHeading} />
                <input type="hidden" name="template_subtext" value={templateSubtext} />
                <input type="hidden" name="template_button_text" value={templateButtonText} />

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
                    <TextField
                      label="Countdown Timer"
                      value={timerDuration}
                      onChange={setTimerDuration}
                      min="1"
                      max="60"
                      type="range"
                      name="timer_duration"
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
