import type { Meta, StoryObj } from '@storybook/react';
import { Nav } from '../organisms/Nav';

const meta: Meta<typeof Nav> = {
  title: 'Organisms/Nav',
  component: Nav,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Nav>;

export const SidebarNav: Story = {
  args: {
    items: [
      { label: 'Dashboard', href: '#', active: true },
      { label: 'Analytics', href: '#' },
      { label: 'Users', href: '#' },
      { label: 'Settings', href: '#' },
    ],
  },
};
