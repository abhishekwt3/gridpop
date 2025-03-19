import { useLoaderData, useSubmit } from "@remix-run/react";
import { Page, Layout, Card, Button, Text, ButtonGroup, InlineStack, TextField, Grid, Banner, ChoiceList, Select } from "@shopify/polaris";
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

    // Ensure displayType is set to discount-bar
    settings.displayType = "discount-bar";

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

    const popupFrequency = formData.get("popup_frequency") || "2";
    const timerDuration = formData.get("timer_duration") || "15";
    const backgroundColor = formData.get("background_color") || "#ffffff";
    const textColor = formData.get("text_color") || "#333333";
    const buttonColor = formData.get("button_color") || "#4CAF50";
    const scrollDetection = formData.get("scroll_detection") === "true";
    const barPosition = formData.get("bar_position") || "middle";

    // Get text values
    const heading = formData.get("heading") || "";
    const subtext = formData.get("subtext") || "";
    const buttonText = formData.get("button_text") || "";

    console.log("Preparing to update metafield with:", {
      popupFrequency,
      displayType: "discount-bar", // Always set to discount-bar
      timerDuration,
      backgroundColor,
      textColor,
      buttonColor,
      heading,
      subtext,
      buttonText,
      scrollDetection,
      barPosition
    });

    const settingsValue = JSON.stringify({
      popupFrequency,
      displayType: "discount-bar", // Always set to discount-bar
      timerDuration,
      backgroundColor,
      textColor,
      buttonColor,
      heading,
      subtext,
      buttonText,
      scrollDetection,
      barPosition
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
        popupFrequency,
        displayType: "discount-bar",
        timerDuration,
        backgroundColor,
        textColor,
        buttonColor,
        heading,
        subtext,
        buttonText,
        scrollDetection,
        barPosition
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

  const [popupFrequency, setPopupFrequency] = useState(settings?.popupFrequency || "1");
  const [timerDuration, setTimerDuration] = useState(settings?.timerDuration || "15");
  const [backgroundColor, setBackgroundColor] = useState(settings?.backgroundColor || "#ffffff");
  const [textColor, setTextColor] = useState(settings?.textColor || "#333333");
  const [buttonColor, setButtonColor] = useState(settings?.buttonColor || "#4CAF50");
  const [scrollDetection, setScrollDetection] = useState(settings?.scrollDetection !== false); // Default to true if not specified
  const [barPosition, setBarPosition] = useState(settings?.barPosition || "middle");

  // Text fields - getting from root level now
  const [heading, setHeading] = useState(settings?.heading || "Special Offer!");
  const [subtext, setSubtext] = useState(settings?.subtext || "SAVE10");
  const [buttonText, setButtonText] = useState(settings?.buttonText || "Copy Code");

  const [selectedTab, setSelectedTab] = useState(0);

  // Position options for the select dropdown
  const positionOptions = [
    { label: "Middle (Floating)", value: "middle" },
    { label: "Top (Sticky)", value: "top" },
    { label: "Bottom (Sticky)", value: "bottom" }
  ];

  // Set default text values if needed
  useEffect(() => {
    setHeading(settings?.heading || "Special Offer!");
    setSubtext(settings?.subtext || "SAVE10");
    setButtonText(settings?.buttonText || "Copy Code");
    setScrollDetection(settings?.scrollDetection !== false);
    setBarPosition(settings?.barPosition || "middle");
  }, [settings]);

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
      formData.set("popup_frequency", popupFrequency);
      formData.set("timer_duration", timerDuration);
      formData.set("background_color", backgroundColor);
      formData.set("text_color", textColor);
      formData.set("button_color", buttonColor);
      formData.set("heading", heading);
      formData.set("subtext", subtext);
      formData.set("button_text", buttonText);
      formData.set("scroll_detection", scrollDetection.toString());
      formData.set("bar_position", barPosition);

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

  const handleTimerRangeChange = useCallback((value) => setTimerDuration(value), []);
  const handleScrollDetectionChange = useCallback((value) => setScrollDetection(value[0] === "true"), []);
  const handleBarPositionChange = useCallback((value) => setBarPosition(value), []);

  const tabs = [
    { id: 0, label: "Content", content: "Customize your discount bar content" },
    { id: 1, label: "Appearance", content: "Customize colors and display options" },
    { id: 2, label: "Behaviour", content: "Configure when and how the discount bar appears" }
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
    <Page title="Exit Discount Bar Settings">
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

        {/* Content Tab */}
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
                    <input type="hidden" name="scroll_detection" value={scrollDetection.toString()} />
                    <input type="hidden" name="bar_position" value={barPosition} />

                    {/* Customization Options */}
                    <div style={{ marginTop: '20px' }}>
                      <Text variant="headingMd" as="h3" fontWeight="semibold">
                        Customize Content
                      </Text>

                      <div style={{ marginTop: '15px' }}>
                        <TextField
                          label="Offer Text"
                          value={heading}
                          onChange={setHeading}
                          name="heading"
                          helpText="This text will be displayed on the discount bar"
                        />
                      </div>

                      <div style={{ marginTop: '15px' }}>
                        <TextField
                          label="Discount Code"
                          value={subtext}
                          onChange={setSubtext}
                          name="subtext"
                          helpText="This code will be copied when the button is clicked"
                        />
                      </div>

                      <div style={{ marginTop: '15px' }}>
                        <TextField
                          label="Button Text"
                          value={buttonText}
                          onChange={setButtonText}
                          name="button_text"
                          helpText="Text for the copy button"
                        />
                      </div>
                    </div>

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

                    <Button submit primary style={{ 
                      marginTop: '30px', 
                      backgroundColor: '#4CAF50', 
                      borderColor: '#4CAF50',
                      padding: '10px 20px',
                      minHeight: '45px'
                    }}>
                      Save Settings
                    </Button>
                  </form>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 12, sm: 12, md: 6, lg: 6 }}>
                <Card sectioned title="Preview">
                  <Text variant="bodyMd" as="p">
                    This is how your discount bar will appear to customers
                  </Text>
                  <div style={{ 
                    margin: '20px 0', 
                    backgroundColor: '#f4f6f8', 
                    padding: '20px', 
                    borderRadius: '4px', 
                    overflow: 'visible',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <PopupPreview
                      displayType="discount-bar"
                      timerDuration={timerDuration}
                      bgColor={backgroundColor}
                      textColor={textColor}
                      buttonColor={buttonColor}
                      heading={heading}
                      subtext={subtext}
                      buttonText={buttonText}
                      barPosition={barPosition}
                      fullWidth={true}
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
                    <input type="hidden" name="popup_frequency" value={popupFrequency} />
                    <input type="hidden" name="timer_duration" value={timerDuration} />
                    <input type="hidden" name="heading" value={heading} />
                    <input type="hidden" name="subtext" value={subtext} />
                    <input type="hidden" name="button_text" value={buttonText} />
                    <input type="hidden" name="scroll_detection" value={scrollDetection.toString()} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Bar Position */}
                      <div style={{ marginBottom: '20px' }}>
                        <Text variant="headingMd" as="h3" fontWeight="semibold">
                          Bar Position
                        </Text>
                        <div style={{ marginTop: '10px' }}>
                          <Select
                            label="Select where to display the discount bar"
                            options={positionOptions}
                            onChange={handleBarPositionChange}
                            value={barPosition}
                            name="bar_position"
                            helpText="Choose where to display the discount bar on your store"
                          />
                        </div>
                      </div>

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

                    <Button submit primary style={{ 
                      marginTop: '30px', 
                      backgroundColor: '#4CAF50', 
                      borderColor: '#4CAF50',
                      padding: '10px 20px',
                      minHeight: '45px'
                    }}>
                      Save Settings
                    </Button>
                  </form>
                </Card>
              </Grid.Cell>
              <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6 }}>
                <Card sectioned title="Preview">
                  <Text variant="bodyMd" as="p">
                    This is how your discount bar will appear with the selected colors
                  </Text>
                  <div style={{ 
                    margin: '20px 0', 
                    backgroundColor: '#f4f6f8', 
                    padding: '20px', 
                    borderRadius: '4px', 
                    overflow: 'visible',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    <PopupPreview
                      displayType="discount-bar"
                      timerDuration={timerDuration}
                      bgColor={backgroundColor}
                      textColor={textColor}
                      buttonColor={buttonColor}
                      heading={heading}
                      subtext={subtext}
                      buttonText={buttonText}
                      barPosition={barPosition}
                      fullWidth={true}
                    />
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <Text variant="bodyMd" as="p" fontWeight="semibold">
                      Selected Position: {barPosition === 'middle' ? 'Middle (Floating)' : barPosition === 'top' ? 'Top (Sticky)' : 'Bottom (Sticky)'}
                    </Text>
                    <Text variant="bodyMd" as="p" color="subdued">
                      This preview does not show the actual position. The position will be applied on your storefront.
                    </Text>
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
                <input type="hidden" name="background_color" value={backgroundColor} />
                <input type="hidden" name="text_color" value={textColor} />
                <input type="hidden" name="button_color" value={buttonColor} />
                <input type="hidden" name="heading" value={heading} />
                <input type="hidden" name="subtext" value={subtext} />
                <input type="hidden" name="button_text" value={buttonText} />
                <input type="hidden" name="bar_position" value={barPosition} />

                <TextField
                  label="Number of Times to Display"
                  value={popupFrequency}
                  onChange={setPopupFrequency}
                  name="popup_frequency"
                  type="number"
                  min="1"
                  max="10"
                  helpText="How many times the discount bar will appear for each user in a single session."
                />

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

                <div style={{ marginTop: '20px' }}>
                  <ChoiceList
                    title="Rapid Scroll Detection"
                    choices={[
                      { label: "Enabled", value: "true" },
                      { label: "Disabled", value: "false" }
                    ]}
                    selected={[scrollDetection.toString()]}
                    onChange={handleScrollDetectionChange}
                    name="scroll_detection"
                    helpText="When enabled, the discount bar will also appear when users scroll up rapidly (indicating they might be about to leave)."
                  />
                </div>

                <Button submit primary style={{ 
                  marginTop: '30px', 
                  backgroundColor: '#4CAF50', 
                  borderColor: '#4CAF50',
                  padding: '10px 20px',
                  minHeight: '45px'
                }}>
                  Save Behaviour
                </Button>
              </form>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}