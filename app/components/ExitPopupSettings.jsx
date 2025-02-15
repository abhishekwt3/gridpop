import React from 'react';
import { Form } from "@remix-run/react";
import {
  FormLayout,
  TextField,
  Select,
  Button,
  ChoiceList,
} from "@shopify/polaris";

export function ExitPopupSettings({ settings, onSubmit }) {
  return (
    <Form onSubmit={onSubmit}>
      <FormLayout>
        <ChoiceList
          title="Enable Exit Popup"
          choices={[
            { label: "Enabled", value: "true" },
            { label: "Disabled", value: "false" }
          ]}
          selected={[settings.enabled.toString()]}
          name="enabled"
        />

        <TextField
          label="Delay (seconds)"
          type="number"
          value={settings.delay.toString()}
          name="delay"
        />

        <Select
          label="Show Frequency"
          options={[
            { label: "Once per session", value: "once" },
            { label: "Every time", value: "always" },
            { label: "Once per day", value: "daily" }
          ]}
          value={settings.frequency}
          name="frequency"
        />

        <TextField
          label="Popup Title"
          value={settings.title}
          name="title"
        />

        <TextField
          label="Popup Message"
          value={settings.message}
          multiline={4}
          name="message"
        />

        <Button submit primary>Save Settings</Button>
      </FormLayout>
    </Form>
  );
}
