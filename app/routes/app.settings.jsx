import { useLoaderData, useSubmit } from "@remix-run/react";
import { Page, Layout, Card, Select, Button, Text, ButtonGroup, InlineStack, TextField } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { useState } from "react";

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
                popupFrequency
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
      settings: { popupTemplate: selectedTemplate, popupFrequency }
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

  const templateOptions = [
    { label: "Discount Offer", value: "discount" },
    { label: "Newsletter Signup", value: "newsletter" },
    { label: "Quick Survey", value: "survey" }
  ];

  const [selectedTab, setSelectedTab] = useState(0);

  const handleSubmit = (event) => {
    event.preventDefault();

    // Create a FormData instance from the form
    const formData = new FormData(event.target);

    // Always include both values regardless of which tab we're on
    formData.set("popup_template", popupTemplate);
    formData.set("popup_frequency", popupFrequency);

    submit(formData, { method: "post" });
  };

  return (
    <Page title="Exit Popup Settings">
      <Layout>
        <Layout.Section>
          {/* Sidebar Menu Buttons using InlineStack */}
          <InlineStack wrap={false} gap="200">
            <ButtonGroup segmented>
              <Button pressed={selectedTab === 0} onClick={() => setSelectedTab(0)}>Templates</Button>
              <Button pressed={selectedTab === 1} onClick={() => setSelectedTab(1)}>Behaviour</Button>
            </ButtonGroup>
          </InlineStack>

          {/* Tab Content */}
          {selectedTab === 0 && (
            <Card sectioned>
              <Text>Shop URL: {shopUrl}</Text>
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
                <Button submit primary>Save Settings</Button>
              </form>
            </Card>
          )}

          {selectedTab === 1 && (
            <Card sectioned>
              <form
                method="post"
                encType="application/x-www-form-urlencoded"
                onSubmit={handleSubmit}
              >
                <input type="hidden" name="shopId" value={shopId} />
                <input type="hidden" name="shopUrl" value={shopUrl} />
                <TextField
                  label="Number of Times to Display Popup"
                  value={popupFrequency}
                  onChange={setPopupFrequency}
                  name="popup_frequency"
                  type="number"
                />
                <Button submit primary>Save Behaviour</Button>
              </form>
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
