import { useLoaderData, useSubmit } from "@remix-run/react";
import { Page, Layout, Card } from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { ExitPopupSettings } from "../components/ExitPopupSettings";

export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);

    if (!admin) {
      throw new Error("Authentication failed");
    }

    // Load settings from app metadata or database
    const settings = {
      enabled: true,
      delay: 0,
      frequency: "once",
      title: "Don't Leave!",
      message: "Get 10% off your first purchase!"
    };

    return new Response(JSON.stringify({ settings }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Loader Error:", error);
    return new Response(
      JSON.stringify({ settings: null, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const action = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    const formData = await request.formData();

    if (!admin) {
      throw new Error("Authentication failed");
    }

    // Save settings to app metadata or database
    const settings = {
      enabled: formData.get("enabled") === "true",
      delay: parseInt(formData.get("delay")),
      frequency: formData.get("frequency"),
      title: formData.get("title"),
      message: formData.get("message")
    };

    return new Response(JSON.stringify({ settings }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Action Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export default function Settings() {
  const data = useLoaderData();
  const submit = useSubmit();
  const settings = data?.settings || {};

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            {data.error ? (
              <p style={{ color: "red" }}>Error: {data.error}</p>
            ) : (
              <ExitPopupSettings
                settings={settings}
                onSubmit={(formData) => submit(formData, { method: "post" })}
              />
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
