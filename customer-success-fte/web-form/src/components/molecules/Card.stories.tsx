import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'Molecules/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    title: 'Customer Support',
    subtitle: 'Track your requests in real-time.',
    children: 'This is the main content area of the card.',
  },
};

export const WithFooter: Story = {
  args: {
    title: 'Update Required',
    children: 'Your payment for this month is pending.',
    footer: <div className="text-right"><button className="text-primary font-bold">Pay Now</button></div>,
  },
};
