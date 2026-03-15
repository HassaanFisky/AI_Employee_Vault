import type { Meta, StoryObj } from '@storybook/react';
import { Topbar } from '../organisms/Topbar';

const meta: Meta<typeof Topbar> = {
  title: 'Organisms/Topbar',
  component: Topbar,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Topbar>;

export const Default: Story = {
  args: {
    title: 'Support Dashboard',
    user: {
      name: 'Alexander Pierce',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop',
      email: 'alex@techcorp.ai',
    },
  },
};
