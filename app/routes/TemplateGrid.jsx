import React from 'react';
import { Card, Text, ButtonGroup, Button, Grid, Box, Divider } from '@shopify/polaris';

const TemplatePreviewCard = ({ template, isActive, onActivate }) => {
  const getPreviewContent = () => {
    switch (template.value) {
      case 'discount':
        return (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="mb-4">
              <Text as="h3" variant="headingMd">Special Offer!</Text>
              <Text as="p" variant="bodyMd">Don't leave yet! Get 10% off your first purchase.</Text>
            </div>
            <div className="mt-4">
              <Text as="p" variant="bodyMd">Use code: WELCOME10</Text>
            </div>
          </div>
        );
      case 'newsletter':
        return (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="mb-4">
              <Text as="h3" variant="headingMd">Join Our Newsletter</Text>
              <Text as="p" variant="bodyMd">Stay updated with our latest products and deals!</Text>
            </div>
            <div className="mt-4">
              <div className="bg-gray-100 h-8 w-full rounded mb-2"></div>
              <div className="bg-blue-500 h-8 w-full rounded"></div>
            </div>
          </div>
        );
      case 'survey':
        return (
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            <div className="mb-4">
              <Text as="h3" variant="headingMd">Quick Survey</Text>
              <Text as="p" variant="bodyMd">Help us improve your experience!</Text>
            </div>
            <div className="mt-4">
              <div className="bg-gray-100 h-8 w-full rounded mb-2"></div>
              <div className="bg-gray-100 h-8 w-full rounded"></div>
            </div>
          </div>
        );
    }
  };

  return (
    <Card>
      <div className="p-4">
        <div className="mb-4">
          <Text as="h2" variant="headingLg">{template.label}</Text>
        </div>
        <div className="mb-4 h-48 overflow-hidden">
          {getPreviewContent()}
        </div>
        <Divider />
        <Box paddingTop="4">
          <ButtonGroup>
            <Button
              primary={!isActive}
              disabled={isActive}
              onClick={() => onActivate(template.value)}
            >
              {isActive ? 'Active' : 'Activate'}
            </Button>
            <Button>Preview</Button>
          </ButtonGroup>
        </Box>
      </div>
    </Card>
  );
};

const TemplateGrid = ({ templates, activeTemplate, onActivate }) => {
  return (
    <Grid>
      {templates.map((template) => (
        <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 4, xl: 4 }} key={template.value}>
          <TemplatePreviewCard
            template={template}
            isActive={activeTemplate === template.value}
            onActivate={onActivate}
          />
        </Grid.Cell>
      ))}
    </Grid>
  );
};

export default TemplateGrid;
