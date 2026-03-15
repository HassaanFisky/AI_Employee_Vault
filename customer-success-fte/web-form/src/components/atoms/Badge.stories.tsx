import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Active',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    children: 'Critical',
  },
};
