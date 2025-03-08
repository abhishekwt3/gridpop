import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Text, Card, Button } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);

    if (!admin) {
      throw new Error("Authentication failed");
    }

    return new Response(JSON.stringify({ status: "active" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Loader Error:", error);
    return new Response(
      JSON.stringify({ status: "error", message: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export default function Index() {
  const data = useLoaderData();
  const status = data?.status || "unknown"; // Default fallback

  return (
    <Page title="Exit Intent Popup">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Text as="h2" variant="headingMd">
              Exit Intent Popup Status: {status}
            </Text>
            {status === "error" && (
              <Text color="critical">
                An error occurred while loading the app.
              </Text>
            )}
            <Button primary url="/app/settings">
              Go to Settings
            </Button>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
