import { useLoaderData } from "@remix-run/react";
import { Page, Layout, Text, Card } from "@shopify/polaris";
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
    <Page>
      <Layout>
        <Layout.Section>
          <Card>
            <Text as="h2" variant="headingMd">
              Exit Intent Popup Status: {status}
            </Text>
            {status === "error" && (
              <Text color="critical">
                An error occurred while loading the app.
              </Text>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
